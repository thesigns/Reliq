// Map icons drawn as ink-on-parchment SVG, rasterised into the sprite atlas.

const INK = '#3b2414';
const PAPER = '#ecdcb4';
const SCALE = 3; // raster pixels per SVG unit

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const poly = (a) => a.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
const f1 = (v) => v.toFixed(1);

function svg(w, h, body, scale = SCALE) {
  return {
    w: w * scale,
    h: h * scale,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${w * scale}" height="${h * scale}" viewBox="0 0 ${w} ${h}">${body}</svg>`,
  };
}

// Slanted hand-drawn hatch strokes covering a box; callers clip them to a shape.
function hatch(x0, x1, y0, y1, step, slant, r) {
  let d = '';
  for (let x = x0; x < x1; x += step * (0.8 + r() * 0.4)) {
    const a = y0 + r() * 3, b = y1 - r() * 3;
    d += `M${f1(x + r() * 0.6)} ${f1(a)} l${f1(slant * (b - a))} ${f1(b - a)} `;
  }
  return d;
}

function mountain({ w, h, profile, shadows, ridges, seed }) {
  const r = rng(seed);
  let defs = '', shade = '';
  shadows.forEach((s, i) => {
    const id = `m${seed}_${i}`;
    const xs = s.map((p) => p[0]), ys = s.map((p) => p[1]);
    defs += `<clipPath id="${id}"><path d="${poly(s)}Z"/></clipPath>`;
    shade += `<path d="${poly(s)}Z" fill="#7a4e26" fill-opacity=".2"/>`;
    shade += `<path d="${hatch(Math.min(...xs) - 12, Math.max(...xs) + 4, Math.min(...ys), Math.max(...ys), 3.4, 0.2, r)}" clip-path="url(#${id})" stroke="${INK}" stroke-width="1" stroke-linecap="round" fill="none" opacity=".8"/>`;
  });
  const lines = ridges.map((rd) => `<path d="${poly(rd)}" fill="none" stroke="${INK}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
  return svg(w, h, `<defs>${defs}</defs>
    <path d="${poly(profile)}Z" fill="${PAPER}" fill-opacity=".9"/>
    ${shade}
    <path d="${poly(profile)}" fill="none" stroke="${INK}" stroke-width="2.3" stroke-linejoin="round" stroke-linecap="round"/>
    ${lines}
    <path d="M${profile[0][0] + 4} ${h - 2.5} h${(w * 0.18).toFixed(0)} M${w * 0.62} ${h - 2} h${(w * 0.2).toFixed(0)}" stroke="${INK}" stroke-width="1" stroke-linecap="round" opacity=".6"/>`);
}

function hill({ w, h, seed, peak }) {
  const r = rng(seed);
  const id = `h${seed}`;
  const outline = `M3 ${h - 4} Q${peak} ${-h * 0.55} ${w - 3} ${h - 4}`;
  const shadow = `M${peak} ${h * 0.32} Q${(peak + w) / 2 + 6} ${h * 0.28} ${w - 3} ${h - 4} L${peak + 2} ${h - 4} Z`;
  return svg(w, h, `<defs><clipPath id="${id}"><path d="${shadow}"/></clipPath></defs>
    <path d="${outline} Z" fill="${PAPER}" fill-opacity=".85"/>
    <path d="${shadow}" fill="#7a4e26" fill-opacity=".16"/>
    <path d="${hatch(peak - 6, w, 0, h, 3.6, 0.15, r)}" clip-path="url(#${id})" stroke="${INK}" stroke-width=".95" fill="none" opacity=".75"/>
    <path d="${outline}" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`);
}

function crownPath(cx, cy, rx, ry, n, r) {
  const p = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const k = 0.92 + r() * 0.12;
    p.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  let d = `M${f1(p[0][0])} ${f1(p[0][1])}`;
  for (let i = 0; i < n; i++) {
    const a = p[i], b = p[(i + 1) % n];
    const am = ((i + 0.5) / n) * Math.PI * 2 - Math.PI / 2;
    const k = 1.22 + r() * 0.1;
    d += ` Q${f1(cx + Math.cos(am) * rx * k)} ${f1(cy + Math.sin(am) * ry * k)} ${f1(b[0])} ${f1(b[1])}`;
  }
  return d + ' Z';
}

function deciduous(seed) {
  const r = rng(seed);
  const w = 60, h = 76;
  const crown = crownPath(30, 30, 20, 19, 8 + Math.floor(r() * 3), r);
  const id = `t${seed}`;
  return svg(w, h, `<defs><clipPath id="${id}"><path d="${crown}"/></clipPath></defs>
    <path d="M30 48 Q28.5 58 30 70" stroke="${INK}" stroke-width="2.8" fill="none" stroke-linecap="round"/>
    <path d="M30 56 l-5 -5" stroke="${INK}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <path d="${crown}" fill="${PAPER}"/>
    <path d="${crown}" fill="#9a9a52" fill-opacity=".45"/>
    <g clip-path="url(#${id})">
      <ellipse cx="40" cy="40" rx="20" ry="17" fill="#4e4a22" fill-opacity=".28"/>
      <path d="${hatch(24, 62, 18, 56, 3, 0.3, r)}" stroke="${INK}" stroke-width=".9" fill="none" opacity=".7"/>
    </g>
    <path d="${crown}" fill="none" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M20 72 Q30 69 41 72" stroke="${INK}" stroke-width="1.1" fill="none" opacity=".55"/>`);
}

function pine(seed) {
  const r = rng(seed);
  const w = 46, h = 84;
  const j = () => f1((r() - 0.5) * 2);
  const body = `M23 4 L15 ${22 + +j()} L19 22 L10 ${41 + +j()} L15 41 L6 62 L40 62 L31 41 L36 ${41 + +j()} L27 22 L31 ${22 + +j()} Z`;
  const id = `p${seed}`;
  return svg(w, h, `<defs><clipPath id="${id}"><path d="${body}"/></clipPath></defs>
    <path d="M23 60 L23 78" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>
    <path d="${body}" fill="${PAPER}"/>
    <path d="${body}" fill="#7f8448" fill-opacity=".45"/>
    <g clip-path="url(#${id})">
      <rect x="23" y="0" width="30" height="70" fill="#3e3f1c" fill-opacity=".25"/>
      <path d="${hatch(22, 46, 4, 64, 2.8, 0.25, r)}" stroke="${INK}" stroke-width=".85" fill="none" opacity=".75"/>
    </g>
    <path d="${body}" fill="none" stroke="${INK}" stroke-width="1.9" stroke-linejoin="round"/>
    <path d="M14 80 Q23 77 33 80" stroke="${INK}" stroke-width="1.1" fill="none" opacity=".55"/>`);
}

function grass(seed) {
  const r = rng(seed);
  let d = '';
  const n = 4 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const x = 8 + (i / (n - 1)) * 24 + (r() - 0.5) * 3;
    const lean = (x - 20) * 0.5 + (r() - 0.5) * 6;
    const top = 6 + r() * 10;
    d += `M${f1(x)} 26 Q${f1(x + lean * 0.2)} ${f1((26 + top) / 2)} ${f1(x + lean)} ${f1(top)} `;
  }
  return svg(40, 30, `<path d="${d}" stroke="${INK}" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".85"/>
    <path d="M5 27 Q20 25.5 35 27" stroke="${INK}" stroke-width="1" fill="none" opacity=".5"/>`);
}

