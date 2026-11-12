# Mix: rehber seslendirme + hafif müzik + efektler -> out/mix.wav
import json, subprocess, sys, numpy as np, wave
sys.path.insert(0, '/root/lemo-opuscar/core/audio')
from sfx import SR, add, pop, ding, whoosh, click, lp, t_, env_exp, norm
DUR = 37.0
buf = np.zeros((int(DUR * SR), 2))
L = json.load(open('voice/lines.json'))
def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(float)
for i, l in enumerate(L):
    add(buf, load(f'voice/el{i:02d}.wav'), l['t0'], 0.9)
# soft music bed: bell-like arpeggio, C-Am-F-G, 96 bpm
beat = 60 / 96
chords = [[60, 64, 67, 72], [57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67]]
def bell(m, d=1.4):
    f = 440 * 2 ** ((m - 69) / 12); tt = t_(d)
    x = np.sin(2*np.pi*f*tt) + .3*np.sin(2*np.pi*2*f*tt)*env_exp(d, .25) + .1*np.sin(2*np.pi*3*f*tt)*env_exp(d,.12)
    x *= env_exp(d, .5); x[:200] *= np.linspace(0, 1, 200); return x
music = np.zeros((len(buf), 2)); n = 0; t = 0.0
while t < 34.2:
    ch = chords[(n // 8) % 4]; m = ch[[0, 1, 2, 3, 2, 1, 2, 3][n % 8]]
    add(music, bell(m), t, 0.05, pan=(-.3 if n % 2 else .3))
    if n % 8 == 0: add(music, bell(ch[0] - 12, 2.5), t, 0.06)
    t += beat / 2; n += 1
fade = np.ones(len(buf)); a, b = int(33.8 * SR), int(35.6 * SR); fade[a:b] = np.linspace(1, 0, b - a); fade[b:] = 0
buf += music * fade[:, None]
# efektler
w6 = [L[6]['t0'] + w['t'] for w in L[6]['words']]
for at, g in [(3.55, .35), (6.5, .3), (7.0, .3), (14.6, .35), (w6[1] - .15, .3), (w6[3] - .15, .3), (w6[6] - .15, .3), (32.4, .35)]:
    add(buf, pop(), at, g)
for at in [w6[1] + .45, w6[3] + .45, w6[6] + .45]: add(buf, whoosh(.25), at, .12)
add(buf, ding(), 22.5, .12); add(buf, ding(), 33.1, .14); add(buf, ding(), 34.45, .1)
for i in range(3): add(buf, click(1.6), 12.2 + i * .3, .15)
add(buf, whoosh(.4), 27.3, .18)
buf /= max(1e-9, np.abs(buf).max()) / 0.9
pcm = (np.clip(buf, -1, 1) * 32767).astype('<i2')
with wave.open('out/mix.wav', 'wb') as f:
    f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes(pcm.tobytes())
print('ok', len(buf) / SR)
