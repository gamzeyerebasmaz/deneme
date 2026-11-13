#!/usr/bin/env python3
"""Rainy-night cabin: animate the stove fire, rain on the panoramic windows, steam and
candles of a still image, as a seamless 30 s loop (1920x1080, 30 fps).

Every moving element is periodic over T seconds, so the clip loops with no seam.

Usage: python3 render_rain_cabin.py [--seconds 30] [--out out/rain_cabin_video.mp4] [--preview N]
"""
import argparse
import os
import subprocess
import numpy as np
import cv2

HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 1920, 1080
SRC = os.path.join(HERE, 'src/cabin_rain.webp')

ap = argparse.ArgumentParser()
ap.add_argument('--seconds', type=float, default=30.0)
ap.add_argument('--fps', type=int, default=30)
ap.add_argument('--out', default=os.path.join(HERE, 'out/rain_cabin_video.mp4'))
ap.add_argument('--preview', type=int, default=0)
ap.add_argument('--crf', type=int, default=16)
args = ap.parse_args()

T = args.seconds
FPS = args.fps
NF = int(round(T * FPS))
rng = np.random.default_rng(11)

src_img = cv2.imread(SRC)
S = W / src_img.shape[1]                       # source px -> output px
base = cv2.resize(src_img, (W, H), interpolation=cv2.INTER_LANCZOS4).astype(np.float32) / 255
gy, gx = np.mgrid[0:H, 0:W].astype(np.float32)


def P(*pts):
    return (np.array(pts, np.float32) * S).astype(np.int32)


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def tile_noise(h, w, sy, sx, seed):
    """Tileable smooth noise in [-1, 1] (FFT low-pass of white noise)."""
    r = np.random.default_rng(seed).standard_normal((h, w)).astype(np.float32)
    fy = np.fft.fftfreq(h)[:, None]
    fx = np.fft.rfftfreq(w)[None, :]
    filt = np.exp(-((fy * sy) ** 2 + (fx * sx) ** 2) * 2.0)
    n = np.fft.irfft2(np.fft.rfft2(r) * filt, s=(h, w)).astype(np.float32)
    return n / (np.abs(n).max() + 1e-6)


def periodic_signal(n_terms, seed, lo=1, hi=40):
    """Sum of sines with integer cycles per loop -> seamless; roughly in [-1, 1]."""
    r = np.random.default_rng(seed)
    ks = r.integers(lo, hi, n_terms)
    ph = r.uniform(0, 2 * np.pi, n_terms)
    amp = 1.0 / np.sqrt(ks.astype(np.float32))
    amp /= amp.sum()
    return lambda t: float(np.sum(amp * np.sin(2 * np.pi * ks * t / T + ph)))


# =================================================================== FIRE (wood stove)
FX0, FY0 = int(318 * S), int(530 * S)
FX1, FY1 = int(482 * S), int(700 * S)
roi0 = base[FY0:FY1, FX0:FX1].copy()
RH, RW = roi0.shape[:2]
yy, xx = np.mgrid[0:RH, 0:RW].astype(np.float32)


def rx(x):  # source x -> roi x
    return (x - 318) * S


def ry(y):
    return (y - 530) * S


# top edge of the logs (source coords)
log_src = [(318, 660), (332, 660), (345, 658), (358, 655), (368, 628), (390, 632), (410, 645),
           (430, 653), (440, 660), (482, 668)]
lx = np.array([rx(p[0]) for p in log_src]); ly = np.array([ry(p[1]) for p in log_src])
log_line = np.interp(np.arange(RW), lx, ly).astype(np.float32)
log_line = cv2.GaussianBlur(log_line[None, :], (0, 0), 3)[0]
above = log_line[None, :] - yy
FLAME_H = ry(655) - ry(545)                       # visible flame height
hfrac = np.clip(above / FLAME_H, 0, 1)
xenv = smoothstep(rx(321), rx(330), xx) * (1 - smoothstep(rx(445), rx(468), xx))
glass_top = smoothstep(ry(541), ry(552), yy)
zone = smoothstep(-2, 10, above) * xenv * glass_top
zone_blur = cv2.GaussianBlur(zone, (0, 0), 2.5)

