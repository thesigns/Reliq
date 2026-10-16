// Integer-hash value noise. Bit-for-bit twin of NOISE_GLSL so the CPU (icon placement)
// and the GPU (watercolour washes) agree on where the biomes are.

export function hash2(x, y, seed) {
  let h = (Math.imul(x | 0, 0x8da6b343) ^ Math.imul(y | 0, 0xd8163841) ^ Math.imul(seed | 0, 0xcb1ab31f)) >>> 0;
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d) >>> 0;
  h ^= h >>> 12; h = Math.imul(h, 0x297a2d39) >>> 0;
  h ^= h >>> 15;
  return h >>> 0;
}

export function h01(x, y, seed) {
  return (hash2(x, y, seed) & 0xffffff) / 16777215;
}

export function vnoise(x, y, seed) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const a = h01(ix, iy, seed), b = h01(ix + 1, iy, seed);
  const c = h01(ix, iy + 1, seed), d = h01(ix + 1, iy + 1, seed);
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  return (a + (b - a) * ux) * (1 - uy) + (c + (d - c) * ux) * uy;
}

export function fbm(x, y, seed) {
  let a = 0.5, s = 0;
  for (let i = 0; i < 4; i++) {
    s += a * vnoise(x, y, seed + i);
    x = x * 2 + 17.13; y = y * 2 + 9.71;
    a *= 0.5;
  }
  return s / 0.9375;
}

// Biome fields shared with the terrain shader (see BIOME_GLSL).
export function biomeAt(wx, wy) {
  const wxo = vnoise(wx / 400, wy / 400, 301) - 0.5;
  const wyo = vnoise(wx / 400 + 5.2, wy / 400 + 5.2, 307) - 0.5;
  const x = wx + wxo * 260, y = wy + wyo * 260;
  const elev = fbm(x / 1500, y / 1500, 101);
  const moist = fbm(x / 1100 + 41.7, y / 1100 + 41.7, 211);
  return { elev, moist };
}

export const NOISE_GLSL = /* glsl */`
uint hash2(ivec2 p, uint seed) {
  uint h = (uint(p.x) * 0x8da6b343u) ^ (uint(p.y) * 0xd8163841u) ^ (seed * 0xcb1ab31fu);
  h ^= h >> 15u; h *= 0x2c1b3c6du;
  h ^= h >> 12u; h *= 0x297a2d39u;
  h ^= h >> 15u;
  return h;
}
float h01(ivec2 p, uint seed) { return float(hash2(p, seed) & 0xffffffu) / 16777215.0; }
float vnoise(vec2 x, uint seed) {
  vec2 i = floor(x); vec2 f = x - i;
  ivec2 ii = ivec2(i);
  float a = h01(ii, seed), b = h01(ii + ivec2(1, 0), seed);
  float c = h01(ii + ivec2(0, 1), seed), d = h01(ii + ivec2(1, 1), seed);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p, uint seed) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 4; i++) {
    s += a * vnoise(p, seed + uint(i));
    p = p * 2.0 + vec2(17.13, 9.71);
    a *= 0.5;
  }
  return s / 0.9375;
}
// Noise whose feature size stays constant in screen pixels while zooming:
// blends two octaves anchored to the map so it never swims.
float znoise(vec2 local, float cssPpm, float featurePx, uint seed) {
  float lz = log2(cssPpm);
  float L = floor(lz);
  float fz = lz - L;
  vec2 p0 = local * exp2(L) / featurePx;
  vec2 p1 = local * exp2(L + 1.0) / featurePx;
  return mix(vnoise(p0, seed), vnoise(p1, seed), fz);
}
`;

export const BIOME_GLSL = /* glsl */`
vec2 biomeAt(vec2 w) {
  vec2 warp = vec2(vnoise(w / 400.0, 301u), vnoise(w / 400.0 + 5.2, 307u)) - 0.5;
  vec2 p = w + warp * 260.0;
  float elev = fbm(p / 1500.0, 101u);
  float moist = fbm(p / 1100.0 + 41.7, 211u);
  return vec2(elev, moist);
}
`;
