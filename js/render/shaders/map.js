// GLSL for the map passes: parchment, sprites, overlay (searched areas, vault, GPS), post.

import { NOISE_GLSL, BIOME_GLSL } from '../../core/noise.js';
import { FIELD_GLSL } from '../../game/field.js';
import { BIOME } from '../terrain.js';

const HEADER = `#version 300 es
precision highp float;
precision highp int;
`;

const VIEW = /* glsl */`
uniform vec2 u_res;     // device px
uniform vec2 u_cam;     // local metres at screen centre
uniform float u_ppm;    // device px per metre
uniform float u_dpr;
uniform float u_time;
vec2 fragLocal() { return u_cam + (gl_FragCoord.xy - 0.5 * u_res) / u_ppm; }
`;

export const PARCHMENT_FS = HEADER + VIEW + NOISE_GLSL + BIOME_GLSL + /* glsl */`
uniform vec2 u_world;   // world-noise offset of the local origin
uniform vec4 u_grid;    // graticule offset (xy) and spacing (zw) in metres
out vec4 o;

const float TH_MOUNT = ${BIOME.mount.toFixed(3)};
const float TH_HILL = ${BIOME.hill.toFixed(3)};
const float TH_FOREST = ${BIOME.forest.toFixed(3)};

void main() {
  float cssPpm = u_ppm / u_dpr;
  vec2 local = fragLocal();
  vec2 world = local + u_world;

  // Base tone: broad uneven ageing of the sheet.
  float tone = fbm(local / 700.0 + 3.7, 11u);
  vec3 col = mix(vec3(0.957, 0.902, 0.776), vec3(0.866, 0.757, 0.565), smoothstep(0.28, 0.78, tone));

  // Paper grain at a constant on-screen scale: fibres, pores, mottling.
  vec2 rl = mat2(0.88, 0.47, -0.47, 0.88) * local;
  float fib = znoise(rl * vec2(1.0, 0.2), cssPpm, 2.6, 31u) * 0.6 + znoise(rl * vec2(0.22, 1.0), cssPpm, 2.6, 37u) * 0.4;
  float pore = znoise(local, cssPpm, 1.3, 41u);
  float mott = znoise(local, cssPpm, 34.0, 43u);
  col *= 1.0 + (fib - 0.5) * 0.085 + (pore - 0.5) * 0.05 + (mott - 0.5) * 0.07;

  // Water stains with darker tide lines.
  float st = fbm(local / 260.0 + 13.1, 23u);
  col = mix(col, col * vec3(0.91, 0.84, 0.70), smoothstep(0.60, 0.70, st) * 0.6);
  col = mix(col, col * vec3(0.78, 0.66, 0.50), exp(-pow((st - 0.603) / 0.005, 2.0)) * 0.35);

  // Watercolour biome washes with pigment pooling at the edges.
  vec2 bm = biomeAt(world);
  float gran = 0.75 + 0.5 * znoise(local, cssPpm, 2.2, 51u);
  float mount = smoothstep(TH_HILL - 0.004, TH_HILL + 0.004, bm.x);
  float mountCore = smoothstep(TH_MOUNT - 0.004, TH_MOUNT + 0.004, bm.x);
  float forest = smoothstep(TH_FOREST - 0.004, TH_FOREST + 0.004, bm.y) * (1.0 - mountCore);
  float fEdge = forest * (1.0 - forest) * 4.0;
  float mEdge = mount * (1.0 - mount) * 4.0;
  col = mix(col, col * vec3(0.70, 0.73, 0.47), (forest * 0.42 + fEdge * 0.35) * gran);
  col = mix(col, col * vec3(0.84, 0.68, 0.50), ((mount * 0.30 + mountCore * 0.22) + mEdge * 0.3) * gran);

  // Graticule.
  vec2 gq = (local - u_grid.xy) / u_grid.zw;
  vec2 gd = abs(fract(gq + 0.5) - 0.5) * u_grid.zw * cssPpm;
  float gline = 1.0 - smoothstep(0.3, 0.95, min(gd.x, gd.y));
  col = mix(col, col * vec3(0.58, 0.45, 0.33), gline * 0.42);

  // Fold creases of the sheet: a lit and a shaded side, worn lighter along the fold.
  vec2 fd = (fract(local / 900.0 + 0.5) - 0.5) * 900.0 * cssPpm;
  vec2 ridge = fd * exp(-fd * fd / 30.0) / 2.35;
  float worn = exp(-fd.x * fd.x / 60.0) + exp(-fd.y * fd.y / 60.0);
  col *= 1.0 + 0.05 * (ridge.x - ridge.y) + 0.03 * worn;

  // Foxing: small rust-brown age spots.
  vec2 fc = local / 22.0;
  ivec2 fci = ivec2(floor(fc));
  float fh = h01(fci, 53u);
  if (fh > 0.87) {
    vec2 pos = vec2(h01(fci, 59u), h01(fci, 61u)) * 0.6 + 0.2;
    float r = 0.05 + 0.12 * h01(fci, 67u);
    float d = length(fract(fc) - pos) + (vnoise(local * 0.9, 71u) - 0.5) * 0.05;
    col = mix(col, col * vec3(0.76, 0.6, 0.43), smoothstep(r, r * 0.35, d) * 0.4 * smoothstep(0.35, 1.0, cssPpm));
  }

  o = vec4(col, 1.0);
}`;

