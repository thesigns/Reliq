"""Low-poly poet's inkwell: an eight-sided silver well on four ball feet, its domed lid
thrown back on the hinge to show the ink, the colour of the night sky, and a long white
quill standing in it.

  blender -b --factory-startup -P scripts/blender/inkwell.py

Writes js/render/models/inkwell.js.
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
from shapes import lathe, slab, sweep, circle, rotate, move, new_verts, finish  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(HERE))
SILVER, SILVER_DARK, INK, FEATHER, FEATHER_GREY, NIB = range(6)
COLORS = (('Silver', (0.84, 0.86, 0.88)), ('SilverDark', (0.5, 0.52, 0.56)), ('Ink', (0.08, 0.1, 0.27)),
          ('Feather', (0.95, 0.94, 0.9)), ('FeatherGrey', (0.66, 0.66, 0.68)), ('Nib', (0.15, 0.13, 0.12)))

# Outside from the base up to the rim, then down inside to the ink.
WELL = [(0.0, 0.0), (0.34, 0.0), (0.34, 0.05), (0.3, 0.07), (0.36, 0.12), (0.36, 0.27), (0.3, 0.32),
        (0.2, 0.37), (0.15, 0.4), (0.17, 0.43), (0.12, 0.43), (0.12, 0.38), (0.0, 0.38)]
LID = [(0.0, 0.43), (0.18, 0.43), (0.18, 0.46), (0.12, 0.52), (0.04, 0.55), (0.05, 0.59), (0.0, 0.62)]
HINGE = (0.0, 0.18, 0.44)
LID_OPEN = math.radians(-105)
QUILL_TILT = math.radians(24)       # leaning to the right
VANE = [(0.0, 0.22), (0.05, 0.32), (0.085, 0.5), (0.09, 0.68), (0.06, 0.83), (0.015, 0.93),
        (-0.035, 0.85), (-0.055, 0.65), (-0.05, 0.45), (-0.025, 0.3)]


def build():
    bm = bmesh.new()
    lathe(bm, WELL, 8, lambda k, i: INK if k >= 12 else (SILVER_DARK if k in (3, 6, 9, 10, 11) else SILVER), phase=0.5)
    for i in range(4):
        a = math.pi / 4 + i * math.pi / 2
        lathe(bm, [(0.0, -0.09), (0.04, -0.085), (0.055, -0.05), (0.04, -0.012), (0.0, 0.002)], 6, lambda k, j: SILVER_DARK,
              centre=(0.27 * math.cos(a), 0.27 * math.sin(a), 0))
    # The lid, thrown back on its hinge.
    lid = new_verts(bm, lambda b: lathe(b, LID, 8, lambda k, i: SILVER_DARK if k in (1, 2) else SILVER))
    rotate(lid, LID_OPEN, (1, 0, 0), pivot=HINGE)
    lathe(bm, [(0.0, -0.07), (0.025, -0.07), (0.025, 0.07), (0.0, 0.07)], 6, lambda k, i: SILVER_DARK, centre=HINGE, axis='x')
    # The quill: a shaft with the vane along it, stood in the ink and leant over.
    quill = new_verts(bm, lambda b: (
        sweep(b, [((0, 0, -0.05), 0.012), ((0, 0, 0.2), 0.014), ((0, 0, 0.95), 0.006)], circle(5), lambda k, i: NIB if k <= 1 else FEATHER),
        slab(b, VANE, 0.014, FEATHER, bevel=0.004, bevel_mat=FEATHER_GREY)))
    rotate(quill, QUILL_TILT, (0, 1, 0))
    move(quill, (0.0, 0.0, 0.34))
    return finish(bpy, bm, 'Inkwell', COLORS)


for o in list(bpy.data.objects):
    bpy.data.objects.remove(o)
inkwell = build()
export_model(inkwell, 'inkwell', os.path.join(ROOT, 'js', 'render', 'models', 'inkwell.js'), 'scripts/blender/inkwell.py')
