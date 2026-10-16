import { test } from 'node:test';
import assert from 'node:assert/strict';
import { haversine, LocalFrame, formatDMS } from '../js/core/geo.js';

test('one degree of latitude is ~111.2 km', () => {
  const d = haversine({ lat: 52, lon: 21 }, { lat: 53, lon: 21 });
  assert.ok(Math.abs(d - 111195) < 50, `got ${d}`);
});

test('local frame round-trips and agrees with haversine within 0.1% at 3 km', () => {
  const f = new LocalFrame(52.2297, 21.0122);
  for (const [x, y] of [[0, 0], [100, 0], [-2100, 1800], [2500, -1500]]) {
    const g = f.toGeo(x, y);
    const back = f.toLocal(g.lat, g.lon);
    assert.ok(Math.abs(back.x - x) < 1e-6 && Math.abs(back.y - y) < 1e-6);
    const local = Math.hypot(x, y);
    if (local > 0) {
      const hv = haversine({ lat: f.lat0, lon: f.lon0 }, g);
      assert.ok(Math.abs(hv - local) / local < 1e-3, `x=${x} y=${y}: ${hv} vs ${local}`);
    }
  }
});

test('world offset is stable and wrapped', () => {
  const f = new LocalFrame(52.2297, 21.0122);
  const a = f.worldOffset(), b = new LocalFrame(52.2297, 21.0122).worldOffset();
  assert.deepEqual(a, b);
  assert.ok(a.x >= 0 && a.x < 65536 && a.y >= 0 && a.y < 65536);
});

test('formatDMS', () => {
  assert.equal(formatDMS(52.2297, true), '52°13′47″N');
  assert.equal(formatDMS(-0.5, false), '0°30′00″W');
});
