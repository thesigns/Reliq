// Inline SVG artwork for the HUD: brass medallion, leather journal, compass rose, small glyphs.

const f1 = (v) => v.toFixed(2);

function ring(n, r, cx, cy, dotR) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    s += `<circle cx="${f1(cx + Math.cos(a) * r)}" cy="${f1(cy + Math.sin(a) * r)}" r="${dotR}"/>`;
  }
  return s;
}

const SPADE = `
  <path d="M51.5 19 h17 a2 2 0 0 1 2 2 v3 a2 2 0 0 1 -2 2 h-17 a2 2 0 0 1 -2 -2 v-3 a2 2 0 0 1 2 -2 Z"/>
  <path d="M57.4 25 h5.2 v40 h-5.2 Z"/>
  <path d="M49 64 h22 v13 q0 12 -11 18 q-11 -6 -11 -18 Z"/>`;

const KEYHOLE = `
  <path d="M60 30 a13 13 0 0 1 7.5 23.6 l6 22.4 h-27 l6 -22.4 A13 13 0 0 1 60 30 Z"/>
  <path d="M60 22 a38 38 0 1 1 -0.01 0 Z M60 26 a34 34 0 1 0 0.01 0 Z" fill-rule="evenodd"/>`;

export function medallionSVG() {
  // A lone spade, tipped as if digging: next to a pick it read as a blur of handles.
  const tools = `<g transform="rotate(-28 60 60) translate(0 3)">${SPADE}</g>`;
  return `<svg viewBox="0 0 120 120" class="medallion-svg" aria-hidden="true">
  <defs>
    <radialGradient id="mFace" cx="36%" cy="30%" r="78%">
      <stop offset="0" stop-color="#fbe9ae"/><stop offset=".32" stop-color="#e2b75e"/>
      <stop offset=".72" stop-color="#a6732a"/><stop offset="1" stop-color="#5a3910"/>
    </radialGradient>
    <linearGradient id="mRim" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff2c4"/><stop offset=".28" stop-color="#cf9f48"/>
      <stop offset=".55" stop-color="#5e3d12"/><stop offset=".78" stop-color="#deb15c"/><stop offset="1" stop-color="#6d4917"/>
    </linearGradient>
    <linearGradient id="mRimIn" x1="1" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#fff0c0"/><stop offset=".35" stop-color="#b98a3c"/><stop offset=".7" stop-color="#4f320d"/><stop offset="1" stop-color="#a77a30"/>
    </linearGradient>
    <linearGradient id="mSheen" x1="0" y1="0" x2="1" y2="0">
      <stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fffbe6" stop-opacity=".55"/><stop offset=".65" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="mClip"><circle cx="60" cy="60" r="45"/></clipPath>
  </defs>
  <circle cx="60" cy="61.5" r="58.5" fill="#120a04" opacity=".6"/>
  <circle cx="60" cy="60" r="57" fill="url(#mRim)"/>
  <circle cx="60" cy="60" r="49" fill="url(#mRimIn)"/>
  <g fill="#f6dc95" opacity=".9">${ring(44, 53, 60, 60, 1.55)}</g>
  <circle cx="60" cy="60" r="45.5" fill="url(#mFace)"/>
  <circle cx="60" cy="60" r="45.5" fill="none" stroke="#4a2f0c" stroke-width="1.2" opacity=".7"/>
  <circle cx="60" cy="60" r="40" fill="none" stroke="#5a3a10" stroke-width=".6" opacity=".45" stroke-dasharray="1.5 2.5"/>
  <g class="m-icon m-tools">
    <g fill="#fff3cf" opacity=".5" transform="translate(.9 1.1)">${tools}</g>
    <g fill="#432709">${tools}</g>
  </g>
  <g class="m-icon m-seal">
    <g fill="#fff3cf" opacity=".5" transform="translate(.9 1.1)">${KEYHOLE}</g>
    <g fill="#432709">${KEYHOLE}</g>
  </g>
  <g clip-path="url(#mClip)"><rect class="m-sheen" x="-60" y="0" width="120" height="120" fill="url(#mSheen)"/></g>
</svg>`;
}

