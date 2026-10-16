"""Low-poly abacus of the Canton merchant: a Chinese suanpan with a dark wooden frame, a
beam across, and on each rod two beads above the beam and five below, cut as six-sided
double cones. Beads pushed to the beam spell a number; one bead is jade.

  blender -b --factory-startup -P scripts/blender/abacus.py

Writes js/render/models/abacus.js.
"""
import os
import sys

import bpy
import bmesh

sys.dont_write_bytecode = True

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from export_model import export_model  # noqa: E402
from shapes import box, lathe, finish  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(HERE))
FRAME, ROD, BEAD, BEAD_DARK, JADE, BRASS = 0, 1, 2, 3, 4, 5
COLORS = (('Frame', (0.34, 0.19, 0.09)), ('Rod', (0.78, 0.66, 0.40)), ('Bead', (0.66, 0.13, 0.08)),
          ('BeadDark', (0.46, 0.08, 0.05)), ('Jade', (0.25, 0.58, 0.36)), ('Brass', (0.85, 0.66, 0.30)))

W, H, D = 1.0, 1.0, 0.13           # outer frame
BAR = 0.075                        # frame thickness
BEAM = (0.66, 0.725)               # the beam across, bottom and top
RODS = 5
BEAD_R, BEAD_H = 0.072, 0.04       # a bead's radius at its waist, half its height
# The number on the abacus, one digit per rod: upper beads count five, lower beads one.
DIGITS = [2, 0, 7, 9, 3]
JADE_AT = (3, 'lower', 4)          # rod, deck, bead index from the beam: the jade bead


def bead(bm, x, z, mat):
    """A double cone round the rod, its waist at height z; the upper half catches the light."""
    def mat_of(k, i):
        return mat if k == 1 else (BEAD_DARK if mat == BEAD else mat)
    lathe(bm, [(0.0, BEAD_H), (BEAD_R, 0.0), (0.0, -BEAD_H)], 6, mat_of, centre=(x, 0, z), phase=0.0)


def build():
    bm = bmesh.new()
    x0, x1 = -W / 2, W / 2
    # The frame: two rails and two stiles, and the beam, all through the full depth.
    box(bm, (x0, -D / 2, 0), (x1, D / 2, BAR), FRAME)
    box(bm, (x0, -D / 2, H - BAR), (x1, D / 2, H), FRAME)
    box(bm, (x0, -D / 2, BAR), (x0 + BAR, D / 2, H - BAR), FRAME)
    box(bm, (x1 - BAR, -D / 2, BAR), (x1, D / 2, H - BAR), FRAME)
    box(bm, (x0 + BAR, -D / 2 + 0.01, BEAM[0]), (x1 - BAR, D / 2 - 0.01, BEAM[1]), FRAME)
    # Brass caps on the corners of the front.
    c = 0.05
    for cx in (x0, x1 - c):
        for cz in (0, H - c):
            box(bm, (cx - 0.004, -D / 2 - 0.006, cz - 0.004), (cx + c + 0.004, -D / 2 + 0.002, cz + c + 0.004), BRASS)

    inner = (W - 2 * BAR)
    step = inner / RODS
    for r in range(RODS):
        x = x0 + BAR + step * (r + 0.5)
        box(bm, (x - 0.008, -0.008, BAR), (x + 0.008, 0.008, H - BAR), ROD)
        five, ones = divmod(DIGITS[r], 5)
        # Upper deck: two beads, the counted one lowered against the beam.
        for k in range(2):
            counted = k < five
            z = BEAM[1] + BEAD_H + 2 * BEAD_H * k if counted else H - BAR - BEAD_H - 2 * BEAD_H * k
            bead(bm, x, z, JADE if (r, 'upper', k) == JADE_AT else BEAD)
        # Lower deck: five beads, the counted ones raised against the beam.
        for k in range(5):
            counted = k < ones
            z = BEAM[0] - BEAD_H - 2 * BEAD_H * k if counted else BAR + BEAD_H + 2 * BEAD_H * (4 - k)
            bead(bm, x, z, JADE if (r, 'lower', k) == JADE_AT else BEAD)
    return finish(bpy, bm, 'Abacus', COLORS)


for o in list(bpy.data.objects):
    bpy.data.objects.remove(o)
abacus = build()
export_model(abacus, 'abacus', os.path.join(ROOT, 'js', 'render', 'models', 'abacus.js'), 'scripts/blender/abacus.py')
