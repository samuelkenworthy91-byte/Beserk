import { describe, it, expect } from 'vitest';
import { BattleEngine } from './battle';
import { CHAPTER_8 } from '../data/chapter8';
import { CHAPTER_7 } from '../data/chapter7';

// ─── Chapter 8 — Doldrey ───────────────────────────────────────────────────
//
// The Battle of Doldrey — the Hundred-Year War's turning point. The Band
// of the Hawk's dawn assault takes the south gate, the bailey, and the
// keep where Boscogn the Marshal holds the tower. Five players (Guts,
// Casca, Judeau, Corkus, Pippin) walk in first; the rest of the Band
// streams through behind them once the gate falls.
//
// The campaign-tested rhythm: gate guards wake on courtyard contact,
// bailey rebels wake on direct intrusion, keep veterans sleep until the
// bailey has fallen or a player crosses the keep wall. Boscogn's
// UNFLINCHING trait means he can't be doubled — the player has to break
// him with sustained damage.

describe('Chapter 8 — Doldrey', () => {

  // ───────────────────────── structure ─────────────────────────

  it('has the right id, name and boss declaration', () => {
    expect(CHAPTER_8.id).toBe(8);
    expect(CHAPTER_8.name.toLowerCase()).toContain('doldrey');
    expect(CHAPTER_8.bossDefId).toBe('c_marshal');
  });

  it('continues the chapter id-space', () => {
    expect(CHAPTER_8.id).toBe(CHAPTER_7.id + 1);
  });

  // ───────────────────────── map ─────────────────────────

  it('the map is a 14×10 fortress with a gate, walls, a fort, and a road', () => {
    expect(CHAPTER_8.map.length).toBe(10);
    for (const row of CHAPTER_8.map) expect(row.length).toBe(14);
    const allText = CHAPTER_8.map.join('');
    expect(/[G]/.test(allText)).toBe(true); // gate
    expect(/[C]/.test(allText)).toBe(true); // walls
    expect(/[F]/.test(allText)).toBe(true); // fort tower
    expect(/[R]/.test(allText)).toBe(true); // road
  });

  // ───────────────────────── unit placements ─────────────────────────

  it('deploys five players (Guts, Casca, Judeau, Corkus, Pippin) entering south', () => {
    const players = CHAPTER_8.units.filter(u => u.faction === 'player');
    expect(players.length).toBe(5);
    expect(players.map(p => p.def).sort()).toEqual(
      ['casca', 'corkus', 'guts', 'judeau', 'pippin']);
    for (const p of players) {
      // all five enter from the south
      expect(p.y).toBe(9);
      expect(p.x).toBeLessThanOrEqual(7);
    }
  });

  it('deploys gate, bailey, keep and boss enemy groups', () => {
    const gate = CHAPTER_8.units.filter(u => u.group === 'gate');
    const bailey = CHAPTER_8.units.filter(u => u.group === 'bailey');
    const keep = CHAPTER_8.units.filter(u => u.group === 'keep');
    expect(gate.length).toBe(2);
    expect(bailey.length).toBe(4);
    expect(keep.length).toBe(5); // 4 keep veterans + the marshal
    expect(keep.some(u => u.def === 'c_marshal')).toBe(true);
  });

  it('every unit is on a walkable, in-bounds tile', () => {
    const H = CHAPTER_8.map.length;
    const W = CHAPTER_8.map[0].length;
    for (const u of CHAPTER_8.units) {
      expect(u.x).toBeGreaterThanOrEqual(0); expect(u.x).toBeLessThan(W);
      expect(u.y).toBeGreaterThanOrEqual(0); expect(u.y).toBeLessThan(H);
      const t = CHAPTER_8.map[u.y][u.x];
      // impassable: water (W, ~), walls (C), mountains (M)
      expect(/[MW~C]/.test(t)).toBe(false);
    }
  });

  it('Boscogn stands on a fort tile inside the keep tower', () => {
    const marshal = CHAPTER_8.units.find(u => u.def === 'c_marshal')!;
    expect(marshal.y).toBeLessThanOrEqual(1);
    const t = CHAPTER_8.map[marshal.y][marshal.x];
    // fort tiles are walkable
    expect(/[F.]/.test(t)).toBe(true);
  });

  // ───────────────────────── engine boot ─────────────────────────

  it('the engine boots Chapter 8 with five players and eleven enemies', () => {
    const eng = new BattleEngine(CHAPTER_8, null);
    expect(eng.turn).toBe(1);
    expect(eng.phase).toBe('player');
    expect(eng.players().length).toBe(5);
    expect(eng.enemies().length).toBe(11);
    const marshal = eng.units.find(u => u.defId === 'c_marshal')!;
    expect(marshal).toBeTruthy();
    expect(marshal.boss).toBe(true);
  });

  // ───────────────────────── AI behaviour ─────────────────────────

  it('every enemy starts dormant', () => {
    const eng = new BattleEngine(CHAPTER_8, null);
    expect(eng.enemies().every(u => !u.active)).toBe(true);
  });

  it('pushing into the courtyard wakes the gate and the bailey', () => {
    const eng = new BattleEngine(CHAPTER_8, null);
    const gate = eng.units.filter(u => u.group === 'gate');
    const bailey = eng.units.filter(u => u.group === 'bailey');
    const gut = eng.players().find(u => u.defId === 'guts')!;
    // walk through the south gate (the gate is at row 6 cols 2-4)
    gut.x = 4; gut.y = 6;
    (eng as unknown as { evaluateTriggers: () => void }).evaluateTriggers();
    expect(gate.some(u => u.active)).toBe(true);
    expect(bailey.some(u => u.active)).toBe(true);
  });

  it('the keep (without the marshal) stays dormant until the bailey has fallen', () => {
    const eng = new BattleEngine(CHAPTER_8, null);
    const keep = eng.units.filter(u => u.group === 'keep' && u.defId !== 'c_marshal');
    const gut = eng.players().find(u => u.defId === 'guts')!;
    // park Guts at the south edge (y=8) — well outside aggro=4 of the keep row 1
    gut.x = 5; gut.y = 8;
    (eng as unknown as { evaluateTriggers: () => void }).evaluateTriggers();
    expect(keep.every(u => !u.active)).toBe(true);
    // walking close to the keep wall wakes them
    gut.x = 5; gut.y = 2;
    (eng as unknown as { evaluateTriggers: () => void }).evaluateTriggers();
    expect(keep.some(u => u.active)).toBe(true);
  });

  it('Boscogn carries the UNFLINCHING trait (no one doubles him)', () => {
    const eng = new BattleEngine(CHAPTER_8, null);
    const marshal = eng.units.find(u => u.defId === 'c_marshal')!;
    expect(marshal.traits).toContain('unflinching');
  });

  // ───────────────────────── dialogue ─────────────────────────

  it('the intro sets up the dawn assault with Griffith\'s "you five are the gate"', () => {
    const speakers = new Set(CHAPTER_8.intro.lines.map(l => l.speaker));
    expect(speakers.has('Griffith')).toBe(true);
    expect(speakers.has('Corkus')).toBe(true);
    expect(speakers.has('Pippin')).toBe(true);
    expect(speakers.has('Casca')).toBe(true);
    expect(speakers.has('Guts')).toBe(true);
    expect(CHAPTER_8.intro.lines.length).toBeGreaterThanOrEqual(6);
  });

  it('the outro contains Griffith\'s "I mean everything"', () => {
    const allText = CHAPTER_8.outro.lines.map(l => l.text).join('\n');
    expect(allText.toLowerCase()).toContain('i mean everything');
    expect(allText.toLowerCase()).toContain('bosco');
    expect(allText.toLowerCase()).toContain('corkus');
  });

  // ───────────────────────── save import ─────────────────────────

  it('a chapter-7 save with all five members boots chapter 8 with their levels', () => {
    const seed = {
      unlockedChapters: 8,
      party: [
        { defId: 'guts',   level: 12, exp: 80,
          stats: { hp: 60, str: 22, skl: 18, spd: 20, lck: 5,
                   def: 16, res: 11, mov: 6, con: 14 }, items: [], hp: 60 },
        { defId: 'casca',  level: 11, exp: 60,
          stats: { hp: 44, str: 16, skl: 15, spd: 17, lck: 6,
                   def: 11, res: 9, mov: 6, con: 11 }, items: [], hp: 44 },
        { defId: 'judeau', level: 9,  exp: 40,
          stats: { hp: 36, str: 10, skl: 14, spd: 15, lck: 7,
                   def: 9,  res: 8, mov: 6, con: 9 },  items: [], hp: 36 },
        { defId: 'corkus', level: 10, exp: 50,
          stats: { hp: 38, str: 14, skl: 12, spd: 13, lck: 4,
                   def: 10, res: 7, mov: 6, con: 11 }, items: [], hp: 38 },
        { defId: 'pippin', level: 11, exp: 45,
          stats: { hp: 50, str: 15, skl: 10, spd: 11, lck: 3,
                   def: 16, res: 6, mov: 5, con: 14 }, items: [], hp: 50 },
      ],
      fallen: [], totalTurns: 90,
    };
    const eng = new BattleEngine(CHAPTER_8, seed);
    const ps = eng.players();
    expect(ps.length).toBe(5);
    expect(ps.find(u => u.defId === 'guts')!.level).toBe(12);
    expect(ps.find(u => u.defId === 'casca')!.level).toBe(11);
    expect(ps.find(u => u.defId === 'judeau')!.level).toBe(9);
    expect(ps.find(u => u.defId === 'corkus')!.level).toBe(10);
    expect(ps.find(u => u.defId === 'pippin')!.level).toBe(11);
  });

  // ───────────────────────── persistence ─────────────────────────

  it('snapshot/resume keeps all five player positions', () => {
    const eng = new BattleEngine(CHAPTER_8, null);
    const ps = eng.players();
    ps[0].x = 4; ps[0].y = 7;
    ps[1].x = 5; ps[1].y = 7;
    ps[2].x = 6; ps[2].y = 7;
    ps[3].x = 7; ps[3].y = 7;
    ps[4].x = 8; ps[4].y = 7;
    const snap = eng.snapshot();
    const eng2 = new BattleEngine(CHAPTER_8, null, snap);
    const ps2 = eng2.players();
    expect(ps2.length).toBe(5);
    expect(ps2.find(u => u.defId === 'guts')!.y).toBe(7);
    expect(ps2.find(u => u.defId === 'pippin')!.x).toBe(8);
  });
});
