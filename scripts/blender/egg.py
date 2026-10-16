"""Low-poly tsarina's egg: an egg of ice-blue enamel caged in a gold lattice of crossing
spirals, a diamond at every knot of the lattice, a jewel on the crown, and a gold foot
it stands in.

  blender -b --factory-startup -P scripts/blender/egg.py

Writes js/render/models/egg.js.
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
from shapes import lathe, sweep, finish  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(HERE))
ENAMEL, ENAMEL_DARK, GOLD, GOLD_DARK, DIAMOND = range(5)
COLORS = (('Enamel', (0.55, 0.76, 0.92)), ('EnamelDark', (0.4, 0.6, 0.82)), ('Gold', (0.95, 0.74, 0.28)),
          ('GoldDark', (0.66, 0.44, 0.12)), ('Diamond', (0.94, 0.97, 1.0)))

BASE = 0.22                   # height of the egg's bottom, above the foot
HEIGHT, WIDTH = 0.78, 0.29    # the egg's height and its greatest radius
SEG = 12
LATTICE = 6                   # spirals each way
RINGS = 8                     # the lattice's rows of knots, between the poles


def egg(theta):
    """A point on the egg's outline: theta runs from the bottom (0) to the top (pi); the
    lower half is the fuller one."""
    return WIDTH * math.sin(theta) * (1 + 0.1 * math.cos(theta)), BASE + HEIGHT * (1 - math.cos(theta)) / 2


def build():
    bm = bmesh.new()
    lathe(bm, [egg(math.pi * k / 10) for k in range(11)], SEG, lambda k, i: ENAMEL_DARK if (k + i) % 2 else ENAMEL)
    # The lattice: spirals each way, crossing at every row, a diamond at each crossing.
    step = 2 * math.pi / LATTICE
    rows = [egg(math.pi * (r + 1) / (RINGS + 1)) for r in range(RINGS)]
    for turn in (1, -1):
        for n in range(LATTICE):
            path = []
            for r, (rad, z) in enumerate(rows):
                a = n * step + turn * r * step / 2
                path.append(((math.cos(a) * (rad + 0.012), math.sin(a) * (rad + 0.012), z), 1.0))
            sweep(bm, path, [(-0.012, -0.008), (0.012, -0.008), (0.012, 0.008), (-0.012, 0.008)],
                  lambda k, i: GOLD_DARK if i == 1 else GOLD)
    for r, (rad, z) in enumerate(rows):
        for n in range(LATTICE):
            a = n * step + r * step / 2
            out = rad + 0.03
            centre = (math.cos(a) * out, math.sin(a) * out, z)
            lathe(bm, [(0.0, -0.028), (0.026, 0.0), (0.0, 0.028)], 4, lambda k, i: DIAMOND, centre=centre)
    # The jewel on the crown and the foot.
    top = BASE + HEIGHT
    lathe(bm, [(0.0, top - 0.02), (0.06, top - 0.01), (0.05, top + 0.03), (0.0, top + 0.04)], 8, lambda k, i: GOLD)
    lathe(bm, [(0.0, top + 0.03), (0.04, top + 0.07), (0.0, top + 0.12)], 6, lambda k, i: DIAMOND)
    lathe(bm, [(0.0, 0.0), (0.26, 0.0), (0.26, 0.04), (0.14, 0.07), (0.06, 0.1), (0.05, 0.16), (0.13, BASE + 0.02),
               (0.16, BASE + 0.06), (0.0, BASE + 0.06)], 10, lambda k, i: GOLD_DARK if k in (2, 5) else GOLD)
    return finish(bpy, bm, 'Egg', COLORS)


for o in list(bpy.data.objects):
    bpy.data.objects.remove(o)
egg_ob = build()
export_model(egg_ob, 'egg', os.path.join(ROOT, 'js', 'render', 'models', 'egg.js'), 'scripts/blender/egg.py')
