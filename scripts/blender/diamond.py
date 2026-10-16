"""Low-poly blue diamond of the maharaja: a brilliant cut (a flat table on top, a ring of
crown facets, the girdle and a pavilion down to a sharp point) in several blues, held by
four gold claws on a small gold foot.

  blender -b --factory-startup -P scripts/blender/diamond.py

Writes js/render/models/diamond.js.
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
from shapes import lathe, sweep, torus, circle, finish  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(HERE))
PALE, LIGHT, BLUE, DEEP, DARK, GOLD, GOLD_DARK = range(7)
COLORS = (('Pale', (0.78, 0.9, 1.0)), ('Light', (0.5, 0.72, 0.96)), ('Blue', (0.28, 0.5, 0.9)),
          ('Deep', (0.16, 0.32, 0.75)), ('Dark', (0.08, 0.16, 0.48)), ('Gold', (0.95, 0.74, 0.28)),
          ('GoldDark', (0.66, 0.44, 0.12)))

N = 8
LIFT = 0.12                       # the stone's point stands this high
# Rings of the cut: (radius, height, phase in segments).
LOWER = (0.3, LIFT + 0.2, 0.0)
GIRDLE_LO = (0.5, LIFT + 0.42, 0.5)
GIRDLE_HI = (0.5, LIFT + 0.46, 0.5)
STAR = (0.39, LIFT + 0.56, 0.0)
TABLE = (0.27, LIFT + 0.63, 0.5)


def ring(bm, r, z, phase):
    return [bm.verts.new((r * math.cos(2 * math.pi * (i + phase) / N), r * math.sin(2 * math.pi * (i + phase) / N), z)) for i in range(N)]


def tri(bm, a, b, c, mat):
    bm.faces.new((a, b, c)).material_index = mat


def build():
    bm = bmesh.new()
    culet = bm.verts.new((0, 0, LIFT))
    lo, p, g, s, t = (ring(bm, *x) for x in (LOWER, GIRDLE_LO, GIRDLE_HI, STAR, TABLE))
    for i in range(N):
        j = (i + 1) % N
        tri(bm, culet, lo[i], lo[j], DARK if i % 2 else DEEP)
        # Lower girdle facets: p[i] sits between lo[i] and lo[j].
        tri(bm, lo[i], p[i], lo[j], DEEP if i % 2 else BLUE)
        tri(bm, p[i - 1], p[i], lo[i], BLUE if i % 2 else DEEP)
        bm.faces.new((p[i], p[j], g[j], g[i])).material_index = LIGHT
        # Crown: s[j] sits between g[i] and g[j]; then the star facets up to the table.
        tri(bm, g[i], g[j], s[j], LIGHT if i % 2 else BLUE)
        tri(bm, s[i], g[i], s[j], PALE if i % 2 else LIGHT)
        tri(bm, s[i], s[j], t[i], BLUE if i % 3 == 0 else LIGHT)
        tri(bm, t[i - 1], s[i], t[i], PALE)
    bm.faces.new(t).material_index = PALE
    # The setting: a foot, and four claws up and over the girdle.
    lathe(bm, [(0.0, -0.1), (0.24, -0.1), (0.24, -0.06), (0.14, -0.03), (0.08, 0.03), (0.0, 0.05)], 10,
          lambda k, i: GOLD_DARK if k == 2 else GOLD)
    torus(bm, (0, 0, LIFT + 0.24), 0.33, [(-0.015, -0.015), (0.015, -0.015), (0.015, 0.015), (-0.015, 0.015)], 16,
          lambda k, i: GOLD if i % 2 else GOLD_DARK, plane='xy')
    for n in range(4):
        a = math.pi / 4 + n * math.pi / 2
        c, sn = math.cos(a), math.sin(a)
        pts = [(0.07, 0.02), (0.34, LIFT + 0.24), (0.52, LIFT + 0.42), (0.52, LIFT + 0.47), (0.45, LIFT + 0.52)]
        sweep(bm, [((r * c, r * sn, z), 0.022) for r, z in pts], circle(5), lambda k, i: GOLD if i % 2 else GOLD_DARK)
    return finish(bpy, bm, 'Diamond', COLORS)


for o in list(bpy.data.objects):
    bpy.data.objects.remove(o)
diamond = build()
export_model(diamond, 'diamond', os.path.join(ROOT, 'js', 'render', 'models', 'diamond.js'), 'scripts/blender/diamond.py')
