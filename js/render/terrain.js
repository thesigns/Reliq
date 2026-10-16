// Decides which ink icons decorate the fictional map. Deterministic per world cell,
// with zoom levels that cross-fade so icons keep a roughly constant on-screen size.

import { biomeAt, h01 } from '../core/noise.js';

export const BIOME = { mount: 0.60, hill: 0.555, forest: 0.555 };

const BASE_CELL = 52;     // metres at level 0
const TARGET_PX = 46;     // desired cell size on screen (CSS px)

function iconFor(b, hv, hv2) {
  if (b.elev > BIOME.mount) return { kind: 'mountain', name: `mountain${Math.floor(hv2 * 3)}`, size: 1.55, density: 0.85 };
  if (b.elev > BIOME.hill && b.moist <= BIOME.forest) return { kind: 'hill', name: `hill${Math.floor(hv2 * 2)}`, size: 1.15, density: 0.55 };
  if (b.moist > BIOME.forest) {
    const pine = b.elev > 0.5 ? hv2 < 0.7 : hv2 < 0.2;
    return pine
      ? { kind: 'tree', name: `pine${Math.floor(hv * 2)}`, size: 0.62, density: 0.95 }
      : { kind: 'tree', name: `tree${Math.floor(hv * 3)}`, size: 0.66, density: 0.95 };
  }
  return { kind: 'grass', name: `grass${Math.floor(hv * 3)}`, size: 0.42, density: 0.2 };
}

// One detail level at a time, switched with hysteresis so icons never sit
// half-transparent on top of each other. The switch is instant: it happens while a zoom
// gesture stretches the cached base, and a cross-fade would force a base redraw every
// frame for its duration (costly on phones).
const lod = { level: null, prev: null, since: 0 };
const FADE_MS = 0;

// True while two detail levels are cross-fading (the cached base layer must redraw).
export const lodFading = (now = performance.now()) => lod.prev !== null && now - lod.since < FADE_MS;

// Appends sprite instances {x, y, w, h, icon, alpha} for the visible area.
export function terrainIcons(cam, worldOff, rects, out, now = performance.now()) {
  const lf = Math.log2(TARGET_PX / (BASE_CELL * cam.ppm));
  if (lod.level === null) lod.level = Math.round(lf);
  if (lf > lod.level + 0.62 || lf < lod.level - 0.62) {
    lod.prev = lod.level;
    lod.level = Math.round(lf);
    lod.since = now;
  }
  const k = FADE_MS ? Math.min(1, (now - lod.since) / FADE_MS) : 1;
  if (k < 1 && lod.prev !== null) addLevel(cam, worldOff, rects, out, lod.prev, 1 - k);
  addLevel(cam, worldOff, rects, out, lod.level, lod.prev === null ? 1 : k);
}

function addLevel(cam, worldOff, rects, out, level, alpha) {
  if (alpha < 0.02) return;
  const cell = BASE_CELL * Math.pow(2, level);
  const halfW = cam.w / 2 / cam.ppm + cell * 1.5;
  const halfH = cam.h / 2 / cam.ppm + cell * 1.5;
  const x0 = Math.floor((cam.x - halfW + worldOff.x) / cell);
  const x1 = Math.ceil((cam.x + halfW + worldOff.x) / cell);
  const y0 = Math.floor((cam.y - halfH + worldOff.y) / cell);
  const y1 = Math.ceil((cam.y + halfH + worldOff.y) / cell);
  const seed = 1000 + (level + 16);

  for (let cy = y0; cy <= y1; cy++) {
    for (let cx = x0; cx <= x1; cx++) {
      const hv = h01(cx, cy, seed);
      const wx = (cx + 0.15 + 0.7 * h01(cx, cy, seed + 1)) * cell;
      const wy = (cy + 0.15 + 0.7 * h01(cx, cy, seed + 2)) * cell;
      const b = biomeAt(wx, wy);
      const ic = iconFor(b, hv, h01(cx, cy, seed + 3));
      if (h01(cx, cy, seed + 4) > ic.density) continue;
      const r = rects[ic.name];
      const s = cell * ic.size * (0.85 + 0.3 * h01(cx, cy, seed + 5));
      const w = r.aspect >= 1 ? s : s * r.aspect;
      const h = r.aspect >= 1 ? s / r.aspect : s;
      out.push({ x: wx - worldOff.x, y: wy - worldOff.y, w, h, icon: ic.name, alpha });
      // Forests get extra, offset trees so they read as woodland rather than a grid.
      if (ic.kind === 'tree') {
        for (let k = 0; k < 3; k++) {
          if (h01(cx, cy, seed + 6 + k * 3) > 0.8) continue;
          const kind = h01(cx, cy, seed + 7 + k * 3) < (b.elev > 0.5 ? 0.6 : 0.25) ? 'pine' : 'tree';
          const name = kind === 'pine' ? `pine${k % 2}` : `tree${k % 3}`;
          const rr = rects[name];
          const sc = s * (0.8 + 0.25 * h01(cx, cy, seed + 8 + k * 3));
          out.push({
            x: wx - worldOff.x + (h01(cx, cy, seed + 9 + k) - 0.5) * cell * 0.9,
            y: wy - worldOff.y + (h01(cx, cy, seed + 13 + k) - 0.5) * cell * 0.9,
            w: rr.aspect >= 1 ? sc : sc * rr.aspect, h: rr.aspect >= 1 ? sc / rr.aspect : sc, icon: name, alpha,
          });
        }
      }
    }
  }
}
