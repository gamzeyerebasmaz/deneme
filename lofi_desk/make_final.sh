#!/usr/bin/env bash
# Music in front, soft distant rain behind, video looped to the requested length.
#   ./make_final.sh 30s            -> 30 s preview
#   ./make_final.sh 3h             -> 3 hours (music and rain repeat)
#   ./make_final.sh 3h other.mp3   -> with another track
set -euo pipefail
cd "$(dirname "$0")"
DUR="${1:-30s}"; MUSIC="${2:-src/music.mp3}"
MUSIC_GAIN="${MUSIC_GAIN:-4.7dB}"   # brings the track to about -16 LUFS
RAIN_GAIN="${RAIN_GAIN:--5dB}"      # rain about 12 dB under the music
case "$DUR" in *h) SEC=$(( ${DUR%h} * 3600 ));; *m) SEC=$(( ${DUR%m} * 60 ));; *) SEC="${DUR%s}";; esac
FO=$(python3 -c "print(max(0, $SEC - 4))")
OUT="out/lofi_desk_${DUR}.mp4"
ffmpeg -y -loglevel error -stats -stream_loop -1 -i out/lofi_desk_loop_30s.mp4 \
  -stream_loop -1 -i out/rain_loop.wav -stream_loop -1 -i "$MUSIC" -t "$SEC" \
  -filter_complex "\
[1:a]highpass=f=140,lowpass=f=5200,aecho=0.8:0.6:70|140:0.22|0.12,volume=${RAIN_GAIN}[r];\
[2:a]aresample=48000,volume=${MUSIC_GAIN}[m];\
[m][r]amix=inputs=2:normalize=0,alimiter=limit=0.93:level=false,afade=t=in:d=2,afade=t=out:st=${FO}:d=4[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 256k -ar 48000 -ac 2 -movflags +faststart "$OUT"
echo "Ready: $OUT"
