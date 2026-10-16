"""Low-poly gold chalice, modelled vertex by vertex as a lathe profile.

  blender -b --factory-startup -P scripts/blender/chalice.py

Writes js/render/models/chalice.js. Add --save to also keep scripts/blender/chalice.blend.
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
GOLD, GOLD_DARK, RUBY = 0, 1, 2
COLORS = (('Gold', (0.86, 0.62, 0.20)), ('GoldDark', (0.42, 0.26, 0.08)), ('Ruby', (0.70, 0.05, 0.08)))

# Bottom centre -> over the rim -> inside centre: (radius, height, material of the band
# that ends at this point).
PROFILE = [
    (0.00, 0.00, None),
    (0.50, 0.00, GOLD),       # underside of the foot
    (0.50, 0.07, GOLD),       # foot edge
    (0.30, 0.16, GOLD),       # foot slope
    (0.09, 0.30, GOLD),
    (0.08, 0.52, GOLD),       # stem
    (0.19, 0.60, GOLD),       # knot
    (0.19, 0.68, RUBY),       # jewelled band
    (0.08, 0.76, GOLD),
    (0.08, 0.88, GOLD),
    (0.22, 0.98, GOLD),       # bowl
    (0.40, 1.16, GOLD),
    (0.44, 1.42, GOLD),
    (0.39, 1.44, GOLD),       # rim
    (0.35, 1.20, GOLD_DARK),  # inside
    (0.00, 1.08, GOLD_DARK),
]


def build():
    bm = bmesh.new()
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
            f.material_index = mat
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

    me = bpy.data.meshes.new('Chalice')
    bm.to_mesh(me)
    bm.free()
    me.shade_flat()
    for name, rgb in COLORS:
        m = bpy.data.materials.new(name)
        m.diffuse_color = (*rgb, 1)
        me.materials.append(m)
    ob = bpy.data.objects.new('Chalice', me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


for o in list(bpy.data.objects):
    bpy.data.objects.remove(o)
chalice = build()
export_model(chalice, 'chalice', os.path.join(ROOT, 'js', 'render', 'models', 'chalice.js'), 'scripts/blender/chalice.py')
if '--save' in sys.argv:
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, 'chalice.blend'))
