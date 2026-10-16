// Full-screen reveal of a find: a low-poly coin with rarity staging, a low-poly tomb artifact,
// or a paper card (junk from the notebook, a key shard, a discovered tomb).

import { t, formatDistance } from '../i18n/i18n.js';
import { coinById } from '../game/items.js';
import { ArtifactRenderer } from '../render/artifact3d.js';
import { COIN_MODELS } from '../render/models/coins.js';
import { Particles } from './particles.js';
import { junkSketch } from './junk-art.js';
import { shardSketch, gateSketch } from './gate-art.js';
import { sfx } from './audio.js';
import { haptics } from './haptics.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
const easeOutBack = (x) => { const c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };

const GLOW = {
  common: [0.05, 0.035, 0.02], uncommon: [0.07, 0.09, 0.13], rare: [0.22, 0.15, 0.05], legendary: [0.4, 0.24, 0.06],
};
const SPARKS = {
  common: ['230,180,120'], uncommon: ['215,230,255', '255,255,255'],
  rare: ['255,214,130', '255,240,190'], legendary: ['255,214,120', '255,170,60', '255,244,210'],
  tomb: ['255,214,130'],
};

export class Reveal {
  constructor(root) {
    this.root = root;
    this.el = (sel) => root.querySelector(sel);
    this.coinCanvas = this.el('#reveal-coin');
    this.coin = new ArtifactRenderer(this.coinCanvas);
    this.particles = new Particles(this.el('#reveal-particles'));
    this.card = this.el('#paper-card');
    this.running = false;
    this.pose = null;
    this.coinCanvas.addEventListener('click', () => this.flip());
    this.artCanvas = this.el('#reveal-artifact');
    this.artifact = null; // created on first use: a second WebGL context
    this.wireDrag();
  }

