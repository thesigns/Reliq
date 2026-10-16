"""Low-poly crown of the forgotten queen: a gold band set with red and green stones, eight
tall fleurs-de-lis standing round it, and a dome of dark red velvet inside. One of the
rubies is paler: glass, swapped in her lifetime.

  blender -b --factory-startup -P scripts/blender/crown.py

Writes js/render/models/crown.js.
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
from shapes import lathe, slab, torus, rotate, move, new_verts, finish  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(HERE))
GOLD, GOLD_DARK, RUBY, EMERALD, GLASS, VELVET, VELVET_DARK = range(7)
COLORS = (('Gold', (0.95, 0.74, 0.28)), ('GoldDark', (0.66, 0.44, 0.12)), ('Ruby', (0.75, 0.06, 0.1)),
          ('Emerald', (0.08, 0.55, 0.3)), ('Glass', (0.88, 0.42, 0.45)), ('Velvet', (0.45, 0.06, 0.1)),
          ('VelvetDark', (0.3, 0.03, 0.06)))

R, BAND_H = 0.42, 0.22        # the band's radius and height
LILIES = 8
GLASS_AT = 5                  # which ruby is glass
LILY = [(-0.075, 0.0), (0.075, 0.0), (0.075, 0.05), (0.115, 0.1), (0.105, 0.155), (0.065, 0.125), (0.035, 0.145),
        (0.04, 0.21), (0.0, 0.31), (-0.04, 0.21), (-0.035, 0.145), (-0.065, 0.125), (-0.105, 0.155), (-0.115, 0.1),
        (-0.075, 0.05)]


def place(verts, angle, z):
    """Takes parts built facing -y at the origin out to the band at `angle`."""
    move(verts, (0, -R, z))
    rotate(verts, angle, (0, 0, 1))


def build():
    bm = bmesh.new()
    torus(bm, (0, 0, 0), R, [(-0.025, 0.0), (0.025, 0.0), (0.025, BAND_H), (-0.025, BAND_H)], 24,
          lambda k, i: GOLD_DARK if i in (0, 2) else GOLD, plane='xy')
    # Raised rims along the band's top and bottom edges.
    for z in (0.0, BAND_H - 0.03):
        torus(bm, (0, 0, z), R + 0.02, [(-0.015, 0.0), (0.015, 0.0), (0.015, 0.03), (-0.015, 0.03)], 24,
              lambda k, i: GOLD_DARK if i == 1 else GOLD, plane='xy')
    # The velvet cap inside.
    lathe(bm, [(0.0, 0.03), (R - 0.03, 0.03), (R - 0.03, 0.16), (0.33, 0.3), (0.2, 0.4), (0.0, 0.43)], 16,
          lambda k, i: VELVET_DARK if i % 2 else VELVET)
    lathe(bm, [(0.0, 0.42), (0.04, 0.42), (0.05, 0.46), (0.0, 0.5)], 6, lambda k, i: GOLD, centre=(0, 0, 0))
    for n in range(LILIES):
        angle = 2 * math.pi * n / LILIES
        lily = new_verts(bm, lambda b: slab(b, LILY, 0.035, GOLD))
        place(lily, angle, BAND_H - 0.01)
        # A stone under each lily, red and green by turns, and one between each pair.
        for at, size in ((0.0, 0.05), (math.pi / LILIES, 0.035)):
            mat = (EMERALD if n % 2 else (GLASS if n == GLASS_AT else RUBY)) if at == 0 else (RUBY if n % 2 else EMERALD)
            gem = new_verts(bm, lambda b: lathe(b, [(0.0, 0.0), (size, 0.0), (size * 0.8, size * 0.5), (0.0, size * 0.7)], 6,
                                                 lambda k, i: mat))
            rotate(gem, math.pi / 2, (1, 0, 0))
            move(gem, (0, -0.02, 0))
            place(gem, angle + at, BAND_H / 2)
    return finish(bpy, bm, 'Crown', COLORS)


for o in list(bpy.data.objects):
    bpy.data.objects.remove(o)
crown = build()
export_model(crown, 'crown', os.path.join(ROOT, 'js', 'render', 'models', 'crown.js'), 'scripts/blender/crown.py')
