import { bakeFrame, blitFrame, blitFlash, type Frame, type Palette } from './frameKit';
import {
  getBattleAsset, peekImage, battleColFor,
} from './assetLoader';
import { GUTS_FRAMES, GUTS_PALETTE } from './framesGuts';
import {
  SWORD_FRAMES, LANCE_FRAMES, AXE_FRAMES, BOW_FRAMES, BAZUSO_FRAMES,
  PAL_MERC, PAL_SOLDIER_P, PAL_SOLDIER_E, PAL_RAIDER_P, PAL_RAIDER_E,
  PAL_ARCHER_P, PAL_ARCHER_E, PAL_BAZUSO,
} from './framesClass';
import { GRIFFITH_FRAMES, PAL_GRIFFITH } from './framesGriffith';
import type { WKind, FrameName } from './battlePoses';

export type { WKind, FrameName };
export { frameMeta, weaponKindOf } from './battlePoses';

// ─── Battle sprite lookup ────────────────────────────────────────────────────
// Every frame is a complete authored image. This module only chooses which
// image and which palette — there is no assembly, rotation or IK left.

type FrameSet = Record<FrameName, Frame>;

interface LookDef {
  frames: (kind: WKind) => FrameSet;
  palette: (tint: 'player' | 'enemy') => Palette;
}

/** Generic troops are defined by the weapon they carry. */
function byWeapon(kind: WKind): FrameSet {
  switch (kind) {
    case 'axe': return AXE_FRAMES;
    case 'lance': return LANCE_FRAMES;
    case 'bow': return BOW_FRAMES;
    default: return SWORD_FRAMES;
  }
}

const LOOKS: Record<string, LookDef> = {
  guts: { frames: () => GUTS_FRAMES, palette: () => GUTS_PALETTE },
  griffith: { frames: () => GRIFFITH_FRAMES, palette: () => PAL_GRIFFITH },
  warlord: { frames: () => BAZUSO_FRAMES, palette: () => PAL_BAZUSO },
  merc: { frames: byWeapon, palette: () => PAL_MERC },
  soldier: { frames: byWeapon, palette: t => (t === 'player' ? PAL_SOLDIER_P : PAL_SOLDIER_E) },
  fighter: { frames: byWeapon, palette: t => (t === 'player' ? PAL_RAIDER_P : PAL_RAIDER_E) },
  archer: { frames: byWeapon, palette: t => (t === 'player' ? PAL_ARCHER_P : PAL_ARCHER_E) },
};

function resolve(lookId: string, kind: WKind, frame: FrameName, tint: 'player' | 'enemy') {
  const look = LOOKS[lookId] ?? LOOKS.merc;
  const set = look.frames(kind);
  const f = set[frame] ?? set.idle0;
  return { f, pal: look.palette(tint), key: `${lookId}|${kind}|${frame}|${tint}` };
}

const battleFlipCache = new Map<string, HTMLCanvasElement>();

/**
 * Standard battle-sprite cell size. The legacy code-authored frames
 * are 96×96 with feet at the bottom. Externally-authored PNGs may
 * have arbitrary cell sizes — we scale their slice into this 96×96
 * canvas (bottom-anchored) so the rest of the pipeline (ground-
 * baseline anchor, hit-stop, flash overlay) keeps working unchanged.
 */
const OUT_W = 96;
const OUT_H = 96;

/**
 * Slice a frame from the source PNG, mirror if !faceRight, and
 * letterbox-fit into the 96×96 staging canvas. Cached by
 * (lookId, frame, faceRight) so the slice+mirror runs once per
 * frame. The mirror canvas is then drawn at the call site.
 */
function sliceForRender(
  lookId: string, asset: import('./assetLoader').BattleAsset,
  frame: FrameName, faceRight: boolean,
): HTMLCanvasElement | null {
  const img = peekImage(asset.url);
  if (!img) return null;
  const col = battleColFor(frame);
  const srcW = asset.sheet.cellW;
  const srcH = asset.sheet.cellH;
  const rightRow = asset.rightRow ?? 0;
  const leftRow = asset.leftRow ?? rightRow; // mirror of right
  const row = faceRight ? rightRow : leftRow;
  const sx = col * srcW;
  const sy = row * srcH;

  // Cached mirror canvas (used for faceRight=false; faceRight=true
  // uses a separate cache key so we don't double-store).
  const cacheKey = `${lookId}|${frame}|${faceRight ? 'r' : 'l'}`;
  let cv = battleFlipCache.get(cacheKey);
  if (cv) return cv;

  cv = document.createElement('canvas');
  cv.width = OUT_W; cv.height = OUT_H;
  const g = cv.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  // bottom-anchor: scale source slice into the 96×96 box, keeping
  // the bottom edge aligned so the character's feet stay on the
  // baseline.
  const scale = Math.min(OUT_W / srcW, OUT_H / srcH);
  const dw = Math.round(srcW * scale);
  const dh = Math.round(srcH * scale);
  const dx = Math.round((OUT_W - dw) / 2);
  const dy = OUT_H - dh;
  if (faceRight) {
    g.drawImage(img, sx, sy, srcW, srcH, dx, dy, dw, dh);
  } else {
    // mirror via intermediate canvas (1-step flip)
    const tmp = document.createElement('canvas');
    tmp.width = dw; tmp.height = dh;
    const tg = tmp.getContext('2d')!;
    tg.imageSmoothingEnabled = false;
    tg.translate(dw, 0); tg.scale(-1, 1);
    tg.drawImage(img, sx, sy, srcW, srcH, 0, 0, dw, dh);
    g.drawImage(tmp, dx, dy);
  }
  battleFlipCache.set(cacheKey, cv);
  return cv;
}

export function paintBattleSprite(
  ctx: CanvasRenderingContext2D, lookId: string, kind: WKind, frame: FrameName,
  tint: 'player' | 'enemy', x: number, y: number, faceRight: boolean, alpha = 1,
) {
  // ─── fast path: external PNG sprite sheet ───
  const asset = getBattleAsset(lookId);
  if (asset) {
    const cv = sliceForRender(lookId, asset, frame, faceRight);
    if (cv) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(cv, Math.round(x - OUT_W / 2), Math.round(y - OUT_H));
      ctx.restore();
      return;
    }
  }
  const { f, pal, key } = resolve(lookId, kind, frame, tint);
  blitFrame(ctx, bakeFrame(key, f, pal), x, y, faceRight, alpha);
}

export function paintBattleFlash(
  ctx: CanvasRenderingContext2D, lookId: string, kind: WKind, frame: FrameName,
  tint: 'player' | 'enemy', x: number, y: number, faceRight: boolean, strength: number,
) {
  const asset = getBattleAsset(lookId);
  if (asset) {
    const cv = sliceForRender(lookId, asset, frame, faceRight);
    if (cv) {
      ctx.save();
      ctx.globalAlpha = strength;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(cv, Math.round(x - OUT_W / 2), Math.round(y - OUT_H));
      ctx.restore();
      return;
    }
  }
  const { f, pal, key } = resolve(lookId, kind, frame, tint);
  blitFlash(ctx, bakeFrame(key, f, pal), x, y, faceRight, strength);
}
