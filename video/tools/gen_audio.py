"""Müzik yatakları ve ses efektleri (tamamen sentetik, telifsiz) + grain dokusu.
Çıktı: public/music/*.wav, public/sfx/*.wav, public/noise.png"""
import json, os
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
rng = np.random.default_rng(7)
os.makedirs(os.path.join(ROOT, "public", "music"), exist_ok=True)
os.makedirs(os.path.join(ROOT, "public", "sfx"), exist_ok=True)


def save(name, x, peak=0.9):
    x = np.asarray(x, dtype=np.float64)
    if x.ndim == 1:
        x = np.stack([x, x], 1)
    m = np.max(np.abs(x)) or 1
    x = x / m * peak
    wavfile.write(os.path.join(ROOT, "public", name), SR, (x * 32767).astype(np.int16))


def t_(d):
    return np.arange(int(d * SR)) / SR


def lp(x, f, o=2):
    return sosfilt(butter(o, f, "low", fs=SR, output="sos"), x)


def hp(x, f, o=2):
    return sosfilt(butter(o, f, "high", fs=SR, output="sos"), x)


def bp(x, a, b, o=2):
    return sosfilt(butter(o, [a, b], "band", fs=SR, output="sos"), x)


def noise(d):
    return rng.standard_normal(int(d * SR))


def brown(d):
    x = np.cumsum(noise(d))
    x = hp(x, 20)
    return x / (np.max(np.abs(x)) + 1e-9)


IR_CACHE = {}


def reverb(x, sec=3.5, mix=0.35):
    key = sec
    if key not in IR_CACHE:
        n = int(sec * SR)
        ir = rng.standard_normal((n, 2)) * np.exp(-np.linspace(0, 7, n))[:, None]
        ir[:, 0] = lp(ir[:, 0], 6000)
        ir[:, 1] = lp(ir[:, 1], 6000)
        IR_CACHE[key] = ir / np.sqrt(np.sum(ir ** 2, 0))
    ir = IR_CACHE[key]
    if x.ndim == 1:
        x = np.stack([x, x], 1)
    wet = np.stack([fftconvolve(x[:, i], ir[:, i])[: len(x)] for i in range(2)], 1)
    return x * (1 - mix) + wet * mix


def env_ad(n, a, d):
    e = np.ones(n)
    ai = int(a * SR)
    di = int(d * SR)
    if ai:
        e[:ai] = np.linspace(0, 1, ai)
    if di:
        e[-di:] *= np.linspace(1, 0, di)
    return e


