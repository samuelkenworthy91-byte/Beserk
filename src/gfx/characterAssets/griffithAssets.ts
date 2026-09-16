// ─────────────────── Griffith external assets ───────────────────
//
// Registers the three Griffith sprite sheets. Griffith is the
// silver-white Hawk of Light — pale hair, gleaming armor, white cloak.

import {
  registerAsset,
  loadImage,
  type BattleAsset, type MapAsset, type PortraitAsset,
} from '../assetLoader';

const GRIFFITH_BATTLE_URL   = '/sprites/battle/griffith.png';
const GRIFFITH_MAP_URL      = '/sprites/map/griffith.png';
const GRIFFITH_PORTRAIT_URL = '/portraits/griffith.png';

const BATTLE_COLS = 9;
const BATTLE_ROWS = 2;
const BATTLE_CELL_W = 1408 / BATTLE_COLS;
const BATTLE_CELL_H = 768 / BATTLE_ROWS;

const MAP_COLS = 4;
const MAP_ROWS = 2;
const MAP_CELL_W = 1408 / MAP_COLS;
const MAP_CELL_H = 768 / MAP_ROWS;

const PORTRAIT_COLS = 5;
const PORTRAIT_ROWS = 2;
const PORTRAIT_CELL_W = 1408 / PORTRAIT_COLS;
const PORTRAIT_CELL_H = 768 / PORTRAIT_ROWS;

// ─── battle sheet ───
// 9 columns in FrameName order; row 0 = facing right; row 1 mirrors at draw.
const griffithBattle: BattleAsset = {
  domain: 'battle',
  key: 'griffith',
  url: GRIFFITH_BATTLE_URL,
  sheet: { kind: 'grid', cellW: BATTLE_CELL_W, cellH: BATTLE_CELL_H, cols: BATTLE_COLS, rows: BATTLE_ROWS },
  rightRow: 0,
  leftRow: 0,
};

// ─── map sheet ───
// 4 cols × 2 rows. Row 0 = idle; row 1 = walkA. Order: F, R, B, L.
const griffithMap: MapAsset = {
  domain: 'map',
  key: 'griffith',
  url: GRIFFITH_MAP_URL,
  sheet: { kind: 'grid', cellW: MAP_CELL_W, cellH: MAP_CELL_H, cols: MAP_COLS, rows: MAP_ROWS },
  frames: [
    'idle-front', 'idle-right', 'idle-back', 'idle-left',
    'walkA-front', 'walkA-right', 'walkA-back', 'walkA-left',
  ],
};

// ─── portrait sheet ───
// 5 cols × 2 rows of expressions.
// Row 0: neutral, grim, angry, shouting, wounded
// Row 1: wounded(alt), eyes-closed, side-glance, shocked, determined
const griffithPortrait: PortraitAsset = {
  domain: 'portrait',
  key: 'griffith',
  url: GRIFFITH_PORTRAIT_URL,
  sheet: { kind: 'grid', cellW: PORTRAIT_CELL_W, cellH: PORTRAIT_CELL_H, cols: PORTRAIT_COLS, rows: PORTRAIT_ROWS },
  expressions: [
    'neutral',     // (0,0)
    'grim',        // (1,0)
    'angry',       // (2,0)
    'shouting',    // (3,0)
    'wounded',     // (4,0)
    'wounded',     // (0,1) — alternate wounded
    'eyes-closed', // (1,1)
    'side-glance', // (2,1)
    'shocked',     // (3,1)
    'determined',  // (4,1)
  ],
};

// ─── registration + preloading ──────────────────────────────────────────────

let registered = false;

/** Test-only: reset the registration flag. */
export function _resetGriffithRegistration() {
  registered = false;
}

/** Register all three Griffith sheets with the asset registry. Idempotent. */
export function registerGriffithAssets(): void {
  if (registered) return;
  registered = true;
  registerAsset(griffithBattle);
  registerAsset(griffithMap);
  registerAsset(griffithPortrait);
}

/**
 * Kick off preload of all three Griffith sheets in parallel. Resolves
 * once every image has decoded. Safe to await multiple times.
 */
export async function preloadGriffithAssets(): Promise<void> {
  registerGriffithAssets();
  await Promise.all([
    loadImage(GRIFFITH_BATTLE_URL),
    loadImage(GRIFFITH_MAP_URL),
    loadImage(GRIFFITH_PORTRAIT_URL),
  ]);
}