function waxSeal() {
  const r = rng(7);
  let d = '';
  const n = 26, pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = 38 + (r() - 0.5) * 5;
    pts.push([50 + Math.cos(a) * rr, 50 + Math.sin(a) * rr]);
  }
  d = `M${f1((pts[0][0] + pts[n - 1][0]) / 2)} ${f1((pts[0][1] + pts[n - 1][1]) / 2)}`;
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    d += ` Q${f1(a[0])} ${f1(a[1])} ${f1((a[0] + b[0]) / 2)} ${f1((a[1] + b[1]) / 2)}`;
  }
  const beads = Array.from({ length: 28 }, (_, i) => {
    const a = (i / 28) * Math.PI * 2;
    return `<circle cx="${f1(50 + Math.cos(a) * 31)}" cy="${f1(50 + Math.sin(a) * 31)}" r="1.5"/>`;
  }).join('');
  const keyhole = 'M50 33 a9 9 0 0 1 5.2 16.4 l4.2 15.6 h-18.8 l4.2 -15.6 A9 9 0 0 1 50 33 Z';
  return svg(100, 112, `<defs>
      <radialGradient id="wax" cx="40%" cy="34%" r="72%"><stop offset="0" stop-color="#d4503f"/><stop offset=".5" stop-color="#9c2219"/><stop offset="1" stop-color="#560c08"/></radialGradient>
      <filter id="sb" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3.5"/></filter>
    </defs>
    <ellipse cx="54" cy="58" rx="42" ry="40" fill="#1a0a04" opacity=".45" filter="url(#sb)"/>
    <path d="M28 78 q-3 16 3 24 q6 -3 3 -20 Z M66 84 q1 12 6 15 q4 -4 -1 -16 Z" fill="url(#wax)"/>
    <path d="${d} Z" fill="url(#wax)"/>
    <circle cx="50" cy="50" r="27" fill="none" stroke="#4d0a07" stroke-width="3" opacity=".75"/>
    <circle cx="50.6" cy="51.2" r="27" fill="none" stroke="#ef8a7c" stroke-width="1.1" opacity=".45"/>
    <g fill="#ee8576" opacity=".55">${beads}</g>
    <path d="${keyhole}" fill="#f19a8d" opacity=".35" transform="translate(.9 1.3)"/>
    <path d="${keyhole}" fill="#4d0a07" opacity=".9"/>
    <ellipse cx="36" cy="30" rx="13" ry="6" fill="#fff" opacity=".2" transform="rotate(-32 36 30)"/>`, 2);
}

