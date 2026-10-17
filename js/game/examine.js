// Examining an artifact in the vault. The player turns it with a finger; every side of it that
// faces them for a moment counts as looked at, and once enough sides have been, the next of its
// details is found. Each detail starts the look afresh, and asks for more of the sides, so the
// last one means looking from above and below too, not just spinning it round.

import { RULES } from './rules.js';

// n directions spread evenly over a sphere (a Fibonacci lattice): the sides of the model.
export function sideDirections(n = RULES.examine.sides) {
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: n }, (_, i) => {
    const y = 1 - (2 * (i + 0.5)) / n;
    const r = Math.sqrt(1 - y * y);
    return [r * Math.cos(golden * i), y, r * Math.sin(golden * i)];
  });
}

// Where the player looks at the model from, in the model's own frame, for the reveal's pose:
// turned by yaw about the vertical, then pitched towards the viewer (positive: from above).
export function viewDirection(yaw, pitch) {
  const c = Math.cos(pitch);
  return [-Math.sin(yaw) * c, Math.sin(pitch), Math.cos(yaw) * c];
}

const SIDES = sideDirections();

// The side of the model facing the player.
export function sideFacing(yaw, pitch) {
  const d = viewDirection(yaw, pitch);
  let best = 0, bestDot = -2;
  SIDES.forEach((s, i) => {
    const dot = s[0] * d[0] + s[1] * d[1] + s[2] * d[2];
    if (dot > bestDot) { bestDot = dot; best = i; }
  });
  return best;
}

// The search for one detail. found: how many of the artifact's details are already known.
export class Examination {
  constructor(found) {
    const { share, sides } = RULES.examine;
    this.needed = Math.ceil(share[Math.min(found, share.length - 1)] * sides);
    this.time = new Array(sides).fill(0);   // ms each side has faced the player
    this.seen = 0;
  }

  // The model has been held at this pose for dtMs, turning at turnRate (rad/s).
  look(yaw, pitch, dtMs, turnRate = 0) {
    if (this.done || turnRate > RULES.examine.maxTurnRate) return;
    const i = sideFacing(yaw, pitch);
    const before = this.time[i];
    this.time[i] += dtMs;
    if (before < RULES.examine.dwellMs && this.time[i] >= RULES.examine.dwellMs) this.seen++;
  }

  get progress() { return Math.min(1, this.seen / this.needed); }
  get done() { return this.seen >= this.needed; }
}
