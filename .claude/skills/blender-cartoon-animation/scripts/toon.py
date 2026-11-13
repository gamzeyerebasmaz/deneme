"""Cartoon / cel-shaded look: toon materials, outlines, lights, camera, world.

Import from another script (sys.path must contain this folder) or run directly:
    blender -b -P toon.py
"""
import math

import bpy
from mathutils import Vector

from compat import set_eevee


# --------------------------------------------------------------------------- colours

def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def rgba(color):
    """Accept '#RRGGBB' or an sRGB (r, g, b) tuple in 0..1 -> linear RGBA for node sockets.

    Pick palettes in sRGB (what colour pickers / hex codes show); Blender sockets are linear.
    """
    if isinstance(color, str):
        h = color.lstrip("#")
        color = tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    return tuple(srgb_to_linear(c) for c in color[:3]) + (1.0,)


# --------------------------------------------------------------------------- materials

def toon_material(name, base, shadow=None, shadow_size=0.45, rim=True):
    """Two-tone cel material: Diffuse -> Shader to RGB -> constant ColorRamp -> Emission.

    base / shadow: '#RRGGBB' or sRGB tuples (see rgba). Default shadow = base darkened and
    pushed slightly toward blue-violet, which reads more "animated" than plain grey-darkening.
    Shader-to-RGB only works in EEVEE; use EEVEE for toon renders.
    shadow_size: ramp threshold, higher = more of the object in shadow.
    """
    base = rgba(base)
    if shadow is None:
        tint = (0.55, 0.5, 0.75)
        shadow = tuple(b * t for b, t in zip(base[:3], tint)) + (1.0,)
    else:
        shadow = rgba(shadow)

    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.diffuse_color = base  # viewport solid-mode colour
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()

    out = nodes.new("ShaderNodeOutputMaterial"); out.location = (900, 0)
    diffuse = nodes.new("ShaderNodeBsdfDiffuse"); diffuse.location = (-400, 0)
    to_rgb = nodes.new("ShaderNodeShaderToRGB"); to_rgb.location = (-200, 0)
    ramp = nodes.new("ShaderNodeValToRGB"); ramp.location = (0, 0)
    ramp.color_ramp.interpolation = "CONSTANT"
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color = shadow
    ramp.color_ramp.elements[1].position = shadow_size
    ramp.color_ramp.elements[1].color = base
    emit = nodes.new("ShaderNodeEmission"); emit.location = (650, 0)

    links.new(diffuse.outputs["BSDF"], to_rgb.inputs["Shader"])
    links.new(to_rgb.outputs["Color"], ramp.inputs["Fac"])
    color_socket = ramp.outputs["Color"]

    if rim:  # thin bright rim from a Fresnel/Layer Weight mask, very "cartoon"
        lw = nodes.new("ShaderNodeLayerWeight"); lw.location = (0, -300)
        lw.inputs["Blend"].default_value = 0.25
        rim_ramp = nodes.new("ShaderNodeValToRGB"); rim_ramp.location = (200, -300)
        rim_ramp.color_ramp.interpolation = "CONSTANT"
        rim_ramp.color_ramp.elements[1].position = 0.7
        mix = nodes.new("ShaderNodeMix"); mix.location = (420, 0)
        mix.data_type = "RGBA"
        mix.blend_type = "SCREEN"
        links.new(lw.outputs["Facing"], rim_ramp.inputs["Fac"])
        links.new(color_socket, mix.inputs[6])                 # A (RGBA)
        mix.inputs[7].default_value = (0.35, 0.35, 0.35, 1.0)  # B (RGBA): rim tint
        # Factor = rim mask * 0.6 so the rim stays subtle.
        mult = nodes.new("ShaderNodeMath"); mult.location = (300, -450)
        mult.operation = "MULTIPLY"
        mult.inputs[1].default_value = 0.6
        links.new(rim_ramp.outputs["Color"], mult.inputs[0])
        links.new(mult.outputs["Value"], mix.inputs["Factor"])
        color_socket = mix.outputs[2]  # Result (RGBA)

    links.new(color_socket, emit.inputs["Color"])
    links.new(emit.outputs["Emission"], out.inputs["Surface"])
    return mat


def flat_material(name, color):
    """Unlit flat colour (eyes, pupils, mouths, outlines)."""
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.diffuse_color = rgba(color)
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()
    out = nodes.new("ShaderNodeOutputMaterial")
    emit = nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value = rgba(color)
    links.new(emit.outputs["Emission"], out.inputs["Surface"])
    return mat


def outline_material(color="#1B1530"):
    """Back-face-culled unlit shell that must NOT cast shadows (it encloses the mesh:
    a shadow-casting hull would put the whole character in its own shadow)."""
    mat = flat_material("Toon_Outline", color)
    mat.use_backface_culling = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    out = next(n for n in nodes if n.type == "OUTPUT_MATERIAL")
    emit = next(n for n in nodes if n.type == "EMISSION")
    path = nodes.new("ShaderNodeLightPath")
    clear = nodes.new("ShaderNodeBsdfTransparent")
    mix = nodes.new("ShaderNodeMixShader")
    links.new(path.outputs["Is Shadow Ray"], mix.inputs["Fac"])
    links.new(emit.outputs["Emission"], mix.inputs[1])
    links.new(clear.outputs["BSDF"], mix.inputs[2])
    links.new(mix.outputs["Shader"], out.inputs["Surface"])
    if hasattr(mat, "use_backface_culling_shadow"):   # EEVEE 4.2+
        mat.use_backface_culling_shadow = True
        mat.use_transparent_shadow = True
    if hasattr(mat, "shadow_method"):                 # legacy EEVEE (<4.2)
        mat.shadow_method = "NONE"
    return mat


