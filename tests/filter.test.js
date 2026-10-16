import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PositionFilter } from '../js/gps/filter.js';
import { seededRandom } from '../js/core/rng.js';

function gauss(rng) {
  const u = Math.max(1e-12, rng()), v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

test('nothing before the first fix, then the fix itself', () => {
  const f = new PositionFilter();
  assert.equal(f.estimate(0), null);
  f.update(10, 20, 5, 0);
  const e = f.estimate(0);
  assert.equal(e.x, 10);
  assert.equal(e.y, 20);
});

// Raw fixes with σ = 10 m per axis are off by ~12.5 m on average.
test('standing still: the estimate is about half as noisy as the raw fixes', () => {
  let err = 0;
  for (let seed = 1; seed <= 30; seed++) {
    const rng = seededRandom(seed);
    const f = new PositionFilter();
    for (let s = 0; s < 60; s++) f.update(100 + gauss(rng) * 10, 50 + gauss(rng) * 10, 10, s * 1000);
    const e = f.estimate(60000);
    err += Math.hypot(e.x - 100, e.y - 50);
  }
  assert.ok(err / 30 < 7.5, `mean error ${err / 30}`);
});

test('walking: follows the path and learns the velocity', () => {
  let errX = 0, errV = 0;
  for (let seed = 1; seed <= 30; seed++) {
    const rng = seededRandom(seed + 100);
    const f = new PositionFilter();
    for (let s = 0; s <= 60; s++) f.update(1.4 * s + gauss(rng) * 5, gauss(rng) * 5, 5, s * 1000);
    const e = f.estimate(60000);
    errX += Math.abs(e.x - 84);
    errV += Math.abs(e.vx - 1.4);
  }
  assert.ok(errX / 30 < 4, `position ${errX / 30}`);
  assert.ok(errV / 30 < 0.4, `velocity ${errV / 30}`);
});

test('a single multipath jump barely moves the estimate', () => {
  const f = new PositionFilter();
  for (let s = 0; s < 20; s++) f.update(0, 0, 8, s * 1000);
  f.update(90, 0, 8, 20000);
  assert.ok(f.estimate(20000).x < 15, `${f.estimate(20000).x}`);
  f.update(0, 0, 8, 21000);
  assert.ok(f.estimate(21000).x < 10);
});

test('persistent fixes elsewhere win after a few readings', () => {
  const f = new PositionFilter();
  for (let s = 0; s < 20; s++) f.update(0, 0, 8, s * 1000);
  for (let s = 20; s < 24; s++) f.update(300, 0, 8, s * 1000);
  assert.ok(Math.abs(f.estimate(23000).x - 300) < 10, `${f.estimate(23000).x}`);
});

test('extrapolation between fixes is capped', () => {
  const f = new PositionFilter({ maxExtrapolationS: 3 });
  for (let s = 0; s <= 30; s++) f.update(2 * s, 0, 3, s * 1000);
  const at3 = f.estimate(33000).x, at60 = f.estimate(90000).x;
  assert.ok(Math.abs(at3 - at60) < 1e-9);
  assert.ok(at3 > 60 && at3 < 70, `${at3}`);
});

test('a long silence restarts the filter at the next fix', () => {
  const f = new PositionFilter();
  for (let s = 0; s < 10; s++) f.update(0, 0, 5, s * 1000);
  f.update(500, 500, 5, 120000);
  const e = f.estimate(120000);
  assert.equal(e.x, 500);
  assert.equal(e.vx, 0);
});
