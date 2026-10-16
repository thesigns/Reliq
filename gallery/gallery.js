// The artifact gallery: every tomb artifact of the game, tier by tier, turning in its niche
// with the game's own models and shader. It reads the game's modules directly, so it always
// shows what the game ships. One WebGL context renders each visible niche in turn and the
// picture is copied into that niche's own small canvas.

import { TIERS, MISSIONS } from '../js/game/rules.js';
import { MODELS } from '../js/render/models/index.js';
import { VERSION } from '../js/version.js';
import { t, getLang, setLang, formatDistance } from '../js/i18n/i18n.js';
import { program } from '../js/render/gl.js';
import { VS, FS, buildArtifactMesh, perspective, mul, rotX, rotY, scaleM, translate } from '../js/render/artifact3d.js';

// Tier colours, lightened for the dark vault (the journal's inks are made for parchment).
const TIER_INK = { wood: '#b98a5c', copper: '#d98a5a', bronze: '#c9a25a', iron: '#9aa1aa', silver: '#c3ccd4', gold: '#e3b545', platinum: '#9fc3cf', diamond: '#7cc4ec' };
const RES = 96;           // rendered pixels across a niche; CSS scales them up with hard edges
const PITCH = 0.38;       // as the reveal shows them
const TURN = 0.45;        // radians a second

const $ = (id) => document.getElementById(id);
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

let cards = [];

function render() {
  document.documentElement.lang = getLang();
  document.title = `Reliq · ${t('gallery.title')}`;
  $('play').textContent = t('gallery.play');
  $('lang').textContent = getLang() === 'pl' ? 'EN' : 'PL';
  $('eyebrow').textContent = t('gallery.version', { v: VERSION });
  $('heading').textContent = t('gallery.title');
  $('intro').textContent = t('gallery.intro');
  $('footer').textContent = t('gallery.footer');
  const old = new Map(cards.map((c) => [c.id, c]));
  cards = [];
  const root = $('tiers');
  root.replaceChildren();
  for (const tier of TIERS) {
    const missions = MISSIONS.filter((m) => m.tier === tier.id);
    if (!missions.length) continue;
    const sec = document.createElement('section');
    sec.className = 'tier';
    sec.style.setProperty('--tier', TIER_INK[tier.id]);
    const meta = t('gallery.tierMeta', { symbol: formatDistance(tier.symbolDistance), tomb: formatDistance(tier.tombDistance), price: tier.price });
    sec.innerHTML = `<div class="tier-head"><h2>${esc(t('tier.label', { tier: t(`tiers.${tier.id}`) }))}</h2><span class="meta">${esc(meta)}</span></div><div class="shelf"></div>`;
    const shelf = sec.querySelector('.shelf');
    for (const { artifact: id } of missions) {
      const model = MODELS[id];
      const name = t(`artifacts.${id}.name`);
      const detail = t(`artifacts.${id}.detail`);
      const card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = `<div class="stage" tabindex="0"><canvas width="${RES}" height="${RES}"></canvas></div>
        <div class="info"><h3>${esc(name)}</h3><p class="lore">${esc(t(`artifacts.${id}.lore`))}</p>${detail !== `artifacts.${id}.detail` ? `<p class="detail">${esc(detail)}</p>` : ''}
        <span class="stats">${esc(t('gallery.stats', { tris: model.tris.length / 4, colors: model.palette.length }))}</span></div>`;
      shelf.appendChild(card);
      const stage = card.querySelector('.stage');
      stage.setAttribute('aria-label', t('gallery.turn', { name }));
      const prev = old.get(id);
      cards.push({ id, model, stage, ctx: card.querySelector('canvas').getContext('2d'), yaw: prev?.yaw ?? -0.6 + cards.length * 0.37, vao: prev?.vao, count: prev?.count, dirty: true });
    }
    root.appendChild(sec);
  }
  wire();
}

// ---- Rendering -------------------------------------------------------------------------
const glCanvas = document.createElement('canvas');
glCanvas.width = glCanvas.height = RES;
const gl = glCanvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, preserveDrawingBuffer: true });
let prog = null;

function upload(card) {
  const data = buildArtifactMesh(card.model);
  card.vao = gl.createVertexArray();
  gl.bindVertexArray(card.vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  for (let i = 0; i < 3; i++) {
    gl.enableVertexAttribArray(i);
    gl.vertexAttribPointer(i, 3, gl.FLOAT, false, 36, i * 12);
  }
  gl.bindVertexArray(null);
  card.count = data.length / 9;
}

const eye = [0, 0, 5.2];
const viewProj = mul(perspective((30 * Math.PI) / 180, 1, 0.5, 20), translate(-eye[0], -eye[1], -eye[2]));

function draw(card) {
  if (!card.vao) upload(card);
  gl.viewport(0, 0, RES, RES);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.useProgram(prog.p);
  gl.uniformMatrix4fv(prog.u.u_model, false, mul(rotX(PITCH), mul(rotY(card.yaw), scaleM(1.05))));
  gl.uniformMatrix4fv(prog.u.u_viewProj, false, viewProj);
  gl.uniform3fv(prog.u.u_eye, eye);
  gl.uniform3fv(prog.u.u_glow, [0.1, 0.08, 0.05]);
  gl.bindVertexArray(card.vao);
  gl.drawArrays(gl.TRIANGLES, 0, card.count);
  card.ctx.clearRect(0, 0, RES, RES);
  card.ctx.drawImage(glCanvas, 0, 0);
}

// ---- Motion: a slow turn while on screen, drag (or arrow keys) to turn by hand ------------
const still = matchMedia('(prefers-reduced-motion: reduce)');
const seen = new IntersectionObserver((entries) => {
  for (const e of entries) {
    const card = cards.find((c) => c.stage === e.target);
    if (card) { card.visible = e.isIntersecting; card.dirty = true; }
  }
}, { rootMargin: '120px' });

function wire() {
  seen.disconnect();
  for (const card of cards) {
    seen.observe(card.stage);
    let x0 = null;
    card.stage.addEventListener('pointerdown', (e) => { x0 = e.clientX; card.held = true; card.stage.setPointerCapture(e.pointerId); });
    card.stage.addEventListener('pointermove', (e) => {
      if (x0 === null) return;
      card.yaw += (e.clientX - x0) * 0.012;
      x0 = e.clientX;
      card.dirty = true;
    });
    const up = () => { x0 = null; card.held = false; };
    card.stage.addEventListener('pointerup', up);
    card.stage.addEventListener('pointercancel', up);
    card.stage.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      card.yaw += e.key === 'ArrowLeft' ? -0.3 : 0.3;
      card.dirty = true;
      e.preventDefault();
    });
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (prog && !gl.isContextLost()) {
    for (const card of cards) {
      if (!card.visible) continue;
      if (!still.matches && !card.held) { card.yaw += TURN * dt; card.dirty = true; }
      if (card.dirty) { draw(card); card.dirty = false; }
    }
  }
  requestAnimationFrame(frame);
}

$('lang').onclick = () => { setLang(getLang() === 'pl' ? 'en' : 'pl'); render(); };
render();
if (gl) {
  prog = program(gl, VS, FS, 'gallery');
  glCanvas.addEventListener('webglcontextlost', (e) => e.preventDefault());
  glCanvas.addEventListener('webglcontextrestored', () => {
    prog = program(gl, VS, FS, 'gallery');
    for (const card of cards) { card.vao = null; card.dirty = true; }
  });
  requestAnimationFrame(frame);
}
