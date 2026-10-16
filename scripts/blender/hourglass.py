"""Low-poly hourglass of the alchemist of Prague: two pale blue glass bulbs between round
plates of dark wood, held by four turned posts, brass bands on the plates. The gold sand
has gathered at the top of the upper bulb, and a thread of it climbs the neck: here the
sand falls upwards.

  blender -b --factory-startup -P scripts/blender/hourglass.py

Writes js/render/models/hourglass.js.
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
from shapes import lathe, finish  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(HERE))
GLASS, GLASS_LIGHT, SAND, SAND_DARK, WOOD, WOOD_DARK, BRASS = range(7)
COLORS = (('Glass', (0.66, 0.8, 0.88)), ('GlassLight', (0.84, 0.92, 0.96)), ('Sand', (0.95, 0.76, 0.3)),
          ('SandDark', (0.75, 0.55, 0.18)), ('Wood', (0.35, 0.19, 0.09)), ('WoodDark', (0.22, 0.11, 0.05)),
          ('Brass', (0.86, 0.66, 0.3)))

GLASS_PROFILE = [(0.0, 0.08), (0.12, 0.09), (0.2, 0.16), (0.22, 0.25), (0.18, 0.36), (0.08, 0.44), (0.03, 0.5),
                 (0.08, 0.56), (0.18, 0.64), (0.22, 0.75), (0.2, 0.84), (0.12, 0.91), (0.0, 0.92)]
STREAM, SAND_FROM = 7, 10     # the band of the neck the sand climbs, and where the heap begins
POST = [(0.0, 0.08), (0.032, 0.08), (0.032, 0.14), (0.048, 0.19), (0.026, 0.28), (0.04, 0.5), (0.026, 0.72),
        (0.048, 0.81), (0.032, 0.86), (0.032, 0.92), (0.0, 0.92)]


def glass_mat(k, i):
    if k >= SAND_FROM:
        return SAND_DARK if k == SAND_FROM and i % 2 else SAND
    if k == STREAM and i % 3 == 0:
        return SAND
    return GLASS_LIGHT if i in (6, 7) else GLASS


def build():
    bm = bmesh.new()
    lathe(bm, GLASS_PROFILE, 12, glass_mat)
    for z0 in (0.0, 0.92):
        lathe(bm, [(0.0, z0), (0.3, z0), (0.31, z0 + 0.02), (0.31, z0 + 0.06), (0.3, z0 + 0.08), (0.0, z0 + 0.08)], 8,
              lambda k, i: BRASS if k in (2, 3) else (WOOD_DARK if k in (1, 5) else WOOD))
    for n in range(4):
        a = math.pi / 4 + n * math.pi / 2
        lathe(bm, POST, 6, lambda k, i: WOOD_DARK if k in (3, 7) else WOOD, centre=(0.25 * math.cos(a), 0.25 * math.sin(a), 0))
    return finish(bpy, bm, 'Hourglass', COLORS)


for o in list(bpy.data.objects):
    bpy.data.objects.remove(o)
hourglass = build()
export_model(hourglass, 'hourglass', os.path.join(ROOT, 'js', 'render', 'models', 'hourglass.js'), 'scripts/blender/hourglass.py')