// The vault: the treasure chest of the deposit scene (scripts/blender/chest.py), drawn flat
// for the dock. Barrel lid and plank body in two woods, iron straps, brass corners and lock.
export function vaultSVG() {
  return `<svg viewBox="0 0 56 56" aria-hidden="true">
  <defs>
    <linearGradient id="vcW" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8693a"/><stop offset="1" stop-color="#6e3e1c"/></linearGradient>
    <linearGradient id="vcD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a4422"/><stop offset="1" stop-color="#4b2612"/></linearGradient>
    <linearGradient id="vcB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7dd96"/><stop offset=".5" stop-color="#c08f3d"/><stop offset="1" stop-color="#6b4716"/></linearGradient>
    <linearGradient id="vcI" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6d6d76"/><stop offset=".45" stop-color="#3d3d45"/><stop offset="1" stop-color="#26262c"/></linearGradient>
  </defs>
  <ellipse cx="28" cy="48.5" rx="21" ry="2.6" fill="#000" opacity=".35"/>
  <path d="M8.5 27 V21.5 C8.5 14 17 10.5 28 10.5 C39 10.5 47.5 14 47.5 21.5 V27 Z" fill="url(#vcW)" stroke="#1d0e06" stroke-width="1.3"/>
  <path d="M9 21.5 C10 16.5 18 13.6 28 13.6 C38 13.6 46 16.5 47 21.5" fill="none" stroke="#4b2612" stroke-width=".9" opacity=".8"/>
  <path d="M8.8 24.4 H47.2" stroke="#4b2612" stroke-width=".9" opacity=".8"/>
  <rect x="8.5" y="27" width="39" height="20" fill="url(#vcD)" stroke="#1d0e06" stroke-width="1.3"/>
  <rect x="9.2" y="33.4" width="37.6" height="6.6" fill="url(#vcW)" opacity=".9"/>
  <path d="M9 33.4 H47 M9 40 H47" stroke="#2a160a" stroke-width=".8" opacity=".8"/>
  <path d="M15.5 10.9 C15.2 15 15.2 21 15.5 27 V47 H19.8 V27 C19.6 21 19.6 14.6 19.9 10.6 Z M36.1 10.6 C36.4 14.6 36.4 21 36.2 27 V47 H40.5 V27 C40.8 21 40.8 15 40.5 10.9 Z" fill="url(#vcI)" stroke="#15151a" stroke-width=".7"/>
  <path d="M8 26.4 h5.4 v21.2 h-5.4 Z M42.6 26.4 h5.4 v21.2 h-5.4 Z" fill="url(#vcB)" stroke="#3a2210" stroke-width=".7"/>
  <path d="M7.6 26.4 H48.4" stroke="#1d0e06" stroke-width="1.6"/>
  <rect x="23.6" y="23" width="8.8" height="11.5" rx="1.2" fill="url(#vcB)" stroke="#3a2210" stroke-width=".8"/>
  <circle cx="28" cy="27.8" r="1.5" fill="#1d0e06"/><path d="M27.2 28.4 h1.6 l.5 3.4 h-2.6 Z" fill="#1d0e06"/>
  <path d="M12 13.6 C17 11.8 22 11.3 26 11.4" stroke="#f0c48a" stroke-width="1" stroke-linecap="round" opacity=".55" fill="none"/>
</svg>`;
}

export function recenterSVG() {
  return `<svg viewBox="0 0 56 56" aria-hidden="true">
  <defs>
    <radialGradient id="rc" cx="38%" cy="32%" r="80%"><stop offset="0" stop-color="#f9e4a6"/><stop offset=".45" stop-color="#c8963f"/><stop offset="1" stop-color="#5c3b10"/></radialGradient>
  </defs>
  <circle cx="28" cy="28" r="20" fill="none" stroke="url(#rc)" stroke-width="5"/>
  <circle cx="28" cy="28" r="22.5" fill="none" stroke="#1d0e06" stroke-width="1" opacity=".6"/>
  <circle cx="28" cy="28" r="17.3" fill="#2b170b" opacity=".55"/>
  <path d="M28 4 v9 M28 43 v9 M4 28 h9 M43 28 h9" stroke="#e8c57a" stroke-width="2" stroke-linecap="round"/>
  <path d="M28 15 l4 13 -4 13 -4 -13 Z" fill="#b93a2a"/>
  <path d="M28 28 l4 0 -4 13 -4 -13 Z" fill="#e8c57a"/>
  <circle cx="28" cy="28" r="2.4" fill="#f9e4a6" stroke="#4a2f0c" stroke-width=".8"/>
</svg>`;
}

