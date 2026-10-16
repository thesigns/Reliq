// Packs rasterised SVG icons into a single mipmapped texture (simple shelf packer).

import { svgToImage, textureFromCanvas } from './gl.js';

const PAD = 6;

export async function buildAtlas(gl, icons) {
  const entries = Object.entries(icons);
  const images = await Promise.all(entries.map(([, ic]) => svgToImage(ic.svg)));

  const size = 2048;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Tallest first packs shelves tighter.
  const order = entries.map((e, i) => i).sort((a, b) => entries[b][1].h - entries[a][1].h);
  const rects = {};
  let x = PAD, y = PAD, shelfH = 0;
  for (const i of order) {
    const [name, ic] = entries[i];
    if (x + ic.w + PAD > size) { x = PAD; y += shelfH + PAD; shelfH = 0; }
    if (y + ic.h + PAD > size) throw new Error('Atlas overflow');
    ctx.drawImage(images[i], x, y, ic.w, ic.h);
    rects[name] = {
      u0: x / size, v0: y / size, u1: (x + ic.w) / size, v1: (y + ic.h) / size,
      aspect: ic.w / ic.h,
    };
    x += ic.w + PAD;
    shelfH = Math.max(shelfH, ic.h);
  }
  return { tex: textureFromCanvas(gl, canvas), rects, canvas };
}