  // Dragging turns the artifact; letting go keeps some spin, which then eases back to
  // the slow idle turn.
  wireDrag() {
    const c = this.artCanvas;
    let last = null;
    c.addEventListener('pointerdown', (e) => {
      const p = this.pose;
      if (!p || p.kind !== 'artifact' || p.mode !== 'idle') return;
      c.setPointerCapture(e.pointerId);
      last = { x: e.clientX, y: e.clientY, t: performance.now() };
      p.drag = true;
      p.vel = 0;
    });
    c.addEventListener('pointermove', (e) => {
      const p = this.pose;
      if (!last || !p?.drag) return;
      const now = performance.now();
      const dx = e.clientX - last.x, dy = e.clientY - last.y;
      p.yaw += dx * 0.012;
      p.pitch = Math.max(-0.2, Math.min(1.1, p.pitch + dy * 0.008));
      p.vel = (dx * 0.012) / Math.max(0.008, (now - last.t) / 1000);
      last = { x: e.clientX, y: e.clientY, t: now };
    });
    const end = () => {
      if (this.pose?.drag) this.pose.drag = false;
      last = null;
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
  }

  layout() {
    const w = this.root.clientWidth, h = this.root.clientHeight;
    const dpr = document.documentElement.classList.contains('inspect') ? 2 : Math.min(devicePixelRatio || 1, 2);
    this.particles.resize(w, h, dpr);
    const size = Math.min(w * 0.78, h * 0.42, 360);
    this.coinCanvas.style.width = this.coinCanvas.style.height = `${size}px`;
    this.coin.resize(size);
    this.artCanvas.style.width = this.artCanvas.style.height = `${size}px`;
    this.artifact?.resize(size);
    const stage = this.el('.reveal-stage');
    this.center = { x: w / 2, y: stage.offsetTop + stage.offsetHeight / 2 };
  }

  flip() {
    if (!this.pose || this.pose.mode !== 'idle') return;
    sfx.click();
    haptics.tap();
    this.pose.flipFrom = this.pose.target;
    this.pose.target += Math.PI;
    this.pose.flipT = 0;
  }

  loop() {
    if (!this.running) return;
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const p = this.pose;
    if (p?.kind === 'artifact') {
      this.poseArtifact(p, now, dt);
    } else if (p) {
      const e = (now - p.t0) / 1000;
      let spin, scale, y;
      if (p.mode === 'enter') {
        const k = Math.min(1, e / (p.dur ?? 2.3));
        spin = p.target + (1 - easeOutCubic(k)) * Math.PI * (p.spins ?? 7);
        scale = 0.25 + 0.75 * easeOutBack(Math.min(1, e / 1.0));
        y = -0.5 * (1 - easeOutCubic(Math.min(1, e / 1.0)));
        if (k >= 1) { p.mode = 'idle'; p.idleT0 = now; }
      } else {
        const ie = (now - p.idleT0) / 1000;
        if (p.flipT !== undefined && p.flipT < 1) {
          p.flipT = Math.min(1, p.flipT + dt / 0.7);
          spin = p.flipFrom + (p.target - p.flipFrom) * easeOutCubic(p.flipT);
        } else {
          spin = p.target;
        }
        spin += Math.sin(ie * 0.7) * 0.32;
        scale = 1;
        y = Math.sin(ie * 1.3) * 0.02;
      }
      const tilt = 0.1 + Math.sin(e * 0.9) * 0.06;
      this.coin.render({ yaw: spin, pitch: tilt, scale, y }, GLOW[p.rarity]);
      if ((p.rarity === 'legendary' || p.rarity === 'rare') && Math.random() < dt * (p.rarity === 'legendary' ? 14 : 6)) {
        const w = this.root.clientWidth, h = this.root.clientHeight;
        this.particles.motes(1, SPARKS[p.rarity], { x: w * 0.15, y: h * 0.25, w: w * 0.7, h: h * 0.45 });
      }
    }
    this.particles.update(dt);
    requestAnimationFrame(() => this.loop());
  }

  poseArtifact(p, now, dt) {
    const e = (now - p.t0) / 1000;
    let scale = 1, y = 0;
    if (p.mode === 'enter') {
      const k = Math.min(1, e / 1.6);
      p.yaw = (1 - easeOutCubic(k)) * Math.PI * 4 - 0.5;
      scale = 0.25 + 0.75 * easeOutBack(Math.min(1, e / 0.9));
      y = -0.5 * (1 - easeOutCubic(Math.min(1, e / 0.9)));
      if (k >= 1) { p.mode = 'idle'; p.vel = 0; }
    } else if (!p.drag) {
      p.vel *= Math.exp(-dt * 2.5);
      p.yaw += (p.vel + 0.45) * dt;
      y = Math.sin(e * 1.3) * 0.03;
    }
    this.artifact.render({ yaw: p.yaw, pitch: p.pitch, scale, y }, GLOW[p.rarity]);
  }

  start() {
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(() => this.loop());
  }

  async open(kind, rarity) {
    const r = this.root;
    r.hidden = false;
    r.dataset.kind = kind;
    r.dataset.rarity = rarity;
    r.classList.remove('show', 'info-in', 'lit', 'closing');
    this.card.classList.remove('toss', 'drop', 'roll');
    this.layout();
    this.particles.clear();
    this.start();
    await wait(20);
    r.classList.add('show');
  }

  close() {
    return new Promise((resolve) => {
      const btns = [this.el('#reveal-close'), this.el('#reveal-x')];
      const done = async () => {
        sfx.click();
        haptics.tap();
        for (const b of btns) b.onclick = null;
        const kind = this.root.dataset.kind;
        if (kind === 'junk' || kind === 'shard' || kind === 'tomb') {
          this.card.classList.add(kind === 'junk' ? 'toss' : 'roll');
          sfx.paper();
          await wait(450);
        }
        this.root.classList.add('closing');
        await wait(420);
        this.running = false;
        this.pose = null;
        this.coin.render({ scale: 0 });
        this.artifact?.render({ scale: 0 });
        this.root.hidden = true;
        resolve();
      };
      for (const b of btns) b.onclick = done;
    });
  }

  // button: the label of an action that ends the reveal ("To the satchel"); without one the
  // screen is only looked at and closes with the cross in the corner.
  setInfo({ context = '', rarity = '', name = '', desc = '', isNew = false, button = '' }) {
    this.el('#reveal-context').textContent = context;
    this.el('#reveal-context').hidden = !context;
    this.el('#reveal-rarity').textContent = rarity;
    this.el('#reveal-name').textContent = name;
    this.el('#reveal-desc').textContent = desc;
    this.el('#reveal-new').textContent = t('reveal.newFind');
    this.el('#reveal-new').hidden = !isNew;
    this.el('#reveal-hint').textContent = t('reveal.tapToFlip');
    this.el('#reveal-close').textContent = button;
    this.el('#reveal-close').hidden = !button;
    this.el('#reveal-x').hidden = !!button;
  }

  // options: { isNew, context } — context is an extra line, e.g. "Treasure of tomb 2".
  async showCoin(id, { isNew = false, context = '' } = {}) {
    const def = coinById(id);
    const rarity = def.rarity;
    this.setInfo({
      context, isNew,
      rarity: t(`rarity.${rarity}`),
      name: t(`items.${id}.name`),
      desc: t(`items.${id}.desc`),
      button: t('reveal.toSatchel'),
    });
    await this.open('coin', rarity);

    const big = rarity === 'rare' || rarity === 'legendary';
    if (big) {
      sfx.swell(rarity === 'legendary' ? 1.4 : 0.9);
      await wait(rarity === 'legendary' ? 1300 : 800);
    } else {
      await wait(250);
    }
    this.coin.setModel(COIN_MODELS[id]);
    this.pose = { mode: 'enter', t0: performance.now(), target: 0, rarity };
    this.root.classList.add('lit');
    if (big) {
      sfx.boom();
      const flash = this.el('.flash');
      flash.classList.remove('go');
      void flash.offsetWidth;
      flash.classList.add('go');
    }
    sfx.chime(rarity);
    haptics.reveal(rarity);
    this.particles.sparks(this.center.x, this.center.y, { common: 18, uncommon: 34, rare: 70, legendary: 130 }[rarity], SPARKS[rarity]);
    await wait(1100);
    this.root.classList.add('info-in');
    return this.close();
  }

  // Looking at a coin already in the collection: no fanfare, a quick turn into view.
  async viewCoin(id, count) {
    const def = coinById(id);
    this.setInfo({
      context: t('reveal.inVault', { n: count }),
      rarity: t(`rarity.${def.rarity}`),
      name: t(`items.${id}.name`),
      desc: t(`items.${id}.desc`),
    });
    await this.open('coin', def.rarity);
    this.coin.setModel(COIN_MODELS[id]);
    this.pose = { mode: 'enter', t0: performance.now(), target: 0, rarity: def.rarity, dur: 1.1, spins: 2 };
    this.root.classList.add('lit');
    sfx.chime(def.rarity === 'legendary' ? 'rare' : 'common');
    await wait(250);
    this.root.classList.add('info-in');
    return this.close();
  }

  // A tomb artifact. model: a generated module from js/render/models/.
  // fanfare: the moment a gate opens; otherwise a quiet look at one from the vault.
  async viewArtifact(model, { name, desc, context = '', button = '', fanfare = false }) {
    const rarity = fanfare ? 'legendary' : 'rare';
    if (!this.artifact) this.artifact = new ArtifactRenderer(this.artCanvas);
    this.artifact.setModel(model);
    this.setInfo({ context, rarity: t('reveal.artifact'), name, desc, button });
    await this.open('artifact', rarity);
    this.el('#reveal-hint').textContent = t('reveal.dragToTurn');
    if (fanfare) {
      sfx.swell(1.2);
      await wait(1000);
    }
    this.pose = { kind: 'artifact', mode: 'enter', t0: performance.now(), rarity, yaw: 0, pitch: 0.38, vel: 0 };
    this.root.classList.add('lit');
    if (fanfare) {
      sfx.boom();
      const flash = this.el('.flash');
      flash.classList.remove('go');
      void flash.offsetWidth;
      flash.classList.add('go');
    }
    sfx.chime(fanfare ? 'legendary' : 'rare');
    haptics.reveal(rarity);
    this.particles.sparks(this.center.x, this.center.y, fanfare ? 130 : 50, SPARKS[rarity]);
    await wait(fanfare ? 1300 : 900);
    this.root.classList.add('info-in');
    return this.close();
  }

  // A potsherd with one symbol of the tomb key.
  async showShard({ symbol, n, have, of, next }) {
    this.fillCard({ label: t('shard.label'), sketch: shardSketch(symbol), name: t(`symbols.${symbol}`), desc: t('shard.desc', { have, of, n, d: formatDistance(next) }) });
    this.setInfo({ button: t('reveal.toSatchel') });
    await this.open('shard', 'rare');
    this.card.classList.add('drop');
    sfx.paper();
    await wait(380);
    sfx.chime('uncommon');
    haptics.reveal('uncommon');
    await wait(450);
    this.root.classList.add('info-in');
    return this.close();
  }

  // The tomb of the held map has turned up where the player searched.
  async showTombFound(n) {
    this.fillCard({ label: t('tomb.found.label'), sketch: gateSketch(n), name: t('map.title', { n }), desc: t('tomb.found.desc') });
    this.setInfo({});
    await this.open('tomb', 'rare');
    sfx.swell(0.8);
    await wait(500);
    this.card.classList.add('drop');
    sfx.boom();
    sfx.chime('rare');
    haptics.reveal('rare');
    this.particles.sparks(this.center.x, this.center.y, 40, SPARKS.tomb);
    await wait(700);
    this.root.classList.add('info-in');
    return this.close();
  }

  fillCard({ label, sketch, name, desc }) {
    this.el('#paper-label').textContent = label;
    this.el('#paper-sketch').innerHTML = sketch;
    this.el('#paper-name').textContent = name;
    this.el('#paper-desc').textContent = desc;
  }

  async showJunk(id) {
    this.fillCard({ label: t('reveal.junk'), sketch: junkSketch(id), name: t(`items.${id}.name`), desc: t(`items.${id}.desc`) });
    this.setInfo({ button: t('reveal.discard') });
    await this.open('junk', 'junk');
    this.card.classList.add('drop');
    sfx.paper();
    await wait(380);
    sfx.chime('junk');
    haptics.reveal('junk');
    await wait(400);
    this.root.classList.add('info-in');
    return this.close();
  }
}
