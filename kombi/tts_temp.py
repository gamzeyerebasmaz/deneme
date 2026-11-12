# Geçici erkek ses (edge-tts, tr-TR-AhmetNeural) -> voice/tNN.mp3 + timeline.json
import asyncio, json, os, subprocess, edge_tts
C = json.load(open('cues.json'))
async def one(i, text):
    com = edge_tts.Communicate(text.replace('...', ','), 'tr-TR-AhmetNeural', rate='+4%', proxy=os.environ.get('HTTPS_PROXY'), boundary='WordBoundary')
    w = []; f = open(f'voice/t{i:02d}.mp3', 'wb')
    async for ch in com.stream():
        if ch['type'] == 'audio': f.write(ch['data'])
        elif ch['type'] == 'WordBoundary': w.append({'w': ch['text'], 't': ch['offset']/1e7, 'd': ch['duration']/1e7})
    f.close(); return w
async def main():
    t = 0.4; out = []
    for i, (text, gap) in enumerate(C):
        w = await one(i, text)
        assert len(w) == len(text.split()), (i, [x['w'] for x in w])
        sp = w[-1]['t'] + w[-1]['d']
        out.append({'text': text, 'file': f'voice/t{i:02d}.mp3', 'at': round(t, 3), 'words': [round(t + x['t'], 3) for x in w], 'end': round(t + sp, 3)})
        t += sp + gap
    json.dump({'cues': out, 'dur': round(t + 3.2, 2)}, open('timeline.json', 'w'), ensure_ascii=False, indent=1)
    print('voice ends', round(t, 2), 'dur', round(t + 3.2, 2))
asyncio.run(main())
