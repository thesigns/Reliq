// Draws the parchment map: paper + biomes, ink icons, searched areas, markers, post.
//
// The paper, biome washes, graticule and terrain icons only depend on the camera, and they
// are by far the most expensive part. They are rendered into a cached "base" layer with a
// margin around the screen, and each frame just copies it at a whole-pixel offset. The base
// is redrawn only when the camera has moved past the margin or the zoom changed, so a
// player walking with the camera following redraws it every ~20 s instead of every frame.

import { program, RenderTarget, FULLSCREEN_VS } from './gl.js';
import { buildAtlas } from './atlas.js';
import { buildIconSet } from './icons.js';
import { terrainIcons, lodFading } from './terrain.js';
import { PARCHMENT_FS, SPRITE_VS, SPRITE_FS, OVERLAY_FS, POST_FS, COPY_FS, COPY_SCALED_FS } from './shaders/map.js';

const SPRITE_FLOATS = 16;
const MAX_BALLS = 64;
const MAX_EXCL = 32;
const BASE_MARGIN_CSS = 96;

export class MapRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'high-performance' });
    if (!gl) throw Object.assign(new Error('WebGL2 unavailable'), { code: 'webgl' });
    this.gl = gl;
    this.dpr = 1;
    this.ballData = new Float32Array(MAX_BALLS * 4);
    this.exclData = new Float32Array(MAX_EXCL * 2);
    this.baseView = null;   // camera the cached base layer was drawn with
    this.baseRedraws = 0;
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
    this.progParchment = program(gl, FULLSCREEN_VS, PARCHMENT_FS, 'parchment');
    this.progOverlay = program(gl, FULLSCREEN_VS, OVERLAY_FS, 'overlay');
    this.progPost = program(gl, FULLSCREEN_VS, POST_FS, 'post');
    this.progSprite = program(gl, SPRITE_VS, SPRITE_FS, 'sprite');
    this.progCopy = program(gl, FULLSCREEN_VS, COPY_FS, 'copy');
    this.progCopyScaled = program(gl, FULLSCREEN_VS, COPY_SCALED_FS, 'copy-scaled');
    this.scene = new RenderTarget(gl);
    this.base = new RenderTarget(gl);
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

    this.baseView = null;
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
    this.margin = Math.round(BASE_MARGIN_CSS * dpr);
    this.base.resize(w + 2 * this.margin, h + 2 * this.margin);
    this.baseView = null;
  }

  // view: { w, h (device px), x, y (local m at centre), ppm (css px per m) }
  setView(p, view, time) {
    const gl = this.gl;
    const u = p.u;
    gl.uniform2f(u.u_res, view.w, view.h);
    gl.uniform2f(u.u_cam, view.x, view.y);
    gl.uniform1f(u.u_ppm, view.ppm * this.dpr);
    gl.uniform1f(u.u_dpr, this.dpr);
    gl.uniform1f(u.u_time, time);
  }

  // Redraw the cached base layer (paper, biomes, graticule, terrain icons) for this camera.
  drawBase(s, cam, time) {
    const gl = this.gl;
    const view = { w: this.base.w, h: this.base.h, x: cam.x, y: cam.y, ppm: cam.ppm };
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.base.fbo);
    gl.viewport(0, 0, view.w, view.h);
    gl.disable(gl.BLEND);

    gl.useProgram(this.progParchment.p);
    this.setView(this.progParchment, view, time);
    gl.uniform2f(this.progParchment.u.u_world, s.worldOff.x, s.worldOff.y);
    gl.uniform4f(this.progParchment.u.u_grid, s.grid.ox, s.grid.oy, s.grid.sx, s.grid.sy);
    gl.bindVertexArray(this.emptyVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Terrain icons, north to south so nearer (southern) icons overlap.
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const icons = [];
    terrainIcons({ x: cam.x, y: cam.y, ppm: cam.ppm, w: view.w / this.dpr, h: view.h / this.dpr }, s.worldOff, this.atlas.rects, icons);
    icons.sort((a, b) => b.y - a.y);
    let n = 0;
    for (const ic of icons) n = this.pushSprite(n, ic.x, ic.y, ic.w, ic.h, 0, 0, 0, 0.5, ic.icon, 1, 1, 1, ic.alpha);
    this.drawSprites(n, view, time);

    this.baseView = { x: cam.x, y: cam.y, ppm: cam.ppm, gridStep: s.grid.step };
    this.baseRedraws++;
  }

  // Whole-device-pixel offset of the current camera within the cached base, or null if
  // the cache cannot serve this frame.
  baseOffset(s, cam) {
    const b = this.baseView;
    if (!b || b.ppm !== cam.ppm || b.gridStep !== s.grid.step || lodFading()) return null;
    const k = cam.ppm * this.dpr;
    const ox = Math.round((cam.x - b.x) * k), oy = Math.round((cam.y - b.y) * k);
    if (Math.abs(ox) > this.margin - 2 || Math.abs(oy) > this.margin - 2) return null;
    return { ox, oy };
  }

  // During a zoom gesture: can the cached base simply be stretched to this zoom?
  // Only for moderate ratios, so the margin still covers the screen when zooming out.
  stretchable(s, cam) {
    const b = this.baseView;
    if (!b || b.gridStep !== s.grid.step) return false;
    const k = cam.ppm / b.ppm;
    if (k < 0.78 || k > 2) return false;
    const reach = (Math.max(this.canvas.width, this.canvas.height) / 2) * (1 / k - 1);
    const shift = Math.hypot(cam.x - b.x, cam.y - b.y) * b.ppm * this.dpr;
    return reach + shift < this.margin - 2;
  }

  // scene: { worldOff, grid, vault, balls, tombs, player, zone, exclusions }
  // opts.zooming: a pinch / smooth zoom is in progress (stretch the base, redraw later).
  render(s, cam, time, opts = {}) {
    if (!this.ready || this.gl.isContextLost()) return;
    const gl = this.gl;
    const W = this.canvas.width, H = this.canvas.height;
    const view = { w: W, h: H, x: cam.x, y: cam.y, ppm: cam.ppm };

    // 1–2. Base layer from cache: shifted, stretched while zooming, or redrawn.
    let off = this.baseOffset(s, cam);
    const stretch = !off && opts.zooming && this.stretchable(s, cam);
    if (!off && !stretch) {
      this.drawBase(s, cam, time);
      off = { ox: 0, oy: 0 };
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.scene.fbo);
    gl.viewport(0, 0, W, H);
    gl.disable(gl.BLEND);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.base.tex);
    if (stretch) {
      const b = this.baseView, p = this.progCopyScaled;
      gl.useProgram(p.p);
      gl.uniform1i(p.u.u_base, 0);
      gl.uniform2f(p.u.u_baseRes, this.base.w, this.base.h);
      gl.uniform2f(p.u.u_res, W, H);
      gl.uniform2f(p.u.u_centre, (cam.x - b.x) * b.ppm * this.dpr + this.base.w / 2, (cam.y - b.y) * b.ppm * this.dpr + this.base.h / 2);
      gl.uniform1f(p.u.u_k, cam.ppm / b.ppm);
    } else {
      gl.useProgram(this.progCopy.p);
      gl.uniform1i(this.progCopy.u.u_base, 0);
      gl.uniform2i(this.progCopy.u.u_shift, this.margin + off.ox, this.margin + off.oy);
    }
    gl.bindVertexArray(this.emptyVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    // 3. Searched areas, vault ring, mission zones, GPS accuracy.
    gl.useProgram(this.progOverlay.p);
    this.setView(this.progOverlay, view, time);
    const zone = s.zone;
    gl.uniform4f(this.progOverlay.u.u_zone, zone?.x ?? 0, zone?.y ?? 0, zone?.radius ?? 0, zone ? 1 : 0);
    const excl = (s.exclusions ?? []).slice(0, MAX_EXCL);
    excl.forEach((p, i) => this.exclData.set([p.x, p.y], i * 2));
    gl.uniform2fv(this.progOverlay.u.u_excl, this.exclData);
    gl.uniform1i(this.progOverlay.u.u_exclCount, excl.length);
    // Only areas whose 200 m influence can reach the screen cost shader time.
    const reachX = W / 2 / (cam.ppm * this.dpr) + 200, reachY = H / 2 / (cam.ppm * this.dpr) + 200;
    let count = 0;
    for (const b of s.balls) {
      if (count >= MAX_BALLS) break;
      if (Math.abs(b.x - cam.x) > reachX || Math.abs(b.y - cam.y) > reachY) continue;
      this.ballData.set([b.x, b.y, b.scale, b.age], count * 4);
      count++;
    }
    gl.uniform4fv(this.progOverlay.u.u_balls, this.ballData);
    gl.uniform1i(this.progOverlay.u.u_count, count);
    gl.uniform3f(this.progOverlay.u.u_vault, s.vault?.x ?? 0, s.vault?.y ?? 0, s.vault ? 1 : 0);
    gl.uniform4f(this.progOverlay.u.u_player, s.player?.x ?? 0, s.player?.y ?? 0, s.player?.acc ?? 0, s.player ? 1 : 0);
    gl.bindVertexArray(this.emptyVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // 4. Markers: tombs, vault seal, player needle.
    let n = 0;
    for (const t of s.tombs) {
      const k = t.scale ?? 1;
      if (k <= 0.01) continue;
      n = this.pushSprite(n, t.x, t.y, 64 * k, (64 * k) / this.atlas.rects.tomb.aspect, 0, 1, 0, 0.12, 'tomb', 1, 1, 1, Math.min(1, k * 1.5));
    }
    if (s.vault && (s.vault.scale ?? 1) > 0.01) {
      const k = s.vault.scale ?? 1;
      n = this.pushSprite(n, s.vault.x, s.vault.y, 46 * k, (46 * k) / this.atlas.rects.seal.aspect, 0, 1, 0, 0.05, 'seal', 1, 1, 1, Math.min(1, k * 1.5));
    }
    if (s.player) n = this.pushSprite(n, s.player.x, s.player.y, 50, 50, s.player.heading, 1, 0, 0, 'needle', 1, 1, 1, 1);
    this.drawSprites(n, view, time);

    // 5. Post: grade, vignette, burnt edges, grain.
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

  drawSprites(n, cam, time) {
    if (!n) return;
    const gl = this.gl;
    gl.useProgram(this.progSprite.p);
    this.setView(this.progSprite, cam, time);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.atlas.tex);
    gl.uniform1i(this.progSprite.u.u_tex, 0);
    gl.bindVertexArray(this.spriteVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.spriteBuf);
    gl.bufferData(gl.ARRAY_BUFFER, this.spriteData.subarray(0, n * SPRITE_FLOATS), gl.DYNAMIC_DRAW);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, n);
  }

}
