"""Low-poly Fokker Dr.I triplane in the all-red colours of Manfred von Richthofen, for the
gallery (not part of the game): a box fuselage behind a round rotary cowling, three thick
cantilever wings joined by I-struts, twin guns, a white comma rudder, Balkenkreuze on white
fields, and the propeller as a part of its own that spins about its hub.

  blender -b --factory-startup -P scripts/blender/fokker.py

Writes gallery/models/fokker.js (the aeroplane) and gallery/models/fokker-prop.js (the
propeller, with its pivot). Blender axes: x along the span, -y forward, z up; one unit is
about a metre.
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
from shapes import lathe, slab, box, sweep, loft, rotate, move, new_verts, finish  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(ROOT, 'gallery', 'models')

RED, RED_DARK, WHITE, BLACK, ENGINE, METAL, TYRE = range(7)
COLORS = (('Red', (0.74, 0.1, 0.08)), ('RedDark', (0.48, 0.06, 0.05)), ('White', (0.92, 0.9, 0.84)),
          ('Black', (0.07, 0.06, 0.06)), ('Engine', (0.24, 0.23, 0.23)), ('Metal', (0.62, 0.62, 0.64)),
          ('Tyre', (0.16, 0.15, 0.14)))
WOOD, WOOD_DARK, HUB = range(3)
PROP_COLORS = (('Wood', (0.6, 0.37, 0.17)), ('WoodDark', (0.38, 0.21, 0.09)), ('Hub', (0.55, 0.55, 0.57)))

PROP_AT = (0.0, -2.66, 0.0)       # the propeller's hub

# ---- Fuselage ---------------------------------------------------------------------------
# Stations from the cowling back to the tail: (y, half width, bottom, top).
STATIONS = [(-2.05, 0.44, -0.44, 0.44), (-1.45, 0.42, -0.5, 0.42), (-0.9, 0.4, -0.48, 0.41), (-0.35, 0.37, -0.45, 0.4),
            (0.2, 0.33, -0.4, 0.36), (0.75, 0.29, -0.34, 0.31), (1.3, 0.23, -0.27, 0.25), (1.9, 0.16, -0.2, 0.18),
            (2.6, 0.09, -0.12, 0.11), (3.2, 0.03, -0.05, 0.06)]
COCKPIT = (4, 5)                    # the bands left open on top for the pilot


def section(y, w, z0, z1):
    """Eight points round the fuselage: flat sides, a narrower keel, a rounded deck. Side 1
    is the right flank, side 3 the top, side 5 the left flank, side 7 the bottom."""
    pts = [(0.8 * w, z0), (w, z0 + 0.08), (w, z1 - 0.1), (0.5 * w, z1), (-0.5 * w, z1), (-w, z1 - 0.1), (-w, z0 + 0.08), (-0.8 * w, z0)]
    return [(x, y, z) for x, z in pts]


# ---- Wings --------------------------------------------------------------------------------
# Upper surface from the leading edge back, then the lower surface forward: (chord fraction,
# height as a fraction of the chord). The thick section of the Dr.I's cantilever wings.
UPPER = [(0.0, 0.0), (0.06, 0.055), (0.18, 0.085), (0.32, 0.095), (0.5, 0.09), (0.68, 0.07), (0.82, 0.045), (0.92, 0.025), (1.0, 0.0)]
LOWER = [(0.85, -0.01), (0.6, -0.025), (0.35, -0.035), (0.15, -0.03), (0.05, -0.018)]
AIRFOIL = UPPER + LOWER
# (z, half span, leading edge y, chord, cross on top?, cross underneath?)
WINGS = [(1.32, 3.6, -1.35, 1.0, True, False), (0.52, 3.1, -1.2, 1.0, False, False), (-0.38, 2.85, -1.05, 1.0, False, True)]
# A Balkenkreuz on a white field, near each tip: (half width in span, chord from, chord to).
FIELD = (0.44, 0.06, 0.92)
BAR_SPAN = (0.34, 0.32, 0.68)       # the arm along the span
BAR_CHORD = (0.11, 0.18, 0.82)      # the arm along the chord
CROSS_AT = 0.72                     # the crosses' centres, as a fraction of the half span


def cross_mat(dx, f0, f1):
    """Colour of the patch [f0, f1] of chord at dx from a cross's centre along the span."""
    fm = (f0 + f1) / 2
    adx = abs(dx)
    if adx < BAR_SPAN[0] and BAR_SPAN[1] <= fm <= BAR_SPAN[2]:
        return BLACK
    if adx < BAR_CHORD[0] and BAR_CHORD[1] <= fm <= BAR_CHORD[2]:
        return BLACK
    if adx < FIELD[0] and FIELD[1] <= fm <= FIELD[2]:
        return WHITE
    return None


