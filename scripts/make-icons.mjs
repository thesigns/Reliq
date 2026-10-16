// Generates the app icons (PNG) without dependencies: shapes are rasterised from signed
// distances with 4×4 supersampling and written with a minimal PNG encoder.
// Design: dark leather, a brass ring, a red wax seal with a keyhole.
// Usage: node scripts/make-icons.mjs

import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const outDir = fileURLToPath(new URL('../assets/icons/', import.meta.url));
mkdirSync(outDir, { recursive: true });

// ---- PNG ----
const CRC = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});
function crc32(buf) {
  let c = -1;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, rgba) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---- shapes (coordinates in units of the icon: -1..1, y down) ----
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const clamp = (v) => Math.min(1, Math.max(0, v));
const circle = (x, y, cx, cy, r) => Math.hypot(x - cx, y - cy) - r;
function keyhole(x, y) {
  const head = circle(x, y, 0, -0.07, 0.085);
  // Trapezoid stem: narrow at the top, wider at the bottom.
  const top = -0.03, bottom = 0.17;
  const t = clamp((y - top) / (bottom - top));
  const half = 0.04 + 0.045 * t;
  const stem = Math.max(Math.abs(x) - half, top - y, y - bottom);
  return Math.min(head, stem);
}

// scale < 1 shrinks the artwork into the safe zone (maskable icons).
function shade(x, y, scale, rounded) {
  x /= scale; y /= scale;
  const r = Math.hypot(x, y);
  // Background leather (full bleed), darker towards the corners.
  let c = mix([92, 56, 32], [24, 13, 7], clamp(r * scale / 1.25));
  let a = 1;
  if (rounded) {
    // Rounded square for the plain icon.
    const k = 0.2, e = Math.max(Math.abs(x * scale), Math.abs(y * scale)) - (1 - k);
    const d = e > 0 && Math.abs(x * scale) > 1 - k && Math.abs(y * scale) > 1 - k
      ? Math.hypot(Math.abs(x * scale) - (1 - k), Math.abs(y * scale) - (1 - k)) - k
      : Math.max(Math.abs(x * scale), Math.abs(y * scale)) - 1;
    a = clamp(-d * 200);
  }
  // Stitching ring.
  const stitch = Math.abs(r - 0.86) < 0.012 && Math.sin(Math.atan2(y, x) * 40) > 0;
  if (stitch) c = mix(c, [226, 184, 118], 0.6);
  // Brass ring.
  const ring = circle(x, y, 0, 0, 0.74);
  if (ring < 0) {
    const g = clamp((x + y) * 0.5 + 0.5);
    c = mix([250, 222, 150], [110, 70, 22], g);
    if (r > 0.66) {
      // Beads.
      const ang = Math.atan2(y, x);
      const bead = Math.hypot(r - 0.7, (((ang / (Math.PI * 2)) * 36 % 1 + 1) % 1 - 0.5) * 0.12);
      if (bead < 0.018) c = [255, 236, 180];
    }
  }
  if (r < 0.66 && r > 0.645) c = [60, 38, 12];
  // Wax seal.
  const wobble = 0.012 * Math.sin(Math.atan2(y, x) * 9) + 0.008 * Math.sin(Math.atan2(y, x) * 23);
  if (r < 0.56 + wobble) {
    const g = clamp(Math.hypot(x + 0.18, y + 0.22) / 0.9);
    c = mix([214, 80, 63], [86, 12, 8], g);
    if (Math.abs(r - 0.42) < 0.02) c = mix(c, [70, 8, 6], 0.6);
    if (keyhole(x, y) < 0) c = [70, 10, 7];
    // Specular highlight.
    const h = Math.hypot((x + 0.22) / 1.6, y + 0.28);
    if (h < 0.12) c = mix(c, [255, 220, 210], (1 - h / 0.12) * 0.35);
  }
  return [...c, a * 255];
}

function render(size, { scale = 1, rounded = false } = {}) {
  const buf = Buffer.alloc(size * size * 4);
  const S = 4;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const acc = [0, 0, 0, 0];
      for (let sy = 0; sy < S; sy++) {
        for (let sx = 0; sx < S; sx++) {
          const x = ((px + (sx + 0.5) / S) / size) * 2 - 1;
          const y = ((py + (sy + 0.5) / S) / size) * 2 - 1;
          const c = shade(x, y, scale, rounded);
          const w = c[3] / 255;
          acc[0] += c[0] * w; acc[1] += c[1] * w; acc[2] += c[2] * w; acc[3] += c[3];
        }
      }
      const o = (py * size + px) * 4;
      const alpha = acc[3] / (S * S);
      const k = alpha > 0 ? 255 / (alpha * S * S) : 0;
      buf[o] = Math.round(acc[0] * k);
      buf[o + 1] = Math.round(acc[1] * k);
      buf[o + 2] = Math.round(acc[2] * k);
      buf[o + 3] = Math.round(alpha);
    }
  }
  return png(size, buf);
}

const jobs = [
  ['icon-192.png', 192, { rounded: true }],
  ['icon-512.png', 512, { rounded: true }],
  ['icon-maskable-512.png', 512, { scale: 0.8 }],
  ['apple-touch-icon.png', 180, {}],
  ['favicon-64.png', 64, { rounded: true }],
];
for (const [name, size, opts] of jobs) {
  writeFileSync(outDir + name, render(size, opts));
  console.log('wrote', name);
}
