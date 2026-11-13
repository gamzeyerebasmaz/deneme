# Karakter animasyonu rehberi (Blender)

## 12 animasyon prensibi → Blender'da karşılığı

| Prensip | Blender'da nasıl |
|---|---|
| Squash & stretch | root/hips `scale`, hacmi koru: `(1/√a, 1/√a, a)`; ya da Simple Deform / Lattice |
| Anticipation | Ana hareketten önce ters yönde küçük hareket (zıplamadan önce çömelme, 6–10 kare) |
| Staging | Kamera açısı ve silüet: pozu kameradan okunur yap; `look_at` + lens 35–50 mm |
| Straight ahead / pose to pose | Pose-to-pose: önce key pozlar, sonra breakdown; Graph Editor'da eğri temizliği |
| Follow-through & overlapping | Kol, baş, kuyruk gövdeden 1–3 kare geç dursun; key'leri Dope Sheet'te kaydır |
| Slow in / slow out | BEZIER interpolasyon (varsayılan); handle türü AUTO_CLAMPED; hızlı aksiyonda VECTOR |
| Arcs | Eller/baş yay çizsin; Motion Paths (`bpy.ops.pose.paths_calculate`) ile kontrol et |
| Secondary action | Göz kırpma, nefes, baş eğme; ana aksiyonu bozmayacak küçüklükte |
| Timing | 24 fps; kare sayısı = ağırlık ve hız hissi (aşağıdaki tablo) |
| Exaggeration | Gerçekçi açıların 1.3–1.5 katı; çizgi filmde pozlar net ve abartılı |
| Solid drawing | Simetrik "ikiz" pozlardan kaçın: omuz/kalça karşıt açılar, ağırlık bir bacakta |
| Appeal | Büyük kafa, büyük göz, basit silüet, sıcak doygun palet |

## Zamanlama tablosu (24 fps)

| Aksiyon | Kare |
|---|---|
| Göz kırpma | 3–5 (kapanış 1–2, açılış 2–3) |
| Hızlı baş dönüşü | 4–6 |
| Yürüme döngüsü (2 adım) | 24 tempolu, 32 normal, 40+ yorgun/yaşlı |
| Koşu döngüsü | 12–16 |
| Zıplama (anticipation→iniş→toparlanma) | 30–40 |
| El sallama (tek salınım) | 6–10 |
| Nefes (idle) | 48–96 |

## Yürüme döngüsü pozları

Tek adım = 4 poz, tam döngü = 8 poz (ikinci yarı ayna):

1. **Contact** — öndeki topuk yere değer, bacaklar en açık, kalça nötr, kollar bacaklara zıt en uçta.
2. **Down** — ağırlık öne biner, ön diz bükülür, kalça **en alçak** nokta.
3. **Passing** — arka bacak öne geçerken ayağı kalkar (diz çok bükülü), destek bacak düz.
4. **Up** — destek bacak iter, kalça **en yüksek** nokta, vücut öne düşmek üzere.

Kalçaya hafif Y-twist (±5°), omurgaya ters twist; baş öne yönelişi dengeler.
Ayak kaymasını önlemek için ileri hız = adım uzunluğu / (döngü/2). Ciddi işlerde ayaklar için
IK (Inverse Kinematics constraint) + foot-roll kontrolcüsü kullan.

## IK ekleme (bacak)

```python
pb = rig.pose.bones["shin.L"]
c = pb.constraints.new("IK")
c.target = rig
c.subtarget = "foot_ik.L"   # rig'e eklenmiş, parent'ı root olan kontrol kemiği
c.pole_target = rig
c.pole_subtarget = "knee_pole.L"
c.chain_count = 2
```

## Rigify (gerçek karakterler için)

