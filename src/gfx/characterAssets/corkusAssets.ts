// ─────────────────── Corkus external assets ───────────────────
//
// Corkus, the grizzled sergeant of the Band. Ruddy sun-tanned mid
// complexion, dark shaggy hair, iron-red half-cloak, leather-and-
// mail cuirass, spear.

import {
  registerAsset, loadImage,
  type BattleAsset, type MapAsset, type PortraitAsset,
} from '../assetLoader';

const CORKUS_BATTLE_URL   = '/sprites/battle/corkus.png';
const CORKUS_MAP_URL      = '/sprites/map/corkus.png';
const CORKUS_PORTRAIT_URL = '/portraits/corkus.png';

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

const corkusBattle: BattleAsset = {
  domain: 'battle',
  key: 'corkus',
  url: CORKUS_BATTLE_URL,
  sheet: { kind: 'grid', cellW: BATTLE_CELL_W, cellH: BATTLE_CELL_H, cols: BATTLE_COLS, rows: BATTLE_ROWS },
  rightRow: 0,
  leftRow: 0,
};

const corkusMap: MapAsset = {
  domain: 'map',
  key: 'corkus',
  url: CORKUS_MAP_URL,
  sheet: { kind: 'grid', cellW: MAP_CELL_W, cellH: MAP_CELL_H, cols: MAP_COLS, rows: MAP_ROWS },
  frames: [
    'idle-front', 'idle-right', 'idle-back', 'idle-left',
    'walkA-front', 'walkA-right', 'walkA-back', 'walkA-left',
  ],
};

const corkusPortrait: PortraitAsset = {
  domain: 'portrait',
  key: 'corkus',
  url: CORKUS_PORTRAIT_URL,
  sheet: { kind: 'grid', cellW: PORTRAIT_CELL_W, cellH: PORTRAIT_CELL_H, cols: PORTRAIT_COLS, rows: PORTRAIT_ROWS },
  expressions: [
    'neutral', 'grim', 'angry', 'shouting', 'wounded',
    'wounded', 'eyes-closed', 'side-glance', 'shocked', 'determined',
  ],
};

let registered = false;

export function _resetCorkusRegistration() { registered = false; }

export function registerCorkusAssets(): void {
  if (registered) return;
  registered = true;
  registerAsset(corkusBattle);
  registerAsset(corkusMap);
  registerAsset(corkusPortrait);
}

export async function preloadCorkusAssets(): Promise<void> {
  registerCorkusAssets();
  // Only the battle sheet exists for Corkus so far; the others fall
  // back to the code-authored renderer until they're authored.
  await loadImage(CORKUS_BATTLE_URL);
}
