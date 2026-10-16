"""Low-poly castellan's key: a big iron key lying on its side, with an openwork bow of three
rings in a clover round a boss, a long shank with a collar, and a bit hanging from its tip
cut with seven teeth, one for each lock of the tower. Rust in the hollows.

  blender -b --factory-startup -P scripts/blender/key.py

Writes js/render/models/key.js.
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
from shapes import lathe, slab, sweep, torus, circle, finish  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(HERE))
IRON, DARK, RUST = 0, 1, 2
COLORS = (('Iron', (0.44, 0.43, 0.41)), ('IronDark', (0.24, 0.23, 0.22)), ('Rust', (0.52, 0.27, 0.13)))

BOW = (-0.42, 0.0)              # the clover's centre (x, z)
LOBE_R, LOBE_AT = 0.085, 0.14  # each ring's radius and its distance from the centre
SQUARE = [(-0.024, -0.032), (0.024, -0.032), (0.024, 0.032), (-0.024, 0.032)]
SHANK = (-0.42, 0.76, 0.044)    # from, to, radius
BIT_X, BIT_W, BIT_TOP, BIT_BOTTOM = 0.5, 0.17, 0.04, -0.38
TEETH = [0.06, 0.03, 0.075, 0.02, 0.06, 0.04, 0.07]   # how far each tooth stands out, bottom first


def build():
    bm = bmesh.new()
    # The bow: three rings and the boss where they meet.
    for deg in (90, 180, 270):
        a = math.radians(deg)
        torus(bm, (BOW[0] + LOBE_AT * math.cos(a), 0, BOW[1] + LOBE_AT * math.sin(a)), LOBE_R, SQUARE, 12,
              lambda k, i: RUST if (k + deg // 90) % 5 == 0 and i == 0 else (IRON if i in (0, 2) else DARK))
    lathe(bm, [(0.0, -0.045), (0.05, -0.04), (0.06, 0.0), (0.05, 0.04), (0.0, 0.045)], 8,
          lambda k, i: DARK if k in (2, 3) else IRON, centre=(BOW[0], 0, BOW[1]), axis='y')
    # The shank, its collar and the knop at the tip.
    x0, x1, r = SHANK
    sweep(bm, [((x0, 0, 0), r), ((0.1, 0, 0), r * 0.92), ((x1, 0, 0), r * 0.85)], circle(8),
          lambda k, i: RUST if k == 1 and i in (5, 6) else IRON)
    lathe(bm, [(0.0, -0.24), (0.05, -0.24), (0.068, -0.215), (0.068, -0.185), (0.05, -0.16), (0.0, -0.16)], 8,
          lambda k, i: DARK if k in (1, 5) else IRON, axis='x')
    lathe(bm, [(0.0, 0.74), (0.05, 0.75), (0.05, 0.8), (0.0, 0.81)], 8, lambda k, i: DARK, axis='x')
    # The bit, hanging from the shank, its teeth along the outer edge.
    edge = BIT_X + BIT_W
    h = (BIT_TOP - BIT_BOTTOM) / len(TEETH)
    outline = [(BIT_X, BIT_TOP), (BIT_X, BIT_BOTTOM), (edge, BIT_BOTTOM)]
    for j, d in enumerate(TEETH):
        z0 = BIT_BOTTOM + j * h
        outline += [(edge, z0 + 0.22 * h), (edge + d, z0 + 0.22 * h), (edge + d, z0 + 0.78 * h), (edge, z0 + 0.78 * h)]
    outline.append((edge, BIT_TOP))
    slab(bm, outline, 0.05, IRON)
    # Rust bleeding along the bit's root, as a strip a hair in front of each face.
    for y in (-0.026, 0.026):
        slab(bm, [(BIT_X, BIT_TOP - 0.01), (BIT_X, BIT_BOTTOM + 0.05), (BIT_X + 0.035, BIT_BOTTOM + 0.12), (BIT_X + 0.03, BIT_TOP - 0.01)], 0.004, RUST, y=y)
    return finish(bpy, bm, 'Key', COLORS)


for o in list(bpy.data.objects):
    bpy.data.objects.remove(o)
key = build()
export_model(key, 'key', os.path.join(ROOT, 'js', 'render', 'models', 'key.js'), 'scripts/blender/key.py')
