// Ink sketches for the onboarding pages and the rules in the journal.

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

// A junk can tab, a coin and a rolled map with an X.
export const findsSketch = wrap(`
  <ellipse cx="46" cy="70" rx="20" ry="9" stroke-width="1.6"/>
  <path d="M40 70 a6 4 0 1 1 12 0 a6 4 0 1 1 -12 0" stroke-width="1.2"/>
  <circle cx="110" cy="60" r="24" stroke-width="2.2" fill="#e8c46a" fill-opacity=".35"/>
  <circle cx="110" cy="60" r="19" stroke-width="1" stroke-dasharray="1.5 2.5"/>
  <path d="M104 50 q6 -6 12 0 q4 6 -2 12 q-8 6 -12 -2" stroke-width="1.6"/>
  <rect x="154" y="44" width="40" height="34" stroke-width="1.6" fill="#efe0bd"/>
  <rect x="150" y="40" width="48" height="7" rx="3.5" stroke-width="1.4" fill="#dcc18a"/>
  <rect x="150" y="76" width="48" height="7" rx="3.5" stroke-width="1.4" fill="#dcc18a"/>
  <path d="M160 70 C168 62 172 66 178 58" stroke="${RED}" stroke-width="1.4" stroke-dasharray="2.5 2.5"/>
  <path d="M180 52 l7 7 M187 52 l-7 7" stroke="${RED}" stroke-width="2"/>
  <path d="M20 100 Q110 108 200 98" stroke-width="1" opacity=".5"/>`);

// A compass needle over a dotted accuracy circle.
export const locationSketch = wrap(`
  <circle cx="110" cy="60" r="38" stroke-width="1.2" stroke-dasharray="2 4"/>
  <circle cx="110" cy="60" r="20" stroke-width="1" opacity=".5"/>
  <path d="M110 22 L120 60 L100 60 Z" fill="${RED}" stroke="#3b1009" stroke-width="1"/>
  <path d="M100 60 L120 60 L110 98 Z" fill="#c9a24e" stroke="#4a3210" stroke-width="1"/>
  <circle cx="110" cy="60" r="5" fill="#e3c071" stroke="#4a3210"/>
  <text x="104" y="16" font-family="Cinzel, serif" font-weight="700" font-size="11" fill="${INK}" stroke="none">N</text>`);
