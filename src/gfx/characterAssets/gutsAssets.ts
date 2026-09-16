// ─────────────────── Guts external assets ───────────────────
//
// Registers the three Guts sprite sheets (battle / map / portrait) in
// the asset loader registry. The PNGs live under public/ and are
// served by Vite as static files; the Capacitor APK build copies
// dist/ into the Android assets, so external PNG references work
// fully offline.
//
// Sheet cell sizes match the model's default 1408×768 artboard
// divided into the declared row/col count.

import {
  registerAsset,
  loadImage,
  type BattleAsset, type MapAsset, type PortraitAsset,
} from '../assetLoader';

const GUTS_BATTLE_URL   = '/sprites/battle/guts.webp';
const GUTS_MAP_URL      = '/sprites/map/guts.webp';
const GUTS_PORTRAIT_URL = '/portraits/guts.webp';

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
// 9 columns in FrameName order: idle0, idle1, ready, wind, swing,
// impact, recover, hurt, dead. Row 0 = facing right; row 1 = facing
// left (the renderer mirrors row 0 at draw time when faceRight is
// false; we don't register a separate mirror row).
const gutsBattle: BattleAsset = {
  domain: 'battle',
  key: 'guts',
  url: GUTS_BATTLE_URL,
  sheet: { kind: 'grid', cellW: BATTLE_CELL_W, cellH: BATTLE_CELL_H, cols: BATTLE_COLS, rows: BATTLE_ROWS },
  rightRow: 0,
  leftRow: 0, // same row — renderer mirrors
};

// ─── map sheet ───
// 4 columns × 2 rows. Row 0 = idle (F, R, B, L); row 1 = walkA.
const gutsMap: MapAsset = {
  domain: 'map',
  key: 'guts',
  url: GUTS_MAP_URL,
  sheet: { kind: 'grid', cellW: MAP_CELL_W, cellH: MAP_CELL_H, cols: MAP_COLS, rows: MAP_ROWS },
  frames: [
    'idle-front', 'idle-right', 'idle-back', 'idle-left',
    'walkA-front', 'walkA-right', 'walkA-back', 'walkA-left',
  ],
};

// ─── portrait sheet ───
// 5 columns × 2 rows of expressions. We register all 10 in the
// `expressions` array; the engine's existing 4 ('neutral', 'angry',
// 'injured', 'shocked') map to the corresponding cells, and the
// extended 6 are available for richer dialogue.
// Row 0: neutral, grim, angry, shouting, wounded
// Row 1: wounded(alt), eyes-closed, side-glance, shocked, determined
const gutsPortrait: PortraitAsset = {
  domain: 'portrait',
  key: 'guts',
  url: GUTS_PORTRAIT_URL,
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

/** Test-only: reset the registration flag so the next call re-registers. */
export function _resetGutsRegistration() {
  registered = false;
}

/** Register all three Guts sheets with the asset registry. Idempotent. */
export function registerGutsAssets(): void {
  if (registered) return;
  registered = true;
  registerAsset(gutsBattle);
  registerAsset(gutsMap);
  registerAsset(gutsPortrait);
}

/**
 * Kick off preload of all three sheets in parallel. Resolves once
 * the images have decoded. Safe to await multiple times — the same
 * underlying Image is reused.
 */
export async function preloadGutsAssets(): Promise<void> {
  registerGutsAssets();
  await Promise.all([
    loadImage(GUTS_BATTLE_URL),
    loadImage(GUTS_MAP_URL),
    loadImage(GUTS_PORTRAIT_URL),
  ]);
}
