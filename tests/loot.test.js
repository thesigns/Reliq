import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rollSearchLoot, rollCoin, rollKey, rollShard } from '../js/game/loot.js';
import { RULES, SYMBOLS } from '../js/game/rules.js';
import { COINS, JUNK, coinById } from '../js/game/items.js';
import { seededRandom, weighted } from '../js/core/rng.js';
import { seq } from './helpers.js';

test('loot kind boundaries: 65% junk, 35% coin', () => {
  assert.equal(rollSearchLoot(seq(0.0, 0)).type, 'junk');
  assert.equal(rollSearchLoot(seq(0.6499, 0)).type, 'junk');
  assert.equal(rollSearchLoot(seq(0.6501, 0, 0)).type, 'coin');
  assert.equal(rollSearchLoot(seq(0.9999, 0, 0)).type, 'coin');
});

test('junk is any of the ten items', () => {
  assert.equal(rollSearchLoot(seq(0.1, 0)).id, JUNK[0]);
  assert.equal(rollSearchLoot(seq(0.1, 0.9999)).id, JUNK[9]);
});

test('a key has three different symbols', () => {
  assert.deepEqual(rollKey(seq(0, 0, 0)), ['fish', 'spider', 'fly']);
  assert.deepEqual(rollKey(seq(0.9999, 0.9999, 0.9999)), ['snake', 'cat', 'man']);
  const rng = seededRandom(3);
  for (let i = 0; i < 500; i++) {
    const k = rollKey(rng);
    assert.equal(new Set(k).size, 3);
    assert.ok(k.every((x) => SYMBOLS.includes(x)));
  }
});

test('a shard shows a key symbol not found yet', () => {
  const key = ['fish', 'bird', 'fly'];
  assert.equal(rollShard(key, ['fish', 'fly'], seq(0.9)), 'bird');
  assert.equal(rollShard(key, [], seq(0.5)), 'bird');
  assert.equal(rollShard(key, key, seq(0)), null);
});

test('coin rarity boundaries 75/20/4/1', () => {
  const rarity = (r) => coinById(rollCoin(RULES.coinRarity, seq(r, 0))).rarity;
  assert.equal(rarity(0.7499), 'common');
  assert.equal(rarity(0.7501), 'uncommon');
  assert.equal(rarity(0.9499), 'uncommon');
  assert.equal(rarity(0.9501), 'rare');
  assert.equal(rarity(0.9899), 'rare');
  assert.equal(rarity(0.9901), 'legendary');
});

test('long-run distribution matches the GDD', () => {
  const rng = seededRandom(42);
  const n = 200000;
  const kinds = { junk: 0, coin: 0 };
  const rar = { common: 0, uncommon: 0, rare: 0, legendary: 0 };
  for (let i = 0; i < n; i++) {
    const l = rollSearchLoot(rng);
    kinds[l.type]++;
    if (l.type === 'coin') rar[coinById(l.id).rarity]++;
  }
  assert.ok(Math.abs(kinds.junk / n - 0.65) < 0.005);
  assert.ok(Math.abs(kinds.coin / n - 0.35) < 0.005);
  const coins = kinds.coin;
  assert.ok(Math.abs(rar.common / coins - 0.75) < 0.01);
  assert.ok(Math.abs(rar.uncommon / coins - 0.20) < 0.01);
  assert.ok(Math.abs(rar.rare / coins - 0.04) < 0.005);
  assert.ok(Math.abs(rar.legendary / coins - 0.01) < 0.003);
});

test('every rarity has coins and weighted() is total', () => {
  for (const r of Object.keys(RULES.coinRarity)) assert.ok(COINS.some((c) => c.rarity === r));
  assert.equal(weighted({ a: 1, b: 1 }, () => 0.999999), 'b');
});
