// The mission card, a page of the field notebook: the artifact sketched from its model, the
// walks (ticked as they are done), the symbols of the key and what to do next. Once the
// tomb is found, the page shows how far it is, and the gate can be opened from here on site.

import { t, formatDistance, formatDuration, formatRoman } from '../i18n/i18n.js';
import { artifactSketch } from './artifact-sketch.js';
import { MODELS } from '../render/models/index.js';
import { shardRow } from './gate-art.js';
import { sfx } from './audio.js';
import { RULES } from '../game/rules.js';

const TICK = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 11 l4 4 l10 -11" fill="none" stroke="#3b2414" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CROSS = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5 l10 10 M15 5 l-10 10" fill="none" stroke="#8b1e1e" stroke-width="2.6" stroke-linecap="round"/></svg>';

export function renderChecks(ul, check) {
  const { def, shards, keyLength } = check;
  const rows = [];
  for (let i = 1; i <= keyLength; i++) rows.push([t('mission.step.symbol', { i, d: formatDistance(def.symbolDistance) }), shards.length >= i]);
  rows.push([t('mission.step.tomb', { d: formatDistance(def.tombDistance) }), check.stage === 'gate']);
  const html = rows.map(([text, ok]) => `<li class="${ok ? 'ok' : 'no'}"><span class="mark">${ok ? TICK : CROSS}</span><span>${text}</span></li>`).join('');
  if (ul.innerHTML !== html) ul.innerHTML = html;
}

// Where the mission stands, as one line: what to do next.
export function missionStatus(check) {
  if (check.stage !== 'gate') {
    if (!check.start) return t('mission.noStart');
    if (check.ok) return t('mission.ready');
    if (check.distance !== null && check.distance >= check.need) return t('mission.tooClose', { d: formatDistance(RULES.tombSeparation) });
    return t('mission.distance', { have: formatDistance(check.distance), need: formatDistance(check.need) });
  }
  if (check.gate.ok) return t('notebook.atGate');
  return check.gate.distance === null ? t('notebook.tombFound') : t('notebook.toTomb', { d: formatDistance(check.gate.distance) });
}

// The mission at a glance, for the tag beside the map button: { label, value, progress? }.
export function missionBrief(check) {
  if (check.stage === 'gate') return { label: t('mission.tag.gate'), value: formatDistance(check.gate.distance) };
  const label = check.stage === 'symbol' ? t('mission.tag.symbol', { i: check.shards.length + 1, of: check.keyLength }) : t('mission.tag.tomb');
  if (!check.start) return { label, value: t('mission.tag.start') };
  return { label, value: `${formatDistance(check.distance)} / ${formatDistance(check.need)}`, progress: Math.min(1, (check.distance ?? 0) / check.need) };
}

const setHtml = (el, html) => { if (el.innerHTML !== html) el.innerHTML = html; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export class MissionNotebook {
  constructor(root) {
    this.root = root;
    this.card = root.querySelector('.paper-card');
    this.el = (sel) => root.querySelector(sel);
    this.isOpen = false;
  }

  open(check) {
    this.n = check.n;
    this.el('.card-label').textContent = t('notebook.label', { n: formatRoman(check.n) });
    this.el('.card-title').textContent = t(`artifacts.${check.def.artifact}.name`);
    this.el('.card-sketch').innerHTML = artifactSketch(MODELS[check.def.artifact]);
    this.el('#notebook-gate').textContent = t('gate.open');
    this.update(check);
    this.root.hidden = false;
    this.isOpen = true;
    sfx.paper();
    requestAnimationFrame(() => this.root.classList.add('show'));
  }

  update(check) {
    if (!this.isOpen && !this.root.hidden) return;
    if (!check.active) return;
    renderChecks(this.el('.checks'), check);
    setHtml(this.el('.card-symbols'), `<span class="shards-label">${t('gate.shards')}</span>${shardRow(check.shards, check.keyLength)}`);
    const msg = this.el('.card-msg');
    if (!this.failing) msg.textContent = missionStatus(check);
    const left = t('journal.tombs.left', { t: formatDuration(check.timeLeft) });
    const dl = this.el('.card-deadline');
    if (dl.textContent !== left) dl.textContent = left;
    const btn = this.el('#notebook-gate');
    btn.hidden = check.stage !== 'gate';
    btn.classList.toggle('ready', !!check.gate?.ok);
  }

  // The gate is out of reach: say so for a moment.
  fail(text) {
    this.failing = true;
    this.el('.card-msg').textContent = text;
    this.card.classList.remove('shake');
    void this.card.offsetWidth;
    this.card.classList.add('shake');
    clearTimeout(this.failTimer);
    this.failTimer = setTimeout(() => { this.failing = false; }, 2500);
  }

  async close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    sfx.paper();
    this.root.classList.remove('show');
    await wait(380);
    this.root.hidden = true;
  }
}
