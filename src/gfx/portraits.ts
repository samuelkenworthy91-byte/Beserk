import {
  PORTRAIT_ART, PALETTES, EXPRESSIONS, HAS_EXPRESSIONS,
  type Expression, type Palette, type Rows,
} from './portraitArt';
import {
  getPortraitAsset, peekImage, portraitColFor,
} from './assetLoader';

// ─── Dialogue portrait renderer ──────────────────────────────────────────────
// Hand-authored 96×96 pixel art (portraitArt.ts) is rasterised, patched with an
// expression variant, given a 1px keyline and a top-left rim light, then cached.
// Nearest-neighbour scaling is applied by the DOM (image-rendering: pixelated).
//
// Public API is unchanged: getPortrait(key, flip) / paintPortrait(el, key, size,
// flip) still work exactly as before — both now take an optional expression.

export type { Expression };
/** Source resolution of every portrait canvas. */
export const PORTRAIT_SIZE = 96;

const SIZE = 96;

export interface PortraitMeta { key: string; expressions: Expression[] }

/** Which portraits exist, and which variants each supports. */
export function listPortraits(): PortraitMeta[] {
  return Object.keys(PORTRAIT_ART).map(key => ({
    key,
    expressions: HAS_EXPRESSIONS.has(key)
      ? (['neutral', 'angry', 'injured', 'shocked'] as Expression[])
      : (['neutral'] as Expression[]),
  }));
}

export function hasPortrait(key: string | undefined): boolean {
  return !!key && !!PORTRAIT_ART[key];
}

export function supportsExpression(key: string | undefined, expr: Expression): boolean {
  if (!key || !PORTRAIT_ART[key]) return false;
  return expr === 'neutral' || HAS_EXPRESSIONS.has(key);
}

// ─── rasterisation ───────────────────────────────────────────────────────────

/**
 * Overlay an expression patch onto a copy of the base glyph grid.
 * In a patch, '.' and ' ' both mean "leave the base pixel as it is" — patches
 * only ever draw over features, they never punch holes in the face.
 */
function applyPatches(base: Rows, expr: Expression): Rows {
  const patches = EXPRESSIONS[expr] ?? [];
  if (!patches.length) return base;
  const grid = base.map(r => r.split(''));
  for (const p of patches) {
    for (let y = 0; y < p.m.length; y++) {
      const ty = p.y + y;
      if (ty < 0 || ty >= SIZE) continue;
      const row = p.m[y];
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === ' ' || ch === '.') continue;
        const tx = p.x + x;
        if (tx < 0 || tx >= SIZE) continue;
        grid[ty][tx] = ch;
      }
    }
  }
  return grid.map(r => r.join(''));
}

/**
 * In the BASE artwork a space is shorthand for "skin, mid tone" — it keeps the
 * hand-drawn eye rows legible while authoring. Only '.' is transparent.
 */
function normaliseBase(rows: Rows): Rows {
  return rows.map(r => r.replace(/ /g, '2'));
}

function build(key: string, expr: Expression): HTMLCanvasElement {
  const art = PORTRAIT_ART[key];
  const pal: Palette = PALETTES[key] ?? PALETTES.soldier;
  const rows = applyPatches(normaliseBase(art), HAS_EXPRESSIONS.has(key) ? expr : 'neutral');

  const cv = document.createElement('canvas');
  cv.width = SIZE; cv.height = SIZE;
  const g = cv.getContext('2d', { willReadFrequently: true })!;
  const img = g.createImageData(SIZE, SIZE);
  const d = img.data;

  const put = (x: number, y: number, hex: string) => {
    if (x < 0 || x >= SIZE) return;
    const n = parseInt(hex.slice(1, 7), 16);
    const i = (y * SIZE + x) * 4;
    d[i] = (n >> 16) & 255; d[i + 1] = (n >> 8) & 255; d[i + 2] = n & 255; d[i + 3] = 255;
  };

  // Centre the drawn figure horizontally. Authored rows are trimmed to the
  // last meaningful glyph rather than padded to a full 96, so without this the
  // bust would sit hard against the left edge with dead space beside it.
  let minX = SIZE, maxX = 0;
  for (let y = 0; y < SIZE; y++) {
    const row = rows[y] ?? '';
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ' || !pal[ch]) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
    }
  }
  const shift = minX <= maxX
    ? Math.round((SIZE - (maxX - minX + 1)) / 2) - minX
    : 0;

  for (let y = 0; y < SIZE; y++) {
    const row = rows[y] ?? '';
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      const hex = pal[ch];
      if (!hex) continue;
      put(x + shift, y, hex);
    }
  }
  g.putImageData(img, 0, 0);

  postProcess(cv);
  return cv;
}

/** 1px keyline around the silhouette + a subtle top-left rim light. */
function postProcess(cv: HTMLCanvasElement) {
  const g = cv.getContext('2d', { willReadFrequently: true })!;
  const img = g.getImageData(0, 0, SIZE, SIZE);
  const d = img.data;
  const n = SIZE * SIZE;
  const solid = new Uint8Array(n);
  for (let i = 0; i < n; i++) solid[i] = d[i * 4 + 3] > 128 ? 1 : 0;

  // rim light: brighten opaque pixels whose up/left neighbour is empty
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = y * SIZE + x;
      if (!solid[i]) continue;
      const up = y > 0 && solid[i - SIZE];
      const left = x > 0 && solid[i - 1];
      if (up && left) continue;
      const o = i * 4;
      d[o] = Math.min(255, Math.round(d[o] * 1.16 + 10));
      d[o + 1] = Math.min(255, Math.round(d[o + 1] * 1.16 + 10));
      d[o + 2] = Math.min(255, Math.round(d[o + 2] * 1.16 + 12));
    }
  }

  // keyline around the whole silhouette
  const OUT = [10, 8, 16];
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = y * SIZE + x;
      if (solid[i]) continue;
      const near =
        (x > 0 && solid[i - 1]) || (x < SIZE - 1 && solid[i + 1]) ||
        (y > 0 && solid[i - SIZE]) || (y < SIZE - 1 && solid[i + SIZE]);
      if (!near) continue;
      const o = i * 4;
      d[o] = OUT[0]; d[o + 1] = OUT[1]; d[o + 2] = OUT[2]; d[o + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
}

