// ─── Authored-frame pipeline ─────────────────────────────────────────────────
// Every battle frame is a COMPLETE hand-drawn figure. There is no runtime
// rotation, no IK, and no generic limb parts — those are what made the old
// sprites read as an assembled puppet:
//
//   • rotating a bitmap resamples it and destroys the pixel grid
//   • one reusable arm cannot be shaded correctly for every angle it appears at
//   • pivoting joints slide instead of deforming, so nothing bends believably
//
// Here each pose is drawn as its own image, so anatomy, overlap, foreshortening
// and shading are authored decisions rather than emergent accidents.
//
// Shared glyph alphabet (light falls from the upper-left):
//   .  transparent
//   1 2 3 4 5   armour / primary cloth   darkest → brightest
//   s S t       skin: shadow, mid, lit
//   h H J       hair: dark, mid, highlight
//   l L N       leather: dark, mid, lit
//   m M W       steel: dark, mid, bright
//   g           gold trim
//   r           accent (cord, crest, bandana)
//   e p         eye white, pupil
//   b           bone / horn
//   x           blood / deep wound
//   o           explicit inner keyline (rarely needed; edges are automatic)

export type Rows = string[];

export interface Frame {
  rows: Rows;
}

/**
 * Declare a frame. There is no anchor argument on purpose: the point the
 * figure stands on is measured from the drawing itself (see `groundAnchor`),
 * so a pose can be freely redrawn — wider stance, more rows, longer weapon —
 * without anyone remembering to update a coordinate.
 */
export const F = (rows: Rows): Frame => ({ rows });

export type Palette = Record<string, string>;

// ─── rasterisation ───────────────────────────────────────────────────────────

interface Baked { cv: HTMLCanvasElement; ax: number; ay: number }

const cache = new Map<string, Baked>();

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Draw an authored frame into a canvas, then apply two finishing passes that
 * every sprite shares so the cast reads as one art set:
 *   1. contact shade — the bottom row of the silhouette darkens into the ground
 *   2. keyline      — a 1px dark outline wraps the whole figure
 * Shading itself is hand-authored in the matrix; nothing is auto-generated.
 */
/**
 * Find where the figure actually stands.
 *
 * Hand-declared anchors drift out of sync the moment a pose is redrawn (a
 * stance widens, a frame gains rows) and the character silently floats or
 * sinks. Deriving it from the art guarantees every pose plants on the same
 * ground line: `ay` is the lowest opaque row, `ax` is the horizontal centre of
 * the FEET only — sampled from the bottom band, so an outflung arm or a
 * extended blade can never drag the body off its footing.
 */
function groundAnchor(rows: Rows, pal: Palette): { ax: number; ay: number } {
  const solid = (ch: string) => ch !== '.' && ch !== ' ' && !!pal[ch];
  let ay = 0;
  for (let y = 0; y < rows.length; y++) {
    if ([...rows[y]].some(solid)) ay = y;
  }
  // sample the lowest 6 rows: that is boots, not gesture
  const from = Math.max(0, ay - 5);
  let min = Infinity, max = -Infinity;
  for (let y = from; y <= ay; y++) {
    const row = rows[y] ?? '';
    for (let x = 0; x < row.length; x++) {
      if (!solid(row[x])) continue;
      if (x < min) min = x;
      if (x > max) max = x;
    }
  }
  const ax = min <= max ? Math.round((min + max) / 2) : 0;
  return { ax, ay };
}

function bake(frame: Frame, pal: Palette, outline: string): Baked {
  const rows = frame.rows;
  const w = rows.reduce((a, r) => Math.max(a, r.length), 0);
  const h = rows.length;

  const cv = document.createElement('canvas');
  cv.width = Math.max(1, w + 2);
  cv.height = Math.max(1, h + 2);
  const g = cv.getContext('2d', { willReadFrequently: true })!;
  const img = g.createImageData(cv.width, cv.height);
  const d = img.data;

  const put = (x: number, y: number, rgb: [number, number, number]) => {
    const i = ((y + 1) * cv.width + (x + 1)) * 4;
    d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2]; d[i + 3] = 255;
  };

  const rgbCache = new Map<string, [number, number, number]>();
  const col = (ch: string): [number, number, number] | null => {
    const hex = pal[ch];
    if (!hex) return null;
    let v = rgbCache.get(ch);
    if (!v) { v = hexToRgb(hex); rgbCache.set(ch, v); }
    return v;
  };

  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      const c = col(ch);
      if (c) put(x, y, c);
    }
  }
  g.putImageData(img, 0, 0);

  // ── keyline pass ──
  const im2 = g.getImageData(0, 0, cv.width, cv.height);
  const d2 = im2.data;
  const W = cv.width, H = cv.height;
  const solid = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) solid[i] = d2[i * 4 + 3] > 128 ? 1 : 0;
  const [orr, og, ob] = hexToRgb(outline);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (solid[i]) continue;
      const near =
        (x > 0 && solid[i - 1]) || (x < W - 1 && solid[i + 1]) ||
        (y > 0 && solid[i - W]) || (y < H - 1 && solid[i + W]);
      if (!near) continue;
      const o = i * 4;
      d2[o] = orr; d2[o + 1] = og; d2[o + 2] = ob; d2[o + 3] = 255;
    }
  }
  g.putImageData(im2, 0, 0);

  // +1 on each axis for the 1px keyline margin added around the matrix
  const anchor = groundAnchor(rows, pal);
  return { cv, ax: anchor.ax + 1, ay: anchor.ay + 1 };
}

export function bakeFrame(
  key: string, frame: Frame, pal: Palette, outline = '#0c0910',
): Baked {
  let b = cache.get(key);
  if (!b) { b = bake(frame, pal, outline); cache.set(key, b); }
  return b;
}

/** Blit an authored frame with its anchor at (x, y). Never rotated. */
export function blitFrame(
  ctx: CanvasRenderingContext2D, baked: Baked,
  x: number, y: number, faceRight: boolean, alpha = 1,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = false;
  ctx.translate(Math.round(x), Math.round(y));
  if (!faceRight) ctx.scale(-1, 1);
  ctx.drawImage(baked.cv, -baked.ax, -baked.ay);
  ctx.restore();
}

/** Additive white silhouette, used for the impact flash. */
export function blitFlash(
  ctx: CanvasRenderingContext2D, baked: Baked,
  x: number, y: number, faceRight: boolean, strength: number,
) {
  ctx.save();
  ctx.globalAlpha = strength;
  ctx.globalCompositeOperation = 'lighter';
  ctx.imageSmoothingEnabled = false;
  ctx.translate(Math.round(x), Math.round(y));
  if (!faceRight) ctx.scale(-1, 1);
  ctx.drawImage(baked.cv, -baked.ax, -baked.ay);
  ctx.restore();
}