def note(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def pad_voice(f, d, bright=1200, det=0.004):
    t = t_(d)
    x = np.zeros_like(t)
    for dv in (-det, 0, det):
        ph = rng.uniform(0, 6.28)
        for h, a in ((1, 1), (2, 0.45), (3, 0.25), (4, 0.12), (5, 0.07)):
            x += a * np.sin(2 * np.pi * f * (1 + dv) * h * t + ph * h)
    return lp(x, bright)


def bed(d, chords, seed=0, bright=1100, pulse=0.0, pulse_bpm=60, pluck=0.0, scale=None, air=0.25, sub=0.5, swell=None):
    """chords: [(start_sec, [midi notes])]"""
    global rng
    rng = np.random.default_rng(seed)
    n = int(d * SR)
    out = np.zeros((n, 2))
    for ci, (st, notes) in enumerate(chords):
        en = chords[ci + 1][0] if ci + 1 < len(chords) else d
        seg = en - st + 3
        i0 = int(st * SR)
        for k, m in enumerate(notes):
            v = pad_voice(note(m), seg, bright) * (0.22 if m > 50 else 0.3)
            v *= env_ad(len(v), 2.5, 3.0)
            pan = 0.5 + (k - len(notes) / 2) * 0.15
            j1 = min(n, i0 + len(v))
            out[i0:j1, 0] += v[: j1 - i0] * (1 - pan)
            out[i0:j1, 1] += v[: j1 - i0] * pan
        # sub
        r = min(notes)
        while r > 40:
            r -= 12
        sv = np.sin(2 * np.pi * note(r) * t_(seg)) * sub * env_ad(int(seg * SR), 2, 3)
        j1 = min(n, i0 + len(sv))
        out[i0:j1] += sv[: j1 - i0, None] * 0.5
    t = t_(d)
    lfo = 0.75 + 0.25 * np.sin(2 * np.pi * t / 11.0)
    out *= lfo[:, None]
    if air:
        a = bp(noise(d), 300, 3000) * (0.5 + 0.5 * np.sin(2 * np.pi * t / 7.3)) * 0.05 * air
        out[:, 0] += a
        out[:, 1] += np.roll(a, 3000)
    if pulse:
        beat = 60 / pulse_bpm
        for k in range(int(d / beat)):
            i = int(k * beat * SR)
            L = int(0.45 * SR)
            if i + L >= n:
                break
            tt = np.arange(L) / SR
            p = np.sin(2 * np.pi * (55 * np.exp(-tt * 6) + 38) * tt) * np.exp(-tt * 9)
            out[i : i + L] += p[:, None] * pulse
    if pluck and scale:
        k = 0.0
        while k < d - 2:
            k += rng.uniform(2.2, 5.5)
            m = rng.choice(scale)
            L = int(3 * SR)
            i = int(k * SR)
            if i + L >= n:
                break
            tt = np.arange(L) / SR
            p = (np.sin(2 * np.pi * note(m) * tt) + 0.3 * np.sin(2 * np.pi * note(m) * 2 * tt)) * np.exp(-tt * 2.2) * pluck
            pan = rng.uniform(0.3, 0.7)
            out[i : i + L, 0] += p * (1 - pan)
            out[i : i + L, 1] += p * pan
    if swell is not None:
        out *= swell(t)[:, None]
    out = reverb(out, 4.0, 0.4)
    out *= env_ad(n, 3, 4)[:, None]
    return out


tl = json.load(open(os.path.join(ROOT, "src", "timeline.json")))
durs = {s["id"]: s["duration"] / tl["fps"] + 4 for s in tl["scenes"]}

Dm = [50, 57, 62, 65]
Bb = [46, 53, 58, 62]
Gm = [43, 50, 55, 58]
A7 = [45, 52, 57, 61]
F = [41, 48, 53, 57]
C = [48, 55, 60, 64]
Am = [45, 52, 57, 60]
E = [40, 47, 52, 56, 59]
Esus = [40, 47, 52, 57, 59]
Cs = [49, 56, 61, 64]
Ebmaj7 = [39, 46, 51, 55, 58]
Abmaj7 = [44, 51, 56, 60, 63]
G = [43, 50, 55, 59]

beds = {
    "s01": dict(chords=[(0, Dm), (14, Bb), (26, Gm), (36, A7)], seed=1, pulse=0.0, bright=900),
    "s02": dict(chords=[(0, Dm), (16, Bb), (32, Gm), (48, A7)], seed=2, pulse=0.35, pulse_bpm=72, bright=1000),
    "s03": dict(chords=[(0, [41, 48, 53, 56]), (18, [37, 44, 49, 53]), (36, [39, 46, 51, 54]), (50, [36, 43, 48, 51])], seed=3, pulse=0.2, pulse_bpm=56, bright=800),
    "s04": dict(chords=[(0, Am), (16, F), (32, C), (48, [40, 47, 52, 55])], seed=4, pluck=0.18, scale=[69, 71, 72, 76, 74, 64], bright=1300),
    "s05": dict(chords=[(0, [36, 43, 48, 49]), (20, [34, 41, 46, 47]), (40, [36, 42, 48, 51]), (56, [35, 42, 47, 48])], seed=5, pulse=0.4, pulse_bpm=64, bright=700),
    "s06": dict(chords=[(0, E), (16, [45, 52, 57, 61, 64]), (32, Cs), (48, Esus)], seed=6, pluck=0.16, scale=[76, 78, 80, 83, 85, 88], bright=1800, air=0.4),
    "s07": dict(chords=[(0, Gm), (16, [39, 46, 51, 55]), (32, [41, 48, 53, 57]), (48, [38, 45, 50, 54])], seed=7, pluck=0.1, scale=[67, 70, 74, 72], bright=1000, air=0.5),
    "s08": dict(chords=[(0, Ebmaj7), (16, Abmaj7), (32, [46, 53, 58, 62, 65]), (48, [36, 43, 48, 51, 55])], seed=8, pluck=0.12, scale=[70, 72, 75, 79, 77], bright=1200),
    "s09": dict(chords=[(0, [38, 45, 50, 53, 57]), (16, [43, 50, 55, 59, 62]), (32, [36, 43, 48, 52, 55]), (48, [38, 45, 50, 53, 59])], seed=9, pluck=0.1, scale=[62, 64, 65, 69, 71, 74], bright=1000, air=0.6),
    "s10": dict(chords=[(0, [36, 43, 48, 52, 54, 59]), (20, [38, 45, 50, 54, 57, 61]), (40, [36, 43, 48, 52, 55, 59])], seed=10, pluck=0.12, scale=[72, 76, 78, 79, 83, 86], bright=1600, air=0.3),
    "s11": dict(chords=[(0, Am), (12, F), (24, C), (36, G), (48, Am), (58, F), (68, C), (78, [43, 50, 55, 59, 62])], seed=11, pluck=0.14, scale=[69, 72, 76, 74, 79, 81], bright=1500,
                swell=lambda t: np.clip(0.5 + t / 160, 0, 1)),
}
for k, v in beds.items():
    print("bed", k)
    save(f"music/{k}.wav", bed(durs[k], **v), 0.8)

# ---------------------- efektler ---------------------------------
print("sfx")
d = 7
crowd = bp(noise(d), 250, 2500) * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * t_(d) * 0.7)))
traffic = lp(brown(d), 400) * 1.5
x = crowd * 0.25 + traffic * 0.6
for st, f0 in ((1.1, 420), (1.35, 420), (4.2, 510), (5.6, 380)):
    i = int(st * SR)
    L = int(0.25 * SR)
    tt = np.arange(L) / SR
    x[i : i + L] += np.sign(np.sin(2 * np.pi * f0 * tt)) * 0.18 * env_ad(L, 0.01, 0.05)