export function scrollSVG() {
  return `<svg viewBox="0 0 64 64" aria-hidden="true">
  <defs>
    <linearGradient id="spp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8ecca"/><stop offset="1" stop-color="#dcc18a"/></linearGradient>
    <linearGradient id="spr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#efdcae"/><stop offset=".5" stop-color="#b8935a"/><stop offset="1" stop-color="#6f5028"/></linearGradient>
    <radialGradient id="spw" cx="40%" cy="35%"><stop offset="0" stop-color="#d4503f"/><stop offset="1" stop-color="#5a0d09"/></radialGradient>
  </defs>
  <rect x="13" y="14" width="38" height="36" fill="url(#spp)" stroke="#3b2414" stroke-width="1.3"/>
  <path d="M19 23 h20 M19 29 h26" stroke="#8b6b45" stroke-width="1.1"/>
  <path d="M20 44 C26 40 26 34 32 34 S40 36 44 28" stroke="#8b1e1e" stroke-width="1.7" stroke-dasharray="2.4 2.4" fill="none"/>
  <path d="M41 22 l6 6 M47 22 l-6 6" stroke="#8b1e1e" stroke-width="2.2" stroke-linecap="round"/>
  <rect x="8" y="9" width="48" height="8" rx="4" fill="url(#spr)" stroke="#2a160a" stroke-width="1.2"/>
  <rect x="8" y="47" width="48" height="8" rx="4" fill="url(#spr)" stroke="#2a160a" stroke-width="1.2"/>
  <circle cx="51" cy="51" r="7" fill="url(#spw)" stroke="#3a0805" stroke-width="1"/>
  <path d="M48.5 51 h5 M51 48.5 v5" stroke="#f19a8d" stroke-width="1" opacity=".6"/>
</svg>`;
}

export function compassRoseSVG() {
  const point = (angle, len, w, dark) => {
    const a = (angle * Math.PI) / 180;
    const tip = [50 + Math.sin(a) * len, 50 - Math.cos(a) * len];
    const l = [50 + Math.sin(a - Math.PI / 2) * w, 50 - Math.cos(a - Math.PI / 2) * w];
    const r = [50 + Math.sin(a + Math.PI / 2) * w, 50 - Math.cos(a + Math.PI / 2) * w];
    return `<path d="M50 50 L${f1(l[0])} ${f1(l[1])} L${f1(tip[0])} ${f1(tip[1])} Z" fill="${dark ? '#3b2414' : '#efe0bd'}" stroke="#3b2414" stroke-width=".6"/>
            <path d="M50 50 L${f1(r[0])} ${f1(r[1])} L${f1(tip[0])} ${f1(tip[1])} Z" fill="${dark ? '#efe0bd' : '#3b2414'}" stroke="#3b2414" stroke-width=".6"/>`;
  };
  let ticks = '';
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    const r0 = i % 8 === 0 ? 38 : 40;
    ticks += `M${f1(50 + Math.cos(a) * r0)} ${f1(50 + Math.sin(a) * r0)} L${f1(50 + Math.cos(a) * 42)} ${f1(50 + Math.sin(a) * 42)} `;
  }
  return `<svg viewBox="0 0 100 100" aria-hidden="true">
  <circle cx="50" cy="50" r="42" fill="none" stroke="#3b2414" stroke-width="1"/>
  <circle cx="50" cy="50" r="37.5" fill="none" stroke="#3b2414" stroke-width=".5"/>
  <path d="${ticks}" stroke="#3b2414" stroke-width=".6"/>
  ${[45, 135, 225, 315].map((a) => point(a, 26, 5, false)).join('')}
  ${[0, 90, 180, 270].map((a) => point(a, 44, 7, true)).join('')}
  <circle cx="50" cy="50" r="3" fill="#efe0bd" stroke="#3b2414" stroke-width=".8"/>
  <path d="M50 0.5 l3 6 h-6 Z" fill="#8b1e1e"/>
</svg>`;
}

