"""Her cümle için edge-tts ile Türkçe seslendirme üretir -> public/vo/*.mp3 + tools/vo_manifest.json"""
import asyncio, json, os, re, subprocess, sys
import certifi
if os.path.exists("/root/.ccr/ca-bundle.crt"):
    certifi.where = lambda: "/root/.ccr/ca-bundle.crt"
import edge_tts
sys.path.insert(0, os.path.dirname(__file__))
from narration import SCENES
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "vo"); os.makedirs(OUT, exist_ok=True)  # ham mp3 + kırpılmış wav
VOICE, RATE, PITCH = "tr-TR-AhmetNeural", "+12%", "-5Hz"

def sentences(p):
    parts = re.split(r'(?<=[.?!])\s+', p.strip())
    return [s for s in parts if s]

def trim(src, dst):
    """Baştaki/sondaki sessizliği kırp (0.04s önde, 0.12s sonda pay bırak)."""
    out = subprocess.run(["ffmpeg","-i",src,"-af","silencedetect=n=-42dB:d=0.06","-f","null","-"],capture_output=True,text=True).stderr
    total = dur(src)
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", out)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", out)]
    a = ends[0] if starts and starts[0] < 0.01 and ends else 0.0
    b = starts[-1] if starts and (len(ends) < len(starts) or ends[-1] >= total - 0.02) and starts[-1] > a else total
    a = max(0, a - 0.04); b = min(total, b + 0.12)
    subprocess.run(["ffmpeg","-y","-v","error","-i",src,"-ss",f"{a:.3f}","-to",f"{b:.3f}","-ar","48000","-ac","1","-c:a","pcm_s16le",dst],check=True)

def dur(f):
    return float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",f]).decode())

async def one(text, f, sem):
    async with sem:
        for attempt in range(5):
            try:
                if not os.path.exists(f) or os.path.getsize(f) < 1000:
                    await edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH).save(f)
                return
            except Exception as e:
                print("retry", f, e); await asyncio.sleep(2 + attempt * 2)

async def main():
    sem = asyncio.Semaphore(4); jobs = []; manifest = []
    for sc in SCENES:
        paras = []
        for pi, p in enumerate(sc["paras"]):
            sents = []
            for si, s in enumerate(sentences(p)):
                f = f"{sc['id']}_{pi:02d}_{si}.mp3"
                jobs.append(one(s, os.path.join(OUT, f), sem))
                sents.append({"text": s, "file": f})
            paras.append(sents)
        manifest.append({**{k: v for k, v in sc.items() if k != "paras"}, "paras": paras})
    await asyncio.gather(*jobs)
    for sc in manifest:
        for p in sc["paras"]:
            for s in p:
                raw = os.path.join(OUT, s["file"]); wav = raw.replace(".mp3", ".wav")
                trim(raw, wav); s["file"] = os.path.basename(wav)
                s["dur"] = round(dur(wav), 3)
    json.dump(manifest, open(os.path.join(ROOT, "tools", "vo_manifest.json"), "w"), ensure_ascii=False, indent=1)
    print("ok", sum(s["dur"] for sc in manifest for p in sc["paras"] for s in p))
asyncio.run(main())
