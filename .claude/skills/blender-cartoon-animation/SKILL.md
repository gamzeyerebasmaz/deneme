---
name: blender-cartoon-animation
description: Use when building 3D cartoon/animated scenes or animating characters in Blender with Python (bpy). Covers toon/cel shading, outlines, stylised characters, armature rigs, keyframe animation (walk cycles, jumps, waves, idle, blinks), the 12 animation principles, and headless rendering to PNG/MP4. Triggers include "Blender", "bpy", "3D çizgi film", "karakter animasyonu", "toon shading", "cel shading", "rig", "walk cycle", "yürüme döngüsü", "squash and stretch", and "render animation".
---

# Blender: 3D çizgi film ve karakter animasyonu

Bu skill, Blender'da Python (bpy) ile şunları yapmak içindir: çizgi film görünümlü sahne kurmak,
basit ama rig'li bir karakter oluşturmak, onu canlandırmak ve headless render almak.
Çalışan, test edilmiş yardımcı script'ler `scripts/` altında. İstek ne kadar özel olursa olsun,
sıfırdan yazmak yerine önce bunları import edip genişlet.

| Dosya | İçerik |
|---|---|
| `scripts/toon.py` | `toon_material`, `flat_material`, `add_outline` (inverted hull), `enable_freestyle`, `setup_world`, `add_key_light`, `add_camera`, `add_ground`, `setup_render`, `rgba` (hex/sRGB → lineer) |
| `scripts/character.py` | `build_character()`: primitive'lerden karakter + armature (root, hips, spine, head, eyes, thigh/shin/arm .L/.R) |
| `scripts/animate.py` | `key`, `key_pose`, `mirror_pose`, `squash`, `make_cyclic`, `set_interpolation`, hazır aksiyonlar: `walk_cycle`, `jump`, `wave`, `idle_breathe`, `blink`, `blink_every` |
| `scripts/compat.py` | Sürüm uyumu (4.2 LTS → 5.x): `set_eevee`, `iter_fcurves`, `set_video_output`, `set_png_output` |
| `scripts/build_demo.py` | Hepsini birleştiren CLI: sahne + karakter + aksiyon → .blend / önizleme PNG / MP4 |
| `references/animation-guide.md` | 12 animasyon prensibi, zamanlama tabloları, yürüme pozları, Rigify, lip sync, NLA, Grease Pencil |

## Hızlı başlangıç

```bash
SK=.claude/skills/blender-cartoon-animation/scripts
blender -b -P $SK/build_demo.py -- --action walk --out shot.blend
blender -b -P $SK/build_demo.py -- --action jump --preview previews/ --preview-frames 1,8,18,26
blender -b -P $SK/build_demo.py -- --action wave --color "#4FA3E0" --render wave.mp4
```