def wing(bm, z, half, le, chord, top, under, thick=1.0):
    centres = [-half * CROSS_AT, half * CROSS_AT] if (top or under) else []
    xs = [-half, -half + 0.12]
    for c in centres:
        for d in (-FIELD[0], -BAR_SPAN[0], -BAR_CHORD[0], BAR_CHORD[0], BAR_SPAN[0], FIELD[0]):
            xs.append(c + d)
    xs += [half - 0.12, half, 0.0]
    xs = sorted(set(round(x, 4) for x in xs))
    rings = []
    for x in xs:
        tip = 1.0 if abs(x) < half - 0.01 else 0.7     # the tips taper a little
        rings.append([(x, le + chord * (1 - tip) / 2 + f * chord * tip, z + h * chord * thick * tip) for f, h in AIRFOIL])
    n = len(AIRFOIL)

    def mat(k, i):
        if k == 0 or k == len(rings):
            return RED_DARK
        x = (xs[k - 1] + xs[k]) / 2
        f0, f1 = AIRFOIL[i][0], AIRFOIL[(i + 1) % n][0]
        is_top = i < len(UPPER) - 1
        if (is_top and top) or (not is_top and under):
            for c in centres:
                m = cross_mat(x - c, min(f0, f1), max(f0, f1))
                if m is not None:
                    return m
        return RED if is_top else RED_DARK
    loft(bm, rings, mat)


def side_cross(bm, x, y, z, size, toward):
    """A Balkenkreuz on a white square, standing on the fuselage's flank (toward = +1 or -1)."""
    s = size / 2
    a, t = s * 0.78, s * 0.24
    plus = [(-t, -a), (t, -a), (t, -t), (a, -t), (a, t), (t, t), (t, a), (-t, a), (-t, t), (-a, t), (-a, -t), (-t, -t)]
    for outline, thick, mat in (([(-s, -s), (s, -s), (s, s), (-s, s)], 0.012, WHITE), (plus, 0.022, BLACK)):
        part = new_verts(bm, lambda b: slab(b, outline, thick, mat))
        rotate(part, math.pi / 2, (0, 0, 1))
        move(part, (x, y, z))


