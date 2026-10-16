// "Back at the vault": the finds in the satchel go into the chest. A low-poly chest drops
// in and opens in a burst of light; coins arc down into it one by one, spinning, each
// landing with a clink and sparks in its rarity's colour while the heap of gold swells; an
// artifact descends, hangs over the chest under its name and sinks in with a flash; the
// lid slams shut, and a summary lists what was stored. A tap hurries it along.

import { t } from '../i18n/i18n.js';
import { VaultScene, about, mul, translate, rotX, rotY, scaleM, scale3 } from '../render/vault-scene.js';
import { CHEST_BODY } from '../render/models/chest-body.js';
import { CHEST_LID } from '../render/models/chest-lid.js';
import { CHEST_GOLD } from '../render/models/chest-gold.js';
import { COIN_MODELS } from '../render/models/coins.js';
import { MODELS } from '../render/models/index.js';
import { coinById } from '../game/items.js';
import { Particles } from './particles.js';
import { sfx } from './audio.js';
import { haptics } from './haptics.js';

const SPARKS = {
  common: ['230,180,120'], uncommon: ['215,230,255', '255,255,255'],
  rare: ['255,214,130', '255,240,190'], legendary: ['255,214,120', '255,170,60', '255,244,210'],
};
const SPARK_COUNT = { common: 7, uncommon: 12, rare: 24, legendary: 44 };
const MAX_FLIGHTS = 24;        // more coins than this share the flights between them
const LID_OPEN = -1.95;        // rad about the hinge
const CHEST_YAW = -0.32;       // a three-quarter view, so the chest reads as a box
const COIN_SIZE = 0.34;        // chest units, across a coin
const ARTIFACT_SIZE = 0.95;
const MOUTH = [0, 0.86, 0];

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
const easeInCubic = (x) => x * x * x;
const easeOutBack = (x) => { const c = 1.5; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
function easeOutBounce(x) {
  const n = 7.5625, d = 2.75;
  if (x < 1 / d) return n * x * x;
  if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75;
  if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375;
  return n * (x -= 2.625 / d) * x + 0.984375;
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export class DepositScreen {
  constructor(root) {
    this.root = root;
    this.el = (sel) => root.querySelector(sel);
    this.canvas = this.el('.deposit-scene');
    this.scene = null;   // a WebGL2 context of its own, created on first use
    this.particles = new Particles(this.el('.deposit-particles'));
    this.isOpen = false;
    this.running = false;
    root.addEventListener('pointerdown', (e) => {
      if (this.phase === 'play' && !e.target.closest('button')) this.speed = 3.2;
    });
    for (const b of root.querySelectorAll('[data-go]')) b.onclick = () => this.finish(b.dataset.go);
  }

  ensureScene() {
    if (this.scene) return;
    this.scene = new VaultScene(this.canvas);
    this.scene.add('chest-body', CHEST_BODY);
    this.scene.add('chest-lid', CHEST_LID);
    this.scene.add('chest-gold', CHEST_GOLD);
  }

  // haul: { coins: [{ id, count, rarity }], artifacts: [{ id }] }, as game.deposit()
  // returns it. ui: { coinThumb(id), artifactThumb(id) } for the summary.
  // Resolves 'vault' (open the journal) or 'map'.
  play(haul, ui) {
    this.ensureScene();
    this.haul = haul;
    this.ui = ui;
    for (const c of haul.coins) this.scene.add(`coin:${c.id}`, COIN_MODELS[c.id], COIN_SIZE);
    for (const a of haul.artifacts) this.scene.add(`art:${a.id}`, MODELS[a.id], ARTIFACT_SIZE);

    const r = this.root;
    r.hidden = false;
    r.classList.remove('show', 'lit', 'glare', 'summary', 'closing');
    this.isOpen = true;
    this.el('.deposit-label').textContent = t('deposit.label');
    this.el('.deposit-title').textContent = t('deposit.title');
    this.el('.dt-label').textContent = t('deposit.coins');
    this.el('.dt-value').textContent = '0';
    this.el('.deposit-hint').textContent = t('deposit.hint');
    this.el('.deposit-callout').textContent = '';
    this.el('.deposit-callout').classList.remove('go', 'hold');
    this.el('.deposit-tally').hidden = !haul.coins.length;
    this.layout();
    this.particles.clear();
    this.buildTimeline();

    this.phase = 'play';
    this.speed = 1;
    this.time = 0;
    this.fired = new Set();
    this.heapBump = 0;
    this.landed = 0;
    this.lastTap = 0;
    this.last = performance.now();
    requestAnimationFrame(() => r.classList.add('show'));
    sfx.swell(0.8);
    if (!this.running) {
      this.running = true;
      requestAnimationFrame(() => this.loop());
    }
    return new Promise((resolve) => { this.resolve = resolve; });
  }

  // The camera keeps the chest about the same width on any screen, with room above it for
  // the coins to fall through.
  layout() {
    const w = this.root.clientWidth, h = this.root.clientHeight;
    const dpr = document.documentElement.classList.contains('inspect') ? 2 : Math.min(devicePixelRatio || 1, 2);
    this.particles.resize(w, h, dpr);
    this.scene.resize(w, h);
    const fov = (34 * Math.PI) / 180;
    const viewH = Math.max(2.9 / (w / h), 3.6);
    const dist = viewH / 2 / Math.tan(fov / 2);
    const target = [0, 1.05, 0];
    const dir = [0, 0.4, 1];
    const len = Math.hypot(...dir);
    this.camera = { fov, target, eye: target.map((v, i) => v + (dir[i] / len) * dist) };
    this.spawnY = target[1] + viewH * 0.62;
    const mouth = this.scene.project(this.camera, MOUTH);
    const foot = this.scene.project(this.camera, [0, -0.05, 0.6]);
    this.mouth = mouth;
    this.root.style.setProperty('--mx', `${mouth.x}px`);
    this.root.style.setProperty('--my', `${mouth.y}px`);
    this.root.style.setProperty('--ty', `${foot.y + 14}px`);
  }

  buildTimeline() {
    const { coins, artifacts } = this.haul;
    const total = coins.reduce((a, c) => a + c.count, 0);
    // Each kind flies at least once; past MAX_FLIGHTS a flight stands for several coins.
    const k = total > MAX_FLIGHTS ? MAX_FLIGHTS / total : 1;
    const flights = [];
    for (const c of coins) {
      const n = Math.max(1, Math.round(c.count * k));
      for (let i = 0; i < n; i++) flights.push({ coin: c, metal: coinById(c.id).metal, share: c.count / n, first: i === 0 });
    }
    const tOpen = 1.0;
    const start = tOpen + 0.7;
    const span = Math.min(2.8, 0.35 + flights.length * 0.17);
    const gap = flights.length > 1 ? span / flights.length : 0;
    const c = Math.cos(CHEST_YAW), s = Math.sin(CHEST_YAW);
    flights.forEach((f, i) => {
      f.key = `coin:${f.coin.id}`;
      f.t0 = start + i * gap;
      f.dur = 0.62 + Math.random() * 0.18;
      f.from = [(Math.random() * 2 - 1) * 1.15, this.spawnY + Math.random() * 0.6, 0.1 + (Math.random() * 2 - 1) * 0.3];
      // The landing point inside the chest, turned with it.
      const lx = (Math.random() * 2 - 1) * 0.42, lz = (Math.random() * 2 - 1) * 0.16;
      f.to = [c * lx + s * lz, 0.7, -s * lx + c * lz];
      f.spin = (9 + Math.random() * 6) * (Math.random() < 0.5 ? -1 : 1);
      f.tumble = 2 + Math.random() * 3;
      f.phase = Math.random() * 6;
    });
    let end = flights.length ? flights[flights.length - 1].t0 + flights[flights.length - 1].dur : tOpen + 0.7;
    let art = null;
    if (artifacts.length) {
      const a = artifacts[0];
      art = { key: `art:${a.id}`, id: a.id, t0: end + 0.35 };
      art.tHover = art.t0 + 1.1;
      art.tDrop = art.tHover + 1.5;
      art.tIn = art.tDrop + 0.38;
      end = art.tIn;
    }
    this.tl = { total, flights, art, tOpen, tClose: end + 0.5, tSummary: end + 1.3 };
  }

  // Runs once per scene time t.
  at(name, when, fn) {
    if (this.time >= when && !this.fired.has(name)) { this.fired.add(name); fn(); }
  }

  loop() {
    if (!this.running) return;
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    if (this.phase === 'play') this.time += dt * this.speed;
    this.step(dt);
    this.particles.update(dt);
    requestAnimationFrame(() => this.loop());
  }

  step(dt) {
    const tl = this.tl, T = this.time;
    const mouth = this.mouth;

    // 1. The chest drops in and bounces.
    const kIn = clamp01(T / 0.75);
    const chestY = 3 * (1 - easeOutBounce(kIn));
    this.at('land', 0.75 / 2.75, () => {
      sfx.slam();
      haptics.dig();
      this.particles.dust(mouth.x, this.scene.project(this.camera, [0, 0, 0.5]).y, 1.2);
      this.shake();
    });

    // 2. The lock clicks, the lid swings open and light pours out.
    this.at('latch', tl.tOpen - 0.15, () => sfx.latch());
    this.at('open', tl.tOpen, () => sfx.creak());
    this.at('light', tl.tOpen + 0.18, () => {
      this.root.classList.add('lit');
      sfx.chime('rare');
      this.particles.sparks(mouth.x, mouth.y, 36, SPARKS.rare);
    });
    let lid = 0;
    if (T >= tl.tOpen) lid = LID_OPEN * easeOutBack(clamp01((T - tl.tOpen) / 0.55));
    if (T >= tl.tClose) lid = LID_OPEN * (1 - easeInCubic(clamp01((T - tl.tClose) / 0.24)));
    const open = T >= tl.tOpen + 0.18 && T < tl.tClose + 0.24;
    if (open && Math.random() < dt * 10) {
      this.particles.motes(1, SPARKS.rare, { x: mouth.x - 70, y: mouth.y - 40, w: 140, h: 40 });
    }

    // 3. Coins.
    const items = [];
    for (const f of tl.flights) {
      if (T < f.t0) continue;
      const u = clamp01((T - f.t0) / f.dur);
      if (u >= 1) { this.at(f, f.t0 + f.dur, () => this.land(f)); continue; }
      const e = u * u * (3 - 2 * u);
      const p = [f.from[0] + (f.to[0] - f.from[0]) * e, f.from[1] + (f.to[1] - f.from[1]) * Math.pow(u, 1.7), f.from[2] + (f.to[2] - f.from[2]) * e];
      const age = T - f.t0;
      const m = mul(translate(p[0], p[1], p[2]), mul(rotY(f.spin * age), mul(rotX(f.tumble * age + f.phase), scaleM(Math.min(1, 0.55 + u * 2)))));
      items.push({ key: f.key, matrix: m, glow: [0.14, 0.1, 0.04] });
    }

    // 4. The artifact: down from above, a moment over the chest, then in.
    const art = tl.art;
    if (art && T >= art.t0 && T < art.tIn) {
      this.at('art', art.t0, () => {
        sfx.swell(1.1);
        this.callout(t(`artifacts.${art.id}.name`), 'artifact', true);
        this.root.classList.add('glare');
      });
      let y, s = 1;
      if (T < art.tHover) y = this.spawnY + 0.4 + (1.95 - this.spawnY - 0.4) * easeOutCubic((T - art.t0) / 1.1);
      else if (T < art.tDrop) y = 1.95 + Math.sin((T - art.tHover) * 3) * 0.04;
      else {
        const k = easeInCubic(clamp01((T - art.tDrop) / 0.38));
        y = 1.95 + (0.6 - 1.95) * k;
        s = 1 - 0.35 * k;
      }
      const yaw = (T - art.t0) * 1.6 + 0.5;
      items.push({ key: art.key, matrix: mul(translate(0, y, 0), mul(rotY(yaw), mul(rotX(0.18), scaleM(s)))), glow: [0.42, 0.3, 0.12] });
    }
    if (art) {
      this.at('artIn', art.tIn, () => {
        this.root.classList.remove('glare');
        this.el('.deposit-callout').classList.remove('hold');
        this.flash();
        sfx.boom();
        sfx.chime('legendary');
        haptics.reveal('legendary');
        this.heapBump = 1.4;
        this.particles.sparks(mouth.x, mouth.y, 90, SPARKS.legendary);
      });
    }

    // 5. The lid slams, the lock catches, the summary comes up.
    this.at('slam', tl.tClose + 0.24, () => {
      this.root.classList.remove('lit');
      sfx.slam();
      haptics.dig();
      this.shake(true);
      const side = this.scene.project(this.camera, [0, 0.8, 0.5]);
      this.particles.dust(side.x - 80, side.y, 0.8);
      this.particles.dust(side.x + 80, side.y, 0.8);
    });
    this.at('lock', tl.tClose + 0.42, () => sfx.latch());
    this.at('summary', tl.tSummary, () => this.showSummary());

    // The chest, with its lid on the hinge and the heap swelling as coins land.
    this.heapBump *= Math.exp(-dt * 6);
    const fill = tl.total ? this.landed / tl.total : 0;
    const heapGlow = open ? 0.55 + 0.15 * Math.sin(T * 3) + this.heapBump * 0.5 : 0;
    const chest = mul(translate(0, chestY, 0), rotY(CHEST_YAW));
    const bodyGlow = open ? [0.08, 0.05, 0.02] : [0, 0, 0];
    items.push({ key: 'chest-body', matrix: chest, glow: bodyGlow });
    items.push({ key: 'chest-lid', matrix: about(chest, CHEST_LID.pivot, rotX(lid)), glow: bodyGlow });
    items.push({ key: 'chest-gold', matrix: about(chest, CHEST_GOLD.pivot, scale3(1, 1 + fill * 0.1 + this.heapBump * 0.06, 1)), glow: [heapGlow, heapGlow * 0.7, heapGlow * 0.25] });
    this.scene.render(this.camera, items);
  }

  land(f) {
    const tl = this.tl;
    this.landed += f.share;
    const shown = f === tl.flights[tl.flights.length - 1] ? tl.total : Math.round(this.landed);
    const v = this.el('.dt-value');
    v.textContent = `+${shown}`;
    v.classList.remove('pop');
    void v.offsetWidth;
    v.classList.add('pop');
    sfx.clink(f.metal);
    const now = performance.now();
    if (now - this.lastTap > 70) { haptics.tap(); this.lastTap = now; }
    const p = this.scene.project(this.camera, f.to);
    const rarity = f.coin.rarity;
    this.particles.sparks(p.x, p.y, SPARK_COUNT[rarity], SPARKS[rarity]);
    this.heapBump = Math.min(1.2, this.heapBump + 0.5);
    if (f.first && (rarity === 'rare' || rarity === 'legendary')) sfx.chime(rarity);
  }

  // A line over the scene: an artifact's name, held (hold) until it sinks into the chest.
  callout(text, kind, hold = false) {
    const el = this.el('.deposit-callout');
    el.textContent = text;
    el.dataset.kind = kind;
    el.classList.remove('go', 'hold');
    void el.offsetWidth;
    el.classList.add(hold ? 'hold' : 'go');
  }

  shake(big = false) {
    const s = this.el('.deposit-stage');
    s.classList.remove('shake', 'shake-big');
    void s.offsetWidth;
    s.classList.add(big ? 'shake-big' : 'shake');
  }

  flash() {
    const f = this.el('.flash');
    f.classList.remove('go');
    void f.offsetWidth;
    f.classList.add('go');
  }

  showSummary() {
    this.phase = 'summary';
    const { coins, artifacts } = this.haul;
    const img = (thumb) => (thumb ? `<img alt="" src="${thumb.url}">` : '');
    let html = '';
    for (const a of artifacts) {
      html += `<div class="ds-item ds-art">${img(this.ui.artifactThumb(a.id))}<span class="ds-name">${esc(t(`artifacts.${a.id}.name`))}</span><span class="ds-note">${esc(t('deposit.onShelf'))}</span></div>`;
    }
    for (const c of coins) {
      html += `<div class="ds-item">${img(this.ui.coinThumb(c.id))}<span class="ds-count">×${c.count}</span></div>`;
    }
    this.el('.ds-title').textContent = t('deposit.summary');
    this.el('.ds-items').innerHTML = html;
    this.el('[data-go="vault"]').textContent = t('deposit.open');
    this.root.classList.add('summary');
    sfx.paper();
  }

  async finish(where) {
    if (this.phase !== 'summary') return;
    this.phase = 'done';
    sfx.click();
    this.root.classList.add('closing');
    await wait(420);
    this.running = false;
    this.isOpen = false;
    this.root.hidden = true;
    this.scene.render(this.camera, []);
    this.resolve?.(where);
  }
}
