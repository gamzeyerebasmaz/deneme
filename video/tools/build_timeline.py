"""vo_manifest.json -> src/timeline.json (30 fps kare zamanlaması)."""
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS = 30
SENT_GAP, PARA_GAP, MAX_GAP, POST = 0.3, 0.75, 2.6, 1.4
m = json.load(open(os.path.join(ROOT, "tools", "vo_manifest.json")))
scenes, t0 = [], 0
for sc in m:
    pre, post = sc.get("pre", 2.5), sc.get("post", POST)
    speech = sum(s["dur"] for p in sc["paras"] for s in p) + SENT_GAP * sum(len(p) - 1 for p in sc["paras"])
    n = len(sc["paras"])
    natural = pre + speech + PARA_GAP * (n - 1) + post
    gap = PARA_GAP
    if natural < sc["target"]:
        gap = min(MAX_GAP, PARA_GAP + (sc["target"] - natural) / max(1, n - 1))
    t = pre; paras = []
    for i, p in enumerate(sc["paras"]):
        ps = t; sents = []
        for j, s in enumerate(p):
            sents.append({"text": s["text"], "file": "vo/" + s["file"], "start": round(t * FPS), "dur": round(s["dur"] * FPS)})
            t += s["dur"] + (SENT_GAP if j < len(p) - 1 else 0)
        paras.append({"start": round(ps * FPS), "end": round(t * FPS), "sents": sents})
        if i < n - 1: t += gap
    total = max(t + post, sc["target"])
    d = round(total * FPS)
    scenes.append({"id": sc["id"], "title": sc["title"], "label": sc["label"], "from": t0, "duration": d, "paras": paras})
    t0 += d
json.dump({"fps": FPS, "total": t0, "scenes": scenes}, open(os.path.join(ROOT, "src", "timeline.json"), "w"), ensure_ascii=False)
for s in scenes: print(s["id"], round(s["duration"] / FPS, 1))
print("TOPLAM", f"{t0 / FPS // 60:.0f}:{t0 / FPS % 60:04.1f}")
