// Tomb gate art: the eight carved animal symbols, a key shard, a small gate sketch for the
// discovery card, and the gate itself with its three rings. Symbols are language-neutral.

import { formatRoman } from '../i18n/i18n.js';
import { SYMBOLS } from '../game/rules.js';

const INK = '#3b2414';
const RED = '#8b1e1e';

// Each symbol fits a 32 × 32 box centred on 0,0 and is drawn in currentColor.
// Mirrored halves (legs, wings) are written once and flipped.
const dot = (x, y, r = 1.4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="currentColor" stroke="none"/>`;
const both = (d) => `<path d="${d}"/><path d="${d}" transform="scale(-1 1)"/>`;

const GLYPHS = {
  fish: `<path d="M-13 0 C-7 -9 3 -9 8 0 C3 9 -7 9 -13 0 Z"/><path d="M8 0 L15 -6 L14 0 L15 6 Z"/>
    <path d="M-4 -6 Q-1 0 -4 6"/>${dot(-8.5, -1.5)}`,
  spider: `<ellipse cx="0" cy="3.5" rx="4.5" ry="5.5"/><circle cx="0" cy="-4.5" r="3"/>
    ${both('M-4 0 L-9 -6 L-12 -12 M-4 2.5 L-11 -1 L-15 3 M-4 5 L-10 7 L-13 13 M-2.5 8 L-6 12 L-6 16')}`,
  fly: `<ellipse cx="0" cy="4" rx="3" ry="7.5"/><circle cx="0" cy="-5.5" r="2.8"/><path d="M-3 3 h6 M-3 7 h6"/>
    ${both('M-2.5 -1 C-9 -12 -16 -10 -14.5 -3 C-13 2 -7 2 -2.5 1 Z')}${both('M-3 5 L-7 8 L-8 12')}`,
  turtle: `<ellipse cx="0" cy="1" rx="9" ry="10.5"/><path d="M0 -5 L5 -1 L4 5 L-4 5 L-5 -1 Z M0 -5 V-9.5 M0 5 V11.5"/>
    ${both('M-5 -1 L-9 -2 M-4 5 L-6.5 9')}<ellipse cx="0" cy="-12.5" rx="2.8" ry="3.2"/>
    ${both('M-7.5 -6 L-12 -10 M-7.5 8 L-12 12')}<path d="M0 11.5 L0 15"/>`,
  bird: `<path d="M-11 1 C-6 -6 4 -7 8 -3 C9 3 2 7 -5 6 Z"/><path d="M-5 -1 Q0 -3 4 1"/>
    <circle cx="9" cy="-7" r="3.4"/><path d="M12.2 -8.2 L16 -6.6 L12.2 -5.4"/><path d="M-11 1 L-16 -2.5 M-11 2 L-16 3.5"/>
    <path d="M-1 6 L-2 13 M3 5.5 L4 13 M-4 13 h4 M2 13 h4"/>${dot(9.8, -7.6, 1.1)}`,
  man: `<circle cx="0" cy="-10.5" r="3.5"/><path d="M0 -7 L0 4"/>
    ${both('M0 -3 L-6 -4 L-10 -11 M0 4 L-6 9 L-7 15')}`,
  cat: `<path d="M-7 -8 L-8 -15 L-3 -11 Q0 -12 3 -11 L8 -15 L7 -8 Q7 -3 0 -2 Q-7 -3 -7 -8 Z"/>
    <path d="M-5 -3 Q-10 6 -7 14 L7 14 Q10 6 5 -3"/><path d="M7 13 Q14 13 13.5 5"/>
    ${dot(-3, -8, 1.2)}${dot(3, -8, 1.2)}<path d="M-1 -5.6 L1 -5.6 L0 -4.6 Z"/>`,
  snake: `<path d="M-14 11 C-14 4 -6 4 -6 8 C-6 13 2 13 2 6 C2 -1 -8 -2 -8 -7 C-8 -12 1 -14 5 -11"/>
    <ellipse cx="8.5" cy="-10.5" rx="4" ry="2.8" transform="rotate(-12 8.5 -10.5)"/>
    <path d="M12.4 -11.6 L15.5 -12.6 M14.4 -12 L15.6 -10.6"/>${dot(9.4, -11.4, 1)}`,
};

// The symbol as SVG children; the caller sets stroke width and colour.
export const glyph = (id) => GLYPHS[id] ?? '';

// A standalone symbol, e.g. for the shard chips.
export function glyphSVG(id, color = INK, width = 2.2) {
  return `<svg viewBox="-17 -17 34 34" aria-hidden="true"><g color="${color}" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round">${glyph(id)}</g></svg>`;
}

