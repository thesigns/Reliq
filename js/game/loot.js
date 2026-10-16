// What a search yields, per the GDD odds, and the random parts of a tomb key.

import { RULES, SYMBOLS } from './rules.js';
import { JUNK, COINS } from './items.js';
import { pick, weighted } from '../core/rng.js';

export function rollCoin(rarityTable, rng) {
  const rarity = weighted(rarityTable, rng);
  return pick(COINS.filter((c) => c.rarity === rarity), rng).id;
}

// The ordinary find: junk or a coin. Tombs and shards are decided by the game first.
export function rollSearchLoot(rng) {
  const kind = weighted(RULES.loot, rng);
  if (kind === 'junk') return { type: 'junk', id: pick(JUNK, rng) };
  return { type: 'coin', id: rollCoin(RULES.coinRarity, rng) };
}

// A tomb key: keyLength different symbols in order (outer ring first).
export function rollKey(rng) {
  const left = [...SYMBOLS];
  const key = [];
  while (key.length < RULES.keyLength) key.push(left.splice(Math.min(left.length - 1, Math.floor(rng() * left.length)), 1)[0]);
  return key;
}

// The next shard always shows a key symbol the player does not have yet.
export function rollShard(key, shards, rng) {
  const left = key.filter((s) => !shards.includes(s));
  return left.length ? pick(left, rng) : null;
}
