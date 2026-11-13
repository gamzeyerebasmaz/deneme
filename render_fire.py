#!/usr/bin/env python3
"""Turn the still cabin image into a seamlessly looping, living-fireplace video.

Everything that moves is periodic over LOOP seconds, so the clip can be
repeated end-to-end (for a 1-10 hour YouTube video) with no visible seam.

Usage:  python3 render_fire.py [--seconds 60] [--fps 30] [--out out/fire_loop.mp4] [--preview N]
"""
import argparse
import subprocess
import numpy as np
import cv2

W, H = 1920, 1080
SRC = 'src/cabin.webp'

ap = argparse.ArgumentParser()
ap.add_argument('--seconds', type=float, default=60.0)
ap.add_argument('--fps', type=int, default=30)
ap.add_argument('--out', default='out/fire_loop.mp4')
ap.add_argument('--preview', type=int, default=0, help='only write N frames as PNGs')
ap.add_argument('--crf', type=int, default=16)
args = ap.parse_args()

T = args.seconds
FPS = args.fps
NF = int(round(T * FPS))
rng = np.random.default_rng(7)

base_u8 = cv2.resize(cv2.imread(SRC), (W, H), interpolation=cv2.INTER_LANCZOS4)
base = base_u8.astype(np.float32) / 255.0
S = W / 1672.0  # source -> output scale


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def tile_noise(h, w, sy, sx, seed):
    """Periodic (tileable) smooth noise in [-1, 1] via FFT low-pass of white noise."""
    r = np.random.default_rng(seed).standard_normal((h, w)).astype(np.float32)
    fy = np.fft.fftfreq(h)[:, None]
    fx = np.fft.rfftfreq(w)[None, :]
    filt = np.exp(-((fy * sy) ** 2 + (fx * sx) ** 2) * 2.0)
    n = np.fft.irfft2(np.fft.rfft2(r) * filt, s=(h, w)).astype(np.float32)
    n /= np.abs(n).max() + 1e-6
    return n


def periodic_signal(n_terms, seed, lo=1, hi=40):
    """Random sum of sines whose frequencies are integer cycles per loop -> seamless."""
    r = np.random.default_rng(seed)
    ks = r.integers(lo, hi, n_terms)
    ph = r.uniform(0, 2 * np.pi, n_terms)
    amp = 1.0 / np.sqrt(ks.astype(np.float32))
    amp /= amp.sum()

    def f(t):
        return float(np.sum(amp * np.sin(2 * np.pi * ks * t / T + ph)))
    return f


# ---------------------------------------------------------------- fire region
FX0, FY0, FX1, FY1 = 1320, 436, 1676, 688        # ROI in output pixels
roi0 = base[FY0:FY1, FX0:FX1].copy()
RH, RW = roi0.shape[:2]
yy, xx = np.mgrid[0:RH, 0:RW].astype(np.float32)

# top edge of the logs (ROI coords); flames live above this line
log_pts = np.array([(0, 182), (60, 180), (100, 172), (150, 166), (185, 160), (195, 182),
                    (205, 148), (260, 160), (300, 178), (356, 185)], np.float32)
log_line = np.interp(np.arange(RW), log_pts[:, 0], log_pts[:, 1]).astype(np.float32)
log_line = cv2.GaussianBlur(log_line[None, :], (0, 0), 4)[0]
above = log_line[None, :] - yy                    # >0 above logs (pixels)
hfrac = np.clip(above / 150.0, 0, 1)              # 0 at log line -> 1 near flame top

# horizontal envelope where flames live
xenv = smoothstep(70, 105, xx) * (1 - smoothstep(280, 310, xx))
zone = smoothstep(-2, 14, above) * xenv           # where flame motion is allowed
zone_blur = cv2.GaussianBlur(zone, (0, 0), 3)

b, g, r = roi0[..., 0], roi0[..., 1], roi0[..., 2]
lum = 0.114 * b + 0.587 * g + 0.299 * r
warmth = np.maximum(smoothstep(0.2, 0.4, r - b), smoothstep(0.7, 0.85, lum))
flame_a = smoothstep(0.36, 0.66, lum) * warmth * smoothstep(-6, 4, above) * xenv
flame_a = cv2.GaussianBlur(flame_a, (0, 0), 1.2)