// ─── cache + public API ──────────────────────────────────────────────────────

const cache = new Map<string, HTMLCanvasElement>();

function baseCanvas(key: string, expr: Expression): HTMLCanvasElement | null {
  if (!PORTRAIT_ART[key]) return null;
  const ck = `${key}|${expr}`;
  let cv = cache.get(ck);
  if (!cv) {
    try {
      cv = build(key, expr);
    } catch (err) {
      console.warn('portrait build failed', key, expr, err);
      return null;
    }
    cache.set(ck, cv);
  }
  return cv;
}

/**
 * Dimmed variant for the inactive speaker.
 *
 * A CSS `brightness()` filter multiplies every channel toward black, which
 * collapses a pixel ramp into mud and loses the face entirely. Instead this
 * darkens while COMPRESSING toward a cool blue-grey and lifting the floor, so
 * internal contrast — and therefore the features — survive.
 */
function dimCanvas(src: HTMLCanvasElement): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = SIZE; cv.height = SIZE;
  const g = cv.getContext('2d', { willReadFrequently: true })!;
  g.drawImage(src, 0, 0);
  const img = g.getImageData(0, 0, SIZE, SIZE);
  const d = img.data;
  // target hue the shadows lean toward
  const TR = 26, TG = 32, TB = 48;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 128) continue;
    // 0.62 keeps most of the tonal range; the blend adds atmosphere instead of soot
    d[i] = Math.round(d[i] * 0.62 + TR * 0.38);
    d[i + 1] = Math.round(d[i + 1] * 0.62 + TG * 0.38);
    d[i + 2] = Math.round(d[i + 2] * 0.62 + TB * 0.38);
  }
  g.putImageData(img, 0, 0);
  return cv;
}

export function getPortrait(
  key: string | undefined, flip = false, expr: Expression = 'neutral', dim = false,
): HTMLCanvasElement | null {
  if (!key) return null;

  // ─── fast path: externally-authored sprite sheet ───
  const asset = getPortraitAsset(key);
  if (asset) {
    const img = peekImage(asset.url);
    if (img) {
      const col = portraitColFor(asset, expr);
      const cellW = asset.sheet.kind === 'strip' ? asset.sheet.cellW : asset.sheet.cellW;
      const cellH = asset.sheet.kind === 'strip' ? asset.sheet.cellH : asset.sheet.cellH;
      const sx = col * cellW;
      const cv = document.createElement('canvas');
      cv.width = cellW; cv.height = cellH;
      const g = cv.getContext('2d')!;
      g.imageSmoothingEnabled = false;
      if (dim) {
        const tint = document.createElement('canvas');
        tint.width = cellW; tint.height = cellH;
        const tg = tint.getContext('2d')!;
        tg.imageSmoothingEnabled = false;
        if (flip) {
          tg.translate(cellW, 0); tg.scale(-1, 1);
        }
        tg.drawImage(img, sx, 0, cellW, cellH, 0, 0, cellW, cellH);
        const id = tg.getImageData(0, 0, cellW, cellH);
        const d = id.data;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] < 128) continue;
          d[i]     = Math.round(d[i]     * 0.62 + 26 * 0.38);
          d[i + 1] = Math.round(d[i + 1] * 0.62 + 32 * 0.38);
          d[i + 2] = Math.round(d[i + 2] * 0.62 + 48 * 0.38);
        }
        tg.putImageData(id, 0, 0);
        g.drawImage(tint, 0, 0);
      } else if (flip) {
        g.translate(cellW, 0); g.scale(-1, 1);
        g.drawImage(img, sx, 0, cellW, cellH, 0, 0, cellW, cellH);
      } else {
        g.drawImage(img, sx, 0, cellW, cellH, 0, 0, cellW, cellH);
      }
      return cv;
    }
  }

  const base = baseCanvas(key, expr);
  if (!base) return null;
  if (!flip && !dim) return base;

  const ck = `${key}|${expr}|${flip ? 'f' : ''}${dim ? 'd' : ''}`;
  let cv = cache.get(ck);
  if (!cv) {
    const src = dim ? dimCanvas(base) : base;
    if (!flip) { cache.set(ck, src); return src; }
    cv = document.createElement('canvas');
    cv.width = SIZE; cv.height = SIZE;
    const g = cv.getContext('2d')!;
    g.imageSmoothingEnabled = false;
    g.translate(SIZE, 0);
    g.scale(-1, 1);
    g.drawImage(src, 0, 0);
    cache.set(ck, cv);
  }
  return cv;
}

/**
 * Render a portrait into a <canvas> at any display size.
 * Signature is backwards-compatible; `expr` is optional.
 */
export function paintPortrait(
  el: HTMLCanvasElement,
  key: string | undefined,
  size: number,
  flip = false,
  expr: Expression = 'neutral',
  dim = false,
) {
  el.width = SIZE; el.height = SIZE;
  el.style.width = size + 'px';
  el.style.height = size + 'px';
  const g = el.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  g.clearRect(0, 0, SIZE, SIZE);
  const p = getPortrait(key, flip, expr, dim);
  if (p) g.drawImage(p, 0, 0);
}
