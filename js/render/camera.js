// Top-down orthographic camera in local metres. ppm = CSS pixels per metre.
// Pan with inertia, pinch / wheel / double-tap zoom (smoothed), animated fly-to,
// player follow with the player kept in the middle of the visible map area.

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const TAP_MAX_MOVE = 8;      // css px
const TAP_MAX_MS = 350;
const DOUBLE_TAP_MS = 280;
const DOUBLE_TAP_DIST = 32;

export class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.ppm = 1.1;
    this.defaultPpm = 1.1;
    this.minPpm = 0.12;
    this.maxPpm = 5;
    this.follow = true;
    this.vx = 0;
    this.vy = 0;
    this.w = 1;
    this.h = 1;
    this.offsetY = 0;        // css px: while following, the player sits this far above centre
    this.zoomGoal = null;    // { ppm, sx, sy } — eased towards in update()
    this.fly = null;         // animated move, see flyTo()
    this.onUserMove = null;  // pan started by the user (follow lost)
    this.onGesture = null;   // any touch on the map
    this.onTap = null;       // (sx, sy)
    this.onDoubleTap = null; // (sx, sy, { type, ctrl }) — return false to skip the default zoom-in
  }

  setViewport(w, h) { this.w = w; this.h = h; }

  toScreen(x, y) {
    return { sx: (x - this.x) * this.ppm + this.w / 2, sy: -(y - this.y) * this.ppm + this.h / 2 };
  }

  toLocal(sx, sy) {
    return { x: this.x + (sx - this.w / 2) / this.ppm, y: this.y - (sy - this.h / 2) / this.ppm };
  }

  clampPpm(p) { return clamp(p, this.minPpm, this.maxPpm); }

  // Camera centre that puts `p` in the middle of the visible map area.
  followPoint(p) { return { x: p.x, y: p.y - this.offsetY / this.ppm }; }

  zoomAt(factor, sx, sy) {
    const before = this.toLocal(sx, sy);
    this.ppm = this.clampPpm(this.ppm * factor);
    const after = this.toLocal(sx, sy);
    if (!this.follow) {
      this.x += before.x - after.x;
      this.y += before.y - after.y;
    }
  }

  // Smooth zoom; repeated calls (wheel ticks) accumulate.
  zoomTo(ppm, sx = this.w / 2, sy = this.h / 2) {
    this.fly = null;
    this.zoomGoal = { ppm: this.clampPpm(ppm), sx, sy };
  }

  // Animated move. target: a point, or null to fly back to the player and resume following.
  flyTo(target, ppm = this.ppm, seconds = 0.8) {
    this.zoomGoal = null;
    this.vx = this.vy = 0;
    this.fly = { from: { x: this.x, y: this.y, ppm: this.ppm }, target, ppm: this.clampPpm(ppm), t: 0, dur: seconds };
    if (target) this.follow = false;
  }

  cancelMotion() {
    this.fly = null;
    this.zoomGoal = null;
    this.vx = this.vy = 0;
  }

  update(dt, player) {
    if (this.fly) {
      const f = this.fly;
      f.t = Math.min(1, f.t + dt / f.dur);
      const k = easeInOutCubic(f.t);
      this.ppm = Math.exp(Math.log(f.from.ppm) + (Math.log(f.ppm) - Math.log(f.from.ppm)) * k);
      const goal = f.target ?? (player ? this.followPoint(player) : f.from);
      this.x = f.from.x + (goal.x - f.from.x) * k;
      this.y = f.from.y + (goal.y - f.from.y) * k;
      if (f.t >= 1) {
        this.fly = null;
        if (!f.target) this.follow = true;
      }
      return;
    }
    if (this.zoomGoal) {
      const g = this.zoomGoal;
      const k = 1 - Math.exp(-dt * 14);
      const next = Math.exp(Math.log(this.ppm) + (Math.log(g.ppm) - Math.log(this.ppm)) * k);
      this.zoomAt(next / this.ppm, g.sx, g.sy);
      if (Math.abs(Math.log(g.ppm / this.ppm)) < 0.002) {
        this.zoomAt(g.ppm / this.ppm, g.sx, g.sy);
        this.zoomGoal = null;
      }
    }
    if (this.follow && player) {
      const t = this.followPoint(player);
      const k = 1 - Math.exp(-dt * 6);
      this.x += (t.x - this.x) * k;
      this.y += (t.y - this.y) * k;
    } else if (Math.hypot(this.vx, this.vy) > 0.5) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      const damp = Math.exp(-dt * 4);
      this.vx *= damp;
      this.vy *= damp;
    }
  }

  attach(el) {
    const pointers = new Map();
    let lastPinch = null;
    let lastMove = null;
    let down = null;          // first pointer of the current gesture, for tap detection
    let maxPointers = 0;
    let pendingTap = null;

    // Element-relative CSS px; also correct when the app is scaled (?inspect).
    const local = (e) => {
      const r = el.getBoundingClientRect();
      const k = r.width / el.clientWidth || 1;
      return { x: (e.clientX - r.left) / k, y: (e.clientY - r.top) / k, k };
    };

    const tap = (p, info) => {
      const now = performance.now();
      if (pendingTap && now - pendingTap.t < DOUBLE_TAP_MS && Math.hypot(p.x - pendingTap.x, p.y - pendingTap.y) < DOUBLE_TAP_DIST) {
        clearTimeout(pendingTap.timer);
        pendingTap = null;
        if (this.onDoubleTap?.(p.x, p.y, info) !== false) this.zoomTo(this.ppm * 2, p.x, p.y);
        return;
      }
      if (pendingTap) clearTimeout(pendingTap.timer);
      const pt = { x: p.x, y: p.y, t: now };
      pt.timer = setTimeout(() => { pendingTap = null; this.onTap?.(pt.x, pt.y); }, DOUBLE_TAP_MS);
      pendingTap = pt;
    };

    el.addEventListener('pointerdown', (e) => {
      el.setPointerCapture(e.pointerId);
      const p = local(e);
      pointers.set(e.pointerId, p);
      maxPointers = Math.max(maxPointers, pointers.size);
      if (pointers.size === 1) {
        down = { x: p.x, y: p.y, t: performance.now(), moved: false };
        maxPointers = 1;
      }
      this.vx = this.vy = 0;
      this.fly = null;
      lastPinch = null;
      this.onGesture?.();
    });

    el.addEventListener('pointermove', (e) => {
      const prev = pointers.get(e.pointerId);
      if (!prev) return;
      const cur = local(e);
      if (down && Math.hypot(cur.x - down.x, cur.y - down.y) > TAP_MAX_MOVE) down.moved = true;
      if (pointers.size === 1) {
        const dx = cur.x - prev.x, dy = cur.y - prev.y;
        if (!down?.moved) { pointers.set(e.pointerId, cur); return; }
        if (this.follow) { this.follow = false; this.onUserMove?.(); }
        this.zoomGoal = null;
        this.x -= dx / this.ppm;
        this.y += dy / this.ppm;
        const now = performance.now();
        if (lastMove) {
          const dt = Math.max(1, now - lastMove.t) / 1000;
          this.vx = this.vx * 0.6 + (-dx / this.ppm / dt) * 0.4;
          this.vy = this.vy * 0.6 + (dy / this.ppm / dt) * 0.4;
        }
        lastMove = { t: now };
        pointers.set(e.pointerId, cur);
      } else if (pointers.size === 2) {
        pointers.set(e.pointerId, cur);
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        this.pinching = true;
        if (lastPinch) {
          if (Math.abs(dist - lastPinch.startDist) > TAP_MAX_MOVE && down) down.moved = true;
          this.zoomGoal = null;
          this.zoomAt(dist / lastPinch.dist, mid.x, mid.y);
          if (!this.follow) {
            this.x -= (mid.x - lastPinch.mid.x) / this.ppm;
            this.y += (mid.y - lastPinch.mid.y) / this.ppm;
          }
          lastPinch = { dist, mid, startDist: lastPinch.startDist };
        } else {
          lastPinch = { dist, mid, startDist: dist };
        }
      }
    });

    const end = (e) => {
      if (!pointers.has(e.pointerId)) return;
      const p = local(e);
      pointers.delete(e.pointerId);
      lastPinch = null;
      if (pointers.size < 2) this.pinching = false;
      if (pointers.size === 0) {
        if (lastMove && performance.now() - lastMove.t > 80) this.vx = this.vy = 0;
        lastMove = null;
        const quick = down && !down.moved && performance.now() - down.t < TAP_MAX_MS;
        if (quick && e.type === 'pointerup') {
          if (maxPointers === 2) this.zoomTo(this.ppm / 2);        // two-finger tap: zoom out
          else if (maxPointers === 1) tap(p, { type: e.pointerType, ctrl: e.ctrlKey || e.metaKey });
        }
        down = null;
      }
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);

    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      const p = local(e);
      const base = this.zoomGoal?.ppm ?? this.ppm;
      this.zoomTo(base * Math.exp(-e.deltaY * 0.0015), p.x, p.y);
      this.onGesture?.();
    }, { passive: false });
  }
}
