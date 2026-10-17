import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, fixAt, seq, READY, T0, HOUR, VAULT } from './helpers.js';
import { MISSIONS, missionDef } from '../js/game/rules.js';

const JUNK_ROLL = [0.1, 0];          // kind = junk, first junk item
const COIN_ROLL = [0.7, 0.1, 0];     // kind = coin, common, first common coin

test('no vault, no searching', () => {
  const { game } = newGame({ withVault: false });
  assert.equal(game.searchStatus(fixAt(300, 0), READY, T0).code, 'noVault');
});

test('creating the vault needs a usable GPS fix and happens once', () => {
  const { game, state } = newGame({ withVault: false });
  assert.deepEqual(game.createVault(fixAt(0, 0, 80), T0), { ok: false, reason: 'gps' });
  assert.deepEqual(game.createVault({ ...VAULT, acc: 10 }, T0), { ok: true });
  assert.equal(state.vault.lat, VAULT.lat);
  assert.deepEqual(game.createVault(fixAt(500, 0), T0), { ok: false, reason: 'exists' });
});

test('status checks run in a sensible order', () => {
  const { game } = newGame();
  assert.equal(game.searchStatus(null, READY, T0).code, 'locating');
  assert.equal(game.searchStatus(fixAt(300, 0), { ready: false, speedKmh: 0 }, T0).code, 'locating');
  assert.deepEqual(game.searchStatus(fixAt(300, 0, 51), READY, T0), { code: 'gps', acc: 51 });
  assert.equal(game.searchStatus(fixAt(300, 0, 50), READY, T0).code, 'ready');
  assert.deepEqual(game.searchStatus(fixAt(300, 0), { ready: true, speedKmh: 10.2 }, T0), { code: 'fast', speed: 11 });
  assert.equal(game.searchStatus(fixAt(300, 0), { ready: true, speedKmh: 10 }, T0).code, 'ready');
});

test('the vault blocks searching inside 100 m', () => {
  const { game } = newGame();
  assert.equal(game.searchStatus(fixAt(99, 0), READY, T0).code, 'vault');
  assert.equal(game.searchStatus(fixAt(0, 100.5), READY, T0).code, 'ready');
});

test('a search creates an area; searching again needs leaving it', () => {
  const { game, state } = newGame({ rng: seq(...JUNK_ROLL) });
  const r = game.search(fixAt(300, 0), READY, T0);
  assert.equal(r.ok, true);
  assert.equal(r.loot.type, 'junk');
  assert.equal(state.searches.length, 1);
  assert.equal(game.searchStatus(fixAt(360, 0), READY, T0 + 1000).code, 'searched');
  assert.equal(game.searchStatus(fixAt(401, 0), READY, T0 + 1000).code, 'ready');
  const again = game.search(fixAt(350, 0), READY, T0 + 1000);
  assert.equal(again.ok, false);
  assert.equal(again.status.code, 'searched');
});

test('junk is not kept, coins go into the satchel', () => {
  const { game, state } = newGame({ rng: seq(...JUNK_ROLL, ...COIN_ROLL, ...COIN_ROLL) });
  game.search(fixAt(300, 0), READY, T0);
  assert.deepEqual(state.satchel.coins, {});
  const c1 = game.search(fixAt(600, 0), READY, T0 + 1);
  assert.deepEqual(c1.loot, { type: 'coin', id: 'nummus', rarity: 'common' });
  game.search(fixAt(900, 0), READY, T0 + 2);
  assert.deepEqual(state.satchel.coins, { nummus: 2 });
  assert.deepEqual(state.coins, {}, 'nothing in the vault yet');
  assert.equal(game.satchelCount(), 2);
});

