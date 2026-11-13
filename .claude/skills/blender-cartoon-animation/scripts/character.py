"""Build a stylised cartoon character from primitives, rigged to a simple armature.

Every body part is a separate mesh skinned 100% to one bone (rigid skinning via a
vertex group + Armature modifier). No operator-based auto-weighting, so it is
deterministic and works in background mode. Character faces -Y (Blender "Front").

Bones: root > hips > spine > head > eyes, hips > thigh.L/R > shin.L/R, spine > arm.L/R
"""
import bpy
from mathutils import Vector

from toon import add_outline, assign, flat_material, toon_material

# (head, tail, parent, connected) - Z up, units in metres, character ~2.3 m tall
BONES = {
    "root":    ((0, 0, 0),         (0, 0.5, 0),       None,     False),
    "hips":    ((0, 0, 0.85),      (0, 0, 1.1),       "root",   False),
    "spine":   ((0, 0, 1.1),       (0, 0, 1.55),      "hips",   True),
    "head":    ((0, 0, 1.55),      (0, 0, 2.3),       "spine",  True),
    "eyes":    ((0, -0.3, 1.98),   (0, -0.5, 1.98),   "head",   False),
    "thigh.L": ((0.2, 0, 0.85),    (0.2, -0.02, 0.45), "hips",  False),
    "shin.L":  ((0.2, -0.02, 0.45), (0.2, 0, 0.08),   "thigh.L", True),
    "arm.L":   ((0.42, 0, 1.42),   (0.78, 0, 0.95),   "spine",  False),
}


def _mirror(name, data):
    head, tail, parent, conn = data
    flip = lambda v: (-v[0], v[1], v[2])
    rname = name.replace(".L", ".R")
    rparent = parent.replace(".L", ".R") if parent else None
    return rname, (flip(head), flip(tail), rparent, conn)


def all_bones():
    bones = dict(BONES)
    for name, data in BONES.items():
        if name.endswith(".L"):
            rname, rdata = _mirror(name, data)
            bones[rname] = rdata
    return bones


def build_armature(name="Rig"):
    arm = bpy.data.armatures.new(name)
    arm.display_type = "STICK"
    rig = bpy.data.objects.new(name, arm)
    bpy.context.scene.collection.objects.link(rig)
    rig.show_in_front = True

    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bones = all_bones()
    for bname, (head, tail, _parent, _conn) in bones.items():
        eb = arm.edit_bones.new(bname)
        eb.head, eb.tail, eb.roll = head, tail, 0.0
        if bname.startswith("arm."):
            # Local Z -> forward (-Y): local X becomes the forward/back swing axis,
            # matching legs and spine (see "Bone axes" in SKILL.md).
            eb.align_roll((0.0, -1.0, 0.0))
    for bname, (_h, _t, parent, conn) in bones.items():
        if parent:
            eb = arm.edit_bones[bname]
            eb.parent = arm.edit_bones[parent]
            eb.use_connect = conn
    bpy.ops.object.mode_set(mode="OBJECT")
    for pb in rig.pose.bones:
        pb.rotation_mode = "XYZ"  # Euler keys are easier to read/edit for animators
    return rig


def _smooth(obj):
    for poly in obj.data.polygons:
        poly.use_smooth = True


def _skin(obj, rig, bone):
    """Rigidly bind a whole mesh to one bone."""
    vg = obj.vertex_groups.new(name=bone)
    vg.add(list(range(len(obj.data.vertices))), 1.0, "REPLACE")
    mod = obj.modifiers.new("Armature", "ARMATURE")
    mod.object = rig
    obj.parent = rig


def _sphere(name, loc, radius, scale=(1, 1, 1), segments=32):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=segments // 2,
                                         radius=radius, location=loc)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    _smooth(obj)
    return obj


def _limb(name, start, end, radius):
    """Capsule-ish cylinder between two points."""
    start, end = Vector(start), Vector(end)
    vec = end - start
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=radius, depth=vec.length,
                                        location=(start + end) / 2)
    obj = bpy.context.active_object
    obj.name = name
    obj.rotation_euler = Vector((0, 0, 1)).rotation_difference(vec).to_euler()
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    _smooth(obj)
    return obj


def build_character(body_color="#F59A2B", limb_color=None, outline=0.012, name="Toon"):
    """Create rig + meshes. Returns the armature object (animate this)."""
    limb_color = limb_color or body_color
    rig = build_armature(f"{name}_Rig")
    bones = all_bones()

    m_body = toon_material(f"{name}_Body", body_color)
    m_limb = toon_material(f"{name}_Limb", limb_color)
    m_white = flat_material("Toon_EyeWhite", "#FFFFFF")
    m_black = flat_material("Toon_Pupil", "#1B1530")
    m_shoe = toon_material("Toon_Shoe", "#3A4FB8")

    parts = []
    body = _sphere(f"{name}_Body", (0, 0, 1.2), 0.45, (1.0, 0.85, 1.15)); parts.append((body, "spine", m_body))
    head = _sphere(f"{name}_Head", (0, 0, 1.92), 0.4, (1.05, 1.0, 0.95)); parts.append((head, "head", m_body))

    for side, x in (("L", 0.14), ("R", -0.14)):
        eye = _sphere(f"{name}_Eye.{side}", (x, -0.3, 1.98), 0.12, (1, 0.7, 1.25), 24)
        pupil = _sphere(f"{name}_Pupil.{side}", (x * 0.9, -0.385, 1.98), 0.05, (1, 0.6, 1.3), 16)
        parts += [(eye, "eyes", m_white), (pupil, "eyes", m_black)]

        thigh_h, thigh_t = bones[f"thigh.{side}"][:2]
        shin_h, shin_t = bones[f"shin.{side}"][:2]
        arm_h, arm_t = bones[f"arm.{side}"][:2]
        parts.append((_limb(f"{name}_Thigh.{side}", thigh_h, thigh_t, 0.1), f"thigh.{side}", m_limb))
        parts.append((_limb(f"{name}_Shin.{side}", shin_h, shin_t, 0.09), f"shin.{side}", m_limb))
        parts.append((_sphere(f"{name}_Foot.{side}", (shin_t[0], -0.1, 0.07), 0.13, (0.9, 1.5, 0.55), 24),
                      f"shin.{side}", m_shoe))
        parts.append((_limb(f"{name}_Arm.{side}", arm_h, arm_t, 0.07), f"arm.{side}", m_limb))
        parts.append((_sphere(f"{name}_Hand.{side}", arm_t, 0.11, segments=24), f"arm.{side}", m_white))

    for obj, bone, mat in parts:
        assign(obj, mat)
        _skin(obj, rig, bone)  # Armature modifier first so the outline follows the deformation
        if outline and not obj.name.startswith(f"{name}_Pupil"):
            add_outline(obj, outline)

    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    return rig


if __name__ == "__main__":
    from toon import reset_scene
    reset_scene()
    build_character()
