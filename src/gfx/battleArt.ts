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

export function paintBattleSprite(
  ctx: CanvasRenderingContext2D, lookId: string, kind: WKind, frame: FrameName,
  tint: 'player' | 'enemy', x: number, y: number, faceRight: boolean, alpha = 1,
) {
  // ─── fast path: external PNG sprite sheet ───
  const asset = getBattleAsset(lookId);
  if (asset) {
    const img = peekImage(asset.url);
    if (img) {
      const col = battleColFor(frame);
      const cellW = asset.sheet.cellW;
      const cellH = asset.sheet.cellH;
      const rightRow = asset.rightRow ?? 0;
      const leftRow = asset.leftRow ?? 1;
      const row = faceRight ? rightRow : leftRow;
      const sx = col * cellW;
      const sy = row * cellH;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.imageSmoothingEnabled = false;
      const dx = Math.round(x - cellW / 2);
      const dy = Math.round(y - cellH);
      if (faceRight) {
        ctx.drawImage(img, sx, sy, cellW, cellH, dx, dy, cellW, cellH);
      } else {
        const cacheKey = `flip|${lookId}|${frame}`;
        let flipCv = battleFlipCache.get(cacheKey);
        if (!flipCv) {
          flipCv = document.createElement('canvas');
          flipCv.width = cellW; flipCv.height = cellH;
          const fg = flipCv.getContext('2d')!;
          fg.imageSmoothingEnabled = false;
          fg.translate(cellW, 0); fg.scale(-1, 1);
          fg.drawImage(img, sx, sy, cellW, cellH, 0, 0, cellW, cellH);
          battleFlipCache.set(cacheKey, flipCv);
        }
        ctx.drawImage(flipCv, dx, dy);
      }
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
    const img = peekImage(asset.url);
    if (img) {
      const col = battleColFor(frame);
      const cellW = asset.sheet.cellW;
      const cellH = asset.sheet.cellH;
      const row = faceRight ? (asset.rightRow ?? 0) : (asset.leftRow ?? 1);
      const sx = col * cellW;
      const sy = row * cellH;
      ctx.save();
      ctx.globalAlpha = strength;
      ctx.imageSmoothingEnabled = false;
      const dx = Math.round(x - cellW / 2);
      const dy = Math.round(y - cellH);
      if (faceRight) {
        ctx.drawImage(img, sx, sy, cellW, cellH, dx, dy, cellW, cellH);
      } else {
        const cacheKey = `flip|${lookId}|${frame}`;
        let flipCv = battleFlipCache.get(cacheKey);
        if (!flipCv) {
          flipCv = document.createElement('canvas');
          flipCv.width = cellW; flipCv.height = cellH;
          const fg = flipCv.getContext('2d')!;
          fg.imageSmoothingEnabled = false;
          fg.translate(cellW, 0); fg.scale(-1, 1);
          fg.drawImage(img, sx, sy, cellW, cellH, 0, 0, cellW, cellH);
          battleFlipCache.set(cacheKey, flipCv);
        }
        ctx.drawImage(flipCv, dx, dy);
      }
      ctx.restore();
      return;
    }
  }
  const { f, pal, key } = resolve(lookId, kind, frame, tint);
  blitFlash(ctx, bakeFrame(key, f, pal), x, y, faceRight, strength);
}
