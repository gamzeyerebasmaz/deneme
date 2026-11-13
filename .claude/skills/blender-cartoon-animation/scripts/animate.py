"""Keyframe helpers and ready-made cartoon actions for the rig from character.py.

Rotation conventions for that rig (degrees, pose-bone local Euler XYZ):
  hips/spine/head  +X lean forward,  +Y twist,      +Z tilt sideways
  thigh.*          -X leg forward,   +X leg back
  shin.*           +X bend knee (foot goes back)
  arm.*            +X arm forward,   -X arm back;   raise sideways: arm.L +Z, arm.R -Z
  root             location (x, y, z) == world axes; character faces -Y
  eyes             scale Z -> blink
"""
import math

import bpy

from compat import iter_fcurves

RAD = math.radians


# --------------------------------------------------------------------------- low level

def key(rig, bone, frame, rot=None, loc=None, scale=None):
    """Key one pose bone. rot in degrees (XYZ Euler)."""
    pb = rig.pose.bones[bone]
    if rot is not None:
        pb.rotation_euler = [RAD(a) for a in rot]
        pb.keyframe_insert("rotation_euler", frame=frame, group=bone)
    if loc is not None:
        pb.location = loc
        pb.keyframe_insert("location", frame=frame, group=bone)
    if scale is not None:
        pb.scale = scale
        pb.keyframe_insert("scale", frame=frame, group=bone)


def key_pose(rig, frame, pose):
    """pose = {bone: {"rot": (...), "loc": (...), "scale": (...)}}"""
    for bone, channels in pose.items():
        key(rig, bone, frame, **channels)


def mirror_pose(pose):
    """Swap .L/.R and flip sideways rotations, e.g. to derive the 2nd half of a walk."""
    out = {}
    for bone, ch in pose.items():
        new = dict(ch)
        if "rot" in ch:
            x, y, z = ch["rot"]
            new["rot"] = (x, -y, -z)
        if bone.endswith(".L"):
            bone = bone[:-2] + ".R"
        elif bone.endswith(".R"):
            bone = bone[:-2] + ".L"
        out[bone] = new
    return out


def squash(amount):
    """Volume-preserving scale for the root bone: amount <1 squash, >1 stretch (world Z)."""
    side = 1.0 / math.sqrt(amount)
    return (side, side, amount)


def set_interpolation(rig, interpolation="BEZIER", easing="AUTO", data_path_filter=None):
    """interpolation: CONSTANT (stepped / 'on twos' look), LINEAR, BEZIER, BACK, ELASTIC, BOUNCE..."""
    for fc in iter_fcurves(rig):
        if data_path_filter and data_path_filter not in fc.data_path:
            continue
        for kp in fc.keyframe_points:
            kp.interpolation = interpolation
            kp.easing = easing


def make_cyclic(rig, exclude=()):
    """Loop every F-curve with a Cycles modifier (except data paths containing `exclude`)."""
    for fc in iter_fcurves(rig):
        if any(e in fc.data_path for e in exclude):
            continue
        if not any(m.type == "CYCLES" for m in fc.modifiers):
            fc.modifiers.new("CYCLES")


def clear_animation(rig):
    if rig.animation_data:
        rig.animation_data_clear()
    for pb in rig.pose.bones:
        pb.location = (0, 0, 0)
        pb.rotation_euler = (0, 0, 0)
        pb.scale = (1, 1, 1)


# --------------------------------------------------------------------------- actions

def walk_cycle(rig, start=1, cycle=24, stride=0.65, travel_cycles=4, bounce=0.05):
    """Classic 8-key walk (contact / down / passing / up, x2), looped.

    cycle  = frames for two steps (24 @24fps = brisk cartoon walk, 32 = relaxed)
    stride = distance travelled per step (root moves 2*stride per cycle)
    """
    q = cycle / 8.0  # contact, down, passing, up -> every cycle/8 frames
    contact = {
        "hips":    {"loc": (0, 0, 0), "rot": (0, 6, 0)},
        "spine":   {"rot": (4, -8, 0)},
        "head":    {"rot": (-3, 2, 0)},
        "thigh.L": {"rot": (-28, 0, 0)}, "shin.L": {"rot": (4, 0, 0)},
        "thigh.R": {"rot": (22, 0, 0)},  "shin.R": {"rot": (18, 0, 0)},
        "arm.L":   {"rot": (-30, 0, 4)}, "arm.R":  {"rot": (30, 0, -4)},
    }
    down = {
        "hips":    {"loc": (0, -bounce, 0), "rot": (0, 4, 0)},
        "spine":   {"rot": (6, -5, 0)},
        "head":    {"rot": (-4, 1, 0)},
        "thigh.L": {"rot": (-18, 0, 0)}, "shin.L": {"rot": (20, 0, 0)},
        "thigh.R": {"rot": (28, 0, 0)},  "shin.R": {"rot": (45, 0, 0)},
        "arm.L":   {"rot": (-22, 0, 4)}, "arm.R":  {"rot": (22, 0, -4)},
    }
    passing = {
        "hips":    {"loc": (0, 0, 0), "rot": (0, 0, 0)},
        "spine":   {"rot": (4, 0, 0)},
        "head":    {"rot": (-3, 0, 0)},
        "thigh.L": {"rot": (2, 0, 0)},   "shin.L": {"rot": (4, 0, 0)},
        "thigh.R": {"rot": (-10, 0, 0)}, "shin.R": {"rot": (70, 0, 0)},
        "arm.L":   {"rot": (0, 0, 4)},   "arm.R":  {"rot": (0, 0, -4)},
    }
    up = {
        "hips":    {"loc": (0, bounce * 0.8, 0), "rot": (0, -3, 0)},
        "spine":   {"rot": (3, 4, 0)},
        "head":    {"rot": (-2, -1, 0)},
        "thigh.L": {"rot": (18, 0, 0)},  "shin.L": {"rot": (8, 0, 0)},
        "thigh.R": {"rot": (-26, 0, 0)}, "shin.R": {"rot": (35, 0, 0)},
        "arm.L":   {"rot": (18, 0, 4)},  "arm.R":  {"rot": (-18, 0, -4)},
    }
    first_half = [contact, down, passing, up]
    sequence = first_half + [mirror_pose(p) for p in first_half] + [contact]
    for i, pose in enumerate(sequence):
        key_pose(rig, round(start + i * q), pose)

    make_cyclic(rig, exclude=("pose.bones[\"root\"]",))

    # Root travels forward (-Y) at constant speed.
    distance = 2 * stride * travel_cycles
    key(rig, "root", start, loc=(0, 0, 0))
    key(rig, "root", start + cycle * travel_cycles, loc=(0, -distance, 0))
    for fc in iter_fcurves(rig):
        if fc.data_path == 'pose.bones["root"].location':
            for kp in fc.keyframe_points:
                kp.interpolation = "LINEAR"
            fc.extrapolation = "LINEAR"
    return start + cycle * travel_cycles


