// The tomb gate: three bronze rings turned by dragging (a tap turns one step). The symbols
// under the marker form the combination, outer ring first; every settled turn is tried.

import { t } from '../i18n/i18n.js';
import { SYMBOLS } from '../game/rules.js';
import { GATE, gateSVG, shardRow } from './gate-art.js';
import { sfx } from './audio.js';
import { haptics } from './haptics.js';

const STEP = 360 / SYMBOLS.length;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const mod = (a, n) => ((a % n) + n) % n;
const easeOut = (x) => 1 - Math.pow(1 - x, 3);

export class GateScreen {
  constructor(root) {
    this.root = root;
    this.el = (sel) => root.querySelector(sel);
    this.el('.gate-stage').innerHTML = gateSVG();
    this.svg = this.el('.gate-svg');
    this.rings = [...this.svg.querySelectorAll('.gate-ring')];
    this.angles = this.rings.map(() => 0);
    this.anim = this.rings.map(() => 0);
    this.drag = null;
    this.isOpen = false;
    this.busy = false;
    this.el('#gate-close').onclick = () => this.close();
    this.wireDrag();
  }

  // opts: { n, shards, keyLength, start: [symbol index under the marker per ring],
  //         onTry(combo) -> { ok, message? } }. Resolves 'opened' or 'closed'.
  open(opts) {
    this.opts = opts;
    this.el('.gate-label').textContent = t('gate.label');
    this.el('.gate-title').textContent = t('gate.title', { n: opts.n });
    this.el('#gate-close').textContent = t('gate.leave');
    this.setHint(t('gate.hint'));
    this.setShards(opts.shards, opts.keyLength);
    this.angles = opts.start.map((i) => -i * STEP);
    this.rings.forEach((_, k) => this.draw(k));
    this.root.classList.remove('solved', 'opening');
    this.root.hidden = false;
    this.isOpen = true;
    this.busy = false;
    sfx.swell(0.6);
    requestAnimationFrame(() => this.root.classList.add('show'));
    return new Promise((resolve) => { this.done = resolve; });
  }

  setShards(shards, total) {
    this.el('.gate-shards').innerHTML = `<span class="shards-label">${t('gate.shards')}</span>${shardRow(shards, total)}`;
  }

  setHint(text) { this.el('.gate-hint').textContent = text; }

  combo() { return this.angles.map((a) => SYMBOLS[mod(Math.round(-a / STEP), SYMBOLS.length)]); }

  draw(k) { this.rings[k].setAttribute('transform', `rotate(${this.angles[k]} ${GATE.c} ${GATE.c})`); }

  toSvg(e) { return new DOMPoint(e.clientX, e.clientY).matrixTransform(this.svg.getScreenCTM().inverse()); }

  // Degrees, 0 at the marker (top), clockwise.
  angleOf(p) { return (Math.atan2(p.x - GATE.c, GATE.c - p.y) * 180) / Math.PI; }

  ringAt(p) {
    const r = Math.hypot(p.x - GATE.c, p.y - GATE.c);
    return GATE.rings.findIndex((R) => Math.abs(r - R) <= GATE.band / 2 + 2);
  }

  wireDrag() {
    const svg = this.svg;
    svg.addEventListener('pointerdown', (e) => {
      if (this.busy || this.drag) return;
      const p = this.toSvg(e);
      const k = this.ringAt(p);
      if (k < 0) return;
      svg.setPointerCapture(e.pointerId);
      cancelAnimationFrame(this.anim[k]);
      this.anim[k] = 0;
      this.drag = { k, id: e.pointerId, last: this.angleOf(p), turned: 0, x: e.clientX, y: e.clientY, t0: performance.now(), slot: Math.round(this.angles[k] / STEP) };
    });
    svg.addEventListener('pointermove', (e) => {
      const d = this.drag;
      if (!d || e.pointerId !== d.id) return;
      const a = this.angleOf(this.toSvg(e));
      const delta = mod(a - d.last + 180, 360) - 180;
      d.last = a;
      d.turned += Math.abs(delta);
      this.angles[d.k] += delta;
      const slot = Math.round(this.angles[d.k] / STEP);
      if (slot !== d.slot) { d.slot = slot; this.tick(); }
      this.draw(d.k);
    });
    const end = (e) => {
      const d = this.drag;
      if (!d || e.pointerId !== d.id) return;
      this.drag = null;
      const tap = d.turned < 6 && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 10 && performance.now() - d.t0 < 400;
      const slot = Math.round(this.angles[d.k] / STEP) + (tap && e.type === 'pointerup' ? 1 : 0);
      if (tap) this.tick();
      this.settle(d.k, slot * STEP);
    };
    svg.addEventListener('pointerup', end);
    svg.addEventListener('pointercancel', end);
  }

  tick() {
    sfx.click();
    haptics.tap();
  }

  settle(k, target) {
    const from = this.angles[k];
    const t0 = performance.now();
    const step = (now) => {
      const u = Math.min(1, (now - t0) / 170);
      this.angles[k] = from + (target - from) * easeOut(u);
      this.draw(k);
      if (u < 1) { this.anim[k] = requestAnimationFrame(step); return; }
      this.anim[k] = 0;
      this.angles[k] = target;
      this.tryOpen();
    };
    this.anim[k] = requestAnimationFrame(step);
  }

  async tryOpen() {
    if (this.busy || this.drag || this.anim.some(Boolean)) return;
    const res = this.opts.onTry(this.combo());
    if (res.message) this.setHint(res.message);
    if (!res.ok) return;
    this.busy = true;
    this.root.classList.add('solved');
    sfx.chime('rare');
    haptics.reveal('rare');
    await wait(900);
    this.root.classList.add('opening');
    sfx.boom();
    sfx.swell(1.6);
    haptics.dig();
    await wait(1600);
    this.finish('opened');
  }

  close() {
    if (!this.isOpen || this.busy) return;
    sfx.click();
    this.finish('closed');
  }

  async finish(result) {
    this.isOpen = false;
    this.root.classList.remove('show');
    await wait(400);
    this.root.hidden = true;
    this.busy = false;
    this.done?.(result);
  }
}
