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

const TRAIL_STEP_M = 10;
const TRAIL_MAX = 4000;
const TRAIL_GAP_M = 150;          // a longer jump starts a new stretch of route
const TRAIL_GAP_MS = 10 * 60e3;   // so does a long pause between points

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

  // Drops expired areas and old trail points, and ends a mission past its time limit.
  // Returns true if anything changed.
  prune(now) {
    const s = this.state;
    const nS = s.searches.length, nT = s.trail.length;
    s.searches = this.activeSearches(now);
    s.trail = s.trail.filter((p) => now - p.t < RULES.searchTtlMs);
    let dirty = s.searches.length !== nS || s.trail.length !== nT;
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

  // Finds ride in the satchel until the player is back at the vault. isNew: a coin never
  // seen before, neither in the vault nor in the satchel.
  addCoin(id) {
    const bag = this.state.satchel.coins;
    const isNew = !(this.state.coins[id] > 0) && !(bag[id] > 0);
    bag[id] = (bag[id] ?? 0) + 1;
    return { type: 'coin', id, rarity: coinById(id).rarity, isNew };
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

  // Empties the satchel into the vault. coins: [{ id, count, rarity, isNew }], commonest
  // first so the rarest land last; isNew: the vault had none before.
  deposit(fix) {
    if (!this.depositCheck(fix).ok) return { ok: false };
    const s = this.state, bag = s.satchel;
    const order = ['common', 'uncommon', 'rare', 'legendary'];
    const coins = Object.entries(bag.coins)
      .map(([id, count]) => ({ id, count, rarity: coinById(id).rarity, isNew: !(s.coins[id] > 0) }))
      .sort((a, b) => order.indexOf(a.rarity) - order.indexOf(b.rarity));
    for (const c of coins) s.coins[c.id] = (s.coins[c.id] ?? 0) + c.count;
    const artifacts = bag.artifacts;
    s.artifacts.push(...artifacts);
    s.satchel = { coins: {}, artifacts: [] };
    this.changed();
    return { ok: true, coins, artifacts };
  }

  // ---- missions, tombs and gates ----

  // The first mission neither won nor lost, or null after the last one.
  nextMission() {
    const s = this.state;
    const done = new Set([...s.artifacts, ...s.satchel.artifacts, ...s.lost].map((x) => x.n));
    return MISSIONS.find((m) => !done.has(m.n)) ?? null;
  }

  // What the mission card shows while no mission is active: the next mission, or
  // { done: true } once there are none left. carrying: the last mission's artifact is still
  // in the satchel, and the next expedition starts only once it is in the vault.
  missionOffer() {
    if (this.state.mission) return null;
    const def = this.nextMission();
    if (!def) return { done: true };
    const held = this.state.satchel.artifacts[0];
    return held ? { ...def, carrying: held.id } : def;
  }

  // Starting clears the searched areas, as if 6 hours had passed, and starts the clock.
  startMission(now) {
    if (this.state.satchel.artifacts.length) return { ok: false, reason: 'deposit' };
    const def = this.state.vault && !this.state.mission ? this.nextMission() : null;
    if (!def) return { ok: false };
    this.state.searches = [];
    this.state.mission = { n: def.n, t: now, key: rollKey(this.rng), shards: [], stageAt: now };
    this.changed();
    return { ok: true, n: def.n };
  }

  abandonMission(now) {
    if (!this.state.mission) return { ok: false };
    const n = this.state.mission.n;
    this.loseMission(now);
    this.changed();
    return { ok: true, n };
  }

  // The mission, its tomb and the artifact are gone; the fence gets the artifact later.
  loseMission(t) {
    const n = this.state.mission.n;
    this.state.tombs = this.state.tombs.filter((tb) => tb.n !== n || tb.opened);
    this.state.lost.push({ n, t });
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
    const def = missionDef(m.n);
    const base = { active: true, n: m.n, def, shards: m.shards, keyLength: m.key.length, deadline: this.deadline(), timeLeft: this.deadline() - now };
    const tomb = this.closedTomb();
    if (tomb) return { ...base, stage: 'gate', tomb, gate: this.gateCheck(fix), ok: false };
    const stage = m.shards.length < m.key.length ? 'symbol' : 'tomb';
    const need = stage === 'symbol' ? def.symbolDistance : def.tombDistance;
    const start = this.stageStart(now);
    const p = fix ? this.toLocal(fix) : null;
    let distance = null;
    if (p && start) { const q = this.toLocal(start); distance = Math.hypot(p.x - q.x, p.y - q.y); }
    let separated = true;
    if (stage === 'tomb' && p) {
      separated = this.state.tombs.every((tb) => { const q = this.toLocal(tb); return Math.hypot(p.x - q.x, p.y - q.y) >= RULES.tombSeparation; });
    }
    const far = distance !== null && distance >= need;
    return { ...base, stage, need, start, distance, separated, ok: far && separated };
  }

  // Each shard shows a key symbol the player does not have yet. The next stage starts at
  // once, from this very search: next is how far the player has to walk on from here.
  addShard(now) {
    const m = this.state.mission;
    const def = missionDef(m.n);
    const symbol = rollShard(m.key, m.shards, this.rng);
    m.shards.push(symbol);
    m.stageAt = now;
    const next = m.shards.length < m.key.length ? def.symbolDistance : def.tombDistance;
    return { type: 'shard', symbol, n: m.n, have: m.shards.length, of: m.key.length, next };
  }

  // The tomb appears exactly where the player searched.
  discoverTomb(fix, now) {
    const n = this.state.mission.n;
    const tomb = { n, lat: fix.lat, lon: fix.lon, t: now, opened: false, artifact: missionDef(n).artifact };
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

  // Artifacts of lost missions. Each is for sale from availableAt; ok: it can be bought now.
  fenceOffers(now) {
    return this.state.lost.map(({ n, t }) => {
      const def = missionDef(n);
      const availableAt = t + RULES.fenceDelayMs;
      return { n, artifact: def.artifact, price: def.price, availableAt, ok: now >= availableAt && this.state.money >= def.price };
    });
  }

  buyArtifact(n, now) {
    const offer = this.fenceOffers(now).find((o) => o.n === n);
    if (!offer?.ok) return { ok: false, offer };
    this.state.money -= offer.price;
    this.state.lost = this.state.lost.filter((l) => l.n !== n);
    this.state.artifacts.push({ id: offer.artifact, n, t: now, from: 'fence' });
    this.changed();
    return { ok: true, artifact: offer.artifact };
  }

  // ---- decorative route ----

  recordTrail(fix, now) {
    if (!fix || fix.acc > RULES.maxAccuracyM || !this.state.vault) return false;
    const trail = this.state.trail;
    const last = trail[trail.length - 1];
    let gap = false;
    if (last) {
      const a = this.toLocal(last), b = this.toLocal(fix);
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < TRAIL_STEP_M) return false;
      // Reopening the app somewhere else must not draw a straight line across the map.
      gap = d > TRAIL_GAP_M || now - last.t > TRAIL_GAP_MS;
    }
    trail.push(gap ? { lat: fix.lat, lon: fix.lon, t: now, gap: true } : { lat: fix.lat, lon: fix.lon, t: now });
    if (trail.length > TRAIL_MAX) trail.splice(0, trail.length - TRAIL_MAX);
    this.changed();
    return true;
  }
}