test('the satchel is stored at the vault, with a looser GPS limit', () => {
  const { game, state } = newGame();
  assert.equal(game.depositCheck(fixAt(10, 0)).ok, false, 'nothing to store');
  state.satchel.coins = { ducat: 1, nummus: 2, eidmar: 1 };
  state.satchel.artifacts = [{ id: 'cup', n: 1, t: T0, from: 'tomb' }, { id: 'vase', n: 2, t: T0 + 1, from: 'tomb' }];
  state.coins = { nummus: 1 };
  assert.equal(game.depositCheck(fixAt(101, 0)).ok, false, 'outside the vault');
  assert.equal(game.depositCheck(fixAt(60, 0, 101)).ok, false, 'GPS too vague');
  assert.equal(game.depositCheck(fixAt(60, 0, 90)).ok, true, 'poorer than a search allows, fine here');
  assert.equal(game.deposit(fixAt(200, 0)).ok, false);
  const r = game.deposit(fixAt(30, 0));
  assert.equal(r.ok, true);
  assert.deepEqual(r.coins.map((c) => [c.id, c.count]), [['nummus', 2], ['ducat', 1], ['eidmar', 1]], 'rarest last');
  assert.deepEqual(r.artifacts, [{ id: 'cup', n: 1, t: T0, from: 'tomb' }, { id: 'vase', n: 2, t: T0 + 1, from: 'tomb' }]);
  assert.deepEqual(state.coins, { nummus: 3, ducat: 1, eidmar: 1 });
  assert.deepEqual(state.artifacts, [{ id: 'cup', n: 1, t: T0, from: 'tomb' }, { id: 'vase', n: 2, t: T0 + 1, from: 'tomb' }]);
  assert.deepEqual(state.satchel, { coins: {}, artifacts: [] });
});

test('the next mission can start with artifacts still in the satchel', () => {
  const { game, state } = newGame();
  state.satchel.artifacts = [{ id: 'cup', n: 1, t: T0, from: 'tomb' }];
  const offer = game.missionOffer();
  assert.equal(offer.n, 2, 'the cup counts as won');
  assert.notEqual(offer.artifact, 'cup');
  const r = game.startMission(T0);
  assert.equal(r.ok, true);
  assert.equal(r.n, 2);
  assert.deepEqual(state.satchel.artifacts.map((a) => a.id), ['cup'], 'still carried');
});

test('searched areas expire after 6 hours', () => {
  const { game, state } = newGame({ rng: seq(...JUNK_ROLL) });
  game.search(fixAt(300, 0), READY, T0);
  assert.equal(game.activeSearches(T0 + 6 * HOUR - 1).length, 1);
  assert.equal(game.searchStatus(fixAt(300, 0), READY, T0 + 6 * HOUR - 1).code, 'searched');
  assert.equal(game.activeSearches(T0 + 6 * HOUR).length, 0);
  assert.equal(game.searchStatus(fixAt(300, 0), READY, T0 + 6 * HOUR).code, 'ready');
  assert.equal(game.prune(T0 + 6 * HOUR), true);
  assert.equal(state.searches.length, 0);
});

const DAY = 24 * HOUR;

// The cup's mission (copper tier) under way as Mission I, with a known key. Its walks:
// S to each symbol, TD to the tomb. rng: what the next rolls return.
const S = missionDef('cup').symbolDistance;
const TD = missionDef('cup').tombDistance;
function onMission({ rng = seq(...JUNK_ROLL), shards = [] } = {}) {
  const g = newGame({ rng });
  g.state.mission = { n: 1, artifact: 'cup', t: T0, key: ['fish', 'bird', 'fly'], shards, stageAt: T0 };
  return g;
}

test('missions are offered tier by tier, numbered in the order played, and run out', () => {
  const { game, state } = newGame();
  let rank = -1;
  for (let n = 1; n <= MISSIONS.length; n++) {
    const offer = game.missionOffer();
    assert.equal(offer.n, n);
    assert.ok(offer.rank >= rank, `${offer.artifact}: never an easier tier after a harder one`);
    rank = offer.rank;
    // Win or lose alternately: either way the mission is done.
    if (n % 2) state.artifacts.push({ id: offer.artifact, n, t: T0, from: 'tomb' });
    else state.lost.push({ n, artifact: offer.artifact, t: T0 });
  }
  assert.deepEqual(game.missionOffer(), { done: true });
});

test('within a tier each game has its own order, and it stays put', () => {
  const first = (seed) => {
    const { game, state } = newGame();
    state.seed = seed;
    return game.missionOffer().artifact;
  };
  const tier = missionDef(first(0)).tier;
  const ids = MISSIONS.filter((m) => m.tier === tier).map((m) => m.artifact);
  assert.ok(ids.length > 1, 'the easiest tier has a choice');
  const seen = new Set();
  for (let seed = 0; seed < 60; seed++) seen.add(first(seed));
  assert.ok(seen.size > 1, 'different games start differently');
  for (const id of seen) assert.ok(ids.includes(id), `${id} is in the easiest tier`);
  assert.equal(first(12345), first(12345));
});

