"""The vault's treasure chest for the deposit scene, low poly and built vertex by vertex:
a plank box with iron straps, brass corners and a lock plate; a barrel lid on a hinge at
the back; and a heap of gold inside. Three models, so the lid can swing and the heap can
swell as coins land on it.

  blender -b --factory-startup -P scripts/blender/chest.py

Writes js/render/models/chest-body.js, chest-lid.js (pivot: the hinge) and chest-gold.js
(pivot: the heap's base).
"""
import math
import os
import random
import sys

import bpy
import bmesh

sys.dont_write_bytecode = True

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from export_model import export_model  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(HERE))
WOOD, WOOD_DARK, IRON, BRASS, INSIDE, GOLD, GOLD_DARK = range(7)
COLORS = (('Wood', (0.56, 0.34, 0.17)), ('WoodDark', (0.40, 0.23, 0.11)), ('Iron', (0.24, 0.24, 0.27)),
          ('Brass', (0.88, 0.64, 0.24)), ('Inside', (0.14, 0.08, 0.05)), ('Gold', (0.98, 0.78, 0.32)),
          ('GoldDark', (0.80, 0.55, 0.16)))

W, D, H = 0.8, 0.5, 0.8        # half width, half depth, body height (front faces -y)
T = 0.07                       # wall thickness
PLANKS = (0.08, 0.32, 0.56, H)  # board edges up the walls
STRAPS = (-0.46, 0.46)          # iron straps across front, back and lid


def box(bm, lo, hi, mat, inner=None):
    """A closed cuboid. inner: the side ('+x', '-y', ...) that faces into the chest, which
    gets the dark inside colour."""
    (x0, y0, z0), (x1, y1, z1) = lo, hi
    v = [bm.verts.new(c) for c in ((x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0),
                                   (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1))]
    sides = {'-z': (0, 3, 2, 1), '+z': (4, 5, 6, 7), '-y': (0, 1, 5, 4), '+y': (2, 3, 7, 6), '-x': (3, 0, 4, 7), '+x': (1, 2, 6, 5)}
    for side, idx in sides.items():
        bm.faces.new([v[i] for i in idx]).material_index = INSIDE if side == inner else mat


def sweep(bm, path, half_width, x, mat):
    """A strap of square section along a path of (y, z, outward normal y, z) at x."""
    rings = []
    for y, z, ny, nz in path:
        rings.append([bm.verts.new((x + sx * half_width, y + ny * r, z + nz * r)) for sx, r in ((-1, -0.02), (1, -0.02), (1, 0.025), (-1, 0.025))])
    for a, b in zip(rings, rings[1:]):
        for i in range(4):
            j = (i + 1) % 4
            bm.faces.new((a[i], a[j], b[j], b[i])).material_index = mat
    bm.faces.new(rings[0]).material_index = mat
    bm.faces.new(list(reversed(rings[-1]))).material_index = mat


def finish(bm, name, extra=None):
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.shade_flat()
    for cname, rgb in COLORS:
        m = bpy.data.materials.new(f'{name}-{cname}')
        m.diffuse_color = (*rgb, 1)
        me.materials.append(m)
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    path = os.path.join(ROOT, 'js', 'render', 'models', f'{name.replace("_", "-")}.js')
    export_model(ob, name, path, 'scripts/blender/chest.py', extra)
    return ob


