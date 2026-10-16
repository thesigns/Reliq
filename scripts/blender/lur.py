"""Low-poly bronze lur from a Danish bog: a long tube bent into an S, widening from the
mouthpiece, banded every few joints, and ending in a flat plate set with a ring of bosses.

  blender -b --factory-startup -P scripts/blender/lur.py

Writes js/render/models/lur.js.
"""
import math
import os
import sys

import bpy
import bmesh
from mathutils import Vector

sys.dont_write_bytecode = True

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from export_model import export_model  # noqa: E402
from shapes import lathe, sweep, circle, move, new_verts, finish  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(HERE))
BRONZE, DARK, BOSS = 0, 1, 2
COLORS = (('Bronze', (0.8, 0.58, 0.27)), ('BronzeDark', (0.5, 0.33, 0.14)), ('Boss', (0.95, 0.78, 0.4)))

# The tube's centre line, mouthpiece first, in the x-z plane: it bends right, then up and
# back, the way a lur is held over the player's shoulder.
LINE = [(-0.42, 0.0), (-0.43, 0.12), (-0.4, 0.24), (-0.32, 0.34), (-0.2, 0.4), (-0.06, 0.42),
        (0.08, 0.43), (0.2, 0.48), (0.28, 0.58), (0.31, 0.71), (0.29, 0.84), (0.24, 0.95)]
R0, R1 = 0.026, 0.06


def build():
    bm = bmesh.new()
    n = len(LINE)
    path = [((x, 0, z), R0 + (R1 - R0) * (k / (n - 1)) ** 1.5) for k, (x, z) in enumerate(LINE)]
    sweep(bm, path, circle(8), lambda k, i: DARK if k % 3 == 0 else BRONZE, caps=(True, False))
    # The mouthpiece: a small cup on the near end.
    start, nxt = Vector((LINE[0][0], 0, LINE[0][1])), Vector((LINE[1][0], 0, LINE[1][1]))
    mouth = new_verts(bm, lambda b: lathe(b, [(0.0, 0.0), (0.035, 0.0), (0.04, 0.015), (0.025, 0.03), (0.022, 0.06)], 8, lambda k, i: DARK))
    up = (nxt - start).normalized()
    q = (-up).to_track_quat('Z', 'Y')
    for v in mouth:
        v.co = q @ v.co + start
    # The plate at the far end, square to the tube, with its ring of bosses.
    end, before = Vector((LINE[-1][0], 0, LINE[-1][1])), Vector((LINE[-2][0], 0, LINE[-2][1]))
    plate = new_verts(bm, lambda b: lathe(b, [(0.0, 0.0), (0.05, 0.0), (0.16, 0.012), (0.17, 0.03), (0.15, 0.04), (0.07, 0.035), (0.04, 0.06), (0.0, 0.07)], 14,
                                           lambda k, i: DARK if k in (2, 3) else BRONZE))
    for i in range(8):
        a = 2 * math.pi * i / 8
        boss = new_verts(bm, lambda b: lathe(b, [(0.0, 0.0), (0.022, 0.0), (0.018, 0.02), (0.0, 0.03)], 6, lambda k, j: BOSS))
        move(boss, (0.11 * math.cos(a), 0.11 * math.sin(a), 0.03))
        plate += boss
    q = (end - before).normalized().to_track_quat('Z', 'Y')
    for v in plate:
        v.co = q @ v.co + end
    return finish(bpy, bm, 'Lur', COLORS)


for o in list(bpy.data.objects):
    bpy.data.objects.remove(o)
lur = build()
export_model(lur, 'lur', os.path.join(ROOT, 'js', 'render', 'models', 'lur.js'), 'scripts/blender/lur.py')