test('placing the vault draws the seed of the shuffle', () => {
  const { game, state } = newGame({ withVault: false, rng: seq(0.5) });
  game.createVault(fixAt(0, 0), T0);
  assert.equal(state.seed, 2147483648);
});

test('a mission added later to an easier tier is offered next, to everyone', () => {
  const { game, state } = newGame();
  // Play on until the offer is past the easiest tier.
  let n = 0;
  while (game.missionOffer().rank === 0) {
    n++;
    state.artifacts.push({ id: game.missionOffer().artifact, n, t: T0, from: 'tomb' });
  }
  const before = game.missionOffer().artifact;
  MISSIONS.push({ artifact: 'spoon', tier: 'wood' });
  try {
    assert.deepEqual(game.missionOffer(), { ...missionDef('spoon'), n: n + 1 });
  } finally {
    MISSIONS.pop();
  }
  assert.equal(game.missionOffer().artifact, before);
});

test('starting a mission clears the areas and rolls a key', () => {
  const { game, state } = newGame({ rng: seq(0, 0, 0) });
  state.searches.push({ ...fixAt(300, 0), t: T0 - HOUR }, { ...fixAt(600, 0), t: T0 - 1 });
  const first = game.missionOffer().artifact;
  assert.deepEqual(game.startMission(T0), { ok: true, n: 1, artifact: first });
  assert.deepEqual(state.searches, []);
  assert.deepEqual(state.mission, { n: 1, artifact: first, t: T0, key: ['fish', 'spider', 'fly'], shards: [], stageAt: T0 });
  assert.equal(game.missionOffer(), null, 'no offer while a mission is active');
  assert.equal(game.startMission(T0).ok, false);
  assert.equal(newGame({ withVault: false }).game.startMission(T0).ok, false);
});

test('the first search of a stage only marks its start', () => {
  const { game } = onMission();
  const r = game.search(fixAt(300, 0), READY, T0 + 1);
  assert.equal(r.loot.type, 'junk');
  const c = game.missionCheck(fixAt(300, S + 1), T0 + 2);
  assert.equal(c.stage, 'symbol');
  assert.deepEqual(c.start, r.area);
  assert.ok(Math.abs(c.distance - (S + 1)) < 1e-6);
  assert.equal(c.ok, true);
});

test('a search far enough from the start gives a shard and starts the next stage there', () => {
  const { game, state } = onMission({ rng: seq(...JUNK_ROLL, ...JUNK_ROLL, 0.99) });
  game.search(fixAt(300, 0), READY, T0 + 1);
  assert.equal(game.search(fixAt(299 + S, 0), READY, T0 + 2).loot.type, 'junk', 'a metre short');
  const r = game.search(fixAt(300 + S, 300), READY, T0 + 3);
  assert.deepEqual(r.loot, { type: 'shard', symbol: 'fly', n: 1, have: 1, of: 3, next: S });
  assert.deepEqual(state.mission.shards, ['fly']);
  assert.deepEqual(state.satchel.coins, {}, 'the shard replaces the find');
  const c = game.missionCheck(fixAt(300 + S, 301 + S), T0 + 4);
  assert.deepEqual(c.start, r.area, 'no break: the next walk counts from the shard');
  assert.equal(c.ok, true);
});

test('the next stage counts from where the shard was found, not from earlier searches', () => {
  const { game } = onMission({ rng: seq(...JUNK_ROLL, 0, ...JUNK_ROLL, 0) });
  game.search(fixAt(300, 0), READY, T0);
  assert.equal(game.search(fixAt(301 + S, 0), READY, T0 + 1).loot.type, 'shard');
  assert.equal(game.search(fixAt(300 + 2 * S, 0), READY, T0 + 2).loot.type, 'junk', 'far from the first search, short of the shard');
  assert.equal(game.search(fixAt(301 + S, S + 1), READY, T0 + 3).loot.type, 'shard');
});

test('the last shard points to the tomb walk', () => {
  const { game } = onMission({ shards: ['fish', 'bird'], rng: seq(...JUNK_ROLL, 0) });
  game.search(fixAt(300, 0), READY, T0);
  const r = game.search(fixAt(301 + S, 0), READY, T0 + 1);
  assert.equal(r.loot.next, TD);
  assert.equal(game.missionCheck(fixAt(301 + S, TD + 1), T0 + 2).stage, 'tomb');
});

