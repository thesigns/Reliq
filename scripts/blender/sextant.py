"""Low-poly cartographer's sextant: a brass frame shaped like a slice of a wheel, a silver
scale along its arc, the index arm swung a little off the zero, the index and horizon
mirrors, a short telescope, and a wooden handle at the back.

  blender -b --factory-startup -P scripts/blender/sextant.py

Writes js/render/models/sextant.js.
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
from shapes import lathe, slab, box, face_toward, rotate, new_verts, finish  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(HERE))
BRASS, BRASS_DARK, SILVER, BLACK, MIRROR, WOOD, WOOD_DARK = range(7)
COLORS = (('Brass', (0.86, 0.66, 0.3)), ('BrassDark', (0.55, 0.38, 0.14)), ('Silver', (0.86, 0.87, 0.88)),
          ('Black', (0.07, 0.06, 0.06)), ('Mirror', (0.62, 0.74, 0.82)), ('Wood', (0.45, 0.24, 0.12)),
          ('WoodDark', (0.28, 0.14, 0.07)))

APEX = (0.0, 0.5)            # the pivot at the top of the frame (x, z)
R = 0.88                     # from the pivot to the arc's outer edge
A0, A1 = 240, 300            # the arc's ends, in degrees about the pivot
ARM = 263                    # where the index arm points
T = 0.04                     # thickness of the frame


def at(r, deg):
    a = math.radians(deg)
    return (APEX[0] + r * math.cos(a), APEX[1] + r * math.sin(a))


def bar(p, q, w):
    """A straight strip from p to q, w wide, as an outline in the x-z plane."""
    dx, dz = q[0] - p[0], q[1] - p[1]
    n = w / 2 / math.hypot(dx, dz)
    return [(p[0] + dz * n, p[1] - dx * n), (q[0] + dz * n, q[1] - dx * n), (q[0] - dz * n, q[1] + dx * n), (p[0] - dz * n, p[1] + dx * n)]


def build():
    bm = bmesh.new()
    # The frame: the arc, two radial bars and a brace.
    arc = [at(R, a) for a in range(A0, A1 + 1, 6)] + [at(R - 0.11, a) for a in range(A1, A0 - 1, -6)]
    slab(bm, arc, T, BRASS, bevel=0.012, bevel_mat=BRASS_DARK)
    for a in (A0, A1):
        slab(bm, bar(APEX, at(R - 0.08, a), 0.07), T, BRASS, bevel=0.01, bevel_mat=BRASS_DARK)
    slab(bm, bar(at(0.45, A0), at(0.45, A1), 0.05), T, BRASS_DARK)
    lathe(bm, [(0.0, -0.035), (0.07, -0.035), (0.07, 0.035), (0.0, 0.035)], 10, lambda k, i: BRASS_DARK,
          centre=(APEX[0], 0, APEX[1]), axis='y')
    # The silver scale along the arc, ticked every few degrees.
    strip = [at(R - 0.012, a) for a in range(A0 + 2, A1 - 1, 4)] + [at(R - 0.05, a) for a in range(A1 - 2, A0 + 1, -4)]
    slab(bm, strip, 0.006, SILVER, y=-T / 2 - 0.003)
    y = -T / 2 - 0.007
    for a in range(A0 + 4, A1 - 3, 4):
        long = (a - A0) % 12 == 0
        tick = bar(at(R - 0.014, a), at(R - (0.046 if long else 0.032), a), 0.007)
        face_toward(bm, [bm.verts.new((x, y, z)) for x, z in tick], (0, -1, 0), BLACK)
    # The index arm in front, with its mirror at the pivot and the vernier at the arc.
    arm = new_verts(bm, lambda b: (slab(b, bar(APEX, at(R + 0.03, 270), 0.05), 0.02, BRASS_DARK, y=-T / 2 - 0.02),
                                   box(b, (-0.05, -T / 2 - 0.035, APEX[1] - R + 0.0), (0.05, -T / 2 - 0.005, APEX[1] - R + 0.08), BRASS)))
    rotate(arm, math.radians(270 - ARM), (0, 1, 0), pivot=(APEX[0], 0, APEX[1]))
    box(bm, (-0.07, -0.13, APEX[1] - 0.02), (0.07, -0.1, APEX[1] + 0.13), {'all': BRASS_DARK, '-y': MIRROR})
    box(bm, (-0.075, -0.1, APEX[1] - 0.02), (0.075, -0.03, APEX[1] + 0.0), BRASS_DARK)
    hx, hz = at(0.62, A0 + 6)
    box(bm, (hx - 0.05, -0.12, hz - 0.06), (hx + 0.05, -0.09, hz + 0.08), {'all': BRASS_DARK, '-y': MIRROR})
    box(bm, (hx - 0.055, -0.09, hz - 0.07), (hx + 0.055, -T / 2, hz - 0.05), BRASS_DARK)
    # The telescope, aimed at the horizon mirror.
    tz = hz + 0.01
    lathe(bm, [(0.0, hx + 0.1), (0.045, hx + 0.1), (0.045, hx + 0.16), (0.038, hx + 0.17), (0.038, hx + 0.42), (0.05, hx + 0.43),
               (0.05, hx + 0.52), (0.0, hx + 0.52)], 8,
          lambda k, i: BLACK if k == 7 else (BRASS_DARK if k in (2, 5, 6) else BRASS), centre=(0, -0.1, tz), axis='x')
    box(bm, (hx + 0.25, -0.07, tz - 0.02), (hx + 0.3, -T / 2, tz + 0.02), BRASS_DARK)
    # The handle at the back.
    hx2 = 0.08
    lathe(bm, [(0.0, -0.16), (0.04, -0.16), (0.05, -0.1), (0.045, 0.0), (0.05, 0.1), (0.04, 0.16), (0.0, 0.16)], 8,
          lambda k, i: WOOD_DARK if k in (1, 6) else WOOD, centre=(hx2, 0.14, 0.02))
    for z in (-0.12, 0.16):
        box(bm, (hx2 - 0.025, T / 2, z - 0.02), (hx2 + 0.025, 0.14, z + 0.02), BRASS_DARK)
    return finish(bpy, bm, 'Sextant', COLORS)


for o in list(bpy.data.objects):
    bpy.data.objects.remove(o)
sextant = build()
export_model(sextant, 'sextant', os.path.join(ROOT, 'js', 'render', 'models', 'sextant.js'), 'scripts/blender/sextant.py')
