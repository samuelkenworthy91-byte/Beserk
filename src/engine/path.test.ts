import { describe, it, expect } from 'vitest';
import { movementRange, attackFrom, threatZone, pathTo, key } from './path';
import { terrainAt, mapSize } from './terrain';
import { mkUnit } from '../data/characters';
import { CHAPTER_1 } from '../data/chapter1';
import type { Unit } from './types';

//  0123
// 0....
// 1.MM.   M = mountain (impassable)
// 2....
const MAP = ['....', '.MM.', '....'];

function walker(x: number, y: number, mov: number, faction: 'player' | 'enemy' = 'player'): Unit {
  const u = mkUnit('wyatt', faction, x, y);
  u.stats.mov = mov;
  return u;
}

describe('movementRange', () => {
  it('respects movement budget and impassable terrain', () => {
    const u = walker(0, 0, 3);
    const moves = movementRange(MAP, [u], u);
    const reached = [...moves.keys()].sort();
    expect(reached).toEqual(['0,0', '0,1', '0,2', '1,0', '1,2', '2,0', '3,0'].sort());
    expect(moves.has('1,1')).toBe(false);   // mountain
    expect(moves.has('2,1')).toBe(false);   // mountain
  });

  it('records the true accumulated cost', () => {
    const u = walker(0, 0, 3);
    const moves = movementRange(MAP, [u], u);
    expect(moves.get('0,0')!.cost).toBe(0);
    expect(moves.get('1,0')!.cost).toBe(1);
    expect(moves.get('3,0')!.cost).toBe(3);
  });

  it('charges the higher cost for forest', () => {
    // forest costs 2, so with mov 1 it is out of reach
    const m = ['..', 'T.'];
    const u = walker(0, 0, 1);
    expect(movementRange(m, [u], u).has('0,1')).toBe(false);
    const u2 = walker(0, 0, 2);
    expect(movementRange(m, [u2], u2).has('0,1')).toBe(true);
  });

  it('is blocked by enemies', () => {
    const u = walker(0, 0, 3);
    const foe = mkUnit('e_soldier', 'enemy', 1, 0);
    const moves = movementRange(MAP, [u, foe], u);
    expect(moves.has('1,0')).toBe(false);
    expect(moves.has('2,0')).toBe(false);   // only route was through the enemy
    expect(moves.has('0,2')).toBe(true);    // the long way round is still open
  });

  it('passes through allies but they remain occupied tiles', () => {
    const u = walker(0, 0, 3);
    const ally = mkUnit('bren', 'player', 1, 0);
    const moves = movementRange(MAP, [u, ally], u);
    expect(moves.has('1,0')).toBe(true);    // traversable
    expect(moves.has('2,0')).toBe(true);    // reachable beyond the ally
  });

  it('never leaves the board', () => {
    const u = walker(0, 0, 9);
    const moves = movementRange(MAP, [u], u);
    const { w, h } = mapSize(MAP);
    for (const k of moves.keys()) {
      const [x, y] = k.split(',').map(Number);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(w);
      expect(y).toBeLessThan(h);
    }
  });
});

describe('pathTo', () => {
  it('returns the step list excluding the origin', () => {
    const u = walker(0, 0, 3);
    const moves = movementRange(MAP, [u], u);
    expect(pathTo(moves, 2, 0)).toEqual([[1, 0], [2, 0]]);
  });

  it('routes around obstacles', () => {
    const u = walker(0, 0, 4);
    const moves = movementRange(MAP, [u], u);
    const path = pathTo(moves, 1, 2);
    expect(path[path.length - 1]).toEqual([1, 2]);
    for (const [x, y] of path) expect(terrainAt(MAP, x, y).cost).toBeLessThan(99);
  });

  it('gives an empty path for an unreachable tile', () => {
    const u = walker(0, 0, 1);
    const moves = movementRange(MAP, [u], u);
    expect(pathTo(moves, 3, 2)).toEqual([]);
  });

  it('produces an orthogonally contiguous path', () => {
    const u = walker(0, 0, 6);
    const moves = movementRange(MAP, [u], u);
    const path = pathTo(moves, 3, 2);
    let [cx, cy] = [0, 0];
    for (const [x, y] of path) {
      expect(Math.abs(x - cx) + Math.abs(y - cy)).toBe(1);
      cx = x; cy = y;
    }
  });
});

