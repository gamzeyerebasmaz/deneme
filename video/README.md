# Dünyada Son İnsan da Yok Olursa — 12 dk animasyon (Remotion)

Sinematik 2.5D mini belgesel · 1920×1080 · 30 fps · **11:59** · Türkçe seslendirme + altyazı.

## Üretim hattı

| Adım | Komut | Çıktı |
|---|---|---|
| 1. Seslendirme (edge-tts, `tr-TR-AhmetNeural`) | `python3 tools/tts.py` | `public/vo/*.wav`, `tools/vo_manifest.json` |
| 2. Zaman çizelgesi | `python3 tools/build_timeline.py` | `src/timeline.json` |
| 3. Müzik + efektler (sentetik, telifsiz) | `python3 tools/gen_audio.py` | `public/music`, `public/sfx`, `public/noise.png` |
| 4. Önizleme | `npm run studio` | Remotion Studio |
| 5. Render | `npm run render` | `out/son-insan.mp4` |
| 6. Altyazı (SRT) | `python3 tools/make_srt.py` | `out/son-insan-yok-olursa.srt` |

Gereksinimler: Node 18+, Python 3 (`pip install edge-tts numpy scipy pillow`), ffmpeg.

Metin `tools/narration.py` içindedir; değiştirince 1–3. adımları tekrar çalıştırın — görseller paragraf
başlangıçlarına (`useBeats().b(i)`) bağlı olduğu için otomatik olarak yeni zamanlamaya uyar.

Kompozisyonlar: `Belgesel` (altyazılı), `BelgeselAltyazisiz`, ve her sahne için `Sahne-s01` … `Sahne-s11`.

## Sahneler

| # | Zaman | Görsel yaklaşım |
|---|---|---|
| 01 | 08:00 | Kalabalık cadde → herkes kaybolur, kıyafetler/telefonlar kalır; 4'lü montaj; Dünya; başlık |
| 02 | +1 saat | Trafik ışığı, fabrika robotları, otomatik fren, kuşbakışı kaza, otopilot/yakıt, alarm, sipariş ekranı |
| 03 | +24 saat | Enerji hatları, üretim–tüketim dengesi (50 Hz), boş kontrol odası, kademeli arıza, sönen şehir, gece haritası, son pencere, ay |
| 04 | +7 gün | Ev, köpek/kedi, çiftlik yemleme, market soğutucu, su şebekesi, bakım takvimi |
| 05 | +30 gün | Metro kesiti, pompalar (13 milyon galon), su basan tünel, rafineri, reaktör artık ısı şeması |
| 06 | +1 yıl | Otlanan yol, park, tilki, bölgesel farklar, AVM önünde tilki |
| 07 | +10 yıl | Çatı sızıntısı, kök/çatlak, ayakta kalan kuleler, yağmurlu otoyol, damla |
| 08 | +50 yıl | Orman–şehir, paslanan köprü, donma–çözülme, çöken/ayakta kalan bina, yaban hayatı koridoru |
| 09 | +500 yıl | Harabeler, taş anıtlar, yeraltı katmanları, örter/parçalar/taşır, stadyumda sürü |
| 10 | +1000 yıl | Mevsimler, CO₂ ve sıcaklık (temsili), yörüngeden düşen uydular, insan katmanı |
| 11 | Final | Geri sarma, özet, derin zaman, işbirliği ağı, ziyaretçi sorusu, Dünya'dan uzaklaşma, 3 sn sessizlik, kaynaklar |

Kaynaklar: NRC.gov, NY1/MTA, National Academies (NASEM), NASA Science.