// Shards found so far, with blanks for the missing ones.
export function shardRow(shards, total) {
  let html = '';
  for (let i = 0; i < total; i++) {
    html += shards[i] ? `<span class="shard-chip">${glyphSVG(shards[i], RED)}</span>` : '<span class="shard-chip empty">?</span>';
  }
  return html;
}

// Card sketch: a broken potsherd with one symbol painted on it.
export function shardSketch(id) {
  return `
<svg viewBox="0 0 220 140" aria-hidden="true">
  <g fill="none" stroke="${INK}" stroke-linecap="round" stroke-linejoin="round">
    <path d="M52 120 Q110 128 168 117" stroke-width="1" opacity=".45"/>
    <path d="M62 120 l8 -4 M80 122 l8 -4 M98 123 l8 -4 M140 121 l8 -4 M156 119 l8 -4" stroke-width=".9" opacity=".35"/>
    <path d="M60 42 L84 26 L104 30 L120 20 L152 30 L170 60 L163 84 L168 100 L132 114 L112 110 L74 112 L52 86 L56 64 Z" fill="#c98c5c" fill-opacity=".38" stroke-width="2.6"/>
    <path d="M66 46 Q108 26 150 36" stroke-width="1" opacity=".55"/>
    <path d="M158 46 l7 7 M160 58 l7 7 M156 70 l7 7 M154 84 l8 6 M148 96 l8 6 M136 104 l6 6" stroke-width=".9" opacity=".45"/>
    <path d="M104 30 L100 44 L106 52 M152 30 L144 40" stroke-width="1.1" opacity=".7"/>
    <path d="M74 112 L78 100 L72 92" stroke-width="1" opacity=".6"/>
  </g>
  <g transform="translate(111 72) scale(1.55)" color="${RED}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${glyph(id)}</g>
</svg>`;
}

// Card sketch for a discovered tomb: a gate set in an arch, its rings locked.
export function gateSketch(n) {
  const ticks = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2;
    return `M${(110 + Math.sin(a) * 22).toFixed(1)} ${(74 - Math.cos(a) * 22).toFixed(1)} L${(110 + Math.sin(a) * 27).toFixed(1)} ${(74 - Math.cos(a) * 27).toFixed(1)}`;
  }).join(' ');
  return `
<svg viewBox="0 0 220 140" aria-hidden="true">
  <g fill="none" stroke="${INK}" stroke-linecap="round" stroke-linejoin="round">
    <path d="M40 124 Q110 130 180 122" stroke-width="1" opacity=".45"/>
    <path d="M54 124 V44 Q110 0 166 44 V124" stroke-width="2.6"/>
    <path d="M68 124 V50 Q110 14 152 50 V124" stroke-width="1.6"/>
    <path d="M54 62 h14 M54 84 h14 M54 106 h14 M152 62 h14 M152 84 h14 M152 106 h14 M70 30 l8 10 M150 30 l-8 10 M110 8 v12" stroke-width="1" opacity=".6"/>
    <path d="M110 22 V124" stroke-width="1.2" opacity=".7"/>
    <circle cx="110" cy="74" r="30" fill="#efe0bd" stroke-width="2"/>
    <circle cx="110" cy="74" r="20" stroke-width="1.4"/>
    <circle cx="110" cy="74" r="10" stroke-width="1.4"/>
    <path d="${ticks}" stroke-width="1"/>
    <path d="M110 38 l-5 -8 h10 Z" fill="${RED}" stroke="${RED}" stroke-width="1"/>
  </g>
  <text x="14" y="26" font-family="Cinzel, serif" font-weight="700" font-size="17" fill="${INK}">${formatRoman(n)}</text>
</svg>`;
}

// The gate: two stone leaves meeting in the middle and three bronze rings carrying the
// symbols. Ring k is a <g data-ring="k"> rotated about the centre; the marker at the top
// reads the combination, outer ring first. Geometry is shared with the drag code.
export const GATE = { size: 320, c: 160, rings: [128, 94, 60], band: 32, hub: 42 };

