"""Version-compat helpers shared by the skill scripts (Blender 4.2 LTS -> 5.x)."""
import bpy


def set_eevee(scene):
    """Select EEVEE. The enum id was BLENDER_EEVEE_NEXT in 4.2-4.x, BLENDER_EEVEE before/after."""
    for engine in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
        try:
            scene.render.engine = engine
            return engine
        except TypeError:
            continue
    raise RuntimeError("EEVEE render engine not available")


def iter_fcurves(id_data):
    """Return the F-curves of an object's active action.

    Blender 4.4 introduced slotted (layered) actions; 5.0 removed Action.fcurves.
    """
    ad = id_data.animation_data
    if ad is None or ad.action is None:
        return []
    action = ad.action
    layers = getattr(action, "layers", None)
    if layers:
        slot = getattr(ad, "action_slot", None)
        curves = []
        for layer in layers:
            for strip in layer.strips:
                bag = strip.channelbag(slot) if slot is not None else None
                if bag is not None:
                    curves.extend(bag.fcurves)
        return curves
    legacy = getattr(action, "fcurves", None)
    return list(legacy) if legacy is not None else []


def set_video_output(scene, path):
    """Configure H.264 MP4 output. 5.0+ needs media_type='VIDEO' before choosing FFMPEG."""
    settings = scene.render.image_settings
    if hasattr(settings, "media_type"):
        settings.media_type = "VIDEO"
    settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format = "MPEG4"
    scene.render.ffmpeg.codec = "H264"
    scene.render.ffmpeg.constant_rate_factor = "HIGH"
    scene.render.filepath = path


def set_png_output(scene, path):
    settings = scene.render.image_settings
    if hasattr(settings, "media_type"):
        settings.media_type = "IMAGE"
    settings.file_format = "PNG"
    settings.color_mode = "RGBA" if scene.render.film_transparent else "RGB"
    scene.render.filepath = path
