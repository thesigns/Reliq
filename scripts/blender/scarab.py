"""Low-poly heart scarab of the pharaoh, stood up like a pectoral: an oval gold beetle (head, thorax and wing cases,
split down the back), spread wings of blue lapis edged in gold, and six short legs.

  blender -b --factory-startup -P scripts/blender/scarab.py

Writes js/render/models/scarab.js.
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
from shapes import lathe, slab, sweep, circle, rotate, move, new_verts, signed_area, finish  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(HERE))
GOLD, GOLD_DARK, LAPIS, LAPIS_DARK = range(4)
COLORS = (('Gold', (0.95, 0.74, 0.28)), ('GoldDark', (0.62, 0.42, 0.12)), ('Lapis', (0.12, 0.25, 0.68)),
          ('LapisDark', (0.07, 0.14, 0.42)))

SEG = 10
SEAM = SEG // 2 - 1         # the face running along the top of the back
FLAT = 0.55                 # the round body pressed flat
LIFT = 0.15                 # height of the body's middle
# Profiles along y, the head at -y: (radius, y).
ABDOMEN = [(0.0, 0.42), (0.13, 0.39), (0.2, 0.29), (0.22, 0.14), (0.2, 0.03), (0.0, 0.01)]
THORAX = [(0.0, 0.0), (0.17, -0.01), (0.19, -0.08), (0.15, -0.16), (0.0, -0.17)]
HEAD = [(0.0, -0.165), (0.1, -0.175), (0.115, -0.22), (0.075, -0.27), (0.0, -0.285)]
# The right wing seen from above (x, y): leading edge out from the shoulder, round the tip,
# and back along the trailing edge.
WING = [(0.12, -0.08), (0.3, -0.16), (0.5, -0.16), (0.64, -0.09), (0.67, 0.0), (0.56, 0.1), (0.4, 0.17),
        (0.24, 0.22), (0.13, 0.15)]
# Gold veins between the feathers, from the shoulder out to the wing's edge.
VEINS = [((0.15, 0.0), (0.62, -0.06)), ((0.15, 0.03), (0.6, 0.06)), ((0.15, 0.06), (0.44, 0.15))]
LEGS = [(-0.1, -0.28, -0.2), (0.06, -0.3, 0.06), (0.22, -0.27, 0.32)]   # (y at body, out x, y at foot)


def body(bm, profile, mat_of):
    rings = lathe(bm, profile, SEG, mat_of, axis='y')
    for ring in rings:
        for v in ring:
            v.co.z = v.co.z * FLAT + LIFT


def build():
    bm = bmesh.new()
    body(bm, ABDOMEN, lambda k, i: GOLD_DARK if i == SEAM or k == len(ABDOMEN) - 1 else GOLD)
    body(bm, THORAX, lambda k, i: GOLD)
    body(bm, HEAD, lambda k, i: GOLD_DARK if k == 1 else GOLD)
    # Wings: flat lapis boards edged in gold, raised a little at the tips.
    for side in (1, -1):
        outline = [(side * x, -y) for x, y in WING]
        if signed_area(outline) < 0:
            outline.reverse()
        wing = new_verts(bm, lambda b: slab(b, outline, 0.03, LAPIS, bevel=0.018, bevel_mat=GOLD))
        for (x0, y0), (x1, y1) in VEINS:
            dx, dy = x1 - x0, y1 - y0
            w = 0.009 / math.hypot(dx, dy)
            vein = [(side * (x0 + dy * w), -(y0 - dx * w)), (side * (x1 + dy * w), -(y1 - dx * w)),
                    (side * (x1 - dy * w), -(y1 + dx * w)), (side * (x0 - dy * w), -(y0 + dx * w))]
            if signed_area(vein) < 0:
                vein.reverse()
            wing += new_verts(bm, lambda b: slab(b, vein, 0.006, GOLD, y=0.017))
        rotate(wing, math.pi / 2, (1, 0, 0))
        rotate(wing, -side * math.radians(10), (0, 1, 0), pivot=(side * 0.12, 0, 0))
        move(wing, (0, 0, LIFT + 0.02))
    # Six legs reaching out and down.
    for y0, out, y1 in LEGS:
        for side in (1, -1):
            sweep(bm, [((side * 0.12, y0, LIFT - 0.04), 0.018), ((side * (out - 0.08), (y0 + y1) / 2, 0.06), 0.016),
                       ((side * out, y1, 0.0), 0.013)], circle(5), lambda k, i: GOLD_DARK)
    # Stood up like a pectoral, head up and back to the viewer, so the wings show whole.
    rotate(bm.verts, -math.pi / 2, (1, 0, 0))
    rotate(bm.verts, math.pi, (0, 0, 1))
    return finish(bpy, bm, 'Scarab', COLORS)


for o in list(bpy.data.objects):
    bpy.data.objects.remove(o)
scarab = build()
export_model(scarab, 'scarab', os.path.join(ROOT, 'js', 'render', 'models', 'scarab.js'), 'scripts/blender/scarab.py')
