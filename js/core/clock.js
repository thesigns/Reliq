// Game clock. Everything time-based (search expiry, speed window) reads from here,
// so the debug simulator can warp time without touching the rules.

let offset = 0;

export const clock = {
  now: () => Date.now() + offset,
  advance(ms) { offset += ms; },
  get offset() { return offset; },
  set offset(ms) { offset = Number.isFinite(ms) ? ms : 0; },
};
