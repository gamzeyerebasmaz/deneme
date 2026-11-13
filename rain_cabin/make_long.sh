#!/usr/bin/env bash
# Repeat the 30 s seamless loop to any length for YouTube (no re-encode of video).
#   ./make_long.sh 3h                 -> 3 hours, fire + rain sound only
#   ./make_long.sh 8h muzik.mp3 0.6   -> 8 hours, music mixed in (ambience volume 0.6)
set -euo pipefail
cd "$(dirname "$0")"
DUR="$1"; MUSIC="${2:-}"; AMB_VOL="${3:-0.6}"
LOOP=out/rain_cabin_loop_30s.mp4
OUT=out/rain_cabin_${DUR}.mp4
case "$DUR" in *h) SEC=$(( ${DUR%h} * 3600 ));; *m) SEC=$(( ${DUR%m} * 60 ));; *) SEC="${DUR%s}";; esac
FO=$(( SEC - 5 ))
if [ -z "$MUSIC" ]; then
  ffmpeg -y -stream_loop -1 -i "$LOOP" -t "$SEC" -map 0:v -map 0:a -c:v copy \
    -af "afade=t=in:d=3,afade=t=out:st=${FO}:d=5" -c:a aac -b:a 256k -ar 48000 -movflags +faststart "$OUT"
else
  ffmpeg -y -stream_loop -1 -i "$LOOP" -stream_loop -1 -i "$MUSIC" -t "$SEC" \
    -filter_complex "[0:a]volume=${AMB_VOL}[a0];[1:a]aresample=48000[m];[m][a0]amix=inputs=2:normalize=0,alimiter=limit=0.95,afade=t=in:d=3,afade=t=out:st=${FO}:d=5[a]" \
    -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 256k -ar 48000 -movflags +faststart "$OUT"
fi
echo "Ready: $OUT"
