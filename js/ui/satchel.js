// The satchel button on the map: how many finds are carried, and the little flight of a
// find into it (or a shard into the mission button) once its reveal closes.

import { satchelSVG } from './art.js';

export class SatchelButton {
  constructor(btn) {
    this.btn = btn;
    btn.innerHTML = `${satchelSVG()}<span class="satchel-count"></span>`;
    this.count = btn.querySelector('.satchel-count');
    this.flying = 0;
    this.shown = -1;
  }

  // Holds still while a find is in the air, so the count ticks up when it lands.
  set(n) {
    if (this.flying || n === this.shown) return;
    this.shown = n;
    this.btn.hidden = n === 0;
    this.count.textContent = n > 99 ? '99+' : String(n);
  }

  // url: an image of the find. Flies from the middle of the screen to target (default:
  // the satchel), shrinking, then the target gives a little bounce.
  async fly(url, target = this.btn) {
    const parent = this.btn.parentElement;
    if (target === this.btn) this.btn.hidden = false;   // the first find: the satchel appears to catch it
    const pr = parent.getBoundingClientRect();
    const k = pr.width / parent.offsetWidth || 1;          // ?inspect scales the whole page
    const tr = target.getBoundingClientRect();
    const to = { x: (tr.left + tr.width / 2 - pr.left) / k, y: (tr.top + tr.height / 2 - pr.top) / k };
    const from = { x: parent.offsetWidth / 2, y: parent.offsetHeight * 0.4 };
    this.flying++;
    if (url) {
      const img = new Image();
      img.className = 'satchel-fly';
      img.alt = '';
      img.src = url;
      parent.appendChild(img);
      const mid = { x: (from.x + to.x) / 2 + (to.x > from.x ? -40 : 40), y: Math.min(from.y, to.y) - 60 };
      const anim = img.animate([
        { transform: `translate(${from.x}px, ${from.y}px) scale(1.1)`, opacity: 1 },
        { transform: `translate(${mid.x}px, ${mid.y}px) scale(.8) rotate(${to.x > from.x ? 160 : -160}deg)`, opacity: 1, offset: 0.45 },
        { transform: `translate(${to.x}px, ${to.y}px) scale(.3) rotate(${to.x > from.x ? 340 : -340}deg)`, opacity: 0.9 },
      ], { duration: 720, easing: 'cubic-bezier(.45, 0, .7, 1)' });
      await anim.finished.catch(() => {});
      img.remove();
    }
    target.classList.remove('pop');
    void target.offsetWidth;
    target.classList.add('pop');
    this.flying--;
  }
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// What the satchel holds, on a paper card: the artifact, then the coins with their counts,
// and how far it is to the vault where they are stored.
export class SatchelView {
  // deps: { t, coinThumb(id), artifactThumb(id), coinOrder: [id], sfx }
  constructor(root, deps) {
    this.root = root;
    this.deps = deps;
    this.el = (sel) => root.querySelector(sel);
    this.isOpen = false;
    this.el('.scroll-backdrop').onclick = () => this.close();
    this.el('#satchel-close').onclick = () => this.close();
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.isOpen) this.close(); });
  }

  // satchel: state.satchel. distanceText: the line about the way to the vault.
  open(satchel, distanceText) {
    const { t, coinThumb, artifactThumb, coinOrder } = this.deps;
    const img = (thumb) => (thumb ? `<img alt="" src="${thumb.url}">` : '');
    let html = '';
    for (const a of satchel.artifacts) {
      html += `<div class="sv-item sv-art">${img(artifactThumb(a.id))}<span class="sv-name">${esc(t(`artifacts.${a.id}.name`))}</span></div>`;
    }
    const coins = Object.entries(satchel.coins).sort(([a], [b]) => coinOrder.indexOf(a) - coinOrder.indexOf(b));
    for (const [id, n] of coins) {
      html += `<div class="sv-item">${img(coinThumb(id))}<span class="sv-name">${esc(t(`items.${id}.name`))}</span><span class="sv-count">×${n}</span></div>`;
    }
    const count = Object.values(satchel.coins).reduce((a, b) => a + b, 0) + satchel.artifacts.length;
    this.el('.card-label').textContent = t('btn.satchel');
    this.el('.card-title').textContent = t('satchel.count', { n: count });
    this.el('.sv-items').innerHTML = html;
    this.el('.scroll-msg').textContent = distanceText;
    this.root.hidden = false;
    this.isOpen = true;
    this.deps.sfx.paper();
    requestAnimationFrame(() => this.root.classList.add('show'));
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.deps.sfx.paper();
    this.root.classList.remove('show');
    setTimeout(() => { if (!this.isOpen) this.root.hidden = true; }, 380);
  }
}
