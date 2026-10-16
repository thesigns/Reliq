// Development helper: a ready-made world (a morning's walk with four searches, one won
// mission with its opened tomb, and a few coins), used by the debug panel.

import { LocalFrame } from './core/geo.js';

const HOUR = 3600e3;
export const DEMO_VAULT = { lat: 52.2297, lon: 21.0122 };
export const DEMO_PLAYER = { x: 360, y: 330 }; // where the walk ended, relative to the vault

export function seedDemoWorld(s, now, vault = DEMO_VAULT) {
  const f = new LocalFrame(vault.lat, vault.lon);
  const at = (x, y, tt) => ({ ...f.toGeo(x, y), t: tt });
  s.vault = at(0, 0, now - 30 * 24 * HOUR);
  s.seed = 1;
  s.searches = [[-60, 180, 5.5], [60, 262, 4.0], [192, 300, 2.0], [262, 182, 0.7]].map(([x, y, h]) => at(x, y, now - h * HOUR));
  s.tombs = [{ n: 1, ...at(-430, 520, now - 3 * 24 * HOUR), opened: true, artifact: 'cup' }];
  s.artifacts = [{ id: 'cup', n: 1, t: now - 3 * 24 * HOUR, from: 'tomb' }];
  s.coins = { ducat: 1, kaiyuan: 9, nummus: 3 };
  s.satchel = { coins: { nummus: 2, kaiyuan: 1, denarius: 1 }, artifacts: [] };
  s.mission = null;

}
