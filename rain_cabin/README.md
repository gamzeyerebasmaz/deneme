# Rainy cabin – 30 s seamless loop

Made from a single still image. No generative video model was available here (no GPU, no API key), so every element is animated procedurally:

- **Stove fire:** the flames in the photo are warped by flow fields that rise continuously; procedural flame tongues are layered on top; the embers glow and spark; the stove light flickers on the stones and floor
- **Rain:** the static streaks painted in the original are removed; three parallax layers of falling rain plus gusts; thousands of water drops on the glass that refract the scene and catch highlights; larger drops slide down in stop-and-go jerks, leaving a wet trail and small beads behind
- **Other:** steam rising from the mug, flickering candle flames; the cat, furniture and camera stay still
- **Sound:** synthesized stove crackle (front, slightly left) + rain on the glass/roof (wide stereo, further back), no music

Every motion and the sound are periodic over 30 s, so the clip loops without a seam.

```bash
python3 render_rain_cabin.py      # video (~5 min)
python3 make_ambience.py          # sound
./make_long.sh 3h                 # 3-hour YouTube version
./make_long.sh 8h muzik.mp3       # with music
```