def build():
    bm = bmesh.new()
    # Fuselage, open on top at the cockpit.
    rings = [section(*s) for s in STATIONS]
    loft(bm, rings, lambda k, i: BLACK if (k in COCKPIT and i == 3) else (RED_DARK if i in (0, 6, 7) else RED))
    box(bm, (-0.12, 0.3, 0.36), (0.12, 0.42, 0.52), RED_DARK)                     # the headrest
    for x in (-0.12, 0.12):                                                       # twin guns
        box(bm, (x - 0.035, -1.55, 0.42), (x + 0.035, -0.55, 0.5), BLACK)
        lathe(bm, [(0.0, -1.75), (0.018, -1.75), (0.018, -1.55), (0.0, -1.55)], 5, lambda k, i: METAL, centre=(x, 0, 0.46), axis='y')
    side_cross(bm, 0.25, 1.15, -0.01, 0.44, 1)
    side_cross(bm, -0.25, 1.15, -0.01, 0.44, -1)
    # The rotary cowling, open at the front on the dark engine and its cylinder heads.
    lathe(bm, [(0.0, -2.3), (0.37, -2.3), (0.39, -2.48), (0.47, -2.5), (0.52, -2.4), (0.52, -2.12), (0.46, -2.0), (0.0, -2.0)], 12,
          lambda k, i: ENGINE if k <= 2 else (RED_DARK if k in (3, 7) else RED), axis='y')
    for n in range(9):
        a = 2 * math.pi * n / 9
        cyl = new_verts(bm, lambda b: box(b, (-0.05, -0.04, 0.12), (0.05, 0.04, 0.33), METAL))
        move(cyl, (0, -2.33, 0))
        rotate(cyl, a, (0, 1, 0), pivot=(0, -2.33, 0))
    # Wings, struts and cabane.
    for z, half, le, chord, top, under in WINGS:
        wing(bm, z, half, le, chord, top, under)
    for x in (-2.3, 2.3):
        sweep(bm, [((x, -0.68, -0.35), 1.0), ((x, -0.8, 1.36), 1.0)], [(-0.02, -0.09), (0.02, -0.09), (0.02, 0.09), (-0.02, 0.09)],
              lambda k, i: RED_DARK)
    for sx in (-1, 1):
        for y0, y1 in ((-1.3, -1.12), (-0.55, -0.72)):
            sweep(bm, [((sx * 0.3, y0, 0.36), 0.022), ((sx * 0.42, y1, 1.33), 0.022)], [(-1, -1), (1, -1), (1, 1), (-1, 1)], lambda k, i: METAL)
    # Undercarriage: V struts, the little axle wing and the wheels.
    for sx in (-1, 1):
        for y0 in (-1.35, -0.6):
            sweep(bm, [((sx * 0.3, y0, -0.45), 0.025), ((sx * 0.72, -0.95, -1.12), 0.025)], [(-1, -1), (1, -1), (1, 1), (-1, 1)], lambda k, i: METAL)
        lathe(bm, [(0.0, -0.08), (0.24, -0.08), (0.33, -0.05), (0.33, 0.05), (0.24, 0.08), (0.0, 0.08)], 12,
              lambda k, i: RED if k in (1, 5) else TYRE, centre=(sx * 0.92, -0.95, -1.15), axis='x')
    axle = [[(x, -1.12 + f * 0.42, -1.15 + h * 0.42) for f, h in AIRFOIL] for x in (-0.84, 0.84)]
    loft(bm, axle, lambda k, i: RED_DARK if i >= len(UPPER) - 1 else RED)
    # Tail: the tailplane, the fin-less comma rudder in white with its cross, and the skid.
    plane = [(-1.0, 3.15), (-0.95, 2.92), (-0.3, 2.62), (0.3, 2.62), (0.95, 2.92), (1.0, 3.15), (0.82, 3.42), (-0.82, 3.42)]
    tail = new_verts(bm, lambda b: slab(b, [(x, -y) for x, y in plane], 0.05, RED, bevel=0.012, bevel_mat=RED_DARK))
    rotate(tail, math.pi / 2, (1, 0, 0))
    move(tail, (0, 0, 0.04))
    comma = [(3.12, 0.02), (3.12, 0.78), (3.32, 0.9), (3.58, 0.8), (3.72, 0.48), (3.62, 0.02), (3.46, -0.16), (3.24, -0.12)]
    rudder = new_verts(bm, lambda b: slab(b, comma, 0.05, WHITE, bevel=0.012, bevel_mat=BLACK))
    rotate(rudder, math.pi / 2, (0, 0, 1))
    for sx in (-1, 1):
        side_cross(bm, sx * 0.034, 3.42, 0.36, 0.42, sx)
    sweep(bm, [((0, 2.9, -0.1), 0.02), ((0, 3.1, -0.3), 0.02)], [(-1, -1), (1, -1), (1, 1), (-1, 1)], lambda k, i: METAL)
    return finish(bpy, bm, 'Fokker', COLORS)


def build_prop():
    bm = bmesh.new()
    blade = [(-0.05, 0.06), (0.06, 0.06), (0.11, 0.42), (0.1, 1.05), (0.05, 1.3), (-0.04, 1.28), (-0.08, 0.95), (-0.08, 0.4)]
    for turn in (0.0, math.pi):
        b = new_verts(bm, lambda bb: slab(bb, blade, 0.045, WOOD, bevel=0.012, bevel_mat=WOOD_DARK))
        rotate(b, 0.35, (0, 0, 1))               # the pitch of the blade
        rotate(b, turn, (0, 1, 0))
    lathe(bm, [(0.0, -0.08), (0.07, -0.06), (0.09, 0.0), (0.09, 0.05), (0.0, 0.06)], 8, lambda k, i: HUB, axis='y')
    move(bm.verts, PROP_AT)
    return finish(bpy, bm, 'FokkerProp', PROP_COLORS)


for o in list(bpy.data.objects):
    bpy.data.objects.remove(o)
os.makedirs(OUT, exist_ok=True)
body = build()
prop = build_prop()
export_model(body, 'fokker', os.path.join(OUT, 'fokker.js'), 'scripts/blender/fokker.py')
export_model(prop, 'fokker_prop', os.path.join(OUT, 'fokker-prop.js'), 'scripts/blender/fokker.py', extra={'pivot': PROP_AT})
