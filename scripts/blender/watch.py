"""Low-poly captain's pocket watch: a silver case, its lid swung open on the hinge, a white
dial with black hour marks and hands stopped at one hour, the crown and bow on top, and a
short run of chain hanging from the bow.

  blender -b --factory-startup -P scripts/blender/watch.py

Writes js/render/models/watch.js.
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
from shapes import lathe, torus, face_toward, rotate, move, new_verts, finish  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(HERE))
SILVER, SILVER_DARK, WHITE, BLACK, ENGRAVED = range(5)
COLORS = (('Silver', (0.84, 0.86, 0.88)), ('SilverDark', (0.48, 0.5, 0.54)), ('Dial', (0.95, 0.93, 0.86)),
          ('Black', (0.06, 0.06, 0.07)), ('Engraved', (0.64, 0.66, 0.7)))

R = 0.4                         # the case's radius; it faces -y
FRONT = -0.07                   # y of the bezel's front
SEG = 16
LID_OPEN = math.radians(115)    # how far the lid has swung about its hinge
HOURS = 10, 50                  # the hands: hour mark and minute
CHAIN = (0, -20, -45, -70, -85, -95)  # the direction of each link of chain, from the bow
LINK_STEP = 0.1                 # from one link to the next


DIAL = -0.045                   # y of the dial, sunk behind the bezel


def case(b):
    """A shallow silver drum, round about the y axis; its front closes in the white dial,
    sunk inside the bezel."""
    return lathe(b, [(0.0, 0.07), (0.3, 0.075), (R, 0.04), (R, -0.04), (R - 0.02, FRONT), (R - 0.06, FRONT), (R - 0.06, DIAL), (0.0, DIAL)], SEG,
                 lambda k, i: WHITE if k == 7 else (SILVER_DARK if k in (3, 4, 6) else SILVER), axis='y')


def hand(bm, length, width, minute, y):
    a = math.pi / 2 - 2 * math.pi * minute / 60
    c, s = math.cos(a), math.sin(a)
    pts = [(-0.04 * c - width * s, -0.04 * s + width * c), (length * c, length * s), (-0.04 * c + width * s, -0.04 * s - width * c)]
    face_toward(bm, [bm.verts.new((x, y, z)) for x, z in pts], (0, -1, 0), BLACK)


def build():
    bm = bmesh.new()
    case(bm)
    # The hour marks and hands, painted just in front of the dial.
    y = DIAL - 0.002
    for h in range(12):
        a = 2 * math.pi * h / 12
        c, s = math.cos(a), math.sin(a)
        r0, r1, w = (0.22, 0.29, 0.022) if h % 3 == 0 else (0.25, 0.29, 0.012)
        pts = [(r0 * c - w * s, r0 * s + w * c), (r1 * c - w * s, r1 * s + w * c), (r1 * c + w * s, r1 * s - w * c), (r0 * c + w * s, r0 * s - w * c)]
        face_toward(bm, [bm.verts.new((x, y, z)) for x, z in pts], (0, -1, 0), BLACK)
    hour, minute = HOURS
    hand(bm, 0.17, 0.02, hour * 5 + minute / 12, y - 0.003)
    hand(bm, 0.26, 0.014, minute, y - 0.005)
    lathe(bm, [(0.0, y - 0.012), (0.025, y - 0.012), (0.025, y), (0.0, y)], 6, lambda k, i: BLACK, axis='y')
    # The crown, the pendant and the bow on top.
    lathe(bm, [(0.0, R - 0.02), (0.05, R - 0.02), (0.05, R + 0.04), (0.07, R + 0.05), (0.07, R + 0.1), (0.0, R + 0.11)], 8,
          lambda k, i: SILVER_DARK if k == 4 and i % 2 else SILVER)
    torus(bm, (0, 0, R + 0.2), 0.1, [(-0.016, -0.016), (0.016, -0.016), (0.016, 0.016), (-0.016, 0.016)], 14,
          lambda k, i: SILVER if i % 2 else SILVER_DARK)
    # Chain: oval links hooked one into the next, off the bow and down the right, each
    # turned a quarter about its length from the last.
    x, z = 0.1, R + 0.2
    for n, deg in enumerate(CHAIN):
        a = math.radians(deg)
        x, z = x + LINK_STEP * math.cos(a) * (0.6 if n == 0 else 1), z + LINK_STEP * math.sin(a) * (0.6 if n == 0 else 1)
        link = new_verts(bm, lambda b: torus(b, (0, 0, 0), 0.045, [(-0.011, -0.011), (0.011, -0.011), (0.011, 0.011), (-0.011, 0.011)], 8,
                                             lambda k, i: SILVER if i % 2 else SILVER_DARK))
        for v in link:
            v.co.x *= 1.5
        if n % 2:
            rotate(link, math.pi / 2, (1, 0, 0))
        rotate(link, -a, (0, 1, 0))
        move(link, (x, 0, z))
    # The lid: a second drum swung open on its hinge at the left, the inside engraved.
    lid = new_verts(bm, lambda b: lathe(b, [(0.0, -0.07), (R - 0.07, -0.075), (R, -0.09), (R, -0.12), (0.3, -0.15), (0.0, -0.155)], SEG,
                                         lambda k, i: ENGRAVED if k <= 1 else (SILVER_DARK if k == 3 else SILVER), axis='y'))
    rotate(lid, -LID_OPEN, (0, 0, 1), pivot=(-R, -0.08, 0))
    lathe(bm, [(0.0, -0.1), (0.03, -0.1), (0.03, 0.1), (0.0, 0.1)], 6, lambda k, i: SILVER_DARK, centre=(-R - 0.01, -0.08, 0))
    # The painted marks and hands are single faces: orient everything else, leave them be.
    marks = {f for f in bm.faces if f.material_index == BLACK and len(f.verts) <= 4 and abs(f.normal.y) > 0.99}
    bmesh.ops.recalc_face_normals(bm, faces=[f for f in bm.faces if f not in marks])
    return finish(bpy, bm, 'Watch', COLORS, recalc=False)


for o in list(bpy.data.objects):
    bpy.data.objects.remove(o)
watch = build()
export_model(watch, 'watch', os.path.join(ROOT, 'js', 'render', 'models', 'watch.js'), 'scripts/blender/watch.py')
