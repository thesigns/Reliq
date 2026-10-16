// Smooths GPS fixes into a steady player position (local metres).
// A constant-velocity Kalman filter per axis: each fix is weighted by its reported
// accuracy, and between fixes the position is extrapolated for smooth drawing.

const MAX_GAP_S = 30;         // longer silence: start over from the next fix
const GATE = 16;              // squared-distance gate (≈4σ) for suspicious jumps
const RESET_AFTER_OUTLIERS = 3;

class Axis {
  constructor(p, varP) {
    this.p = p;
    this.v = 0;
    this.P = [varP, 0, 4];    // [var(p), cov(p,v), var(v)]
  }

  predict(dt, q) {
    const [a, b, d] = this.P;
    this.p += this.v * dt;
    this.P = [
      a + 2 * dt * b + dt * dt * d + (q * dt * dt * dt) / 3,
      b + dt * d + (q * dt * dt) / 2,
      d + q * dt,
    ];
  }

  update(z, R) {
    const [a, b, d] = this.P;
    const S = a + R;
    const k0 = a / S, k1 = b / S;
    const y = z - this.p;
    this.p += k0 * y;
    this.v += k1 * y;
    this.P = [(1 - k0) * a, (1 - k0) * b, d - k1 * b];
  }
}

export class PositionFilter {
  // q: process noise (m²/s³) — how sharply a walker can change speed.
  constructor({ q = 0.1, maxExtrapolationS = 3 } = {}) {
    this.q = q;
    this.maxEx = maxExtrapolationS;
    this.reset();
  }

  reset() {
    this.ax = null;
    this.ay = null;
    this.t = null;
    this.outliers = 0;
  }

  get ready() { return this.t !== null; }

  update(x, y, acc, t) {
    const R0 = Math.max(1, acc) ** 2;
    if (this.t === null || (t - this.t) / 1000 > MAX_GAP_S) {
      this.ax = new Axis(x, R0);
      this.ay = new Axis(y, R0);
      this.t = t;
      this.outliers = 0;
      return;
    }
    const dt = Math.max(0, (t - this.t) / 1000);
    this.ax.predict(dt, this.q);
    this.ay.predict(dt, this.q);
    const ix = x - this.ax.p, iy = y - this.ay.p;
    const S = (this.ax.P[0] + this.ay.P[0]) / 2 + R0;
    const d2 = (ix * ix + iy * iy) / S;
    let R = R0;
    if (d2 > GATE) {
      // A jump the filter does not believe. If fixes keep insisting, trust them.
      if (++this.outliers >= RESET_AFTER_OUTLIERS) {
        this.ax = new Axis(x, R0);
        this.ay = new Axis(y, R0);
        this.t = t;
        this.outliers = 0;
        return;
      }
      R *= d2 / GATE;
    } else {
      this.outliers = 0;
    }
    this.ax.update(x, R);
    this.ay.update(y, R);
    this.t = t;
  }

  // Position at time t, without changing the filter. Extrapolation is capped so the
  // marker does not run off when fixes stop arriving.
  estimate(t) {
    if (this.t === null) return null;
    const dt = Math.min(Math.max(0, (t - this.t) / 1000), this.maxEx);
    return {
      x: this.ax.p + this.ax.v * dt,
      y: this.ay.p + this.ay.v * dt,
      vx: this.ax.v,
      vy: this.ay.v,
      sigma: Math.sqrt((this.ax.P[0] + this.ay.P[0]) / 2),
    };
  }
}