test('when the stage start expires, the next oldest search takes over', () => {
  const { game, state } = onMission();
  const a = { ...fixAt(300, 0), t: T0 };
  const b = { ...fixAt(300, 300), t: T0 + HOUR };
  state.searches.push(a, b);
  const there = fixAt(300, 299 - S);
  assert.deepEqual(game.missionCheck(there, T0 + 5 * HOUR).start, a);
  assert.equal(game.missionCheck(there, T0 + 5 * HOUR).ok, false);
  const later = game.missionCheck(there, T0 + 6 * HOUR);
  assert.deepEqual(later.start, b);
  assert.equal(later.ok, true);
});

test('after the third shard the last walk finds the tomb', () => {
  const { game, state } = onMission({ shards: ['fish', 'bird', 'fly'], rng: seq(...JUNK_ROLL, ...JUNK_ROLL) });
  game.search(fixAt(300, 0), READY, T0);
  assert.equal(game.missionCheck(fixAt(300 + TD, 0), T0).stage, 'tomb');
  assert.equal(game.search(fixAt(299 + TD, 0), READY, T0 + 1).loot.type, 'junk', 'a metre short');
  const fix = fixAt(300, TD + 1);
  const r = game.search(fix, READY, T0 + 2);
  assert.deepEqual(r.loot.tomb, { n: 1, lat: fix.lat, lon: fix.lon, t: T0 + 2, opened: false, artifact: 'cup' });
  assert.equal(state.searches.length, 3, 'the search still leaves an area');
  const c = game.missionCheck(fix, T0 + 3);
  assert.equal(c.stage, 'gate');
  assert.equal(c.gate.ok, true);
});

test('an opened tomb does not stand in the way of a new one', () => {
  const { game, state } = onMission({ shards: ['fish', 'bird', 'fly'] });
  state.tombs.push({ n: 2, ...fixAt(305 + TD, 0), t: T0, opened: true, artifact: 'vase' });
  state.searches.push({ ...fixAt(300, 0), t: T0 });
  assert.equal(game.missionCheck(fixAt(300 + TD, 0), T0).ok, true, '5 m from the old tomb');
  assert.equal(game.search(fixAt(300 + TD, 0), READY, T0 + 1).loot.type, 'tomb');
});

test('without a mission, searches give only junk and coins', () => {
  const { game } = newGame({ rng: seq(...JUNK_ROLL, ...JUNK_ROLL) });
  game.search(fixAt(300, 0), READY, T0);
  assert.equal(game.search(fixAt(2000, 0), READY, T0 + 1).loot.type, 'junk');
});

test('forced finds pick the outcome but respect the mission state', () => {
  const none = newGame({ rng: seq(...JUNK_ROLL) });
  assert.equal(none.game.search(fixAt(300, 0), READY, T0, { forceLoot: { type: 'shard' } }).loot.type, 'junk');
  const { game, state } = onMission({ rng: seq(0, 0, ...JUNK_ROLL, 0) });
  assert.equal(game.search(fixAt(300, 0), READY, T0, { forceLoot: { type: 'shard' } }).loot.type, 'shard', 'skips the distance');
  assert.equal(game.search(fixAt(700, 0), READY, T0 + 1, { forceLoot: { type: 'shard' } }).loot.type, 'shard', 'twice in a row');
  assert.equal(game.search(fixAt(1100, 0), READY, T0 + 2, { forceLoot: { type: 'tomb' } }).loot.type, 'junk', 'symbols first');
  game.search(fixAt(1500, 0), READY, T0 + 3, { forceLoot: { type: 'shard' } });
  assert.equal(game.search(fixAt(1900, 0), READY, T0 + 4, { forceLoot: { type: 'tomb' } }).loot.type, 'tomb');
  assert.equal(game.search(fixAt(2300, 0), READY, T0 + 5, { forceLoot: { type: 'coin', id: 'eidmar' } }).loot.id, 'eidmar');
  assert.equal(state.tombs.length, 1);
});

