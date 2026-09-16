import { bakeFrame, blitFrame, blitFlash, type Frame, type Palette } from './frameKit';
import { GUTS_FRAMES, GUTS_PALETTE } from './framesGuts';
import {
  SWORD_FRAMES, LANCE_FRAMES, AXE_FRAMES, BOW_FRAMES, BAZUSO_FRAMES,
  PAL_MERC, PAL_SOLDIER_P, PAL_SOLDIER_E, PAL_RAIDER_P, PAL_RAIDER_E,
  PAL_ARCHER_P, PAL_ARCHER_E, PAL_BAZUSO,
} from './framesClass';
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

export function paintBattleSprite(
  ctx: CanvasRenderingContext2D, lookId: string, kind: WKind, frame: FrameName,
  tint: 'player' | 'enemy', x: number, y: number, faceRight: boolean, alpha = 1,
) {
  const { f, pal, key } = resolve(lookId, kind, frame, tint);
  blitFrame(ctx, bakeFrame(key, f, pal), x, y, faceRight, alpha);
}

export function paintBattleFlash(
  ctx: CanvasRenderingContext2D, lookId: string, kind: WKind, frame: FrameName,
  tint: 'player' | 'enemy', x: number, y: number, faceRight: boolean, strength: number,
) {
  const { f, pal, key } = resolve(lookId, kind, frame, tint);
  blitFlash(ctx, bakeFrame(key, f, pal), x, y, faceRight, strength);
}
