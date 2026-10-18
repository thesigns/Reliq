// Full-screen reveal of a find: a low-poly coin with rarity staging, a low-poly tomb artifact
// or piece of junk, or a paper card (a key shard, a discovered tomb).

import { t, formatRoman } from '../i18n/i18n.js';
import { coinById } from '../game/items.js';
import { Examination } from '../game/examine.js';
import { ArtifactRenderer } from '../render/artifact3d.js';
import { restingView } from '../render/views.js';
import { COIN_MODELS } from '../render/models/coins.js';
import { JUNK_MODELS } from '../render/models/junk.js';
import { Particles } from './particles.js';
import { shardSketch, gateSketch } from './gate-art.js';
import { sfx } from './audio.js';
import { haptics } from './haptics.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
const easeOutBack = (x) => { const c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
// Falls and bounces twice, each bounce lower: junk landing on the ground.
const easeOutBounce = (x) => {
  if (x < 0.5) return 4 * x * x;
  const hop = (mid, half, height) => 1 - height * (1 - ((x - mid) / half) ** 2);
  return x < 0.82 ? hop(0.66, 0.16, 0.1) : hop(0.91, 0.09, 0.025);
};

const GLOW = {
  junk: [0.03, 0.025, 0.02], common: [0.05, 0.035, 0.02], uncommon: [0.07, 0.09, 0.13], rare: [0.22, 0.15, 0.05], legendary: [0.4, 0.24, 0.06],
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
    this.artCanvas = this.el('#reveal-artifact');
    this.artifact = null; // created on first use: a second WebGL context
    this.wireDrag(this.coinCanvas);
    this.wireDrag(this.artCanvas);
  }

  // In the vault, dragging turns the model; letting go keeps some spin, which runs down.
  wireDrag(c) {
    let last = null;
    c.addEventListener('pointerdown', (e) => {
      const p = this.pose;
      if (!p?.turnable || p.mode !== 'idle') return;
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
      p.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, p.pitch + dy * 0.008));   // from straight below to straight above
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

  loop() {
    if (!this.running) return;
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const p = this.pose;
    if (p) {
      this.animatePose(p, now, dt);
      if (p.kind === 'coin' && (p.rarity === 'legendary' || p.rarity === 'rare') && Math.random() < dt * (p.rarity === 'legendary' ? 14 : 6)) {
        const w = this.root.clientWidth, h = this.root.clientHeight;
        this.particles.motes(1, SPARKS[p.rarity], { x: w * 0.15, y: h * 0.25, w: w * 0.7, h: h * 0.45 });
      }
    }
    this.particles.update(dt);
    requestAnimationFrame(() => this.loop());
  }

  // The model pops up (or junk drops in) already at its resting angle, and then only bobs.
  animatePose(p, now, dt) {
    const e = (now - p.t0) / 1000;
    let scale = 1, y = 0;
    if (p.mode === 'toss') {
      const k = Math.min(1, e / 0.42);
      p.yaw += 16 * dt;
      scale = Math.max(0, 1 - k * k);
      y = 0.8 * k;
    } else if (p.mode === 'enter' && p.drop) {
      // Junk falls in from above, full size, and lands with a bounce.
      const k = Math.min(1, e / 0.75);
      y = 0.9 * (1 - easeOutBounce(k));
      if (k >= 1) { p.mode = 'idle'; p.idleT0 = now; }
    } else if (p.mode === 'enter') {
      const k = Math.min(1, e / 0.9);
      scale = 0.25 + 0.75 * easeOutBack(k);
      y = -0.5 * (1 - easeOutCubic(k));
      if (k >= 1) { p.mode = 'idle'; p.idleT0 = now; }
    } else {
      if (!p.drag) {
        p.vel *= Math.exp(-dt * 2.5);
        p.yaw += p.vel * dt;
      }
      y = Math.sin(((now - p.idleT0) / 1000) * 1.3) * 0.03;
      if (this.exam) this.examineStep(p, dt);
    }
    p.renderer.render({ yaw: p.yaw, pitch: p.pitch, scale, y }, GLOW[p.rarity]);
  }

  // kind: 'coin' or 'artifact' (junk too). The model rests at its own angle (restingView): out
  // on a walk it stays there; turnable: in the vault, the finger turns it.
  setPose(kind, renderer, rarity, { turnable = false, drop = false } = {}) {
    this.pose = { kind, renderer, mode: 'enter', drop, turnable, t0: performance.now(), rarity, ...restingView(renderer.model), vel: 0 };
    this.root.classList.toggle('turnable', turnable);
    this.el('#reveal-hint').hidden = !turnable;
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
    this.card.classList.remove('drop', 'roll');
    this.layout();
    this.particles.clear();
    this.start();
    await wait(20);
    r.classList.add('show');
  }

  // Resolves with what closed it: 'button' or 'cross'.
  close() {
    return new Promise((resolve) => {
      const btns = [this.el('#reveal-close'), this.el('#reveal-x')];
      const done = async (e) => {
        const by = e.currentTarget.id === 'reveal-x' ? 'cross' : 'button';
        sfx.click();
        haptics.tap();
        for (const b of btns) b.onclick = null;
        const kind = this.root.dataset.kind;
        if (kind === 'junk' && this.pose) {
          // Thrown away: it spins off into the distance.
          this.pose.mode = 'toss';
          this.pose.t0 = performance.now();
          await wait(420);
        }
        if (kind === 'shard' || kind === 'tomb') {
          this.card.classList.add('roll');
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
        resolve(by);
      };
      for (const b of btns) b.onclick = done;
    });
  }

  // button: the label of an action that ends the reveal ("To the satchel"); without one the
  // screen is only looked at and closes with the cross in the corner. cross: keep the cross
  // beside the button, for an action the player may put off.
  setInfo({ context = '', rarity = '', name = '', desc = '', button = '', cross = !button }) {
    this.el('#reveal-context').textContent = context;
    this.el('#reveal-context').hidden = !context;
    this.el('#reveal-rarity').textContent = rarity;
    this.el('#reveal-name').textContent = name;
    this.el('#reveal-desc').textContent = desc;
    this.el('#reveal-rarity').hidden = !rarity;
    this.el('#reveal-desc').hidden = !desc;
    this.el('#reveal-exam').hidden = true;
    this.exam = null;
    this.el('#reveal-hint').textContent = t('reveal.dragToTurn');
    this.el('#reveal-hint').hidden = true;
    this.el('#reveal-close').textContent = button;
    this.el('#reveal-close').hidden = !button;
    this.el('#reveal-x').hidden = !cross;
  }

  // options: { context } — an extra line, e.g. "Treasure of tomb II".
  async showCoin(id, { context = '' } = {}) {
    const def = coinById(id);
    const rarity = def.rarity;
    this.setInfo({
      context,
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
    this.setPose('coin', this.coin, rarity);
    this.root.classList.add('lit');
    if (big) {
      sfx.boom();
      const flash = this.el('.flash');
      flash.classList.remove('go');
      void flash.offsetWidth;
      flash.classList.add('go');
    }
    sfx.fanfare(rarity);
    haptics.reveal(rarity);
    this.particles.sparks(this.center.x, this.center.y, { common: 18, uncommon: 34, rare: 70, legendary: 130 }[rarity], SPARKS[rarity]);
    await wait(1100);
    this.root.classList.add('info-in');
    return this.close();
  }

  // Looking at a coin already in the collection: no fanfare, and it can be turned.
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
    this.setPose('coin', this.coin, def.rarity, { turnable: true });
    this.root.classList.add('lit');
    sfx.chime(def.rarity === 'legendary' ? 'rare' : 'common');
    await wait(250);
    this.root.classList.add('info-in');
    return this.close();
  }

  // A tomb artifact. model: a generated module from js/render/models/.
  // fanfare: the moment a gate opens; otherwise a quiet look at one from the vault.
  // tomb: the number of the tomb it came from, shown with the label.
  // turnable: looked at in the vault, where the finger turns it.
  // examine: { found, details, onFound(found) } — in the vault, turning it uncovers its details
  // one at a time; the screen then shows only the name and the details found.
  async viewArtifact(model, { name, desc, context = '', button = '', fanfare = false, tomb = null, turnable = false, examine = null }) {
    const rarity = fanfare ? 'legendary' : 'rare';
    if (!this.artifact) this.artifact = new ArtifactRenderer(this.artCanvas);
    this.artifact.setModel(model);
    const label = tomb ? t('reveal.artifactOf', { n: formatRoman(tomb) }) : t('reveal.artifact');
    if (examine) this.setInfo({ name, button });
    else this.setInfo({ context, rarity: label, name, desc, button });
    await this.open('artifact', rarity);
    if (fanfare) {
      sfx.swell(1.2);
      await wait(1000);
    }
    this.setPose('artifact', this.artifact, rarity, { turnable });
    if (examine) this.startExam(examine);
    this.root.classList.add('lit');
    if (fanfare) {
      sfx.boom();
      const flash = this.el('.flash');
      flash.classList.remove('go');
      void flash.offsetWidth;
      flash.classList.add('go');
    }
    if (fanfare) sfx.fanfare('artifact');
    else sfx.chime('rare');
    haptics.reveal(rarity);
    this.particles.sparks(this.center.x, this.center.y, fanfare ? 130 : 50, SPARKS[rarity]);
    await wait(fanfare ? 1300 : 900);
    this.root.classList.add('info-in');
    return this.close();
  }

  startExam(examine) {
    this.exam = { ...examine, search: null };
    this.el('#reveal-details').replaceChildren(...examine.details.slice(0, examine.found).map((d) => this.detailLine(d)));
    this.el('#reveal-exam').hidden = false;
    this.nextSearch();
  }

  // The search for the next detail, if any is left.
  nextSearch() {
    const x = this.exam, total = x.details.length;
    x.search = x.found < total ? new Examination(x.found) : null;
    this.el('#reveal-exam-label').textContent = x.search ? t('examine.stage', { n: x.found + 1, of: total }) : '';
    this.el('#reveal-exam-label').hidden = !x.search;
    this.el('#reveal-exam-bar').hidden = !x.search;
    this.el('#reveal-exam-fill').style.width = '0%';
    this.el('#reveal-hint').textContent = t(x.search ? 'examine.hint' : 'examine.done');
  }

  detailLine(text, fresh = false) {
    const p = document.createElement('p');
    p.className = fresh ? 'reveal-detail fresh' : 'reveal-detail';
    p.textContent = text;
    return p;
  }

  // Each frame the player holds the model in the vault, the side facing them is looked at; a
  // flick that leaves it spinning on its own does not count.
  examineStep(p, dt) {
    const x = this.exam;
    const turned = Math.hypot(p.yaw - (p.lastYaw ?? p.yaw), p.pitch - (p.lastPitch ?? p.pitch));
    p.lastYaw = p.yaw;
    p.lastPitch = p.pitch;
    if (!x.search || !p.drag) return;
    x.search.look(p.yaw, p.pitch, dt * 1000, turned / Math.max(dt, 1e-3));
    this.el('#reveal-exam-fill').style.width = `${x.search.progress * 100}%`;
    if (!x.search.done) return;
    x.found++;
    x.onFound?.(x.found);
    this.el('#reveal-details').append(this.detailLine(x.details[x.found - 1], true));
    sfx.ink();
    sfx.chime('uncommon');
    haptics.reveal('uncommon');
    this.nextSearch();
  }

  // A potsherd with one symbol of the tomb key.
  async showShard({ symbol, n, have, of, next }) {
    this.fillCard({ label: t('shard.label'), sketch: shardSketch(symbol), name: t(`symbols.${symbol}`), desc: t('shard.desc', { have, of, n, count: next }) });
    this.setInfo({ button: t('reveal.note') });
    await this.open('shard', 'rare');
    this.card.classList.add('drop');
    sfx.paper();
    await wait(380);
    sfx.fanfare('shard');
    haptics.reveal('uncommon');
    await wait(450);
    this.root.classList.add('info-in');
    return this.close();
  }

  // The active mission's tomb has turned up where the player searched. Resolves with 'button'
  // when the player goes straight to the gate, 'cross' when they put it off.
  async showTombFound(n) {
    this.fillCard({ label: t('tomb.found.label'), sketch: gateSketch(n), name: t('tomb.found.title', { n: formatRoman(n) }), desc: t('tomb.found.desc') });
    this.setInfo({ button: t('tomb.found.open'), cross: true });
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

  // Junk: the thing drops onto the ground and a sad little fanfare plays it down, before it
  // goes in the bin.
  async showJunk(id) {
    if (!this.artifact) this.artifact = new ArtifactRenderer(this.artCanvas);
    this.artifact.setModel(JUNK_MODELS[id]);
    this.setInfo({ rarity: t('reveal.junk'), name: t(`items.${id}.name`), desc: t(`items.${id}.desc`), button: t('reveal.discard') });
    await this.open('junk', 'junk');
    this.setPose('artifact', this.artifact, 'junk', { drop: true });
    this.root.classList.add('lit');
    await wait(380);
    sfx.thud();
    haptics.reveal('junk');
    await wait(250);
    sfx.womp();
    await wait(500);
    this.root.classList.add('info-in');
    return this.close();
  }
}
