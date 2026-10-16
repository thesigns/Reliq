"""Hand-modelling helpers for the low-poly artifact scripts: every vertex is still placed by
the script, these only save writing the same rings and caps again.

  slab(bm, outline, thick, mat, bevel=..., bevel_mat=...)  a carved board from an outline
  box(bm, lo, hi, mat)                                     a closed box
  lathe(bm, profile, segments, mat_of, ...)                a turned body from a profile

Coordinates are Blender's: z up, the front faces -y. Run bmesh.ops.recalc_face_normals
once the whole mesh is built.
"""
import math


def signed_area(pts):
    return sum(pts[i][0] * pts[(i + 1) % len(pts)][1] - pts[(i + 1) % len(pts)][0] * pts[i][1] for i in range(len(pts))) / 2


def inset(pts, d, clamp=2.5):
    """The outline moved inwards by d (pts counter-clockwise in the x-z plane). Sharp corners
    get a mitre, clamped so thin points do not shoot out."""
    out = []
    n = len(pts)
    for i in range(n):
        (ax, az), (bx, bz), (cx, cz) = pts[i - 1], pts[i], pts[(i + 1) % n]
        normals = []
        for (px, pz), (qx, qz) in (((ax, az), (bx, bz)), ((bx, bz), (cx, cz))):
            ex, ez = qx - px, qz - pz
            length = math.hypot(ex, ez) or 1
            normals.append((-ez / length, ex / length))   # left of the edge: inside for CCW
        mx, mz = normals[0][0] + normals[1][0], normals[0][1] + normals[1][1]
        ml = math.hypot(mx, mz)
        if ml < 1e-9:
            mx, mz, ml = normals[1][0], normals[1][1], 1
        mx, mz = mx / ml, mz / ml
        cos = max(mx * normals[1][0] + mz * normals[1][1], 1 / clamp)
        out.append((bx + mx * d / cos, bz + mz * d / cos))
    return out


def slab(bm, outline, thick, mat, bevel=0.0, bevel_mat=None, y=0.0):
    """A board cut to `outline` (x, z points in order), `thick` deep and centred on y.
    bevel: the faces are chamfered by this much, a carved edge that catches the light."""
    pts = list(outline)
    if signed_area(pts) < 0:
        pts.reverse()
    half = thick / 2
    if bevel > 0:
        inner = inset(pts, bevel)
        layers = [(inner, y - half), (pts, y - half + bevel), (pts, y + half - bevel), (inner, y + half)]
    else:
        layers = [(pts, y - half), (pts, y + half)]
    rings = [[bm.verts.new((x, yy, z)) for x, z in ring] for ring, yy in layers]
    n = len(pts)
    for k in range(1, len(rings)):
        a, b = rings[k - 1], rings[k]
        side = k == 2 or len(rings) == 2
        for i in range(n):
            j = (i + 1) % n
            f = bm.faces.new((a[i], a[j], b[j], b[i]))
            f.material_index = mat if side or bevel_mat is None else bevel_mat
    bm.faces.new(rings[0]).material_index = mat
    bm.faces.new(list(reversed(rings[-1]))).material_index = mat
    return rings


def box(bm, lo, hi, mat):
    """An axis-aligned closed box from corner lo to corner hi. mat: one index, or a dict of
    side -> index for any of '-x', '+x', '-y', '+y', '-z', '+z' (the rest take 'all')."""
    (x0, y0, z0), (x1, y1, z1) = lo, hi
    v = [bm.verts.new(p) for p in ((x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0),
                                   (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1))]
    sides = {'-z': (0, 3, 2, 1), '+z': (4, 5, 6, 7), '-y': (0, 1, 5, 4), '+y': (2, 3, 7, 6), '-x': (3, 0, 4, 7), '+x': (1, 2, 6, 5)}
    for name, idx in sides.items():
        f = bm.faces.new([v[i] for i in idx])
        f.material_index = mat if isinstance(mat, int) else mat.get(name, mat['all'])
    return v


def lathe(bm, profile, segments, mat_of, centre=(0, 0, 0), axis='z', phase=0.5):
    """A body turned about an axis. profile: (radius, height) from one end to the other; a
    radius of 0 closes that end to a point. mat_of(k, i): the material of band k (between
    profile points k-1 and k) on segment i. phase: half a segment turns a flat face, not an
    edge, towards -y."""
    cx, cy, cz = centre
    rings = []
    for r, h in profile:
        pts = []
        count = 1 if r == 0 else segments
        for i in range(count):
            a = 2 * math.pi * (i + phase) / segments - math.pi / 2
            u, w = (r * math.cos(a), r * math.sin(a)) if r else (0, 0)
            if axis == 'z':
                p = (cx + u, cy + w, cz + h)
            elif axis == 'x':
                p = (cx + h, cy + u, cz + w)
            else:
                p = (cx + u, cy + h, cz + w)
            pts.append(bm.verts.new(p))
        rings.append(pts)
    for k in range(1, len(rings)):
        lo, hi = rings[k - 1], rings[k]
        for i in range(segments):
            j = (i + 1) % segments
            if len(lo) == 1:
                f = bm.faces.new((lo[0], hi[j], hi[i]))
            elif len(hi) == 1:
                f = bm.faces.new((lo[i], lo[j], hi[0]))
            else:
                f = bm.faces.new((lo[i], lo[j], hi[j], hi[i]))
            f.material_index = mat_of(k, i)
    if len(rings[0]) > 1:
        bm.faces.new(list(reversed(rings[0]))).material_index = mat_of(0, 0)
    if len(rings[-1]) > 1:
        bm.faces.new(rings[-1]).material_index = mat_of(len(rings) - 1, 0)
    return rings


def face_toward(bm, verts, normal, mat):
    """A single-sided face (a painted decal, say) turned to face along normal. recalc cannot
    orient a face on its own, so build such faces after it and finish(recalc=False)."""
    f = bm.faces.new(verts)
    f.normal_update()
    if f.normal.dot(normal) < 0:
        f.normal_flip()
    f.material_index = mat
    return f


def finish(bpy, bm, name, colors, recalc=True):
    """Normals out, flat shading, one material per palette colour: the object, linked."""
    import bmesh
    if recalc:
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.shade_flat()
    for cname, rgb in colors:
        m = bpy.data.materials.new(f'{name}-{cname}')
        m.diffuse_color = (*rgb, 1)
        me.materials.append(m)
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob
