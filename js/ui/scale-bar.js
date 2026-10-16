// Old-map style scale bar: alternating ink/paper segments with a round length.

const NICE = [5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000];

// Longest round length that fits in maxPx at this zoom (css px per metre).
export function pickScale(ppm, maxPx = 130) {
  let metres = NICE[0];
  for (const m of NICE) if (m * ppm <= maxPx) metres = m;
  return { metres, px: metres * ppm };
}

export function scaleLabel(metres, lang = 'en') {
  if (metres < 1000) return `${metres} m`;
  return `${new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(metres / 1000)} km`;
}

export class ScaleBar {
  constructor(el) {
    this.el = el;
    this.key = '';
  }

  update(ppm, lang) {
    const { metres, px } = pickScale(ppm);
    const w = Math.round(px);
    const key = `${metres}|${w}|${lang}`;
    if (key === this.key) return;
    this.key = key;
    const seg = w / 4;
    let bars = '';
    for (let i = 0; i < 4; i++) {
      bars += `<rect x="${(6 + i * seg).toFixed(1)}" y="16" width="${seg.toFixed(1)}" height="5" fill="${i % 2 ? '#efe0bd' : '#3b2414'}"/>`;
    }
    this.el.innerHTML = `<svg width="${w + 12}" height="26" viewBox="0 0 ${w + 12} 26" aria-hidden="true">
      ${bars}
      <rect x="6" y="16" width="${w}" height="5" fill="none" stroke="#3b2414" stroke-width="1"/>
      <path d="M6 13 V22 M${6 + w / 2} 14 V22 M${6 + w} 13 V22" stroke="#3b2414" stroke-width="1"/>
      <text x="6" y="10" font-family="'EB Garamond', serif" font-style="italic" font-size="11" fill="#3b2414">0</text>
      <text x="${6 + w}" y="10" text-anchor="end" font-family="'EB Garamond', serif" font-style="italic" font-size="11" fill="#3b2414">${scaleLabel(metres, lang)}</text>
    </svg>`;
    this.el.setAttribute('aria-label', scaleLabel(metres, lang));
  }
}
