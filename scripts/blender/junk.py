"""Low-poly junk: the ten everyday things a spade turns up instead of treasure. Each is a
few simple parts, a little grubby, and carries no lettering, so it reads the same in every
language. Flat things stand on edge, facing the viewer, so they show their face as they turn.

  blender -b --factory-startup -P scripts/blender/junk.py

Writes js/render/models/junk-<id>.js for every junk item.
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
from shapes import (lathe, slab, box, sweep, torus, loft, plate_ring, circle, face_toward,  # noqa: E402
                    rotate, move, new_verts, finish)

ROOT = os.path.dirname(os.path.dirname(HERE))


def ellipse(cx, cz, a, b, n, phase=0.0):
    return [(cx + a * math.cos(2 * math.pi * (i + phase) / n), cz + b * math.sin(2 * math.pi * (i + phase) / n)) for i in range(n)]


def sheet(h, t, levels):
    """A cross-section for a strip of paper swept along a path: u runs up the strip's height,
    v through its thickness. Side 0 is the back, then the top edge, then the front from the
    top down through `levels` (heights where the front changes colour), then the bottom edge."""
    return [(-h, -t), (h, -t), (h, t)] + [(u, t) for u in levels] + [(-h, t)]


# ---- The things -----------------------------------------------------------------------------

def button():
    """A four-hole plastic button torn off a coat: a dished face inside a raised rim, the
    thread still crossed through its holes and a loose end trailing over the edge."""
    PLASTIC, DARK, LIGHT, HOLE, THREAD = range(5)
    colors = (('Plastic', (0.2, 0.55, 0.5)), ('PlasticDark', (0.1, 0.34, 0.32)), ('PlasticLight', (0.42, 0.74, 0.67)),
              ('Hole', (0.04, 0.07, 0.07)), ('Thread', (0.92, 0.89, 0.8)))
    bm = bmesh.new()
    R = 0.5
    # Face to back: the flat middle with the holes, the slope up to the rim, round the edge.
    prof = [(0.0, -0.03), (0.22, -0.03), (0.3, -0.055), (0.36, -0.075), (0.44, -0.075), (R, -0.05), (R, 0.03), (0.46, 0.05), (0.0, 0.05)]
    lathe(bm, prof, 20, lambda k, i: {2: DARK, 4: LIGHT, 6: DARK}.get(k, PLASTIC), axis='y')
    holes = [(-0.1, -0.1), (0.1, -0.1), (0.1, 0.1), (-0.1, 0.1)]
    thread = [(0.014 * u, 0.014 * v) for u, v in circle(5)]
    # Sewn as a cross: two diagonals on the face, one on top of the other where they meet...
    for (ax, az), (bx, bz), mid in ((holes[0], holes[2], -0.066), (holes[1], holes[3], -0.05)):
        sweep(bm, [((ax + (bx - ax) * t, y, az + (bz - az) * t), 1.0) for t, y in ((0.0, -0.02), (0.2, -0.048), (0.5, mid), (0.8, -0.048), (1.0, -0.02))],
              thread, lambda k, i: THREAD)
    # ...and two straight stitches up the back.
    for x in (-0.1, 0.1):
        sweep(bm, [((x, y, z), 1.0) for z, y in ((-0.1, 0.04), (-0.06, 0.066), (0.06, 0.066), (0.1, 0.04))], thread, lambda k, i: THREAD)
    tail = [(0.1, -0.02, 0.1), (0.13, -0.06, 0.14), (0.22, -0.09, 0.22), (0.34, -0.1, 0.3), (0.46, -0.09, 0.38), (0.58, -0.07, 0.43),
            (0.68, -0.05, 0.41), (0.74, -0.04, 0.33)]
    sweep(bm, [(p, 1.0) for p in tail], thread, lambda k, i: THREAD)
    for x, z in holes:
        for y, n in ((-0.033, -1), (0.053, 1)):
            face_toward(bm, [bm.verts.new((x + 0.045 * u, y, z + 0.045 * v)) for u, v in circle(6)], (0, n, 0), HOLE)
    return _finish_decals(bm, 'Button', colors, HOLE)


def pulltab():
    """A ring pull off a can: the big finger loop and the nose with its rivet hole, bent up
    where it was pulled."""
    ALU, EDGE, DIRT = range(3)
    colors = (('Aluminium', (0.8, 0.82, 0.85)), ('AluEdge', (0.52, 0.55, 0.59)), ('Dirt', (0.42, 0.38, 0.3)))
    bm = bmesh.new()
    loop_out = ellipse(-0.14, 0.0, 0.4, 0.26, 16)
    loop_in = ellipse(-0.18, 0.0, 0.27, 0.14, 16)
    plate_ring(bm, loop_out, loop_in, 0.03, ALU, EDGE)
    nose = new_verts(bm, lambda b: plate_ring(b, ellipse(0.3, 0.0, 0.2, 0.17, 12), ellipse(0.33, 0.0, 0.05, 0.05, 12), 0.036, ALU, EDGE))
    rotate(nose, math.radians(-22), (0, 0, 1), pivot=(0.15, 0, 0))
    face_toward(bm, [bm.verts.new((x, -0.016, z)) for x, z in ellipse(-0.42, -0.08, 0.05, 0.04, 5)], (0, -1, 0), DIRT)
    return _finish_decals(bm, 'Pulltab', colors, DIRT)


def ticket():
    """A punched tram ticket, slightly bowed: a coloured band along the top, a printed block,
    the purple stamp of the validator, a punched hole and a dark magnetic stripe behind."""
    PAPER, BAND, PRINT, STAMP, HOLE, STRIPE = range(6)
    colors = (('Paper', (0.92, 0.88, 0.76)), ('Band', (0.78, 0.2, 0.18)), ('Print', (0.6, 0.62, 0.68)),
              ('Stamp', (0.45, 0.24, 0.55)), ('Hole', (0.12, 0.1, 0.08)), ('Stripe', (0.32, 0.22, 0.14)))
    bm = bmesh.new()
    path = [((x, 0.05 * math.sin(x * math.pi), 0.0), 1.0) for x in [-0.5 + 0.125 * k for k in range(9)]]

    def mat(k, i):
        if i == 0:
            return STRIPE if 2 <= k <= 7 else PAPER
        if i == 2:
            return BAND
        if i == 3:
            return STAMP if k in (6, 7) else (PRINT if k in (2, 3, 4) else PAPER)
        if i == 4:
            return HOLE if k == 7 else PAPER
        return PAPER
    sweep(bm, path, sheet(0.22, 0.006, [0.13, -0.12]), mat)
    return finish(bpy, bm, 'Ticket', colors)


def lighter():
    """A cheap plastic lighter, out of gas: a red body, a steel hood with vent holes, the
    flint wheel and the gas lever on top."""
    RED, RED_DARK, STEEL, STEEL_DARK, BLACK = range(5)
    colors = (('Plastic', (0.78, 0.16, 0.12)), ('PlasticDark', (0.48, 0.08, 0.06)), ('Steel', (0.8, 0.82, 0.84)),
              ('SteelDark', (0.45, 0.47, 0.5)), ('Black', (0.08, 0.07, 0.07)))
    bm = bmesh.new()
    W, D, C = 0.24, 0.13, 0.05

    def outline(s, z):
        pts = [(W, -D + C), (W, D - C), (W - C, D), (-W + C, D), (-W, D - C), (-W, -D + C), (-W + C, -D), (W - C, -D)]
        return [(x * s, y * s, z) for x, y in pts]
    loft(bm, [outline(0.9, 0.0), outline(1.0, 0.04), outline(1.0, 0.6), outline(0.97, 0.62)],
         lambda k, i: RED_DARK if k in (0, 1) else (RED if i % 4 else RED_DARK))
    loft(bm, [outline(1.03, 0.58), outline(1.03, 0.8)], lambda k, i: STEEL if k == 2 else (STEEL if i % 2 else STEEL_DARK))
    for row in (0.66, 0.72):
        for x in (-0.15, -0.05, 0.05, 0.15):
            face_toward(bm, [bm.verts.new((x + dx, -D * 1.03 - 0.002, row + dz)) for dx, dz in ((-0.025, -0.018), (0.025, -0.018), (0.025, 0.018), (-0.025, 0.018))],
                        (0, -1, 0), BLACK)
    lathe(bm, [(0.0, -0.06), (0.075, -0.06), (0.075, 0.06), (0.0, 0.06)], 10, lambda k, i: STEEL_DARK if i % 2 else STEEL,
          centre=(-0.1, 0, 0.84), axis='y')
    box(bm, (0.02, -0.09, 0.8), (0.21, 0.09, 0.85), {'all': BLACK, '+z': STEEL_DARK})
    return _finish_decals(bm, 'Lighter', colors, BLACK)


def battery():
    """A flat AA cell lying on its side: a dark wrap with a band and a plus sign, steel ends,
    and a white crust of leaked electrolyte at the minus end."""
    STEEL, STEEL_LIGHT, WRAP, BAND, CRUST = range(5)
    colors = (('Steel', (0.72, 0.74, 0.77)), ('SteelLight', (0.88, 0.89, 0.9)), ('Wrap', (0.16, 0.36, 0.26)),
              ('Band', (0.86, 0.72, 0.3)), ('Crust', (0.86, 0.88, 0.8)))
    bm = bmesh.new()
    prof = [(0.0, -0.5), (0.17, -0.5), (0.18, -0.485), (0.18, -0.1), (0.18, 0.06), (0.18, 0.42), (0.17, 0.435),
            (0.075, 0.435), (0.07, 0.49), (0.0, 0.49)]
    lathe(bm, prof, 12, lambda k, i: {3: WRAP, 4: BAND, 5: WRAP, 9: STEEL_LIGHT}.get(k, STEEL), axis='x')
    box(bm, (0.24, -0.192, -0.012), (0.34, -0.17, 0.012), BAND)
    box(bm, (0.278, -0.192, -0.05), (0.302, -0.17, 0.05), BAND)
    for a, r in ((200, 0.035), (250, 0.028), (300, 0.03)):
        t = math.radians(a)
        lathe(bm, [(0.0, -0.02), (r, -0.01), (r * 0.7, 0.02), (0.0, 0.03)], 5, lambda k, i: CRUST,
              centre=(-0.5, 0.17 * math.cos(t), 0.17 * math.sin(t)), axis='x')
    return finish(bpy, bm, 'Battery', colors)


def paperclip():
    """A steel paper clip: one wire bent in three turns, with a speck of rust."""
    STEEL, STEEL_DARK, RUST = range(3)
    colors = (('Steel', (0.8, 0.82, 0.85)), ('SteelDark', (0.5, 0.52, 0.56)), ('Rust', (0.55, 0.3, 0.15)))
    bm = bmesh.new()

    def arc(cx, cz, r, a0, a1, n):
        return [(cx + r * math.cos(math.radians(a0 + (a1 - a0) * s / n)), cz + r * math.sin(math.radians(a0 + (a1 - a0) * s / n))) for s in range(n + 1)]
    line = ([(0.22, -0.06)] + arc(-0.36, 0.0, 0.06, 270, 90, 6) + arc(0.44, -0.03, 0.09, 90, -90, 6)
            + arc(-0.5, 0.0, 0.12, 270, 90, 8) + [(0.3, 0.12)])
    sweep(bm, [((x, 0, z), 1.0) for x, z in line], [(0.02 * math.cos(a), 0.02 * math.sin(a)) for a in [2 * math.pi * (s + 0.5) / 6 for s in range(6)]],
          lambda k, i: RUST if k in (16, 17) and i < 3 else (STEEL if i % 2 else STEEL_DARK))
    return finish(bpy, bm, 'Paperclip', colors)


def icestick():
    """A wooden ice-cream stick with rounded ends, still brown with chocolate at the end that
    was in the ice cream, a drip running down towards the clean handle; tilted, end up."""
    WOOD, WOOD_DARK, CHOC, CHOC_DARK = range(4)
    colors = (('Wood', (0.88, 0.74, 0.52)), ('WoodDark', (0.66, 0.5, 0.31)), ('Choc', (0.42, 0.24, 0.14)), ('ChocDark', (0.3, 0.16, 0.09)))
    bm = bmesh.new()
    L, R, W, T, c = 0.43, 0.07, 0.07, 0.02, 0.009
    # Swept along x: u is the width (z), v the thickness (side 2 faces -y, side 6 +y). The
    # rounded ends narrow the width along a quarter circle.
    section = [(W, -T + c), (W, T - c), (W - c, T), (-W + c, T), (-W, T - c), (-W, -T + c), (-W + c, -T), (W - c, -T)]
    ends = [math.radians(a) for a in (80, 60, 35)]
    xs = [(-(L + R * math.sin(a)), math.cos(a)) for a in ends]
    xs += [(x, 1.0) for x in (-L, -0.25, -0.1, -0.02, 0.04, 0.1, 0.25, L)]
    xs += [(L + R * math.sin(a), math.cos(a)) for a in reversed(ends)]
    # Where the chocolate starts on each side, so its edge is ragged.
    stain = {2: -0.08, 6: 0.04, 0: 0.0, 4: 0.05}

    def mat(k, i):
        if k == 0:
            return WOOD_DARK
        if k == len(xs):
            return CHOC_DARK
        flat = i in (2, 6)
        if (xs[k - 1][0] + xs[k][0]) / 2 > stain.get(i, 0.02):
            return CHOC if flat else CHOC_DARK
        return WOOD if flat else WOOD_DARK
    sweep(bm, [((x, 0.0, 0.0), (s, 1.0)) for x, s in xs], section, mat)
    drip = [(-0.1, 0.04), (-0.1, -0.03), (-0.15, -0.035), (-0.215, -0.015), (-0.2, 0.012), (-0.15, 0.025)]
    face_toward(bm, [bm.verts.new((x, -T - 0.002, z)) for x, z in drip], (0, -1, 0), CHOC)
    drop = [(0.04, -0.055), (0.04, 0.0), (-0.01, -0.01), (-0.045, -0.035), (-0.02, -0.058)]
    face_toward(bm, [bm.verts.new((x, T + 0.002, z)) for x, z in drop], (0, 1, 0), CHOC)
    rotate(bm.verts, math.radians(-20), (0, 1, 0))
    return _finish_decals(bm, 'Icestick', colors, CHOC)


def rubberband():
    """A tan rubber band, dropped in a lazy, twisted loop."""
    RUBBER, RUBBER_DARK = range(2)
    colors = (('Rubber', (0.84, 0.6, 0.36)), ('RubberDark', (0.62, 0.4, 0.22)))
    bm = bmesh.new()
    n = 20
    path = []
    for s in range(n + 1):
        a = 2 * math.pi * s / n
        r = 0.42 + 0.07 * math.sin(3 * a + 0.6)
        path.append(((1.2 * r * math.cos(a), 0.06 * math.sin(2 * a), 0.72 * r * math.sin(a)), 1.0))
    sweep(bm, path, [(-0.022, -0.035), (0.022, -0.035), (0.022, 0.035), (-0.022, 0.035)], lambda k, i: RUBBER if i % 2 else RUBBER_DARK)
    return finish(bpy, bm, 'Rubberband', colors)


def bottlecap():
    """A blue plastic screw cap, ribbed round the side, hollow underneath, its tamper ring
    torn open; tipped towards the viewer so it shows its top, then its inside, as it turns."""
    BLUE, BLUE_DARK, BLUE_LIGHT, INSIDE = range(4)
    colors = (('Plastic', (0.2, 0.44, 0.8)), ('PlasticDark', (0.1, 0.26, 0.52)), ('PlasticLight', (0.42, 0.62, 0.92)),
              ('Inside', (0.08, 0.16, 0.32)))
    bm = bmesh.new()
    N = 24

    def ribbed(z, s=1.0):
        return [((0.5 if i % 2 else 0.45) * s * math.cos(2 * math.pi * i / N), (0.5 if i % 2 else 0.45) * s * math.sin(2 * math.pi * i / N), z) for i in range(N)]

    def round_(r, z):
        return [(r * math.cos(2 * math.pi * i / N), r * math.sin(2 * math.pi * i / N), z) for i in range(N)]
    # Inside up from the open end, round the bottom rim, up the ribbed side and over the
    # top, which is dished a little in the middle.
    loft(bm, [round_(0.4, 0.36), round_(0.4, 0.0), ribbed(0.0), ribbed(0.42), ribbed(0.445, 0.95), round_(0.42, 0.46),
              round_(0.32, 0.46), round_(0.3, 0.445)],
         lambda k, i: {0: INSIDE, 1: INSIDE, 2: BLUE_DARK, 6: BLUE_LIGHT, 7: BLUE_DARK, 8: BLUE}.get(k, BLUE))
    ring = [((0.48 * math.cos(math.radians(a)), 0.48 * math.sin(math.radians(a)), -0.07), 1.0) for a in range(20, 341, 20)]
    sweep(bm, ring, [(-0.03, -0.018), (0.03, -0.018), (0.03, 0.018), (-0.03, 0.018)], lambda k, i: BLUE if i % 2 else BLUE_DARK)
    rotate(bm.verts, math.radians(60), (1, 0, 0), pivot=(0, 0, 0.2))
    return finish(bpy, bm, 'Bottlecap', colors)


def receipt():
    """A faded till receipt curling up at one end, the print gone pale grey."""
    PAPER, PAPER_BACK, PRINT = range(3)
    colors = (('Paper', (0.94, 0.93, 0.87)), ('PaperBack', (0.82, 0.81, 0.75)), ('Print', (0.7, 0.7, 0.68)))
    bm = bmesh.new()
    # The flat run: a thin band for each printed line, then a wider gap, unevenly.
    xs, x = [-0.62], -0.62
    for gap in (0.05, 0.08, 0.04, 0.1, 0.05, 0.07, 0.04, 0.12, 0.05, 0.08):
        x += 0.022
        xs.append(x)
        x += gap
        xs.append(x)
    path = [((x, 0.0, 0.0), 1.0) for x in xs]
    end = xs[-1]
    for s in range(1, 15):
        a = math.radians(-90 + 30 * s)
        r = 0.16 - 0.006 * s
        path.append(((end + r * math.cos(a), 0.16 + r * math.sin(a), 0.0), 1.0))
    lines = {k for k in range(1, len(xs)) if k % 2 == 1}

    def mat(k, i):
        if i == 0:
            return PAPER_BACK
        if i == 3 and k in lines:
            return PRINT
        if i == 4 and k in (15, 17):     # the total, set apart near the bottom
            return PRINT
        return PAPER
    sweep(bm, path, sheet(0.26, 0.006, [0.14, -0.12]), mat)
    return finish(bpy, bm, 'Receipt', colors)


def _finish_decals(bm, name, colors, decal):
    """Orients every closed part and leaves the painted decals (lone faces) facing as they
    were built."""
    marks = {f for f in bm.faces if f.material_index == decal and all(len(e.link_faces) == 1 for e in f.edges)}
    bmesh.ops.recalc_face_normals(bm, faces=[f for f in bm.faces if f not in marks])
    return finish(bpy, bm, name, colors, recalc=False)


JUNK = {
    'button': button, 'pulltab': pulltab, 'ticket': ticket, 'lighter': lighter, 'battery': battery,
    'paperclip': paperclip, 'icestick': icestick, 'rubberband': rubberband, 'bottlecap': bottlecap, 'receipt': receipt,
}

for o in list(bpy.data.objects):
    bpy.data.objects.remove(o)
# JUNK_ONLY=<id> builds just that one, for a contact sheet of it alone.
only = os.environ.get('JUNK_ONLY')
for jid, build in JUNK.items():
    if only and jid != only:
        continue
    ob = build()
    export_model(ob, f'junk_{jid}', os.path.join(ROOT, 'js', 'render', 'models', f'junk-{jid}.js'), 'scripts/blender/junk.py')
