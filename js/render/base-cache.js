// A cached copy of the map's base layer (paper, biomes, graticule, terrain icons), the
// costly part of the map, kept a margin larger than the screen.
//
// The texture is toroidal: world pixel (gx, gy) at the cache's zoom lives at texel
// (gx mod w, gy mod h), so a pan only paints the strip that has come into view instead of
// the whole layer. `valid` is the world-pixel rectangle the texture holds right now; it is
// never larger than the texture. The base shader is the same everywhere, so strips painted
// at different times meet without a seam.

import { RenderTarget } from './gl.js';

const mod = (a, n) => ((a % n) + n) % n;

function intersect(a, b) {
  const r = { x0: Math.max(a.x0, b.x0), y0: Math.max(a.y0, b.y0), x1: Math.min(a.x1, b.x1), y1: Math.min(a.y1, b.y1) };
  return r.x0 < r.x1 && r.y0 < r.y1 ? r : null;
}

const contains = (r, x0, y0, x1, y1) => !!r && x0 >= r.x0 && y0 >= r.y0 && x1 <= r.x1 && y1 <= r.y1;

// Strips (world px rects) to paint so that `valid` grows towards `target`, at most about
// `budget` pixels of them (rounded up to whole rows). Sides come first and rows after, so
// valid stays a rectangle.
// Returns { strips, valid } with the grown rectangle.
export function planStrips(valid, target, budget = Infinity) {
  const t = target;
  const v = (valid && intersect(valid, t)) ?? { x0: t.x0, y0: t.y0, x1: t.x1, y1: t.y0 };
  const strips = [];
  let left = budget;
  const take = (x0, y0, x1, y1) => { strips.push({ x0, y0, x1, y1 }); left -= (x1 - x0) * (y1 - y0); };
  const vh = v.y1 - v.y0;
  if (vh > 0) {
    if (v.x0 > t.x0 && left > 0) { const n = Math.min(v.x0 - t.x0, Math.max(1, Math.ceil(left / vh))); take(v.x0 - n, v.y0, v.x0, v.y1); v.x0 -= n; }
    if (v.x1 < t.x1 && left > 0) { const n = Math.min(t.x1 - v.x1, Math.max(1, Math.ceil(left / vh))); take(v.x1, v.y0, v.x1 + n, v.y1); v.x1 += n; }
  }
  if (v.x0 === t.x0 && v.x1 === t.x1) {
    const w = t.x1 - t.x0;
    if (v.y0 > t.y0 && left > 0) { const n = Math.min(v.y0 - t.y0, Math.max(1, Math.ceil(left / w))); take(t.x0, v.y0 - n, t.x1, v.y0); v.y0 -= n; }
    if (v.y1 < t.y1 && left > 0) { const n = Math.min(t.y1 - v.y1, Math.max(1, Math.ceil(left / w))); take(t.x0, v.y1, t.x1, v.y1 + n); v.y1 += n; }
  }
  return { strips, valid: v };
}

// Splits a world-pixel rect (no larger than the texture) at the texture's wrap into at
// most four pieces: { gx, gy } its world-pixel corner, { tx, ty } the texel there, w, h.
export function wrapPieces(r, tw, th) {
  const split = (a, b, n) => {
    const t = mod(a, n), len = b - a;
    return t + len <= n ? [[a, t, len]] : [[a, t, n - t], [a + n - t, 0, len - (n - t)]];
  };
  const pieces = [];
  for (const [gx, tx, w] of split(r.x0, r.x1, tw)) {
    for (const [gy, ty, h] of split(r.y0, r.y1, th)) pieces.push({ gx, gy, tx, ty, w, h });
  }
  return pieces;
}

const sameRect = (a, b) => !!a && !!b && a.x0 === b.x0 && a.y0 === b.y0 && a.x1 === b.x1 && a.y1 === b.y1;

