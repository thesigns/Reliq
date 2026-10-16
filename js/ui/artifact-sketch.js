// An ink sketch of a tomb artifact, drawn from its low-poly model (js/render/models/) so the
// mission card shows exactly what the tomb holds without giving away the 3D reward.
//
// The model is turned to a three-quarter view and drawn back to front: each visible face is
// washed in sepia by how much light it catches (darker palette colours wash darker, so a
// pattern still reads), dark faces are hatched, and the ink follows the outline, the creases
// between facets and the borders between colours.

const INK = '#3b2414';
const PAPER = [244, 233, 207];
const WASH = [150, 112, 70];
const CREASE = Math.cos((32 * Math.PI) / 180);   // facets turning more than this get a line
const LIGHT = norm([-0.55, 0.7, 0.45]);          // upper left, towards the viewer

let uid = 0;   // inline SVGs share one document: pattern ids must be unique

function norm(v) { const l = Math.hypot(...v); return v.map((c) => c / l); }
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const fmt = (v) => (Math.round(v * 10) / 10).toString();
const mix = (a, b, u) => a.map((c, i) => Math.round(c + (b[i] - c) * u));

// model: { palette, verts, tris } from js/render/models/. yaw, pitch in radians.
export function artifactSketch(model, { yaw = -0.6, pitch = 0.42 } = {}) {
  const id = `ask${uid++}`;
  const { verts, tris, palette } = model;
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  // Turn about the vertical axis, then tilt the top towards the viewer (y up, +z to us).
  const view = (x, y, z) => {
    const x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
    return [x1, y * cp - z1 * sp, y * sp + z1 * cp];
  };
  const P = [];
  for (let i = 0; i < verts.length; i += 3) P.push(view(verts[i], verts[i + 1], verts[i + 2]));

  // Fit the drawing into a 200-unit box.
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const [x, y] of P) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const k = 184 / Math.max(x1 - x0, y1 - y0);
  const S = P.map(([x, y]) => [100 + (x - (x0 + x1) / 2) * k, 100 - (y - (y0 + y1) / 2) * k]);

  const lum = palette.map(([r, g, b]) => 0.3 * r + 0.59 * g + 0.11 * b);
  const faces = [];
  for (let i = 0; i < tris.length; i += 4) {
    const [a, b, c, m] = [tris[i], tris[i + 1], tris[i + 2], tris[i + 3]];
    const u = P[b].map((v, j) => v - P[a][j]), w = P[c].map((v, j) => v - P[a][j]);
    const n = norm([u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]]);
    faces.push({ v: [a, b, c], m, n, front: n[2] > 1e-4, depth: (P[a][2] + P[b][2] + P[c][2]) / 3 });
  }

  // Each edge with the faces on either side of it.
  const edges = new Map();
  faces.forEach((f, fi) => {
    for (let e = 0; e < 3; e++) {
      const a = f.v[e], b = f.v[(e + 1) % 3];
      const key = a < b ? `${a},${b}` : `${b},${a}`;
      if (!edges.has(key)) edges.set(key, { a, b, faces: [] });
      edges.get(key).faces.push(fi);
    }
  });

  const order = faces.map((_, i) => i).filter((i) => faces[i].front).sort((i, j) => faces[i].depth - faces[j].depth);
  const rank = new Map(order.map((fi, r) => [fi, r]));
  // A line is drawn with the nearest visible face it borders, so nearer faces hide it.
  const lines = order.map(() => []);
  for (const e of edges.values()) {
    const vis = e.faces.filter((fi) => faces[fi].front);
    if (!vis.length) continue;
    let weight = 0;
    if (e.faces.length !== 2 || vis.length === 1) weight = 1.7;                       // outline
    else {
      const [f, g] = e.faces.map((fi) => faces[fi]);
      if (dot(f.n, g.n) < CREASE) weight = 1.0;                                        // crease
      else if (f.m !== g.m) weight = 0.7;                                              // colour border
    }
    if (weight) lines[Math.max(...vis.map((fi) => rank.get(fi)))].push([e.a, e.b, weight]);
  }

  const pt = (i) => `${fmt(S[i][0])},${fmt(S[i][1])}`;
  let body = '';
  order.forEach((fi, r) => {
    const f = faces[fi];
    const shade = Math.min(1, 0.62 * (1 - Math.max(0, dot(f.n, LIGHT))) + 0.4 * (1 - lum[f.m]));
    const [cr, cg, cb] = mix(PAPER, WASH, shade * 0.85);
    const poly = f.v.map(pt).join(' ');
    // The thin same-colour stroke closes the hairline seams between neighbouring faces.
    body += `<polygon points="${poly}" fill="rgb(${cr},${cg},${cb})" stroke="rgb(${cr},${cg},${cb})" stroke-width=".6"/>`;
    if (shade > 0.5) body += `<polygon points="${poly}" fill="url(#${id}-${shade > 0.72 ? 'h2' : 'h1'})" stroke="none"/>`;
    for (const [a, b, wgt] of lines[r]) {
      body += `<line x1="${fmt(S[a][0])}" y1="${fmt(S[a][1])}" x2="${fmt(S[b][0])}" y2="${fmt(S[b][1])}" stroke-width="${wgt}"/>`;
    }
  });

  const hatch = (name, gap, width) => `<pattern id="${id}-${name}" width="${gap}" height="${gap}" patternUnits="userSpaceOnUse" patternTransform="rotate(-38)"><line x1="0" y1="0" x2="0" y2="${gap}" stroke="${INK}" stroke-width="${width}" stroke-opacity=".45"/></pattern>`;
  return `<svg class="artifact-sketch" viewBox="0 0 200 200" aria-hidden="true">
    <defs>${hatch('h1', 4.2, 0.55)}${hatch('h2', 2.8, 0.7)}</defs>
    <g stroke="${INK}" stroke-linecap="round" stroke-linejoin="round">${body}</g>
  </svg>`;
}
