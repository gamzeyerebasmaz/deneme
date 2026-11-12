# Mix: seslendirme + hafif müzik + efektler -> out/mix.wav   (python mix.py)
import json, subprocess, sys, wave, numpy as np
sys.path.insert(0, '/root/lemo-opuscar/core/audio')
from sfx import SR, add, pop, ding, whoosh, click, t_, env_exp, norm
TL = json.load(open('timeline.json')); EV = json.load(open('events.json'))['ev']; DUR = EV and json.load(open('events.json'))['dur']
buf = np.zeros((int(DUR * SR) + SR, 2))
def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(float)
for q in TL['cues']: add(buf, load(q['file']), q['at'] - q.get('lead', 0), 0.9)
beat = 60 / 100; chords = [[60, 64, 67, 72], [57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67]]
def bell(m, d=1.4):
    f = 440 * 2 ** ((m - 69) / 12); tt = t_(d)
    x = np.sin(2*np.pi*f*tt) + .3*np.sin(2*np.pi*2*f*tt)*env_exp(d, .25) + .1*np.sin(2*np.pi*3*f*tt)*env_exp(d, .12)
    x *= env_exp(d, .5); x[:200] *= np.linspace(0, 1, 200); return x
music = np.zeros_like(buf); n = 0; t = 0.0; endv = TL['cues'][-1]['end'] + 0.5
while t < endv + 1:
    ch = chords[(n // 8) % 4]; m = ch[[0, 1, 2, 3, 2, 1, 2, 3][n % 8]]
    add(music, bell(m), t, 0.045, pan=(-.3 if n % 2 else .3))
    if n % 8 == 0: add(music, bell(ch[0] - 12, 2.5), t, 0.055)
    t += beat / 2; n += 1
fade = np.ones(len(buf)); a, b = int((endv + 0.2) * SR), int((endv + 2.4) * SR); fade[a:b] = np.linspace(1, 0, b - a); fade[b:] = 0
buf += music * fade[:, None]
def coin():
    d = .5; tt = t_(d); return norm(np.sin(2*np.pi*1980*tt)*env_exp(d, .12) + .6*np.sin(2*np.pi*2640*tt)*env_exp(d, .2)*(tt > .07))
def stamp():
    return norm(np.concatenate([whoosh(.12), pop() * 0])[:int(.12*SR)]) * .3 + 0
S = {'pop': (pop, .3), 'whoosh': (lambda: whoosh(.3), .14), 'ding': (ding, .1), 'click': (lambda: click(1.5), .2), 'tick': (lambda: click(2.2), .2),
     'coin': (coin, .25), 'swish': (lambda: whoosh(.22), .07), 'stamp': (lambda: pop() * 0 + norm(np.sin(2*np.pi*90*t_(.18))*env_exp(.18, .05)), .45)}
for e in EV:
    f, g = S[e['type']]; add(buf, f(), e['t'], g)
buf = buf[:int(DUR * SR)]; buf /= max(1e-9, np.abs(buf).max()) / 0.9
pcm = (np.clip(buf, -1, 1) * 32767).astype('<i2')
with wave.open('out/mix.wav', 'wb') as f: f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes(pcm.tobytes())
print('mix', round(len(buf) / SR, 2), 's,', len(EV), 'events')
