// The game menu: the title page the game opens on, with Continue (Begin on a first run),
// the settings and the rules. It covers the map but pauses nothing: the map loads and the
// GPS warms up behind it, so the game is usually ready by the time the player taps.

import { t, getLang } from '../i18n/i18n.js';
import { vaultSketch, searchSketch, findsSketch } from './onboarding-art.js';
import { sfx } from './audio.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const TITLES = { settings: 'menu.settings', about: 'menu.about' };

export class GameMenu {
  // deps: { state, install, version, canKeepAwake, onPlay(), onSetting(key, value), onReset() }
  constructor(root, deps) {
    this.root = root;
    this.deps = deps;
    this.el = (sel) => root.querySelector(sel);
    this.page = 'home';
    this.isOpen = false;
    this.el('#menu-play').onclick = () => { sfx.click(); this.deps.onPlay(); };
    this.el('.menu-back').onclick = () => { sfx.paper(); this.show('home'); };
    for (const b of root.querySelectorAll('[data-page]')) b.onclick = () => { sfx.paper(); this.show(b.dataset.page); };
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.isOpen && this.page !== 'home') this.show('home'); });
    root.addEventListener('click', (e) => this.onClick(e));
    root.addEventListener('change', (e) => this.onChange(e));
  }

  open(page = 'home') {
    this.isOpen = true;
    this.root.hidden = false;
    this.show(page);
    requestAnimationFrame(() => this.root.classList.add('show'));
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    sfx.paper();
    this.root.classList.remove('show');
    setTimeout(() => { if (!this.isOpen) this.root.hidden = true; }, 380);
  }

  show(page) {
    this.page = page;
    const home = page === 'home';
    this.el('.menu-home').hidden = !home;
    this.el('.menu-sub').hidden = home;
    this.el('#menu-play').textContent = t(this.deps.state.vault ? 'menu.continue' : 'menu.begin');
    this.el('.menu-version').textContent = t('about.version', { v: this.deps.version });
    if (home) return;
    this.el('.menu-sub-title').textContent = t(TITLES[page]);
    const body = this.el('.menu-page');
    body.innerHTML = this[`render_${page}`]();
    body.scrollTop = 0;
  }

  refresh() { if (this.isOpen) this.show(this.page); }

  // One line under the buttons: how the GPS is doing while the player decides.
  setStatus(text) {
    const el = this.el('.menu-status');
    if (el.textContent !== text) el.textContent = text;
  }

  render_settings() {
    const st = this.deps.state.settings;
    const lang = getLang();
    const toggle = (key, label) => `<label class="j-toggle"><span>${esc(t(label))}</span><input type="checkbox" data-setting="${key}" ${st[key] ? 'checked' : ''}><i></i></label>`;
    return `
      <div class="j-field"><span>${esc(t('settings.language'))}</span>
        <div class="j-seg"><button data-lang="pl" class="${lang === 'pl' ? 'on' : ''}">Polski</button><button data-lang="en" class="${lang === 'en' ? 'on' : ''}">English</button></div></div>
      ${toggle('sound', 'settings.sound')}
      ${toggle('music', 'settings.music')}
      ${toggle('haptics', 'settings.haptics')}
      ${this.deps.canKeepAwake ? toggle('keepAwake', 'settings.keepAwake') : ''}
      <div class="j-field"><span>${esc(t('settings.quality'))}</span>
        <div class="j-seg"><button data-quality="full" class="${st.quality === 'full' ? 'on' : ''}">${esc(t('settings.quality.full'))}</button><button data-quality="saver" class="${st.quality === 'saver' ? 'on' : ''}">${esc(t('settings.quality.saver'))}</button></div></div>
      <p class="j-hint">${esc(t('settings.qualityHint'))}</p>
      ${this.renderInstall()}
      <div class="j-danger">
        <button class="btn-link danger" data-action="reset">${esc(t('settings.reset'))}</button>
        <div class="j-confirm" hidden>
          <p>${esc(t('settings.resetConfirm'))}</p>
          <button class="btn-danger" data-action="reset-yes">${esc(t('settings.resetYes'))}</button>
          <button class="btn-link" data-action="reset-no">${esc(t('settings.resetNo'))}</button>
        </div>
      </div>`;
  }

  // Installing protects the collection from browser storage clean-ups and enables offline play.
  renderInstall() {
    const inst = this.deps.install;
    if (!inst) return '';
    if (inst.canPrompt()) {
      return `<div class="j-install"><p class="j-hint">${esc(t('settings.installHint'))}</p>
        <button class="btn-brass btn-small" data-action="install">${esc(t('settings.install'))}</button></div>`;
    }
    if (inst.iosHint()) {
      return `<div class="j-install"><p class="j-hint">${esc(t('settings.installHint'))}</p><p class="j-hint"><b>${esc(t('settings.installIos'))}</b></p></div>`;
    }
    return '';
  }

  render_about() {
    const rule = (sketch, title, body) => `<section class="j-rule">${sketch}<h3>${esc(t(title))}</h3><p>${esc(t(body))}</p></section>`;
    return `
      <h3 class="j-section">${esc(t('about.rules'))}</h3>
      ${rule(vaultSketch, 'onb.vault.title', 'onb.vault.body')}
      ${rule(searchSketch, 'onb.search.title', 'onb.search.body')}
      ${rule(findsSketch, 'onb.finds.title', 'onb.finds.body')}
      <h3 class="j-section">${esc(t('about.credits'))}</h3>
      <p class="j-credits">${esc(t('about.creditsText'))}</p>
      <p class="j-version">${esc(t('about.version', { v: this.deps.version }))}</p>`;
  }

  onClick(e) {
    const b = e.target.closest('button');
    if (!b || !this.el('.menu-page').contains(b)) return;
    if (b.dataset.lang) { sfx.click(); this.deps.onSetting('lang', b.dataset.lang); this.show(this.page); return; }
    if (b.dataset.quality) { sfx.click(); this.deps.onSetting('quality', b.dataset.quality); this.show(this.page); return; }
    const a = b.dataset.action;
    if (a === 'install') this.deps.install.prompt();
    if (a === 'reset') { sfx.click(); this.el('.j-confirm').hidden = false; b.hidden = true; }
    if (a === 'reset-no') { sfx.click(); this.el('.j-confirm').hidden = true; this.el('[data-action="reset"]').hidden = false; }
    if (a === 'reset-yes') this.deps.onReset();
  }

  onChange(e) {
    const key = e.target.dataset.setting;
    if (!key) return;
    sfx.click();
    this.deps.onSetting(key, e.target.checked);
  }
}
