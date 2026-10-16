// Ink sketches for the onboarding pages and the rules in the journal.

import { glyph } from './gate-art.js';

const INK = '#3b2414';
const RED = '#8b1e1e';

const wrap = (body) => `<svg viewBox="0 0 220 120" aria-hidden="true"><g fill="none" stroke="${INK}" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;

// Wax seal on a dashed 100 m ring, a little house and a gate.
export const vaultSketch = wrap(`
  <ellipse cx="110" cy="66" rx="74" ry="40" stroke-width="1.6" stroke-dasharray="6 5"/>
  <path d="M60 64 l14 -12 l14 12 v18 h-28 Z M68 82 v-10 h8 v10" stroke-width="1.6"/>
  <path d="M140 84 v-26 q14 -10 28 0 v26 M154 84 v-30" stroke-width="1.5"/>
  <circle cx="110" cy="62" r="13" fill="#9c2219" stroke="#4d0a07" stroke-width="1.2"/>
  <path d="M110 55 a3.6 3.6 0 0 1 2.1 6.6 l1.6 6 h-7.4 l1.6 -6 A3.6 3.6 0 0 1 110 55 Z" fill="#4d0a07" stroke="none"/>
  <path d="M30 104 Q110 112 190 102" stroke-width="1" opacity=".5"/>
  <text x="182" y="40" font-family="'EB Garamond', serif" font-style="italic" font-size="13" fill="${INK}" stroke="none">100 m</text>
  <path d="M176 44 Q170 50 168 56" stroke-width="1"/>`);

// Walker leaving the vault ring, a hatched searched blob, a red route.
export const searchSketch = wrap(`
  <ellipse cx="50" cy="70" rx="34" ry="22" stroke-width="1.2" stroke-dasharray="4 4"/>
  <circle cx="50" cy="68" r="6" fill="#9c2219" stroke="#4d0a07"/>
  <path d="M120 40 C140 26 176 30 182 52 C188 76 160 92 136 86 C114 82 104 56 120 40 Z" stroke-width="1.8" fill="#a0522d" fill-opacity=".14"/>
  <path d="M124 48 l16 -12 M122 60 l26 -20 M124 72 l36 -28 M132 80 l38 -30 M146 84 l30 -24 M162 84 l20 -16" stroke-width=".8" opacity=".6"/>
  <path d="M58 64 C76 56 90 70 104 62 S124 56 146 60" stroke="${RED}" stroke-width="2" stroke-dasharray="5 4"/>
  <path d="M146 54 v-9 M146 45 a3 3 0 1 1 .1 0 M141 62 l5 -8 l5 8 M140 52 h12" stroke-width="1.6"/>
  <text x="128" y="112" font-family="'EB Garamond', serif" font-style="italic" font-size="13" fill="${INK}" stroke="none">6 h</text>`);

// A junk can tab, a coin and a spade in a heap of earth.
export const findsSketch = wrap(`
  <ellipse cx="46" cy="70" rx="20" ry="9" stroke-width="1.6"/>
  <path d="M40 70 a6 4 0 1 1 12 0 a6 4 0 1 1 -12 0" stroke-width="1.2"/>
  <circle cx="110" cy="60" r="24" stroke-width="2.2" fill="#e8c46a" fill-opacity=".35"/>
  <circle cx="110" cy="60" r="19" stroke-width="1" stroke-dasharray="1.5 2.5"/>
  <path d="M104 50 q6 -6 12 0 q4 6 -2 12 q-8 6 -12 -2" stroke-width="1.6"/>
  <path d="M146 92 Q170 66 198 92 Z" stroke-width="1.6" fill="#a0522d" fill-opacity=".18"/>
  <path d="M156 88 l6 -6 M164 90 l10 -10 M176 90 l10 -10 M186 90 l6 -6" stroke-width=".8" opacity=".6"/>
  <path d="M186 22 L174 62" stroke-width="2.6"/>
  <path d="M179 20 L193 24" stroke-width="2.6"/>
  <path d="M166 60 L182 64 L178 80 L170 84 L162 76 Z" stroke-width="1.6" fill="#b9ad94"/>
  <path d="M172 66 L170 76" stroke-width=".9" opacity=".6"/>
  <path d="M20 100 Q110 108 200 98" stroke-width="1" opacity=".5"/>`);

// A red route past three symbol chips to a tomb gate with its rings.
const chip = (x, y, id) => `<circle cx="${x}" cy="${y}" r="11" fill="#efe0bd" stroke-width="1.4"/>
  <g transform="translate(${x} ${y}) scale(.55)" color="${RED}" stroke="currentColor" stroke-width="2.6">${glyph(id)}</g>`;
export const missionsSketch = wrap(`
  <path d="M10 106 Q110 114 210 104" stroke-width="1" opacity=".5"/>
  <path d="M16 96 C30 92 26 72 44 70 S70 92 86 88 S100 60 118 62 S134 90 150 92" stroke="${RED}" stroke-width="2" stroke-dasharray="5 4"/>
  ${chip(44, 70, 'fish')}${chip(86, 88, 'bird')}${chip(118, 62, 'cat')}
  <path d="M154 104 V56 Q180 30 206 56 V104" stroke-width="2.2"/>
  <path d="M162 104 V60 Q180 42 198 60 V104" stroke-width="1.3"/>
  <path d="M154 70 h8 M154 86 h8 M198 70 h8 M198 86 h8" stroke-width="1" opacity=".6"/>
  <circle cx="180" cy="80" r="15" fill="#efe0bd" stroke-width="1.6"/>
  <circle cx="180" cy="80" r="10" stroke-width="1.1"/>
  <circle cx="180" cy="80" r="5" stroke-width="1.1"/>
  <path d="M180 62 l-3.5 -6 h7 Z" fill="${RED}" stroke="${RED}" stroke-width="1"/>`);

// A compass needle over a dotted accuracy circle.
export const locationSketch = wrap(`
  <circle cx="110" cy="60" r="38" stroke-width="1.2" stroke-dasharray="2 4"/>
  <circle cx="110" cy="60" r="20" stroke-width="1" opacity=".5"/>
  <path d="M110 22 L120 60 L100 60 Z" fill="${RED}" stroke="#3b1009" stroke-width="1"/>
  <path d="M100 60 L120 60 L110 98 Z" fill="#c9a24e" stroke="#4a3210" stroke-width="1"/>
  <circle cx="110" cy="60" r="5" fill="#e3c071" stroke="#4a3210"/>
  <text x="104" y="16" font-family="Cinzel, serif" font-weight="700" font-size="11" fill="${INK}" stroke="none">N</text>`);
