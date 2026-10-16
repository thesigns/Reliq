// The vault: a leather-bound journal with the collection (artifact shelf and coins), the
// missions and tombs, and the fence. Settings and rules live in the game menu.

import { t, formatDate, formatDuration } from '../i18n/i18n.js';
import { COINS } from '../game/items.js';
import { RULES, MISSIONS } from '../game/rules.js';
import { renderChecks, mapStatus } from './tomb-scroll.js';
import { artifactSketch } from './artifact-sketch.js';
import { MODELS } from '../render/models/index.js';
import { shardRow } from './gate-art.js';
import { sfx } from './audio.js';

const RARITIES = ['common', 'uncommon', 'rare', 'legendary'];
const ROMAN = (n) => {
  const map = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let s = '';
  for (const [v, r] of map) while (n >= v) { s += r; n -= v; }
  return s;
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export class Journal {
  // deps: { state, missionCheck(), missionOffer(), thumbnail(id), artifactThumb(id), onViewCoin(id),
  //         onShowTomb(tomb), onShowMap(), onStartMission(), onAbandonMission(),
  //         onViewArtifact({ id, n, from }), fenceOffers(), coinPrice(id), onSellCoin(id),
  //         onBuyArtifact(n) }
  constructor(root, deps) {
    this.root = root;
    this.deps = deps;
    this.el = (sel) => root.querySelector(sel);
    this.tab = 'coins';
    this.isOpen = false;
    for (const b of root.querySelectorAll('[data-tab]')) b.onclick = () => { sfx.paper(); this.show(b.dataset.tab); };
    this.el('.journal-close').onclick = () => this.close();
    this.el('.journal-backdrop').onclick = () => this.close();
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.isOpen) this.close(); });
    root.addEventListener('click', (e) => this.onClick(e));
  }

  open(tab = this.tab) {
    this.isOpen = true;
    this.root.hidden = false;
    sfx.paper();
    this.show(tab);
    requestAnimationFrame(() => this.root.classList.add('show'));
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    sfx.paper();
    this.root.classList.remove('show');
    setTimeout(() => { if (!this.isOpen) this.root.hidden = true; }, 380);
  }

  show(tab) {
    this.tab = tab;
    for (const b of this.root.querySelectorAll('[data-tab]')) {
      b.classList.toggle('on', b.dataset.tab === tab);
      b.textContent = t(`journal.${b.dataset.tab}`);
    }
    this.el('.journal-title').textContent = t('journal.title');
    const page = this.el('.journal-page');
    page.innerHTML = this[`render_${tab}`]();
    page.scrollTop = 0;
    if (tab === 'coins' || tab === 'fence') this.loadThumbs();
    if (tab === 'tombs') this.refreshChecks();
  }

  refresh() { if (this.isOpen) this.show(this.tab); }

  // Live mission checklist while the tombs page is open.
  refreshChecks() {
    const check = this.deps.missionCheck();
    if (!check.active) return;
    const ul = this.el('.journal-page .checks');
    if (ul) renderChecks(ul, check);
    const set = (sel, text) => { const el = this.el(sel); if (el && el.textContent !== text) el.textContent = text; };
    set('.journal-page .j-map-status', mapStatus(check));
    set('.journal-page .j-deadline', t('journal.tombs.left', { t: formatDuration(check.timeLeft) }));
  }

  render_coins() {
    const { coins, artifacts } = this.deps.state;
    const total = Object.values(coins).reduce((a, b) => a + b, 0);
    const kinds = COINS.filter((c) => coins[c.id] > 0).length;
    let html = `<p class="j-summary">${esc(t('journal.summary', { artifacts: artifacts.length, missions: MISSIONS.length, coins: total, kinds, all: COINS.length }))}</p>`;
    const bag = this.deps.state.satchel;
    const carried = Object.values(bag.coins).reduce((a, b) => a + b, 0) + bag.artifacts.length;
    if (carried) html += `<p class="j-hint j-satchel">${esc(t('journal.satchel', { n: carried }))}</p>`;
    html += this.renderShelf();
    html += `<h3 class="j-section">${esc(t('journal.coinsTitle'))}</h3>`;
    for (const r of RARITIES) {
      html += `<h3 class="j-rarity r-${r}">${esc(t(`rarity.${r}`))}</h3><div class="coin-grid">`;
      for (const c of COINS.filter((x) => x.rarity === r)) {
        const n = coins[c.id] ?? 0;
        html += n > 0
          ? `<button class="coin-slot known" data-coin="${c.id}"><span class="coin-img"><img alt="" data-thumb="${c.id}"></span><span class="coin-name">${esc(t(`items.${c.id}.name`))}</span><span class="coin-count">×${n}</span></button>`
          : `<div class="coin-slot unknown"><span class="coin-img"><span class="coin-blank">?</span></span><span class="coin-name">${esc(t('journal.unknown'))}</span></div>`;
      }
      html += '</div>';
    }
    return html;
  }

  // One slot per mission, three to a shelf. A slot stays empty until its artifact is won
  // (or bought from the fence); one still in the satchel shows faded.
  renderShelf() {
    const owned = new Map(this.deps.state.artifacts.map((a) => [a.n, a]));
    const carried = new Map(this.deps.state.satchel.artifacts.map((a) => [a.n, a]));
    let html = `<h3 class="j-section">${esc(t('journal.shelf'))}</h3><div class="shelf">`;
    for (let i = 0; i < MISSIONS.length; i += 3) {
      html += '<div class="shelf-row">';
      for (const m of MISSIONS.slice(i, i + 3)) {
        const a = owned.get(m.n), c = carried.get(m.n);
        if (c) {
          html += `<div class="shelf-slot carried"><span class="shelf-img"><img alt="" data-art="${c.id}"></span><span class="shelf-name">${esc(t(`artifacts.${c.id}.name`))}<span class="shelf-carried">${esc(t('journal.shelfCarried'))}</span></span></div>`;
          continue;
        }
        html += a
          ? `<button class="shelf-slot known" data-shelf="${m.n}"><span class="shelf-img"><img alt="" data-art="${a.id}"></span><span class="shelf-name">${esc(t(`artifacts.${a.id}.name`))}</span></button>`
          : `<div class="shelf-slot empty"><span class="shelf-img"><span class="shelf-blank">?</span></span><span class="shelf-name">${esc(t('journal.unknown'))}</span></div>`;
      }
      html += '</div>';
    }
    return `${html}</div>`;
  }

  async loadThumbs() {
    for (const img of this.root.querySelectorAll('img[data-art]')) {
      const thumb = this.deps.artifactThumb(img.dataset.art);
      if (!thumb) continue;
      img.src = thumb.url;
      // Stand its base on the top of the board, just behind the front edge.
      img.style.marginBottom = `${2 - Math.round(thumb.base * img.clientHeight)}px`;
      img.classList.add('ready');
    }
    for (const img of this.root.querySelectorAll('img[data-thumb]')) {
      const id = img.dataset.thumb;
      const thumb = this.deps.thumbnail(id);
      if (thumb && img.isConnected) { img.src = thumb.url; img.classList.add('ready'); }
    }
  }

  render_tombs() {
    const s = this.deps.state;
    const check = this.deps.missionCheck();
    let html = '';
    if (check.active) {
      const name = t(`artifacts.${check.def.artifact}.name`);
      html += `<div class="j-card j-mission"><div class="j-mission-sketch small">${artifactSketch(MODELS[check.def.artifact])}</div>
        <h3 class="j-card-title">${esc(t('journal.tombs.mission', { name }))}</h3>
        <ul class="checks"></ul>
        <p class="j-map-status">${esc(mapStatus(check))}</p>
        <p class="j-hint j-deadline">${esc(t('journal.tombs.left', { t: formatDuration(check.timeLeft) }))}</p>
        <div class="shards-row"><span class="shards-label">${esc(t('gate.shards'))}</span>${shardRow(check.shards, check.keyLength)}</div>
        <button class="btn-brass btn-small" data-action="show-map">${esc(t('journal.tombs.showMap'))}</button>
        <div class="j-danger">
          <button class="btn-link danger" data-action="abandon">${esc(t('journal.tombs.abandon'))}</button>
          <div class="j-confirm" hidden>
            <p>${esc(t('journal.tombs.abandonConfirm'))}</p>
            <button class="btn-danger" data-action="abandon-yes">${esc(t('journal.tombs.abandonYes'))}</button>
            <button class="btn-link" data-action="abandon-no">${esc(t('settings.resetNo'))}</button>
          </div>
        </div></div>`;
    } else {
      const offer = this.deps.missionOffer();
      if (offer && !offer.done) {
        const name = t(`artifacts.${offer.artifact}.name`);
        html += `<div class="j-card j-offer"><div class="j-mission-sketch">${artifactSketch(MODELS[offer.artifact])}</div>
          <h3 class="j-card-title">${esc(t('journal.tombs.find', { name }))}</h3>
          <p class="j-lore">${esc(t(`artifacts.${offer.artifact}.lore`))}</p>
          <p class="j-hint">${esc(t('journal.tombs.warning', { stages: RULES.keyLength + 1, symbols: RULES.keyLength, days: RULES.missionTtlMs / 864e5 }))}</p>
          ${offer.carrying ? `<p class="j-hint j-satchel">${esc(t('journal.tombs.carrying', { name: t(`artifacts.${offer.carrying}.name`) }))}</p>` : ''}
          <button class="btn-brass btn-small" data-action="start-mission"${offer.carrying ? ' disabled' : ''}>${esc(t('journal.tombs.start'))}</button></div>`;
      } else {
        html += `<p class="j-hint">${esc(t('journal.tombs.noMore'))}</p>`;
      }
    }
    if (!s.tombs.length) return `${html}<p class="j-empty">${esc(t('journal.tombs.empty'))}</p>`;
    html += '<ul class="tomb-list">';
    for (const tb of [...s.tombs].sort((a, b) => b.n - a.n)) {
      const treasure = tb.artifact ? t(`artifacts.${tb.artifact}.name`) : t(`items.${tb.coinId}.name`);
      const line = tb.opened ? t('journal.tombs.item', { date: formatDate(tb.t), treasure }) : t('journal.tombs.closed', { date: formatDate(tb.t) });
      const view = tb.opened && tb.artifact ? `<button class="btn-link" data-artifact="${tb.n}">${esc(t('journal.tombs.view'))}</button>` : '';
      html += `<li><span class="tomb-num">${ROMAN(tb.n)}</span><span class="tomb-text"><b>${esc(t('tip.tomb.title', { n: tb.n }))}</b><br>${esc(line)}</span>
        <span class="tomb-actions">${view}<button class="btn-link" data-tomb="${tb.n}">${esc(t('journal.tombs.show'))}</button></span></li>`;
    }
    return `${html}</ul>`;
  }

  // Money, the artifacts of lost missions for sale, and the coins the fence will buy.
  render_fence() {
    const s = this.deps.state;
    let html = `<p class="fence-money">${esc(t('fence.money', { n: s.money }))}</p>
      <p class="j-hint fence-intro">${esc(t('fence.intro'))}</p>
      <h3 class="j-section">${esc(t('fence.lost'))}</h3>`;
    const offers = this.deps.fenceOffers();
    if (!offers.length) html += `<p class="j-hint fence-empty">${esc(t('fence.noLost'))}</p>`;
    for (const o of offers) {
      const open = o.availableAt <= o.now;
      const note = open ? t('fence.price', { n: o.price }) : t('fence.soon', { t: formatDuration(o.availableAt - o.now) });
      html += `<div class="fence-row"><span class="fence-art">${artifactSketch(MODELS[o.artifact])}</span>
        <span class="fence-text"><b>${esc(t(`artifacts.${o.artifact}.name`))}</b><br><span class="fence-note">${esc(note)}</span></span>
        <button class="btn-brass btn-small" data-buy="${o.n}"${o.ok ? '' : ' disabled'}>${esc(t('fence.buy'))}</button></div>`;
    }
    html += `<h3 class="j-section">${esc(t('fence.sell'))}</h3>`;
    const owned = COINS.filter((c) => s.coins[c.id] > 0);
    if (!owned.length) html += `<p class="j-hint fence-empty">${esc(t('fence.noCoins'))}</p>`;
    for (const c of owned) {
      const price = this.deps.coinPrice(c.id);
      html += `<div class="fence-row"><span class="fence-coin"><img alt="" data-thumb="${c.id}"></span>
        <span class="fence-text"><b>${esc(t(`items.${c.id}.name`))}</b> ×${s.coins[c.id]}<br><span class="fence-note">${esc(t(`rarity.${c.rarity}`))} · ${esc(t('fence.price', { n: price }))}</span></span>
        <button class="btn-link fence-sell" data-sell="${c.id}">${esc(t('fence.sellBtn'))}</button></div>`;
    }
    return html;
  }

  onClick(e) {
    const b = e.target.closest('button');
    if (!b || !this.root.contains(b)) return;
    if (b.dataset.coin) { this.deps.onViewCoin(b.dataset.coin); return; }
    if (b.dataset.artifact) {
      const tb = this.deps.state.tombs.find((x) => x.n === +b.dataset.artifact);
      if (tb) this.deps.onViewArtifact({ id: tb.artifact, n: tb.n, from: 'tomb' });
      return;
    }
    if (b.dataset.shelf) {
      const a = this.deps.state.artifacts.find((x) => x.n === +b.dataset.shelf);
      if (a) this.deps.onViewArtifact(a);
      return;
    }
    if (b.dataset.tomb) {
      const tb = this.deps.state.tombs.find((x) => x.n === +b.dataset.tomb);
      if (tb) { this.close(); this.deps.onShowTomb(tb); }
      return;
    }
    if (b.dataset.buy) { this.deps.onBuyArtifact(+b.dataset.buy); return; }
    if (b.dataset.sell) {
      const id = b.dataset.sell;
      // Selling the last one empties its place in the collection: ask with a second tap.
      if (this.deps.state.coins[id] === 1 && !b.dataset.armed) {
        sfx.click();
        b.dataset.armed = '1';
        b.classList.add('danger');
        b.textContent = t('fence.sellLast');
        return;
      }
      this.deps.onSellCoin(id);
      return;
    }
    const a = b.dataset.action;
    if (a === 'show-map') { this.close(); this.deps.onShowMap(); }
    if (a === 'start-mission') this.deps.onStartMission();
    if (a === 'abandon') { sfx.click(); this.el('.j-card .j-confirm').hidden = false; b.hidden = true; }
    if (a === 'abandon-no') { sfx.click(); this.el('.j-card .j-confirm').hidden = true; this.el('[data-action="abandon"]').hidden = false; }
    if (a === 'abandon-yes') this.deps.onAbandonMission();
  }
}
