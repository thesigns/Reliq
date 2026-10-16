// HUD state: action medallion, status ribbon, top-bar stats, graticule labels.

import { t } from '../i18n/i18n.js';
import { formatDMS } from '../core/geo.js';
import { medallionSVG, vaultSVG, recenterSVG, compassRoseSVG, menuSVG, gpsGlyph } from './art.js';

const $ = (id) => document.getElementById(id);

export class Hud {
  constructor() {
    $('btn-search').innerHTML = medallionSVG();
    $('btn-journal').innerHTML = vaultSVG();
    $('btn-recenter').innerHTML = recenterSVG();
    $('rose').innerHTML = compassRoseSVG();
    $('btn-menu').innerHTML = menuSVG();
    $('g-gps').innerHTML = gpsGlyph();
    this.status = null;
    this.busy = false;
    this.labels = [];
    this.labelRoot = $('grid-labels');
  }

  setStatus(st) {
    const key = JSON.stringify(st);
    if (key === this.lastStatusKey) return;
    this.lastStatusKey = key;
    this.status = st;
    this.render();
  }

  setBusy(b) {
    this.busy = b;
    this.render();
  }

  // 'play' (search for treasure) or 'place' (set up the vault).
  setMode(mode) {
    if (mode === this.mode) return;
    this.mode = mode;
    $('btn-search').classList.toggle('place', mode === 'place');
    this.render();
  }

  render() {
    const st = this.status ?? { code: 'locating' };
    // In placement mode the hint ribbon stays visible while the button is usable.
    const usable = st.code === 'ready' || st.code === 'placeVault';
    const ready = usable && !this.busy;
    const btn = $('btn-search');
    btn.classList.toggle('ready', ready);
    btn.classList.toggle('disabled', !usable && !this.busy);
    btn.classList.toggle('busy', this.busy);
    const label = this.busy ? 'action.digging' : this.mode === 'place' ? 'action.placeVault' : 'action.search';
    btn.setAttribute('aria-label', t(label));
    const ribbon = $('status');
    const showRibbon = !this.busy && st.code !== 'ready';
    ribbon.classList.toggle('visible', showRibbon);
    if (showRibbon) $('status-text').textContent = t(`status.${st.code}`, st);
  }

  // Brief flare on the medallion when it becomes usable.
  ping() {
    const b = $('btn-search');
    b.classList.remove('ping');
    void b.offsetWidth;
    b.classList.add('ping');
  }

  nudge() {
    const r = $('status');
    r.classList.remove('nudge');
    void r.offsetWidth;
    r.classList.add('nudge');
  }

  // Signal strength glyph: both arcs ≤ 15 m, inner arc ≤ 50 m, none above (or no fix).
  setGps(acc) {
    const el = $('gps-acc');
    const s = acc == null ? '±– m' : `±${Math.round(acc)} m`;
    if (el.textContent !== s) el.textContent = s;
    const q = acc == null ? 'q0' : acc <= 15 ? 'q3' : acc <= 50 ? 'q2' : 'q1';
    const stat = $('stat-gps');
    if (stat.dataset.q !== q) stat.dataset.q = q;
  }

  // Degree labels along the left (latitude) and top (longitude) edges.
  updateGridLabels(cam, frame, grid, topInset) {
    const want = [];
    const H = cam.h, W = cam.w;
    for (let i = -20; i <= 20; i++) {
      const y = grid.oy + Math.round((cam.y - grid.oy) / grid.sy + i) * grid.sy;
      const sy = cam.toScreen(0, y).sy;
      if (sy < topInset + 20 || sy > H - 140) continue;
      want.push({ x: 8, y: sy - 15, text: formatDMS(frame.toGeo(0, y).lat, true) });
    }
    for (let i = -20; i <= 20; i++) {
      const x = grid.ox + Math.round((cam.x - grid.ox) / grid.sx + i) * grid.sx;
      const sx = cam.toScreen(x, 0).sx;
      if (sx < 30 || sx > W - 100) continue;
      want.push({ x: sx + 5, y: topInset + 6, text: formatDMS(frame.toGeo(x, 0).lon, false) });
    }
    while (this.labels.length < want.length) {
      const el = document.createElement('span');
      this.labelRoot.appendChild(el);
      this.labels.push(el);
    }
    this.labels.forEach((el, i) => {
      const w = want[i];
      if (!w) { el.style.display = 'none'; return; }
      el.style.display = '';
      el.style.transform = `translate(${w.x.toFixed(1)}px, ${w.y.toFixed(1)}px)`;
      if (el.textContent !== w.text) el.textContent = w.text;
    });
  }
}

const STEPS = [5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600].map((s) => s / 3600);

// Picks a graticule step (in degrees) that lands ~150+ px apart, and its offsets in local metres.
export function pickGrid(cam, frame) {
  let step = STEPS[STEPS.length - 1];
  for (const s of STEPS) {
    if (s * frame.ky * cam.ppm >= 150) { step = s; break; }
  }
  const ox = (Math.ceil(frame.lon0 / step) * step - frame.lon0) * frame.kx;
  const oy = (Math.ceil(frame.lat0 / step) * step - frame.lat0) * frame.ky;
  return { step, ox, oy, sx: step * frame.kx, sy: step * frame.ky };
}
