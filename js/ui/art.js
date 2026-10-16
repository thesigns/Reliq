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
// for the dock. Barrel lid and plank body in two woods, riveted iron straps, brass corners and
// a hasp with the lock, gold glinting in the seam. Lit from the top left like the medallion.
export function vaultSVG() {
  // The chest's outline (domed lid over a box) clips the straps and the lid's shine.
  const shape = 'M8.5 45 V21.5 C8.5 14 17.2 10.6 28 10.6 C38.8 10.6 47.5 14 47.5 21.5 V45 Z';
  const lid = 'M8.5 24 V21.5 C8.5 14 17.2 10.6 28 10.6 C38.8 10.6 47.5 14 47.5 21.5 V24 Z';
  const rivet = (x, y, metal) => `<circle cx="${x}" cy="${y}" r=".95" fill="${metal ? '#5a3a12' : '#202026'}"/><circle cx="${x - 0.28}" cy="${y - 0.3}" r=".38" fill="${metal ? '#fff2c4' : '#c9c9d4'}"/>`;
  // Board seams: a dark groove with a lit edge below it.
  const seam = (d) => `<path d="${d}" fill="none" stroke="#2a1309" stroke-width=".8" opacity=".75"/><path d="${d}" fill="none" stroke="#d99a5c" stroke-width=".5" opacity=".35" transform="translate(0 .75)"/>`;
  const strap = (x) => `<rect x="${x}" y="8" width="4.4" height="38" fill="url(#vcI)"/><path d="M${x + 0.5} 9 V45" stroke="#c4c4d0" stroke-width=".5" opacity=".55"/><path d="M${x + 4.4} 8 V46" stroke="#121216" stroke-width=".6" opacity=".7"/>`;
  return `<svg viewBox="0 0 56 56" aria-hidden="true">
  <defs>
    <linearGradient id="vcL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c58548"/><stop offset=".55" stop-color="#9a5a2b"/><stop offset="1" stop-color="#76401b"/></linearGradient>
    <linearGradient id="vcD" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a5622f"/><stop offset=".6" stop-color="#7c431d"/><stop offset="1" stop-color="#562c11"/></linearGradient>
    <linearGradient id="vcR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6e3a18"/><stop offset="1" stop-color="#3f1f0b"/></linearGradient>
    <linearGradient id="vcB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0bc"/><stop offset=".35" stop-color="#e2b45c"/><stop offset=".7" stop-color="#b07d2c"/><stop offset="1" stop-color="#6b4716"/></linearGradient>
    <linearGradient id="vcC" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f9e0a0"/><stop offset=".45" stop-color="#cf9c45"/><stop offset="1" stop-color="#7a5219"/></linearGradient>
    <linearGradient id="vcI" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8c8c97"/><stop offset=".4" stop-color="#55555e"/><stop offset="1" stop-color="#2c2c33"/></linearGradient>
    <radialGradient id="vcG" cx="35%" cy="30%" r="60%"><stop offset="0" stop-color="#fff" stop-opacity=".42"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <clipPath id="vcClip"><path d="${shape}"/></clipPath>
    <clipPath id="vcLidClip"><path d="${lid}"/></clipPath>
    <filter id="vcBlur" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="1.3"/></filter>
  </defs>
  <ellipse cx="28" cy="48.8" rx="22" ry="2.4" fill="#000" opacity=".5" filter="url(#vcBlur)"/>
  <path d="M7 45 h42 v2.4 a1.1 1.1 0 0 1 -1.1 1.1 h-39.8 a1.1 1.1 0 0 1 -1.1 -1.1 Z" fill="url(#vcR)" stroke="#1d0e06" stroke-width="1.1"/>
  <path d="${lid}" fill="url(#vcL)"/>
  <rect x="8.5" y="27" width="39" height="18" fill="url(#vcD)"/>
  <g clip-path="url(#vcClip)">
    ${seam('M8 19.2 C10.6 15.6 18.4 13.6 28 13.6 C37.6 13.6 45.4 15.6 48 19.2')}
    ${seam('M8 33 H48')}${seam('M8 39 H48')}
    <path d="M12 30.2 q6 -.9 12 .1 M30 36.4 q7 -.8 13 .2 M13 42.3 q5 -.6 10 .1" fill="none" stroke="#3a1c0b" stroke-width=".45" opacity=".35"/>
    <path d="${lid}" fill="url(#vcG)" clip-path="url(#vcLidClip)"/>
    ${strap(15.2)}${strap(36.4)}
  </g>
  <rect x="7.9" y="23.8" width="40.2" height="3.6" rx=".6" fill="url(#vcR)" stroke="#1d0e06" stroke-width=".8"/>
  <path d="M9 24.4 H47" stroke="#c98b52" stroke-width=".5" opacity=".5"/>
  <path d="M13 27.9 H15.2 M19.6 27.9 H24.4 M31.6 27.9 H36.4 M40.8 27.9 H43" stroke="#ffd36b" stroke-width=".7" stroke-linecap="round" opacity=".75"/>
  ${[7.6, 43.6].map((x) => `<path d="M${x} 27.4 h4.8 v17.6 h-4.8 Z" fill="url(#vcC)" stroke="#3a2210" stroke-width=".7"/><path d="M${x} 23.4 h4.8 v4.4 h-4.8 Z" fill="url(#vcC)" stroke="#3a2210" stroke-width=".7"/>`).join('')}
  ${rivet(10, 30.4, true)}${rivet(10, 42.2, true)}${rivet(46, 30.4, true)}${rivet(46, 42.2, true)}
  ${rivet(17.4, 16.2)}${rivet(38.6, 16.2)}${rivet(17.4, 42.2)}${rivet(38.6, 42.2)}
  <path d="M23.8 21.8 h8.4 v7.6 c0 3.5 -1.9 5.6 -4.2 6.9 c-2.3 -1.3 -4.2 -3.4 -4.2 -6.9 Z" fill="url(#vcB)" stroke="#3a2210" stroke-width=".8" stroke-linejoin="round"/>
  <path d="M24.8 22.8 h6.4 v6.6 c0 2.8 -1.4 4.5 -3.2 5.6" fill="none" stroke="#fff3c8" stroke-width=".5" opacity=".55"/>
  ${rivet(25.6, 23.8, true)}${rivet(30.4, 23.8, true)}
  <circle cx="28" cy="28.2" r="1.55" fill="#24120a"/><path d="M27.15 28.8 h1.7 l.55 3.6 h-2.8 Z" fill="#24120a"/>
  <path d="${shape}" fill="none" stroke="#1d0e06" stroke-width="1.3" stroke-linejoin="round"/>
  <path d="M41.5 9.2 l.7 1.8 1.8 .7 -1.8 .7 -.7 1.8 -.7 -1.8 -1.8 -.7 1.8 -.7 Z" fill="#fff4cf" opacity=".85"/>
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
