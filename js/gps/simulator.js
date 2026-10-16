// Desktop GPS simulator with the same interface as GeolocationSource.
// WASD / arrows walk, Shift runs, walkTo() follows a point, teleport() jumps.
// "warp" speeds up both movement and the game clock, so reported speed stays realistic.
// noise 'realistic' adds a slowly wandering bias, jitter and the odd multipath jump.

import { clock } from '../core/clock.js';

const WALK_MS = 5 / 3.6;   // 5 km/h
const RUN_MS = 18 / 3.6;   // 18 km/h -> trips the speed limit

function gauss() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export class GpsSimulator {
  constructor(frame, start, onSample) {
    this.kind = 'sim';
    this.frame = frame;
    this.x = start.x;
    this.y = start.y;
    this.heading = 0;        // radians, 0 = north, clockwise
    this.accuracy = 8;
    this.warp = 8;
    this.noise = 'clean';
    this.signal = true;
    this.target = null;
    this.onSample = onSample;
    this.onTeleport = null;
    this.keys = new Set();
    this.lastSampleT = 0;
    this.moving = false;
    this.speed = 0;
    this.bias = { x: 0, y: 0 };
    this.jump = null;

    addEventListener('keydown', (e) => {
      if (e.target.closest?.('input, select, textarea')) return;
      this.keys.add(e.key.toLowerCase());
    });
    addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    addEventListener('blur', () => this.keys.clear());
  }

  get state() { return this.signal ? 'active' : 'unavailable'; }

  start() {}
  stop() {}

  walkTo(x, y) { this.target = { x, y }; }

  teleport(x, y) {
    this.x = x;
    this.y = y;
    this.target = null;
    this.bias = { x: 0, y: 0 };
    this.onTeleport?.();
  }

  update(dtReal) {
    const k = this.keys;
    let vx = (k.has('d') || k.has('arrowright') ? 1 : 0) - (k.has('a') || k.has('arrowleft') ? 1 : 0);
    let vy = (k.has('w') || k.has('arrowup') ? 1 : 0) - (k.has('s') || k.has('arrowdown') ? 1 : 0);
    if (vx || vy) this.target = null;
    else if (this.target) {
      vx = this.target.x - this.x;
      vy = this.target.y - this.y;
      if (Math.hypot(vx, vy) < 0.5) { this.target = null; vx = vy = 0; }
    }
    const len = Math.hypot(vx, vy);
    this.moving = len > 0;
    this.speed = 0;
    if (this.moving) {
      this.speed = k.has('shift') ? RUN_MS : WALK_MS;
      const dtGame = dtReal * this.warp;
      clock.advance(dtReal * (this.warp - 1) * 1000);
      const step = Math.min(this.speed * dtGame, this.target ? len : Infinity);
      this.x += (vx / len) * step;
      this.y += (vy / len) * step;
      this.heading = Math.atan2(vx, vy);
    }
    const now = clock.now();
    if (this.signal && now - this.lastSampleT >= 1000) {
      this.lastSampleT = now;
      this.emit(now);
    }
  }

  emit(now) {
    let ex, ey, acc = this.accuracy;
    if (this.noise === 'realistic') {
      // Bias drifts slowly (a random walk pulled back towards zero), plus white jitter.
      const s = this.accuracy;
      this.bias.x = this.bias.x * 0.97 + gauss() * s * 0.08;
      this.bias.y = this.bias.y * 0.97 + gauss() * s * 0.08;
      if (!this.jump && Math.random() < 0.02) {
        const a = Math.random() * Math.PI * 2, d = s * (1.5 + Math.random() * 2);
        this.jump = { x: Math.cos(a) * d, y: Math.sin(a) * d, left: 1 + Math.floor(Math.random() * 3) };
      }
      ex = this.bias.x + gauss() * s * 0.2;
      ey = this.bias.y + gauss() * s * 0.2;
      if (this.jump) {
        ex += this.jump.x;
        ey += this.jump.y;
        if (--this.jump.left <= 0) this.jump = null;
      }
      acc = s * (0.8 + Math.random() * 0.5);
    } else {
      const j = this.accuracy * 0.12;
      ex = (Math.random() - 0.5) * j;
      ey = (Math.random() - 0.5) * j;
      acc = this.accuracy * (0.9 + Math.random() * 0.2);
    }
    const geo = this.frame.toGeo(this.x + ex, this.y + ey);
    this.onSample({
      lat: geo.lat, lon: geo.lon, acc, t: now,
      speed: this.speed, course: this.moving ? this.heading : null,
    });
  }
}
