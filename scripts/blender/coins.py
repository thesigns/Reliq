"""Low-poly coins, one model per coin, in the style of the tomb artifacts: a lathe
profile built vertex by vertex, flat facets, two colours per metal (raised metal and the
darker, patinated field).

Every coin has an edge, a raised rim (or a domed face), a sunken field and one simple
raised motif per side: a mound standing for a portrait ('bust'), a bead ring ('ring'), the
square hole of a Chinese cash coin with its raised square rim ('hole'), or an incuse
square punch ('punch'). Hand-struck coins get a lumpy outline from a seeded jitter.

  blender -b --factory-startup -P scripts/blender/coins.py

Writes js/render/models/coin-<id>.js for every coin.
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
RAISED, FIELD = 0, 1
METALS = {  # raised metal, sunken field
    'bronze': ((0.74, 0.46, 0.26), (0.40, 0.37, 0.25)),
    'silver': ((0.84, 0.84, 0.82), (0.52, 0.54, 0.56)),
    'gold': ((0.97, 0.74, 0.28), (0.70, 0.47, 0.14)),
    'electrum': ((0.91, 0.81, 0.50), (0.60, 0.52, 0.30)),
}

# radius and thickness are relative; the game scales every coin to the same size, so
# thickness / radius and the outline are what tell them apart.
COINS = {
    'nummus': dict(metal='bronze', radius=0.9, thick=0.17, segments=12, jitter=0.05, front='bust', back='ring'),
    'kaiyuan': dict(metal='bronze', radius=1.0, thick=0.13, segments=12, jitter=0.0, front='hole', back='hole'),
    'denarius': dict(metal='silver', radius=0.85, thick=0.15, segments=12, jitter=0.05, front='bust', back='bust'),
    'eightreales': dict(metal='silver', radius=1.15, thick=0.12, segments=14, jitter=0.12, front='ring', back='bust'),
    'tetradrachm': dict(metal='silver', radius=0.95, thick=0.3, segments=12, jitter=0.08, front='bust', back='bust', rim=False),
    'ducat': dict(metal='gold', radius=0.95, thick=0.08, segments=14, jitter=0.015, front='bust', back='ring'),
    'solidus': dict(metal='gold', radius=0.9, thick=0.1, segments=14, jitter=0.02, front='bust', back='bust'),
    'doubloon': dict(metal='gold', radius=1.05, thick=0.15, segments=12, jitter=0.13, front='ring', back='bust'),
    'stater': dict(metal='electrum', radius=0.85, thick=0.36, segments=10, jitter=0.14, stretch=1.25, front='bust', back='punch', rim=False),
    'eidmar': dict(metal='gold', radius=0.9, thick=0.13, segments=12, jitter=0.04, front='bust', back='ring'),
}


def face_profile(spec, design):
    """One side, from the edge inwards: (shape, radius, height above the mid-plane, material
    of the band between this ring and the one outside it). shape: 'round' or 'square'. Ends
    in a centre point (radius 0) or, for a hole, at the hole's edge."""
    R, half = spec['radius'], spec['thick'] / 2
    e = half * 0.8                      # the edge band is a little thinner than the coin
    d = half * 0.4                      # how deep the field sits below the rim
    out = [('round', R, e, RAISED)]
    if spec.get('rim', True):
        f = half - d
        out += [('round', 0.95 * R, half, RAISED), ('round', 0.85 * R, half, RAISED), ('round', 0.8 * R, f, RAISED)]
    else:
        f = half * 0.95                 # no rim: the face swells into a low dome
        out += [('round', 0.88 * R, half * 0.78, FIELD), ('round', 0.68 * R, f, FIELD)]
    b = d * 1.15                        # how far a motif stands out of the field
    if design == 'bust':
        out += [('round', 0.48 * R, f, FIELD), ('round', 0.4 * R, f + 0.7 * b, RAISED),
                ('round', 0.22 * R, f + b, RAISED), ('round', 0, f + 1.1 * b, RAISED)]
    elif design == 'ring':
        out += [('round', 0.56 * R, f, FIELD), ('round', 0.52 * R, f + 0.7 * b, RAISED),
                ('round', 0.44 * R, f + 0.7 * b, RAISED), ('round', 0.4 * R, f, RAISED),
                ('round', 0.16 * R, f, FIELD), ('round', 0, f + 0.6 * b, RAISED)]
    elif design == 'hole':
        out += [('square', 0.34 * R, f, FIELD), ('square', 0.3 * R, f + b, RAISED), ('square', 0.21 * R, f + b, RAISED)]
    elif design == 'punch':
        out += [('square', 0.44 * R, f, FIELD), ('square', 0.38 * R, f - 0.9 * b, FIELD), ('square', 0, f - 0.9 * b, FIELD)]
    return out


