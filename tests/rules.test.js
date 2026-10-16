import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RULES, SYMBOLS, MISSIONS, FENCE_PRICES, missionDef } from '../js/game/rules.js';
import { ARTIFACTS } from '../js/game/items.js';

const DAY = 24 * 3600e3;

test('missions match docs/lista-misji.md', () => {
  const table = [[1, 'cup', 400, 800, 40], [2, 'vase', 450, 900, 60], [3, 'chalice', 500, 1000, 80]];
  assert.equal(MISSIONS.length, table.length);
  for (const [n, artifact, symbolDistance, tombDistance, price] of table) {
    assert.deepEqual(missionDef(n), { n, artifact, symbolDistance, tombDistance, price }, `mission ${n}`);
    assert.ok(ARTIFACTS.includes(artifact));
  }
  assert.equal(new Set(MISSIONS.map((m) => m.artifact)).size, MISSIONS.length, 'one artifact per mission');
  assert.equal(missionDef(MISSIONS.length + 1), null);
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
