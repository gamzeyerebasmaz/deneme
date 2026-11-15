#!/usr/bin/env python3
"""Lofi-style reframe of the rainy cabin: window + table 'desk' + cat + stove, regraded."""
import cv2
import numpy as np

src = cv2.imread('src/cabin_rain.webp').astype(np.float32) / 255
x0, y0, w = 270, 250, 1240                  # crop in source px (16:9)
h = int(round(w * 9 / 16))
crop = src[y0:y0 + h, x0:x0 + w]
img = cv2.resize(crop, (1920, 1080), interpolation=cv2.INTER_LANCZOS4)
blur = cv2.GaussianBlur(img, (0, 0), 1.2)
img = np.clip(img + 0.6 * (img - blur), 0, 1)              # mild sharpen after upscale

b, g, r = img[..., 0], img[..., 1], img[..., 2]
lum = 0.114 * b + 0.587 * g + 0.299 * r
cool = np.clip((b - r) * 6 + 0.5, 0, 1)                    # 1 = bluish (outside), 0 = warm
cool = cv2.GaussianBlur(cool, (0, 0), 6)[..., None]

# outside: deeper navy / teal, lights kept
navy = img * np.array([1.12, 0.98, 0.80], np.float32)
navy = navy * 0.80
# inside: warmer amber, slightly lower exposure in shadows, keep highlights
warm = img * np.array([0.86, 0.97, 1.08], np.float32)
img = warm * (1 - cool) + navy * cool

# soft lamp-like pool of warm light over the table (light source off-frame, top-left)
H, W = 1080, 1920
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
pool = np.exp(-(((xx - 1050) / 520) ** 2 + ((yy - 860) / 230) ** 2))
img = img * (1 + 0.22 * pool[..., None] * np.array([0.55, 0.85, 1.0], np.float32))

# filmic contrast + vignette, lofi mood
img = np.clip(img, 0, 1)
img = img ** 1.18 * 0.97                                   # deeper shadows, moody
img = np.clip((img - 0.5) * 1.06 + 0.5, 0, 1)
vig = 1 - 0.38 * (((xx - 960) / 1150) ** 2 + ((yy - 560) / 760) ** 2)
img = np.clip(img * vig[..., None], 0, 1)
cv2.imwrite('src/lofi_cabin.png', (img * 255 + 0.5).astype(np.uint8))
print('ok')
