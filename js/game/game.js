// Game rules applied to the save state. No DOM: time, GPS fixes and randomness come in
// as arguments, so everything here is unit-tested in Node.
//
// fix    = { lat, lon, acc }            latest GPS reading
// motion = { ready, speedKmh }          from LocationTracker

import { LocalFrame } from '../core/geo.js';
import { cryptoRandom } from '../core/rng.js';
import { RULES, FENCE_PRICES, MISSIONS, missionDef } from './rules.js';
import { isInsideSearched } from './field.js';
import { coinById } from './items.js';
import { rollSearchLoot, rollKey, rollShard } from './loot.js';

// A mission's place in this game's shuffle of its tier: a hash of the seed and the artifact.
function shuffleKey(seed, artifact) {
  let h = (seed ^ 0x811c9dc5) >>> 0;
  for (let i = 0; i < artifact.length; i++) h = Math.imul(h ^ artifact.charCodeAt(i), 0x01000193) >>> 0;
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d) >>> 0; h ^= h >>> 12;
  return h >>> 0;
}


export class Game {
  constructor(state, { rng = cryptoRandom, onChange = () => {} } = {}) {
    this.state = state;
    this.rng = rng;
    this.onChange = onChange;
    this._frame = null;
  }

  changed() { this.onChange(this.state); }

  get frame() {
    const v = this.state.vault;
    if (!v) return null;
    if (!this._frame || this._frame.lat0 !== v.lat || this._frame.lon0 !== v.lon) this._frame = new LocalFrame(v.lat, v.lon);
    return this._frame;
  }

  toLocal(p) { return this.frame.toLocal(p.lat, p.lon); }

  // ---- searched areas ----

  activeSearches(now) {
    return this.state.searches.filter((s) => now - s.t < RULES.searchTtlMs);
  }

  // Drops expired areas and ends a mission past its time limit.
  // Returns true if anything changed.
  prune(now) {
    const s = this.state;
    const nS = s.searches.length;
    s.searches = this.activeSearches(now);
    let dirty = s.searches.length !== nS;
    if (s.mission && now >= this.deadline()) { this.loseMission(this.deadline()); dirty = true; }
    if (dirty) this.changed();
    return dirty;
  }

  isSearched(local, now) {
    return isInsideSearched(local.x, local.y, this.activeSearches(now).map((s) => this.toLocal(s)));
  }

  // Why "Search for treasure" is or isn't available right now.
  searchStatus(fix, motion, now) {
    if (!this.state.vault) return { code: 'noVault' };
    if (!fix || !motion?.ready) return { code: 'locating' };
    if (fix.acc > RULES.maxAccuracyM) return { code: 'gps', acc: Math.round(fix.acc) };
    if (motion.speedKmh > RULES.maxSpeedKmh) return { code: 'fast', speed: Math.ceil(motion.speedKmh) };
    const p = this.toLocal(fix);
    if (Math.hypot(p.x, p.y) < RULES.vaultRadius) return { code: 'vault' };
    if (this.isSearched(p, now)) return { code: 'searched' };
    return { code: 'ready' };
  }

  createVault(fix, now) {
    if (this.state.vault) return { ok: false, reason: 'exists' };
    if (!fix || fix.acc > RULES.maxAccuracyM) return { ok: false, reason: 'gps' };
    this.state.vault = { lat: fix.lat, lon: fix.lon, t: now };
    this.state.seed = Math.floor(this.rng() * 4294967296) >>> 0;
    this._frame = null;
    this.changed();
    return { ok: true };
  }

  search(fix, motion, now, { forceLoot } = {}) {
    const status = this.searchStatus(fix, motion, now);
    if (status.code !== 'ready') return { ok: false, status };
    this.prune(now);
    // The stage is judged before this search's own area counts.
    const check = this.missionCheck(fix, now);
    const area = { lat: fix.lat, lon: fix.lon, t: now };
    this.state.searches.push(area);
    const loot = this.rollLoot(fix, now, check, forceLoot);
    this.changed();
    return { ok: true, area, loot };
  }

  // A mission's stage pays out once the player is far enough from the stage's start: a
  // key shard for each of the first walks, then the tomb. Otherwise the ordinary junk-or-
  // coin roll. forceLoot (debug only) picks the outcome; a forced shard or tomb skips the
  // distance and the gap between stages but still needs an active mission at that stage.
  rollLoot(fix, now, check, forced) {
    const f = forced?.type;
    if (check.stage === 'symbol' && (f === 'shard' || (!f && check.ok))) return this.addShard(now);
    if (check.stage === 'tomb' && (f === 'tomb' || (!f && check.ok))) return this.discoverTomb(fix, now);
    const loot = f === 'junk' || f === 'coin' ? forced : rollSearchLoot(this.rng);
    return loot.type === 'coin' ? this.addCoin(loot.id) : loot;
  }