# background plate: back wall with the flames painted out
hole = (cv2.dilate((flame_a > 0.03).astype(np.uint8), np.ones((9, 9), np.uint8)) > 0) & (above > -3)
plate_u8 = cv2.inpaint((roi0 * 255).astype(np.uint8), hole.astype(np.uint8) * 255, 9, cv2.INPAINT_TELEA)
plate = cv2.GaussianBlur(plate_u8.astype(np.float32) / 255.0, (0, 0), 7)
# the wall right behind the fire glows: warm gradient, brightest near the logs
glow_c = np.array([0.05, 0.28, 0.75], np.float32)
glow_w = (np.clip(1 - hfrac, 0, 1) ** 1.5 * xenv)[..., None]
plate = plate * 0.8 + glow_c * 0.35 * glow_w
hole_s = cv2.GaussianBlur(hole.astype(np.float32), (0, 0), 4)[..., None]
plate = roi0 * (1 - hole_s) + plate * hole_s

# rising turbulence textures: one full texture height per loop -> seamless
RISE1, RISE2 = 200.0, 135.0                         # px/s
NH1, NH2 = int(RISE1 * T), int(RISE2 * T)
n_dx1 = tile_noise(NH1, RW, 28, 22, 1)
n_dx2 = tile_noise(NH2, RW, 60, 45, 2)
n_dy1 = tile_noise(NH1, RW, 30, 30, 3)
n_tip = tile_noise(NH1, RW, 18, 10, 4)
n_tip2 = tile_noise(NH2, RW, 40, 25, 5)
# slowly evolving noise for embers: sample a big tile along a circle
EMB = tile_noise(512, 512, 40, 40, 6)
# extra procedural flame tongues (vertically stretched noise) for a roaring fire
RISE3 = 240.0
NH3 = int(RISE3 * T)
n_pf1 = tile_noise(NH3, RW, 55, 16, 31)
n_pf2 = tile_noise(NH1, RW, 30, 9, 32)
# horizontal profile: a wide bed of fire, strongest in the middle
xprof = (np.exp(-((xx - 190) / 75.0) ** 2) * 0.9 + np.exp(-((xx - 130) / 30.0) ** 2) * 0.4 +
         np.exp(-((xx - 255) / 30.0) ** 2) * 0.4) * xenv
glass_top = smoothstep(18, 40, yy)                 # stay under the fireplace frame
FIRE_LUT = np.zeros((256, 3), np.float32)          # BGR palette: ember red -> orange -> yellow-white
for i, v in enumerate(np.linspace(0, 1, 256)):
    FIRE_LUT[i] = np.array([
        np.interp(v, [0, .5, .8, 1], [0.0, 0.05, 0.35, 0.8]),
        np.interp(v, [0, .5, .8, 1], [0.05, 0.35, 0.75, 0.95]),
        np.interp(v, [0, .5, .8, 1], [0.45, 0.95, 1.0, 1.0])])


def scroll(tex, rise, t):
    nh = tex.shape[0]
    off = (rise * t) % nh
    my = (yy + off) % nh
    return cv2.remap(tex, xx, my.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)


def circ(tex, t, radius, phase=0.0):
    a = 2 * np.pi * t / T + phase
    ox = 256 + radius * np.cos(a)
    oy = 256 + radius * np.sin(a)
    return cv2.remap(tex, (xx + ox).astype(np.float32), (yy + oy).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)


fire_int = periodic_signal(16, 11, 10, 220)      # overall brightness flicker
fire_h = periodic_signal(12, 12, 5, 140)        # flame height breathing
sway = periodic_signal(8, 13, 3, 60)           # global lean

ember_zone = smoothstep(-4, 6, -above) * smoothstep(55, 90, xx) * (1 - smoothstep(300, 330, xx))
ember_zone *= smoothstep(0.35, 0.65, lum)
ember_zone = cv2.GaussianBlur(ember_zone, (0, 0), 1.0)

# ---------------------------------------------------------------- sparks
N_SPARK = int(T * 5)
sp_birth = rng.uniform(0, T, N_SPARK)
sp_life = rng.uniform(0.5, 1.5, N_SPARK)
sp_x = rng.normal(190, 45, N_SPARK)
sp_y = rng.uniform(150, 175, N_SPARK)
sp_vy = rng.uniform(120, 240, N_SPARK)
sp_wob = rng.uniform(4, 14, N_SPARK)
sp_wf = rng.uniform(1.5, 4, N_SPARK)
sp_ph = rng.uniform(0, 6.28, N_SPARK)
sp_size = rng.uniform(0.7, 1.5, N_SPARK)


def draw_sparks(t):
    layer = np.zeros((RH, RW), np.float32)
    age = (t - sp_birth) % T
    for i in np.nonzero(age < sp_life)[0]:
        a = age[i]
        x = sp_x[i] + sp_wob[i] * np.sin(sp_wf[i] * a + sp_ph[i])
        y = sp_y[i] - sp_vy[i] * a
        if not (25 < y < RH and 15 < x < RW - 15):
            continue
        fade = (1 - a / sp_life[i]) ** 1.3 * min(1.0, a * 8)
        cv2.circle(layer, (int(x * 4), int(y * 4)), int(sp_size[i] * 4), float(fade), -1,
                   lineType=cv2.LINE_AA, shift=2)
    return cv2.GaussianBlur(layer, (0, 0), 0.8)


