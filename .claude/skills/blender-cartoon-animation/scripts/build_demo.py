"""Build a complete cartoon shot: toon scene + rigged character + animation, then save/render.

    blender -b -P build_demo.py -- --action walk --out /path/shot.blend
    blender -b -P build_demo.py -- --action jump --preview /path/frames/ --preview-frames 1,8,18,26
    blender -b -P build_demo.py -- --action wave --render /path/wave.mp4

Also works with the PyPI `bpy` module:  python build_demo.py --action walk ...
"""
import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bpy  # noqa: E402

import animate  # noqa: E402
import toon  # noqa: E402
from character import build_character  # noqa: E402
from compat import set_png_output, set_video_output  # noqa: E402


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    p = argparse.ArgumentParser()
    p.add_argument("--action", choices=["walk", "jump", "wave", "idle"], default="walk")
    p.add_argument("--color", default="#F59A2B", help="body colour, hex")
    p.add_argument("--fps", type=int, default=24)
    p.add_argument("--res", default="1280x720")
    p.add_argument("--outline", type=float, default=0.012, help="0 disables outlines")
    p.add_argument("--freestyle", action="store_true", help="add Freestyle lines too")
    p.add_argument("--stepped", action="store_true", help="CONSTANT interpolation (on-twos anime look)")
    p.add_argument("--out", help="save .blend here")
    p.add_argument("--render", help="render the animation (.mp4 or folder/prefix_ for PNGs)")
    p.add_argument("--preview", help="folder for still preview frames")
    p.add_argument("--preview-frames", default="")
    return p.parse_args(argv)


def main():
    args = parse_args()
    scene = toon.reset_scene()
    w, h = (int(v) for v in args.res.lower().split("x"))

    toon.setup_world(scene)
    toon.add_key_light()
    toon.add_ground()
    rig = build_character(body_color=args.color,
                          outline=args.outline)

    if args.action == "walk":
        end = animate.walk_cycle(rig, start=1, travel_cycles=3)
        cam = toon.add_camera(location=(9.0, -5.5, 2.0), target=(0, -2.0, 1.1), lens=35)
    elif args.action == "jump":
        end = animate.jump(rig, start=1) + 10
        cam = toon.add_camera(location=(5.0, -8.0, 2.4), target=(0, 0, 1.6), lens=40)
    elif args.action == "wave":
        end = animate.wave(rig, start=1) + 10
        cam = toon.add_camera(location=(2.5, -7.0, 2.0), target=(0, 0, 1.4), lens=50)
    else:
        end = animate.idle_breathe(rig, start=1, length=48)
        cam = toon.add_camera(location=(2.5, -7.0, 2.0), target=(0, 0, 1.4), lens=50)
    animate.blink_every(rig, 1, end, every=50)
    if args.stepped:
        animate.set_interpolation(rig, "CONSTANT")

    toon.setup_render(scene, fps=args.fps, frames=(1, end), resolution=(w, h))
    if args.freestyle:
        toon.enable_freestyle(scene)

    if args.out:
        os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
        bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(args.out))
        print(f"saved {args.out}")

    if args.preview:
        os.makedirs(args.preview, exist_ok=True)
        frames = [int(f) for f in args.preview_frames.split(",") if f] or [1, end // 4, end // 2, 3 * end // 4]
        for f in frames:
            scene.frame_set(f)
            set_png_output(scene, os.path.join(os.path.abspath(args.preview), f"{args.action}_{f:04d}.png"))
            bpy.ops.render.render(write_still=True)
            print(f"preview {scene.render.filepath}")

    if args.render:
        path = os.path.abspath(args.render)
        if path.lower().endswith((".mp4", ".mov", ".mkv")):
            set_video_output(scene, path)
        else:
            set_png_output(scene, path)
        bpy.ops.render.render(animation=True)
        print(f"rendered {path}")


if __name__ == "__main__":
    main()
