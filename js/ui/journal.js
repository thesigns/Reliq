// The vault: a leather-bound journal with four tabs: the treasure hunter's notebook, the
// coins, the artifact shelf and the fence. Settings and rules live in the game menu.

import { t, formatDate, formatDuration, formatRoman } from '../i18n/i18n.js';
import { COINS } from '../game/items.js';
import { RULES, TIERS, MISSIONS } from '../game/rules.js';
import { TICK, CROSS } from './notebook.js';
import { artifactSketch } from './artifact-sketch.js';
import { MODELS } from '../render/models/index.js';
import { sfx } from './audio.js';

const RARITIES = ['common', 'uncommon', 'rare', 'legendary'];
const tierLabel = (id) => t('tier.label', { tier: t(`tiers.${id}`) });
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export class Journal {
  // deps: { state, missionCheck(), missionOffer(), thumbnail(id), artifactThumb(id), onViewCoin(id),
  //         onShowNotebook(), openMissionPage(page), closeMissionPage(),
//         onStartMission(),
  //         onViewArtifact({ id, n, from }) → Promise, fenceOffers(), coinPrice(id), onSellCoin(id),
  //         onBuyArtifact(n) }
  constructor(root, deps) {
    this.root = root;
    this.deps = deps;
    this.el = (sel) => root.querySelector(sel);
    this.tab = 'notebook';
    this.isOpen = false;
    for (const b of root.querySelectorAll('[data-tab]')) b.onclick = () => { sfx.paper(); this.show(b.dataset.tab); };
    this.el('.journal-head .btn-x').onclick = () => this.close();
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
    if (tab === 'coins' || tab === 'artifacts' || tab === 'fence') this.loadThumbs();
    if (tab === 'notebook') this.refreshNotebook();
  }

  refresh() { if (this.isOpen) this.show(this.tab); }

  // The clock of the mission under way, while the Notebook is open.
  refreshNotebook() {
    const check = this.deps.missionCheck();
    const el = this.el('.journal-page .nb-left');
    if (!check.active || !el) return;
    const text = t('notes.left', { t: formatDuration(check.timeLeft, { minutes: true }) });
    if (el.textContent !== text) el.textContent = text;
  }

  // A line about what is still in the backpack, on the way to the vault.
  carriedHint() {
    const bag = this.deps.state.satchel;
    const carried = Object.values(bag.coins).reduce((a, b) => a + b, 0) + bag.artifacts.length;
    return carried ? `<p class="j-hint j-satchel">${esc(t('journal.satchel', { n: carried }))}</p>` : '';
  }

  // The coins, by rarity: the ones found and a blank for each still missing.
  render_coins() {
    const { coins } = this.deps.state;
    const total = Object.values(coins).reduce((a, b) => a + b, 0);
    const kinds = COINS.filter((c) => coins[c.id] > 0).length;
    let html = `<p class="j-summary">${esc(t('journal.summary.coins', { coins: total, kinds, all: COINS.length }))}</p>${this.carriedHint()}`;
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

  // The artifacts by tier, easiest first, like the coins by rarity: one place per mission,
  // three to a row, the picture over its name. A place stays a blank until its artifact is
  // won (or bought from the fence); one still in the backpack shows faded.
  render_artifacts() {
    const { artifacts } = this.deps.state;
    const owned = new Map(artifacts.map((a) => [a.id, a]));
    const carried = new Map(this.deps.state.satchel.artifacts.map((a) => [a.id, a]));
    let html = `<p class="j-summary">${esc(t('journal.summary.artifacts', { artifacts: artifacts.length, missions: MISSIONS.length }))}</p>`;
    for (const tier of TIERS) {
      const missions = MISSIONS.filter((m) => m.tier === tier.id);
      if (!missions.length) continue;
      html += `<h3 class="j-rarity t-${tier.id}">${esc(tierLabel(tier.id))}</h3><div class="art-grid">`;
      for (const { artifact: id } of missions) {
        const name = esc(t(`artifacts.${id}.name`));
        if (carried.has(id)) {
          html += `<div class="art-slot carried"><span class="art-img"><img alt="" data-art="${id}"></span><span class="art-name">${name}<span class="art-carried">${esc(t('journal.carried'))}</span></span></div>`;
          continue;
        }
        html += owned.has(id)
          ? `<button class="art-slot known" data-artifact="${id}"><span class="art-img"><img alt="" data-art="${id}"></span><span class="art-name">${name}</span></button>`
          : `<div class="art-slot empty"><span class="art-img"><span class="art-blank">?</span></span><span class="art-name">${esc(t('journal.unknownArtifact'))}</span></div>`;
      }
      html += '</div>';
    }
    return html;
  }

  async loadThumbs() {
    for (const img of this.root.querySelectorAll('img[data-art]')) {
      const thumb = this.deps.artifactThumb(img.dataset.art);
      if (!thumb) continue;
      img.src = thumb.url;
      img.classList.add('ready');
    }
    for (const img of this.root.querySelectorAll('img[data-thumb]')) {
      const id = img.dataset.thumb;
      const thumb = this.deps.thumbnail(id);
      if (thumb && img.isConnected) { img.src = thumb.url; img.classList.add('ready'); }
    }
  }

  // The Notebook: the mission on offer or under way, then the missions already behind, as
  // handwritten entries on a ruled page. Each opens its own page of the notebook.
  render_notebook() {
    const check = this.deps.missionCheck();
    let html = '<div class="nb-page">';
    if (check.active) {
      const left = `<span class="nb-left">${esc(t('notes.left', { t: formatDuration(check.timeLeft, { minutes: true }) }))}</span>`;
      html += this.entry({ n: check.n, artifact: check.def.artifact, tier: check.def.tier, kicker: t('notes.active'), line: left, key: 'active', sketch: true });
    } else {
      const offer = this.deps.missionOffer();
      if (offer && !offer.done) html += this.entry({ n: offer.n, artifact: offer.artifact, tier: offer.tier, kicker: t('notes.available'), key: 'offer', sketch: true });
      else html += `<p class="nb-note">${esc(t('journal.tombs.noMore'))}</p>`;
    }
    const past = this.pastMissions();
    if (past.length) {
      html += `<h3 class="nb-heading">${esc(t('notes.past'))}</h3>`;
      for (const p of past) html += this.entry({ n: p.n, artifact: p.artifact, tier: MISSIONS.find((m) => m.artifact === p.artifact)?.tier, status: p.won ? 'won' : 'lost', key: `${p.won ? 'won' : 'lost'}:${p.n}` });
    }
    return `${html}</div>`;
  }

  // One entry: the mission's number in the margin, what it is about, its tier and the way
  // to its page.
  entry({ n, artifact, tier, kicker, line, status, key, sketch }) {
    const mark = status === 'won' ? TICK : CROSS;
    return `<section class="nb-entry${sketch ? ' nb-current' : ''}">
      <span class="nb-num">${formatRoman(n)}</span>
      ${kicker ? `<p class="nb-kicker">${esc(kicker)}</p>` : ''}
      ${sketch ? `<span class="nb-sketch">${artifactSketch(MODELS[artifact])}</span>` : ''}
      <p class="nb-title">${esc(t(`artifacts.${artifact}.name`))}</p>
      ${tier ? `<p class="nb-tier t-${tier}">${esc(tierLabel(tier))}</p>` : ''}
      ${status ? `<p class="nb-status nb-${status}">${mark}<span>${esc(t(`notes.${status}`))}</span></p>` : ''}
      ${line ? `<p class="nb-line">${line}</p>` : ''}
      <p class="nb-line"><button class="nb-more" data-entry="${key}">${esc(t('notes.details'))}</button></p>
    </section>`;
  }

  // Missions behind the player, newest first: won (its tomb opened) or lost.
  pastMissions() {
    const s = this.deps.state;
    const won = s.tombs.filter((tb) => tb.opened).map((tb) => ({ n: tb.n, artifact: tb.artifact, won: true, tomb: tb }));
    const lost = s.lost.map((l) => ({ n: l.n, artifact: l.artifact, won: false, t: l.t }));
    return [...won, ...lost].sort((x, y) => y.n - x.n);
  }

  // The page of the notebook behind an entry's Details.
  openEntry(key) {
    if (key === 'active') { this.deps.onShowNotebook(); return; }
    const s = this.deps.state;
    const lore = (id) => [{ text: t(`artifacts.${id}.lore`), lore: true }];
    if (key === 'offer') {
      const offer = this.deps.missionOffer();
      if (!offer || offer.done) return;
      const notes = [...lore(offer.artifact),
        { text: t('journal.tombs.warning', { stages: RULES.keyLength + 1, symbols: RULES.keyLength, days: RULES.missionTtlMs / 864e5 }) }];
      this.deps.openMissionPage({
        n: offer.n, artifact: offer.artifact, status: { text: t('notes.available') }, notes,
        actions: [{ id: 'start', label: t('journal.tombs.start'), primary: true }],
        onAction: () => {
          this.deps.onStartMission();
          if (this.deps.missionCheck().active) this.deps.onShowNotebook();
        },
      });
      return;
    }
    const [kind, num] = key.split(':');
    const m = this.pastMissions().find((p) => p.n === +num && p.won === (kind === 'won'));
    if (!m) return;
    const notes = lore(m.artifact);
    const actions = [];
    const stored = s.artifacts.find((x) => x.n === m.n);
    // The details found by examining it in the vault.
    for (let k = 1; k <= (stored?.examined ?? 0); k++) notes.push({ text: t(`artifacts.${m.artifact}.detail${k}`), lore: true });
    if (m.won) {
      notes.push({ text: t('notes.tombFound', { n: formatRoman(m.n), date: formatDate(m.tomb.t) }) });
      notes.push({ text: t(stored ? 'notes.inVault' : 'notes.inBackpack') });
      actions.push({ id: 'view', label: t('notes.viewArtifact'), primary: true });
    } else {
      notes.push({ text: t('notes.lostOn', { date: formatDate(m.t) }) });
      if (stored) {
        notes.push({ text: t('notes.bought') });
        actions.push({ id: 'view', label: t('notes.viewArtifact'), primary: true });
      } else {
        const offer = this.deps.fenceOffers().find((o) => o.n === m.n);
        if (offer) notes.push({ text: t('notes.fenceNow') });
        actions.push({ id: 'fence', label: t('notes.toFence') });
      }
    }
    this.deps.openMissionPage({
      n: m.n, artifact: m.artifact, notes, actions,
      status: { text: t(m.won ? 'notes.won' : 'notes.lost'), mark: m.won ? TICK : CROSS },
      onAction: (id) => {
        if (id === 'view') {
          // Details found while looking at it go onto this page straight away.
          const found = stored?.examined ?? 0;
          Promise.resolve(this.deps.onViewArtifact(stored ?? s.satchel.artifacts.find((x) => x.n === m.n) ?? { id: m.artifact, n: m.n, from: 'tomb' }))
            .then(() => { if ((stored?.examined ?? 0) !== found) this.openEntry(key); });
        }
        if (id === 'fence') { this.deps.closeMissionPage(); this.show('fence'); }
      },
    });
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
      const note = t('fence.price', { n: o.price });
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
      const a = this.deps.state.artifacts.find((x) => x.id === b.dataset.artifact);
      if (a) this.deps.onViewArtifact(a);
      return;
    }
    if (b.dataset.entry) { this.openEntry(b.dataset.entry); return; }
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
  }
}
