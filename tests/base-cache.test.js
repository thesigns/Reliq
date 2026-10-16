import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planStrips, wrapPieces } from '../js/render/base-cache.js';

const area = (r) => (r.x1 - r.x0) * (r.y1 - r.y0);
const rect = (x0, y0, x1, y1) => ({ x0, y0, x1, y1 });

// Every pixel of `target` is covered exactly once by `valid ∩ target` plus the strips.
function assertTiles(valid, target, strips) {
  const seen = new Map();
  const mark = (r) => {
    for (let y = r.y0; y < r.y1; y++) for (let x = r.x0; x < r.x1; x++) {
      const k = `${x},${y}`;
      seen.set(k, (seen.get(k) ?? 0) + 1);
    }
  };
  if (valid) {
    const v = rect(Math.max(valid.x0, target.x0), Math.max(valid.y0, target.y0), Math.min(valid.x1, target.x1), Math.min(valid.y1, target.y1));
    if (v.x0 < v.x1 && v.y0 < v.y1) mark(v);
  }
  strips.forEach(mark);
  assert.equal(seen.size, area(target));
  for (const n of seen.values()) assert.equal(n, 1);
}

test('a pan paints only the strips that came into view', () => {
  const valid = rect(0, 0, 40, 30);
  for (const [dx, dy] of [[5, 0], [-7, 0], [0, 4], [0, -3], [6, -2], [-3, 5]]) {
    const target = rect(dx, dy, 40 + dx, 30 + dy);
    const { strips, valid: v } = planStrips(valid, target);
    assertTiles(valid, target, strips);
    assert.deepEqual(v, target);
    const painted = strips.reduce((a, r) => a + area(r), 0);
    assert.equal(painted, area(target) - (40 - Math.abs(dx)) * (30 - Math.abs(dy)));
  }
});

test('a jump past the old window, or none yet, paints everything', () => {
  const target = rect(100, 100, 140, 130);
  for (const valid of [null, rect(0, 0, 40, 30)]) {
    const { strips, valid: v } = planStrips(valid, target);
    assertTiles(null, target, strips);
    assert.deepEqual(v, target);
  }
});

test('refilling under a budget grows a rectangle until it is complete', () => {
  const target = rect(-20, -10, 20, 20);
  let valid = null, frames = 0;
  while (!valid || area(valid) < area(target)) {
    const { strips, valid: v } = planStrips(valid, target, area(target) / 4);
    assert.ok(strips.reduce((a, r) => a + area(r), 0) <= area(target) / 4 + 40, 'about the budget');
    assertTiles(valid, v, strips);
    valid = v;
    assert.ok(++frames <= 4);
  }
  assert.deepEqual(valid, target);
});

test('a rect is split at the texture wrap', () => {
  assert.deepEqual(wrapPieces(rect(3, 4, 8, 9), 10, 10), [{ gx: 3, gy: 4, tx: 3, ty: 4, w: 5, h: 5 }]);
  const pieces = wrapPieces(rect(-3, 7, 4, 12), 10, 10);
  assert.equal(pieces.length, 4);
  assert.equal(pieces.reduce((a, p) => a + p.w * p.h, 0), 7 * 5);
  for (const p of pieces) {
    assert.equal(((p.gx % 10) + 10) % 10, p.tx);
    assert.equal(((p.gy % 10) + 10) % 10, p.ty);
    assert.ok(p.tx + p.w <= 10 && p.ty + p.h <= 10);
  }
});
