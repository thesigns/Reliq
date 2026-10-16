// A page of the treasure hunter's notebook, over the map or the vault. For the mission under
// way: the artifact sketched from its model, the walks (ticked as they are done), the symbols
// of the key and what to do next; once the tomb is found, how far it is, and the gate opens
// from here on site. For any other mission (on offer, done or lost): a page of notes and
// buttons that the vault's Notebook tab composes (openPage).

import { t, formatDistance, formatDuration, formatRoman } from '../i18n/i18n.js';
import { artifactSketch } from './artifact-sketch.js';
import { MODELS } from '../render/models/index.js';
import { shardRow } from './gate-art.js';
import { sfx } from './audio.js';
import { RULES } from '../game/rules.js';

export const TICK = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 11 l4 4 l10 -11" fill="none" stroke="#3b2414" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
export const CROSS = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5 l10 10 M15 5 l-10 10" fill="none" stroke="#8b1e1e" stroke-width="2.6" stroke-linecap="round"/></svg>';

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
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export class MissionNotebook {
  // deps: { onAbandon() } — the player confirmed abandoning the mission under way.
  constructor(root, deps = {}) {
    this.root = root;
    this.deps = deps;
    this.card = root.querySelector('.paper-card');
    this.el = (sel) => root.querySelector(sel);
    this.isOpen = false;
    this.mode = null;   // 'active': the mission under way, 'page': a page from openPage()
    root.addEventListener('click', (e) => this.onClick(e));
  }

  // The head of a mission's page: its number, the artifact's name and sketch.
  head(n, artifact) {
    this.n = n;
    this.el('.card-label').textContent = t('notebook.label', { n: formatRoman(n) });
    this.el('.card-title').textContent = t(`artifacts.${artifact}.name`);
    this.el('.card-sketch').innerHTML = artifactSketch(MODELS[artifact]);
    this.card.scrollTop = 0;
  }

  // The mission under way, kept current by update().
  open(check) {
    this.mode = 'active';
    this.head(check.n, check.def.artifact);
    this.el('.card-status').hidden = true;
    this.el('.notebook-active').hidden = false;
    this.el('.notebook-notes').hidden = true;
    this.el('.notebook-buttons').innerHTML = '';
    this.el('#notebook-gate').textContent = t('gate.open');
    const ab = this.el('.notebook-abandon');
    const abandon = ab.querySelector('[data-action="abandon"]');
    ab.hidden = false;
    abandon.textContent = t('journal.tombs.abandon');
    abandon.hidden = false;
    ab.querySelector('.j-confirm').hidden = true;
    ab.querySelector('.j-confirm p').textContent = t('journal.tombs.abandonConfirm', { days: RULES.fenceDelayMs / 864e5 });
    ab.querySelector('[data-action="abandon-yes"]').textContent = t('journal.tombs.abandonYes');
    ab.querySelector('[data-action="abandon-no"]').textContent = t('settings.resetNo');
    this.update(check);
    this.show();
  }

  // Any other mission. page: { n, artifact, status: { text, mark? }, notes: [{ text, lore? }],
  // actions: [{ id, label, primary?, disabled? }], onAction(id) }.
  openPage(page) {
    this.mode = 'page';
    this.page = page;
    this.head(page.n, page.artifact);
    const st = this.el('.card-status');
    st.hidden = !page.status;
    if (page.status) st.innerHTML = `${page.status.mark ?? ''}<span>${esc(page.status.text)}</span>`;
    this.el('.notebook-active').hidden = true;
    const notes = this.el('.notebook-notes');
    notes.hidden = !page.notes?.length;
    notes.innerHTML = (page.notes ?? []).map((p) => `<p class="${p.lore ? 'nb-lore' : 'nb-fact'}">${esc(p.text)}</p>`).join('');
    this.el('#notebook-gate').hidden = true;
    this.el('.notebook-buttons').innerHTML = (page.actions ?? []).map((a) =>
      `<button class="${a.primary ? 'btn-brass' : 'btn-link'}" data-page-action="${a.id}"${a.disabled ? ' disabled' : ''}>${esc(a.label)}</button>`).join('');
    this.el('.notebook-abandon').hidden = true;
    this.show();
  }

  show() {
    this.root.hidden = false;
    sfx.paper();
    if (this.isOpen) return;
    this.isOpen = true;
    requestAnimationFrame(() => this.root.classList.add('show'));
  }

  onClick(e) {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.pageAction) { this.page?.onAction(b.dataset.pageAction); return; }
    const a = b.dataset.action;
    const ab = this.el('.notebook-abandon');
    if (a === 'abandon') { sfx.click(); ab.querySelector('.j-confirm').hidden = false; b.hidden = true; }
    if (a === 'abandon-no') { sfx.click(); ab.querySelector('.j-confirm').hidden = true; ab.querySelector('[data-action="abandon"]').hidden = false; }
    if (a === 'abandon-yes') this.deps.onAbandon?.();
  }

  update(check) {
    if (this.mode !== 'active' || (!this.isOpen && !this.root.hidden)) return;
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
