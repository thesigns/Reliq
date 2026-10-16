// Keeps a short history of GPS fixes and derives what the rules need:
// fix accuracy and average speed over the last 20 s.

import { haversine } from '../core/geo.js';
import { RULES } from '../game/rules.js';

export class LocationTracker {
  constructor() {
    this.samples = [];   // { lat, lon, acc, t }
    this.firstT = null;
  }

  push(sample) {
    if (this.firstT === null) this.firstT = sample.t;
    this.samples.push(sample);
    const keepFrom = sample.t - RULES.speedWindowMs * 2;
    while (this.samples.length > 2 && this.samples[1].t < keepFrom) this.samples.shift();
  }

  latest() {
    return this.samples[this.samples.length - 1] ?? null;
  }

  // Average speed = displacement across the window / elapsed time.
  // Displacement (not summed path length) keeps GPS jitter from faking speed while standing still.
  speedKmh(now) {
    const last = this.latest();
    if (!last) return 0;
    const from = now - RULES.speedWindowMs;
    let anchor = this.samples[0];
    for (const s of this.samples) {
      if (s.t <= from) anchor = s; else break;
    }
    const dt = (last.t - anchor.t) / 1000;
    if (dt < 1) return 0;
    return (haversine(anchor, last) / dt) * 3.6;
  }

  ready(now) {
    return this.firstT !== null && now - this.firstT >= RULES.minHistoryMs;
  }

  // Forget the history, e.g. after the app was in the background: we no longer know
  // how the player moved, so the speed check needs fresh readings.
  reset() {
    this.samples = [];
    this.firstT = null;
  }
}
