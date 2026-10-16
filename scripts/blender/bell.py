"""Low-poly cow bell of the stubbornest cow in Tyrol: a flared copper bell, dark inside with
its clapper, a loop on the crown, and the wide leather collar it hangs from, with a brass
buckle and embroidered edelweiss.

  blender -b --factory-startup -P scripts/blender/bell.py

Writes js/render/models/bell.js.
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
from shapes import lathe, sweep, box, circle, face_toward, finish  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(HERE))
COPPER, DARK, INSIDE, LEATHER, LEATHER_DARK, BRASS, WHITE, YELLOW = range(8)
COLORS = (('Copper', (0.78, 0.44, 0.22)), ('CopperDark', (0.52, 0.27, 0.13)), ('Inside', (0.16, 0.08, 0.04)),
          ('Leather', (0.45, 0.25, 0.13)), ('LeatherDark', (0.3, 0.15, 0.07)), ('Brass', (0.88, 0.68, 0.3)),
          ('White', (0.93, 0.92, 0.86)), ('Yellow', (0.92, 0.75, 0.25)))

SEGMENTS = 10
# Outside from the crown down to the lip, then up the inside.
BELL = [(0.0, 0.8), (0.1, 0.8), (0.16, 0.76), (0.2, 0.62), (0.23, 0.42), (0.29, 0.2), (0.36, 0.055),
        (0.37, 0.0), (0.33, 0.0), (0.26, 0.17), (0.2, 0.42), (0.16, 0.65), (0.0, 0.72)]
OUTSIDE_END, LIP_END = 6, 8        # bands up to here are the outside, then the lip
COLLAR_R, COLLAR_Z = 0.34, 1.2     # the collar: a loop of strap seen flat from the front
STRAP_W, STRAP_T = 0.07, 0.016     # half its width (in the loop's plane, facing the viewer), half its thickness


def edelweiss(bm, x, z, y, size):
    """A white star of a flower with a yellow heart, stitched on the strap's face."""
    n = (0, -1, 0)
    pts = []
    for i in range(12):
        a = math.pi * i / 6
        r = size if i % 2 == 0 else size * 0.42
        pts.append(bm.verts.new((x + r * math.cos(a), y, z + r * math.sin(a))))
    face_toward(bm, pts, n, WHITE)
    heart = [bm.verts.new((x + size * 0.28 * math.cos(math.pi * i / 3), y - 0.002, z + size * 0.28 * math.sin(math.pi * i / 3))) for i in range(6)]
    face_toward(bm, heart, n, YELLOW)


def build():
    bm = bmesh.new()

    def bell_mat(k, i):
        if k <= 2:
            return DARK
        if k <= OUTSIDE_END:
            return COPPER if k != 4 else DARK
        return DARK if k <= LIP_END else INSIDE
    lathe(bm, BELL, SEGMENTS, bell_mat)
    # The clapper on its rod, hanging inside.
    box(bm, (-0.012, -0.012, 0.12), (0.012, 0.012, 0.72), INSIDE)
    lathe(bm, [(0.0, 0.03), (0.05, 0.06), (0.06, 0.1), (0.04, 0.14), (0.0, 0.15)], 6, lambda k, i: DARK)
    # The loop on the crown, and the collar threaded through it.
    loop = [((0.075 * math.cos(math.pi * t / 6), 0, 0.8 + 0.075 * math.sin(math.pi * t / 6)), (0.018, 0.022)) for t in range(7)]
    sweep(bm, loop, [(-1, -1), (1, -1), (1, 1), (-1, 1)], lambda k, i: DARK)
    ring = [((COLLAR_R * math.sin(2 * math.pi * t / 20), 0, COLLAR_Z - COLLAR_R * math.cos(2 * math.pi * t / 20)), (STRAP_T, STRAP_W)) for t in range(21)]
    sweep(bm, ring, [(-1, -1), (1, -1), (1, 1), (-1, 1)], lambda k, i: LEATHER if i in (1, 3) else LEATHER_DARK, caps=(False, False), up=(0, 1, 0))
    # The buckle at the top of the collar.
    top = COLLAR_Z + COLLAR_R
    box(bm, (-0.09, -STRAP_T - 0.018, top - STRAP_W - 0.02), (0.09, STRAP_T + 0.018, top + STRAP_W + 0.02), BRASS)
    box(bm, (-0.05, -STRAP_T - 0.03, top - 0.012), (0.05, -STRAP_T - 0.018, top + 0.012), DARK)
    # Edelweiss on the front of the strap.
    for deg in (40, 140, -40, -140):
        a = math.radians(deg)
        edelweiss(bm, COLLAR_R * math.sin(a), COLLAR_Z - COLLAR_R * math.cos(a), -STRAP_T - 0.004, 0.05)
    # Everything but the stitched flowers is closed: orient that, and leave the flowers
    # facing out as face_toward() made them.
    flowers = {f for f in bm.faces if f.material_index in (WHITE, YELLOW)}
    bmesh.ops.recalc_face_normals(bm, faces=[f for f in bm.faces if f not in flowers])
    return finish(bpy, bm, 'Bell', COLORS, recalc=False)


for o in list(bpy.data.objects):
    bpy.data.objects.remove(o)
bell = build()
export_model(bell, 'bell', os.path.join(ROOT, 'js', 'render', 'models', 'bell.js'), 'scripts/blender/bell.py')
