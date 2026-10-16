import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Camera } from '../js/render/camera.js';

function cam() {
  const c = new Camera();
  c.setViewport(400, 800);
  c.x = 100;
  c.y = -50;
  c.ppm = 2;
  return c;
}

const close = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;

test('screen and local coordinates are inverse', () => {
  const c = cam();
  for (const [x, y] of [[100, -50], [0, 0], [180, 60]]) {
    const s = c.toScreen(x, y);
    const l = c.toLocal(s.sx, s.sy);
    assert.ok(close(l.x, x) && close(l.y, y));
  }
  assert.deepEqual(c.toScreen(100, -50), { sx: 200, sy: 400 });
  // North is up on screen.
  assert.ok(c.toScreen(100, 0).sy < 400);
});

test('zooming keeps the point under the cursor fixed when not following', () => {
  const c = cam();
  c.follow = false;
  const before = c.toLocal(320, 150);
  c.zoomAt(1.7, 320, 150);
  const after = c.toLocal(320, 150);
  assert.ok(close(before.x, after.x) && close(before.y, after.y));
});

test('zoom is clamped', () => {
  const c = cam();
  c.zoomAt(1000, 0, 0);
  assert.equal(c.ppm, c.maxPpm);
  c.zoomAt(1e-6, 0, 0);
  assert.equal(c.ppm, c.minPpm);
});

test('following centres the player in the visible area, not the screen', () => {
  const c = cam();
  c.offsetY = 40;
  c.follow = true;
  for (let i = 0; i < 200; i++) c.update(1 / 60, { x: 10, y: 20 });
  const s = c.toScreen(10, 20);
  assert.ok(close(s.sx, 200, 0.01));
  assert.ok(close(s.sy, 360, 0.01), `${s.sy}`);
});

test('smooth zoom reaches its goal', () => {
  const c = cam();
  c.follow = false;
  c.zoomTo(4, 200, 400);
  for (let i = 0; i < 120; i++) c.update(1 / 60, null);
  assert.equal(c.ppm, 4);
  assert.equal(c.zoomGoal, null);
});

test('fly to the player ends following at the requested zoom', () => {
  const c = cam();
  c.follow = false;
  c.flyTo(null, 1.1, 0.5);
  for (let i = 0; i < 40; i++) c.update(1 / 60, { x: 500, y: 500 });
  assert.equal(c.fly, null);
  assert.equal(c.follow, true);
  assert.ok(close(c.ppm, 1.1));
  assert.ok(close(c.x, 500, 1e-6));
});

test('fly to a place stops following', () => {
  const c = cam();
  c.flyTo({ x: -300, y: 40 }, 0.8, 0.3);
  assert.equal(c.follow, false);
  for (let i = 0; i < 30; i++) c.update(1 / 60, { x: 0, y: 0 });
  assert.ok(close(c.x, -300) && close(c.y, 40) && close(c.ppm, 0.8));
});