export function gateSVG() {
  const { size, c, rings, band, hub } = GATE;
  // Stone courses and joints on the left leaf; the right leaf mirrors them.
  const masonry = [52, 96, 140, 184, 228, 272].map((y) => `M14 ${y} H158`).join(' ') + ' ' +
    [[30, 52, 96], [110, 96, 140], [70, 140, 184], [126, 184, 228], [40, 228, 272], [100, 272, 306], [96, 14, 52]]
      .map(([x, y0, y1]) => `M${x} ${y0} V${y1}`).join(' ');
  const ring = (k) => {
    const R = rings[k];
    const marks = SYMBOLS.map((id, i) => `
      <g transform="rotate(${i * 45} ${c} ${c}) translate(${c} ${c - R}) scale(.82)">${glyph(id)}</g>`).join('');
    const notches = SYMBOLS.map((_, i) => `<path d="M${c} ${c - R - band / 2 + 1} v4" transform="rotate(${i * 45 + 22.5} ${c} ${c})"/>`).join('');
    return `<g class="gate-ring" data-ring="${k}">
      <circle cx="${c}" cy="${c}" r="${R}" fill="none" stroke="url(#gate-bronze)" stroke-width="${band - 2}"/>
      <circle cx="${c}" cy="${c}" r="${R + band / 2 - 1}" fill="none" stroke="#2a170a" stroke-width="1.6"/>
      <circle cx="${c}" cy="${c}" r="${R - band / 2 + 1}" fill="none" stroke="#2a170a" stroke-width="1.6"/>
      <g fill="none" stroke="#5a3a14" stroke-width="1.2" opacity=".8">${notches}</g>
      <g color="#2b1708" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">${marks}</g>
    </g>`;
  };
  const a = (deg, r) => [c + Math.sin((deg * Math.PI) / 180) * r, c - Math.cos((deg * Math.PI) / 180) * r];
  const [x0, y0] = a(-21, hub + 2), [x1, y1] = a(-21, rings[0] + band / 2 + 3), [x2, y2] = a(21, rings[0] + band / 2 + 3), [x3, y3] = a(21, hub + 2);
  const window = `M${x0} ${y0} L${x1} ${y1} A${rings[0] + band / 2 + 3} ${rings[0] + band / 2 + 3} 0 0 1 ${x2} ${y2} L${x3} ${y3} A${hub + 2} ${hub + 2} 0 0 0 ${x0} ${y0} Z`;
  return `
<svg class="gate-svg" viewBox="0 0 ${size} ${size}" aria-hidden="true">
  <defs>
    <linearGradient id="gate-stone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b5046"/><stop offset="1" stop-color="#2f2822"/></linearGradient>
    <linearGradient id="gate-bronze" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9c477"/><stop offset=".45" stop-color="#a8752b"/><stop offset=".55" stop-color="#8a5c20"/><stop offset="1" stop-color="#d6a85a"/></linearGradient>
    <radialGradient id="gate-hub" cx="40%" cy="35%"><stop offset="0" stop-color="#7a5a3a"/><stop offset="1" stop-color="#2a1a0e"/></radialGradient>
    <radialGradient id="gate-light" cx="50%" cy="50%"><stop offset="0" stop-color="#fff2c8"/><stop offset=".4" stop-color="#f3c66a"/><stop offset="1" stop-color="#3a1c06"/></radialGradient>
    <clipPath id="gate-frame"><rect x="8" y="8" width="304" height="304"/></clipPath>
  </defs>
  <rect class="gate-inside" x="14" y="14" width="292" height="292" fill="url(#gate-light)"/>
  <g clip-path="url(#gate-frame)">
  <g class="gate-leaf left">
    <rect x="10" y="10" width="150" height="300" fill="url(#gate-stone)" stroke="#1a120c" stroke-width="3"/>
    <path d="${masonry}" stroke="#1a120c" stroke-width="1.4" opacity=".55"/>
  </g>
  <g class="gate-leaf right">
    <rect x="160" y="10" width="150" height="300" fill="url(#gate-stone)" stroke="#1a120c" stroke-width="3"/>
    <path d="${masonry}" transform="matrix(-1 0 0 1 ${size} 0)" stroke="#1a120c" stroke-width="1.4" opacity=".55"/>
  </g>
  </g>
  <rect x="9" y="9" width="302" height="302" fill="none" stroke="#1a120c" stroke-width="4"/>
  <g class="gate-lock">
    <circle cx="${c}" cy="${c}" r="${rings[0] + band / 2 + 6}" fill="#1c120b" opacity=".55"/>
    ${ring(0)}${ring(1)}${ring(2)}
    <circle cx="${c}" cy="${c}" r="${hub}" fill="url(#gate-hub)" stroke="#2a170a" stroke-width="2"/>
    <path d="M${c} ${c - 14} a7 7 0 1 1 -0.1 0 Z M${c - 4} ${c - 4} L${c - 8} ${c + 16} H${c + 8} L${c + 4} ${c - 4} Z" fill="#120a05"/>
    <path class="gate-window" d="${window}" fill="#fff4d0" fill-opacity=".14" stroke="#f6dc95" stroke-opacity=".55" stroke-width="1.4"/>
    <path d="M${c} ${c - rings[0] - band / 2 - 2} l-9 -12 h18 Z" fill="${RED}" stroke="#2a0a06" stroke-width="1.4"/>
  </g>
</svg>`;
}