b_, g_, r_ = roi0[..., 0], roi0[..., 1], roi0[..., 2]
lum = 0.114 * b_ + 0.587 * g_ + 0.299 * r_
warmth = np.maximum(smoothstep(0.2, 0.4, r_ - b_), smoothstep(0.7, 0.85, lum))
flame_a = smoothstep(0.38, 0.66, lum) * warmth * smoothstep(-6, 4, above) * xenv
flame_a = cv2.GaussianBlur(flame_a, (0, 0), 1.2)

hole = (cv2.dilate((flame_a > 0.03).astype(np.uint8), np.ones((9, 9), np.uint8)) > 0) & (above > -3)
plate_u8 = cv2.inpaint((roi0 * 255).astype(np.uint8), hole.astype(np.uint8) * 255, 9, cv2.INPAINT_TELEA)
plate = cv2.GaussianBlur(plate_u8.astype(np.float32) / 255, (0, 0), 7)
glow_c = np.array([0.05, 0.30, 0.80], np.float32)
plate = plate * 0.75 + glow_c * 0.40 * (np.clip(1 - hfrac, 0, 1) ** 1.3 * xenv)[..., None]
hole_s = cv2.GaussianBlur(hole.astype(np.float32), (0, 0), 4)[..., None]
plate = roi0 * (1 - hole_s) + plate * hole_s

RISE1, RISE2, RISE3 = 160.0, 110.0, 190.0
n_dx1 = tile_noise(int(RISE1 * T), RW, 26, 20, 1)
n_dx2 = tile_noise(int(RISE2 * T), RW, 55, 40, 2)
n_dy1 = tile_noise(int(RISE1 * T), RW, 28, 28, 3)
n_tip = tile_noise(int(RISE1 * T), RW, 16, 9, 4)
n_tip2 = tile_noise(int(RISE2 * T), RW, 36, 22, 5)
n_pf1 = tile_noise(int(RISE3 * T), RW, 50, 14, 31)
n_pf2 = tile_noise(int(RISE1 * T), RW, 28, 8, 32)
EMB = tile_noise(512, 512, 36, 36, 6)

xprof = (np.exp(-((xx - rx(372)) / (40 * S)) ** 2) * 0.95 +
         np.exp(-((xx - rx(340)) / (14 * S)) ** 2) * 0.35 +
         np.exp(-((xx - rx(405)) / (16 * S)) ** 2) * 0.35) * xenv
FIRE_LUT = np.zeros((256, 3), np.float32)
for i, v in enumerate(np.linspace(0, 1, 256)):
    FIRE_LUT[i] = [np.interp(v, [0, .5, .8, 1], [0.0, 0.05, 0.35, 0.8]),
                   np.interp(v, [0, .5, .8, 1], [0.05, 0.35, 0.75, 0.95]),
                   np.interp(v, [0, .5, .8, 1], [0.45, 0.95, 1.0, 1.0])]


def scroll(tex, rise, t, X=xx, Y=yy):
    nh = tex.shape[0]
    my = ((Y + rise * t) % nh).astype(np.float32)
    return cv2.remap(tex, X, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)


def circ(tex, t, radius, phase=0.0):
    a = 2 * np.pi * t / T + phase
    return cv2.remap(tex, (xx + 256 + radius * np.cos(a)).astype(np.float32),
                     (yy + 256 + radius * np.sin(a)).astype(np.float32),
                     cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)


fire_int = periodic_signal(16, 11, 6, 70)
fire_h = periodic_signal(12, 12, 3, 45)
sway = periodic_signal(8, 13, 2, 30)

ember_zone = smoothstep(-4, 6, -above) * xenv * smoothstep(0.32, 0.6, lum)
ember_zone = cv2.GaussianBlur(ember_zone, (0, 0), 1.0)

N_SPARK = int(T * 1.3)
sp = dict(b=rng.uniform(0, T, N_SPARK), life=rng.uniform(0.4, 1.2, N_SPARK),
          x=rng.normal(rx(372), 20 * S, N_SPARK), y=rng.uniform(ry(625), ry(650), N_SPARK),
          vy=rng.uniform(90, 190, N_SPARK), wob=rng.uniform(3, 10, N_SPARK),
          wf=rng.uniform(1.5, 4, N_SPARK), ph=rng.uniform(0, 6.28, N_SPARK),
          size=rng.uniform(0.6, 1.3, N_SPARK))
