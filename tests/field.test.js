import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fieldAt, isInsideSearched, THRESHOLD, kernel, SUPPORT } from '../js/game/field.js';

test('a lone searched area has a radius of exactly 100 m', () => {
  const balls = [{ x: 0, y: 0 }];
  assert.equal(THRESHOLD, 0.5625);
  assert.ok(isInsideSearched(99.9, 0, balls));
  assert.ok(isInsideSearched(0, -99.9, balls));
  assert.ok(!isInsideSearched(100.1, 0, balls));
});

test('kernel has finite support', () => {
  assert.equal(kernel(SUPPORT), 0);
  assert.equal(kernel(SUPPORT + 50), 0);
  assert.ok(kernel(SUPPORT - 1) > 0);
});

test('nearby areas merge smoothly, distant ones do not', () => {
  // 150 m apart: the gap between them is filled in.
  assert.ok(isInsideSearched(75, 0, [{ x: 0, y: 0 }, { x: 150, y: 0 }]));
  // 300 m apart: the midpoint stays unsearched.
  assert.ok(!isInsideSearched(150, 0, [{ x: 0, y: 0 }, { x: 300, y: 0 }]));
  // 450 m apart: no influence at all on each other's centre.
  assert.equal(fieldAt(0, 0, [{ x: 0, y: 0 }, { x: 450, y: 0 }]), 1);
});

test('merging only ever grows the searched region', () => {
  const one = [{ x: 0, y: 0 }];
  const two = [{ x: 0, y: 0 }, { x: 180, y: 0 }];
  for (let a = 0; a < Math.PI * 2; a += 0.3) {
    const x = Math.cos(a) * 99, y = Math.sin(a) * 99;
    assert.ok(isInsideSearched(x, y, one) && isInsideSearched(x, y, two));
  }
});
