import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RULES, SYMBOLS, TIERS, MISSIONS, FENCE_PRICES, missionDef } from '../js/game/rules.js';
import { readFileSync } from 'node:fs';
import { ARTIFACTS } from '../js/game/items.js';

const DAY = 24 * 3600e3;

test('tiers match docs/lista-misji.md', () => {
  const table = [
    ['wood', 200, 400, 20], ['copper', 300, 600, 30], ['bronze', 500, 1000, 50], ['iron', 800, 1600, 80],
    ['silver', 1200, 2400, 120], ['gold', 1700, 3400, 170], ['platinum', 2300, 4600, 230], ['diamond', 3000, 6000, 300],
  ];
  assert.deepEqual(TIERS, table.map(([id, symbolDistance, tombDistance, price]) => ({ id, symbolDistance, tombDistance, price })));
  for (const t of TIERS) {
    assert.equal(t.tombDistance, 2 * t.symbolDistance, `${t.id}: the tomb walk is twice a symbol walk`);
    assert.equal(t.price, t.symbolDistance / 10, `${t.id}: the fence asks a tenth of a symbol walk`);
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
  assert.deepEqual(missionDef('cup'), { artifact: 'cup', tier: 'copper', rank: 1, symbolDistance: 300, tombDistance: 600, price: 30 });
  assert.equal(missionDef('chalice').rank, 3);
  assert.equal(missionDef('comb').tier, 'wood');
  assert.equal(missionDef('skull'), null);
});

test('mission timing, gate key and symbols', () => {
  assert.equal(RULES.missionTtlMs, 7 * DAY);
  assert.equal(RULES.fenceDelayMs, 7 * DAY);
  assert.equal(SYMBOLS.length, 8);
  assert.equal(new Set(SYMBOLS).size, 8);
  assert.equal(RULES.keyLength, 3);
  assert.equal(RULES.gateRadius, 100);
  assert.equal(RULES.tombSeparation, 200);
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
