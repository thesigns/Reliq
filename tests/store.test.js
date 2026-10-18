import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Store, SAVE_KEY } from '../js/core/store.js';
import { createState, migrate, upgrade, SAVE_VERSION, OLDEST_SAVE_VERSION, MIGRATIONS } from '../js/game/state.js';

function fakeStorage(initial = {}) {
  const m = new Map(Object.entries(initial));
  return {
    map: m,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
  };
}

const MISSION = { n: 2, artifact: 'vase', t: 7, key: ['cat', 'fly', 'man'], shards: ['fly'], dug: 4 };

test('empty storage gives a fresh state', () => {
  const s = new Store(fakeStorage()).load(123);
  assert.deepEqual(s, createState(123));
});

test('save and load round-trip', () => {
  const storage = fakeStorage();
  const store = new Store(storage);
  const s = createState(1);
  s.vault = { lat: 52.2, lon: 21.0, t: 5 };
  s.seed = 123456789;
  s.searches.push({ lat: 52.21, lon: 21.01, t: 6 });
  s.coins = { nummus: 3, eidmar: 1 };
  s.money = 42;
  s.mission = { ...MISSION };
  s.tombs.push({ n: 1, lat: 52.22, lon: 21.02, t: 8, opened: true, artifact: 'cup' });
  s.tombs.push({ n: 2, lat: 52.23, lon: 21.03, t: 9, opened: false, artifact: 'vase' });
  s.artifacts.push({ id: 'cup', n: 1, t: 10, from: 'tomb' });
  s.lost.push({ n: 3, artifact: 'chalice', t: 11 });
  s.satchel = { coins: { ducat: 2 }, artifacts: [{ id: 'vase', n: 2, t: 12, from: 'tomb' }] };
  s.settings.lang = 'en';
  assert.equal(store.save(s), true);
  assert.deepEqual(store.load(99), s);
});

test('unreadable saves are backed up, not lost', () => {
  const storage = fakeStorage({ [SAVE_KEY]: '{not json' });
  const s = new Store(storage).load(5);
  assert.deepEqual(s, createState(5));
  assert.equal(storage.map.get(`${SAVE_KEY}.unreadable`), '{not json');
});

test('saves from before tiers start over', () => {
  for (const v of [1, 2, 3]) {
    const raw = JSON.stringify({ v, coins: { nummus: 3 }, tombMap: { n: 1, t: 1 } });
    const storage = fakeStorage({ [SAVE_KEY]: raw });
    assert.deepEqual(new Store(storage).load(5), createState(5), `v${v}`);
    assert.equal(storage.map.get(`${SAVE_KEY}.unreadable`), raw, 'kept aside');
  }
});

test('unknown versions are rejected', () => {
  assert.equal(migrate({ v: SAVE_VERSION + 1 }, 0), null);
  assert.equal(migrate(null, 0), null);
});

test('migrate drops malformed entries', () => {
  const s = migrate({
    v: SAVE_VERSION,
    vault: { lat: 'x', lon: 1, t: 1 },
    searches: [{ lat: 1, lon: 2, t: 3 }, { lat: 1 }, null],
    coins: { nummus: 2, bad: -1, worse: 1.5 },
    money: -5,
    seed: -4,
    mission: { n: 9, artifact: 'skull', t: 1, key: ['cat', 'fly', 'man'], shards: [], dug: 0 },
    tombs: [{ n: 1, lat: 1, lon: 2, t: 3, opened: true, artifact: 'cup' }, { n: 2, lat: 1, lon: 2, t: 3 }, { n: 3, lat: 1, lon: 2, t: 3, opened: true, artifact: 'skull' }],
    artifacts: [{ id: 'cup', n: 1, t: 3, from: 'tomb' }, { id: 'cup', n: 1, t: 3, from: 'gift' }, { id: 'skull', n: 4, t: 3, from: 'tomb' }],
    lost: [{ n: 2, artifact: 'vase', t: 3 }, { n: 99, artifact: 'skull', t: 3 }, { n: 3, artifact: 'cup' }, { n: 4, t: 3 }],
    settings: { lang: 'de', sound: false },
  }, 0);
  assert.equal(s.vault, null);
  assert.deepEqual(s.searches, [{ lat: 1, lon: 2, t: 3 }]);
  assert.deepEqual(s.coins, { nummus: 2 });
  assert.equal(s.money, 0);
  assert.equal(s.seed, 0);
  assert.equal(s.mission, null, 'no such mission');
  assert.deepEqual(s.tombs, [{ n: 1, lat: 1, lon: 2, t: 3, opened: true, artifact: 'cup' }]);
  assert.deepEqual(s.artifacts, [{ id: 'cup', n: 1, t: 3, from: 'tomb' }]);
  assert.deepEqual(s.lost, [{ n: 2, artifact: 'vase', t: 3 }]);
  assert.deepEqual(s.settings, { lang: null, sound: false, haptics: true, keepAwake: true, quality: 'full' });
});

test('an artifact keeps how many details were found, 1 to 3', () => {
  const art = (examined) => ({ id: 'cup', n: 1, t: 3, from: 'tomb', examined });
  const load = (examined) => migrate({ v: SAVE_VERSION, artifacts: [art(examined)] }, 0).artifacts[0];
  assert.equal(load(2).examined, 2);
  assert.equal(load(9).examined, 3);
  for (const bad of [0, -1, 1.5, 'x', undefined]) assert.equal('examined' in load(bad), false, String(bad));
});

