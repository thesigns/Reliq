import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sideDirections, viewDirection, sideFacing, Examination } from '../js/game/examine.js';
import { RULES } from '../js/game/rules.js';
import { mul, rotX, rotY } from '../js/render/artifact3d.js';

const close = (a, b, eps = 1e-6) => a.every((v, i) => Math.abs(v - b[i]) < eps);

test('the sides are unit directions spread over the whole sphere', () => {
  const sides = sideDirections();
  assert.equal(sides.length, RULES.examine.sides);
  for (const s of sides) assert.ok(Math.abs(Math.hypot(...s) - 1) < 1e-9);
  assert.ok(sides.some((s) => s[1] > 0.9) && sides.some((s) => s[1] < -0.9), 'top and bottom');
});

test('the view direction is the camera seen from the model, as the reveal renders it', () => {
  for (const [yaw, pitch] of [[0, 0], [0.7, 0.38], [-2.1, -1.2], [3, 1.5]]) {
    // The model matrix is rotX(pitch) · rotY(yaw); the camera sits on +z. A model point p
    // faces it when the turned p points along +z, i.e. p = (model)ᵀ · z.
    const m = mul(rotX(pitch), rotY(yaw));
    const d = [m[2], m[6], m[10]];
    assert.ok(close(viewDirection(yaw, pitch), d), `${yaw}, ${pitch}`);
  }
  assert.ok(close(viewDirection(0, Math.PI / 2), [0, 1, 0]), 'from straight above');
});

// Holds each pose long enough to count, turning slowly.
function sweep(exam, poses) {
  for (const [yaw, pitch] of poses) exam.look(yaw, pitch, RULES.examine.dwellMs, 1);
}
const ring = (pitch) => Array.from({ length: 72 }, (_, i) => [(i / 72) * 2 * Math.PI, pitch]);

test('spinning it round finds the first detail, but not the second', () => {
  const facing = new Set(ring(0.38).map(([y, p]) => sideFacing(y, p)));
  assert.ok(facing.size < RULES.examine.sides / 2, 'one ring shows less than half the sides');
  const first = new Examination(0);
  sweep(first, ring(0.38));
  assert.ok(first.done);
  const second = new Examination(1);
  sweep(second, ring(0.38));
  assert.ok(!second.done, 'one ring of sides is not enough');
});

test('the last detail needs a look from above and below', () => {
  const last = new Examination(2);
  sweep(last, [...ring(0.38), ...ring(-0.38)]);
  assert.ok(!last.done, 'round the middle only');
  sweep(last, [...ring(1.1), ...ring(-1.1), [0, Math.PI / 2], [0, -Math.PI / 2]]);
  assert.ok(last.done);
  assert.equal(last.progress, 1);
});

test('a side counts only once it has faced the player long enough', () => {
  const exam = new Examination(0);
  exam.look(0, 0, RULES.examine.dwellMs / 2);
  assert.equal(exam.seen, 0);
  exam.look(0, 0, RULES.examine.dwellMs / 2);
  assert.equal(exam.seen, 1);
  exam.look(0, 0, RULES.examine.dwellMs * 5);
  assert.equal(exam.seen, 1, 'the same side again');
});

test('a flick that spins it fast does not count', () => {
  const exam = new Examination(0);
  for (const [yaw, pitch] of ring(0)) exam.look(yaw, pitch, RULES.examine.dwellMs, RULES.examine.maxTurnRate + 1);
  assert.equal(exam.seen, 0);
});
