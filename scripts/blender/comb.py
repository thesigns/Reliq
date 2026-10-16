"""Low-poly wooden comb of a princess of Thebes: a board of dark acacia with a row of teeth,
a faience band across the spine and a reclining gazelle carved on top, one horn lost.

  blender -b --factory-startup -P scripts/blender/comb.py

Writes js/render/models/comb.js.
"""
import os
import sys

import bpy
import bmesh

sys.dont_write_bytecode = True

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from export_model import export_model  # noqa: E402
from shapes import slab, box, finish  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(HERE))
WOOD, CARVED, FAIENCE, EYE = 0, 1, 2, 3
COLORS = (('Wood', (0.42, 0.23, 0.11)), ('Carved', (0.33, 0.17, 0.08)),
          ('Faience', (0.15, 0.55, 0.57)), ('Eye', (0.07, 0.04, 0.02)))

THICK = 0.1
ROOT_Z = 0.42                 # where the teeth meet the spine
TEETH, TOOTH_W = 11, 0.056
LEFT, RIGHT = -0.44, 0.44
GAP = ((RIGHT - LEFT) - TEETH * TOOTH_W) / (TEETH - 1)
TAPER = 0.012                 # each tooth narrows this much on both sides towards its tip
TOP = 0.69

# The gazelle, lying on the spine and facing +x, traced from its outstretched foreleg round
# to its hind leg (right to left along the top of the comb). Its one horn sweeps back over
# the neck, the way Egyptian carvers drew gazelles and ibexes; the ear lies back.
GAZELLE = [
    (0.36, TOP), (0.36, 0.712), (0.23, 0.73), (0.19, 0.765),                  # foreleg, chest
    (0.21, 0.83), (0.24, 0.92), (0.29, 1.0),                                  # neck front
    (0.36, 1.025), (0.41, 1.055), (0.39, 1.085), (0.31, 1.115),              # muzzle, forehead
    (0.29, 1.14), (0.27, 1.23), (0.21, 1.31), (0.12, 1.355), (0.02, 1.335),  # horn, outer edge
    (0.07, 1.315), (0.165, 1.28), (0.22, 1.21), (0.245, 1.13),               # horn, inner edge
    (0.21, 1.115), (0.145, 1.12), (0.2, 1.088),                              # ear, lying back
    (0.205, 1.04), (0.16, 0.95), (0.08, 0.895),                              # nape, withers
    (-0.08, 0.875), (-0.23, 0.865), (-0.3, 0.83),                            # back, rump
    (-0.33, 0.85), (-0.34, 0.82), (-0.31, 0.775), (-0.29, 0.725), (-0.26, TOP),  # tail, haunch
]


def board():
    """The spine and the gazelle, counter-clockwise: along the bottom of the spine, up the
    right side, back along the top over the gazelle, and down the left side."""
    return ([(LEFT, ROOT_Z), (RIGHT, ROOT_Z), (RIGHT, TOP - 0.03), (RIGHT - 0.02, TOP)] + GAZELLE
            + [(LEFT + 0.02, TOP), (LEFT, TOP - 0.03)])


def tooth(i):
    """One tooth, narrowing to a blunt tip; it reaches a little into the spine."""
    x0 = LEFT + i * (TOOTH_W + GAP)
    x1 = x0 + TOOTH_W
    return [(x0, ROOT_Z + 0.02), (x0 + TAPER, 0.025), (x0 + TAPER + 0.01, 0), (x1 - TAPER - 0.01, 0), (x1 - TAPER, 0.025), (x1, ROOT_Z + 0.02)]


def build():
    bm = bmesh.new()
    slab(bm, board(), THICK, WOOD, bevel=0.012, bevel_mat=CARVED)
    for i in range(TEETH):
        slab(bm, tooth(i), THICK * 0.9, WOOD)
    # A band of blue faience across the spine, set into both faces.
    for y in (-THICK / 2 - 0.006, THICK / 2 - 0.006):
        box(bm, (LEFT + 0.05, y, 0.51), (RIGHT - 0.05, y + 0.012, 0.6), FAIENCE)
    # The gazelle's eye, on both sides.
    for y in (-THICK / 2 - 0.005, THICK / 2 - 0.007):
        box(bm, (0.315, y, 1.06), (0.34, y + 0.012, 1.082), EYE)
    return finish(bpy, bm, 'Comb', COLORS)


for o in list(bpy.data.objects):
    bpy.data.objects.remove(o)
comb = build()
export_model(comb, 'comb', os.path.join(ROOT, 'js', 'render', 'models', 'comb.js'), 'scripts/blender/comb.py')