export class BaseCache {
  // scale: cache px per screen device px (1 sharp, 0.5 the cheap layer for zoom gestures).
  // marginCss: how far past the screen it reaches, in css px.
  constructor(gl, { scale = 1, marginCss = 96 } = {}) {
    this.target = new RenderTarget(gl, { wrap: gl.REPEAT });
    this.scale = scale;
    this.marginCss = marginCss;
    this.invalidate();
  }

  get tex() { return this.target.tex; }
  get fbo() { return this.target.fbo; }
  get w() { return this.target.w; }
  get h() { return this.target.h; }

  resize(cssW, cssH, dpr) {
    this.dpr = dpr * this.scale;     // cache px per css px
    this.sw = Math.max(1, Math.round(cssW * this.dpr));
    this.sh = Math.max(1, Math.round(cssH * this.dpr));
    const m = Math.round(this.marginCss * this.dpr);
    this.target.resize(this.sw + 2 * m, this.sh + 2 * m);
    this.invalidate();
  }

  invalidate() {
    this.key = null;
    this.valid = null;
    this.filling = false;
  }

  // Starts over for a new zoom (or grid, or frame): nothing held yet, filled from scratch.
  reset(key, ppm, level) {
    this.key = key;
    this.ppm = ppm;
    this.level = level;
    this.valid = null;
    this.filling = true;
    this.lastWindow = null;
  }

  // The world-pixel window centred on the camera: the screen plus the margin.
  windowFor(cam) {
    const k = this.ppm * this.dpr;
    const x0 = Math.round(cam.x * k - this.sw / 2) - (this.w - this.sw) / 2;
    const y0 = Math.round(cam.y * k - this.sh / 2) - (this.h - this.sh) / 2;
    return { x0, y0, x1: x0 + this.w, y1: y0 + this.h };
  }

  // Brings the texture towards the window for this camera: paint(cache, rect) draws one
  // world-pixel rect. While filling after a reset, at most `budget` pixels a call; after
  // that it only paints what a pan uncovers, and skips moves of a few pixels.
  update(cam, paint, budget = Infinity) {
    const t = this.windowFor(cam);
    const lw = this.lastWindow;
    const slack = Math.max(2, Math.round(4 * this.dpr));
    if (!this.filling && lw && Math.abs(t.x0 - lw.x0) < slack && Math.abs(t.y0 - lw.y0) < slack) return;
    const { strips, valid } = planStrips(this.valid, t, this.filling ? budget : Infinity);
    for (const r of strips) paint(this, r);
    this.valid = valid;
    if (sameRect(valid, t)) { this.filling = false; this.lastWindow = t; }
  }

  // How to sample this cache for a camera, or null if it does not cover the screen.
  // exact: same zoom at full sharpness, copied at a whole-pixel shift; otherwise stretched
  // with bilinear filtering: g = g0 + fragCoord * gs, in this cache's world px.
  sampler(cam, screenW, screenH, screenDpr) {
    if (!this.valid) return null;
    const k = this.ppm * this.dpr;
    if (this.ppm === cam.ppm && this.scale === 1) {
      const ox = Math.round(cam.x * k - this.sw / 2), oy = Math.round(cam.y * k - this.sh / 2);
      if (!contains(this.valid, ox, oy, ox + this.sw, oy + this.sh)) return null;
      return { exact: true, shift: [mod(ox, this.w), mod(oy, this.h)] };
    }
    const r = cam.ppm / this.ppm;
    if (r < 0.4 || r > 2.5) return null;
    const gs = k / (cam.ppm * screenDpr);
    const gx0 = cam.x * k - (screenW / 2) * gs, gy0 = cam.y * k - (screenH / 2) * gs;
    if (!contains(this.valid, Math.floor(gx0) - 1, Math.floor(gy0) - 1, Math.ceil(gx0 + screenW * gs) + 1, Math.ceil(gy0 + screenH * gs) + 1)) return null;
    return { exact: false, g0: [mod(gx0, this.w), mod(gy0, this.h)], gs };
  }
}
