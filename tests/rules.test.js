import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RULES, SYMBOLS, TIERS, MISSIONS, FENCE_PRICES, missionDef } from '../js/game/rules.js';
import { readFileSync } from 'node:fs';
import { ARTIFACTS } from '../js/game/items.js';

const DAY = 24 * 3600e3;

test('tiers match docs/lista-misji.md', () => {
  const table = [
    ['wood', 2, 4, 25], ['copper', 3, 6, 40], ['bronze', 4, 8, 50], ['iron', 5, 11, 65],
    ['silver', 7, 13, 85], ['gold', 9, 18, 110], ['platinum', 12, 24, 150], ['diamond', 16, 32, 200],
  ];
  assert.deepEqual(TIERS, table.map(([id, symbolSearches, tombSearches, price]) => ({ id, symbolSearches, tombSearches, price })));
  const total = (t) => RULES.keyLength * t.symbolSearches + t.tombSearches;
  for (const [i, t] of TIERS.entries()) {
    // A mission a week, three to a tier: past the first steps, under 10% more walking a week.
    if (i >= 2) assert.ok(total(t) / total(TIERS[i - 1]) <= 1.1 ** 3 + 0.005, `${t.id}: grows at most a third on the last tier`);
    // About two missions' worth of coins (some 1.24 a search) buys a lost artifact back.
    assert.ok(t.price % 5 === 0 && Math.abs(t.price - 2.5 * total(t)) <= 2.5, `${t.id}: 2.5 a search, to a nearest 5`);
  }
});

// The missions in the game are the list's entries whose model is marked ready, in its order.
function readyMissions() {
  const TIER_IDS = { Drewniany: 'wood', Miedziany: 'copper', Brązowy: 'bronze', Żelazny: 'iron', Srebrny: 'silver', Złoty: 'gold', Platynowy: 'platinum', Diamentowy: 'diamond' };
  const doc = readFileSync(new URL('../docs/lista-misji.md', import.meta.url), 'utf8');
  const out = [];
  let tier = null;
  for (const line of doc.split('\n')) {
    const h = /^## (\S+)\s*$/.exec(line);
    if (h) tier = TIER_IDS[h[1]] ?? null;
    const m = /^Model: (\w+)\.js \(gotowy\)/.exec(line);
    if (m && tier) out.push({ artifact: m[1], tier });
  }
  return out;
}

test('missions match docs/lista-misji.md', () => {
  assert.deepEqual(MISSIONS, readyMissions());
  for (const m of MISSIONS) assert.ok(ARTIFACTS.includes(m.artifact), m.artifact);
  assert.equal(new Set(MISSIONS.map((m) => m.artifact)).size, MISSIONS.length, 'one mission per artifact');
  assert.deepEqual(missionDef('cup'), { artifact: 'cup', tier: 'copper', rank: 1, symbolSearches: 3, tombSearches: 6, price: 40 });
  assert.equal(missionDef('chalice').rank, 3);
  assert.equal(missionDef('comb').tier, 'wood');
  assert.equal(missionDef('skull'), null);
});

test('mission timing, gate key and symbols', () => {
  assert.equal(RULES.missionTtlMs, 10 * DAY);
  assert.equal(SYMBOLS.length, 8);
  assert.equal(new Set(SYMBOLS).size, 8);
  assert.equal(RULES.keyLength, 3);
  assert.equal(RULES.gateRadius, 100);
});

test('fence prices per rarity', () => {
  assert.deepEqual(FENCE_PRICES, { common: 1, uncommon: 5, rare: 20, legendary: 100 });
});

test('odds tables sum to 1', () => {
  for (const table of [RULES.loot, RULES.coinRarity]) {
    const sum = Object.values(table).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 1) < 1e-9);
  }
});
