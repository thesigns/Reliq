// Draws the parchment map: paper + biomes, ink icons, searched areas, markers, post.
//
// The paper, biome washes, graticule and terrain icons only depend on the camera, and they
// are by far the most expensive part. They live in cached base layers (base-cache.js) a
// margin larger than the screen. A pan paints only the strip that comes into view. A zoom
// gesture never repaints the sharp layer: it stretches it, or falls back to a cheap layer
// at half resolution without paper grain. After the gesture the sharp layer is refilled
// over a few frames, so no single frame pays for a whole repaint.

import { program, RenderTarget, FULLSCREEN_VS } from './gl.js';
import { buildAtlas } from './atlas.js';
import { buildIconSet } from './icons.js';
import { terrainIcons, iconLevel } from './terrain.js';
import { BaseCache, wrapPieces } from './base-cache.js';
import { parchmentFS, SPRITE_VS, SPRITE_FS, OVERLAY_FS, POST_FS } from './shaders/map.js';

const SPRITE_FLOATS = 16;
const MAX_BALLS = 64;
const FILL_SHARE = 0.25;   // of the sharp layer painted per frame while it refills

export class MapRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'high-performance' });
    if (!gl) throw Object.assign(new Error('WebGL2 unavailable'), { code: 'webgl' });
    this.gl = gl;
    this.dpr = 1;
    this.ballData = new Float32Array(MAX_BALLS * 4);
    this.baseRedraws = 0;   // times the sharp layer started over (debug readout)
    this.ready = false;
    // Mobile browsers may take the GPU away (backgrounding, memory pressure). Rebuild
    // every GPU resource when it comes back instead of leaving a black map.
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.ready = false; });
    canvas.addEventListener('webglcontextrestored', async () => {
      await this.init();
      if (this.size) this.resize(...this.size);
    });
  }

  async init() {
    const gl = this.gl;
    this.progParchment = program(gl, FULLSCREEN_VS, parchmentFS(true), 'parchment');
    this.progParchmentLow = program(gl, FULLSCREEN_VS, parchmentFS(false), 'parchment-low');
    this.progOverlay = program(gl, FULLSCREEN_VS, OVERLAY_FS, 'overlay');
    this.progPost = program(gl, FULLSCREEN_VS, POST_FS, 'post');
    this.progSprite = program(gl, SPRITE_VS, SPRITE_FS, 'sprite');
    this.scene = new RenderTarget(gl);
    this.sharp = new BaseCache(gl, { scale: 1, marginCss: 96 });
    this.coarse = new BaseCache(gl, { scale: 0.5, marginCss: 160 });
    this.emptyVao = gl.createVertexArray();

    this.atlas = await buildAtlas(gl, buildIconSet());

    // Sprite batch: a shared unit quad plus a per-instance buffer.
    this.spriteVao = gl.createVertexArray();
    gl.bindVertexArray(this.spriteVao);
    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    this.spriteBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.spriteBuf);
    const stride = SPRITE_FLOATS * 4;
    for (let i = 0; i < 4; i++) {
      gl.enableVertexAttribArray(1 + i);
      gl.vertexAttribPointer(1 + i, 4, gl.FLOAT, false, stride, i * 16);
      gl.vertexAttribDivisor(1 + i, 1);
    }
    gl.bindVertexArray(null);
    this.spriteData = new Float32Array(SPRITE_FLOATS * 4096);

    this.ready = true;
  }

  resize(cssW, cssH, dpr) {
    this.size = [cssW, cssH, dpr];
    this.dpr = dpr;
    const w = Math.max(1, Math.round(cssW * dpr));
    const h = Math.max(1, Math.round(cssH * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.scene.resize(w, h);
    this.sharp.resize(cssW, cssH, dpr);
    this.coarse.resize(cssW, cssH, dpr);
  }

  // The local frame moved (the vault was placed): the cached layers show the old one.
  invalidate() {
    this.sharp?.invalidate();
    this.coarse?.invalidate();
  }

  // The sharp layer is still being refilled after a zoom: keep frames coming.
  get filling() { return !!this.sharp?.filling; }

  // view: { w, h (target px), x, y (local m at its centre), k (target px per m), dpr (target px per css px) }
  setView(p, view, time) {
    const gl = this.gl;
    const u = p.u;
    gl.uniform2f(u.u_res, view.w, view.h);
    gl.uniform2f(u.u_cam, view.x, view.y);
    gl.uniform1f(u.u_ppm, view.k);
    gl.uniform1f(u.u_dpr, view.dpr);
    gl.uniform1f(u.u_time, time);
  }

  // Paints one world-pixel rect of a cached layer: paper, biomes and graticule, then the
  // terrain icons north to south so nearer (southern) icons overlap. The rect may wrap
  // around the texture; each piece gets a camera that puts its world pixels on its texels,
  // and the scissor keeps icons from spilling past it.
  paintBase(cache, r, s) {
    const gl = this.gl;
    const k = cache.ppm * cache.dpr;
    const icons = [];
    const area = { x: (r.x0 + r.x1) / 2 / k, y: (r.y0 + r.y1) / 2 / k, ppm: cache.ppm, w: (r.x1 - r.x0) / cache.dpr, h: (r.y1 - r.y0) / cache.dpr };
    terrainIcons(area, s.worldOff, this.atlas.rects, icons, cache.level);
    icons.sort((a, b) => b.y - a.y);
    let n = 0;
    for (const ic of icons) n = this.pushSprite(n, ic.x, ic.y, ic.w, ic.h, 0, 0, 0, 0.5, ic.icon, 1, 1, 1, ic.alpha);
    this.uploadSprites(n);

    const prog = cache.scale < 1 ? this.progParchmentLow : this.progParchment;
    gl.bindFramebuffer(gl.FRAMEBUFFER, cache.fbo);
    gl.viewport(0, 0, cache.w, cache.h);
    gl.enable(gl.SCISSOR_TEST);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    for (const p of wrapPieces(r, cache.w, cache.h)) {
      gl.scissor(p.tx, p.ty, p.w, p.h);
      const view = { w: cache.w, h: cache.h, x: (p.gx - p.tx + cache.w / 2) / k, y: (p.gy - p.ty + cache.h / 2) / k, k, dpr: cache.dpr };
      gl.disable(gl.BLEND);
      gl.useProgram(prog.p);
      this.setView(prog, view, 0);
      gl.uniform2f(prog.u.u_world, s.worldOff.x, s.worldOff.y);
      gl.uniform4f(prog.u.u_grid, s.grid.ox, s.grid.oy, s.grid.sx, s.grid.sy);
      gl.bindVertexArray(this.emptyVao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.enable(gl.BLEND);
      this.drawSprites(n, view, 0);
    }
    gl.disable(gl.SCISSOR_TEST);
  }

  // Picks the cached layer to show this frame, painting what it needs: { cache, sm } with
  // sm from BaseCache.sampler().
  baseFor(s, cam, zooming) {
    const W = this.canvas.width, H = this.canvas.height;
    const key = `${cam.ppm}|${s.grid.step}|${s.worldOff.x}|${s.worldOff.y}`;
    const paint = (cache, r) => this.paintBase(cache, r, s);
    const { sharp, coarse } = this;
    // A pan (also a two-finger one, or a fly to the player) keeps the sharp layer up to
    // date strip by strip. A new zoom starts it over, but never mid-gesture: until the
    // gesture ends it is only stretched, and once refilled it covers the screen again.
    if (sharp.key !== key && !zooming) { sharp.reset(key, cam.ppm, iconLevel(cam.ppm)); this.baseRedraws++; }
    if (sharp.key === key) sharp.update(cam, paint, Math.ceil(sharp.w * sharp.h * FILL_SHARE));
    let sm = sharp.sampler(cam, W, H, this.dpr);
    if (sm) return { cache: sharp, sm };
    if (coarse.key === key) coarse.update(cam, paint);
    sm = coarse.sampler(cam, W, H, this.dpr);
    if (!sm) {
      coarse.reset(key, cam.ppm, iconLevel(cam.ppm));
      coarse.update(cam, paint);
      sm = coarse.sampler(cam, W, H, this.dpr);
    }
    return { cache: coarse, sm };
  }

  // scene: { worldOff, grid, vault, balls, tombs, player, zone }
  // opts.zooming: a pinch / smooth zoom is in progress (stretch the base, refill later).
  render(s, cam, time, opts = {}) {
    if (!this.ready || this.gl.isContextLost()) return;
    const gl = this.gl;
    const W = this.canvas.width, H = this.canvas.height;
    const view = { w: W, h: H, x: cam.x, y: cam.y, k: cam.ppm * this.dpr, dpr: this.dpr };
    const { cache, sm } = this.baseFor(s, cam, !!opts.zooming);

    // 1. Cached base plus searched areas, vault ring, mission zones, GPS accuracy.
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.scene.fbo);
    gl.viewport(0, 0, W, H);
    gl.disable(gl.BLEND);
    const po = this.progOverlay, u = po.u;
    gl.useProgram(po.p);
    this.setView(po, view, time);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, cache.tex);
    gl.uniform1i(u.u_base, 0);
    gl.uniform1i(u.u_exact, sm?.exact ? 1 : 0);
    gl.uniform2i(u.u_shift, sm?.shift?.[0] ?? 0, sm?.shift?.[1] ?? 0);
    gl.uniform2f(u.u_g0, sm?.g0?.[0] ?? 0, sm?.g0?.[1] ?? 0);
    gl.uniform1f(u.u_gs, sm?.gs ?? 1);
    const zone = s.zone;
    gl.uniform4f(u.u_zone, zone?.x ?? 0, zone?.y ?? 0, zone?.radius ?? 0, zone ? 1 : 0);
    // Only areas whose 200 m influence can reach the screen cost shader time.
    const reachX = W / 2 / view.k + 200, reachY = H / 2 / view.k + 200;
    let count = 0;
    for (const b of s.balls) {
      if (count >= MAX_BALLS) break;
      if (Math.abs(b.x - cam.x) > reachX || Math.abs(b.y - cam.y) > reachY) continue;
      this.ballData.set([b.x, b.y, b.scale, b.age], count * 4);
      count++;
    }
    gl.uniform4fv(u.u_balls, this.ballData);
    gl.uniform1i(u.u_count, count);
    gl.uniform3f(u.u_vault, s.vault?.x ?? 0, s.vault?.y ?? 0, s.vault ? 1 : 0);
    gl.uniform4f(u.u_player, s.player?.x ?? 0, s.player?.y ?? 0, s.player?.acc ?? 0, s.player ? 1 : 0);
    gl.bindVertexArray(this.emptyVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // 2. Markers: tombs, vault seal, player needle.
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    let n = 0;
    for (const t of s.tombs) {
      const k = t.scale ?? 1;
      if (k <= 0.01) continue;
      // Centred on the spot where the tomb was found.
      n = this.pushSprite(n, t.x, t.y, 52 * k, 52 * k, 0, 1, 0, 0, 'tomb', 1, 1, 1, Math.min(1, k * 1.5));
    }
    if (s.vault && (s.vault.scale ?? 1) > 0.01) {
      const k = s.vault.scale ?? 1;
      n = this.pushSprite(n, s.vault.x, s.vault.y, 46 * k, (46 * k) / this.atlas.rects.seal.aspect, 0, 1, 0, 0.05, 'seal', 1, 1, 1, Math.min(1, k * 1.5));
    }
    if (s.player) n = this.pushSprite(n, s.player.x, s.player.y, 50, 50, s.player.heading, 1, 0, 0, 'needle', 1, 1, 1, 1);
    this.uploadSprites(n);
    this.drawSprites(n, view, time);

    // 3. Post: grade, vignette, grain.
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.disable(gl.BLEND);
    gl.useProgram(this.progPost.p);
    const up = this.progPost.u;
    gl.uniform2f(up.u_res, W, H);
    gl.uniform1f(up.u_time, time);
    gl.uniform1f(up.u_dpr, this.dpr);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.scene.tex);
    gl.uniform1i(up.u_scene, 0);
    gl.bindVertexArray(this.emptyVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  pushSprite(n, x, y, w, h, rot, mode, ax, ay, icon, r, g, b, a) {
    if (n >= 4096) return n;
    const uv = this.atlas.rects[icon];
    this.spriteData.set([x, y, w, h, rot, mode, ax, ay, uv.u0, uv.v0, uv.u1, uv.v1, r, g, b, a], n * SPRITE_FLOATS);
    return n + 1;
  }

  uploadSprites(n) {
    if (!n) return;
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.spriteBuf);
    gl.bufferData(gl.ARRAY_BUFFER, this.spriteData.subarray(0, n * SPRITE_FLOATS), gl.DYNAMIC_DRAW);
  }

  // Draws the n sprites last uploaded.
  drawSprites(n, view, time) {
    if (!n) return;
    const gl = this.gl;
    gl.useProgram(this.progSprite.p);
    this.setView(this.progSprite, view, time);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.atlas.tex);
    gl.uniform1i(this.progSprite.u.u_tex, 0);
    gl.bindVertexArray(this.spriteVao);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, n);
  }
}
