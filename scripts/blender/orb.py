"""Low-poly coronation orb: a gold ball girdled by a band round its middle and a half band
over the top, both set with stones, and a cross on a knop at the top, knocked a little
crooked the day the orb fell.

  blender -b --factory-startup -P scripts/blender/orb.py

Writes js/render/models/orb.js.
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
from shapes import lathe, box, sweep, torus, rotate, move, new_verts, finish  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(HERE))
GOLD, GOLD_DARK, RUBY, SAPPHIRE, EMERALD, PEARL = range(6)
COLORS = (('Gold', (0.95, 0.74, 0.28)), ('GoldDark', (0.66, 0.44, 0.12)), ('Ruby', (0.75, 0.06, 0.1)),
          ('Sapphire', (0.1, 0.22, 0.7)), ('Emerald', (0.08, 0.55, 0.3)), ('Pearl', (0.94, 0.92, 0.86)))

R = 0.4                       # the ball's radius; its centre stands at R
BAND = [(0.0, -0.035), (0.03, -0.035), (0.03, 0.035), (0.0, 0.035)]   # (out, across): a strap on the ball
TILT = math.radians(8)        # the crooked cross


def sphere_profile(r, n, z0):
    return [(r * math.sin(math.pi * k / n), z0 - r * math.cos(math.pi * k / n)) for k in range(n + 1)]


def build():
    bm = bmesh.new()
    lathe(bm, sphere_profile(R, 8, R), 14, lambda k, i: GOLD)
    # The band round the middle and the half band over the top.
    torus(bm, (0, 0, R), R, BAND, 20, lambda k, i: GOLD_DARK if i in (0, 2) else GOLD, plane='xy')
    path = [((0.0, R * math.cos(a), R + R * math.sin(a)), 1.0) for a in [math.pi * t / 12 for t in range(13)]]
    sweep(bm, path, [(-0.035, 0.0), (0.035, 0.0), (0.035, 0.03), (-0.035, 0.03)], lambda k, i: GOLD_DARK if i in (1, 3) else GOLD)
    # Stones round the middle band: red, blue, green and a pearl between each.
    mats = (RUBY, PEARL, SAPPHIRE, PEARL, EMERALD, PEARL)
    for n in range(12):
        a = 2 * math.pi * (n + 0.5) / 12
        gem = new_verts(bm, lambda b: lathe(b, [(0.0, 0.0), (0.045 if n % 2 == 0 else 0.03, 0.0), (0.03 if n % 2 == 0 else 0.022, 0.03), (0.0, 0.045)], 6,
                                             lambda k, i: mats[n % 6]))
        rotate(gem, math.pi / 2, (0, 1, 0))
        move(gem, (R + 0.025, 0, 0))
        rotate(gem, a, (0, 0, 1))
        move(gem, (0, 0, R))
    # And along the half band.
    for n, t in enumerate((2.5, 4.5, 7.5, 9.5)):
        a = math.pi * t / 12
        gem = new_verts(bm, lambda b: lathe(b, [(0.0, 0.0), (0.04, 0.0), (0.028, 0.03), (0.0, 0.042)], 6,
                                             lambda k, i: (SAPPHIRE, RUBY, RUBY, SAPPHIRE)[n]))
        rotate(gem, a - math.pi / 2, (1, 0, 0))
        move(gem, (0, (R + 0.025) * math.cos(a), R + (R + 0.025) * math.sin(a)))
    # The knop and the cross on top, a little crooked.
    top = 2 * R + 0.02
    lathe(bm, [(0.0, top - 0.04), (0.06, top - 0.03), (0.075, top + 0.02), (0.04, top + 0.06), (0.03, top + 0.09), (0.0, top + 0.09)], 8,
          lambda k, i: GOLD_DARK if k == 3 else GOLD)
    cross = new_verts(bm, lambda b: (box(b, (-0.03, -0.03, top + 0.08), (0.03, 0.03, top + 0.42), GOLD),
                                     box(b, (-0.13, -0.03, top + 0.25), (0.13, 0.03, top + 0.31), GOLD),
                                     lathe(b, [(0.0, -0.025), (0.04, -0.025), (0.03, -0.05), (0.0, -0.06)], 6,
                                           lambda k, i: RUBY, centre=(0, 0, top + 0.28), axis='y')))
    rotate(cross, TILT, (0, 1, 0), pivot=(0, 0, top + 0.08))
    return finish(bpy, bm, 'Orb', COLORS)


for o in list(bpy.data.objects):
    bpy.data.objects.remove(o)
orb = build()
export_model(orb, 'orb', os.path.join(ROOT, 'js', 'render', 'models', 'orb.js'), 'scripts/blender/orb.py')
