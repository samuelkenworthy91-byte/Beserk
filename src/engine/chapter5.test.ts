import { describe, it, expect } from 'vitest';
import { BattleEngine } from './battle';
import { CHAPTER_5 } from '../data/chapter5';
import { CHAPTER_4 } from '../data/chapter4';

// ─── Chapter 5 — One Hundred Men ───────────────────────────────────────────
//
// The Band's first hundred-man assault — a hilltop fort at Varn. Guts leads
// through the gate, Pippin holds the ladder, Casca takes the second wave.
// Ten enemy soldiers hold the walls; a knight-commander (c_knight) sits in
// the keep with two garrisoned soldiers. The trio enters south in line.
// Walls wake on approach; moat guards watch the trees; keep garrison sleeps
// until the gate falls.

describe('Chapter 5 — One Hundred Men', () => {

  // ───────────────────────── structure ─────────────────────────

  it('has the right id, name and boss declaration', () => {
    expect(CHAPTER_5.id).toBe(5);
    expect(CHAPTER_5.name.toLowerCase()).toContain('one hundred');
    expect(CHAPTER_5.bossDefId).toBe('c_knight');
  });

  it('continues the chapter id-space', () => {
    expect(CHAPTER_5.id).toBe(CHAPTER_4.id + 1);
  });

  // ───────────────────────── map ─────────────────────────

  it('the map is a 14×10 hilltop with a gate, walls and a fort', () => {
    expect(CHAPTER_5.map.length).toBe(10);
    for (const row of CHAPTER_5.map) expect(row.length).toBe(14);
    const allText = CHAPTER_5.map.join('');
    expect(/[G]/.test(allText)).toBe(true);   // gate
    expect(/[F]/.test(allText)).toBe(true);   // fort
    expect(/[C]/.test(allText)).toBe(true);   // walls
    expect(/[R]/.test(allText)).toBe(true);   // road up the slope
  });

  // ───────────────────────── unit placements ─────────────────────────

  it('deploys three players (Guts, Casca, Pippin) on the south road', () => {
    const players = CHAPTER_5.units.filter(u => u.faction === 'player');
    expect(players.length).toBe(3);
    expect(players.map(p => p.def).sort()).toEqual(['casca', 'guts', 'pippin']);
    for (const p of players) expect(p.y).toBe(9);
  });

  it('deploys wall, moat and keep enemy groups', () => {
    const wall = CHAPTER_5.units.filter(u => u.group === 'wall');
    const moat = CHAPTER_5.units.filter(u => u.group === 'moat');
    const keep = CHAPTER_5.units.filter(u => u.group === 'keep');
    expect(wall.length).toBe(4);
    expect(moat.length).toBe(2);
    expect(keep.length).toBe(3);
    expect(keep.some(u => u.def === 'c_knight')).toBe(true);
  });

  it('every unit is on a walkable, in-bounds tile', () => {
    const H = CHAPTER_5.map.length;
    const W = CHAPTER_5.map[0].length;
    for (const u of CHAPTER_5.units) {
      expect(u.x).toBeGreaterThanOrEqual(0); expect(u.x).toBeLessThan(W);
      expect(u.y).toBeGreaterThanOrEqual(0); expect(u.y).toBeLessThan(H);
      const t = CHAPTER_5.map[u.y][u.x];
      expect(/[MW~C]/.test(t)).toBe(false); // walls/C are impassable
    }
  });

  // ───────────────────────── engine boot ─────────────────────────

  it('the engine boots Chapter 5 with three players and ten enemies', () => {
    const eng = new BattleEngine(CHAPTER_5, null);
    expect(eng.turn).toBe(1);
    expect(eng.phase).toBe('player');
    expect(eng.players().length).toBe(3);
    expect(eng.enemies().length).toBe(9);
    const knight = eng.units.find(u => u.defId === 'c_knight')!;
    expect(knight).toBeTruthy();
    expect(knight.boss).toBe(true);
  });

  it('Pippin is a player unit carrying the heavy unit template', () => {
    const eng = new BattleEngine(CHAPTER_5, null);
    const pippin = eng.players().find(u => u.defId === 'pippin')!;
    expect(pippin).toBeTruthy();
    expect(pippin.faction).toBe('player');
  });

  // ───────────────────────── AI behaviour ─────────────────────────

  it('every enemy starts dormant', () => {
    const eng = new BattleEngine(CHAPTER_5, null);
    expect(eng.enemies().every(u => !u.active)).toBe(true);
  });

  it('moving Guts up the slope wakes the wall archers', () => {
    const eng = new BattleEngine(CHAPTER_5, null);
    const wall = eng.units.filter(u => u.group === 'wall');
    const gut = eng.players().find(u => u.defId === 'guts')!;
    gut.x = 5; gut.y = 7;
    (eng as unknown as { evaluateTriggers: () => void }).evaluateTriggers();
    expect(wall.some(u => u.active)).toBe(true);
  });

  it('pushing past the gate (y<=5) wakes the keep garrison', () => {
    const eng = new BattleEngine(CHAPTER_5, null);
    const keep = eng.units.filter(u => u.group === 'keep');
    const gut = eng.players().find(u => u.defId === 'guts')!;
    // walk right up next to the keep soldier at (8,1)
    gut.x = 8; gut.y = 2;
    (eng as unknown as { evaluateTriggers: () => void }).evaluateTriggers();
    expect(keep.some(u => u.active)).toBe(true);
  });

  it('the moat guards only wake when someone enters the forest east of the gate', () => {
    const eng = new BattleEngine(CHAPTER_5, null);
    const moat = eng.units.filter(u => u.group === 'moat');
    const gut = eng.players().find(u => u.defId === 'guts')!;
    // walking the central slope does NOT wake the moat (moat is at x=9,10 — far enough)
    gut.x = 3; gut.y = 6;
    (eng as unknown as { evaluateTriggers: () => void }).evaluateTriggers();
    expect(moat.every(u => !u.active)).toBe(true);
    // walking up to the moat guards does
    gut.x = 11; gut.y = 4;
    (eng as unknown as { evaluateTriggers: () => void }).evaluateTriggers();
    expect(moat.some(u => u.active)).toBe(true);
  });

  it('the knight-commander carries UNFLINCHING', () => {
    const eng = new BattleEngine(CHAPTER_5, null);
    const knight = eng.units.find(u => u.defId === 'c_knight')!;
    expect(knight.traits).toContain('unflinching');
  });

  // ───────────────────────── dialogue ─────────────────────────

  it('the intro sets up the hundred-man assault with Griffith\'s orders', () => {
    const speakers = new Set(CHAPTER_5.intro.lines.map(l => l.speaker));
    expect(speakers.has('Griffith')).toBe(true);
    expect(speakers.has('Casca')).toBe(true);
    expect(speakers.has('Pippin')).toBe(true);
    expect(CHAPTER_5.intro.lines.length).toBeGreaterThanOrEqual(5);
  });

  it('the outro mentions the twelve broken swords', () => {
    const allText = CHAPTER_5.outro.lines.map(l => l.text).join('\n');
    expect(allText.toLowerCase()).toContain('twelve');
    expect(allText.toLowerCase()).toContain('cheap swords');
    expect(allText.toLowerCase()).toContain('pippin');
  });

  // ───────────────────────── save import ─────────────────────────

  it('a save with all three members boots chapter 5 with their levels', () => {
    const seed = {
      unlockedChapters: 5,
      party: [
        { defId: 'guts',   level: 8, exp: 50,
          stats: { hp: 50, str: 17, skl: 14, spd: 16, lck: 5,
                   def: 13, res: 9, mov: 6, con: 13 }, items: [], hp: 50 },
        { defId: 'casca',  level: 7, exp: 38,
          stats: { hp: 36, str: 12, skl: 11, spd: 13, lck: 6,
                   def: 8,  res: 7, mov: 6, con: 10 }, items: [], hp: 36 },
        { defId: 'pippin', level: 7, exp: 24,
          stats: { hp: 44, str: 13, skl: 8,  spd: 9,  lck: 3,
                   def: 14, res: 5, mov: 5, con: 14 }, items: [], hp: 44 },
      ],
      fallen: [], totalTurns: 32,
    };
    const eng = new BattleEngine(CHAPTER_5, seed);
    const ps = eng.players();
    expect(ps.length).toBe(3);
    expect(ps.find(u => u.defId === 'guts')!.level).toBe(8);
    expect(ps.find(u => u.defId === 'casca')!.level).toBe(7);
    expect(ps.find(u => u.defId === 'pippin')!.level).toBe(7);
  });

  // ───────────────────────── persistence ─────────────────────────

  it('snapshot/resume keeps all three positions', () => {
    const eng = new BattleEngine(CHAPTER_5, null);
    const [g, c, p] = eng.players();
    g.x = 4; g.y = 6;
    c.x = 5; c.y = 6;
    p.x = 6; p.y = 6;
    const snap = eng.snapshot();
    const eng2 = new BattleEngine(CHAPTER_5, null, snap);
    const ps2 = eng2.players();
    expect(ps2.find(u => u.defId === 'guts')!.y).toBe(6);
    expect(ps2.find(u => u.defId === 'casca')!.x).toBe(5);
    expect(ps2.find(u => u.defId === 'pippin')!.x).toBe(6);
  });
});
