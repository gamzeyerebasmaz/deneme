#!/usr/bin/env python3
"""Lofi rainy desk: animate rain on the window, the wet street outside, coffee steam and
the candle of a still image, as a seamless 30 s loop (1920x1080, 30 fps).

Every moving element is periodic over T seconds, so the clip loops with no seam.

Usage: python3 render_lofi_desk.py [--seconds 30] [--out out/lofi_desk_video.mp4] [--preview N]
"""
import argparse
import os
import subprocess
import numpy as np
import cv2

HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 1920, 1080
SRC = os.path.join(HERE, 'src/desk_rain.webp')

ap = argparse.ArgumentParser()
ap.add_argument('--seconds', type=float, default=30.0)
ap.add_argument('--fps', type=int, default=30)
ap.add_argument('--out', default=os.path.join(HERE, 'out/lofi_desk_video.mp4'))
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



# =================================================================== REMOVE PAINTED STEAM (we animate our own)
sb = (P((462, 360), (585, 360), (585, 596), (462, 596))[:, None, :])
steam_box = np.zeros((H, W), np.uint8)
cv2.fillPoly(steam_box, [sb[:, 0, :]], 1)
lum_b = cv2.cvtColor((base * 255).astype(np.uint8), cv2.COLOR_BGR2GRAY).astype(np.float32) / 255
bgl = cv2.medianBlur((lum_b * 255).astype(np.uint8), 31).astype(np.float32) / 255
hsv = cv2.cvtColor((base * 255).astype(np.uint8), cv2.COLOR_BGR2HSV)
wisp = ((lum_b - bgl) > 0.035) & (hsv[..., 1] < 150) & (steam_box > 0) & (gy < 592 * S)
wisp = cv2.dilate(wisp.astype(np.uint8), np.ones((7, 7), np.uint8))
base = cv2.inpaint((base * 255).astype(np.uint8), wisp * 255, 7, cv2.INPAINT_TELEA).astype(np.float32) / 255

# =================================================================== WINDOW GLASS
panes = [P((350, 0), (1200, 0), (1200, 570), (350, 603)),
         P((1346, 0), (1672, 0), (1672, 500), (1346, 520))]
glass = np.zeros((H, W), np.uint8)
for p in panes:
    cv2.fillPoly(glass, [p], 1)
occl = np.zeros((H, W), np.uint8)               # objects in front of the glass
for p in [P((328, 92), (445, 92), (475, 175), (565, 245), (588, 300), (565, 350), (470, 372),
            (335, 375), (322, 300)),                                    # lamp shade
          P((320, 150), (400, 150), (400, 230), (320, 230)),            # lamp arm joint
          P((340, 0), (520, 0), (520, 120), (470, 130), (430, 60), (340, 60)),   # ivy
          P((340, 395), (445, 395), (450, 520), (430, 610), (340, 610)),         # potted plant
          P((1040, 535), (1155, 535), (1155, 610), (1040, 610)),        # candle holder
          P((1095, 400), (1150, 335), (1300, 335), (1395, 405), (1340, 500), (1300, 540),
            (1300, 610), (1150, 610), (1150, 520), (1095, 450)),        # lavender + vase
          P((1300, 495), (1345, 495), (1345, 610), (1300, 610)),        # bottle
          P((1365, 405), (1672, 405), (1672, 530), (1365, 530))]:       # boxes on the right
    cv2.fillPoly(occl, [p], 1)
f = base
# leaves/lamp are warm and bright; glass is dark/bluish -> refine edges by colour near occluders
warm = (((f[..., 2] - f[..., 0]) > 0.12) & ((0.299 * f[..., 2] + 0.587 * f[..., 1]) > 0.22)).astype(np.uint8)
near = cv2.dilate(occl, np.ones((25, 25), np.uint8))
occl = occl | (warm & near)
occl = cv2.morphologyEx(occl, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
glass = glass & (1 - occl)
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


# ---- wet street: rain ripples make the light reflections shimmer
road = np.zeros((H, W), np.float32)
cv2.fillPoly(road, [P((560, 445), (1120, 445), (1200, 600), (380, 600))], 1)
road = cv2.GaussianBlur(road, (0, 0), 12)[GY0:GY1, GX0:GX1]
RIP = tile_noise(256, 256, 22, 6, 61)


def ripple_view(img, t):
    a = 2 * np.pi * t / T
    ox, oy = 128 + 40 * np.cos(a), 128 + 40 * np.sin(a)
    n = cv2.remap(RIP, (lxx * 0.9 + ox).astype(np.float32), (lyy * 2.2 + oy).astype(np.float32),
                  cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
    m = cv2.remap(RIP, (lxx * 0.9 + oy + 60).astype(np.float32), (lyy * 2.2 + ox).astype(np.float32),
                  cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
    out = cv2.remap(img, (lxx + 2.2 * n * road).astype(np.float32), (lyy + 1.0 * m * road).astype(np.float32),
                    cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    return out * (1 + 0.10 * m * road)[..., None]


def compose_glass(frame, t):
    reg = frame[GY0:GY1, GX0:GX1]
    view = ripple_view(clean, t)
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




# =================================================================== CANDLE
CANDLES = [(1100, 603, 15)]


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
MX, MY = int(517 * S), int(598 * S)
SW_, SH_ = 170, 270
sx0, sy0 = MX - SW_ // 2, MY - SH_
st_y, st_x = np.mgrid[0:SH_, 0:SW_].astype(np.float32)
st_n1 = tile_noise(int(26 * T), SW_, 30, 14, 21)
st_n2 = tile_noise(int(16 * T), SW_, 20, 10, 22)
st_n3 = tile_noise(int(20 * T), SW_, 24, 12, 23)
hh = 1 - st_y / SH_
st_env = (np.exp(-((st_x - SW_ / 2) / (14 + 32 * hh)) ** 2) * smoothstep(0.0, 0.10, hh) *
          (1 - smoothstep(0.5, 1.0, hh))).astype(np.float32)
STEAM_COL = np.array([0.80, 0.84, 0.88], np.float32)


def steam(t):
    def sc(tex, rise):
        my = ((st_y + rise * t) % tex.shape[0]).astype(np.float32)
        return cv2.remap(tex, st_x, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
    n1, n2, n3 = sc(st_n1, 26), sc(st_n2, 16), sc(st_n3, 20)
    a = 0
    for k, (bend_n, off) in enumerate(((n2, -6), (n3, 7))):
        bend = 22 * bend_n * hh + off * (1 - hh)
        a = a + np.exp(-((st_x - SW_ / 2 - bend) / (5 + 14 * hh)) ** 2)
    return np.clip(a * st_env * (0.5 + 0.6 * n1), 0, 1) * 0.24



# =================================================================== FRAME
def frame_at(i):
    t = i / FPS
    frame = base.copy()
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
