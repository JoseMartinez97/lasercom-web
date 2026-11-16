#!/usr/bin/env bash
# Hero film for the home page: one CO2 laser at work, from the wide shot to the
# head cutting, one grade, crossfades. Only machines like the workshop's (CO2
# and fibre lasers): no diode engravers.
# Source (free licence, not committed, see render/src/):
#   A  Pixabay 305027  CO2 laser with two heads engraving and cutting plywood (4K)
#      https://pixabay.com/videos/laser-engraving-laser-wood-cutting-305027/
# Output: public/video/hero-film.mp4 (1920x1080), hero-film-xl.mp4 (2560x1440,
#         for retina laptops and large monitors), hero-film-m.mp4 (720x1280)
#         src/assets/film/hero-film.jpg, hero-film-m.jpg (first frames, posters)
# Encoded for scroll scrubbing: a keyframe every 10 frames, no B-frames, faststart.
set -euo pipefail
cd "$(dirname "$0")/.."

A=render/src/A-305027-4k.mp4
[ -f "$A" ] || { echo "missing $A"; exit 1; }

XF=0.7 # crossfade, seconds

# The source is bright phone footage: pull it down into the site's dark look.
GRADE="eq=contrast=1.16:brightness=-0.07:saturation=0.82:gamma=0.92,curves=all='0/0 0.5/0.42 1/0.9'"
LOOK="colorbalance=rs=0.04:gs=0.0:bs=-0.04:rm=0.03:bm=-0.03,vignette=PI/5"
# Phone-camera grain costs bits and reads as mush once compressed: smooth it, then restore edges.
SHARP="hqdn3d=${DENOISE:-1.5:1.5:4:4},cas=0.5"

# Shots: start and length in source seconds
#   wide shot of the machine, both heads at work, moving in, close on the head
SHOTS=("0.0 4.6" "10.0 5.0" "20.5 5.0" "37.0 12.6")

build() {
  local W=$1 H=$2 OUT=$3 CRF=$4 G=${5:-${GOP:-10}} FRAME
  if [ "$W" -gt "$H" ]; then
    FRAME="scale=${W}:${H}:flags=lanczos"
  else
    # 9:16 slice from the middle of the wide shot
    FRAME="crop=ih*9/16:ih:(iw-ih*9/16)/2:0,scale=${W}:${H}:flags=lanczos"
  fi
  local inputs=() graph="" chain="[s0]" at=0 i=0 ss len
  for shot in "${SHOTS[@]}"; do
    read -r ss len <<<"$shot"
    inputs+=(-ss "$ss" -t "$len" -i "$A")
    graph+="[$i:v]$FRAME,$GRADE,fps=24,setpts=PTS-STARTPTS,format=yuv420p[s$i];"
    if [ "$i" -gt 0 ]; then
      graph+="${chain}[s$i]xfade=transition=fade:duration=$XF:offset=$at[x$i];"
      chain="[x$i]"
    fi
    at=$(echo "$at+$len-$XF" | bc)
    i=$((i + 1))
  done
  graph+="${chain}$LOOK,$SHARP,format=yuv420p[out]"

  ffmpeg -loglevel error -y "${inputs[@]}" -filter_complex "$graph" \
    -map "[out]" -an -r 24 \
    -c:v libx264 -preset slow -tune film -crf "$CRF" -profile:v high -pix_fmt yuv420p \
    -g "$G" -keyint_min "$G" -sc_threshold 0 -bf 0 -movflags +faststart \
    "$OUT"
}

# Sizes and quality can be overridden for trials: DW DH DCRF LW LH LCRF PW PH
# PCRF PGOP OUTDIR, and ONLY=phone to render just the phone cut.
# The phone cut is 720x1280 with a keyframe every 4 frames: a phone fills its
# screen with it, and each scroll jump decodes at most 3 light frames, so
# scrubbing stays smooth on mobile chips.
DW=${DW:-1920} DH=${DH:-1080} DCRF=${DCRF:-25}
PW=${PW:-720} PH=${PH:-1280} PCRF=${PCRF:-25} PGOP=${PGOP:-4}
OUTDIR=${OUTDIR:-public/video}
mkdir -p "$OUTDIR" src/assets/film
if [ "${ONLY:-}" != phone ]; then
  build "$DW" "$DH" "$OUTDIR/hero-film.mp4" "$DCRF"
  build "${LW:-2560}" "${LH:-1440}" "$OUTDIR/hero-film-xl.mp4" "${LCRF:-25}"
fi
build "$PW" "$PH" "$OUTDIR/hero-film-m.mp4" "$PCRF" "$PGOP"
[ "$OUTDIR" = public/video ] || exit 0

ffmpeg -loglevel error -y -i public/video/hero-film.mp4 -frames:v 1 -q:v 3 src/assets/film/hero-film.jpg
ffmpeg -loglevel error -y -i public/video/hero-film-m.mp4 -frames:v 1 -q:v 3 src/assets/film/hero-film-m.jpg

for f in public/video/hero-film.mp4 public/video/hero-film-xl.mp4 public/video/hero-film-m.mp4; do
  printf '%s  %s  %ss\n' "$(du -h "$f" | cut -f1)" "$f" \
    "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")"
done