save("sfx/city.wav", reverb(lp(x, 5000), 1.5, 0.2), 0.7)

d = 1.4
sw = hp(noise(d), 2000) * np.linspace(0, 1, int(d * SR)) ** 3
save("sfx/vanish.wav", reverb(sw, 1.0, 0.3), 0.8)

d = 4
tt = t_(d)
boom = np.sin(2 * np.pi * (30 + 40 * np.exp(-tt * 2)) * tt) * np.exp(-tt * 1.1) + lp(noise(d), 150) * np.exp(-tt * 3) * 0.5
save("sfx/boom.wav", boom, 0.95)

d = 0.08
tt = t_(d)
save("sfx/tick.wav", hp(noise(d), 3000) * np.exp(-tt * 120) + np.sin(2 * np.pi * 2400 * tt) * np.exp(-tt * 90) * 0.5, 0.6)

d = 6
x = np.zeros(int(d * SR))
for k in range(12):
    st = k * 0.5
    L = int(0.18 * SR)
    i = int(st * SR)
    tt = np.arange(L) / SR
    f0 = 1318 if k % 2 == 0 else 1760
    x[i : i + L] += np.sin(2 * np.pi * f0 * tt) * env_ad(L, 0.005, 0.04)
save("sfx/alarm.wav", reverb(x, 0.6, 0.15), 0.45)

d = 1.2
x = np.zeros(int(d * SR))
for st, f0 in ((0, 988), (0.18, 1319)):
    i = int(st * SR)
    L = int(0.8 * SR)
    tt = np.arange(L) / SR
    seg = np.sin(2 * np.pi * f0 * tt) * np.exp(-tt * 5)
    x[i : i + L] += seg[: len(x) - i]
save("sfx/ding.wav", x, 0.4)

d = 3
tt = t_(d)
fr = 120 * np.exp(-tt * 1.2) + 18
ph = 2 * np.pi * np.cumsum(fr) / SR
pd = (np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.3 * np.sin(3 * ph)) * np.exp(-tt * 0.7)
save("sfx/powerdown.wav", reverb(pd, 1.5, 0.3), 0.8)

d = 8
tt = t_(d)
hum = (np.sin(2 * np.pi * 50 * tt) + 0.5 * np.sin(2 * np.pi * 100 * tt) + 0.2 * np.sin(2 * np.pi * 150 * tt)) * (0.8 + 0.2 * np.sin(2 * np.pi * 0.3 * tt))
save("sfx/hum.wav", hum * env_ad(len(tt), 0.5, 0.5), 0.5)

d = 2.5
tt = t_(d)
cr = lp(noise(d), 3000) * np.exp(-tt * 4) * 1.2
for f0 in (430, 670, 1130, 1790, 2510):
    cr += np.sin(2 * np.pi * f0 * tt) * np.exp(-tt * 3) * 0.15
