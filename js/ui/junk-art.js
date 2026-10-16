// Ink sketches of junk finds, in the style of an explorer's notebook.

const INK = '#3b2414';
const RED = '#8b1e1e';
const PAPER = '#efe0bd';

const ground = (x0 = 50, x1 = 170, y = 114) => `
  <path d="M${x0} ${y} Q${(x0 + x1) / 2} ${y + 6} ${x1} ${y - 3}" stroke-width="1" opacity=".45"/>
  <path d="${Array.from({ length: Math.floor((x1 - x0) / 16) }, (_, i) => `M${x0 + 10 + i * 16} ${y + 2} l8 -4`).join(' ')}" stroke-width=".9" opacity=".35"/>`;

const note = (x, y, text, arrow) => `
  <g font-family="'EB Garamond', serif" font-style="italic" fill="${INK}">
    <text x="${x}" y="${y}" font-size="16">${text}</text>
  </g>
  ${arrow ? `<path d="${arrow}" fill="none" stroke="${INK}" stroke-width="1.2" stroke-linecap="round"/>` : ''}`;

const svg = (body, extra = '') => `
<svg viewBox="0 0 220 140" aria-hidden="true">
  ${extra}
  <g fill="none" stroke="${INK}" stroke-linecap="round" stroke-linejoin="round">${body}</g>
</svg>`;

const battery = svg(`
    ${ground(48, 168)}
    <g clip-path="url(#jb-body)" stroke-width=".9" opacity=".55">
      <path d="M40 84 l14 14 M50 84 l14 14 M60 84 l14 14 M70 84 l14 14 M80 84 l14 14 M90 84 l14 14 M100 84 l14 14 M110 84 l14 14 M120 83 l14 14 M130 83 l14 14 M140 83 l14 14 M150 82 l14 14 M160 80 l12 12"/>
    </g>
    <path d="M44 46 L158 43 Q170 43 170 70 Q170 97 158 97 L44 100" stroke-width="2.6"/>
    <ellipse cx="44" cy="73" rx="11" ry="27" stroke-width="2.6" fill="${PAPER}"/>
    <path d="M39 73 h10" stroke-width="2"/>
    <path d="M170 61 h9 q4 0 4 4 v10 q0 4 -4 4 h-9" stroke-width="2.3"/>
    <path d="M120 44 Q127 70 120 98" stroke-width="1.8"/>
    <path d="M129 44 Q136 70 129 98" stroke-width="1"/>
    <path d="M143 60 v20 M133 70 h20" stroke-width="2.2"/>
    <path d="M62 52 Q100 49 112 50" stroke-width="1" opacity=".6"/>
  </g>
  <text x="70" y="80" font-family="Cinzel, serif" font-weight="700" font-size="20" fill="${INK}" stroke="none">AA</text>
  ${note(150, 26, '0,0 V', 'M160 31 Q166 40 158 46 M155 43 l3 4 l4 -3')}
  <g>`, `<defs><clipPath id="jb-body"><path d="M44 46 L158 43 Q170 43 170 70 Q170 97 158 97 L44 100 Z"/></clipPath></defs>`);

const penny = svg(`
    ${ground(60, 160, 118)}
    <ellipse cx="110" cy="74" rx="44" ry="40" stroke-width="2.6"/>
    <ellipse cx="110" cy="74" rx="37" ry="33" stroke-width="1.1"/>
    <path d="M70 92 Q110 120 150 92" stroke-width="1" opacity=".6"/>
    <path d="M76 98 l10 6 M86 104 l10 4 M98 108 l10 1 M112 108 l10 -2 M126 104 l10 -5" stroke-width=".9" opacity=".5"/>
  </g>
  <text x="110" y="86" text-anchor="middle" font-family="Cinzel, serif" font-weight="700" font-size="34" fill="${INK}">1</text>
  <path d="M92 50 h36" stroke="${INK}" stroke-width="1.2" stroke-dasharray="1 4" stroke-linecap="round"/>
  ${note(158, 24, '× 1/100', 'M168 29 Q172 38 160 44')}
  <g>`);

const pulltab = svg(`
    ${ground(56, 168)}
    <path d="M60 70 C60 46 96 40 112 52 C122 60 128 60 140 58 L176 52 C188 50 192 70 180 76 L144 86 C130 90 124 92 112 100 C94 110 60 98 60 70 Z" stroke-width="2.6"/>
    <path d="M78 70 C78 58 98 54 106 62 C112 70 104 82 94 84 C84 86 78 80 78 70 Z" stroke-width="2"/>
    <path d="M150 64 l22 -4" stroke-width="1.6"/>
    <path d="M66 82 l8 8 M74 88 l8 6 M84 94 l8 4" stroke-width=".9" opacity=".6"/>
  </g>
  ${note(124, 30, 'Al', 'M126 34 Q122 44 128 52')}
  <g>`);

