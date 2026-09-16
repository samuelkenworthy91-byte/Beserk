// ─────────────────── Guts external assets ───────────────────
//
// Registers the three Guts sprite sheets (battle / map / portrait) in
// the asset loader registry. The PNGs are imported as URLs by Vite
// (the `?url` suffix returns the public URL after the build), then
// registered with their slice definitions.
//
// The sheet cell sizes declared here are matched to the source PNG
// dimensions: each sheet is 1408×768 (the model emits a fixed
// artboard size) and the cells are sliced at fixed grid offsets
// proportional to the row/col count.
//
// Battle sheet: 9 columns × 2 rows (rows 0/1 = facing right/left).
// Map sheet:    4 columns × 2 rows (rows 0/1 = idle/walk, cols F/R/B/L).
// Portrait:     5 columns × 2 rows (10 expressions; we register 4 that
//               map to the existing engine Expression enum, plus
//               hooks for the extended expressions).

import {
  registerAsset,
  loadImage,
  type BattleAsset, type MapAsset, type PortraitAsset,
} from './assetLoader';

// ─── PNG asset paths ────────────────────────────────────────────────────────
//
// Sprites live under `public/sprites/...` so Vite serves them as
// static files (not inlined into the single-file bundle — the PNGs
// are ~1.5 MB each and would push the bundle past 8 MB). The
// Capacitor APK build (which copies dist/ into the Android assets)
// bundles the public/ folder as well, so the APK is fully offline.
//
// Using plain string URLs instead of `?url` imports keeps the
// registry / loader framework-agnostic.
const GUTS_BATTLE_URL = '/sprites/battle/guts.png';
const GUTS_MAP_URL = '/sprites/map/guts.png';
const GUTS_PORTRAIT_URL = '/portraits/guts.png';

// Sheet dimensions: the model emits 1408×768 px artboards. Each grid
// divides this into the cell layout declared below. (Real cell sizes
// are computed from `1408 / cols` × `768 / rows`.)
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
// We declare 8 logical frames; the renderer currently only asks for
// frame 0 (idle-front) and frame 1 (walkA-front). When the renderer
// is extended to pass a direction, the colFor helper will pick the
// right cell.
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
// extended 6 ('grim', 'shouting', 'eyes-closed', 'side-glance',
// 'determined', 'wounded') are available for richer dialogue.
//
// Cell layout (col, row):
//   row 0: neutral, grim, angry, shouting, wounded
//   row 1: wounded(alt), eyes-closed, side-glance, ?, determined
const gutsPortrait: PortraitAsset = {
  domain: 'portrait',
  key: 'guts',
  url: GUTS_PORTRAIT_URL,
  sheet: { kind: 'grid', cellW: PORTRAIT_CELL_W, cellH: PORTRAIT_CELL_H, cols: PORTRAIT_COLS, rows: PORTRAIT_ROWS },
  // row 0
  expressions: [
    'neutral',       // (0,0)
    'grim',          // (1,0)
    'angry',         // (2,0)
    'shouting',      // (3,0)
    'wounded',       // (4,0)
    // row 1
    'wounded',       // (0,1) — alternate wounded, same expression key
    'eyes-closed',   // (1,1)
    'side-glance',   // (2,1)
    'shocked',       // (3,1) — the shouting-with-resolve variant reads as shocked
    'determined',    // (4,1)
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
