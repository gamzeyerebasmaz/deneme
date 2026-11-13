# Cozy Fireplace – YouTube loop

- `src/cabin.webp` – source image
- `render_fire.py` – animates the fire, candles, steam and room glow; makes a 60 s seamless loop (1920x1080, 30 fps)
- `make_crackle.py` – synthesizes the looping crackle sound
- `add_music.sh` – mixes in your music and extends the video to the length you want
- `out/fire_loop.mp4` – finished 60 s loop (fire + crackle)

```bash
./add_music.sh muzik.mp3 3h
```