// A leather pouch tied with a brass-tipped cord: the finds carried home.
export function satchelSVG() {
  return `<svg viewBox="0 0 56 56" aria-hidden="true">
  <defs>
    <linearGradient id="stL" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a06a3c"/><stop offset=".6" stop-color="#6a3a1c"/><stop offset="1" stop-color="#3e2010"/></linearGradient>
    <linearGradient id="stB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7dd96"/><stop offset=".5" stop-color="#c08f3d"/><stop offset="1" stop-color="#6b4716"/></linearGradient>
  </defs>
  <path d="M21 18 C13 23 8.5 31 9.5 39.5 C10.5 47.5 18.5 51 28 51 C37.5 51 45.5 47.5 46.5 39.5 C47.5 31 43 23 35 18 Z" fill="url(#stL)" stroke="#1d0e06" stroke-width="1.3"/>
  <path d="M19.5 11.5 C24 15 32 15 36.5 11.5 L35.5 18.5 C31 21 25 21 20.5 18.5 Z" fill="#7a4a28" stroke="#1d0e06" stroke-width="1.1"/>
  <path d="M15.5 30 C14.5 38 18.5 44.5 25 46.5" fill="none" stroke="#e2bd7c" stroke-width=".8" stroke-dasharray="1.6 1.5" opacity=".75"/>
  <path d="M20 18.3 C25 21.2 31 21.2 36 18.3" fill="none" stroke="url(#stB)" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M28 21 l-4.5 9 M28 21 l3.5 10" stroke="url(#stB)" stroke-width="1.4" stroke-linecap="round"/>
  <circle cx="23.3" cy="30.4" r="1.6" fill="url(#stB)"/><circle cx="31.6" cy="31.3" r="1.6" fill="url(#stB)"/>
  <circle cx="28" cy="20.8" r="2.7" fill="url(#stB)" stroke="#3a2210" stroke-width=".6"/>
</svg>`;
}

// Three brass bars, the game menu.
export function menuSVG() {
  const bars = [9.5, 16, 22.5].map((y) => `<rect x="5.5" y="${y - 1.7}" width="21" height="3.4" rx="1.7"/>`).join('');
  return `<svg viewBox="0 0 32 32" aria-hidden="true">
  <defs><linearGradient id="mnB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6dc95"/><stop offset=".55" stop-color="#c8973a"/><stop offset="1" stop-color="#6b4716"/></linearGradient></defs>
  <g fill="#120a04" opacity=".75" transform="translate(0 1.3)">${bars}</g>
  <g fill="url(#mnB)">${bars}</g>
</svg>`;
}

// The debug panel's gear, in the same brass and shadow as the menu glyph beside it.
export function gearSVG() {
  const c = 16, teeth = 8, tip = 12.2, root = 9.4, hole = 3.9;
  const pt = (r, a) => `${(c + Math.sin(a) * r).toFixed(2)} ${(c - Math.cos(a) * r).toFixed(2)}`;
  let d = '';
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    d += `${i ? 'L' : 'M'}${pt(root, a - 0.3)} L${pt(tip, a - 0.17)} L${pt(tip, a + 0.17)} L${pt(root, a + 0.3)} `;
  }
  d += `Z M${c - hole} ${c} a${hole} ${hole} 0 1 0 ${2 * hole} 0 a${hole} ${hole} 0 1 0 ${-2 * hole} 0 Z`;
  return `<svg viewBox="0 0 32 32" aria-hidden="true">
  <defs><linearGradient id="dbB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6dc95"/><stop offset=".55" stop-color="#c8973a"/><stop offset="1" stop-color="#6b4716"/></linearGradient></defs>
  <path d="${d}" fill="#120a04" fill-rule="evenodd" opacity=".75" transform="translate(0 1.3)"/>
  <path d="${d}" fill="url(#dbB)" fill-rule="evenodd"/>
</svg>`;
}

// The close cross of every dismissable screen; drawn in currentColor so the button sets the ink.
export function closeGlyph() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" fill="none"/></svg>';
}

export function gpsGlyph() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><circle class="g-dot" cx="12" cy="12" r="2.5" fill="#e7cf98"/><path class="g-in" d="M7 7a7 7 0 0 0 0 10M17 7a7 7 0 0 1 0 10" stroke="#e7cf98" stroke-width="1.5" fill="none" stroke-linecap="round"/><path class="g-out" d="M4 4a11 11 0 0 0 0 16M20 4a11 11 0 0 1 0 16" stroke="#e7cf98" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>`;
}
