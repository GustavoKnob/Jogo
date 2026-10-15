#!/usr/bin/env bash
# Pipeline completo: trilha -> frames (4 processos) -> MP4 final para Reels.
# Uso: build.sh <dir_trabalho> <saida.mp4>   (requer node_modules com @napi-rs/canvas em NODE_PATH)
set -euo pipefail
SRC="$(cd "$(dirname "$0")" && pwd)"; WORK="$1"; OUT="$2"
mkdir -p "$WORK"; cd "$WORK"
python3 "$SRC/synth.py" .
N=4; STEP=225
for i in $(seq 0 $((N-1))); do
  node "$SRC/render.js" --bands bands.json --raw --from $((i*STEP)) --to $(((i+1)*STEP)) 2>/dev/null \
  | ffmpeg -y -v error -f rawvideo -pix_fmt rgba -s 1080x1920 -r 60 -i - -c:v libx264rgb -preset ultrafast -qp 0 part$i.mkv &
done
wait
printf "file 'part%d.mkv'\n" 0 1 2 3 > parts.txt
ffmpeg -y -v error -f concat -safe 0 -i parts.txt -i music.wav \
  -map 0:v -map 1:a \
  -vf "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p" \
  -c:v libx264 -preset slow -crf 15 -profile:v high -level 4.2 -r 60 -g 60 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -c:a aac -b:a 256k -ar 48000 -ac 2 \
  -movflags +faststart -t 15 "$OUT"
echo "ok -> $OUT"