export const SPRITE_VS = /* glsl */`#version 300 es
layout(location = 0) in vec2 a_corner;
layout(location = 1) in vec4 a_posSize;  // x, y, w, h
layout(location = 2) in vec4 a_misc;     // rotation, size mode (0 m / 1 css px), anchor x, anchor y
layout(location = 3) in vec4 a_uv;
layout(location = 4) in vec4 a_color;
uniform vec2 u_res;
uniform vec2 u_cam;
uniform float u_ppm;
uniform float u_dpr;
out vec2 v_uv;
out vec4 v_color;
void main() {
  float scale = a_misc.y > 0.5 ? u_dpr : u_ppm;
  vec2 c = (a_corner + a_misc.zw) * a_posSize.zw * scale;
  float s = sin(a_misc.x), k = cos(a_misc.x);
  c = vec2(k * c.x + s * c.y, -s * c.x + k * c.y);
  vec2 px = (a_posSize.xy - u_cam) * u_ppm + c;
  gl_Position = vec4(px / (0.5 * u_res), 0.0, 1.0);
  v_uv = mix(a_uv.xy, a_uv.zw, vec2(a_corner.x + 0.5, 0.5 - a_corner.y));
  v_color = a_color;
}`;

export const SPRITE_FS = /* glsl */`#version 300 es
precision mediump float;
uniform sampler2D u_tex;
in vec2 v_uv;
in vec4 v_color;
out vec4 o;
void main() {
  o = texture(u_tex, v_uv) * vec4(v_color.rgb * v_color.a, v_color.a);
}`;

export const COPY_FS = HEADER + /* glsl */`
uniform sampler2D u_base;
uniform ivec2 u_shift;      // margin + camera offset, whole device pixels
out vec4 o;
void main() {
  o = texelFetch(u_base, ivec2(gl_FragCoord.xy) + u_shift, 0);
}`;

// While a zoom gesture is in progress the cached base is stretched instead of redrawn.
export const COPY_SCALED_FS = HEADER + /* glsl */`
uniform sampler2D u_base;
uniform vec2 u_baseRes;     // base texture size (device px)
uniform vec2 u_res;         // screen size (device px)
uniform vec2 u_centre;      // base texel under the screen centre
uniform float u_k;          // current zoom / zoom the base was drawn at
out vec4 o;
void main() {
  vec2 b = (gl_FragCoord.xy - 0.5 * u_res) / u_k + u_centre;
  o = texture(u_base, b / u_baseRes);
}`;