const ticket = svg(`
    ${ground(44, 176, 118)}
    <path d="M40 40 L176 34 L180 104 L44 110 Z" stroke-width="2.4"/>
    <path d="M140 36 L144 106" stroke-width="1" stroke-dasharray="3 3"/>
    <path d="M56 56 h66 M56 68 h50 M56 80 h60 M56 92 h38" stroke-width="1.2" opacity=".7"/>
    <circle cx="158" cy="56" r="4" stroke-width="1.4"/>
    <circle cx="160" cy="80" r="4" stroke-width="1.4"/>
    <path d="M100 86 l30 -18" stroke="${RED}" stroke-width="2"/>
    <path d="M102 74 l28 14" stroke="${RED}" stroke-width="2"/>
  </g>
  ${note(84, 26, '13:42', 'M98 30 Q104 40 112 56')}
  <g>`);

const lighter = svg(`
    ${ground(60, 160, 120)}
    <rect x="86" y="50" width="48" height="66" rx="6" stroke-width="2.6"/>
    <path d="M86 50 h48 v-10 h-14 v-8 h-20 v8 h-14 Z" stroke-width="2.2"/>
    <ellipse cx="111" cy="32" rx="8" ry="4" stroke-width="1.6"/>
    <path d="M96 62 v46 M104 62 v46" stroke-width=".9" opacity=".5"/>
    <path d="M120 60 l10 10 M120 70 l10 10 M120 80 l10 10 M120 90 l10 10" stroke-width=".9" opacity=".55"/>
    <path d="M150 30 q6 -8 0 -16" stroke-width="1.2" stroke-dasharray="2 3" opacity=".6"/>
  </g>
  ${note(146, 50, '0 ml', 'M150 54 Q142 60 136 60')}
  <g>`);

const paperclip = svg(`
    ${ground(46, 176, 112)}
    <path d="M58 82 L150 50 C166 44 176 66 160 72 L74 102 C60 106 54 90 66 86 L148 58 C154 56 158 64 152 66 L84 90" stroke-width="2.6"/>
    <path d="M64 96 l6 6 M76 98 l6 5" stroke-width=".9" opacity=".5"/>
  </g>
  ${note(92, 40, '∅', 'M96 44 Q104 52 108 62')}
  <g>`);

const earring = svg(`
    ${ground(64, 160, 120)}
    <ellipse cx="108" cy="70" rx="32" ry="36" stroke-width="2.6"/>
    <ellipse cx="108" cy="70" rx="27" ry="31" stroke-width="1"/>
    <circle cx="108" cy="108" r="7" stroke-width="2.2"/>
    <path d="M104 104 l7 7" stroke-width=".9"/>
    <path d="M80 54 l6 4 M78 64 l7 3 M78 74 l7 2" stroke-width=".9" opacity=".6"/>
    <path d="M136 40 l6 -6" stroke-width="1.4"/>
  </g>
  ${note(146, 28, '½', 'M150 32 Q146 40 138 46')}
  <g>`);

const rubberband = svg(`
    ${ground(46, 176, 118)}
    <path d="M60 80 C50 50 100 40 130 52 C160 62 180 76 168 92 C156 108 104 104 82 98 C64 94 64 86 74 82 C96 76 140 84 152 88" stroke-width="3.2"/>
    <path d="M62 82 C54 56 100 46 128 56" stroke-width="1" opacity=".5"/>
  </g>
  ${note(120, 28, '∞', 'M126 32 Q126 40 120 46')}
  <g>`);

const bottlecap = svg(`
    ${ground(56, 168, 118)}
    <ellipse cx="110" cy="58" rx="46" ry="16" stroke-width="2.4"/>
    <path d="M64 58 L68 92 C80 104 140 104 152 92 L156 58" stroke-width="2.4"/>
    <path d="M72 64 v28 M80 66 v30 M88 67 v32 M96 68 v32 M104 68 v32 M112 68 v32 M120 68 v32 M128 67 v32 M136 66 v30 M144 64 v28 M150 62 v26" stroke-width="1" opacity=".7"/>
    <ellipse cx="110" cy="58" rx="34" ry="10" stroke-width="1" opacity=".6"/>
  </g>
  ${note(150, 26, 'PET', 'M156 30 Q152 38 144 44')}
  <g>`);

const receipt = svg(`
    ${ground(60, 166, 124)}
    <path d="M78 18 L146 16 L150 112 l-8 6 l-8 -6 l-8 6 l-8 -6 l-8 6 l-8 -6 l-8 6 l-8 -6 l-8 6 l-6 -6 Z" stroke-width="2.2"/>
    <path d="M90 32 h44 M90 42 h30 M90 54 h38 M90 64 h22 M90 76 h40 M90 86 h18" stroke-width="1.1" opacity=".35" stroke-dasharray="6 3"/>
    <path d="M120 64 h10 M120 86 h10" stroke-width="1.4" opacity=".6"/>
    <path d="M90 98 h40" stroke-width="1.6"/>
  </g>
  ${note(152, 50, '???', 'M158 54 Q154 62 146 64')}
  <g>`);

const unknown = svg(`
    <path d="M70 100 Q110 60 150 100" stroke-width="2.4"/>
    <path d="M60 108 Q110 114 160 106" stroke-width="1" opacity=".5"/>
  </g>
  <text x="110" y="70" text-anchor="middle" font-family="'EB Garamond', serif" font-style="italic" font-size="44" fill="${INK}">?</text>
  <g>`);

export const JUNK_ART = { battery, penny, pulltab, ticket, lighter, paperclip, earring, rubberband, bottlecap, receipt };

export const junkSketch = (id) => JUNK_ART[id] ?? unknown;
