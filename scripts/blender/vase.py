"""Low-poly blue-and-white porcelain vase (the Vase of Jade Pass), modelled vertex by vertex
as a lathe profile. The cobalt pattern is made of the faces themselves: lotus petals round
the foot, a chain of lozenges on the belly, a pointed collar on the shoulder and the worn
band of a rope on the neck.

  blender -b --factory-startup -P scripts/blender/vase.py

Writes js/render/models/vase.js. Add --save to also keep scripts/blender/vase.blend.
"""
import math
import os
import sys

import bpy
import bmesh

sys.dont_write_bytecode = True

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from export_model import export_model  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(HERE))
SEGMENTS = 8  # the belly rings have twice as many
WHITE, COBALT, BISCUIT, ROPE, SHADOW = range(5)
COLORS = (('Porcelain', (0.88, 0.89, 0.86)), ('Cobalt', (0.10, 0.18, 0.52)),
          ('Biscuit', (0.72, 0.58, 0.42)), ('Rope', (0.42, 0.30, 0.16)),
          ('Shadow', (0.22, 0.24, 0.30)))

# Band patterns. A band between an 8-ring and a 16-ring is a row of triangles, and its
# middle triangles (petals pointing up, or collar points hanging down) take the ink.
MOTIF = ('motif', COBALT, WHITE)
# Two bands around one 16-ring, their quads split along diagonals, form a chain of lozenges
# centred on that ring's odd vertices.
LOZENGE_LO, LOZENGE_HI = ('lozenge', 'lo'), ('lozenge', 'hi')

# Bottom centre -> over the rim -> inside centre: (radius, height, fine ring, pattern of
# the band that ends at this ring).
PROFILE = [
    (0.00, 0.00, False, None),
    (0.28, 0.00, False, BISCUIT),     # underside
    (0.31, 0.05, False, BISCUIT),     # unglazed foot ring
    (0.31, 0.12, False, COBALT),      # foot band
    (0.40, 0.30, True, MOTIF),        # lotus petals
    (0.44, 0.36, True, COBALT),       # line
    (0.53, 0.58, True, WHITE),
    (0.56, 0.80, True, LOZENGE_LO),   # belly
    (0.53, 1.00, True, LOZENGE_HI),
    (0.46, 1.12, True, WHITE),
    (0.44, 1.15, True, COBALT),       # line
    (0.26, 1.30, False, MOTIF),       # shoulder collar
    (0.17, 1.38, False, WHITE),
    (0.19, 1.44, False, ROPE),        # where the caravan's rope wore the glaze
    (0.19, 1.50, False, ROPE),
    (0.16, 1.52, False, ROPE),
    (0.16, 1.66, False, WHITE),       # neck
    (0.22, 1.78, False, WHITE),       # flared mouth
    (0.25, 1.82, False, COBALT),      # lip
    (0.22, 1.83, False, COBALT),
    (0.13, 1.66, False, SHADOW),      # inside
    (0.10, 1.40, False, SHADOW),
    (0.00, 1.36, False, SHADOW),
]


def ring(bm, r, z, n):
    if r == 0:
        return [bm.verts.new((0, 0, z))]
    # Offset by half a coarse segment so a flat face, not an edge, looks at the viewer; a
    # fine ring keeps every coarse vertex and adds one between each pair.
    return [bm.verts.new((r * math.cos(a), r * math.sin(a), z))
            for a in (2 * math.pi * (k * SEGMENTS / n + 0.5) / SEGMENTS - math.pi / 2 for k in range(n))]


def face(bm, verts, mat):
    bm.faces.new(verts).material_index = mat


def band(bm, lo, hi, pat):
    n, m = len(lo), len(hi)
    if n == 1 or m == 1:
        for i in range(max(n, m)):
            j = (i + 1) % max(n, m)
            face(bm, (lo[0], hi[j], hi[i]) if n == 1 else (lo[i], lo[j], hi[0]), pat)
    elif n == m and isinstance(pat, int):
        for i in range(n):
            j = (i + 1) % n
            face(bm, (lo[i], lo[j], hi[j], hi[i]), pat)
    elif n == m:
        # Lozenge centres sit on the odd vertices of the ring between the two bands; each
        # quad is split towards the centre it belongs to and its inked half joins it.
        split = {  # (upper band, quad right of its centre) -> (ink, ground)
            (False, True): ((0, 3, 2), (0, 1, 3)),
            (False, False): ((1, 3, 2), (0, 1, 2)),
            (True, True): ((0, 1, 2), (1, 3, 2)),
            (True, False): ((0, 1, 3), (0, 3, 2)),
        }
        for i in range(n):
            j = (i + 1) % n
            quad = (lo[i], lo[j], hi[i], hi[j])
            ink, ground = split[(pat[1] == 'hi', i % 2 == 1)]
            face(bm, [quad[k] for k in ink], COBALT)
            face(bm, [quad[k] for k in ground], WHITE)
    else:
        _, ink, ground = pat
        coarse, fine = (lo, hi) if n < m else (hi, lo)
        for i in range(len(coarse)):
            j = (i + 1) % len(coarse)
            a, mid, b = fine[2 * i], fine[2 * i + 1], fine[(2 * i + 2) % len(fine)]
            face(bm, (coarse[i], coarse[j], mid), ink)
            face(bm, (coarse[i], mid, a), ground)
            face(bm, (coarse[j], b, mid), ground)


def build():
    bm = bmesh.new()
    rings = [ring(bm, r, z, 2 * SEGMENTS if fine else SEGMENTS) for r, z, fine, _ in PROFILE]
    for k in range(1, len(PROFILE)):
        band(bm, rings[k - 1], rings[k], PROFILE[k][3])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

    me = bpy.data.meshes.new('Vase')
    bm.to_mesh(me)
    bm.free()
    me.shade_flat()
    for name, rgb in COLORS:
        m = bpy.data.materials.new(name)
        m.diffuse_color = (*rgb, 1)
        me.materials.append(m)
    ob = bpy.data.objects.new('Vase', me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


for o in list(bpy.data.objects):
    bpy.data.objects.remove(o)
vase = build()
export_model(vase, 'vase', os.path.join(ROOT, 'js', 'render', 'models', 'vase.js'), 'scripts/blender/vase.py')
if '--save' in sys.argv:
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, 'vase.blend'))
