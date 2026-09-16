// ─────────────────── external sprite-sheet loader ───────────────────
//
// Loader + registry for externally-authored PNG sprite sheets. Each
// sheet registers a key (e.g. 'guts-battle'), a URL to a PNG, and a
// slice definition that says how to extract frames.
//
// The renderer pipeline is unchanged: paintBattleSprite / drawMapUnit
// / paintPortrait all consult the registry first and fall back to the
// code-authored frames if no external asset is registered for the
// requested key.

import type { FrameName } from './battlePoses';
import type { Expression } from './portraits';

// ─── slice definitions ──────────────────────────────────────────────────────

/**
 * A horizontal strip of N equally-sized cells. The simplest sheet
 * layout: N cells in a row, one row.
 */
export interface StripSheet {
  kind: 'strip';
  cellW: number;
  cellH: number;
  /** number of cells in the row */
  count: number;
}

/** A grid sheet with explicit row/col layout. */
export interface GridSheet {
  kind: 'grid';
  cellW: number;
  cellH: number;
  cols: number;
  rows: number;
}

export type SheetDef = StripSheet | GridSheet;

// ─── registry types ─────────────────────────────────────────────────────────

export type AssetDomain = 'battle' | 'map' | 'portrait';

export interface BattleAsset {
  domain: 'battle';
  key: string;
  url: string;
  /** For battle, layout is:
   *   row 0 = facing right (frames in FrameName order)
   *   row 1 = facing left (renderer mirrors at draw time) */
  sheet: GridSheet;
  rightRow?: number;
  leftRow?: number;
}

export interface MapAsset {
  domain: 'map';
  key: string;
  url: string;
  sheet: StripSheet | GridSheet;
  /**
   * Order of frames in the strip (left → right). 12 entries for a
   * full directions × walk-A/walk-B sheet:
   *   [idle-F, idle-R, idle-B, idle-L, walkA-F, walkA-R, walkA-B,
   *    walkA-L, walkB-F, walkB-R, walkB-B, walkB-L]
   */
  frames?: MapFrameName[];
}

export interface PortraitAsset {
  domain: 'portrait';
  key: string;
  url: string;
  sheet: StripSheet | GridSheet;
  /** expressions each cell maps to, in left→right order */
  expressions: Expression[];
}

export type AssetDef = BattleAsset | MapAsset | PortraitAsset;

/** The map renderer's logical frame names. */
export type MapFrameName =
  | 'idle-front' | 'idle-right' | 'idle-back' | 'idle-left'
  | 'walkA-front' | 'walkA-right' | 'walkA-back' | 'walkA-left'
  | 'walkB-front' | 'walkB-right' | 'walkB-back' | 'walkB-left'
  | 'attack-front' | 'attack-right' | 'attack-back' | 'attack-left'
  | 'hurt-front' | 'hurt-right' | 'hurt-back' | 'hurt-left'
  | 'defeat-front' | 'defeat-right' | 'defeat-back' | 'defeat-left';

// ─── registry + load ────────────────────────────────────────────────────────

const battle = new Map<string, BattleAsset>();
const map = new Map<string, MapAsset>();
const portrait = new Map<string, PortraitAsset>();

const images = new Map<string, HTMLImageElement>();
const inflight = new Map<string, Promise<HTMLImageElement>>();

export function registerAsset(def: AssetDef): void {
  switch (def.domain) {
    case 'battle':  battle.set(def.key, def);  break;
    case 'map':     map.set(def.key, def);     break;
    case 'portrait': portrait.set(def.key, def); break;
  }
}

export function getBattleAsset(key: string): BattleAsset | null {
  return battle.get(key) ?? null;
}
export function getMapAsset(key: string): MapAsset | null {
  return map.get(key) ?? null;
}
export function getPortraitAsset(key: string): PortraitAsset | null {
  return portrait.get(key) ?? null;
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  const cached = images.get(url);
  if (cached && cached.complete && cached.naturalWidth > 0) {
    return Promise.resolve(cached);
  }
  const pending = inflight.get(url);
  if (pending) return pending;
  const p = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => { images.set(url, img); inflight.delete(url); resolve(img); };
    img.onerror = () => { inflight.delete(url); reject(new Error(`asset load failed: ${url}`)); };
    img.src = url;
  });
  inflight.set(url, p);
  return p;
}

export function peekImage(url: string): HTMLImageElement | null {
  const img = images.get(url);
  return img && img.complete && img.naturalWidth > 0 ? img : null;
}

// ─── frame extraction ───────────────────────────────────────────────────────

function cellRect(sheet: SheetDef, col: number, row: number): { x: number; y: number; w: number; h: number } {
  if (sheet.kind === 'strip') {
    return { x: col * sheet.cellW, y: 0, w: sheet.cellW, h: sheet.cellH };
  }
  return { x: col * sheet.cellW, y: row * sheet.cellH, w: sheet.cellW, h: sheet.cellH };
}

/** Extract a frame's rectangle from a sheet (for use in drawImage). */
export function frameRect(
  sheet: SheetDef, col: number, row: number,
): { x: number; y: number; w: number; h: number } {
  return cellRect(sheet, col, row);
}

/** Battle sheet: returns frame column for a given FrameName. */
export const BATTLE_FRAME_ORDER: FrameName[] = [
  'idle0', 'idle1', 'ready', 'wind', 'swing', 'impact', 'recover', 'hurt', 'dead',
];

export function battleColFor(frame: FrameName): number {
  return BATTLE_FRAME_ORDER.indexOf(frame);
}

export function mapColFor(frames: MapFrameName[] | undefined, name: MapFrameName): number {
  if (!frames) return 0;
  const i = frames.indexOf(name);
  return i < 0 ? 0 : i;
}

export function portraitColFor(asset: PortraitAsset, expr: Expression): number {
  const i = asset.expressions.indexOf(expr);
  return i < 0 ? 0 : i;
}

/** Test-only: wipe the registry. */
export function _resetRegistry() {
  battle.clear();
  map.clear();
  portrait.clear();
  images.clear();
  inflight.clear();
}
