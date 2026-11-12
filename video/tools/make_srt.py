"""src/timeline.json -> out/son-insan-yok-olursa.srt (YouTube altyazısı)"""
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
t = json.load(open(os.path.join(ROOT, "src", "timeline.json"))); fps = t["fps"]
def ts(fr):
    s = fr / fps; h = int(s // 3600); m = int(s % 3600 // 60); sec = s % 60
    return f"{h:02d}:{m:02d}:{int(sec):02d},{int(round((sec % 1) * 1000)):03d}"
out, n = [], 0
for sc in t["scenes"]:
    for p in sc["paras"]:
        for s in p["sents"]:
            n += 1; a = sc["from"] + s["start"]; b = a + s["dur"] + 6
            out.append(f"{n}\n{ts(a)} --> {ts(b)}\n{s['text']}\n")
os.makedirs(os.path.join(ROOT, "out"), exist_ok=True)
open(os.path.join(ROOT, "out", "son-insan-yok-olursa.srt"), "w").write("\n".join(out))
print(n, "satır")
