// First-run pages: the letter, three rule pages, and the location explanation.
// Resolves once the player agrees to share their location.

import { t, setLang, getLang } from '../i18n/i18n.js';
import { vaultSketch, searchSketch, findsSketch, locationSketch } from './onboarding-art.js';
import { sfx } from './audio.js';

const STEPS = ['letter', 'vault', 'search', 'finds', 'location'];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export class Onboarding {
  constructor(root) {
    this.root = root;
    this.el = (sel) => root.querySelector(sel);
    this.step = 0;
    this.el('[data-sketch="vault"]').innerHTML = vaultSketch;
    this.el('[data-sketch="search"]').innerHTML = searchSketch;
    this.el('[data-sketch="finds"]').innerHTML = findsSketch;
    this.el('[data-sketch="location"]').innerHTML = locationSketch;
    this.el('.onb-dots').innerHTML = STEPS.map(() => '<span></span>').join('');
    for (const b of root.querySelectorAll('[data-lang]')) {
      b.onclick = () => { sfx.click(); setLang(b.dataset.lang); this.render(); };
    }
  }

  render() {
    STEPS.forEach((s, i) => this.el(`[data-step="${s}"]`).classList.toggle('active', i === this.step));
    [...this.el('.onb-dots').children].forEach((d, i) => d.classList.toggle('on', i === this.step));
    const last = this.step === STEPS.length - 1;
    this.el('#onb-next').textContent = t(last ? 'onb.location.go' : 'onb.next');
    this.el('#onb-skip').textContent = t('onb.skip');
    this.el('#onb-skip').hidden = last;
    for (const b of this.root.querySelectorAll('[data-lang]')) b.classList.toggle('on', b.dataset.lang === getLang());
  }

  // onLocation is called from the final tap, so permission prompts count as a user gesture.
  run(onLocation) {
    return new Promise((resolve) => {
      this.root.hidden = false;
      this.render();
      requestAnimationFrame(() => this.root.classList.add('show'));
      const go = async (to) => {
        sfx.paper();
        const card = this.el('.onb-sheet');
        card.classList.add('turn');
        await wait(180);
        this.step = to;
        this.render();
        card.classList.remove('turn');
      };
      this.el('#onb-skip').onclick = () => go(STEPS.length - 1);
      this.el('#onb-next').onclick = async () => {
        if (this.step < STEPS.length - 1) return go(this.step + 1);
        sfx.click();
        onLocation();
        this.root.classList.remove('show');
        await wait(450);
        this.root.hidden = true;
        resolve();
      };
    });
  }
}
