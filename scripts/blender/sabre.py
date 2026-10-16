"""Low-poly karabela of the hetman: a curved steel blade with a fuller, a gold cross-guard
with ball ends and short langets, a dark grip bound in gold, and the pommel bent down into
an eagle's head with ruby eyes.

  blender -b --factory-startup -P scripts/blender/sabre.py

Writes js/render/models/sabre.js.
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
from shapes import lathe, slab, sweep, box, circle, rotate, new_verts, finish  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(HERE))
STEEL, STEEL_DARK, GOLD, GOLD_DARK, GRIP, RUBY = range(6)
COLORS = (('Steel', (0.8, 0.82, 0.86)), ('SteelDark', (0.45, 0.48, 0.53)), ('Gold', (0.95, 0.74, 0.28)),
          ('GoldDark', (0.66, 0.44, 0.12)), ('Grip', (0.3, 0.08, 0.07)), ('Ruby', (0.8, 0.06, 0.1)))

LENGTH = 1.15                 # the blade, guard to point (short and broad, to read when small)
BEND = 0.17                   # how far the blade's point drops below a straight line
STEPS = 10
TILT = math.radians(-28)      # the whole sabre, point raised


def curve(x):
    return -BEND * (x / LENGTH) ** 2


def blade_outline():
    """The blade seen flat: along the back (top) to the point, and back along the edge."""
    back, edge = [], []
    for k in range(STEPS + 1):
        x = LENGTH * k / STEPS
        w = 0.085 * (1 - 0.35 * k / STEPS)      # the blade narrows towards the point
        if k == STEPS:
            break
        back.append((x, curve(x) + w * 0.4))
        edge.append((x, curve(x) - w * 0.6))
    tip = (LENGTH + 0.04, curve(LENGTH) - 0.02)
    return back + [tip] + list(reversed(edge))


def build():
    bm = bmesh.new()
    slab(bm, blade_outline(), 0.022, STEEL, bevel=0.009, bevel_mat=STEEL_DARK)
    # The fuller: a dark groove along the back half, on both faces.
    fuller = [(0.05 + x, curve(0.05 + x) + 0.008) for x in (0, 0.25, 0.5, 0.7)]
    fuller = fuller + [(x, z - 0.022) for x, z in reversed(fuller)]
    for y in (-0.012, 0.012):
        slab(bm, fuller, 0.004, STEEL_DARK, y=y)
    # The cross-guard with ball ends, and the langets lying along the blade.
    box(bm, (-0.03, -0.025, -0.13), (0.03, 0.025, 0.11), GOLD)
    for z in (-0.15, 0.13):
        lathe(bm, [(0.0, z - 0.035), (0.03, z - 0.025), (0.035, z), (0.03, z + 0.025), (0.0, z + 0.035)], 6, lambda k, i: GOLD_DARK)
    for y in (-0.016, 0.016):
        slab(bm, [(0.02, 0.03), (0.13, 0.015), (0.15, -0.01), (0.13, -0.035), (0.02, -0.045)], 0.008, GOLD, y=y)
    # The grip, bending down at its end, bound with gold at both ends.
    grip = [((-0.03, 0, -0.01), (0.03, 0.022)), ((-0.12, 0, -0.005), (0.034, 0.024)), ((-0.22, 0, -0.015), (0.034, 0.024)),
            ((-0.3, 0, -0.04), (0.03, 0.022)), ((-0.34, 0, -0.07), (0.03, 0.022))]
    sweep(bm, grip, circle(8), lambda k, i: GOLD if k in (1, 5) else GRIP)
    for x, z in ((-0.06, -0.01), (-0.28, -0.03)):
        lathe(bm, [(0.0, x - 0.015), (0.037, x - 0.015), (0.037, x + 0.015), (0.0, x + 0.015)], 8, lambda k, i: GOLD_DARK,
              centre=(0, 0, z), axis='x')
    # The eagle's head: a gold head on the grip's end, the beak hooked down towards the edge.
    head = Vector((-0.37, 0, -0.1))
    lathe(bm, [(0.0, -0.06), (0.045, -0.045), (0.055, 0.0), (0.04, 0.04), (0.0, 0.055)], 8, lambda k, i: GOLD,
          centre=head, axis='x')
    beak = new_verts(bm, lambda b: lathe(b, [(0.0, 0.0), (0.03, 0.0), (0.02, 0.05), (0.0, 0.09)], 6, lambda k, i: GOLD_DARK))
    rotate(beak, math.radians(150), (0, 1, 0))
    for v in beak:
        v.co += head + Vector((-0.03, 0, -0.02))
    for y in (-0.05, 0.05):
        box(bm, (head.x - 0.03, y - 0.008, head.z + 0.0), (head.x - 0.005, y + 0.008, head.z + 0.025), RUBY)
    rotate(bm.verts, TILT, (0, 1, 0))
    return finish(bpy, bm, 'Sabre', COLORS)


for o in list(bpy.data.objects):
    bpy.data.objects.remove(o)
sabre = build()
export_model(sabre, 'sabre', os.path.join(ROOT, 'js', 'render', 'models', 'sabre.js'), 'scripts/blender/sabre.py')