def build(cid, spec):
    n = spec['segments']
    rng = random.Random(cid)
    # A lumpy outline: smoothed random bulges, felt most at the edge.
    raw = [rng.uniform(-1, 1) for _ in range(n)]
    lump = [(raw[i - 1] + 2 * raw[i] + raw[(i + 1) % n]) / 4 for i in range(n)]
    angles = [2 * math.pi * (i + 0.5) / n - math.pi / 2 for i in range(n)]  # a flat facet at the bottom
    stretch = spec.get('stretch', 1.0)

    def ring(bm, shape, r, y):
        if r == 0:
            return [bm.verts.new((0, y, 0))]
        vs = []
        for i, a in enumerate(angles):
            c, s = math.cos(a), math.sin(a)
            if shape == 'square':
                k = r / max(abs(c), abs(s))
            else:
                k = r * (1 + spec['jitter'] * lump[i] * (r / spec['radius']) ** 2)
            vs.append(bm.verts.new((k * c * stretch, y, k * s)))
        return vs

    front, back = face_profile(spec, spec['front']), face_profile(spec, spec['back'])
    hole = front[-1][1] > 0
    bm = bmesh.new()
    # Walk the profile once round: front centre outwards (the front faces -y, towards the
    # viewer), across the edge, then the back inwards. Each band takes the material of
    # the ring on its inner side.
    rings, mats = [], []
    for shape, r, h, m in reversed(front):
        rings.append(ring(bm, shape, r, -h)); mats.append(m)
    for shape, r, h, m in back:
        rings.append(ring(bm, shape, r, h)); mats.append(m)
    k_edge = len(front) - 1               # the band from the front edge ring to the back one

    def band(lo, hi, mat):
        if len(lo) == 1:
            for i in range(n):
                bm.faces.new((lo[0], hi[(i + 1) % n], hi[i])).material_index = mat
        elif len(hi) == 1:
            for i in range(n):
                bm.faces.new((lo[i], lo[(i + 1) % n], hi[0])).material_index = mat
        else:
            for i in range(n):
                j = (i + 1) % n
                bm.faces.new((lo[i], lo[j], hi[j], hi[i])).material_index = mat

    for k in range(1, len(rings)):
        if k - 1 < k_edge:
            mat = mats[k - 1]             # front: the inner ring is the earlier one
        elif k - 1 == k_edge:
            mat = RAISED                  # the edge
        else:
            mat = mats[k]                 # back: the inner ring is the later one
        band(rings[k - 1], rings[k], mat)
    if hole:
        band(rings[-1], rings[0], FIELD)  # the wall of the hole
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

    me = bpy.data.meshes.new(cid)
    bm.to_mesh(me)
    bm.free()
    me.shade_flat()
    for name, rgb in zip(('Metal', 'Field'), METALS[spec['metal']]):
        m = bpy.data.materials.new(f'{cid}-{name}')
        m.diffuse_color = (*rgb, 1)
        me.materials.append(m)
    ob = bpy.data.objects.new(cid, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


for o in list(bpy.data.objects):
    bpy.data.objects.remove(o)
built = {}
for cid, spec in COINS.items():
    built[cid] = build(cid, spec)
    path = os.path.join(ROOT, 'js', 'render', 'models', f'coin-{cid}.js')
    export_model(built[cid], f'coin_{cid}', path, 'scripts/blender/coins.py')