describe('attackFrom', () => {
  it('covers melee range 1', () => {
    expect([...attackFrom(MAP, 1, 1, 1, 1)].sort())
      .toEqual(['0,1', '1,0', '1,2', '2,1'].sort());
  });
  it('clips at the board edge', () => {
    expect([...attackFrom(MAP, 0, 0, 1, 1)].sort()).toEqual(['0,1', '1,0'].sort());
  });
  it('excludes adjacent tiles for a range-2 bow', () => {
    const tiles = [...attackFrom(MAP, 1, 1, 2, 2)].sort();
    expect(tiles).toEqual(['0,0', '0,2', '2,0', '2,2', '3,1'].sort());
    expect(tiles).not.toContain('1,0');
  });
  it('ignores terrain — reach is not blocked by walls', () => {
    expect(attackFrom(MAP, 0, 1, 1, 1).has('1,1')).toBe(true);
  });
});

describe('threatZone', () => {
  it('is the union of reach from every reachable tile', () => {
    const u = walker(0, 0, 1);
    const moves = movementRange(MAP, [u], u);
    const zone = threatZone(MAP, moves, 1, 1);
    // standing still threatens (1,0) and (0,1); stepping extends it
    expect(zone.has('1,0')).toBe(true);
    expect(zone.has('0,1')).toBe(true);
    expect(zone.has('2,0')).toBe(true);   // from (1,0)
    expect(zone.has('0,2')).toBe(true);   // from (0,1)
  });
  it('is never smaller than the movement set it came from', () => {
    const u = walker(0, 0, 2);
    const moves = movementRange(MAP, [u], u);
    const zone = threatZone(MAP, moves, 1, 1);
    expect(zone.size).toBeGreaterThan(moves.size - 1);
  });
});

describe('Chapter 1 map integrity', () => {
  const { w, h } = mapSize(CHAPTER_1.map);

  it('is a clean 14x9 rectangle', () => {
    expect(w).toBe(14);
    expect(h).toBe(9);
    for (const row of CHAPTER_1.map) expect(row.length).toBe(14);
  });

  it('places every unit in bounds and on passable ground', () => {
    for (const cu of CHAPTER_1.units) {
      expect(cu.x).toBeGreaterThanOrEqual(0);
      expect(cu.y).toBeGreaterThanOrEqual(0);
      expect(cu.x).toBeLessThan(w);
      expect(cu.y).toBeLessThan(h);
      expect(terrainAt(CHAPTER_1.map, cu.x, cu.y).cost).toBeLessThan(99);
    }
  });

  it('never stacks two units on one tile', () => {
    const seen = new Set<string>();
    for (const cu of CHAPTER_1.units) {
      const k = key(cu.x, cu.y);
      expect(seen.has(k)).toBe(false);
      seen.add(k);
    }
  });

  it('can walk from the player start to the boss', () => {
    const boss = CHAPTER_1.units.find(u => u.def === CHAPTER_1.bossDefId)!;
    const scout = walker(CHAPTER_1.playerStart[0][0], CHAPTER_1.playerStart[0][1], 200);
    const moves = movementRange(CHAPTER_1.map, [scout], scout);
    // the boss tile itself is occupied, so check an adjacent attack position
    const adjacent = [[1, 0], [-1, 0], [0, 1], [0, -1]]
      .map(([dx, dy]) => key(boss.x + dx, boss.y + dy))
      .some(k => moves.has(k));
    expect(adjacent).toBe(true);
  });

  it('keeps every squad spatially coherent', () => {
    const groups = new Map<string, { x: number; y: number }[]>();
    for (const cu of CHAPTER_1.units) {
      if (!cu.group) continue;
      const list = groups.get(cu.group) ?? [];
      list.push({ x: cu.x, y: cu.y });
      groups.set(cu.group, list);
    }
    // a squad wakes as one, so its members must plausibly see the same threat
    for (const [, members] of groups) {
      for (const a of members) {
        const near = members.some(b =>
          (a !== b) && Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= 4);
        if (members.length > 1) expect(near).toBe(true);
      }
    }
  });
});
