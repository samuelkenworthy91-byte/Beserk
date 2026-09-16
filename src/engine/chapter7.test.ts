import { describe, it, expect } from 'vitest';
import { BattleEngine } from './battle';
import { CHAPTER_7 } from '../data/chapter7';
import { CHAPTER_6 } from '../data/chapter6';

// ─── Chapter 7 — Before Doldrey ────────────────────────────────────────────
//
// The night before Doldrey. Griffith sends Guts, Casca, Judeau to put out
// an imperial signal fire at a small fortress called Foross. 3 players
// against 4 outriders, 2 wardens, 2 pyre guards, and an imperial
// centurion — the night-scout team must take the small fortress quietly.

describe('Chapter 7 — Before Doldrey', () => {

  // ───────────────────────── structure ─────────────────────────

  it('has the right id, name and boss declaration', () => {
    expect(CHAPTER_7.id).toBe(7);
    expect(CHAPTER_7.name.toLowerCase()).toContain('before doldrey');
    expect(CHAPTER_7.bossDefId).toBe('c_centurion');
  });

  it('continues the chapter id-space', () => {
    expect(CHAPTER_7.id).toBe(CHAPTER_6.id + 1);
  });

  // ───────────────────────── map ─────────────────────────

  it('the map is a 14×10 night-side approach with walls and water', () => {
    expect(CHAPTER_7.map.length).toBe(10);
    for (const row of CHAPTER_7.map) expect(row.length).toBe(14);
    const allText = CHAPTER_7.map.join('');
    expect(/[T]/.test(allText)).toBe(true); // forest
    expect(/[C]/.test(allText)).toBe(true); // walls
    expect(/[~W]/.test(allText)).toBe(true); // water
  });

  // ───────────────────────── unit placements ─────────────────────────

  it('deploys three players (Guts, Casca, Judeau) on the south forest edge', () => {
    const players = CHAPTER_7.units.filter(u => u.faction === 'player');
    expect(players.length).toBe(3);
    expect(players.map(p => p.def).sort()).toEqual(['casca', 'guts', 'judeau']);
    for (const p of players) {
      // all three are at the bottom of the map, in the tree-line
      expect(p.y).toBe(9);
      expect(p.x).toBeLessThanOrEqual(5);
    }
  });

  it('deploys outrider, ward, pyre and boss enemy groups', () => {
    const outrider = CHAPTER_7.units.filter(u => u.group === 'outrider');
    const ward = CHAPTER_7.units.filter(u => u.group === 'ward');
    const pyre = CHAPTER_7.units.filter(u => u.group === 'pyre');
    expect(outrider.length).toBe(4);
    expect(outrider.every(u => u.ai === 'patrol')).toBe(true);
    expect(ward.length).toBe(3); // 2 wardens + the boss
    expect(pyre.length).toBe(2);
    expect(ward.some(u => u.def === 'c_centurion')).toBe(true);
  });

  it('every unit is on a walkable, in-bounds tile', () => {
    const H = CHAPTER_7.map.length;
    const W = CHAPTER_7.map[0].length;
    for (const u of CHAPTER_7.units) {
      expect(u.x).toBeGreaterThanOrEqual(0); expect(u.x).toBeLessThan(W);
      expect(u.y).toBeGreaterThanOrEqual(0); expect(u.y).toBeLessThan(H);
      const t = CHAPTER_7.map[u.y][u.x];
      expect(/[MW~C]/.test(t)).toBe(false);
    }
  });

  // ───────────────────────── engine boot ─────────────────────────

  it('the engine boots Chapter 7 with three players and nine enemies', () => {
    const eng = new BattleEngine(CHAPTER_7, null);
    expect(eng.turn).toBe(1);
    expect(eng.phase).toBe('player');
    expect(eng.players().length).toBe(3);
    expect(eng.enemies().length).toBe(9);
    const centurion = eng.units.find(u => u.defId === 'c_centurion')!;
    expect(centurion).toBeTruthy();
    expect(centurion.boss).toBe(true);
  });

  // ───────────────────────── AI behaviour ─────────────────────────

  it('every enemy starts dormant', () => {
    const eng = new BattleEngine(CHAPTER_7, null);
    expect(eng.enemies().every(u => !u.active)).toBe(true);
  });

  it('the outriders have patrol state at deploy', () => {
    const eng = new BattleEngine(CHAPTER_7, null);
    const outrider = eng.units.filter(u => u.group === 'outrider');
    for (const u of outrider) {
      expect(u.patrolAnchor).toBeTruthy();
      expect(u.patrolDir).toBeDefined();
    }
  });

  it('walking up the road wakes the outriders', () => {
    const eng = new BattleEngine(CHAPTER_7, null);
    const outrider = eng.units.filter(u => u.group === 'outrider');
    const gut = eng.players().find(u => u.defId === 'guts')!;
    gut.x = 5; gut.y = 8;  // right next to the patrol pair at (6,8)/(7,8)
    (eng as unknown as { evaluateTriggers: () => void }).evaluateTriggers();
    expect(outrider.some(u => u.active)).toBe(true);
  });

  it('the ward + boss group wakes only when a player crosses the wall (x>=4)', () => {
    const eng = new BattleEngine(CHAPTER_7, null);
    const ward = eng.units.filter(u => u.group === 'ward');
    const gut = eng.players().find(u => u.defId === 'guts')!;
    // far enough that the ward's aggro=4 doesn't reach (the ward is at x=4)
    gut.x = 10; gut.y = 9;  // outside the wall AND far from the ward
    (eng as unknown as { evaluateTriggers: () => void }).evaluateTriggers();
    expect(ward.every(u => !u.active)).toBe(true);
    // walk through the wall — now well within ward's aggro=4
    gut.x = 5; gut.y = 3;
    (eng as unknown as { evaluateTriggers: () => void }).evaluateTriggers();
    expect(ward.some(u => u.active)).toBe(true);
  });

  it('the pyre guards wake when a player is near the pyre location', () => {
    const eng = new BattleEngine(CHAPTER_7, null);
    const pyre = eng.units.filter(u => u.group === 'pyre');
    const gut = eng.players().find(u => u.defId === 'guts')!;
    // pyre guards at (7,3) and (8,3); walk next to them
    gut.x = 8; gut.y = 4;
    (eng as unknown as { evaluateTriggers: () => void }).evaluateTriggers();
    expect(pyre.some(u => u.active)).toBe(true);
  });

  // ───────────────────────── dialogue ─────────────────────────

  it('the intro sets up the night-scouting with Griffith\'s orders', () => {
    const speakers = new Set(CHAPTER_7.intro.lines.map(l => l.speaker));
    expect(speakers.has('Griffith')).toBe(true);
    expect(speakers.has('Casca')).toBe(true);
    expect(speakers.has('Judeau')).toBe(true);
    expect(speakers.has('Guts')).toBe(true); // Guts does speak in this intro
    expect(CHAPTER_7.intro.lines.length).toBeGreaterThanOrEqual(5);
  });

  it('the outro mentions the centurion\'s list and "a name to forget"', () => {
    const allText = CHAPTER_7.outro.lines.map(l => l.text).join('\n');
    expect(allText.toLowerCase()).toContain('list');
    expect(allText.toLowerCase()).toContain('forget');
    expect(allText.toLowerCase()).toContain('doldrey');
  });

  // ───────────────────────── save import ─────────────────────────

  it('a chapter-6 save with three members boots chapter 7 with their levels', () => {
    const seed = {
      unlockedChapters: 7,
      party: [
        { defId: 'guts',   level: 10, exp: 70,
          stats: { hp: 54, str: 19, skl: 16, spd: 18, lck: 5,
                   def: 15, res: 10, mov: 6, con: 13 }, items: [], hp: 54 },
        { defId: 'casca',  level: 9, exp: 50,
          stats: { hp: 40, str: 14, skl: 13, spd: 15, lck: 6,
                   def: 10, res: 8, mov: 6, con: 10 }, items: [], hp: 40 },
        { defId: 'judeau', level: 7, exp: 30,
          stats: { hp: 32, str: 9,  skl: 13, spd: 14, lck: 6,
                   def: 8,  res: 7, mov: 6, con: 8 },  items: [], hp: 32 },
      ],
      fallen: [], totalTurns: 60,
    };
    const eng = new BattleEngine(CHAPTER_7, seed);
    const ps = eng.players();
    expect(ps.length).toBe(3);
    expect(ps.find(u => u.defId === 'guts')!.level).toBe(10);
    expect(ps.find(u => u.defId === 'casca')!.level).toBe(9);
    expect(ps.find(u => u.defId === 'judeau')!.level).toBe(7);
  });

  // ───────────────────────── persistence ─────────────────────────

  it('patrol state survives suspend', () => {
    const eng = new BattleEngine(CHAPTER_7, null);
    // pick the first outrider archer — match by group + defId after restore
    const p = eng.units.find(u => u.group === 'outrider' && u.defId === 'e_archer')!;
    p.patrolAnchor = { x: 5, y: 8 };
    p.patrolDir = -1;
    const snap = eng.snapshot();
    const eng2 = new BattleEngine(CHAPTER_7, null, snap);
    const p2 = eng2.units.find(u => u.group === 'outrider' && u.defId === 'e_archer')!;
    expect(p2.patrolAnchor).toEqual({ x: 5, y: 8 });
    expect(p2.patrolDir).toBe(-1);
  });

  it('snapshot/resume keeps all three player positions', () => {
    const eng = new BattleEngine(CHAPTER_7, null);
    const [g, c, j] = eng.players();
    g.x = 6; g.y = 8;
    c.x = 5; c.y = 8;
    j.x = 4; j.y = 8;
    const snap = eng.snapshot();
    const eng2 = new BattleEngine(CHAPTER_7, null, snap);
    const ps2 = eng2.players();
    expect(ps2.find(u => u.defId === 'guts')!.x).toBe(6);
    expect(ps2.find(u => u.defId === 'casca')!.x).toBe(5);
    expect(ps2.find(u => u.defId === 'judeau')!.x).toBe(4);
  });
});