SPARK_COL = np.array([0.35, 0.75, 1.0], np.float32)  # BGR warm orange


def render_fire(t):
    inten = 1.08 + 0.16 * fire_int(t)
    hgt = 1.18 + 0.16 * fire_h(t)
    amp = (hfrac ** 1.2) * zone
    dx = (12.0 * scroll(n_dx1, RISE1, t) + 6.0 * scroll(n_dx2, RISE2, t) + 6.0 * sway(t) * hfrac) * amp
    dy = (10.0 * scroll(n_dy1, RISE1, t)) * amp
    # vertical stretch around log line: flames grow and shrink
    dy += (above * (1 - 1 / hgt)) * zone
    mx = (xx - dx).astype(np.float32)
    my = (yy + dy).astype(np.float32)
    warped = cv2.remap(roi0, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    a = cv2.remap(flame_a, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
    # flame tips break off and vanish as they rise
    tipn = 0.6 * scroll(n_tip, RISE1, t) + 0.4 * scroll(n_tip2, RISE2, t)
    tip = 1 - smoothstep(-0.2, 0.4, hfrac * 1.1 - 0.6 + 1.1 * tipn * hfrac)
    a = a * (0.25 + 0.75 * tip) if False else a * tip
    a = np.clip(a, 0, 1)
    flame = warped * inten
    out = plate * (1 - a[..., None]) + flame * a[..., None]
    # procedural tongues licking up from the logs, screen-blended
    hp = np.clip(above / (185.0 * hgt), 0, 1.2)
    fld = xprof * (1.05 - hp * 1.1) + 0.55 * scroll(n_pf1, RISE3, t) + 0.35 * scroll(n_pf2, RISE1, t)
    v = smoothstep(0.30, 0.95, fld) * smoothstep(-4, 10, above) * glass_top
    v = cv2.GaussianBlur(v, (0, 0), 1.3) * inten
    col = FIRE_LUT[np.clip(v * 255, 0, 255).astype(np.uint8)] * np.clip(v * 1.6, 0, 1)[..., None]
    out = 1 - (1 - out) * (1 - 0.9 * col)
    # keep everything outside the flame zone untouched (logs, grate, glass)
    out = roi0 * (1 - zone_blur[..., None]) + out * zone_blur[..., None]
    # embers under/between logs breathe
    e = circ(EMB, t, 60.0) * 0.6 + circ(EMB, t, 25.0, 1.3) * 0.4
    out *= (1 + ember_zone * (0.30 * e + 0.15 * fire_int(t)))[..., None]
    # sparks
    sp = draw_sparks(t)
    out = out + sp[..., None] * SPARK_COL
    return np.clip(out, 0, 1), inten


# ---------------------------------------------------------------- room light
gy, gx = np.mgrid[0:H, 0:W].astype(np.float32)
cx, cy = FX0 + 190, FY0 + 120
d2 = ((gx - cx) / 1.0) ** 2 + ((gy - cy) / 0.8) ** 2
room_light = np.exp(-d2 / (2 * 520.0 ** 2)) + 0.6 * np.exp(-d2 / (2 * 220.0 ** 2))
room_light = (room_light / room_light.max()).astype(np.float32)
room_light[FY0:FY1, FX0:FX1] *= (1 - zone_blur)   # fire itself handled separately
# light falls mostly on warm, lit surfaces; leave the window/sky alone
win = np.zeros((H, W), np.float32)
cv2.rectangle(win, (0, 0), (int(790 * S), int(540 * S)), 1, -1)
win = cv2.GaussianBlur(win, (0, 0), 25)
room_light *= (1 - 0.85 * win)
room_light3 = room_light[..., None]

# ---------------------------------------------------------------- candles
# (x, y) of flame centre in source pixels, flame height in source px
CANDLES = [(1096, 166, 14), (1144, 199, 10), (1596, 149, 12), (871, 329, 9),
           (1560, 432, 14), (1567, 550, 16), (757, 497, 9), (651, 700, 20),
           (89, 648, 18)]


class Candle:
    def __init__(self, x, y, h, seed):
        self.cx, self.cy = x * S, y * S
        self.h = h * S
        self.r = int(max(10, self.h * 1.4))
        self.flick = periodic_signal(10, 100 + seed, 8, 160)
        self.sw = periodic_signal(6, 200 + seed, 4, 60)
        x0, y0 = int(self.cx - self.r), int(self.cy - self.r * 1.4)
        self.box = (x0, y0, x0 + 2 * self.r, y0 + int(self.r * 2.4))
        x0, y0, x1, y1 = self.box
        py, px = np.mgrid[y0:y1, x0:x1].astype(np.float32)
        dd = ((px - self.cx) / (self.h * 0.45)) ** 2 + ((py - self.cy) / (self.h * 0.8)) ** 2
        self.core = np.exp(-dd).astype(np.float32)
        self.vert = np.clip((self.cy + self.h * 0.5 - py) / (self.h * 1.6), 0, 1)
        self.px, self.py = px, py
        gd = ((gx - self.cx) ** 2 + (gy - self.cy) ** 2)
        self.glow = np.exp(-gd / (2 * (self.h * 3.5) ** 2)).astype(np.float32)
        ys, xs = np.nonzero(self.glow > 0.01)
        self.gbox = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
        gx0, gy0, gx1, gy1 = self.gbox
        self.glow = self.glow[gy0:gy1, gx0:gx1, None]

    def apply(self, frame, src, t):
        f = self.flick(t)
        x0, y0, x1, y1 = self.box
        sw = 2.2 * self.sw(t) * (self.h / 15)
        dx = sw * self.vert ** 1.5 * self.core.clip(0.15, 1)
        patch = cv2.remap(src, (self.px - dx).astype(np.float32),
                          (self.py + 0.6 * f * self.vert * self.h * 0.12).astype(np.float32),
                          cv2.INTER_LINEAR)
        frame[y0:y1, x0:x1] = patch * (1 + 0.18 * f * self.core[..., None])
        gx0, gy0, gx1, gy1 = self.gbox
        frame[gy0:gy1, gx0:gx1] *= 1 + 0.07 * f * self.glow


candles = [Candle(x, y, h, i) for i, (x, y, h) in enumerate(CANDLES)]

# ---------------------------------------------------------------- steam over the mug
MX, MY = int(205 * S), int(640 * S)    # top of the mug (output px)
SW_, SH_ = 110, 170
sx0, sy0 = MX - SW_ // 2, MY - SH_
st_y, st_x = np.mgrid[0:SH_, 0:SW_].astype(np.float32)
st_n1 = tile_noise(int(28 * T), SW_, 30, 14, 21)
st_n2 = tile_noise(int(18 * T), SW_, 20, 10, 22)
hh = 1 - st_y / SH_                    # 0 at mug, 1 at top
st_env = (np.exp(-((st_x - SW_ / 2) / (10 + 22 * hh)) ** 2) * smoothstep(0.0, 0.12, hh) *
          (1 - smoothstep(0.55, 1.0, hh))).astype(np.float32)


def steam(t):
    def sc(tex, rise):
        nh = tex.shape[0]
        my = ((st_y + rise * t) % nh).astype(np.float32)
        return cv2.remap(tex, st_x, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
    n1 = sc(st_n1, 28)
    n2 = sc(st_n2, 18)
    bend = (14 * n2 * hh).astype(np.float32)
    wisp = np.exp(-((st_x - SW_ / 2 - bend) / (4 + 10 * hh)) ** 2)
    a = np.clip(wisp * st_env * (0.55 + 0.6 * n1), 0, 1) * 0.16
    return a


STEAM_COL = np.array([0.86, 0.9, 0.95], np.float32)


# ---------------------------------------------------------------- render loop
def frame_at(i):
    t = i / FPS
    fire, inten = render_fire(t)
    lightk = 0.03 + 0.09 * fire_int(t) + 0.03 * fire_h(t)
    frame = base * (1 + lightk * room_light3)
    frame[FY0:FY1, FX0:FX1] = fire
    src = frame.copy()
    for c in candles:
        c.apply(frame, src, t)
    a = steam(t)[..., None]
    reg = frame[sy0:sy0 + SH_, sx0:sx0 + SW_]
    frame[sy0:sy0 + SH_, sx0:sx0 + SW_] = reg * (1 - a) + STEAM_COL * a
    return (np.clip(frame, 0, 1) * 255 + 0.5).astype(np.uint8)


if args.preview:
    import os
    os.makedirs('out/preview', exist_ok=True)
    for k in range(args.preview):
        i = int(k * NF / args.preview)
        cv2.imwrite(f'out/preview/f{i:05d}.png', frame_at(i))
    raise SystemExit

import os
os.makedirs(os.path.dirname(args.out) or '.', exist_ok=True)
cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgr24',
       '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
       '-c:v', 'libx264', '-preset', 'slow', '-crf', str(args.crf), '-pix_fmt', 'yuv420p',
       '-g', str(FPS * 2), '-movflags', '+faststart', args.out]
p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
for i in range(NF):
    p.stdin.write(frame_at(i).tobytes())
    if i % 150 == 0:
        print(f'frame {i}/{NF}', flush=True)
p.stdin.close()
p.wait()
print('done', args.out)