`--action walk|jump|wave|idle`, `--stepped` (anime tarzı "on twos" CONSTANT interpolasyon),
`--freestyle` (ek çizgi), `--outline 0` (kabuk outline'ı kapatır), `--res 1920x1080`, `--fps 24`.

Kendi sahnende:

```python
import sys; sys.path.insert(0, "<skill>/scripts")
import toon, animate
from character import build_character

scene = toon.reset_scene()
toon.setup_world(scene, "#BFE3F7"); toon.add_key_light(); toon.add_ground()
rig = build_character(body_color="#E85D75", name="Mia")
end = animate.walk_cycle(rig, cycle=24, stride=0.65, travel_cycles=3)
animate.blink_every(rig, 1, end)
toon.add_camera(location=(9, -5.5, 2), target=(0, -2, 1.1), lens=35)
toon.setup_render(scene, fps=24, frames=(1, end))
```

## Blender yoksa

Blender kurulu değilse PyPI'deki `bpy` modülü aynı API'yi verir (Python sürümü eşleşmeli;
`bpy` 5.x → Python 3.13): `pip install bpy` → `python build_demo.py --action walk ...`
(`--` gerekmez). Headless Linux'ta EEVEE render için EGL gerekir: `apt-get install -y libegl1
libgl1-mesa-dri libegl-mesa0` (yazılım rasterizer ile çalışır, yavaştır: küçük `--res` kullan).

## Toon görünümü: kritik kurallar

1. **Motor EEVEE.** `Shader to RGB` yalnızca EEVEE'de çalışır; Cycles'ta toon materyal düz görünür.
   Enum adı sürüme göre değişir — her zaman `compat.set_eevee(scene)` kullan.
2. **View Transform = Standard.** Filmic/AgX paleti soldurur. `setup_render` bunu ayarlar.
3. **Renkler sRGB/hex olarak verilir**, node soketleri lineerdir → `toon.rgba("#F59A2B")`.
   Lineer değeri doğrudan sokete yazarsan renkler soluk çıkar.
4. **Dünya ışığı sahneyi aydınlatmamalı** (`setup_world(..., ambient=0)`): ambient ışık her pikseli
   ColorRamp eşiğinin üstüne çıkarır ve gölge bandı kaybolur. Gökyüzü yalnız kameraya görünür
   (Light Path → Is Camera Ray).
5. **Tek güçlü Sun ışığı** gölge sınırını belirler; ışığı çevirerek gölge şeklini sanat yönetimi
   gibi ayarla. Gölge eşiği `toon_material(..., shadow_size=0.45)`.
6. **Outline (inverted hull)**: Solidify (flip normals, offset 1, material_offset) + back-face
   culled koyu materyal. Bu kabuk **gölge düşürmemeli**, yoksa karakterin tamamı gölgede kalır —
   `outline_material()` bunu Light Path → Is Shadow Ray ile çözer. Modifier sırası:
   Armature → Solidify (outline deformasyonu takip etsin).
7. **Freestyle** alternatiftir (çözünürlüğe bağlı, yavaş). `read_factory_settings(use_empty=True)`
   sonrası varsayılan lineset'in line style'ı `None` olur → "strokes set empty"; `enable_freestyle`
   bunu düzeltir.
8. Gölge rengi düz koyulaştırma yerine mavi-mora kaydırılır (daha "animasyon" hissi).

## Rig ve kemik eksenleri

`character.py`'deki rig'de karakter **-Y'ye bakar** (Blender "Front" görünümü). Pose-bone
Euler XYZ (derece) konvansiyonu — `animate.py` başlığında da yazılı:

| Kemik | Eksen anlamı |
|---|---|
| hips / spine / head | +X öne eğil, +Y kendi etrafında dön, +Z yana yat; hips `loc` Y = yukarı |
| thigh.* | −X bacak öne, +X geriye |
| shin.* | +X diz bük |
| arm.* | +X kol öne, −X geriye; yana kaldır: arm.L +Z, arm.R −Z |
| root | `loc` = dünya eksenleri (−Y ileri), `scale` → squash/stretch (zemin pivotlu) |
| eyes | scale Z → göz kırpma |

Başka bir rig'de eksenleri **tahmin etme**, ölç: `bone.matrix_local.to_3x3().col[0..2]` X/Y/Z'yi
dünya uzayında verir. Yatay kemiklerde roll'ü sabitlemek için edit mode'da
`edit_bone.align_roll(vector)` kullan (Z eksenini vektöre hizalar).

Gerçek (organik, tek parça mesh) karakterlerde Rigify kullan — bkz. `references/animation-guide.md`.
Primitive karakterlerde her parçayı tek kemiğe %100 bağlamak (vertex group + Armature modifier)
otomatik ağırlıklandırmadan daha güvenilirdir ve background modda operatör gerektirmez.

## Animasyon iş akışı

1. **Pozlarla düşün (pose-to-pose)**: önce key pozlar (contact, extreme), sonra breakdown'lar,
   en son in-between/eğriler. `key_pose(rig, frame, {bone: {"rot": ..., "loc": ..., "scale": ...}})`.
2. **Zamanlama 24 fps** üzerinden: yürüme döngüsü 24 kare (tempolu) / 32 kare (rahat); göz kırpma
   3–5 kare; anticipation ≈ aksiyonun 1/3'ü; iniş squash'ı 1–2 kare.
3. **Döngüler**: `make_cyclic` (F-curve Cycles modifier). Döngünün ilk ve son pozu aynı olmalı;
   ileri hareket eden `root` döngüden hariç tutulup LINEAR extrapolation alır (`walk_cycle` örneği).
4. **Simetri**: ikinci adımı `mirror_pose` ile türet (.L↔.R, Y/Z rotasyon işareti ters).
5. **Squash & stretch hacmi korur**: `squash(a)` → `(1/√a, 1/√a, a)`.
6. **Overlapping action / follow-through**: baş, kollar gövdeden 1–3 kare gecikmeli gelsin;
   `wave`'deki baş eğilmesi gibi ikincil hareketler ekle.
7. **Stil**: akıcı 3D için BEZIER; anime/stop-motion hissi için `set_interpolation(rig, "CONSTANT")`
   ve key'leri 2 karede bir koy; çizgi film "pop"u için seçili key'lerde `BACK`/`ELASTIC` easing.
8. Birden çok aksiyonu birleştirmek için NLA (bkz. referans) veya aksiyonları farklı kare
   aralıklarına sırayla key'le (`walk_cycle(..., start=...)` dönüş değeri bir sonrakinin başlangıcı).

## Sürüm notları (4.2 LTS → 5.x)

- Blender 4.4+ katmanlı (slotted) action kullanır; 5.0'da `Action.fcurves` kaldırıldı →
  F-curve'lere her zaman `compat.iter_fcurves(obj)` ile eriş.
- EEVEE enum'u: 4.2–4.x `BLENDER_EEVEE_NEXT`, diğerleri `BLENDER_EEVEE` → `set_eevee`.
- 5.0+ video çıktısında önce `image_settings.media_type = "VIDEO"` → `set_video_output`.
- `ShaderNodeMix` (RGBA) soket indeksleri: giriş A=6, B=7, çıkış Result=2.

## Doğrulama (her zaman yap)

Animasyonu teslim etmeden önce birkaç anahtar kareyi düşük çözünürlükte render edip **görsel
olarak kontrol et** (`--preview dir --preview-frames ...`, `--res 480x270`), sonra PNG'leri oku:

- Karakterin aydınlık tarafı base renk, gölge tarafı gölge renginde mi? (Hepsi gölgedeyse:
  outline kabuğu gölge düşürüyor ya da ışık arkada.)
- Kontur var mı, kalınlık tutarlı mı?
- Pozlar beklenen yönde mi (bacak öne mi, kol yukarı mı)? Değilse işareti/ekseni ölç ve düzelt.
- Döngü dikişinde (ilk/son kare) sıçrama var mı?
- Yürürken ayak kayıyor mu? `stride` değerini bacak açıklığıyla eşleştir.