def body():
    bm = bmesh.new()
    box(bm, (-W - 0.03, -D - 0.03, 0), (W + 0.03, D + 0.03, 0.08), WOOD_DARK)          # plinth
    box(bm, (-W, -D, 0.08), (W, D, 0.14), WOOD_DARK, inner='+z')                       # floor
    walls = (((-W, -D), (W, -D + T), '+y'), ((-W, D - T), (W, D), '-y'),
             ((-W, -D + T), (-W + T, D - T), '+x'), ((W - T, -D + T), (W, D - T), '-x'))
    for (x0, y0), (x1, y1), inner in walls:
        for k, (z0, z1) in enumerate(zip(PLANKS, PLANKS[1:])):
            box(bm, (x0, y0, z0), (x1, y1, z1), WOOD if k % 2 == 0 else WOOD_DARK, inner)
    for x in STRAPS:
        box(bm, (x - 0.045, -D - 0.025, 0.08), (x + 0.045, -D, H), IRON)
        box(bm, (x - 0.045, D, 0.08), (x + 0.045, D + 0.025, H), IRON)
    for sx in (-1, 1):
        for sy in (-1, 1):
            x0, x1 = sorted((sx * (W + 0.03), sx * (W - 0.07)))
            y0, y1 = sorted((sy * (D + 0.03), sy * (D - 0.07)))
            box(bm, (x0, y0, 0.08), (x1, y1, H), BRASS)                                 # corner caps
    box(bm, (-0.12, -D - 0.035, 0.46), (0.12, -D, 0.74), BRASS)                         # lock plate
    box(bm, (-0.025, -D - 0.045, 0.53), (0.025, -D - 0.035, 0.64), INSIDE)               # keyhole
    return finish(bm, 'chest_body')


def lid():
    bm = bmesh.new()
    wl, n, squash = W + 0.03, 6, 0.75
    arc = []
    for k in range(n + 1):
        a = math.pi - k * math.pi / n
        arc.append((D * math.cos(a), H + D * math.sin(a) * squash, math.cos(a), math.sin(a)))
    left = [bm.verts.new((-wl, y, z)) for y, z, _, _ in arc]
    right = [bm.verts.new((wl, y, z)) for y, z, _, _ in arc]
    for k in range(n):
        bm.faces.new((left[k], right[k], right[k + 1], left[k + 1])).material_index = WOOD if k % 2 == 0 else WOOD_DARK
    bm.faces.new((left[0], left[n], right[n], right[0])).material_index = INSIDE         # underside
    bm.faces.new(left).material_index = WOOD_DARK
    bm.faces.new(list(reversed(right))).material_index = WOOD_DARK
    for x in STRAPS:
        sweep(bm, arc, 0.045, x, IRON)
    box(bm, (-0.09, -D - 0.045, H - 0.18), (0.09, -D - 0.01, H + 0.05), BRASS)          # hasp
    return finish(bm, 'chest_lid', {'pivot': (0, D, H)})


def gold():
    bm = bmesh.new()
    rng = random.Random(7)
    nx, ny, base = 7, 5, 0.3
    xs = [-(W - T - 0.02) + i * 2 * (W - T - 0.02) / (nx - 1) for i in range(nx)]
    ys = [-(D - T - 0.02) + j * 2 * (D - T - 0.02) / (ny - 1) for j in range(ny)]
    grid = []
    for j, y in enumerate(ys):
        row = []
        for i, x in enumerate(xs):
            r = (x / xs[-1]) ** 2 + (y / ys[-1]) ** 2
            z = 0.56 + 0.17 * max(0.0, 1 - r * 0.8) * (0.6 + 0.4 * rng.random())
            row.append(bm.verts.new((x, y, z)))
        grid.append(row)
    for j in range(ny - 1):
        for i in range(nx - 1):
            a, b, c, d = grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]
            # Two triangles per cell, each its own shade: a heap of glinting coins.
            bm.faces.new((a, b, c)).material_index = GOLD if rng.random() < 0.6 else GOLD_DARK
            bm.faces.new((a, c, d)).material_index = GOLD if rng.random() < 0.6 else GOLD_DARK
    rim = grid[0][:] + [grid[j][-1] for j in range(1, ny)] + grid[-1][-2::-1] + [grid[j][0] for j in range(ny - 2, 0, -1)]
    low = [bm.verts.new((v.co.x, v.co.y, base)) for v in rim]
    for k in range(len(rim)):
        m = (k + 1) % len(rim)
        bm.faces.new((rim[k], low[k], low[m], rim[m])).material_index = GOLD_DARK
    bm.faces.new(low).material_index = GOLD_DARK
    return finish(bm, 'chest_gold', {'pivot': (0, 0, base)})


for o in list(bpy.data.objects):
    bpy.data.objects.remove(o)
built = {'body': body(), 'lid': lid(), 'gold': gold()}