cr += np.sin(2 * np.pi * (60 * np.exp(-tt * 4) + 30) * tt) * np.exp(-tt * 3)
save("sfx/crash.wav", reverb(cr, 1.5, 0.25), 0.85)

d = 0.6
tt = t_(d)
drip = np.sin(2 * np.pi * (600 + 1400 * tt / d) * tt) * np.exp(-tt * 18)
save("sfx/drip.wav", reverb(drip, 2.0, 0.45), 0.5)

d = 12
tt = t_(d)
water = lp(brown(d), 300) * 0.8 + bp(noise(d), 800, 3000) * 0.05 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.4 * tt))
save("sfx/water.wav", water * env_ad(len(tt), 1, 1), 0.6)

d = 20
tt = t_(d)
wind = bp(noise(d), 200, 1200) * (0.5 + 0.5 * np.sin(2 * np.pi * tt / 6.5) ** 2) + lp(brown(d), 200) * 0.4
save("sfx/wind.wav", wind * env_ad(len(tt), 2, 2), 0.55)

d = 16
tt = t_(d)
rain = hp(noise(d), 1500) * 0.4 + bp(noise(d), 400, 1200) * 0.2
for k in range(400):
    i = rng.integers(0, len(tt) - 2000)
    rain[i : i + 2000] += hp(rng.standard_normal(2000), 2000) * np.exp(-np.arange(2000) / 150) * 0.6
save("sfx/rain.wav", rain * env_ad(len(tt), 2, 2), 0.45)

d = 12
x = np.zeros(int(d * SR))
for k in range(26):
    st = rng.uniform(0, d - 0.6)
    i = int(st * SR)
    L = int(0.12 * SR)
    tt = np.arange(L) / SR
    f0 = rng.uniform(2600, 4200)
    ch = np.sin(2 * np.pi * (f0 + rng.uniform(-1500, 1500) * tt / 0.12) * tt) * env_ad(L, 0.01, 0.06)
    for r in range(rng.integers(1, 4)):
        j = i + r * int(0.15 * SR)
        if j + L < len(x):
            x[j : j + L] += ch
save("sfx/birds.wav", reverb(x, 1.8, 0.35), 0.35)

d = 1.8
tt = t_(d)
nn = noise(d)
wh = np.zeros_like(nn)
env = np.sin(np.pi * tt / d) ** 2
# kayan bant geçiren: parçalara bölerek
seg = int(0.05 * SR)
for i in range(0, len(nn), seg):
    fc = 300 + 3000 * (i / len(nn))
    wh[i : i + seg] = bp(nn[i : i + seg + 0], fc * 0.7, min(fc * 1.4, 20000))[: len(wh[i : i + seg])]
save("sfx/whoosh.wav", reverb(lp(wh, 6000) * env, 1.2, 0.3), 0.6)

d = 4
tt = t_(d)
cre = np.sin(2 * np.pi * (70 + 8 * np.sin(2 * np.pi * 3 * tt)) * tt) * env_ad(len(tt), 0.5, 1.5) + lp(brown(d), 300) * 0.6
cre += hp(noise(d), 1000) * (rng.random(len(tt)) > 0.9997) * 4
save("sfx/creak.wav", reverb(cre, 2.5, 0.4), 0.8)

d = 3
x = np.zeros(int(d * SR))
for k in range(3):
    i = int(k * 1.0 * SR)
    L = int(0.35 * SR)
    tt = np.arange(L) / SR
    x[i : i + L] += np.sign(np.sin(2 * np.pi * 740 * tt)) * 0.3 * env_ad(L, 0.01, 0.05)
save("sfx/warn.wav", lp(x, 3000), 0.35)

d = 6
tt = t_(d)
fr = 38 + 4 * np.sin(2 * np.pi * 0.2 * tt)
ph = 2 * np.pi * np.cumsum(fr) / SR
save("sfx/rumble.wav", (np.sin(ph) + lp(brown(d), 120)) * env_ad(len(tt), 1.5, 2), 0.7)

# grain dokusu
from PIL import Image
g = (rng.random((512, 512)) * 255).astype(np.uint8)
Image.fromarray(g, "L").save(os.path.join(ROOT, "public", "noise.png"))
print("bitti")
