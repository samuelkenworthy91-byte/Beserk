#!/usr/bin/env bash
# ──────────────── convert PNG sprite sheets to WebP ────────────────
#
# Pixel-art sprite sheets pack ~1.5–2 MB at PNG because they have
# hard pixel edges and gradients that defeat PNG's deflate. WebP at
# q=85 lossy + alpha channel typically lands at 100–250 KB while
# preserving identical visual quality for our use case.
#
# This script walks public/sprites/{battle,map}/ and public/portraits/
# and writes a .webp next to each .png. It is idempotent: re-running
# it just overwrites the existing webp. Deletion of the .png is left
# to the caller — this script is a no-op on already-converted files.
#
# Requires ImageMagick `convert` (libwebp encoder). On Debian/Ubuntu:
#   apt install imagemagick
#
# Usage: scripts/convert-to-webp.sh [quality]
#   default quality 85 — visually identical for pixel art.

set -e
ROOT="${1:-$(dirname "$0")/..}"
QUALITY="${2:-85}"

cd "$ROOT"

count=0
saved=0
for png in $(find public/sprites public/portraits -name '*.png' 2>/dev/null); do
  out="${png%.png}.webp"
  if [[ ! -f "$out" || "$png" -nt "$out" ]]; then
    before=$(stat -c%s "$png")
    convert "$png" -quality "$QUALITY" -define webp:lossless=false "$out"
    after=$(stat -c%s "$out")
    bytes=$((before - after))
    pct=$(awk -v a=$after -v b=$before 'BEGIN { printf "%.0f", (a*100)/b }')
    echo "  $(basename $png): ${before} → ${after} (-${bytes}, ${pct}%)"
    count=$((count + 1))
    saved=$((saved + bytes))
  fi
done

echo ""
echo "Converted $count file(s); saved ~$((saved / 1024)) KB."
