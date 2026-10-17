// Renders a low-poly tomb artifact in the style of early 90s polygon games: flat-shaded
// faces in solid palette colours, drawn at the screen's own resolution with smoothed
// edges. Models are generated modules in js/render/models/ (see scripts/blender/).

import { program } from './gl.js';

// Rendered pixels per CSS pixel: the screen's density (2 under ?inspect), at most 3.
export const artifactDpr = () =>
  document.documentElement.classList.contains('inspect') ? 2 : Math.min(devicePixelRatio || 1, 3);

// Lighting runs per vertex with flat outputs, so each face gets one colour.
export const VS = /* glsl */`#version 300 es
layout(location = 0) in vec3 a_pos;
layout(location = 1) in vec3 a_nrm;
layout(location = 2) in vec3 a_col;
uniform mat4 u_model;
uniform mat4 u_viewProj;
uniform vec3 u_eye;
uniform vec3 u_glow;
flat out vec3 v_col;

vec3 toLinear(vec3 c) { return pow(c, vec3(2.2)); }

void main() {
  vec4 w = u_model * vec4(a_pos, 1.0);
  vec3 N = normalize(mat3(u_model) * a_nrm);
  vec3 V = normalize(u_eye - w.xyz);
  vec3 albedo = toLinear(a_col);

  vec3 key = normalize(vec3(-0.55, 0.75, 0.6));
  vec3 fill = normalize(vec3(0.85, 0.15, 0.35));
  vec3 kick = normalize(vec3(0.1, -0.8, 0.5));
  vec3 light = vec3(0.10, 0.075, 0.055) + u_glow * 0.5
    + vec3(1.35, 1.15, 0.9) * max(dot(N, key), 0.0)
    + vec3(0.30, 0.36, 0.48) * max(dot(N, fill), 0.0)
    + vec3(0.30, 0.20, 0.10) * max(dot(N, kick), 0.0);
  vec3 col = albedo * light;
  float spec = pow(max(dot(N, normalize(key + V)), 0.0), 28.0);
  // Shine follows the material: metal and glaze glint, dark wood stays matte (a big flat
  // face square to the light would otherwise flare white).
  float shine = clamp(dot(albedo, vec3(0.3, 0.59, 0.11)) * 2.5, 0.0, 1.0);
  col += mix(albedo, vec3(1.0), 0.35) * spec * 1.6 * shine;

  col = col / (1.0 + col * 0.35);
  v_col = pow(col, vec3(1.0 / 2.2));
  gl_Position = u_viewProj * w;
}`;

export const FS = /* glsl */`#version 300 es
precision mediump float;
flat in vec3 v_col;
out vec4 o;
void main() { o = vec4(v_col, 1.0); }`;

export const mat4 = () => new Float32Array(16);
export function perspective(fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy / 2), m = mat4();
  m[0] = f / aspect; m[5] = f; m[10] = (far + near) / (near - far); m[11] = -1; m[14] = (2 * far * near) / (near - far);
  return m;
}
export function mul(a, b) {
  const o = mat4();
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    let s = 0;
    for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
    o[c * 4 + r] = s;
  }
  return o;
}
export function rotY(t) { const m = mat4(), c = Math.cos(t), s = Math.sin(t); m[0] = c; m[2] = -s; m[5] = 1; m[8] = s; m[10] = c; m[15] = 1; return m; }
export function rotX(t) { const m = mat4(), c = Math.cos(t), s = Math.sin(t); m[0] = 1; m[5] = c; m[6] = s; m[9] = -s; m[10] = c; m[15] = 1; return m; }
export function scaleM(s) { const m = mat4(); m[0] = m[5] = m[10] = s; m[15] = 1; return m; }
export function translate(x, y, z) { const m = mat4(); m[0] = m[5] = m[10] = m[15] = 1; m[12] = x; m[13] = y; m[14] = z; return m; }

// Unindexed triangles with the face normal and palette colour on every corner. The model
// is centred on its bounding box and scaled to fit units along its longest side; with
// fit: null it keeps its own coordinates (the parts of the vault chest must line up).
export function buildArtifactMesh(model, { fit = 2 } = {}) {
  const { verts: p, tris, palette } = model;
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < p.length; i += 3) {
    for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], p[i + k]); hi[k] = Math.max(hi[k], p[i + k]); }
  }
  const c = fit ? lo.map((v, k) => (v + hi[k]) / 2) : [0, 0, 0];
  const s = fit ? fit / Math.max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) : 1;
  const out = new Float32Array((tris.length / 4) * 3 * 9);
  let o = 0;
  for (let t = 0; t < tris.length; t += 4) {
    const v = [0, 1, 2].map((j) => [0, 1, 2].map((k) => (p[tris[t + j] * 3 + k] - c[k]) * s));
    const e1 = v[1].map((x, k) => x - v[0][k]), e2 = v[2].map((x, k) => x - v[0][k]);
    const n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    const len = Math.hypot(...n) || 1;
    const col = palette[tris[t + 3]];
    for (const q of v) {
      out.set(q, o); out.set(n.map((x) => x / len), o + 3); out.set(col, o + 6);
      o += 9;
    }
  }
  return out;
}

export class ArtifactRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: true });
    this.setup();
    canvas.addEventListener('webglcontextlost', (e) => e.preventDefault());
    canvas.addEventListener('webglcontextrestored', () => {
      this.setup();
      if (this.model) this.setModel(this.model);
    });
  }

  setup() {
    const gl = this.gl;
    this.prog = program(gl, VS, FS, 'artifact');
    this.vao = gl.createVertexArray();
    this.vbo = gl.createBuffer();
    this.count = 0;
  }

  setModel(model) {
    this.model = model;
    const gl = this.gl;
    if (gl.isContextLost()) return;
    const data = buildArtifactMesh(model);
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    for (let i = 0; i < 3; i++) {
      gl.enableVertexAttribArray(i);
      gl.vertexAttribPointer(i, 3, gl.FLOAT, false, 36, i * 12);
    }
    gl.bindVertexArray(null);
    this.count = data.length / 9;
  }

  // A square canvas shown cssSize CSS pixels across.
  resize(cssSize) {
    const px = Math.max(48, Math.round(cssSize * artifactDpr()));
    if (this.canvas.width !== px) { this.canvas.width = px; this.canvas.height = px; }
  }

  // pose: { yaw, pitch, scale, y }
  render(pose, glow = [0, 0, 0]) {
    const gl = this.gl;
    if (gl.isContextLost()) return;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (!this.count || !pose.scale) return;
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    const eye = [0, 0, 5.2];
    const proj = perspective((30 * Math.PI) / 180, 1, 0.5, 20);
    const model = mul(translate(0, pose.y ?? 0, 0), mul(rotX(pose.pitch ?? 0), mul(rotY(pose.yaw ?? 0), scaleM(pose.scale))));
    const p = this.prog;
    gl.useProgram(p.p);
    gl.uniformMatrix4fv(p.u.u_model, false, model);
    gl.uniformMatrix4fv(p.u.u_viewProj, false, mul(proj, translate(-eye[0], -eye[1], -eye[2])));
    gl.uniform3fv(p.u.u_eye, eye);
    gl.uniform3fv(p.u.u_glow, glow);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, this.count);
  }
}
