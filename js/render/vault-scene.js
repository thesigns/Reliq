// The vault chest scene where finds are stored: several low-poly models in one view (the
// chest, its hinged lid, the gold heap inside, falling coins, an artifact), with the flat
// shading and chunky pixels of the reveal screen. Its own WebGL2 context, created on first use.

import { program } from './gl.js';
import { VS, FS, ARTIFACT_PIXEL, buildArtifactMesh, mat4, mul, perspective, translate, rotX, rotY, scaleM } from './artifact3d.js';

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(...a) || 1; return a.map((v) => v / l); };

export function lookAt(eye, target, up = [0, 1, 0]) {
  const z = norm(sub(eye, target)), x = norm(cross(up, z)), y = cross(z, x);
  const m = mat4();
  m[0] = x[0]; m[4] = x[1]; m[8] = x[2];
  m[1] = y[0]; m[5] = y[1]; m[9] = y[2];
  m[2] = z[0]; m[6] = z[1]; m[10] = z[2];
  m[12] = -dot(x, eye); m[13] = -dot(y, eye); m[14] = -dot(z, eye); m[15] = 1;
  return m;
}

export function scale3(x, y, z) { const m = mat4(); m[0] = x; m[5] = y; m[10] = z; m[15] = 1; return m; }

// m · translate(p) · r · translate(-p): turn r about the point p of a model.
export function about(m, p, r) { return mul(m, mul(translate(p[0], p[1], p[2]), mul(r, translate(-p[0], -p[1], -p[2])))); }

export { mul, translate, rotX, rotY, scaleM };

export class VaultScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false });
    this.models = new Map();   // key -> { model, fit }, kept to rebuild after a context loss
    this.w = 1;
    this.h = 1;
    this.setup();
    canvas.addEventListener('webglcontextlost', (e) => e.preventDefault());
    canvas.addEventListener('webglcontextrestored', () => {
      this.setup();
      for (const [key, m] of this.models) this.upload(key, m);
    });
  }

  setup() {
    this.prog = program(this.gl, VS, FS, 'vault');
    this.meshes = new Map();
  }

  // fit: null keeps the model's own units (the chest parts); a number scales its longest
  // side to that many units (coins, artifacts).
  add(key, model, fit = null) {
    if (this.models.has(key)) return;
    const entry = { model, fit };
    this.models.set(key, entry);
    this.upload(key, entry);
  }

  upload(key, { model, fit }) {
    const gl = this.gl;
    if (gl.isContextLost()) return;
    const data = buildArtifactMesh(model, { fit });
    const vao = gl.createVertexArray(), vbo = gl.createBuffer();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    for (let i = 0; i < 3; i++) {
      gl.enableVertexAttribArray(i);
      gl.vertexAttribPointer(i, 3, gl.FLOAT, false, 36, i * 12);
    }
    gl.bindVertexArray(null);
    this.meshes.set(key, { vao, count: data.length / 9 });
  }

  // CSS size of the canvas; it renders at 1 / ARTIFACT_PIXEL of it.
  resize(w, h) {
    this.w = w;
    this.h = h;
    const pw = Math.max(1, Math.round(w / ARTIFACT_PIXEL)), ph = Math.max(1, Math.round(h / ARTIFACT_PIXEL));
    if (this.canvas.width !== pw || this.canvas.height !== ph) { this.canvas.width = pw; this.canvas.height = ph; }
  }

  // camera: { eye, target, fov }. Returns the view-projection matrix.
  viewProj(camera) {
    return mul(perspective(camera.fov, this.w / this.h, 0.3, 40), lookAt(camera.eye, camera.target));
  }

  // A world point in CSS pixels of the canvas.
  project(camera, p) {
    const m = this.viewProj(camera);
    const x = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12];
    const y = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13];
    const w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15];
    return { x: ((x / w + 1) / 2) * this.w, y: ((1 - y / w) / 2) * this.h };
  }

  // items: [{ key, matrix, glow? }]
  render(camera, items) {
    const gl = this.gl;
    if (gl.isContextLost()) return;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    const p = this.prog;
    gl.useProgram(p.p);
    gl.uniformMatrix4fv(p.u.u_viewProj, false, this.viewProj(camera));
    gl.uniform3fv(p.u.u_eye, camera.eye);
    for (const it of items) {
      const mesh = this.meshes.get(it.key);
      if (!mesh) continue;
      gl.uniformMatrix4fv(p.u.u_model, false, it.matrix);
      gl.uniform3fv(p.u.u_glow, it.glow ?? [0, 0, 0]);
      gl.bindVertexArray(mesh.vao);
      gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
    }
    gl.bindVertexArray(null);
  }
}
