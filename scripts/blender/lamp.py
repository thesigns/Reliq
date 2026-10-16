"""Low-poly copper oil lamp from Alexandria: a turned body squeezed into an oval, standing
on a foot, with a lid and knob, a long tapering spout blackened at the wick, and a strap
handle curled at the back. Verdigris patches on the belly.

  blender -b --factory-startup -P scripts/blender/lamp.py

Writes js/render/models/lamp.js.
"""
import os
import sys

import bpy
import bmesh

sys.dont_write_bytecode = True

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from export_model import export_model  # noqa: E402
from shapes import lathe, sweep, circle, finish  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(HERE))
COPPER, DARK, PATINA, SOOT = 0, 1, 2, 3
COLORS = (('Copper', (0.76, 0.42, 0.22)), ('CopperDark', (0.5, 0.25, 0.13)),
          ('Patina', (0.3, 0.56, 0.46)), ('Soot', (0.07, 0.05, 0.04)))

SEGMENTS = 10
STRETCH = 1.45            # the round body pulled long, along x
BODY = [(0.0, 0.0), (0.17, 0.0), (0.19, 0.035), (0.15, 0.065), (0.26, 0.12), (0.31, 0.21),
        (0.26, 0.3), (0.14, 0.35), (0.13, 0.375), (0.0, 0.375)]
LID = [(0.0, 0.37), (0.13, 0.37), (0.12, 0.4), (0.07, 0.44), (0.03, 0.45), (0.045, 0.48), (0.035, 0.51), (0.0, 0.52)]
# Spout from inside the body out to the wick, and the handle at the back: (point, radius).
SPOUT = [((0.3, 0, 0.17), 0.09), ((0.48, 0, 0.19), 0.075), ((0.64, 0, 0.235), 0.058),
         ((0.78, 0, 0.29), 0.046), ((0.88, 0, 0.33), 0.038), ((0.94, 0, 0.355), 0.034)]
HANDLE = [((-0.34, 0, 0.28), (0.022, 0.05)), ((-0.5, 0, 0.34), (0.022, 0.05)), ((-0.61, 0, 0.29), (0.022, 0.048)),
          ((-0.63, 0, 0.19), (0.022, 0.046)), ((-0.55, 0, 0.12), (0.022, 0.044)), ((-0.4, 0, 0.12), (0.022, 0.042))]
PATCHES = {(5, 2), (5, 3), (6, 7)}    # (band, segment) of the belly green with verdigris


def build():
    bm = bmesh.new()

    def body_mat(k, i):
        if (k, i) in PATCHES:
            return PATINA
        return DARK if k <= 3 or k >= 8 else COPPER
    rings = lathe(bm, BODY, SEGMENTS, body_mat)
    for ring in rings:
        for v in ring:
            v.co.x *= STRETCH
    lathe(bm, LID, SEGMENTS, lambda k, i: DARK if k <= 1 else COPPER)
    last = len(SPOUT)
    sweep(bm, SPOUT, circle(8), lambda k, i: SOOT if k >= last else (DARK if k == last - 1 and i < 3 else COPPER))
    sweep(bm, HANDLE, [(-1, -1), (1, -1), (1, 1), (-1, 1)], lambda k, i: COPPER if i % 2 else DARK)
    return finish(bpy, bm, 'Lamp', COLORS)


for o in list(bpy.data.objects):
    bpy.data.objects.remove(o)
lamp = build()
export_model(lamp, 'lamp', os.path.join(ROOT, 'js', 'render', 'models', 'lamp.js'), 'scripts/blender/lamp.py')
