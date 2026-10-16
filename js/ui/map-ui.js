// DOM overlays that track map positions: tap tooltips, the off-screen vault pointer,
// region names and the tomb-zone label.

const sealIcon = `<svg viewBox="0 0 40 40" aria-hidden="true">
  <defs><radialGradient id="epw" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#d4503f"/><stop offset=".55" stop-color="#9c2219"/><stop offset="1" stop-color="#560c08"/></radialGradient></defs>
  <circle cx="20" cy="20" r="15" fill="url(#epw)"/>
  <circle cx="20" cy="20" r="11" fill="none" stroke="#4d0a07" stroke-width="1.6" opacity=".7"/>
  <path d="M20 13 a3.6 3.6 0 0 1 2.1 6.6 l1.7 6.2 h-7.6 l1.7 -6.2 A3.6 3.6 0 0 1 20 13 Z" fill="#4d0a07"/>
</svg>`;

export class MapTooltip {
  constructor(el) {
    this.el = el;
    this.anchor = null;
    this.title = el.querySelector('.tip-title');
    this.body = el.querySelector('.tip-body');
  }

  get open() { return !!this.anchor; }

  // anchor: () => { sx, sy } in stage CSS px (re-evaluated every frame), or null.
  show(title, body, anchor) {
    this.title.textContent = title;
    this.body.textContent = body;
    this.anchor = anchor;
    this.el.hidden = false;
    this.el.classList.remove('show');
    void this.el.offsetWidth;
    this.el.classList.add('show');
    this.update();
  }

  hide() {
    if (!this.anchor) return;
    this.anchor = null;
    this.el.classList.remove('show');
    this.el.hidden = true;
  }

  update(viewW = this.el.parentElement.clientWidth) {
    if (!this.anchor) return;
    const p = this.anchor();
    const w = this.el.offsetWidth, h = this.el.offsetHeight;
    const x = Math.min(viewW - w / 2 - 10, Math.max(w / 2 + 10, p.sx));
    this.el.style.transform = `translate(${(x - w / 2).toFixed(1)}px, ${(p.sy - h - 14).toFixed(1)}px)`;
    this.el.style.setProperty('--arrow', `${(p.sx - x + w / 2).toFixed(1)}px`);
  }
}

export class EdgePointer {
  constructor(el) {
    this.el = el;
    el.querySelector('.ep-icon').innerHTML = sealIcon;
    this.arrow = el.querySelector('.ep-arrow');
    this.dist = el.querySelector('.ep-dist');
  }

  // Shows the pointer on the border of the visible area when the target is off it.
  // view.avoid: screen rects of map buttons. A pointer that would sit under one takes the
  // free spot on the border closest in direction to the target.
  update(target, view, distanceText) {
    const { w, h, top, bottom, avoid = [] } = view;
    const m = 34;
    const inside = target.sx > -20 && target.sx < w + 20 && target.sy > top - 20 && target.sy < h - bottom + 20;
    if (inside) {
      if (!this.el.hidden) this.el.hidden = true;
      return;
    }
    const cx = w / 2, cy = (top + h - bottom) / 2;
    const dx = target.sx - cx, dy = target.sy - cy;
    const hx = w / 2 - m, hy = (h - bottom - top) / 2 - m;
    const k = Math.min(hx / Math.abs(dx || 1e-6), hy / Math.abs(dy || 1e-6));
    let x = cx + dx * k, y = cy + dy * k;
    const r = 26 + 6; // half the pointer, plus a gap
    const blocked = (px, py) => avoid.some((b) => px + r > b.left && px - r < b.right && py + r > b.top && py - r < b.bottom);
    if (blocked(x, y)) {
      const aim = Math.atan2(dy, dx);
      let best = null, bestD = Infinity;
      const tryAt = (px, py) => {
        if (blocked(px, py)) return;
        const a = Math.atan2(py - cy, px - cx) - aim;
        const d = Math.abs(Math.atan2(Math.sin(a), Math.cos(a)));
        if (d < bestD) { bestD = d; best = [px, py]; }
      };
      for (let t = cx - hx; t <= cx + hx; t += 6) { tryAt(t, cy - hy); tryAt(t, cy + hy); }
      for (let t = cy - hy; t <= cy + hy; t += 6) { tryAt(cx - hx, t); tryAt(cx + hx, t); }
      if (best) [x, y] = best;
    }
    this.el.hidden = false;
    this.el.style.transform = `translate(${(x - 26).toFixed(1)}px, ${(y - 26).toFixed(1)}px)`;
    this.arrow.style.transform = `rotate(${Math.atan2(target.sy - y, target.sx - x).toFixed(3)}rad)`;
    if (this.dist.textContent !== distanceText) this.dist.textContent = distanceText;
  }
}

// Pooled absolutely-positioned labels (region names, ring labels).
export class LabelLayer {
  constructor(root) {
    this.root = root;
    this.pool = new Map();
  }

  // items: [{ id, sx, sy, text, rot, cls, opacity }]
  update(items) {
    const seen = new Set();
    for (const it of items) {
      seen.add(it.id);
      let el = this.pool.get(it.id);
      if (!el) {
        el = document.createElement('span');
        this.root.appendChild(el);
        this.pool.set(it.id, el);
      }
      if (el.textContent !== it.text) el.textContent = it.text;
      if (el.className !== it.cls) el.className = it.cls;
      el.style.transform = `translate(${it.sx.toFixed(1)}px, ${it.sy.toFixed(1)}px) translate(-50%, -50%) rotate(${(it.rot ?? 0).toFixed(3)}rad)`;
      el.style.opacity = it.opacity.toFixed(3);
    }
    for (const [id, el] of this.pool) {
      if (!seen.has(id)) { el.remove(); this.pool.delete(id); }
    }
  }
}
