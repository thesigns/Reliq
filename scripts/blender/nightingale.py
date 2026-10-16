"""Low-poly mechanical nightingale of the emperor: a gold cage, its bars rising from a round
base and bending over into a dome with a hanging ring on top, and inside, on a perch, a
little bird of tin with ruby eyes.

  blender -b --factory-startup -P scripts/blender/nightingale.py

Writes js/render/models/nightingale.js.
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
from shapes import lathe, slab, sweep, torus, box, circle, new_verts, finish  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(HERE))
GOLD, GOLD_DARK, TIN, TIN_DARK, RUBY, BEAK = range(6)
COLORS = (('Gold', (0.95, 0.74, 0.28)), ('GoldDark', (0.64, 0.43, 0.12)), ('Tin', (0.78, 0.8, 0.82)),
          ('TinDark', (0.48, 0.5, 0.54)), ('Ruby', (0.8, 0.06, 0.1)), ('Beak', (0.9, 0.62, 0.22)))

R = 0.36                      # the cage's radius
WALL = (0.1, 0.62)            # the straight bars run between these heights
DOME = 0.3                    # how high the dome rises above the wall
BARS = 10
PERCH = 0.26                  # height of the perch
BIRD = 1.35                   # the bird's size against the cage
SQUARE = [(-0.01, -0.01), (0.01, -0.01), (0.01, 0.01), (-0.01, 0.01)]


def bird(bm, cx, cz):
    """The bird, facing -x, its body centred at (cx, 0, cz)."""
    lathe(bm, [(0.0, cx + 0.17), (0.045, cx + 0.13), (0.08, cx + 0.05), (0.085, cx - 0.02), (0.065, cx - 0.08), (0.0, cx - 0.1)], 8,
          lambda k, i: TIN_DARK if i in (0, 7) else TIN, centre=(0, 0, cz), axis='x')
    hx, hz = cx - 0.11, cz + 0.07
    lathe(bm, [(0.0, hz - 0.06), (0.045, hz - 0.045), (0.06, hz), (0.045, hz + 0.045), (0.0, hz + 0.06)], 8,
          lambda k, i: TIN, centre=(hx, 0, 0))
    lathe(bm, [(0.0, hx - 0.04), (0.02, hx - 0.05), (0.0, hx - 0.12)], 6, lambda k, i: BEAK, centre=(0, 0, hz - 0.005), axis='x')
    for y in (-0.05, 0.05):
        box(bm, (hx - 0.03, y - 0.012, hz + 0.0), (hx - 0.005, y + 0.012, hz + 0.025), RUBY)
    # Tail and wings: thin plates of tin, the wings riveted on with a darker edge.
    slab(bm, [(cx + 0.12, cz + 0.02), (cx + 0.22, cz + 0.09), (cx + 0.25, cz + 0.04), (cx + 0.14, cz - 0.04)], 0.035, TIN_DARK)
    for y in (-0.08, 0.08):
        slab(bm, [(cx - 0.06, cz + 0.04), (cx + 0.17, cz + 0.03), (cx + 0.22, cz - 0.0), (cx - 0.02, cz - 0.04)], 0.012, TIN,
             bevel=0.004, bevel_mat=TIN_DARK, y=y)
    for x in (cx - 0.02, cx + 0.04):
        sweep(bm, [((x, 0, cz - 0.07), 0.01), ((x, 0, PERCH + 0.012), 0.008)], circle(4), lambda k, i: TIN_DARK)


def build():
    bm = bmesh.new()
    # The base and the rings that hold the bars.
    lathe(bm, [(0.0, 0.0), (R + 0.06, 0.0), (R + 0.06, 0.04), (R + 0.02, 0.07), (R + 0.02, WALL[0]), (0.0, WALL[0])], 16,
          lambda k, i: GOLD_DARK if k in (2, 3, 5) else GOLD)
    torus(bm, (0, 0, WALL[1] - 0.015), R, [(-0.018, 0.0), (0.018, 0.0), (0.018, 0.03), (-0.018, 0.03)], 16,
          lambda k, i: GOLD_DARK if i == 1 else GOLD, plane='xy')
    # The bars: up the wall, then bending over into the dome.
    for n in range(BARS):
        a = 2 * math.pi * (n + 0.5) / BARS
        c, s = math.cos(a), math.sin(a)
        path = [((R * c, R * s, WALL[0]), 1.0), ((R * c, R * s, WALL[1]), 1.0)]
        for t in (25, 50, 70, 84):
            u = math.radians(t)
            path.append(((R * math.cos(u) * c, R * math.cos(u) * s, WALL[1] + DOME * math.sin(u)), 1.0))
        sweep(bm, path, SQUARE, lambda k, i: GOLD if i % 2 else GOLD_DARK)
    top = WALL[1] + DOME
    lathe(bm, [(0.0, top - 0.04), (0.07, top - 0.02), (0.06, top + 0.03), (0.0, top + 0.05)], 8, lambda k, i: GOLD)
    torus(bm, (0, 0, top + 0.12), 0.07, SQUARE, 12, lambda k, i: GOLD if i % 2 else GOLD_DARK)
    # The perch across the cage, and the bird on it.
    sweep(bm, [((-R, 0, PERCH), 0.016), ((R, 0, PERCH), 0.016)], circle(6), lambda k, i: GOLD_DARK)
    # The bird is modelled small and scaled up about the point where it grips the perch.
    grip = (0.03, 0, PERCH)
    for v in new_verts(bm, lambda b: bird(b, 0.02, PERCH + 0.12)):
        v.co.x = grip[0] + (v.co.x - grip[0]) * BIRD
        v.co.y *= BIRD
        v.co.z = grip[2] + (v.co.z - grip[2]) * BIRD
    return finish(bpy, bm, 'Nightingale', COLORS)


for o in list(bpy.data.objects):
    bpy.data.objects.remove(o)
nightingale = build()
export_model(nightingale, 'nightingale', os.path.join(ROOT, 'js', 'render', 'models', 'nightingale.js'), 'scripts/blender/nightingale.py')
