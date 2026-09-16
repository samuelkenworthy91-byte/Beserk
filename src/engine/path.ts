import type { Unit } from './types';
import { terrainAt, mapSize } from './terrain';

// ─── Movement / attack range computation (BFS with terrain costs) ────────────

export interface MoveNode { cost: number; px: number; py: number }
export type MoveMap = Map<string, MoveNode>;

export const key = (x: number, y: number) => x + ',' + y;
export const unkey = (k: string): [number, number] => {
  const i = k.indexOf(','); return [+k.slice(0, i), +k.slice(i + 1)];
};

/** All tiles a unit can move to this phase, with remaining-move parents for pathing. */
export function movementRange(
  map: string[], units: Unit[], unit: Unit,
  fromX?: number, fromY?: number,
): MoveMap {
  const { w, h } = mapSize(map);
  const sx = fromX ?? unit.x, sy = fromY ?? unit.y;
  // FE rule: you can pass through allies, but never through enemies.
  const blocked = new Set<string>();
  for (const u of units) {
    if (u.dead || u.uid === unit.uid) continue;
    if (u.faction !== unit.faction) blocked.add(key(u.x, u.y));
  }
  const out: MoveMap = new Map();
  out.set(key(sx, sy), { cost: 0, px: -1, py: -1 });
  const frontier: [number, number, number][] = [[sx, sy, 0]];
  while (frontier.length) {
    frontier.sort((a, b) => a[2] - b[2]);
    const [x, y, c] = frontier.shift()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      if (blocked.has(key(nx, ny))) continue;
      const t = terrainAt(map, nx, ny);
      if (t.cost >= 99) continue;
      const nc = c + t.cost;
      if (nc > unit.stats.mov) continue;
      const k = key(nx, ny);
      const prev = out.get(k);
      if (prev !== undefined && prev.cost <= nc) continue;
      out.set(k, { cost: nc, px: x, py: y });
      frontier.push([nx, ny, nc]);
    }
  }
  return out;
}

/** Tiles attackable from a given tile with a weapon's range. */
export function attackFrom(map: string[], x: number, y: number, minR: number, maxR: number): Set<string> {
  const { w, h } = mapSize(map);
  const out = new Set<string>();
  for (let ty = 0; ty < h; ty++) {
    for (let tx = 0; tx < w; tx++) {
      const d = Math.abs(tx - x) + Math.abs(ty - y);
      if (d >= minR && d <= maxR) out.add(key(tx, ty));
    }
  }
  return out;
}

/** All tiles from which any move destination can attack (the union "threat" zone). */
export function threatZone(map: string[], moves: MoveMap, minR: number, maxR: number): Set<string> {
  const out = new Set<string>();
  for (const k of moves.keys()) {
    for (const t of attackFrom(map, ...unkey(k), minR, maxR)) out.add(t);
  }
  return out;
}

/** Reconstruct a path (list of tiles, start excluded, dest included). */
export function pathTo(moves: MoveMap, tx: number, ty: number): [number, number][] {
  const out: [number, number][] = [];
  let node = moves.get(key(tx, ty));
  if (!node) return out;
  let cx = tx, cy = ty;
  while (node && node.px >= 0) {
    out.unshift([cx, cy]);
    cx = node.px; cy = node.py;
    node = moves.get(key(cx, cy));
  }
  return out;
}
