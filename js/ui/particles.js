// Lightweight 2D particle layer: dig dust and clods over the map, sparks and motes on reveals.

export class Particles {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.items = [];
    this.dpr = 1;
  }

  resize(w, h, dpr) {
    this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.w = w;
    this.h = h;
  }

  get active() { return this.items.length > 0; }

  clear() { this.items.length = 0; }

  dust(x, y, strength = 1) {
    for (let i = 0; i < 14 * strength; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 20 + Math.random() * 70;
      this.items.push({
        kind: 'puff', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6 - 25,
        r: 8 + Math.random() * 14, grow: 26 + Math.random() * 30, life: 0, max: 0.8 + Math.random() * 0.7,
        color: Math.random() < 0.5 ? '120,86,52' : '150,112,70',
      });
    }
    for (let i = 0; i < 10 * strength; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
      const s = 90 + Math.random() * 160;
      this.items.push({
        kind: 'clod', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        r: 1.4 + Math.random() * 2.6, life: 0, max: 0.6 + Math.random() * 0.4, g: 520,
        color: Math.random() < 0.5 ? '#3b2414' : '#5a3a1f',
      });
    }
  }

  // Ink flicked from a quill as a new searched area spreads.
  ink(x, y) {
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 40 + Math.random() * 140;
      this.items.push({
        kind: 'clod', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        r: 0.8 + Math.random() * 2.2, life: 0, max: 0.35 + Math.random() * 0.35, drag: 5,
        color: Math.random() < 0.7 ? '#3b2414' : '#6b3418',
      });
    }
  }

  sparks(x, y, count, palette) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 60 + Math.random() * 280;
      this.items.push({
        kind: 'spark', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40,
        r: 1 + Math.random() * 2.2, life: 0, max: 0.9 + Math.random() * 1.4, g: 60, drag: 1.6,
        color: palette[Math.floor(Math.random() * palette.length)],
      });
    }
  }

  // Slow floating motes / embers rising through the light.
  motes(count, palette, area) {
    for (let i = 0; i < count; i++) {
      this.items.push({
        kind: 'mote', x: area.x + Math.random() * area.w, y: area.y + Math.random() * area.h,
        vx: (Math.random() - 0.5) * 10, vy: -8 - Math.random() * 22,
        r: 0.8 + Math.random() * 1.8, life: 0, max: 3 + Math.random() * 4, phase: Math.random() * 6,
        color: palette[Math.floor(Math.random() * palette.length)],
      });
    }
  }

  update(dt) {
    const c = this.ctx;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.clearRect(0, 0, this.w, this.h);
    const keep = [];
    for (const p of this.items) {
      p.life += dt;
      if (p.life >= p.max) continue;
      keep.push(p);
      const k = p.life / p.max;
      if (p.drag) { const d = Math.exp(-p.drag * dt); p.vx *= d; p.vy *= d; }
      if (p.g) p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.kind === 'puff') {
        p.vx *= Math.exp(-3 * dt); p.vy *= Math.exp(-3 * dt);
        const r = p.r + p.grow * k;
        const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        g.addColorStop(0, `rgba(${p.color},${0.35 * (1 - k)})`);
        g.addColorStop(1, `rgba(${p.color},0)`);
        c.fillStyle = g;
        c.beginPath(); c.arc(p.x, p.y, r, 0, Math.PI * 2); c.fill();
      } else if (p.kind === 'clod') {
        c.globalAlpha = 1 - k * k;
        c.fillStyle = p.color;
        c.beginPath(); c.arc(p.x, p.y, p.r, 0, Math.PI * 2); c.fill();
        c.globalAlpha = 1;
      } else {
        c.globalCompositeOperation = 'lighter';
        const fade = p.kind === 'mote' ? Math.sin(k * Math.PI) : 1 - k;
        const tw = p.kind === 'mote' ? 0.6 + 0.4 * Math.sin(p.life * 5 + p.phase) : 1;
        const r = p.r * 3;
        const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        g.addColorStop(0, `rgba(${p.color},${fade * tw})`);
        g.addColorStop(0.35, `rgba(${p.color},${0.35 * fade * tw})`);
        g.addColorStop(1, `rgba(${p.color},0)`);
        c.fillStyle = g;
        c.beginPath(); c.arc(p.x, p.y, r, 0, Math.PI * 2); c.fill();
        c.globalCompositeOperation = 'source-over';
      }
    }
    this.items = keep;
  }
}