test('the gate opens on site with the right order and wins the artifact', () => {
  const { game, state } = onMission({ shards: ['fish', 'bird', 'fly'] });
  const tomb = { n: 1, ...fixAt(600, 0), t: T0, opened: false, artifact: 'cup' };
  state.tombs.push(tomb);
  assert.deepEqual(game.openGate(fixAt(800, 0), ['fish', 'bird', 'fly'], T0), { ok: false, reason: 'far' });
  assert.equal(game.gateCheck(fixAt(699, 0)).ok, true);
  assert.equal(game.gateCheck(fixAt(701, 0)).ok, false);
  assert.deepEqual(game.openGate(fixAt(650, 0), ['bird', 'fish', 'fly'], T0), { ok: false, reason: 'wrong' });
  const r = game.openGate(fixAt(650, 0), ['fish', 'bird', 'fly'], T0 + 5);
  assert.equal(r.ok, true);
  assert.equal(tomb.opened, true);
  assert.deepEqual(state.satchel.artifacts, [{ id: 'cup', n: 1, t: T0 + 5, from: 'tomb' }], 'carried home in the satchel');
  assert.deepEqual(state.artifacts, []);
  assert.equal(state.mission, null);
  assert.equal(game.missionOffer().n, 2);
  assert.deepEqual(game.openGate(fixAt(650, 0), ['fish', 'bird', 'fly'], T0 + 6), { ok: false, reason: 'noTomb' });
});

test('a mission is lost after 10 days, its tomb with it', () => {
  const { game, state } = onMission({ shards: ['fish', 'bird', 'fly'] });
  state.tombs.push({ n: 1, ...fixAt(600, 0), t: T0, opened: false, artifact: 'cup' });
  game.prune(T0 + 10 * DAY - 1);
  assert.ok(state.mission);
  assert.equal(game.openGate(fixAt(600, 0), ['fish', 'bird', 'fly'], T0 + 10 * DAY + 5).reason, 'noTomb', 'too late');
  assert.equal(state.mission, null);
  assert.deepEqual(state.tombs, []);
  assert.deepEqual(state.lost, [{ n: 1, artifact: 'cup', t: T0 + 10 * DAY }], 'lost at the deadline, not when noticed');
  assert.equal(game.missionOffer().n, 2, 'the next mission is offered at once');
});

test('abandoning a mission works like running out of time', () => {
  const { game, state } = onMission();
  assert.deepEqual(game.abandonMission(T0 + 5), { ok: true, n: 1 });
  assert.deepEqual(state.lost, [{ n: 1, artifact: 'cup', t: T0 + 5 }]);
  assert.equal(game.missionOffer().n, 2, 'the next one is Mission II');
  assert.notEqual(game.missionOffer().artifact, 'cup');
  assert.equal(game.abandonMission(T0 + 6).ok, false);
});

test('the fence buys coins one at a time', () => {
  const { game, state } = newGame();
  state.coins = { nummus: 2, eidmar: 1 };
  assert.deepEqual(game.sellCoin('nummus'), { ok: true, id: 'nummus', price: 1, money: 1 });
  assert.deepEqual(game.sellCoin('eidmar'), { ok: true, id: 'eidmar', price: 100, money: 101 });
  assert.deepEqual(state.coins, { nummus: 1 });
  assert.equal(game.sellCoin('ducat').ok, false);
  assert.deepEqual([game.coinPrice('denarius'), game.coinPrice('solidus')], [5, 20]);
});

test('a lost artifact is at the fence at once, at its tier\'s price', () => {
  const { game, state } = newGame();
  state.lost = [{ n: 2, artifact: 'vase', t: T0 }];
  state.money = 79;
  assert.deepEqual(game.fenceOffers(), [{ n: 2, artifact: 'vase', price: 80, ok: false }]);
  assert.equal(game.buyArtifact(2, T0 + 1).ok, false, 'not enough money');
  state.money = 80;
  assert.deepEqual(game.buyArtifact(2, T0 + 1), { ok: true, artifact: 'vase' });
  assert.equal(state.money, 0);
  assert.deepEqual(state.lost, [{ n: 2, artifact: 'vase', t: T0 }], 'the mission stays lost');
  assert.deepEqual(state.artifacts, [{ id: 'vase', n: 2, t: T0 + 1, from: 'fence' }]);
  assert.deepEqual(game.fenceOffers(), [], 'bought back once');
  assert.equal(game.buyArtifact(2, T0 + 1).ok, false);
});

test('every state change is reported for saving', () => {
  const { game, changes } = newGame({ rng: seq(...JUNK_ROLL) });
  const before = changes();
  game.search(fixAt(300, 0), READY, T0);
  assert.ok(changes() > before);
});
