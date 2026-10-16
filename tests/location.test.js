import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LocationTracker } from '../js/gps/location.js';
import { fixAt, T0 } from './helpers.js';

function feed(tracker, seconds, posAt, acc = 8) {
  for (let s = 0; s <= seconds; s++) tracker.push({ ...posAt(s), acc, t: T0 + s * 1000 });
}

test('not ready until 15 s of history', () => {
  const tr = new LocationTracker();
  feed(tr, 10, () => fixAt(300, 0));
  assert.equal(tr.ready(T0 + 10000), false);
  assert.equal(tr.ready(T0 + 15000), true);
});

test('walking at 5 km/h reads ~5 km/h', () => {
  const tr = new LocationTracker();
  const v = 5 / 3.6;
  feed(tr, 40, (s) => fixAt(300 + v * s, 0));
  const kmh = tr.speedKmh(T0 + 40000);
  assert.ok(Math.abs(kmh - 5) < 0.1, `${kmh}`);
});

test('cycling at 18 km/h is over the limit', () => {
  const tr = new LocationTracker();
  feed(tr, 40, (s) => fixAt(300 + (18 / 3.6) * s, 0));
  assert.ok(tr.speedKmh(T0 + 40000) > 10);
});

test('GPS jitter while standing still does not fake speed', () => {
  const tr = new LocationTracker();
  let k = 1;
  const jitter = () => ((k = (k * 16807) % 2147483647) / 2147483647 - 0.5) * 16;
  feed(tr, 60, () => fixAt(300 + jitter(), jitter()), 12);
  assert.ok(tr.speedKmh(T0 + 60000) < 3, `${tr.speedKmh(T0 + 60000)}`);
});

test('reset forgets the history (e.g. after returning from the background)', () => {
  const tr = new LocationTracker();
  feed(tr, 20, () => fixAt(300, 0));
  assert.equal(tr.ready(T0 + 20000), true);
  tr.reset();
  assert.equal(tr.latest(), null);
  assert.equal(tr.ready(T0 + 20000), false);
});

test('speed decays after stopping', () => {
  const tr = new LocationTracker();
  feed(tr, 30, (s) => fixAt(300 + Math.min(s, 20) * 1.4, 0));
  assert.ok(tr.speedKmh(T0 + 30000) < 3);
});