  // Finds ride in the satchel until the player is back at the vault.
  addCoin(id) {
    const bag = this.state.satchel.coins;
    bag[id] = (bag[id] ?? 0) + 1;
    return { type: 'coin', id, rarity: coinById(id).rarity };
  }

  // ---- the satchel and the vault ----

  satchelCount() {
    const bag = this.state.satchel;
    return Object.values(bag.coins).reduce((a, b) => a + b, 0) + bag.artifacts.length;
  }

  // Close enough to the vault to store the satchel. The GPS limit is looser than for
  // searching: the vault is usually home, and the signal indoors is poorer.
  depositCheck(fix) {
    if (!this.state.vault || !fix) return { distance: null, ok: false };
    const p = this.toLocal(fix);
    const distance = Math.hypot(p.x, p.y);
    const ok = this.satchelCount() > 0 && fix.acc <= RULES.depositMaxAccuracyM && distance <= RULES.vaultRadius;
    return { distance, ok };
  }

  // Empties the satchel into the vault. coins: [{ id, count, rarity }], commonest
  // first so the rarest land last.
  deposit(fix) {
    if (!this.depositCheck(fix).ok) return { ok: false };
    const s = this.state, bag = s.satchel;
    const order = ['common', 'uncommon', 'rare', 'legendary'];
    const coins = Object.entries(bag.coins)
      .map(([id, count]) => ({ id, count, rarity: coinById(id).rarity }))
      .sort((a, b) => order.indexOf(a.rarity) - order.indexOf(b.rarity));
    for (const c of coins) s.coins[c.id] = (s.coins[c.id] ?? 0) + c.count;
    const artifacts = bag.artifacts;
    s.artifacts.push(...artifacts);
    s.satchel = { coins: {}, artifacts: [] };
    this.changed();
    return { ok: true, coins, artifacts };
  }

  // ---- missions, tombs and gates ----

  // The next mission: of those neither won nor lost, the lowest tier first, and within a
  // tier this game's own shuffle (fixed by the seed, so it stays put between visits; a
  // mission added later just slots in). null once there are none left.
  nextMission() {
    const s = this.state;
    const done = new Set([...s.artifacts.map((a) => a.id), ...s.satchel.artifacts.map((a) => a.id), ...s.lost.map((l) => l.artifact)]);
    if (s.mission) done.add(s.mission.artifact);
    const open = MISSIONS.filter((m) => !done.has(m.artifact)).map((m) => missionDef(m.artifact));
    open.sort((a, b) => a.rank - b.rank || shuffleKey(s.seed, a.artifact) - shuffleKey(s.seed, b.artifact));
    return open[0] ?? null;
  }

  // Missions are numbered in the order they are played: Mission I is the first one started.
  nextNumber() {
    const s = this.state;
    const used = [...s.tombs, ...s.lost, ...s.artifacts, ...s.satchel.artifacts].map((x) => x.n);
    if (s.mission) used.push(s.mission.n);
    return Math.max(0, ...used) + 1;
  }

  // What the mission card shows while no mission is active: the next mission, or
  // { done: true } once there are none left. Artifacts still in the satchel do not hold it up.
  missionOffer() {
    if (this.state.mission) return null;
    const def = this.nextMission();
    if (!def) return { done: true };
    return { ...def, n: this.nextNumber() };
  }

  // Starting clears the searched areas, as if 6 hours had passed, and starts the clock.
  startMission(now) {
    const def = this.state.vault && !this.state.mission ? this.nextMission() : null;
    if (!def) return { ok: false };
    const n = this.nextNumber();
    this.state.searches = [];
    this.state.mission = { n, artifact: def.artifact, t: now, key: rollKey(this.rng), shards: [], stageAt: now };
    this.changed();
    return { ok: true, n, artifact: def.artifact };
  }

  abandonMission(now) {
    if (!this.state.mission) return { ok: false };
    const n = this.state.mission.n;
    this.loseMission(now);
    this.changed();
    return { ok: true, n };
  }

  // The mission and its tomb are gone; the artifact goes to the fence.
  loseMission(t) {
    const { n, artifact } = this.state.mission;
    this.state.tombs = this.state.tombs.filter((tb) => tb.n !== n || tb.opened);
    this.state.lost.push({ n, artifact, t });
    this.state.mission = null;
  }

  deadline() { return this.state.mission.t + RULES.missionTtlMs; }

  // The active mission's tomb once discovered; it stays closed until the gate is opened.
  closedTomb() {
    const m = this.state.mission;
    return m ? this.state.tombs.find((tb) => tb.n === m.n && !tb.opened) ?? null : null;
  }

