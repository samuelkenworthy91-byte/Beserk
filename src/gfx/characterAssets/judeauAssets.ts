// ─────────────────── Judeau external assets ───────────────────
//
// Judeau, the scout and second-in-command of Casca's Raiders. Auburn
// hair, green cloak, light scout's leather.

import {
  registerAsset, loadImage,
  type BattleAsset, type MapAsset, type PortraitAsset,
} from '../assetLoader';

const JUDEAU_BATTLE_URL   = '/sprites/battle/judeau.png';
const JUDEAU_MAP_URL      = '/sprites/map/judeau.png';
const JUDEAU_PORTRAIT_URL = '/portraits/judeau.png';

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

const judeauBattle: BattleAsset = {
  domain: 'battle',
  key: 'judeau',
  url: JUDEAU_BATTLE_URL,
  sheet: { kind: 'grid', cellW: BATTLE_CELL_W, cellH: BATTLE_CELL_H, cols: BATTLE_COLS, rows: BATTLE_ROWS },
  rightRow: 0,
  leftRow: 0,
};

const judeauMap: MapAsset = {
  domain: 'map',
  key: 'judeau',
  url: JUDEAU_MAP_URL,
  sheet: { kind: 'grid', cellW: MAP_CELL_W, cellH: MAP_CELL_H, cols: MAP_COLS, rows: MAP_ROWS },
  frames: [
    'idle-front', 'idle-right', 'idle-back', 'idle-left',
    'walkA-front', 'walkA-right', 'walkA-back', 'walkA-left',
  ],
};

const judeauPortrait: PortraitAsset = {
  domain: 'portrait',
  key: 'judeau',
  url: JUDEAU_PORTRAIT_URL,
  sheet: { kind: 'grid', cellW: PORTRAIT_CELL_W, cellH: PORTRAIT_CELL_H, cols: PORTRAIT_COLS, rows: PORTRAIT_ROWS },
  expressions: [
    'neutral', 'grim', 'angry', 'shouting', 'wounded',
    'wounded', 'eyes-closed', 'side-glance', 'shocked', 'determined',
  ],
};

let registered = false;

export function _resetJudeauRegistration() { registered = false; }

export function registerJudeauAssets(): void {
  if (registered) return;
  registered = true;
  registerAsset(judeauBattle);
  registerAsset(judeauMap);
  registerAsset(judeauPortrait);
}

export async function preloadJudeauAssets(): Promise<void> {
  registerJudeauAssets();
  await Promise.all([
    loadImage(JUDEAU_BATTLE_URL),
    loadImage(JUDEAU_MAP_URL),
    loadImage(JUDEAU_PORTRAIT_URL),
  ]);
}
