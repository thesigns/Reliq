import { test } from 'node:test';
import assert from 'node:assert/strict';
import { headingFromOrientation } from '../js/gps/compass.js';

const near = (a, b, eps = 0.5) => Math.abs(((a - b + 540) % 360) - 180) < eps;

test('phone flat: heading = 360 - alpha', () => {
  assert.ok(near(headingFromOrientation({ alpha: 0, beta: 0, gamma: 0, absolute: true }), 0));
  assert.ok(near(headingFromOrientation({ alpha: 90, beta: 0, gamma: 0, absolute: true }), 270));
  assert.ok(near(headingFromOrientation({ alpha: 270, beta: 0, gamma: 0, absolute: true }), 90));
  assert.ok(near(headingFromOrientation({ alpha: 180, beta: 10, gamma: -5, absolute: true }), 180, 3));
});

test('phone upright: the camera direction counts', () => {
  // Upright (beta 90) facing north, then turned to face east.
  assert.ok(near(headingFromOrientation({ alpha: 0, beta: 90, gamma: 0, absolute: true }), 0));
  assert.ok(near(headingFromOrientation({ alpha: 270, beta: 90, gamma: 0, absolute: true }), 90));
});

test('landscape screens add the screen rotation', () => {
  assert.ok(near(headingFromOrientation({ alpha: 0, beta: 0, gamma: 0, absolute: true }, 90), 90));
});

test('iOS compass heading is used directly', () => {
  assert.equal(headingFromOrientation({ webkitCompassHeading: 123, alpha: 10 }), 123);
});

test('relative (non-absolute) orientation is ignored', () => {
  assert.equal(headingFromOrientation({ alpha: 40, beta: 0, gamma: 0, absolute: false }), null);
  assert.equal(headingFromOrientation({}), null);
});