SPARK_COL = np.array([0.35, 0.75, 1.0], np.float32)


def draw_sparks(t):
    layer = np.zeros((RH, RW), np.float32)
    age = (t - sp['b']) % T
    for i in np.nonzero(age < sp['life'])[0]:
        a = age[i]
        x = sp['x'][i] + sp['wob'][i] * np.sin(sp['wf'][i] * a + sp['ph'][i])
        y = sp['y'][i] - sp['vy'][i] * a
        if not (ry(545) < y < RH and rx(325) < x < rx(470)):
            continue
        fade = (1 - a / sp['life'][i]) ** 1.3 * min(1.0, a * 8)
        cv2.circle(layer, (int(x * 4), int(y * 4)), int(sp['size'][i] * 4), float(fade), -1,
                   lineType=cv2.LINE_AA, shift=2)
    return cv2.GaussianBlur(layer, (0, 0), 0.8)


def render_fire(t):
    inten = 1.04 + 0.09 * fire_int(t)
    hgt = 1.0 + 0.09 * fire_h(t)
    amp = (hfrac ** 1.1) * zone
    dx = (8.0 * scroll(n_dx1, RISE1, t) + 4.0 * scroll(n_dx2, RISE2, t) + 3.5 * sway(t) * hfrac) * amp
    dy = 9.0 * scroll(n_dy1, RISE1, t) * amp + (above * (1 - 1 / hgt)) * zone
    mx = (xx - dx).astype(np.float32)
    my = (yy + dy).astype(np.float32)
    warped = cv2.remap(roi0, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    a = cv2.remap(flame_a, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
    tipn = 0.6 * scroll(n_tip, RISE1, t) + 0.4 * scroll(n_tip2, RISE2, t)
    a = np.clip(a * (1 - smoothstep(-0.2, 0.4, hfrac * 1.1 - 0.6 + 1.1 * tipn * hfrac)), 0, 1)
    out = plate * (1 - a[..., None]) + (warped * inten) * a[..., None]
    # procedural tongues licking up from the logs (screen blend)
    hp = np.clip(above / (FLAME_H * 1.05 * hgt), 0, 1.2)
    fld = xprof * (1.05 - hp * 1.1) + 0.55 * scroll(n_pf1, RISE3, t) + 0.35 * scroll(n_pf2, RISE1, t)
    v = smoothstep(0.30, 0.95, fld) * smoothstep(-4, 10, above) * glass_top
    v = cv2.GaussianBlur(v, (0, 0), 1.2) * inten
    col = FIRE_LUT[np.clip(v * 255, 0, 255).astype(np.uint8)] * np.clip(v * 1.6, 0, 1)[..., None]
    out = 1 - (1 - out) * (1 - 0.85 * col)
    out = roi0 * (1 - zone_blur[..., None]) + out * zone_blur[..., None]
    e = circ(EMB, t, 60.0) * 0.6 + circ(EMB, t, 25.0, 1.3) * 0.4
    out *= (1 + ember_zone * (0.30 * e + 0.15 * fire_int(t)))[..., None]
    out = out + draw_sparks(t)[..., None] * SPARK_COL
    return np.clip(out, 0, 1)


# =================================================================== WINDOWS / GLASS
panes = [P((418, 186), (493, 178), (493, 461), (418, 461)),
         P((569, 153), (772, 126), (772, 556), (569, 560)),
         P((809, 114), (1027, 91), (1027, 558), (809, 558)),
         P((1084, 81), (1330, 48), (1330, 565), (1084, 565)),
         P((1385, 38), (1668, 2), (1668, 532), (1385, 540))]
pane_bottom = [461, 556, 558, 565, 532]
glass = np.zeros((H, W), np.uint8)
for p in panes:
    cv2.fillPoly(glass, [p], 1)
occl = np.zeros((H, W), np.uint8)               # objects standing in front of the glass
for p in [P((600, 512), (645, 512), (645, 580), (600, 580)),             # candle
          P((638, 395), (728, 395), (728, 582), (638, 582)),             # lantern
          P((728, 500), (745, 500), (745, 582), (728, 582)),             # small candle
          P((738, 522), (808, 522), (808, 590), (738, 590)),             # mug
          P((760, 400), (830, 395), (912, 405), (918, 470), (880, 500), (880, 590), (790, 590),
            (790, 480), (760, 450)),                                    # flowers + vase
          P((880, 532), (998, 532), (998, 592), (880, 592))]:           # books
    cv2.fillPoly(occl, [p], 1)
f = base
bluish = ((f[..., 0] - f[..., 2]) > 0.0).astype(np.uint8)
warm_low = (((f[..., 2] - f[..., 0]) > 0.08) & (gy > 470 * S) & (gx > 1370 * S)).astype(np.uint8)
ivy = np.zeros((H, W), np.uint8)
cv2.fillPoly(ivy, [P((418, 186), (493, 178), (493, 461), (418, 461))], 1)
ivy = ivy & (1 - cv2.morphologyEx(bluish, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8)))
warm_low = cv2.dilate(warm_low, np.ones((7, 7), np.uint8))
glass = glass & (1 - occl) & (1 - warm_low) & (1 - ivy)
glass = cv2.morphologyEx(glass, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
G = cv2.GaussianBlur(glass.astype(np.float32), (0, 0), 1.2)
G3 = G[..., None]
ys_, xs_ = np.nonzero(glass)
GX0, GY0, GX1, GY1 = xs_.min(), ys_.min(), xs_.max() + 1, ys_.max() + 1
Gc = G[GY0:GY1, GX0:GX1]
GH, GW = Gc.shape

# outside view: remove the painted (static) rain streaks, keep trees/lights, soften
outside = base[GY0:GY1, GX0:GX1]
clean = cv2.morphologyEx(outside, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_RECT, (7, 1)))
clean = cv2.GaussianBlur(clean, (0, 0), 1.6)
clean = clean * 0.92
bg_drop = cv2.GaussianBlur(base, (0, 0), 3.0)[GY0:GY1, GX0:GX1]  # what drops refract
lyy, lxx = np.mgrid[0:GH, 0:GW].astype(np.float32)


# ---- falling rain behind the glass: three parallax layers of streaks
def streak_tex(h, w, n, lmin, lmax, imin, imax, slant, blur, seed):
    r = np.random.default_rng(seed)
    tex = np.zeros((h, w), np.float32)
    for _ in range(n):
        x = r.uniform(0, w); y = r.uniform(0, h); L = r.uniform(lmin, lmax)
        val = float(r.uniform(imin, imax))
        for oy in (0, -h, h):
            p0 = (int(x * 4), int((y + oy) * 4))
            p1 = (int((x + slant * L) * 4), int((y + oy + L) * 4))
            cv2.line(tex, p0, p1, val, 1, cv2.LINE_AA, shift=2)
    tex = cv2.GaussianBlur(tex, (0, 0), blur)
    return tex


RAIN = [  # (texture, speed px/s)
    (streak_tex(1400, GW, 9000, 14, 30, 0.10, 0.35, 0.10, 0.7, 41), 1400 * 15 / T),
    (streak_tex(1600, GW, 3500, 30, 60, 0.20, 0.55, 0.11, 0.8, 42), 1600 * 21 / T),
    (streak_tex(2000, GW, 700, 60, 120, 0.25, 0.60, 0.12, 1.3, 43), 2000 * 24 / T)]
gust = tile_noise(GH, GW, 4, 6, 44)              # sheets of heavier rain drifting across
RAIN_COL = np.array([0.92, 0.88, 0.80], np.float32)


def rain_layer(t):
    acc = np.zeros((GH, GW), np.float32)
    for tex, spd in RAIN:
        my = ((lyy - spd * t) % tex.shape[0]).astype(np.float32)
        acc += cv2.remap(tex, lxx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
    gx_off = ((lxx - 60 * t / T * GW / 60) % GW).astype(np.float32)  # one full drift per loop
    g = cv2.remap(gust, gx_off, lyy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
    return np.clip(acc * (0.85 + 0.15 * g), 0, 1)


# ---- water drops on the glass
def drop_sprite(r, elong=1.0):
    s = int(np.ceil(r * elong)) + 2
    v, u = np.mgrid[-s:s + 1, -s:s + 1].astype(np.float32)
    d = np.sqrt((u / r) ** 2 + (v / (r * elong)) ** 2)
    a = smoothstep(1.0, 0.78, d)
    ox = -u * 1.9; oy = -v * 1.9 - r * 0.6          # inverted, magnified view
    shade = (1 - 0.55 * d ** 3).clip(0.3, 1)
    spec = np.exp(-(((u + 0.35 * r) / (0.28 * r)) ** 2 + ((v + 0.4 * r * elong) / (0.28 * r)) ** 2))
    spec = spec + 0.35 * np.exp(-(((u) / (0.5 * r)) ** 2 + ((v - 0.75 * r * elong) / (0.18 * r)) ** 2))
    return s, a.astype(np.float32), ox.astype(np.float32), oy.astype(np.float32), \
        shade.astype(np.float32), (spec * a).astype(np.float32)


SPR = {}


def sprite(r, elong=1.0):
    k = (round(r * 4) / 4, round(elong * 10) / 10)
    if k not in SPR:
        SPR[k] = drop_sprite(max(k[0], 0.75), k[1])
    return SPR[k]


# sample positions inside glass (in local glass coords)
gl_y, gl_x = np.nonzero(glass[GY0:GY1, GX0:GX1])


def rand_glass_pts(n, r):
    i = r.integers(0, len(gl_x), n)
    return gl_x[i].astype(np.float32), gl_y[i].astype(np.float32)


# static beading drops: appear, grow a little, then vanish (absorbed)
N_ST = 3400
dx_, dy_ = rand_glass_pts(N_ST, rng)
st_r = np.clip(rng.lognormal(np.log(1.5 * S), 0.42, N_ST), 0.8, 5.0)
st_b = rng.uniform(0, T, N_ST)
st_life = rng.uniform(6, 26, N_ST)
st_el = rng.uniform(1.0, 1.2, N_ST)

# runners: big drops sliding down in stop-and-go jerks, leaving a wet trail
N_RUN = 130
run_x, run_y0 = rand_glass_pts(N_RUN, rng)
keep = run_y0 < GH * 0.75
run_x, run_y0 = run_x[keep], run_y0[keep]
N_RUN = len(run_x)
run_b = rng.uniform(0, T, N_RUN)
run_life = rng.uniform(5, 13, N_RUN)
run_r = rng.uniform(2.2, 3.8, N_RUN) * S
TSTEP = 1.0 / FPS
run_path = []
for i in range(N_RUN):
    n = int(run_life[i] * FPS) + 2
    ys = np.zeros(n, np.float32); xs = np.zeros(n, np.float32)
    v = 0.0; y = 0.0; x = 0.0; moving = rng.random() < 0.5; nxt = rng.uniform(0.1, 1.0)
    tt = 0.0
    for k in range(n):
        if tt > nxt:
            moving = not moving
            nxt = tt + (rng.uniform(0.15, 0.9) if moving else rng.uniform(0.1, 1.2))
        target = rng.uniform(35, 140) * S if moving else 0.0
        v += (target - v) * 0.35
        y += v * TSTEP
        x += rng.normal(0, 0.25) * (v > 5)
        ys[k] = y; xs[k] = x; tt += TSTEP
    run_path.append((xs, ys))
glass_local = glass[GY0:GY1, GX0:GX1]


def paste(maps, s, spr, cx, cy, fade):
    """Write one drop sprite into the drop maps (larger alpha wins)."""
    A, OX, OY, SH, SP = maps
    _, a, ox, oy, sh, spc = spr
    x0, y0 = int(cx) - s, int(cy) - s
    x1, y1 = x0 + a.shape[1], y0 + a.shape[0]
    if x0 < 0 or y0 < 0 or x1 > GW or y1 > GH:
        return
    aa = a * fade
    sl = (slice(y0, y1), slice(x0, x1))
    m = aa > A[sl]
    A[sl][m] = aa[m]; OX[sl][m] = ox[m]; OY[sl][m] = oy[m]; SH[sl][m] = sh[m]
    SP[sl] = np.maximum(SP[sl], spc * fade)


def render_glass(t):
    A = np.zeros((GH, GW), np.float32); OX = np.zeros_like(A); OY = np.zeros_like(A)
    SH = np.ones_like(A); SP = np.zeros_like(A); TR = np.zeros_like(A)
    maps = (A, OX, OY, SH, SP)
    age = (t - st_b) % T
    for i in np.nonzero(age < st_life)[0]:
        a = age[i]; L = st_life[i]
        grow = min(1.0, 0.55 + a / 3.0)
        fade = min(1.0, a / 0.6) * min(1.0, (L - a) / 0.25)
        r = st_r[i] * grow
        spr = sprite(r, st_el[i])
        paste(maps, spr[0], spr, dx_[i], dy_[i], fade)
    age = (t - run_b) % T
    for i in np.nonzero(age < run_life)[0]:
        a = age[i]; L = run_life[i]
        xs, ys = run_path[i]
        k = min(int(a * FPS), len(ys) - 1)
        fade_all = min(1.0, a / 0.4) * min(1.0, (L - a) / 1.0)
        cx, cy0 = run_x[i], run_y0[i]
        cy = cy0 + ys[k]
        # wet trail with tiny beads left behind
        if ys[k] > 2:
            cv2.line(TR, (int(cx * 4), int(cy0 * 4)), (int((cx + xs[k]) * 4), int(cy * 4)),
                     0.5 * fade_all, max(1, int(run_r[i] * 0.5)), cv2.LINE_AA, shift=2)
            nb = int(ys[k] / (12 * S)) if ys[k] > run_r[i] * 2 else 0
            br = np.random.default_rng(i)
            for j in range(nb):
                byy = cy0 + br.uniform(0, ys[k] - run_r[i] * 1.5)
                spr = sprite(br.uniform(0.7, 1.2) * S)
                paste(maps, spr[0], spr, cx + br.normal(0, 0.6), byy, fade_all * 0.9)
        if int(cy) < GH and glass_local[int(cy), int(np.clip(cx, 0, GW - 1))]:
            el = 1.0 + min(0.5, (ys[k] - ys[max(k - 2, 0)]) * 0.08)
            spr = sprite(run_r[i], el)
            paste(maps, spr[0], spr, cx + xs[k], cy, fade_all)
    TR = cv2.GaussianBlur(TR, (0, 0), 0.8)
    return A, OX, OY, SH, SP, TR


def compose_glass(frame, t):
    reg = frame[GY0:GY1, GX0:GX1]
    view = clean.copy()
    rl = rain_layer(t)[..., None]
    view = view * (1 - 0.24 * rl) + RAIN_COL * 0.24 * rl
    A, OX, OY, SH, SP, TR = render_glass(t)
    refr = cv2.remap(bg_drop, lxx + OX, lyy + OY, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    drop = refr * 1.03 * SH[..., None] + 0.35 * SP[..., None] * np.array([0.95, 0.95, 0.9], np.float32)
    trail = cv2.remap(bg_drop, lxx + 1.5, lyy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    view = view * (1 - 0.4 * TR[..., None]) + (trail * 1.2 + 0.02) * 0.4 * TR[..., None]
    A3 = A[..., None]
    view = view * (1 - A3) + drop * A3
    g = Gc[..., None]
    frame[GY0:GY1, GX0:GX1] = reg * (1 - g) + view * g


# =================================================================== ROOM LIGHT FROM THE STOVE
cx, cy = 400 * S, 640 * S
d2 = (gx - cx) ** 2 + ((gy - cy) / 0.8) ** 2
room_light = np.exp(-d2 / (2 * (380 * S) ** 2)) + 0.7 * np.exp(-d2 / (2 * (150 * S) ** 2))
room_light = (room_light / room_light.max()).astype(np.float32)
room_light *= (1 - G)
room_light[FY0:FY1, FX0:FX1] *= (1 - zone_blur)
room_light3 = room_light[..., None]


# =================================================================== CANDLES
CANDLES = [(141, 300, 14), (679, 515, 16), (623, 525, 12), (736, 511, 8), (213, 738, 18),
           (1419, 812, 18)]


class Candle:
    def __init__(self, x, y, h, seed):
        self.cx, self.cy, self.h = x * S, y * S, h * S
        self.r = int(max(10, self.h * 1.4))
        self.flick = periodic_signal(10, 100 + seed, 8, 80)
        self.sw = periodic_signal(6, 200 + seed, 2, 30)
        x0, y0 = int(self.cx - self.r), int(self.cy - self.r * 1.4)
        self.box = (x0, y0, x0 + 2 * self.r, y0 + int(self.r * 2.4))
        x0, y0, x1, y1 = self.box
        py, px = np.mgrid[y0:y1, x0:x1].astype(np.float32)
        dd = ((px - self.cx) / (self.h * 0.45)) ** 2 + ((py - self.cy) / (self.h * 0.8)) ** 2
        self.core = np.exp(-dd).astype(np.float32)
        self.vert = np.clip((self.cy + self.h * 0.5 - py) / (self.h * 1.6), 0, 1)
        self.px, self.py = px, py
        gd = (gx - self.cx) ** 2 + (gy - self.cy) ** 2
        glow = np.exp(-gd / (2 * (self.h * 3.5) ** 2)).astype(np.float32)
        ys, xs = np.nonzero(glow > 0.01)
        self.gbox = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
        gx0, gy0, gx1, gy1 = self.gbox
        self.glow = glow[gy0:gy1, gx0:gx1, None]

    def apply(self, frame, src, t):
        f = self.flick(t)
        x0, y0, x1, y1 = self.box
        dx = 1.6 * self.sw(t) * (self.h / 15) * self.vert ** 1.5 * self.core.clip(0.15, 1)
        patch = cv2.remap(src, (self.px - dx).astype(np.float32),
                          (self.py + 0.06 * f * self.vert * self.h).astype(np.float32), cv2.INTER_LINEAR)
        frame[y0:y1, x0:x1] = patch * (1 + 0.12 * f * self.core[..., None])
        gx0, gy0, gx1, gy1 = self.gbox
        frame[gy0:gy1, gx0:gx1] *= 1 + 0.05 * f * self.glow


candles = [Candle(x, y, h, i) for i, (x, y, h) in enumerate(CANDLES)]

# =================================================================== STEAM over the mug
MX, MY = int(862 * S), int(730 * S)
SW_, SH_ = 130, 200
sx0, sy0 = MX - SW_ // 2, MY - SH_
st_y, st_x = np.mgrid[0:SH_, 0:SW_].astype(np.float32)
st_n1 = tile_noise(int(26 * T), SW_, 30, 14, 21)
st_n2 = tile_noise(int(16 * T), SW_, 20, 10, 22)
st_n3 = tile_noise(int(20 * T), SW_, 24, 12, 23)
hh = 1 - st_y / SH_
st_env = (np.exp(-((st_x - SW_ / 2) / (12 + 26 * hh)) ** 2) * smoothstep(0.0, 0.10, hh) *
          (1 - smoothstep(0.5, 1.0, hh))).astype(np.float32)
STEAM_COL = np.array([0.80, 0.84, 0.88], np.float32)


def steam(t):
    def sc(tex, rise):
        my = ((st_y + rise * t) % tex.shape[0]).astype(np.float32)
        return cv2.remap(tex, st_x, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
    n1, n2, n3 = sc(st_n1, 26), sc(st_n2, 16), sc(st_n3, 20)
    a = 0
    for k, (bend_n, off) in enumerate(((n2, -6), (n3, 7))):
        bend = 16 * bend_n * hh + off * (1 - hh)
        a = a + np.exp(-((st_x - SW_ / 2 - bend) / (4 + 11 * hh)) ** 2)
    return np.clip(a * st_env * (0.5 + 0.6 * n1), 0, 1) * 0.15


# =================================================================== FRAME
def frame_at(i):
    t = i / FPS
    lightk = 0.03 + 0.055 * fire_int(t) + 0.02 * fire_h(t)
    frame = base * (1 + lightk * room_light3)
    frame[FY0:FY1, FX0:FX1] = render_fire(t)
    compose_glass(frame, t)
    src = frame.copy()
    for c in candles:
        c.apply(frame, src, t)
    a = steam(t)[..., None]
    reg = frame[sy0:sy0 + SH_, sx0:sx0 + SW_]
    frame[sy0:sy0 + SH_, sx0:sx0 + SW_] = reg * (1 - a) + STEAM_COL * a
    return (np.clip(frame, 0, 1) * 255 + 0.5).astype(np.uint8)


if args.preview:
    d = os.path.join(HERE, 'out/preview')
    os.makedirs(d, exist_ok=True)
    for k in range(args.preview):
        i = int(k * NF / args.preview)
        cv2.imwrite(f'{d}/f{i:05d}.png', frame_at(i))
    raise SystemExit

os.makedirs(os.path.dirname(args.out), exist_ok=True)
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