// The tomb gate seen head-on: a stone disc with the three key rings, eight dots on each
// where the gate carries its symbols, and the lock in the hub. Its centre is the spot where
// the tomb was found.
function tomb() {
  const r = rng(11);
  const c = 50;
  const circle = (rr) => `M${c - rr} ${c} a${rr} ${rr} 0 1 0 ${2 * rr} 0 a${rr} ${rr} 0 1 0 ${-2 * rr} 0 Z`;
  const dots = (rr, size) => Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2;
    return `<circle cx="${f1(c + Math.sin(a) * rr)}" cy="${f1(c - Math.cos(a) * rr)}" r="${size}"/>`;
  }).join('');
  const STONE = '#ddc898';
  const keyhole = `M${c} ${c - 5.6} a3.2 3.2 0 0 1 1.9 5.8 l1.5 5.4 h-6.8 l1.5 -5.4 A3.2 3.2 0 0 1 ${c} ${c - 5.6} Z`;
  return svg(100, 100, `<defs>
      <filter id="tombShadow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.6"/></filter>
      <clipPath id="tombBand"><path d="${circle(44)} ${circle(32)}" clip-rule="evenodd"/></clipPath>
    </defs>
    <circle cx="${c + 2}" cy="${c + 3}" r="44" fill="#1a0a04" opacity=".35" filter="url(#tombShadow)"/>
    <circle cx="${c}" cy="${c}" r="44" fill="${STONE}"/>
    <path d="${hatch(c - 46, c + 46, c + 2, c + 46, 3.2, 0.3, r)}" stroke="${INK}" stroke-width="1" opacity=".45" clip-path="url(#tombBand)"/>
    <g fill="none" stroke="${INK}">
      <circle cx="${c}" cy="${c}" r="44" stroke-width="3.6"/>
      <circle cx="${c}" cy="${c}" r="32" stroke-width="2.6"/>
      <circle cx="${c}" cy="${c}" r="20.5" stroke-width="2.4"/>
    </g>
    <circle cx="${c}" cy="${c}" r="10" fill="${PAPER}" stroke="${INK}" stroke-width="2.2"/>
    <g fill="${INK}">${dots(38, 3)}${dots(26.2, 2.6)}${dots(15.3, 1.9)}</g>
    <path d="${keyhole}" fill="${INK}"/>`);
}

