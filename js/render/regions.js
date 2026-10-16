// Region names lettered across the map, as on old charts: "Silva Opaca", "Montes Ferrei".
// Deterministic per world cell; Latin keeps them the same in every language.

import { biomeAt, h01 } from '../core/noise.js';
import { BIOME } from './terrain.js';

const BASE_CELL = 1100;     // metres between label candidates at the closest label zoom
const TARGET_PX = 260;      // keep candidates roughly this far apart on screen

// Noun + grammatical gender/number: m, f, n singular; mp, np plural.
const NOUNS = {
  forest: [['Silva', 'f'], ['Saltus', 'm'], ['Nemus', 'n'], ['Lucus', 'm']],
  mountains: [['Montes', 'mp'], ['Mons', 'm'], ['Iuga', 'np'], ['Rupes', 'f']],
  hills: [['Colles', 'mp'], ['Tumuli', 'mp'], ['Clivus', 'm']],
  plains: [['Campi', 'mp'], ['Prata', 'np'], ['Arva', 'np'], ['Campus', 'm']],
};

// First/second-declension adjective stems (-us, -a, -um).
const ADJECTIVES = [
  'obscur', 'antiqu', 'ferre', 'aure', 'argente', 'tacit', 'umbros', 'alt', 'lat', 'nebulos',
  'perdit', 'magn', 'long', 'mut', 'nov', 'prisc', 'caec', 'saxos', 'opac', 'avi', 'desert', 'ventos',
];
const ENDINGS = { m: 'us', f: 'a', n: 'um', mp: 'i', np: 'a' };

const cap = (s) => s[0].toUpperCase() + s.slice(1);

export function regionName(kind, cx, cy) {
  const nouns = NOUNS[kind];
  const [noun, gender] = nouns[Math.floor(h01(cx, cy, 701) * nouns.length) % nouns.length];
  const stem = ADJECTIVES[Math.floor(h01(cx, cy, 709) * ADJECTIVES.length) % ADJECTIVES.length];
  return `${noun} ${cap(stem)}${ENDINGS[gender]}`;
}

export function biomeKind(b) {
  if (b.elev > BIOME.mount) return 'mountains';
  if (b.elev > BIOME.hill && b.moist <= BIOME.forest) return 'hills';
  if (b.moist > BIOME.forest) return 'forest';
  return 'plains';
}

// Labels anchored within the view (plus a small margin), in local metres. Candidate
// spacing doubles as the map zooms out, so the density on screen stays about the same.
export function regionLabels(cam, worldOff, out = []) {
  const level = Math.max(0, Math.round(Math.log2(TARGET_PX / (BASE_CELL * cam.ppm))));
  const cell = BASE_CELL * 2 ** level;
  const probe = cell * 0.22;
  const hw = cam.w / 2 / cam.ppm + cell * 0.3, hh = cam.h / 2 / cam.ppm + cell * 0.3;
  const x0 = Math.floor((cam.x - hw + worldOff.x) / cell), x1 = Math.floor((cam.x + hw + worldOff.x) / cell);
  const y0 = Math.floor((cam.y - hh + worldOff.y) / cell), y1 = Math.floor((cam.y + hh + worldOff.y) / cell);
  const seed = 700 + level * 31;
  for (let cy = y0; cy <= y1; cy++) {
    for (let cx = x0; cx <= x1; cx++) {
      const wx = (cx + 0.25 + 0.5 * h01(cx, cy, seed + 11)) * cell;
      const wy = (cy + 0.25 + 0.5 * h01(cx, cy, seed + 13)) * cell;
      if (Math.abs(wx - worldOff.x - cam.x) > hw || Math.abs(wy - worldOff.y - cam.y) > hh) continue;
      const kind = biomeKind(biomeAt(wx, wy));
      if (kind === 'plains' && h01(cx, cy, seed + 17) > 0.55) continue;
      // Only name regions that clearly extend around the anchor.
      let agree = 0;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        if (biomeKind(biomeAt(wx + Math.cos(a) * probe, wy + Math.sin(a) * probe)) === kind) agree++;
      }
      if (agree < 4) continue;
      out.push({
        id: `${level}:${cx},${cy}`,
        x: wx - worldOff.x,
        y: wy - worldOff.y,
        kind,
        name: regionName(kind, cx + level * 7919, cy),
        rot: (h01(cx, cy, seed + 19) - 0.5) * 0.22,
      });
    }
  }
  return out;
}
