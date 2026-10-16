"""Low-poly sky disc from the Elbe: a plate of green-patinated bronze with gold inlaid on its
face (the sun, a crescent moon, a scatter of stars, horizon arcs on both edges and the sun
boat below) and small holes punched round the rim.

  blender -b --factory-startup -P scripts/blender/skydisc.py

Writes js/render/models/skydisc.js.
"""
import math
import os
import random
import sys

import bpy
import bmesh

sys.dont_write_bytecode = True

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from export_model import export_model  # noqa: E402
from shapes import lathe, slab, face_toward, finish  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(HERE))
PATINA, PATINA_DARK, GOLD, GOLD_DARK, HOLE = range(5)
COLORS = (('Patina', (0.28, 0.5, 0.4)), ('PatinaDark', (0.19, 0.35, 0.29)), ('Gold', (0.95, 0.74, 0.28)),
          ('GoldDark', (0.72, 0.5, 0.16)), ('Hole', (0.07, 0.09, 0.07)))

R, T = 0.5, 0.06                     # radius and thickness of the plate; its face looks at -y
FACE = -T / 2                        # y of the front face
INLAY = 0.012                        # gold stands this proud of the face


def arc(cx, cz, r, a0, a1, n):
    return [(cx + r * math.cos(math.radians(a0 + (a1 - a0) * i / n)), cz + r * math.sin(math.radians(a0 + (a1 - a0) * i / n))) for i in range(n + 1)]


def band(r0, r1, a0, a1, n):
    """A strip along the rim between radii r0 and r1, from angle a0 to a1 (degrees)."""
    return arc(0, 0, r1, a0, a1, n) + arc(0, 0, r0, a1, a0, n)


def gold(bm, outline):
    slab(bm, outline, INLAY, GOLD, bevel=0.004, bevel_mat=GOLD_DARK, y=FACE - INLAY / 2 + 0.002)


def build():
    bm = bmesh.new()
    # The plate, its edge bevelled and darker.
    lathe(bm, [(0.0, -T / 2), (R - 0.04, -T / 2), (R, -T / 4), (R, T / 4), (R - 0.04, T / 2), (0.0, T / 2)], 20,
          lambda k, i: PATINA if k in (1, 5) else PATINA_DARK, axis='y')
    gold(bm, arc(-0.16, 0.1, 0.12, 0, 360, 14)[:-1])                                   # the sun
    gold(bm, arc(0.17, 0.12, 0.12, 60, 300, 10) + arc(0.23, 0.13, 0.105, 245, 115, 8))  # the moon
    gold(bm, band(0.4, 0.45, 140, 220, 8))                                             # horizons
    gold(bm, band(0.4, 0.45, -40, 40, 8))
    gold(bm, arc(0.0, -0.08, 0.3, 235, 305, 8) + arc(0.0, -0.11, 0.25, 300, 240, 8))   # the sun boat
    rnd = random.Random(7)
    stars = [(-0.3, 0.26), (-0.05, 0.3), (0.06, 0.18), (-0.24, -0.08), (0.02, 0.04), (0.3, -0.06),
             (0.14, -0.14), (-0.12, -0.16), (0.22, 0.32), (-0.2, 0.3), (0.08, 0.36), (-0.02, -0.25)]
    for x, z in stars:
        s = 0.022 + rnd.random() * 0.008
        gold(bm, [(x, z + s), (x - s, z), (x, z - s), (x + s, z)])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    # Holes punched round the rim: dark dots on the face.
    for i in range(32):
        a = 2 * math.pi * i / 32
        x, z = 0.47 * math.cos(a), 0.47 * math.sin(a)
        d = 0.009
        face_toward(bm, [bm.verts.new((x + dx, FACE - 0.001, z + dz)) for dx, dz in ((-d, -d), (d, -d), (d, d), (-d, d))], (0, -1, 0), HOLE)
    return finish(bpy, bm, 'Skydisc', COLORS, recalc=False)


for o in list(bpy.data.objects):
    bpy.data.objects.remove(o)
disc = build()
export_model(disc, 'skydisc', os.path.join(ROOT, 'js', 'render', 'models', 'skydisc.js'), 'scripts/blender/skydisc.py')
