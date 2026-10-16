"""Low-poly clay cup (Brother Odo's), modelled vertex by vertex: a lathe-profile body with
a green glaze that runs down in drips, a chipped rim and a swept strap handle.

  blender -b --factory-startup -P scripts/blender/cup.py

Writes js/render/models/cup.js. Add --save to also keep scripts/blender/cup.blend.
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

ROOT = os.path.dirname(os.path.dirname(HERE))
SEGMENTS = 8
CLAY, CLAY_DARK, GLAZE = 0, 1, 2
COLORS = (('Clay', (0.66, 0.36, 0.20)), ('ClayDark', (0.30, 0.15, 0.08)), ('Glaze', (0.42, 0.48, 0.16)))
DRIP = 'drip'  # glaze on the DRIPS segments only, bare clay elsewhere

# Bottom centre -> over the rim -> inside centre: (radius, height, material of the band
# that ends at this point).
PROFILE = [
    (0.00, 0.00, None),
    (0.33, 0.00, CLAY_DARK),  # underside
    (0.37, 0.04, CLAY),       # foot bevel
    (0.37, 0.09, CLAY),       # foot edge
    (0.34, 0.13, CLAY),       # groove above the foot
    (0.42, 0.30, DRIP),       # lower body: only the long drip reaches here
    (0.46, 0.52, DRIP),       # belly
    (0.44, 0.74, GLAZE),      # shoulder
    (0.39, 0.92, GLAZE),      # neck
    (0.41, 1.00, GLAZE),      # lip
    (0.38, 1.04, GLAZE),      # rim
    (0.35, 1.00, CLAY_DARK),  # inside
    (0.38, 0.62, CLAY_DARK),
    (0.30, 0.20, CLAY_DARK),
    (0.00, 0.17, CLAY_DARK),
]
# Segment i faces angle (i - 1) * 45°: 1 = +x (handle), 7 = -y (front).
DRIPS = {5: {6}, 6: {0, 3, 6}}  # band (profile index) -> glazed segments
# The rim is chipped at the front left, unevenly: these ring vertices drop
# (ring, vertex, dz), and the broken faces show bare clay.
CHIP = [(9, 6, -0.04), (10, 6, -0.07), (10, 7, -0.02), (11, 6, -0.03)]
CHIP_FACES = {(10, 5), (10, 6), (11, 5), (11, 6)}

# Strap handle on the +x side, swept along a path in the xz plane. Both ends sink into
# the wall. (x, z, width)
HANDLE = [(0.36, 0.84, 0.15), (0.56, 0.86, 0.15), (0.70, 0.74, 0.14),
          (0.72, 0.54, 0.13), (0.62, 0.36, 0.12), (0.36, 0.28, 0.11)]
HANDLE_THICK = 0.08
HANDLE_GLAZED = 2  # the first segments from the top caught the glaze


def body(bm):
    rings = []
    for r, z, _ in PROFILE:
        if r == 0:
            rings.append([bm.verts.new((0, 0, z))])
            continue
        # Offset by half a segment so a flat face, not an edge, looks at the viewer.
        rings.append([
            bm.verts.new((r * math.cos(a), r * math.sin(a), z))
            for a in (2 * math.pi * (i + 0.5) / SEGMENTS - math.pi / 2 for i in range(SEGMENTS))
        ])
    for ring, i, dz in CHIP:
        rings[ring][i].co.z += dz
    for k in range(1, len(PROFILE)):
        lo, hi, mat = rings[k - 1], rings[k], PROFILE[k][2]
        for i in range(SEGMENTS):
            j = (i + 1) % SEGMENTS
            if len(lo) == 1:
                f = bm.faces.new((lo[0], hi[j], hi[i]))
            elif len(hi) == 1:
                f = bm.faces.new((lo[i], lo[j], hi[0]))
            else:
                f = bm.faces.new((lo[i], lo[j], hi[j], hi[i]))
            if mat == DRIP:
                f.material_index = GLAZE if i in DRIPS[k] else CLAY
            elif (k, i) in CHIP_FACES:
                f.material_index = CLAY
            else:
                f.material_index = mat


def handle(bm):
    rings = []
    for k, (x, z, w) in enumerate(HANDLE):
        a, b = HANDLE[max(k - 1, 0)], HANDLE[min(k + 1, len(HANDLE) - 1)]
        tx, tz = b[0] - a[0], b[1] - a[1]
        n = math.hypot(tx, tz)
        nx, nz = tz / n * HANDLE_THICK / 2, -tx / n * HANDLE_THICK / 2
        rings.append([bm.verts.new((x + s * nx, y * w / 2, z + s * nz))
                      for s, y in ((-1, -1), (1, -1), (1, 1), (-1, 1))])
    for k in range(1, len(rings)):
        lo, hi = rings[k - 1], rings[k]
        for i in range(4):
            j = (i + 1) % 4
            f = bm.faces.new((lo[i], lo[j], hi[j], hi[i]))
            f.material_index = GLAZE if k <= HANDLE_GLAZED else CLAY
    bm.faces.new(rings[0]).material_index = GLAZE
    bm.faces.new(rings[-1]).material_index = CLAY


def build():
    bm = bmesh.new()
    body(bm)
    handle(bm)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

    me = bpy.data.meshes.new('Cup')
    bm.to_mesh(me)
    bm.free()
    me.shade_flat()
    for name, rgb in COLORS:
        m = bpy.data.materials.new(name)
        m.diffuse_color = (*rgb, 1)
        me.materials.append(m)
    ob = bpy.data.objects.new('Cup', me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


for o in list(bpy.data.objects):
    bpy.data.objects.remove(o)
cup = build()
export_model(cup, 'cup', os.path.join(ROOT, 'js', 'render', 'models', 'cup.js'), 'scripts/blender/cup.py')
if '--save' in sys.argv:
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, 'cup.blend'))
