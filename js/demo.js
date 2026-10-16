// Development helper: a ready-made world (a morning's walk with four searches, one won
// mission with its opened tomb, a few coins and the route between them), used by the debug panel.

import { LocalFrame } from './core/geo.js';

const HOUR = 3600e3;
export const DEMO_VAULT = { lat: 52.2297, lon: 21.0122 };
export const DEMO_PLAYER = { x: 360, y: 330 }; // where the walk ends, relative to the vault

export function seedDemoWorld(s, now, vault = DEMO_VAULT) {
  const f = new LocalFrame(vault.lat, vault.lon);
  const at = (x, y, tt) => ({ ...f.toGeo(x, y), t: tt });
  s.vault = at(0, 0, now - 30 * 24 * HOUR);
  s.searches = [[-60, 180, 5.5], [60, 262, 4.0], [192, 300, 2.0], [262, 182, 0.7]].map(([x, y, h]) => at(x, y, now - h * HOUR));
  s.tombs = [{ n: 1, ...at(-430, 520, now - 3 * 24 * HOUR), opened: true, artifact: 'cup' }];
  s.artifacts = [{ id: 'cup', n: 1, t: now - 3 * 24 * HOUR, from: 'tomb' }];
  s.coins = { ducat: 1, kaiyuan: 9, nummus: 3 };
  s.satchel = { coins: { nummus: 2, kaiyuan: 1, denarius: 1 }, artifacts: [] };
  s.mission = null;
  const way = [
    [0, 0, 5.8], [-40, 100, 5.65], [-60, 180, 5.5], [-10, 230, 4.6], [60, 262, 4.0],
    [130, 300, 3.0], [192, 300, 2.0], [250, 250, 1.2], [262, 182, 0.7], [300, 250, 0.4], [DEMO_PLAYER.x, DEMO_PLAYER.y, 0.02],
  ];
  s.trail = [];
  for (let i = 0; i < way.length - 1; i++) {
    const [x0, y0, h0] = way[i], [x1, y1, h1] = way[i + 1];
    const steps = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 10));
    for (let k = 0; k < steps; k++) {
      const u = k / steps, wob = Math.sin((i * 7 + k) * 0.9) * 3;
      s.trail.push(at(x0 + (x1 - x0) * u + wob, y0 + (y1 - y0) * u - wob, now - (h0 + (h1 - h0) * u) * HOUR));
    }
  }
}