  // Where the current stage's walk counts from: its oldest search still on the map. The
  // first search of a stage starts it; when that area expires the next oldest takes over.
  stageStart(now) {
    const m = this.state.mission;
    if (!m) return null;
    let start = null;
    for (const s of this.activeSearches(now)) if (s.t >= m.stageAt && (!start || s.t < start.t)) start = s;
    return start;
  }

  // Live state of the active mission. stage: 'symbol' (a shard per walk), 'tomb' (the
  // last walk) or 'gate' (tomb found, gate closed). ok: a search here now pays out the stage.
  missionCheck(fix, now) {
    const m = this.state.mission;
    if (!m || !this.state.vault) return { active: false };
    const def = missionDef(m.artifact);
    const base = { active: true, n: m.n, def, shards: m.shards, keyLength: m.key.length, deadline: this.deadline(), timeLeft: this.deadline() - now };
    const tomb = this.closedTomb();
    if (tomb) return { ...base, stage: 'gate', tomb, gate: this.gateCheck(fix), ok: false };
    const stage = m.shards.length < m.key.length ? 'symbol' : 'tomb';
    const need = stage === 'symbol' ? def.symbolDistance : def.tombDistance;
    const start = this.stageStart(now);
    const p = fix ? this.toLocal(fix) : null;
    let distance = null;
    if (p && start) { const q = this.toLocal(start); distance = Math.hypot(p.x - q.x, p.y - q.y); }
    return { ...base, stage, need, start, distance, ok: distance !== null && distance >= need };
  }

  // Each shard shows a key symbol the player does not have yet. The next stage starts at
  // once, from this very search: next is how far the player has to walk on from here.
  addShard(now) {
    const m = this.state.mission;
    const def = missionDef(m.artifact);
    const symbol = rollShard(m.key, m.shards, this.rng);
    m.shards.push(symbol);
    m.stageAt = now;
    const next = m.shards.length < m.key.length ? def.symbolDistance : def.tombDistance;
    return { type: 'shard', symbol, n: m.n, have: m.shards.length, of: m.key.length, next };
  }

  // The tomb appears exactly where the player searched.
  discoverTomb(fix, now) {
    const { n, artifact } = this.state.mission;
    const tomb = { n, lat: fix.lat, lon: fix.lon, t: now, opened: false, artifact };
    this.state.tombs.push(tomb);
    return { type: 'tomb', tomb };
  }

  // The gate opens on site only.
  gateCheck(fix) {
    const tomb = this.closedTomb();
    if (!tomb || !fix) return { distance: null, ok: false };
    const p = this.toLocal(fix), q = this.toLocal(tomb);
    const distance = Math.hypot(p.x - q.x, p.y - q.y);
    return { distance, ok: distance <= RULES.gateRadius };
  }

  // combo: the symbols at the marker, outer ring first. A wrong combination costs nothing.
  // Opening the gate wins the mission: the artifact goes into the satchel.
  openGate(fix, combo, now) {
    this.prune(now);
    const tomb = this.closedTomb();
    if (!tomb) return { ok: false, reason: 'noTomb' };
    if (!this.gateCheck(fix).ok) return { ok: false, reason: 'far' };
    const key = this.state.mission.key;
    if (combo.length !== key.length || combo.some((sym, i) => sym !== key[i])) return { ok: false, reason: 'wrong' };
    tomb.opened = true;
    this.state.satchel.artifacts.push({ id: tomb.artifact, n: tomb.n, t: now, from: 'tomb' });
    this.state.mission = null;
    this.changed();
    return { ok: true, tomb };
  }

  // ---- the fence ----

  coinPrice(id) { return FENCE_PRICES[coinById(id).rarity]; }

  // Coins are sold one at a time; the last one leaves the collection.
  sellCoin(id) {
    const have = this.state.coins[id] ?? 0;
    if (!(have > 0)) return { ok: false };
    const price = this.coinPrice(id);
    if (have > 1) this.state.coins[id] = have - 1;
    else delete this.state.coins[id];
    this.state.money += price;
    this.changed();
    return { ok: true, id, price, money: this.state.money };
  }

  // Artifacts of lost missions not bought back yet. ok: there is money enough. The price is its tier's.
  fenceOffers() {
    const bought = new Set(this.state.artifacts.filter((a) => a.from === 'fence').map((a) => a.n));
    return this.state.lost.filter((l) => !bought.has(l.n)).map(({ n, artifact }) => {
      const { price } = missionDef(artifact);
      return { n, artifact, price, ok: this.state.money >= price };
    });
  }

  buyArtifact(n, now) {
    const offer = this.fenceOffers().find((o) => o.n === n);
    if (!offer?.ok) return { ok: false, offer };
    this.state.money -= offer.price;
    // The mission stays lost in the notebook; only its artifact comes home.
    this.state.artifacts.push({ id: offer.artifact, n, t: now, from: 'fence' });
    this.changed();
    return { ok: true, artifact: offer.artifact };
  }

}