def assign(obj, mat):
    obj.data.materials.clear()
    obj.data.materials.append(mat)


# --------------------------------------------------------------------------- outlines

def add_outline(obj, thickness=0.015):
    """Inverted-hull outline: Solidify with flipped normals + back-face-culled black material.

    Works in EEVEE and Cycles, survives deformation, per-object thickness control.
    """
    if obj.type != "MESH":
        return None
    mat = outline_material()
    if mat.name not in [m.name for m in obj.data.materials if m]:
        obj.data.materials.append(mat)
    mod = obj.modifiers.get("Outline") or obj.modifiers.new("Outline", "SOLIDIFY")
    mod.thickness = thickness
    mod.offset = 1.0
    mod.use_flip_normals = True
    mod.use_rim = False
    mod.material_offset = len(obj.data.materials) - 1
    return mod


def enable_freestyle(scene, thickness=1.5):
    """Alternative: Freestyle line art (post-process, slower, resolution dependent)."""
    scene.render.use_freestyle = True
    scene.render.line_thickness_mode = "ABSOLUTE"
    scene.render.line_thickness = thickness
    vl = scene.view_layers[0]
    vl.use_freestyle = True
    fs = vl.freestyle_settings
    ls = fs.linesets[0] if fs.linesets else fs.linesets.new("Outline")
    ls.select_by_visibility = True
    ls.select_silhouette = True
    ls.select_border = True
    ls.select_crease = True
    # read_factory_settings(use_empty=True) leaves the default lineset WITHOUT a line style,
    # which renders nothing ("strokes set empty").
    if ls.linestyle is None:
        ls.linestyle = bpy.data.linestyles.new("ToonLines")
    ls.linestyle.color = rgba("#1B1530")[:3]
    ls.linestyle.thickness = thickness


# --------------------------------------------------------------------------- scene

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    return bpy.context.scene


def setup_render(scene, fps=24, frames=(1, 48), resolution=(1920, 1080), percent=100):
    set_eevee(scene)
    scene.render.fps = fps
    scene.frame_start, scene.frame_end = frames
    scene.render.resolution_x, scene.render.resolution_y = resolution
    scene.render.resolution_percentage = percent
    # 'Standard' keeps the exact flat colours; Filmic/AgX would wash out a toon palette.
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    eevee = scene.eevee
    if hasattr(eevee, "taa_render_samples"):
        eevee.taa_render_samples = 16


def setup_world(scene, color="#BFE3F7", ambient=0.0):
    """Sky colour seen by the camera only.

    For cel shading the world must NOT light the scene (ambient=0): any ambient light lifts
    every pixel above the ColorRamp threshold and the shadow band disappears.
    """
    world = scene.world or bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    nodes, links = world.node_tree.nodes, world.node_tree.links
    nodes.clear()
    out = nodes.new("ShaderNodeOutputWorld"); out.location = (400, 0)
    sky = nodes.new("ShaderNodeBackground"); sky.location = (0, 100)
    sky.inputs["Color"].default_value = rgba(color)
    amb = nodes.new("ShaderNodeBackground"); amb.location = (0, -100)
    amb.inputs["Color"].default_value = rgba(color)
    amb.inputs["Strength"].default_value = ambient
    path = nodes.new("ShaderNodeLightPath"); path.location = (-200, 300)
    mix = nodes.new("ShaderNodeMixShader"); mix.location = (200, 0)
    links.new(path.outputs["Is Camera Ray"], mix.inputs["Fac"])
    links.new(amb.outputs["Background"], mix.inputs[1])
    links.new(sky.outputs["Background"], mix.inputs[2])
    links.new(mix.outputs["Shader"], out.inputs["Surface"])
    return world


def add_key_light(energy=4.0, angle_deg=(50, 0, 35)):
    """Toon shading only needs one strong directional light: it decides where the shadow edge is."""
    data = bpy.data.lights.new("KeyLight", "SUN")
    data.energy = energy
    data.angle = math.radians(2)
    obj = bpy.data.objects.new("KeyLight", data)
    bpy.context.scene.collection.objects.link(obj)
    obj.rotation_euler = [math.radians(a) for a in angle_deg]
    return obj


def add_camera(location=(0.0, -9.0, 2.2), target=(0.0, 0.0, 1.1), lens=50):
    data = bpy.data.cameras.new("Camera")
    data.lens = lens
    cam = bpy.data.objects.new("Camera", data)
    bpy.context.scene.collection.objects.link(cam)
    cam.location = location
    look_at(cam, target)
    bpy.context.scene.camera = cam
    return cam


def look_at(obj, target):
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def add_ground(size=40, color="#7CC46A"):
    bpy.ops.mesh.primitive_plane_add(size=size, location=(0, 0, 0))
    ground = bpy.context.active_object
    ground.name = "Ground"
    assign(ground, toon_material("Toon_Ground", color, rim=False))
    return ground


if __name__ == "__main__":
    scene = reset_scene()
    setup_render(scene)
    setup_world(scene)
    add_key_light()
    add_camera()
    add_ground()
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, location=(0, 0, 1))
    ball = bpy.context.active_object
    for p in ball.data.polygons:
        p.use_smooth = True
    assign(ball, toon_material("Toon_Red", "#E8463A"))
    add_outline(ball, 0.03)
