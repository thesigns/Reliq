// Metaball field of searched areas. FIELD_GLSL draws the exact same iso-line,
// so the edge the player sees is the edge the rules use.

import { RULES } from './rules.js';

export const SUPPORT = 2 * RULES.searchRadius;   // kernel reaches zero at 200 m
export const THRESHOLD = kernel(RULES.searchRadius); // 0.5625 -> a lone ball has radius 100 m

export function kernel(d, support = SUPPORT) {
  if (d >= support) return 0;
  const q = d / support;
  const t = 1 - q * q;
  return t * t;
}

export function fieldAt(x, y, balls) {
  let f = 0;
  for (const b of balls) f += kernel(Math.hypot(x - b.x, y - b.y), SUPPORT * (b.scale ?? 1));
  return f;
}

export function isInsideSearched(x, y, balls) {
  return fieldAt(x, y, balls) >= THRESHOLD;
}

export const FIELD_GLSL = /* glsl */`
const float FIELD_SUPPORT = ${SUPPORT.toFixed(1)};
const float FIELD_T = ${THRESHOLD.toFixed(6)};
`;
