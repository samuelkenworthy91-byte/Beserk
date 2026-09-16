// ─── Terrain database ────────────────────────────────────────────────────────
// Each map character maps to a terrain with movement cost, defensive bonus,
// avoid bonus and phase-start healing. All units in Chapter 1 are foot units.

export interface TerrainDef {
  key: string;
  name: string;
  cost: number;   // 99 = impassable
  def: number;
  avo: number;
  heal: number;   // % of max hp restored at start of that faction's phase
  blocksSight?: boolean;
}

export const TERRAIN: Record<string, TerrainDef> = {
  plain: { key: 'plain', name: 'Plain', cost: 1, def: 0, avo: 0, heal: 0 },
  road: { key: 'road', name: 'Road', cost: 1, def: 0, avo: 0, heal: 0 },
  forest: { key: 'forest', name: 'Forest', cost: 2, def: 1, avo: 20, heal: 0 },
  fort: { key: 'fort', name: 'Fort', cost: 2, def: 2, avo: 20, heal: 20 },
  gate: { key: 'gate', name: 'Gate', cost: 2, def: 2, avo: 10, heal: 15 },
  house: { key: 'house', name: 'House', cost: 1, def: 1, avo: 10, heal: 0 },
  mountain: { key: 'mountain', name: 'Peak', cost: 99, def: 0, avo: 0, heal: 0 },
  wall: { key: 'wall', name: 'Wall', cost: 99, def: 0, avo: 0, heal: 0 },
  water: { key: 'water', name: 'Water', cost: 99, def: 0, avo: 0, heal: 0 },
};

export const LEGEND: Record<string, string> = {
  '.': 'plain', 'R': 'road', 'T': 'forest', 'F': 'fort', 'G': 'gate',
  'H': 'house', 'M': 'mountain', 'C': 'wall', 'W': 'water', '~': 'water',
};

export function terrainAt(map: string[], x: number, y: number): TerrainDef {
  if (y < 0 || y >= map.length || x < 0 || x >= map[0].length) return TERRAIN.mountain;
  const ch = map[y][x];
  return TERRAIN[LEGEND[ch] ?? 'plain'];
}

export function mapSize(map: string[]): { w: number; h: number } {
  return { w: map[0].length, h: map.length };
}