export const OVERLAY_FS = HEADER + VIEW + NOISE_GLSL + FIELD_GLSL + /* glsl */`
uniform vec4 u_balls[64];   // x, y, spawn scale, age (0..1 of lifetime)
uniform int u_count;
uniform vec3 u_vault;       // x, y, present
uniform vec4 u_player;      // x, y, accuracy, present
uniform vec4 u_zone;        // mission: centre of the walk, distance to leave it (m), shown
uniform vec2 u_excl[32];    // mission: existing tombs (200 m keep-out circles)
uniform int u_exclCount;
out vec4 o;

const vec3 INK = vec3(0.231, 0.141, 0.078);
const vec3 SIENNA = vec3(0.50, 0.22, 0.10);
const vec3 OXBLOOD = vec3(0.55, 0.1, 0.08);

float dashes(vec2 d, float r, float cssPpm, float dashPx, float duty) {
  float n = max(12.0, floor(6.2832 * r * cssPpm / dashPx));
  float t = fract(atan(d.y, d.x) / 6.2832 * n);
  return smoothstep(0.0, 0.04, t) * (1.0 - smoothstep(duty, duty + 0.06, t));
}

vec4 layer(vec4 dst, vec3 c, float a) {
  a = clamp(a, 0.0, 1.0);
  return vec4(c * a, a) + dst * (1.0 - a);
}

// Diagonal hatching anchored to the map, ~7 css px apart at any zoom.
float hatching(vec2 local, float cssPpm) {
  float e = log2(7.0 / cssPpm);
  float e0 = floor(e);
  float fe = e - e0;
  float sp0 = exp2(e0), sp1 = sp0 * 2.0;
  float u = dot(local, vec2(0.7071, 0.7071));
  float d0 = abs(fract(u / sp0 + 0.5) - 0.5) * sp0 * cssPpm;
  float d1 = abs(fract(u / sp1 + 0.5) - 0.5) * sp1 * cssPpm;
  float l0 = 1.0 - smoothstep(0.3, 0.9, d0);
  float l1 = 1.0 - smoothstep(0.3, 0.9, d1);
  return max(l1, l0 * (1.0 - fe));
}

void main() {
  float cssPpm = u_ppm / u_dpr;
  vec2 local = fragLocal();
  vec4 acc = vec4(0.0);

  if (u_vault.z > 0.5) {
    vec2 d = local - u_vault.xy;
    float rpx = (length(d) - 100.0) * cssPpm;
    acc = layer(acc, vec3(0.62, 0.38, 0.18), (1.0 - smoothstep(-0.8, 0.8, rpx)) * 0.07);
    float n = max(16.0, floor(6.2832 * 100.0 * cssPpm / 13.0));
    float t = fract(atan(d.y, d.x) / 6.2832 * n);
    float dash = smoothstep(0.0, 0.05, t) * (1.0 - smoothstep(0.55, 0.62, t));
    acc = layer(acc, INK, (1.0 - smoothstep(0.8, 1.6, abs(rpx))) * dash * 0.8);
    acc = layer(acc, INK, (1.0 - smoothstep(0.25, 0.85, abs(rpx + 5.0))) * 0.35);
  }

  // Mission: how far this walk must go (beyond the ring) and, on the tomb walk, where the
  // tomb may not lie (near other tombs).
  if (u_zone.w > 0.5) {
    vec2 d = local - u_zone.xy;
    float rpx = (length(d) - u_zone.z) * cssPpm;
    float inside = 1.0 - smoothstep(-0.8, 0.8, rpx);
    acc = layer(acc, OXBLOOD, inside * exp(rpx / 18.0) * 0.16);
    acc = layer(acc, OXBLOOD, (1.0 - smoothstep(0.9, 1.7, abs(rpx))) * dashes(d, u_zone.z, cssPpm, 16.0, 0.6) * 0.85);
    // The walk's start, where the distance counts from: a small inked target.
    float spx = length(d) * cssPpm;
    acc = layer(acc, OXBLOOD, (1.0 - smoothstep(0.6, 1.3, abs(spx - 6.5))) * 0.9);
    acc = layer(acc, OXBLOOD, (1.0 - smoothstep(1.6, 2.4, spx)) * 0.9);
    for (int i = 0; i < 32; i++) {
      if (i >= u_exclCount) break;
      vec2 e = local - u_excl[i];
      float epx = (length(e) - 200.0) * cssPpm;
      acc = layer(acc, OXBLOOD, (1.0 - smoothstep(-0.8, 0.8, epx)) * 0.06);
      acc = layer(acc, OXBLOOD, (1.0 - smoothstep(0.6, 1.3, abs(epx))) * dashes(e, 200.0, cssPpm, 6.0, 0.35) * 0.6);
    }
  }

  float f = 0.0, ksum = 0.0, fresh = 0.0, wet = 0.0;
  vec2 g = vec2(0.0);
  for (int i = 0; i < 64; i++) {
    if (i >= u_count) break;
    vec4 b = u_balls[i];
    float S = FIELD_SUPPORT * b.z;
    vec2 d = local - b.xy;
    float dd = dot(d, d), S2 = S * S;
    if (dd < S2) {
      float t = 1.0 - dd / S2;
      float k = t * t;
      f += k;
      g += -4.0 * t * d / S2;
      ksum += k;
      fresh += k * (1.0 - b.w);
      wet += k * (1.0 - smoothstep(0.0, 6.0 / 21600.0, b.w));
    }
  }
  if (ksum > 0.0) {
    fresh /= ksum;
    wet /= ksum;
    float sdpx = (f - FIELD_T) / max(length(g), 1e-5) * cssPpm;
    sdpx += (znoise(local, cssPpm, 7.0, 81u) - 0.5) * (1.5 + wet * 8.0);
    float strength = mix(0.4, 1.0, fresh);
    float inside = smoothstep(-0.7, 0.7, sdpx);
    float gran = 0.7 + 0.6 * znoise(local, cssPpm, 2.4, 83u);
    float band = inside * exp(-max(sdpx, 0.0) / 11.0);
    acc = layer(acc, SIENNA, (inside * 0.09 + band * 0.32 + wet * inside * 0.3) * strength * gran);
    float hb = smoothstep(0.35, 0.65, znoise(local, cssPpm, 22.0, 91u));
    acc = layer(acc, INK, hatching(local, cssPpm) * inside * (0.1 + 0.14 * hb) * strength);
    float edge = 1.0 - smoothstep(0.7 + wet, 1.45 + wet * 1.5, abs(sdpx - 0.6));
    acc = layer(acc, INK, edge * mix(0.5, 0.88, fresh));
  }

  if (u_player.w > 0.5) {
    vec2 d = local - u_player.xy;
    float r = length(d);
    float apx = (r - u_player.z) * cssPpm;
    float pencil = (1.0 - smoothstep(0.35, 1.1, abs(apx))) * (0.5 + 0.5 * znoise(local, cssPpm, 2.0, 97u));
    acc = layer(acc, vec3(0.32, 0.29, 0.26), (1.0 - smoothstep(-0.8, 0.8, apx)) * 0.07);
    acc = layer(acc, vec3(0.28, 0.26, 0.24), pencil * 0.6);
    float ph = fract(u_time / 2.6);
    float pulse = (1.0 - smoothstep(0.5, 1.8, abs(r * cssPpm - ph * 48.0))) * (1.0 - ph) * 0.55;
    acc = layer(acc, vec3(0.55, 0.1, 0.07), pulse);
  }

  o = acc;
}`;

export const POST_FS = HEADER + NOISE_GLSL + /* glsl */`
uniform sampler2D u_scene;
uniform vec2 u_res;
uniform float u_time;
uniform float u_dpr;
uniform float u_shake;
in vec2 v_uv;
out vec4 o;
void main() {
  vec3 c = texture(u_scene, v_uv).rgb;

  // Grade: gentle S-curve and a warm, slightly lifted shadow tone.
  c = mix(c, c * c * (3.0 - 2.0 * c), 0.3);
  c = c * vec3(1.03, 1.0, 0.93) + vec3(0.012, 0.006, 0.0);

  // Soft vignette. No textured stains here: anything in screen space stays put while the
  // map slides under it, which gives the effect away.
  vec2 res = u_res / u_dpr;
  vec2 q = (v_uv - 0.5) * vec2(res.x / res.y, 1.0);
  c *= 1.0 - 0.38 * smoothstep(0.12, 0.62, dot(q, q) * 1.6);

  // Film grain.
  int f = int(u_time * 24.0);
  float gr = h01(ivec2(gl_FragCoord.xy) + ivec2(f * 7919, f * 3571), 3u) - 0.5;
  c += gr * 0.035;

  o = vec4(c, 1.0);
}`;