```python
import addon_utils
# read_factory_settings() eklentileri sıfırlar: Rigify'ı ondan SONRA etkinleştir.
addon_utils.enable("rigify", default_set=True)     # Blender ile paket halinde gelir
bpy.ops.object.armature_human_metarig_add()        # tam metarig (yüz dahil)
# yüzsüz, daha hafif: bpy.ops.object.armature_basic_human_metarig_add()
# metarig'i edit mode'da mesh'e hizala
# hizalamadan sonra (metarig aktifken):
bpy.ops.pose.rigify_generate()
# mesh'i oluşan "rig"e bağla:
#   mesh seç, rig'i aktif yap -> bpy.ops.object.parent_set(type="ARMATURE_AUTO")
```

Rigify deform kemikleri `DEF-` ön ekiyle başlar; animasyonu kontrol kemiklerinde
(`torso`, `hand_ik.L`, `foot_ik.L`, `head` …) yap. Otomatik ağırlık hatası ("Bone Heat Weighting
failed") genelde birbirinden kopuk/üst üste binen mesh parçalarından olur: Merge by Distance,
ölçek uygulaması (`transform_apply(scale=True)`) ve tek parça manifold mesh çözümdür.

## Yüz ve lip sync

- **Shape key**'ler: `obj.shape_key_add(name="Basis")`, sonra `A`, `E`, `O`, `MBP`, `FV`, `Smile`.
  Değer key'le: `kb.value = 1.0; kb.keyframe_insert("value", frame=f)`.
- Fonem → ağız şekli zamanlaması: her şekli konuşmadan **1–2 kare önce** başlat (izleyici sesi
  ağızdan biraz önce bekler).
- Çizgi film gözleri: göz küresi + ayrı göz bebeği; bebeği bir `look` kemiğine ya da
  Damped Track constraint'iyle hedef empty'ye bağla.
- Kaş, göz kapağı için shape key ya da küçük kemikler; abartılı ifadeler için göz bebeğini ölçekle.

## NLA ile aksiyon birleştirme

```python
ad = rig.animation_data
track = ad.nla_tracks.new(); track.name = "Walk"
strip = track.strips.new("walk", start=1, action=ad.action)
strip.repeat = 4
strip.blend_in = strip.blend_out = 6
ad.action = None   # artık NLA'dan oynar; yeni action'ı başka track'e ekle
```

Not (4.4+): action'lar slotlu; bir action'ı başka objeye atarken `ad.action_slot` da ayarlanmalı
(ya da `ad.action = action` sonrası Blender uygun slotu otomatik seçer).

## Grease Pencil (2D/3D karışık çizgi film)

Blender 4.3+ Grease Pencil v3 kullanır (obje tipi `GREASEPENCIL`). Veri koleksiyonu 4.3–4.5'te
`bpy.data.grease_pencils_v3`, 5.0+'da `bpy.data.grease_pencils` (eski v2 API'si kaldırıldı);
4.2 ve öncesinde `bpy.data.grease_pencils` eski v2 (`GPENCIL`) API'sidir — sürümü kontrol et. 3D sahneye 2D efekt (toz, hız çizgisi,
patlama) eklemek için uygundur. Line Art modifier'ı 3D geometriden GP çizgisi üretir — Freestyle'a
hızlı, düzenlenebilir bir alternatif.

## Kamera dili

- Geniş açı (24–35 mm): sahne kurma, aksiyon; abartılı perspektif çizgi filme yakışır.
- 50 mm: diyalog, karakter yakın çekim.
- Kamerayı karakterle beraber hareket ettirmek için `Child Of`/`Track To` constraint ya da
  Follow Path; sarsıntı için Noise F-curve modifier'ı (`fc.modifiers.new("NOISE")`, strength 0.05).

## Render önerileri

- Önizleme: `resolution_percentage = 50`, EEVEE `taa_render_samples = 8–16`.
- Final: PNG dizisi render et (çökme olursa kaldığı yerden devam), sonra ffmpeg ile birleştir:
  `ffmpeg -framerate 24 -i frame_%04d.png -c:v libx264 -pix_fmt yuv420p out.mp4`.
- Şeffaf arka plan için `scene.render.film_transparent = True` + PNG RGBA.
