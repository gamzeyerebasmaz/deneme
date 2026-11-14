#!/usr/bin/env python3
"""YouTube thumbnail (1280x720) from the brightest-fire frame of the loop."""
import os
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
VID = os.path.join(HERE, '../out/rain_cabin_loop_30s.mp4')
OUT = os.path.join(HERE, 'thumbnail_rain_fire.jpg')
FONT_BIG = '/usr/share/fonts/opentype/inter/InterDisplay-Black.otf'
FONT_SUB = '/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf'

# pick the frame where the stove fire is brightest
cap = cv2.VideoCapture(VID)
best, best_v = None, -1
while True:
    ok, f = cap.read()
    if not ok:
        break
    v = f[620:780, 380:540].mean()
    if v > best_v:
        best, best_v = f, v
img = cv2.resize(best, (1280, 720), interpolation=cv2.INTER_AREA).astype(np.float32) / 255

# grade: lift shadows, more contrast and warmth, so it reads on a small phone screen
img = np.clip(img, 0, 1) ** 0.82
img = np.clip((img - 0.5) * 1.12 + 0.5 + 0.02, 0, 1)
hsv = cv2.cvtColor((img * 255).astype(np.uint8), cv2.COLOR_BGR2HSV).astype(np.float32)
hsv[..., 1] = np.clip(hsv[..., 1] * 1.15, 0, 255)
img = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR).astype(np.float32) / 255
yy, xx = np.mgrid[0:720, 0:1280].astype(np.float32)
vig = 1 - 0.35 * (((xx - 640) / 760) ** 2 + ((yy - 380) / 520) ** 2)
img = np.clip(img * vig[..., None], 0, 1)
# darken the sky area a touch behind the title for legibility
band = np.exp(-((yy - 190) / 150) ** 2) * np.exp(-((xx - 860) / 420) ** 2)
img *= (1 - 0.35 * band)[..., None]

pil = Image.fromarray(cv2.cvtColor((img * 255).astype(np.uint8), cv2.COLOR_BGR2RGB)).convert('RGBA')
W = pil.width
CX = 860  # centre of the text block, over the windows (keeps fire and cat clear)

def centered(draw, text, font, y):
    w = draw.textbbox((0, 0), text, font=font)[2]
    return (CX - w // 2, y)

big = ImageFont.truetype(FONT_BIG, 128)
sub = ImageFont.truetype(FONT_SUB, 46)
l1, l2 = 'RAIN', '& FIRE'
d0 = ImageDraw.Draw(pil)
p1 = centered(d0, l1, big, 70)
p2 = centered(d0, l2, big, 190)

# warm glow + soft shadow behind the title
glow = Image.new('RGBA', pil.size, (0, 0, 0, 0))
g = ImageDraw.Draw(glow)
for p, t in ((p1, l1), (p2, l2)):
    g.text(p, t, font=big, fill=(255, 140, 40, 200))
glow = glow.filter(ImageFilter.GaussianBlur(22))
shadow = Image.new('RGBA', pil.size, (0, 0, 0, 0))
s = ImageDraw.Draw(shadow)
for p, t in ((p1, l1), (p2, l2)):
    s.text((p[0] + 4, p[1] + 6), t, font=big, fill=(0, 0, 0, 200))
shadow = shadow.filter(ImageFilter.GaussianBlur(6))
pil = Image.alpha_composite(pil, glow)
pil = Image.alpha_composite(pil, shadow)
d = ImageDraw.Draw(pil)
d.text(p1, l1, font=big, fill=(240, 246, 255))
d.text(p2, l2, font=big, fill=(255, 196, 120))

# "3 HOURS" pill
txt = '3 HOURS  •  SLEEP'
tw = d.textbbox((0, 0), txt, font=sub)[2]
px, py = CX - tw // 2 - 26, 352
pill = Image.new('RGBA', pil.size, (0, 0, 0, 0))
pd = ImageDraw.Draw(pill)
pd.rounded_rectangle((px, py, px + tw + 52, py + 70), radius=35, fill=(20, 14, 10, 175),
                     outline=(255, 170, 80, 230), width=3)
pil = Image.alpha_composite(pil, pill)
d = ImageDraw.Draw(pil)
d.text((CX - tw // 2, py + 9), txt, font=sub, fill=(255, 236, 210))

pil.convert('RGB').save(OUT, quality=92)
print(OUT, os.path.getsize(OUT) // 1024, 'KB')
