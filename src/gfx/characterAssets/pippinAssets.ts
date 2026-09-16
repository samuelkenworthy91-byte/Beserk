// ─────────────────── Pippin external assets ───────────────────
//
// Pippin, the largest and strongest front-line infantryman in the
// Band. Massive, heavily-muscled, shaved head, two-handed battle-axe.

import {
  registerAsset, loadImage,
  type BattleAsset, type MapAsset, type PortraitAsset,
} from '../assetLoader';

const PIPPIN_BATTLE_URL   = '/sprites/battle/pippin.webp';
const PIPPIN_MAP_URL      = '/sprites/map/pippin.webp';
const PIPPIN_PORTRAIT_URL = '/portraits/pippin.webp';

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

const pippinBattle: BattleAsset = {
  domain: 'battle',
  key: 'pippin',
  url: PIPPIN_BATTLE_URL,
  sheet: { kind: 'grid', cellW: BATTLE_CELL_W, cellH: BATTLE_CELL_H, cols: BATTLE_COLS, rows: BATTLE_ROWS },
  rightRow: 0,
  leftRow: 0,
};

const pippinMap: MapAsset = {
  domain: 'map',
  key: 'pippin',
  url: PIPPIN_MAP_URL,
  sheet: { kind: 'grid', cellW: MAP_CELL_W, cellH: MAP_CELL_H, cols: MAP_COLS, rows: MAP_ROWS },
  frames: [
    'idle-front', 'idle-right', 'idle-back', 'idle-left',
    'walkA-front', 'walkA-right', 'walkA-back', 'walkA-left',
  ],
};

const pippinPortrait: PortraitAsset = {
  domain: 'portrait',
  key: 'pippin',
  url: PIPPIN_PORTRAIT_URL,
  sheet: { kind: 'grid', cellW: PORTRAIT_CELL_W, cellH: PORTRAIT_CELL_H, cols: PORTRAIT_COLS, rows: PORTRAIT_ROWS },
  expressions: [
    'neutral', 'grim', 'angry', 'shouting', 'wounded',
    'wounded', 'eyes-closed', 'side-glance', 'shocked', 'determined',
  ],
};

let registered = false;

export function _resetPippinRegistration() { registered = false; }

export function registerPippinAssets(): void {
  if (registered) return;
  registered = true;
  registerAsset(pippinBattle);
  registerAsset(pippinMap);
  registerAsset(pippinPortrait);
}

export async function preloadPippinAssets(): Promise<void> {
  registerPippinAssets();
  await Promise.all([
    loadImage(PIPPIN_BATTLE_URL),
    loadImage(PIPPIN_MAP_URL),
    loadImage(PIPPIN_PORTRAIT_URL),
  ]);
}