function needle() {
  return svg(100, 100, `<defs>
      <linearGradient id="nr" x1="0" x2="1"><stop offset="0" stop-color="#c63b2c"/><stop offset=".5" stop-color="#e86150"/><stop offset=".5" stop-color="#8e1f17"/><stop offset="1" stop-color="#5e110b"/></linearGradient>
      <linearGradient id="ns" x1="0" x2="1"><stop offset="0" stop-color="#e5c67c"/><stop offset=".5" stop-color="#f7e6ae"/><stop offset=".5" stop-color="#a47a30"/><stop offset="1" stop-color="#6f4c19"/></linearGradient>
      <radialGradient id="pv" cx="40%" cy="35%"><stop offset="0" stop-color="#fff6d6"/><stop offset=".45" stop-color="#d7ae55"/><stop offset="1" stop-color="#6a4613"/></radialGradient>
      <filter id="nb" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4"/></filter>
    </defs>
    <path d="M50 4 L63 50 L50 96 L37 50 Z" fill="#140802" opacity=".45" filter="url(#nb)" transform="translate(3 4)"/>
    <path d="M50 4 L62 50 L38 50 Z" fill="url(#nr)" stroke="#3b1009" stroke-width="1.1" stroke-linejoin="round"/>
    <path d="M38 50 L62 50 L50 96 Z" fill="url(#ns)" stroke="#4a3210" stroke-width="1.1" stroke-linejoin="round"/>
    <circle cx="50" cy="50" r="8.5" fill="url(#pv)" stroke="#4a3210" stroke-width="1.1"/>
    <circle cx="50" cy="50" r="2.4" fill="#4a3210"/>`, 2);
}

// The wax seal on its own, for the "vault set up" stamp animation.
export const sealSVG = () => waxSeal().svg;

export function buildIconSet() {
  const icons = {
    mountain0: mountain({
      w: 120, h: 90, seed: 1,
      profile: [[4, 86], [18, 66], [27, 58], [33, 62], [44, 40], [52, 30], [60, 14], [66, 22], [74, 34], [80, 44], [86, 41], [94, 50], [104, 66], [116, 86]],
      shadows: [[[60, 14], [66, 22], [74, 34], [80, 44], [86, 41], [94, 50], [104, 66], [116, 86], [70, 86], [66, 62], [63, 40]]],
      ridges: [[[60, 14], [63, 40], [66, 62], [69, 80]], [[33, 62], [36, 74]], [[86, 41], [84, 56]]],
    }),
    mountain1: mountain({
      w: 130, h: 90, seed: 2,
      profile: [[4, 86], [20, 62], [30, 40], [38, 22], [46, 34], [54, 48], [60, 44], [68, 30], [78, 10], [88, 32], [98, 52], [108, 64], [126, 86]],
      shadows: [
        [[38, 22], [46, 34], [54, 48], [58, 46], [52, 70], [50, 86], [43, 86], [41, 52]],
        [[78, 10], [88, 32], [98, 52], [108, 64], [126, 86], [87, 86], [83, 56], [80, 30]],
      ],
      ridges: [[[38, 22], [41, 52], [44, 80]], [[78, 10], [80, 30], [83, 56], [86, 82]]],
    }),
    mountain2: mountain({
      w: 92, h: 100, seed: 3,
      profile: [[4, 96], [16, 76], [26, 60], [34, 40], [42, 22], [48, 8], [54, 20], [60, 34], [66, 46], [74, 62], [88, 96]],
      shadows: [[[48, 8], [54, 20], [60, 34], [66, 46], [74, 62], [88, 96], [55, 96], [52, 60], [50, 30]]],
      ridges: [[[48, 8], [50, 30], [52, 60], [54, 90]], [[26, 60], [30, 72]]],
    }),
    hill0: hill({ w: 100, h: 44, seed: 4, peak: 48 }),
    hill1: hill({ w: 80, h: 40, seed: 5, peak: 36 }),
    tree0: deciduous(21),
    tree1: deciduous(22),
    tree2: deciduous(23),
    pine0: pine(31),
    pine1: pine(32),
    grass0: grass(41),
    grass1: grass(42),
    grass2: grass(43),
    seal: waxSeal(),
    tomb: tomb(),
    needle: needle(),
  };
  return icons;
}
