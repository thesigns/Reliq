import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderSw, collectAssets } from '../scripts/build-sw.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));

test('sw.js is up to date (run: node scripts/build-sw.mjs)', () => {
  assert.equal(readFileSync(root + 'sw.js', 'utf8'), renderSw());
});

test('every precached file exists', () => {
  for (const a of collectAssets()) if (a !== './') assert.ok(existsSync(root + a), a);
});

test('manifest icons exist', () => {
  const m = JSON.parse(readFileSync(root + 'manifest.webmanifest', 'utf8'));
  assert.equal(m.start_url, './');
  for (const icon of m.icons) assert.ok(existsSync(root + icon.src), icon.src);
  assert.ok(m.icons.some((i) => i.purpose === 'maskable'));
});
