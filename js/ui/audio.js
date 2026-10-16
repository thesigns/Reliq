// Procedural sound effects (Web Audio). No audio files: everything is synthesised.

let ctx = null;
let master = null;
let reverb = null;
let enabled = true;

function ac() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createDynamicsCompressor();
    master.threshold.value = -14;
    master.ratio.value = 4;
    master.connect(ctx.destination);
    reverb = ctx.createConvolver();
    reverb.buffer = impulse(2.4, 2.8);
    const wet = ctx.createGain();
    wet.gain.value = 0.28;
    reverb.connect(wet).connect(master);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function impulse(seconds, decay) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}

function noise(seconds) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  return src;
}

function out(node, dry = 1, wet = 0.5) {
  const g = ctx.createGain();
  g.gain.value = dry;
  node.connect(g).connect(master);
  if (wet > 0) {
    const w = ctx.createGain();
    w.gain.value = wet;
    node.connect(w).connect(reverb);
  }
}

function env(gainNode, t, attack, peak, decay) {
  gainNode.gain.setValueAtTime(0.0001, t);
  gainNode.gain.exponentialRampToValueAtTime(peak, t + attack);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

export const sfx = {
  setEnabled(v) { enabled = v; },
  unlock() { if (enabled) ac(); },

  // One spade strike: low thud + gravel crunch.
  dig() {
    if (!enabled) return;
    const c = ac(), t = c.currentTime;
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(120, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
    const g = c.createGain();
    env(g, t, 0.004, 0.9, 0.22);
    o.connect(g);
    out(g, 1, 0.15);
    o.start(t); o.stop(t + 0.3);

    const n = noise(0.35);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 900 + Math.random() * 500;
    bp.Q.value = 0.8;
    const gn = c.createGain();
    env(gn, t + 0.01, 0.006, 0.55, 0.26);
    n.connect(bp).connect(gn);
    out(gn, 1, 0.2);
    n.start(t); n.stop(t + 0.35);
  },

  // Ink bleeding into paper: soft filtered swell.
  ink() {
    if (!enabled) return;
    const c = ac(), t = c.currentTime;
    const n = noise(1.6);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(300, t);
    lp.frequency.exponentialRampToValueAtTime(1800, t + 0.6);
    lp.frequency.exponentialRampToValueAtTime(400, t + 1.5);
    const g = c.createGain();
    env(g, t, 0.35, 0.12, 1.1);
    n.connect(lp).connect(g);
    out(g, 1, 0.6);
    n.start(t); n.stop(t + 1.6);
  },

  paper() {
    if (!enabled) return;
    const c = ac(), t = c.currentTime;
    const n = noise(0.5);
    const hp = c.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2200;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    for (let i = 0; i < 6; i++) g.gain.linearRampToValueAtTime(0.05 + Math.random() * 0.12, t + 0.03 + i * 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    n.connect(hp).connect(g);
    out(g, 1, 0.3);
    n.start(t); n.stop(t + 0.5);
  },

  // Metallic ring with inharmonic partials; brighter and longer for rarer coins.
  chime(rarity) {
    if (!enabled) return;
    const c = ac(), t = c.currentTime;
    const base = { common: 620, uncommon: 880, rare: 1046, legendary: 1174 }[rarity] ?? 800;
    const len = { common: 1.2, uncommon: 1.8, rare: 2.6, legendary: 3.6 }[rarity] ?? 1.5;
    const partials = [1, 2.76, 5.4, 8.93];
    partials.forEach((p, i) => {
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.value = base * p * (1 + (Math.random() - 0.5) * 0.004);
      const g = c.createGain();
      env(g, t, 0.003, 0.22 / (i + 1), len / (1 + i * 0.6));
      o.connect(g);
      out(g, 1, 0.7);
      o.start(t); o.stop(t + len + 0.1);
    });
  },

  // Deep impact for legendary/rare reveals.
  boom() {
    if (!enabled) return;
    const c = ac(), t = c.currentTime;
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(90, t);
    o.frequency.exponentialRampToValueAtTime(30, t + 1.2);
    const g = c.createGain();
    env(g, t, 0.01, 1.0, 1.4);
    o.connect(g);
    out(g, 1, 0.5);
    o.start(t); o.stop(t + 1.5);
    const n = noise(1.2);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 220;
    const gn = c.createGain();
    env(gn, t, 0.005, 0.6, 1.0);
    n.connect(lp).connect(gn);
    out(gn, 1, 0.6);
    n.start(t); n.stop(t + 1.2);
  },

  // Rising shimmer before a big reveal.
  swell(seconds = 1.2) {
    if (!enabled) return;
    const c = ac(), t = c.currentTime;
    [261.6, 329.6, 392, 523.3].forEach((f, i) => {
      const o = c.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f * (1 + (i - 1.5) * 0.002);
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(200, t);
      lp.frequency.exponentialRampToValueAtTime(2600, t + seconds);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.05, t + seconds);
      g.gain.exponentialRampToValueAtTime(0.0001, t + seconds + 1.8);
      o.connect(lp).connect(g);
      out(g, 0.8, 0.8);
      o.start(t); o.stop(t + seconds + 2);
    });
  },

  click() {
    if (!enabled) return;
    const c = ac(), t = c.currentTime;
    const o = c.createOscillator();
    o.type = 'square';
    o.frequency.setValueAtTime(1800, t);
    o.frequency.exponentialRampToValueAtTime(600, t + 0.03);
    const g = c.createGain();
    env(g, t, 0.001, 0.08, 0.05);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3000;
    o.connect(lp).connect(g);
    out(g, 1, 0.1);
    o.start(t); o.stop(t + 0.08);
  },

  // Soft two-note bell: searching is possible again (left a searched area, slowed down).
  ready() {
    if (!enabled) return;
    const c = ac(), t = c.currentTime;
    [[659.3, 0], [987.8, 0.12]].forEach(([f, d]) => {
      const o = c.createOscillator();
      o.type = 'triangle';
      o.frequency.value = f;
      const g = c.createGain();
      env(g, t + d, 0.004, 0.09, 0.9);
      o.connect(g);
      out(g, 1, 0.6);
      o.start(t + d); o.stop(t + d + 1);
    });
  },

  // A coin dropping onto the heap in the vault chest: a short bright ping and a tick of
  // metal on metal. Bronze rings lower, silver brighter; every coin a little different.
  clink(metal = 'gold') {
    if (!enabled) return;
    const c = ac(), t = c.currentTime;
    const base = ({ bronze: 1650, copper: 1750, silver: 2500, gold: 2150, electrum: 2300 }[metal] ?? 2150) * (0.94 + Math.random() * 0.12);
    [1, 2.31, 3.97].forEach((p, i) => {
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.value = base * p;
      const g = c.createGain();
      env(g, t, 0.002, 0.16 / (i + 1), 0.22 / (1 + i * 0.5));
      o.connect(g);
      out(g, 1, 0.35);
      o.start(t); o.stop(t + 0.35);
    });
    const n = noise(0.05);
    const hp = c.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 4000;
    const gn = c.createGain();
    env(gn, t, 0.001, 0.18, 0.03);
    n.connect(hp).connect(gn);
    out(gn, 1, 0.1);
    n.start(t); n.stop(t + 0.05);
  },

  // The chest lid swinging open on old hinges.
  creak() {
    if (!enabled) return;
    const c = ac(), t = c.currentTime;
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(70, t);
    o.frequency.linearRampToValueAtTime(130, t + 0.32);
    o.frequency.linearRampToValueAtTime(95, t + 0.55);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 900;
    bp.Q.value = 6;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    for (let i = 0; i < 9; i++) g.gain.linearRampToValueAtTime(0.05 + Math.random() * 0.09, t + 0.03 + i * 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.62);
    o.connect(bp).connect(g);
    out(g, 1, 0.4);
    o.start(t); o.stop(t + 0.65);
  },

  // The heavy lid slamming shut: a wooden thud with a short rattle.
  slam() {
    if (!enabled) return;
    const c = ac(), t = c.currentTime;
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(48, t + 0.25);
    const g = c.createGain();
    env(g, t, 0.003, 1.0, 0.4);
    o.connect(g);
    out(g, 1, 0.35);
    o.start(t); o.stop(t + 0.5);
    const n = noise(0.3);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1400;
    const gn = c.createGain();
    env(gn, t, 0.002, 0.7, 0.18);
    n.connect(lp).connect(gn);
    out(gn, 1, 0.3);
    n.start(t); n.stop(t + 0.3);
  },

  // The lock catching: two quick metallic clicks.
  latch() {
    if (!enabled) return;
    const c = ac(), t = c.currentTime;
    [0, 0.07].forEach((d, i) => {
      const o = c.createOscillator();
      o.type = 'square';
      o.frequency.setValueAtTime(i ? 2400 : 1500, t + d);
      o.frequency.exponentialRampToValueAtTime(500, t + d + 0.03);
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 3500;
      const g = c.createGain();
      env(g, t + d, 0.001, 0.12, 0.05);
      o.connect(lp).connect(g);
      out(g, 1, 0.25);
      o.start(t + d); o.stop(t + d + 0.08);
    });
  },

  // Something small and worthless landing on the ground.
  thud() {
    if (!enabled) return;
    const c = ac(), t = c.currentTime;
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(55, t + 0.14);
    const g = c.createGain();
    env(g, t, 0.004, 0.4, 0.18);
    o.connect(g);
    out(g, 1, 0.15);
    o.start(t); o.stop(t + 0.25);
    const n = noise(0.1);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 600;
    const gn = c.createGain();
    env(gn, t, 0.003, 0.18, 0.08);
    n.connect(lp).connect(gn);
    out(gn, 1, 0.1);
    n.start(t); n.stop(t + 0.1);
  },

  // The comic sigh over junk: "wah, wah, waaah", three falling notes through a muted horn,
  // the last one held, wobbling and sagging. Kept soft: junk is the commonest find.
  womp() {
    if (!enabled) return;
    const c = ac(), t0 = c.currentTime;
    for (const [f, at, len] of [[330, 0, 0.2], [311, 0.25, 0.2], [294, 0.5, 0.9]]) {
      const t = t0 + at, held = len > 0.5;
      const o = c.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(f, t);
      if (held) {
        o.frequency.setValueAtTime(f, t + len * 0.5);
        o.frequency.exponentialRampToValueAtTime(f * 0.89, t + len);
        const lfo = c.createOscillator();
        lfo.frequency.value = 5.5;
        const depth = c.createGain();
        depth.gain.setValueAtTime(0, t);
        depth.gain.linearRampToValueAtTime(f * 0.014, t + 0.3);
        lfo.connect(depth).connect(o.frequency);
        lfo.start(t); lfo.stop(t + len + 0.05);
      }
      // The mute opening and closing: each note says "wah".
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.Q.value = 5;
      lp.frequency.setValueAtTime(320, t);
      lp.frequency.exponentialRampToValueAtTime(1500, t + 0.07);
      lp.frequency.exponentialRampToValueAtTime(500, t + len);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.075, t + 0.03);
      g.gain.setValueAtTime(0.075, t + len * 0.6);
      g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      o.connect(lp).connect(g);
      out(g, 1, 0.3);
      o.start(t); o.stop(t + len + 0.05);
    }
  },

  // Dull "nope" when the action is unavailable.
  deny() {
    if (!enabled) return;
    const c = ac(), t = c.currentTime;
    const o = c.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(180, t);
    o.frequency.exponentialRampToValueAtTime(120, t + 0.15);
    const g = c.createGain();
    env(g, t, 0.005, 0.25, 0.16);
    o.connect(g);
    out(g, 1, 0.1);
    o.start(t); o.stop(t + 0.22);
  },
};
