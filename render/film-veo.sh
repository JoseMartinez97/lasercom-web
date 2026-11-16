#!/usr/bin/env bash
# Hero film for the home page, from one Veo shot: the workshop's kind of CO2
# laser (two heads on a gantry) cutting plywood, pushing in from the whole
# machine to the right head. Generated with Gemini (Veo) from a frame of the
# earlier film (Pixabay 305027, see film.sh) and upscaled x2 with Real-ESRGAN
# (realesr-animevideov3). Checked by eye against that frame: same machine,
# same cut parts, no added sparks.
# Source (not committed): render/src/V1-veo-2560.mp4, 2560x1440, 24 fps, 10 s
# Output: public/video/hero-film.mp4 (1920x1080), hero-film-xl.mp4 (2560x1440),
#         hero-film-m.mp4 (1080x1920, centre crop), and the first frames as
#         posters in src/assets/film. Same grade as film.sh so it sits in the
#         site's dark look. Encoded for scroll scrubbing: a keyframe every 10
#         frames (4 on phones), no B-frames, faststart.
set -euo pipefail
cd "$(dirname "$0")/.."
IN=render/src/V1-veo-2560.mp4
[ -f "$IN" ] || { echo "missing $IN"; exit 1; }
OUTDIR=${OUTDIR:-public/video}
mkdir -p "$OUTDIR" src/assets/film
GRADE="eq=contrast=1.16:brightness=-0.07:saturation=0.82:gamma=0.92,curves=all='0/0 0.5/0.42 1/0.9'"
LOOK="colorbalance=rs=0.04:gs=0.0:bs=-0.04:rm=0.03:bm=-0.03,vignette=PI/5"
# frame filter, crf, gop, output name
enc() {
  ffmpeg -loglevel error -y -i "$IN" \
    -vf "$1,$GRADE,$LOOK,cas=0.3,fps=24,format=yuv420p" -an -r 24 \
    -c:v libx264 -preset slow -crf "$2" -profile:v high -pix_fmt yuv420p \
    -g "$3" -keyint_min "$3" -sc_threshold 0 -bf 0 -movflags +faststart \
    "$OUTDIR/$4"
}
enc "scale=1920:1080:flags=lanczos" "${DCRF:-19}" 10 hero-film.mp4
enc "scale=2560:1440:flags=lanczos" "${LCRF:-19}" 10 hero-film-xl.mp4
enc "crop=ih*9/16:ih:(iw-ih*9/16)/2:0,scale=1080:1920:flags=lanczos" "${PCRF:-21}" 4 hero-film-m.mp4
[ "$OUTDIR" = public/video ] || exit 0
ffmpeg -loglevel error -y -i public/video/hero-film.mp4 -frames:v 1 -q:v 3 src/assets/film/hero-film.jpg
ffmpeg -loglevel error -y -i public/video/hero-film-m.mp4 -frames:v 1 -q:v 3 src/assets/film/hero-film-m.jpg
for f in public/video/hero-film.mp4 public/video/hero-film-xl.mp4 public/video/hero-film-m.mp4; do
  printf '%s  %s\n' "$(du -h "$f" | cut -f1)" "$f"
done
