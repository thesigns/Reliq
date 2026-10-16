"""Low-poly drinking horn of Jarl Hrafn: a curved cream horn, banded with age, its mouth
bound in a silver rim, its tip capped in silver worked into a raven's head, standing on two
silver legs.

  blender -b --factory-startup -P scripts/blender/horn.py

Writes js/render/models/horn.js.
"""
import os
import sys

import bpy
import bmesh
from mathutils import Vector

sys.dont_write_bytecode = True

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from export_model import export_model  # noqa: E402
from shapes import lathe, sweep, circle, new_verts, finish  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(HERE))
HORN, HORN_DARK, SILVER, SILVER_DARK, INSIDE = range(5)
COLORS = (('Horn', (0.9, 0.84, 0.68)), ('HornDark', (0.72, 0.62, 0.45)), ('Silver', (0.84, 0.86, 0.88)),
          ('SilverDark', (0.5, 0.52, 0.56)), ('Inside', (0.2, 0.14, 0.09)))

# The horn's centre line from the mouth to the tip, with its radius.
LINE = [((-0.5, 0, 0.44), 0.15), ((-0.485, 0, 0.415), 0.15), ((-0.45, 0, 0.36), 0.14), ((-0.36, 0, 0.26), 0.125),
        ((-0.22, 0, 0.17), 0.105), ((-0.05, 0, 0.12), 0.085), ((0.12, 0, 0.13), 0.067), ((0.27, 0, 0.19), 0.05),
        ((0.38, 0, 0.29), 0.037), ((0.44, 0, 0.4), 0.028), ((0.455, 0, 0.45), 0.026)]
RIM, FERRULE = 1, len(LINE) - 1    # the silver bands: at the mouth, and the tip's cap
GROUND = -0.12                     # where the legs stand


def horn_mat(k, i):
    if k == 0:
        return INSIDE                  # the open mouth
    if k == RIM or k >= FERRULE:
        return SILVER
    return HORN_DARK if k in (3, 6) else HORN


def build():
    bm = bmesh.new()
    sweep(bm, LINE, circle(10), horn_mat)
    # The raven's head on the tip, looking on along the horn, its beak darker.
    tip, before = Vector(LINE[-1][0]), Vector(LINE[-2][0])
    head = new_verts(bm, lambda b: lathe(b, [(0.0, -0.02), (0.045, -0.02), (0.075, 0.04), (0.068, 0.1), (0.035, 0.135), (0.016, 0.2), (0.0, 0.25)], 8,
                                          lambda k, i: SILVER_DARK if k >= 5 else SILVER))
    q = (tip - before).normalized().to_track_quat('Z', 'Y')
    for v in head:
        v.co = q @ v.co + tip
    # Two legs, each from the horn's underside down to a little round foot.
    for (x, y, z), r in (LINE[4], LINE[7]):
        top = z - r * 0.7
        sweep(bm, [((x, 0, top), 0.018), ((x, 0, GROUND + 0.03), 0.016)], circle(6), lambda k, i: SILVER_DARK if i % 2 else SILVER)
        lathe(bm, [(0.0, GROUND), (0.045, GROUND), (0.04, GROUND + 0.025), (0.0, GROUND + 0.035)], 8,
              lambda k, i: SILVER_DARK, centre=(x, 0, 0))
    return finish(bpy, bm, 'Horn', COLORS)


for o in list(bpy.data.objects):
    bpy.data.objects.remove(o)
horn = build()
export_model(horn, 'horn', os.path.join(ROOT, 'js', 'render', 'models', 'horn.js'), 'scripts/blender/horn.py')
