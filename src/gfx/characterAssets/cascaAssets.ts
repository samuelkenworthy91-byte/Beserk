// ─────────────────── Casca external assets ───────────────────
//
// Casca's three sheets — the female captain of the Band of the
// Hawk. Dark weathered skin, cropped black-brown hair, bronze
// armor, deep crimson half-cape.

import {
  registerAsset,
  loadImage,
  type BattleAsset, type MapAsset, type PortraitAsset,
} from '../assetLoader';

const CASCA_BATTLE_URL   = '/sprites/battle/casca.png';
const CASCA_MAP_URL      = '/sprites/map/casca.png';
const CASCA_PORTRAIT_URL = '/portraits/casca.png';

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

const cascaBattle: BattleAsset = {
  domain: 'battle',
  key: 'casca',
  url: CASCA_BATTLE_URL,
  sheet: { kind: 'grid', cellW: BATTLE_CELL_W, cellH: BATTLE_CELL_H, cols: BATTLE_COLS, rows: BATTLE_ROWS },
  rightRow: 0,
  leftRow: 0,
};

const cascaMap: MapAsset = {
  domain: 'map',
  key: 'casca',
  url: CASCA_MAP_URL,
  sheet: { kind: 'grid', cellW: MAP_CELL_W, cellH: MAP_CELL_H, cols: MAP_COLS, rows: MAP_ROWS },
  frames: [
    'idle-front', 'idle-right', 'idle-back', 'idle-left',
    'walkA-front', 'walkA-right', 'walkA-back', 'walkA-left',
  ],
};

// 5 cols × 2 rows of expressions.
// Row 0: neutral, grim, angry, shouting, wounded
// Row 1: wounded(alt), eyes-closed, side-glance, shocked, determined
const cascaPortrait: PortraitAsset = {
  domain: 'portrait',
  key: 'casca',
  url: CASCA_PORTRAIT_URL,
  sheet: { kind: 'grid', cellW: PORTRAIT_CELL_W, cellH: PORTRAIT_CELL_H, cols: PORTRAIT_COLS, rows: PORTRAIT_ROWS },
  expressions: [
    'neutral',     // (0,0)
    'grim',        // (1,0)
    'angry',       // (2,0)
    'shouting',    // (3,0)
    'wounded',     // (4,0)
    'wounded',     // (0,1)
    'eyes-closed', // (1,1)
    'side-glance', // (2,1)
    'shocked',     // (3,1)
    'determined',  // (4,1)
  ],
};

let registered = false;

/** Test-only: reset the registration flag. */
export function _resetCascaRegistration() {
  registered = false;
}

/** Register all three Casca sheets with the asset registry. Idempotent. */
export function registerCascaAssets(): void {
  if (registered) return;
  registered = true;
  registerAsset(cascaBattle);
  registerAsset(cascaMap);
  registerAsset(cascaPortrait);
}

/**
 * Preload all three Casca sheets in parallel.
 */
export async function preloadCascaAssets(): Promise<void> {
  registerCascaAssets();
  await Promise.all([
    loadImage(CASCA_BATTLE_URL),
    loadImage(CASCA_MAP_URL),
    loadImage(CASCA_PORTRAIT_URL),
  ]);
}
