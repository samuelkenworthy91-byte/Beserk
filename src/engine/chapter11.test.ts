import { describe, it, expect } from 'vitest';
import { BattleEngine } from './battle';
import { CHAPTER_11 } from '../data/chapter11';
import { CHAPTER_10 } from '../data/chapter10';

// ─── Chapter 11 — Fall of the Hawk ─────────────────────────────────────────
//
// A year after the Eclipse, Guts is back at the Tower of Rebirth. He has
// come for Griffith. The chapter stages his single-player break-in through
// a corridor of iron doors in the Falconia dungeon. The chief warden
// (c_warden, UNFLINCHING) holds the keys.

describe('Chapter 11 — Fall of the Hawk', () => {

  // ───────────────────────── structure ─────────────────────────

  it('has the right id, name and boss declaration', () => {
    expect(CHAPTER_11.id).toBe(11);
    expect(CHAPTER_11.name.toLowerCase()).toContain('fall');
    expect(CHAPTER_11.bossDefId).toBe('c_warden');
  });

  it('continues the chapter id-space', () => {
    expect(CHAPTER_11.id).toBe(CHAPTER_10.id + 1);
  });

  // ───────────────────────── map ─────────────────────────

  it('the map is a 14×10 dungeon corridor with iron doors (C) and gates (G)', () => {
    expect(CHAPTER_11.map.length).toBe(10);
    for (const row of CHAPTER_11.map) expect(row.length).toBe(14);
    const allText = CHAPTER_11.map.join('');
    expect(/[C]/.test(allText)).toBe(true); // iron doors / cell walls
    expect(/[G]/.test(allText)).toBe(true); // side-hall gates
    expect(/[R]/.test(allText)).toBe(true); // corridor road
  });

  // ───────────────────────── unit placements ─────────────────────────

  it('deploys Guts ALONE — single-player infiltration', () => {
    const players = CHAPTER_11.units.filter(u => u.faction === 'player');
    expect(players.length).toBe(1);
    expect(players[0].def).toBe('guts');
  });

  it('deploys door, patrol, side and boss enemy groups', () => {
    const door = CHAPTER_11.units.filter(u => u.group === 'door');
    const patrol = CHAPTER_11.units.filter(u => u.group === 'patrol');
    const side = CHAPTER_11.units.filter(u => u.group === 'side');
    const tower = CHAPTER_11.units.filter(u => u.group === 'tower');
    expect(door.length).toBe(2);
    expect(patrol.length).toBe(3);
    expect(patrol.every(u => u.ai === 'patrol')).toBe(true);
    expect(side.length).toBe(3);
    expect(tower.length).toBe(1);
    expect(tower[0].def).toBe('c_warden');
  });

  it('every unit is on a walkable, in-bounds tile', () => {
    const H = CHAPTER_11.map.length;
    const W = CHAPTER_11.map[0].length;
    for (const u of CHAPTER_11.units) {
      expect(u.x).toBeGreaterThanOrEqual(0); expect(u.x).toBeLessThan(W);
      expect(u.y).toBeGreaterThanOrEqual(0); expect(u.y).toBeLessThan(H);
      // units must not be on impassable (water, mountain)
      const t = CHAPTER_11.map[u.y][u.x];
      expect(/[MW~]/.test(t)).toBe(false);
      // iron doors (C) and gate tiles (G) are walkable
    }
  });

  // ───────────────────────── engine boot ─────────────────────────

  it('the engine boots Chapter 11 with one player and nine enemies', () => {
    const eng = new BattleEngine(CHAPTER_11, null);
    expect(eng.turn).toBe(1);
    expect(eng.phase).toBe('player');
    expect(eng.players().length).toBe(1);
    expect(eng.enemies().length).toBe(9);
    const warden = eng.units.find(u => u.defId === 'c_warden')!;
    expect(warden).toBeTruthy();
    expect(warden.boss).toBe(true);
  });

  // ───────────────────────── AI behaviour ─────────────────────────

  it('every enemy starts dormant', () => {
    const eng = new BattleEngine(CHAPTER_11, null);
    expect(eng.enemies().every(u => !u.active)).toBe(true);
  });

  it('the patrol pair wakes when Guts walks within aggro=3 of the corridor', () => {
    const eng = new BattleEngine(CHAPTER_11, null);
    const patrol = eng.units.filter(u => u.group === 'patrol');
    const gut = eng.players()[0];
    // walk up the south stairs into the corridor area (y=4 row)
    gut.x = 7; gut.y = 6;
    (eng as unknown as { evaluateTriggers: () => void }).evaluateTriggers();
    expect(patrol.some(u => u.active)).toBe(true);
  });

  it('the door guards wake when Guts enters the north corridor', () => {
    const eng = new BattleEngine(CHAPTER_11, null);
    const door = eng.units.filter(u => u.group === 'door');
    const gut = eng.players()[0];
    gut.x = 7; gut.y = 3;
    (eng as unknown as { evaluateTriggers: () => void }).evaluateTriggers();
    expect(door.some(u => u.active)).toBe(true);
  });

  it('the chief warden carries UNFLINCHING (his keys are his life)', () => {
    const eng = new BattleEngine(CHAPTER_11, null);
    const warden = eng.units.find(u => u.defId === 'c_warden')!;
    expect(warden.traits).toContain('unflinching');
  });

  // ───────────────────────── dialogue ─────────────────────────

  it('the intro sets up the year-after and the chimney entrance', () => {
    const allText = CHAPTER_11.intro.lines.map(l => l.text).join('\n');
    expect(allText.toLowerCase()).toContain('a year');
    expect(allText.toLowerCase()).toContain('chimney');
    expect(allText.toLowerCase()).toContain('griffith');
  });

  it('the outro ends with Guts carrying Griffith west', () => {
    const allText = CHAPTER_11.outro.lines.map(l => l.text).join('\n');
    expect(allText.toLowerCase()).toContain('carrying');
    expect(allText.toLowerCase()).toContain('west');
    expect(allText.toLowerCase()).toContain('griffith');
  });

  // ───────────────────────── save import ─────────────────────────

  it('a chapter-10 save with Guts alone persists his level into chapter 11', () => {
    const seed = {
      unlockedChapters: 11,
      party: [{
        defId: 'guts', level: 18, exp: 150,
        stats: { hp: 76, str: 28, skl: 24, spd: 26, lck: 5,
                 def: 19, res: 14, mov: 6, con: 15 }, items: [], hp: 76,
      }],
      fallen: ['casca', 'judeau', 'pippin', 'corkus'],
      totalTurns: 160,
    };
    const eng = new BattleEngine(CHAPTER_11, seed);
    const gut = eng.players()[0];
    expect(gut.level).toBe(18);
    expect(eng.players().length).toBe(1);
  });

  // ───────────────────────── persistence ─────────────────────────

  it('patrol state survives the suspend', () => {
    const eng = new BattleEngine(CHAPTER_11, null);
    const p = eng.units.find(u => u.group === 'patrol' && u.defId === 'e_soldier')!;
    p.patrolAnchor = { x: 4, y: 4 };
    p.patrolDir = -1;
    const snap = eng.snapshot();
    const eng2 = new BattleEngine(CHAPTER_11, null, snap);
    const p2 = eng2.units.find(u => u.group === 'patrol' && u.defId === 'e_soldier')!;
    expect(p2.patrolAnchor).toEqual({ x: 4, y: 4 });
    expect(p2.patrolDir).toBe(-1);
  });

  it('snapshot/resume keeps Guts position', () => {
    const eng = new BattleEngine(CHAPTER_11, null);
    const gut = eng.players()[0];
    gut.x = 7; gut.y = 5;
    const snap = eng.snapshot();
    const eng2 = new BattleEngine(CHAPTER_11, null, snap);
    expect(eng2.players()[0].x).toBe(7);
    expect(eng2.players()[0].y).toBe(5);
  });
});
