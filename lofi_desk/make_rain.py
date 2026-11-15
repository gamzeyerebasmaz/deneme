#!/usr/bin/env python3
"""Seamlessly looping calm rain on a window and roof (wide stereo). 48 kHz stereo WAV.

Usage: python3 make_rain.py [--seconds 30] [--out out/rain_loop.wav]
"""
import argparse
import os
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__))
ap = argparse.ArgumentParser()
ap.add_argument('--seconds', type=float, default=30.0)
ap.add_argument('--out', default=os.path.join(HERE, 'out/rain_loop.wav'))
ap.add_argument('--stems', action='store_true', help='also write fire/rain stems')
args = ap.parse_args()

SR = 48000
T = args.seconds
N = int(SR * T)
rng = np.random.default_rng(5)
tsec = np.arange(N) / SR


def loop_filter(x, sos):
    """Filter a periodic signal so the loop point stays seamless (filter state wraps)."""
    return sosfilt(sos, np.tile(x, 3))[N:2 * N]


def bp(lo, hi, order=2):
    return butter(order, [lo, min(hi, SR / 2 - 200)], btype='band', fs=SR, output='sos')


def shaped_noise(lo, hi, slope, seed):
    r = np.random.default_rng(seed)
    spec = np.fft.rfft(r.standard_normal(N))
    f = np.fft.rfftfreq(N, 1 / SR); f[0] = 1
    g = f ** (-slope / 2) / (1 + (lo / f) ** 4) / (1 + (f / hi) ** 4)
    x = np.fft.irfft(spec * g, n=N)
    return x / np.sqrt(np.mean(x ** 2))


def lfo(n_terms, seed, lo=1, hi=30):
    r = np.random.default_rng(seed)
    ks = r.integers(lo, hi, n_terms); ph = r.uniform(0, 2 * np.pi, n_terms)
    s = sum(np.sin(2 * np.pi * k * tsec / T + p) / np.sqrt(k) for k, p in zip(ks, ph))
    return s / np.abs(s).max()


def rms(x):
    return np.sqrt(np.mean(x ** 2))


def place(buf, sig, t0, pan):
    idx = (int(t0 * SR) + np.arange(len(sig))) % N
    np.add.at(buf[:, 0], idx, sig * np.cos(pan * np.pi / 2))
    np.add.at(buf[:, 1], idx, sig * np.sin(pan * np.pi / 2))


def burst(amp, dur_ms, lo, hi):
    n = max(8, int(SR * dur_ms / 1000))
    x = sosfilt(bp(lo, hi), rng.standard_normal(n * 3))[n:]
    env = np.exp(-np.arange(len(x)) / n * rng.uniform(4, 7)); env[:12] *= np.linspace(0, 1, 12)
    x *= env
    return amp * x / (np.abs(x).max() + 1e-9)


# =========================================================== RAIN (wide, behind)
rain = np.zeros((N, 2))
gust = 0.82 + 0.18 * lfo(6, 20, 1, 8)            # slow swells, never a sudden change
for c, seed in ((0, 21), (1, 22)):               # independent L/R -> wide stereo
    bed = shaped_noise(180, 9000, 0.7, seed)
    rain[:, c] += 0.050 * bed * gust


def impulse_train(rate, amp_sigma, seed):
    r = np.random.default_rng(seed)
    n = int(rate * T)
    x = np.zeros(N)
    np.add.at(x, r.integers(0, N, n), r.lognormal(0, amp_sigma, n) * r.choice([-1, 1], n))
    return x


for c in range(2):                               # drops hitting the glass: dense fine patter
    x = loop_filter(impulse_train(550, 0.35, 30 + c), bp(2200, 8000))
    rain[:, c] += 0.022 * x / rms(x) * gust
for c in range(2):                               # duller patter on the roof
    x = loop_filter(impulse_train(350, 0.35, 40 + c), bp(400, 1800))
    rain[:, c] += 0.020 * x / rms(x) * gust
t = 0.0
while True:                                      # occasional soft drip from the eaves
    t += rng.uniform(0.6, 2.2)
    if t >= T - 0.2:
        break
    n = int(0.06 * SR); tt = np.arange(n) / SR
    f0 = rng.uniform(900, 1800)
    s = np.sin(2 * np.pi * (f0 * tt + 2500 * tt ** 2)) * np.exp(-tt / 0.012)
    place(rain, 0.025 * s, t, rng.choice([rng.uniform(0.0, 0.25), rng.uniform(0.75, 1.0)]))

# =========================================================== MIX
mix = rain
mix *= 0.80 / np.abs(mix).max()
os.makedirs(os.path.dirname(args.out), exist_ok=True)
wavfile.write(args.out, SR, (mix * 32767 * 0.89).astype(np.int16))
print('done', args.out)