test('a mission needs a valid key; foreign and repeated shards are dropped', () => {
  const broken = migrate({ v: SAVE_VERSION, mission: { ...MISSION, key: ['fish', 'fish', 'cat'] } }, 0);
  assert.equal(broken.mission, null);
  const s = migrate({ v: SAVE_VERSION, mission: { ...MISSION, shards: ['man', 'man', 'dog'] } }, 0);
  assert.deepEqual(s.mission, { ...MISSION, shards: ['man'] });
});

test('a mission saved with a stage start counts the stage\'s searches still on the map', () => {
  const { dug, ...rest } = MISSION;
  const searches = [5, 8, 9].map((t) => ({ lat: 52, lon: 21, t }));
  assert.equal(migrate({ v: SAVE_VERSION, searches, mission: { ...rest, stageAt: 8 } }, 0).mission.dug, 2);
  assert.equal(migrate({ v: SAVE_VERSION, mission: rest }, 0).mission.dug, 0);
  assert.equal(migrate({ v: SAVE_VERSION, mission: { ...MISSION, dug: -1 } }, 0).mission.dug, 0);
});

test('a closed tomb survives only with its mission', () => {
  const tomb = { n: 2, lat: 1, lon: 2, t: 3, opened: false, artifact: 'vase' };
  assert.deepEqual(migrate({ v: SAVE_VERSION, tombs: [tomb] }, 0).tombs, []);
  assert.deepEqual(migrate({ v: SAVE_VERSION, mission: MISSION, tombs: [tomb] }, 0).tombs, [tomb]);
});

test('a broken satchel keeps only valid finds', () => {
  const s = migrate({ v: SAVE_VERSION, satchel: { coins: { ducat: 2, bad: 0, worse: 'x' }, artifacts: [{ id: 'cup', n: 1, t: 3, from: 'tomb' }, { id: 'skull', n: 1, t: 3, from: 'tomb' }] } }, 0);
  assert.deepEqual(s.satchel, { coins: { ducat: 2 }, artifacts: [{ id: 'cup', n: 1, t: 3, from: 'tomb' }] });
  assert.deepEqual(migrate({ v: SAVE_VERSION }, 0).satchel, { coins: {}, artifacts: [] }, 'saves from before the satchel');
});

test('settings saved before new options existed get defaults', () => {
  const s = migrate({ v: SAVE_VERSION, settings: { lang: 'pl', quality: 'ultra', keepAwake: false } }, 0);
  assert.deepEqual(s.settings, { lang: 'pl', sound: true, haptics: true, keepAwake: false, quality: 'full' });
});

test('storage that throws never breaks the game', () => {
  const broken = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('full'); }, removeItem() {} };
  const store = new Store(broken);
  assert.deepEqual(store.load(1), createState(1));
  assert.equal(store.save(createState(1)), false);
});

test('every save version the game still reads has an upgrade step', () => {
  for (let v = OLDEST_SAVE_VERSION; v < SAVE_VERSION; v++) {
    assert.equal(typeof MIGRATIONS[v], 'function', `MIGRATIONS[${v}] is missing: add it, or raise OLDEST_SAVE_VERSION to drop v${v} saves`);
  }
});

test('upgrade runs the steps in order and leaves the input alone', () => {
  const steps = {
    1: (raw) => ({ ...raw, log: [...raw.log, 'a'] }),
    2: (raw) => ({ ...raw, log: [...raw.log, 'b'], gone: undefined }),
  };
  const raw = { v: 1, log: [], gone: 1 };
  assert.deepEqual(upgrade(raw, steps, 3, 1), { v: 3, log: ['a', 'b'], gone: undefined });
  assert.deepEqual(raw, { v: 1, log: [], gone: 1 });
  assert.deepEqual(upgrade({ v: 3, log: [] }, steps, 3, 1), { v: 3, log: [] }, 'already current');
});

test('upgrade refuses what it cannot bring up to date', () => {
  const steps = { 2: (raw) => raw };
  assert.equal(upgrade({ v: 1 }, steps, 3, 1), null, 'a missing step');
  assert.equal(upgrade({ v: 4 }, steps, 3, 1), null, 'from a newer game');
  assert.equal(upgrade({ v: 1 }, steps, 3, 2), null, 'older than the oldest');
  assert.equal(upgrade({ v: '3' }, steps, 3, 1), null);
  assert.equal(upgrade(null, steps, 3, 1), null);
});

test('an upgraded save is kept as it was', () => {
  const oldV = SAVE_VERSION - 1;
  const steps = { oldest: oldV, migrations: { [oldV]: (raw) => ({ ...raw, money: raw.cash }) } };
  const raw = JSON.stringify({ v: oldV, cash: 7 });
  const storage = fakeStorage({ [SAVE_KEY]: raw });
  const s = new Store(storage, steps).load(5);
  assert.equal(s.money, 7);
  assert.equal(storage.map.get(`${SAVE_KEY}.v${oldV}`), raw);
  assert.equal(storage.map.has(`${SAVE_KEY}.unreadable`), false);
});