def jump(rig, start=1, height=1.2):
    """Anticipation -> stretch -> hang -> stretch -> squash on landing -> overshoot -> settle."""
    f = start
    crouch = {"thigh.L": {"rot": (-35, 0, 0)}, "thigh.R": {"rot": (-35, 0, 0)},
              "shin.L": {"rot": (60, 0, 0)}, "shin.R": {"rot": (60, 0, 0)},
              "hips": {"loc": (0, -0.22, 0), "rot": (18, 0, 0)}, "spine": {"rot": (15, 0, 0)},
              "arm.L": {"rot": (-50, 0, 10)}, "arm.R": {"rot": (-50, 0, -10)}}
    straight = {b: {"rot": (0, 0, 0)} for b in ("thigh.L", "thigh.R", "shin.L", "shin.R", "spine")}
    straight["hips"] = {"loc": (0, 0, 0), "rot": (0, 0, 0)}
    reach = dict(straight, **{"arm.L": {"rot": (20, 0, 120)}, "arm.R": {"rot": (20, 0, -120)},
                              "head": {"rot": (-15, 0, 0)}})
    tuck = dict(reach, **{"thigh.L": {"rot": (-40, 0, 0)}, "thigh.R": {"rot": (-30, 0, 0)},
                          "shin.L": {"rot": (70, 0, 0)}, "shin.R": {"rot": (60, 0, 0)},
                          "head": {"rot": (0, 0, 0)}})
    rest = dict(straight, **{"arm.L": {"rot": (0, 0, 0)}, "arm.R": {"rot": (0, 0, 0)},
                             "head": {"rot": (0, 0, 0)}})

    timeline = [  # (frame offset, body pose, root z, root squash)
        (0,  rest,   0.0,          1.0),
        (8,  crouch, 0.0,          0.85),   # anticipation (slow in)
        (11, reach,  height * 0.3, 1.2),    # take-off: stretch
        (18, tuck,   height,       1.0),    # apex: hang time
        (24, reach,  height * 0.3, 1.15),   # falling: stretch
        (26, crouch, 0.0,          0.75),   # impact: squash
        (30, rest,   0.0,          1.06),   # overshoot
        (34, rest,   0.0,          1.0),    # settle
    ]
    for off, pose, z, sq in timeline:
        key_pose(rig, f + off, pose)
        key(rig, "root", f + off, loc=(0, 0, z), scale=squash(sq))
    return f + 34


def idle_breathe(rig, start=1, length=48):
    """Subtle loopable idle: breathing in the spine, gentle head bob."""
    for off, s, h in ((0, 0, 0), (length // 2, 1, 1), (length, 0, 0)):
        key(rig, "spine", start + off, rot=(-3 * s, 0, 0), scale=(1 + 0.03 * s, 1 + 0.02 * s, 1 + 0.03 * s))
        key(rig, "head", start + off, rot=(4 * h - 2, 0, 0))
    make_cyclic(rig)
    return start + length


def wave(rig, start=1, waves=3, side="R"):
    """Raise an arm and wave (overlapping action: the head tilts toward it)."""
    sign = -1 if side == "R" else 1
    arm = f"arm.{side}"
    key(rig, arm, start, rot=(0, 0, 0))
    key(rig, arm, start + 6, rot=(10, 0, sign * 130))
    f = start + 6
    for _ in range(waves):
        key(rig, arm, f + 4, rot=(10, 0, sign * 105))
        key(rig, arm, f + 8, rot=(10, 0, sign * 135))
        f += 8
    key(rig, arm, f + 8, rot=(0, 0, 0))
    key(rig, "head", start, rot=(0, 0, 0))
    key(rig, "head", start + 8, rot=(-4, 0, -sign * 8))
    key(rig, "head", f + 8, rot=(0, 0, 0))
    return f + 8


def blink(rig, frame):
    """3-frame blink (open -> closed -> open) on the eyes bone."""
    key(rig, "eyes", frame - 2, scale=(1, 1, 1))
    key(rig, "eyes", frame, scale=(1, 1, 0.08))
    key(rig, "eyes", frame + 2, scale=(1, 1, 1))


def blink_every(rig, start, end, every=60):
    f = start + every // 2
    while f < end:
        blink(rig, f)
        f += every
