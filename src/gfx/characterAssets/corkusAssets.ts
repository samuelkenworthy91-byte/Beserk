// ─────────────────── Corkus external assets ───────────────────
//
// Corkus, the grizzled sergeant of the Band. Ruddy sun-tanned mid
// complexion, dark shaggy hair, iron-red half-cloak, leather-and-
// mail cuirass, spear.
//
// Only the battle sheet has been authored so far; the map and
// portrait manifests fall back to the code-authored cast. New
// sheets can be added here later without changing App.tsx.

import {
  registerAsset, loadImage,
  type BattleAsset,
} from '../assetLoader';

const CORKUS_BATTLE_URL = '/sprites/battle/corkus.webp';

const BATTLE_COLS = 9;
const BATTLE_ROWS = 2;
const BATTLE_CELL_W = 1408 / BATTLE_COLS;
const BATTLE_CELL_H = 768 / BATTLE_ROWS;

const corkusBattle: BattleAsset = {
  domain: 'battle',
  key: 'corkus',
  url: CORKUS_BATTLE_URL,
  sheet: { kind: 'grid', cellW: BATTLE_CELL_W, cellH: BATTLE_CELL_H, cols: BATTLE_COLS, rows: BATTLE_ROWS },
  rightRow: 0,
  leftRow: 0,
};

let registered = false;

export function _resetCorkusRegistration() { registered = false; }

export function registerCorkusAssets(): void {
  if (registered) return;
  registered = true;
  registerAsset(corkusBattle);
  // Map and portrait sheets for Corkus are not yet authored; the
  // renderer falls back to the code-authored cast and PORTRAIT_ART
  // until they're added in a follow-up commit.
}

export async function preloadCorkusAssets(): Promise<void> {
  registerCorkusAssets();
  await loadImage(CORKUS_BATTLE_URL);
}
