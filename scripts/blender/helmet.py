"""Low-poly Corinthian helmet from Marathon: a bronze shell closed round the face, with eye
openings either side of the nasal and a slot down between the cheek pieces, a neck guard
flared at the back, hollow underneath, and a horsehair crest, faded to rust, running over
the top from brow to nape.

  blender -b --factory-startup -P scripts/blender/helmet.py

Writes js/render/models/helmet.js.
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
from shapes import slab, rotate, new_verts, finish  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(HERE))
BRONZE, DARK, HOLE, CREST, CREST_DARK = range(5)
COLORS = (('Bronze', (0.8, 0.57, 0.26)), ('BronzeDark', (0.52, 0.34, 0.14)), ('Hole', (0.06, 0.04, 0.03)),
          ('Crest', (0.62, 0.22, 0.12)), ('CrestDark', (0.42, 0.13, 0.08)))

N = 20   # faces round the head; face 0 looks straight ahead (-y)
# Outside, crown to rim: (z, half width in front, half width behind, half depth in front,
# half depth behind). The cheek pieces close in towards the chin; the neck guard flares.
SHELL = [(0.97, 0.17, 0.17, 0.19, 0.21), (0.9, 0.29, 0.29, 0.32, 0.34), (0.78, 0.37, 0.37, 0.4, 0.41),
         (0.65, 0.4, 0.4, 0.43, 0.43), (0.56, 0.39, 0.4, 0.43, 0.43), (0.47, 0.36, 0.39, 0.43, 0.44),
         (0.35, 0.31, 0.39, 0.42, 0.46), (0.21, 0.25, 0.4, 0.38, 0.5), (0.1, 0.2, 0.42, 0.34, 0.55)]
NOTCH = 0.14                                  # the rim rises this much at the sides, over the ears
EYES, NOSE, MOUTH = 5, 6, (7, 8)           # bands, counted from the crown
INNER = 0.86                                  # the inside is the outside scaled by this


def ring(bm, z, af, ab, bf, bb, scale=1.0, notch=0.0):
    pts = []
    for i in range(N):
        t = 2 * math.pi * (i - 0.5) / N - math.pi / 2
        c, s = math.cos(t), math.sin(t)
        a = af + (ab - af) * (s + 1) / 2
        lift = notch * max(0.0, c * c - 0.4) / 0.6
        pts.append(bm.verts.new((scale * a * c, scale * (bf if s < 0 else bb) * s, z + lift)))
    return pts


def band(bm, lo, hi, mat_of):
    for i in range(N):
        j = (i + 1) % N
        bm.faces.new((lo[i], lo[j], hi[j], hi[i])).material_index = mat_of(i, min(i, N - i))


def shell_mat(k, i, d):
    if k == EYES and d in (1, 2):
        return HOLE
    if k == NOSE and d == 1:
        return HOLE
    if k in MOUTH and d == 0:
        return HOLE
    return BRONZE


def build():
    bm = bmesh.new()
    crown = bm.verts.new((0, 0, 1.0))
    rings = [ring(bm, *row, notch=NOTCH if k == len(SHELL) - 1 else 0.0) for k, row in enumerate(SHELL)]
    for i in range(N):
        bm.faces.new((rings[0][i], rings[0][(i + 1) % N], crown)).material_index = BRONZE
    for k in range(1, len(rings)):
        band(bm, rings[k - 1], rings[k], lambda i, d: shell_mat(k + 1, i, d))
    # The rim, then the hollow inside going back up.
    inside = [ring(bm, *row, scale=INNER, notch=NOTCH if k == 0 else 0.0) for k, row in enumerate(reversed(SHELL[2:]))]
    band(bm, rings[-1], inside[0], lambda i, d: DARK)
    for k in range(1, len(inside)):
        band(bm, inside[k - 1], inside[k], lambda i, d: HOLE)
    top = bm.verts.new((0, 0, 0.8))
    for i in range(N):
        bm.faces.new((inside[-1][i], inside[-1][(i + 1) % N], top)).material_index = HOLE
    # The crest: a board cut in the side view (x here is front to back) and turned to stand
    # along the head.
    outer = [(0.1 + 0.74 * math.cos(math.radians(a)), 0.48 + 0.74 * math.sin(math.radians(a))) for a in range(-5, 156, 14)]
    inner = [(0.42 * math.cos(math.radians(a)), 0.58 + 0.42 * math.sin(math.radians(a))) for a in range(150, 9, -14)]
    crest = new_verts(bm, lambda b: slab(b, outer + inner, 0.13, CREST, bevel=0.025, bevel_mat=CREST_DARK))
    rotate(crest, math.pi / 2, (0, 0, 1))
    return finish(bpy, bm, 'Helmet', COLORS)


for o in list(bpy.data.objects):
    bpy.data.objects.remove(o)
helmet = build()
export_model(helmet, 'helmet', os.path.join(ROOT, 'js', 'render', 'models', 'helmet.js'), 'scripts/blender/helmet.py')
