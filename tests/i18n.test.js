import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pl from '../js/i18n/pl.js';
import en from '../js/i18n/en.js';
import { COINS, JUNK, ARTIFACTS } from '../js/game/items.js';
import { SYMBOLS, MISSIONS } from '../js/game/rules.js';
import { MODELS } from '../js/render/models/index.js';
import { COIN_MODELS } from '../js/render/models/coins.js';

const root = fileURLToPath(new URL('..', import.meta.url));

function sources(dir) {
  const out = [];
  for (const name of readdirSync(join(root, dir))) {
    const rel = join(dir, name);
    if (statSync(join(root, rel)).isDirectory()) out.push(...sources(rel));
    else if (name.endsWith('.js') && !rel.includes('i18n')) out.push(readFileSync(join(root, rel), 'utf8'));
  }
  return out;
}

test('Polish and English have the same keys', () => {
  const a = Object.keys(pl).sort(), b = Object.keys(en).sort();
  assert.deepEqual(a.filter((k) => !b.includes(k)), [], 'missing in en');
  assert.deepEqual(b.filter((k) => !a.includes(k)), [], 'missing in pl');
});

test('placeholders match between languages', () => {
  const vars = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  for (const k of Object.keys(pl)) assert.deepEqual(vars(pl[k]), vars(en[k]), k);
});

test('every literal key used in code exists', () => {
  const code = sources('js').join('\n') + readFileSync(join(root, 'index.html'), 'utf8');
  const keys = new Set([
    ...[...code.matchAll(/\bt\('([a-zA-Z0-9_.]+)'/g)].map((m) => m[1]),
    ...[...code.matchAll(/data-i18n(?:-label)?="([a-zA-Z0-9_.]+)"/g)].map((m) => m[1]),
  ]);
  const missing = [...keys].filter((k) => !(k in pl));
  assert.deepEqual(missing, []);
});

// artifacts.<id>.detail is optional: a line about how the artifact looks, shown once it is found.
test('every symbol and artifact has a name, every artifact lore and a model', () => {
  for (const lang of [pl, en]) {
    for (const id of SYMBOLS) assert.ok(lang[`symbols.${id}`], `symbol ${id}`);
    for (const id of ARTIFACTS) {
      assert.ok(lang[`artifacts.${id}.name`], `${id} name`);
      assert.ok(lang[`artifacts.${id}.lore`], `${id} lore`);
    }
  }
  for (const id of ARTIFACTS) assert.ok(MODELS[id], `${id} model`);
  for (const m of MISSIONS) assert.ok(ARTIFACTS.includes(m.artifact), `mission ${m.n} artifact`);
});

test('every coin has a low-poly model', () => {
  for (const c of COINS) assert.ok(COIN_MODELS[c.id], c.id);
  assert.equal(Object.keys(COIN_MODELS).length, COINS.length);
});

test('every item has a name and a description', () => {
  for (const id of [...JUNK, ...COINS.map((c) => c.id)]) {
    for (const lang of [pl, en]) {
      assert.ok(lang[`items.${id}.name`], `${id} name`);
      assert.ok(lang[`items.${id}.desc`], `${id} desc`);
    }
  }
});
