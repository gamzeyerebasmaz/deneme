#!/usr/bin/env python3
"""Synthesize a calm, seamlessly looping fireplace crackle (stereo WAV).

Usage: python3 make_crackle.py [--seconds 60] [--out out/crackle_loop.wav]
"""
import argparse
import os
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

ap = argparse.ArgumentParser()
ap.add_argument('--seconds', type=float, default=60.0)
ap.add_argument('--out', default='out/crackle_loop.wav')
args = ap.parse_args()

SR = 48000
T = args.seconds
N = int(SR * T)
rng = np.random.default_rng(42)


def shaped_noise(lo, hi, slope, seed):
    """Periodic noise with a band-limited 1/f^slope spectrum (loops perfectly)."""
    r = np.random.default_rng(seed)
    spec = np.fft.rfft(r.standard_normal(N))
    f = np.fft.rfftfreq(N, 1 / SR)
    f[0] = 1
    g = f ** (-slope / 2) * (1 / (1 + (lo / f) ** 4)) * (1 / (1 + (f / hi) ** 4))
    x = np.fft.irfft(spec * g, n=N)
    return x / np.abs(x).max()


def slow_lfo(n_terms, seed, lo=1, hi=30):
    r = np.random.default_rng(seed)
    ks = r.integers(lo, hi, n_terms)
    ph = r.uniform(0, 2 * np.pi, n_terms)
    t = np.arange(N) / SR
    s = sum(np.sin(2 * np.pi * k * t / T + p) / np.sqrt(k) for k, p in zip(ks, ph))
    return s / np.abs(s).max()


# ---- soft roar of the burning logs
roar = shaped_noise(90, 450, 1.0, 1)
roar *= 0.55 + 0.45 * (0.5 + 0.5 * slow_lfo(10, 2, 2, 60))
hiss = shaped_noise(2500, 9000, 0.3, 3) * (0.6 + 0.4 * slow_lfo(8, 4, 5, 90))

out = np.zeros((N, 2))
out[:, 0] += 0.05 * roar + 0.02 * hiss
out[:, 1] += 0.05 * np.roll(roar, 911) + 0.02 * np.roll(hiss, 1733)


def add_event(sig, start, pan):
    """Add with wrap-around so events near the end spill into the start of the loop."""
    n = len(sig)
    idx = (start + np.arange(n)) % N
    gl = np.cos(pan * np.pi / 2)
    gr = np.sin(pan * np.pi / 2)
    np.add.at(out[:, 0], idx, sig * gl)
    np.add.at(out[:, 1], idx, sig * gr)


def crackle(amp, dur_ms, f_lo, f_hi):
    n = max(8, int(SR * dur_ms / 1000))
    x = rng.standard_normal(n * 3)
    sos = butter(2, [f_lo, min(f_hi, SR / 2 - 100)], btype='band', fs=SR, output='sos')
    x = sosfilt(sos, x)[n:]
    env = np.exp(-np.arange(len(x)) / n * rng.uniform(4, 7))
    env[:12] *= np.linspace(0, 1, 12)
    x = x * env
    return amp * x / (np.abs(x).max() + 1e-9)


# ---- small crackles, arriving in little clusters
t = 0.0
while t < T:
    t += rng.exponential(1 / 3.5)                # cluster rate
    n_in = rng.integers(1, 7)
    tc = t
    for _ in range(n_in):
        tc += rng.exponential(0.035)
        amp = 0.04 * np.exp(rng.normal(0, 0.7))
        lo = rng.uniform(900, 3000)
        sig = crackle(min(amp, 0.25), rng.uniform(0.6, 4), lo, lo * rng.uniform(2, 5))
        add_event(sig, int((tc % T) * SR), np.clip(rng.normal(0.58, 0.12), 0.1, 0.9))

# ---- sparse tiny ticks (very soft, keep texture alive)
for _ in range(int(T * 9)):
    lo = rng.uniform(2500, 6000)
    sig = crackle(0.012 * np.exp(rng.normal(0, 0.5)), rng.uniform(0.3, 1.2), lo, lo * 2.5)
    add_event(sig, int(rng.uniform(0, T) * SR), np.clip(rng.normal(0.55, 0.15), 0.1, 0.9))

# ---- occasional bigger pops / snaps of the wood
t = 0.0
while True:
    t += rng.uniform(2.0, 6.0)
    if t >= T:
        break
    pop = crackle(0.22 * np.exp(rng.normal(0, 0.3)), rng.uniform(8, 18), 300, 3500)
    thump = crackle(0.04, 25, 120, 400)
    s = int(t * SR)
    add_event(pop, s, 0.6)
    add_event(thump, s, 0.6)
    tc = t
    for _ in range(rng.integers(3, 10)):        # sizzle after a pop
        tc += rng.exponential(0.05)
        lo = rng.uniform(1500, 4000)
        add_event(crackle(0.05 * np.exp(rng.normal(0, 0.5)), rng.uniform(0.5, 3), lo, lo * 3),
                  int((tc % T) * SR), np.clip(rng.normal(0.6, 0.1), 0.2, 0.9))

# gentle overall shaping: soften harsh top end
sos = butter(2, 11000, btype='low', fs=SR, output='sos')
# filter 3 copies so the filter state wraps around and the loop stays seamless
for ch in range(2):
    y = sosfilt(sos, np.tile(out[:, ch], 3))
    out[:, ch] = y[N:2 * N]

out *= 0.7 / np.abs(out).max()                   # peak about -3 dBFS
os.makedirs(os.path.dirname(args.out) or '.', exist_ok=True)
wavfile.write(args.out, SR, (out * 32767).astype(np.int16))
print('done', args.out)
