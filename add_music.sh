#!/usr/bin/env bash
# Combine the looping fireplace video with your music for YouTube.
#
#   ./add_music.sh muzik.mp3                 -> as long as the music
#   ./add_music.sh muzik.mp3 3h              -> 3 hours (music repeats)
#   ./add_music.sh muzik.mp3 90m 0.5         -> 90 minutes, crackle volume 0.5 (default 0.35)
#
# Output: out/youtube_final.mp4
set -euo pipefail
MUSIC="$1"; DUR="${2:-}"; CRACKLE_VOL="${3:-0.35}"
LOOP=out/fire_loop.mp4
OUT=out/youtube_final.mp4

to_sec() { case "$1" in *h) echo $(( ${1%h} * 3600 ));; *m) echo $(( ${1%m} * 60 ));; *) echo "${1%s}";; esac; }
if [ -z "$DUR" ]; then
  SEC=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$MUSIC")
else
  SEC=$(to_sec "$DUR")
fi
FADE_START=$(python3 -c "print(max(0, float('$SEC') - 6))")

ffmpeg -y -stream_loop -1 -i "$LOOP" -stream_loop -1 -i "$MUSIC" -t "$SEC" \
  -filter_complex "[0:a]volume=${CRACKLE_VOL}[c];[1:a]aresample=48000,volume=1.0[m];\
[m][c]amix=inputs=2:normalize=0,alimiter=limit=0.95,afade=t=in:d=3,afade=t=out:st=${FADE_START}:d=6[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 320k -movflags +faststart "$OUT"
echo "Ready: $OUT"
