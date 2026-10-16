"""Low-poly wooden clog of the tulip merchant: a Dutch klomp lofted through cross-sections,
with a foot opening hollowed into its back half, a toe that narrows and turns up to a point,
and a red tulip painted on the toe.

  blender -b --factory-startup -P scripts/blender/clog.py

Writes js/render/models/clog.js.
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
from shapes import finish, face_toward  # noqa: E402
from mathutils import Vector  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(HERE))
WOOD, SOLE, INSIDE, RED, GREEN = 0, 1, 2, 3, 4
COLORS = (('Wood', (0.88, 0.63, 0.29)), ('Sole', (0.52, 0.39, 0.24)), ('Inside', (0.30, 0.20, 0.12)),
          ('Red', (0.74, 0.12, 0.10)), ('Green', (0.22, 0.46, 0.18)))

# Cross-sections from heel to toe: (x, half width, sole z, top z, open). The shoe runs along
# x, so a turn of the viewer shows it in profile; open sections have the foot hole.
# The sole has a heel and a raised arch, and the toe rocks up towards the point.
SECTIONS = [
    (-0.50, 0.12, 0.03, 0.40, True),
    (-0.45, 0.155, 0.0, 0.42, True),
    (-0.32, 0.17, 0.0, 0.42, True),
    (-0.16, 0.172, 0.022, 0.40, True),
    (-0.05, 0.172, 0.026, 0.40, False),
    (0.10, 0.168, 0.0, 0.38, False),
    (0.24, 0.15, 0.02, 0.34, False),
    (0.35, 0.115, 0.06, 0.30, False),
    (0.43, 0.07, 0.13, 0.28, False),
]
TIP = (0.5, 0.0, 0.33)        # the toe ends in a short, turned-up point
DOME = 0.04                   # the closed top bulges this much over the toes
FLOOR = 0.09                  # how high the inside of the foot hole sits above the sole


def ring(x, hw, sole, top, open_, dome):
    """Twelve points round a section, counter-clockwise seen from the toe: sole, side, rim,
    the hollow (or the top, bulging by dome, where the shoe is closed), rim, side."""
    mid = sole + (top - sole) * 0.35
    deep = sole + FLOOR if open_ else top + dome
    pts = [(-hw * 0.82, sole), (hw * 0.82, sole), (hw, mid), (hw * 0.93, top - 0.035),
           (hw * 0.8, top), (hw * 0.56, top), (hw * 0.46, deep), (-hw * 0.46, deep),
           (-hw * 0.56, top), (-hw * 0.8, top), (-hw * 0.93, top - 0.035), (-hw, mid)]
    return [(x, y, z) for y, z in pts]


# Bands between ring points: 0 sole, 1-3 right side, 4 rim, 5 inner wall, 6 floor, 7 inner
# wall, 8 rim, 9-11 left side. The sole runs up the lowest band of each side, and the rim
# round the foot hole is painted red.
def band_mat(i, hollow):
    if i in (0, 1, 11):
        return SOLE
    if i in (5, 6, 7):
        return INSIDE if hollow else WOOD
    if i in (4, 8) and hollow:
        return RED
    return WOOD


def tulip(bm, centre, along, across, normal, size):
    """A tulip painted on the wood: flat shapes a hair above it, facing out along normal.
    along: up the stem; across: sideways."""
    def at(u, v, lift=0.004):
        return bm.verts.new(tuple(centre[k] + along[k] * u * size + across[k] * v * size + normal[k] * lift for k in range(3)))
    # Stem and a leaf, towards the heel, then the cup and its three petal points.
    stem = [at(-1.0, -0.06), at(-1.0, 0.06), at(-0.1, 0.06), at(-0.1, -0.06)]
    leaf = [at(-0.85, 0.05), at(-0.35, 0.55), at(-0.55, 0.05)]
    cup = [at(-0.15, -0.32), at(-0.15, 0.32), at(0.25, 0.42), at(0.62, 0.36), at(0.4, 0.15),
           at(0.66, 0.0), at(0.4, -0.15), at(0.62, -0.36), at(0.25, -0.42)]
    for verts, mat in ((stem, GREEN), (leaf, GREEN), (cup, RED)):
        face_toward(bm, verts, normal, mat)


def build():
    bm = bmesh.new()
    # The first closed section is the front edge of the hole: flat, so the edge runs smooth.
    first_closed = next(k for k, s in enumerate(SECTIONS) if not s[4])
    rings = [[bm.verts.new(p) for p in ring(*s, 0 if k == first_closed else DOME)] for k, s in enumerate(SECTIONS)]
    n = 12
    for k in range(1, len(rings)):
        hollow = SECTIONS[k - 1][4] or SECTIONS[k][4]
        a, b = rings[k - 1], rings[k]
        for i in range(n):
            j = (i + 1) % n
            bm.faces.new((a[i], a[j], b[j], b[i])).material_index = band_mat(i, hollow)
    # The heel: one face round the back section, its hollow cut into the top.
    bm.faces.new(list(reversed(rings[0]))).material_index = WOOD
    # The toe: every band closes to the turned-up point.
    tip = bm.verts.new(TIP)
    last = rings[-1]
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((last[i], last[j], tip)).material_index = band_mat(i, False)

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

    # A tulip on each side of the toe, upright on the upper side band (left: 10, right: 2)
    # between the 6th and 7th sections, where a turn of the clog shows it.
    for band, outward in ((10, -1), (2, 1)):
        lo, hi = (band + 1, band) if band == 10 else (band, band + 1)
        a, b = rings[5], rings[6]
        quad = [a[lo].co, a[hi].co, b[hi].co, b[lo].co]
        centre = sum(quad, Vector()) / 4
        up = ((a[hi].co + b[hi].co) - (a[lo].co + b[lo].co)).normalized()
        right = ((b[lo].co + b[hi].co) - (a[lo].co + a[hi].co)).normalized()
        normal = up.cross(right).normalized()
        if normal.y * outward < 0:
            normal = -normal
        tulip(bm, centre, up, right, normal, 0.11)
    return finish(bpy, bm, 'Clog', COLORS, recalc=False)


for o in list(bpy.data.objects):
    bpy.data.objects.remove(o)
clog = build()
export_model(clog, 'clog', os.path.join(ROOT, 'js', 'render', 'models', 'clog.js'), 'scripts/blender/clog.py')
