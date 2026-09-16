import { describe, it, expect } from 'vitest';
import { BattleEngine } from './battle';
import { CHAPTER_6 } from '../data/chapter6';
import { CHAPTER_5 } from '../data/chapter5';

// ─── Chapter 6 — Band of the Hawk ──────────────────────────────────────────
//
// The Band's formal commissioning. Griffith takes command of the company
// from the king, and a supply-line march through Eberus Wood is ambushed.
// The chapter staging is: 3 players (Guts, Casca, Judeau) holding the wagon
// column on a south road while the wood rains arrows. 9 enemies split across
// 4 groups: forest archers in the canopy, a pincer from the east, two wagon
// escorts who defend the road itself, and the ambush captain behind the
// eastern trees.

describe('Chapter 6 — Band of the Hawk', () => {

  // ───────────────────────── structure ─────────────────────────

  it('has the right id, name and boss declaration', () => {
    expect(CHAPTER_6.id).toBe(6);
    expect(CHAPTER_6.name.toLowerCase()).toContain('band');
    expect(CHAPTER_6.name.toLowerCase()).toContain('hawk');
    expect(CHAPTER_6.bossDefId).toBe('c_pincers');
  });

  it('continues the chapter id-space', () => {
    expect(CHAPTER_6.id).toBe(CHAPTER_5.id + 1);
  });

  // ───────────────────────── map ─────────────────────────

  it('the map is a 14×10 wood with a road along the bottom', () => {
    expect(CHAPTER_6.map.length).toBe(10);
    for (const row of CHAPTER_6.map) expect(row.length).toBe(14);
    const allText = CHAPTER_6.map.join('');
    expect(/[T]/.test(allText)).toBe(true); // forest
    expect(/[R]/.test(allText)).toBe(true); // road
  });

  // ───────────────────────── unit placements ─────────────────────────

  it('deploys three players (Guts, Casca, Judeau) approaching from the south-west', () => {
    const players = CHAPTER_6.units.filter(u => u.faction === 'player');
    expect(players.length).toBe(3);
    expect(players.map(p => p.def).sort()).toEqual(['casca', 'guts', 'judeau']);
    // they enter near the south-west corner of the map
    for (const p of players) {
      expect(p.x).toBeLessThanOrEqual(5);
      expect(p.y).toBeGreaterThanOrEqual(7);
    }
  });

  it('deploys forest, pincer, wagon and boss enemy groups', () => {
    const forest = CHAPTER_6.units.filter(u => u.group === 'forest');
    const pincer = CHAPTER_6.units.filter(u => u.group === 'pincer');
    const wagon = CHAPTER_6.units.filter(u => u.group === 'wagon');
    expect(forest.length).toBe(4);
    expect(forest.every(u => u.def === 'e_archer')).toBe(true);
    expect(pincer.length).toBe(3); // 2 soldiers + the captain
    expect(wagon.length).toBe(2);
    expect(pincer.some(u => u.def === 'c_pincers')).toBe(true);
  });

  it('every unit is on a walkable, in-bounds tile', () => {
    const H = CHAPTER_6.map.length;
    const W = CHAPTER_6.map[0].length;
    for (const u of CHAPTER_6.units) {
      expect(u.x).toBeGreaterThanOrEqual(0); expect(u.x).toBeLessThan(W);
      expect(u.y).toBeGreaterThanOrEqual(0); expect(u.y).toBeLessThan(H);
      const t = CHAPTER_6.map[u.y][u.x];
      expect(/[MW~C]/.test(t)).toBe(false);
    }
  });

  // ───────────────────────── engine boot ─────────────────────────

  it('the engine boots Chapter 6 with three players and nine enemies', () => {
    const eng = new BattleEngine(CHAPTER_6, null);
    expect(eng.turn).toBe(1);
    expect(eng.phase).toBe('player');
    expect(eng.players().length).toBe(3);
    expect(eng.enemies().length).toBe(9);
    const captain = eng.units.find(u => u.defId === 'c_pincers')!;
    expect(captain).toBeTruthy();
    expect(captain.boss).toBe(true);
  });

  // ───────────────────────── AI behaviour ─────────────────────────

  it('every enemy starts dormant', () => {
    const eng = new BattleEngine(CHAPTER_6, null);
    expect(eng.enemies().every(u => !u.active)).toBe(true);
  });

  it('walking into the wood wakes the forest archers', () => {
    const eng = new BattleEngine(CHAPTER_6, null);
    const forest = eng.units.filter(u => u.group === 'forest');
    const gut = eng.players().find(u => u.defId === 'guts')!;
    // walk up next to the nearest archer at (2,1) — manhattan = 1
    gut.x = 2; gut.y = 2;
    (eng as unknown as { evaluateTriggers: () => void }).evaluateTriggers();
    expect(forest.some(u => u.active)).toBe(true);
  });

  it('approaching the column from the east wakes the pincer', () => {
    const eng = new BattleEngine(CHAPTER_6, null);
    const pincer = eng.units.filter(u => u.group === 'pincer');
    const gut = eng.players().find(u => u.defId === 'guts')!;
    // walk to the eastern end of the south road
    gut.x = 11; gut.y = 8;
    (eng as unknown as { evaluateTriggers: () => void }).evaluateTriggers();
    expect(pincer.some(u => u.active)).toBe(true);
  });

  it('the wagon escorts only wake if a player walks near them', () => {
    const eng = new BattleEngine(CHAPTER_6, null);
    const wagon = eng.units.filter(u => u.group === 'wagon');
    const gut = eng.players().find(u => u.defId === 'guts')!;
    // the players spawn at x=1..3 — well outside the wagon escort aggro=2
    (eng as unknown as { evaluateTriggers: () => void }).evaluateTriggers();
    expect(wagon.every(u => !u.active)).toBe(true);
    // but stepping next to one wakes them
    gut.x = 5; gut.y = 8;
    (eng as unknown as { evaluateTriggers: () => void }).evaluateTriggers();
    expect(wagon.some(u => u.active)).toBe(true);
  });

  it('the boss carries no UNFLINCHING trait (he\'s a fast striker, not a knight)', () => {
    const eng = new BattleEngine(CHAPTER_6, null);
    const boss = eng.units.find(u => u.defId === 'c_pincers')!;
    expect(boss.traits?.includes('unflinching') ?? false).toBe(false);
  });

  // ───────────────────────── dialogue ─────────────────────────

  it('the intro sets up the ambush with Griffith\'s orders', () => {
    const speakers = new Set(CHAPTER_6.intro.lines.map(l => l.speaker));
    expect(speakers.has('Griffith')).toBe(true);
    expect(speakers.has('Casca')).toBe(true);
    expect(speakers.has('Judeau')).toBe(true);
    expect(CHAPTER_6.intro.lines.length).toBeGreaterThanOrEqual(5);
  });

  it('the outro contains Griffith\'s "for me, not for the grain" speech', () => {
    const allText = CHAPTER_6.outro.lines.map(l => l.text).join('\n');
    expect(allText.toLowerCase()).toContain('for me');
    expect(allText.toLowerCase()).toContain('casca');
    expect(allText.toLowerCase()).toContain('two wagons');
  });

  // ───────────────────────── save import ─────────────────────────

  it('a chapter-5 save with three members boots chapter 6 with their levels', () => {
    const seed = {
      unlockedChapters: 6,
      party: [
        { defId: 'guts',   level: 9, exp: 60,
          stats: { hp: 52, str: 18, skl: 15, spd: 17, lck: 5,
                   def: 14, res: 9, mov: 6, con: 13 }, items: [], hp: 52 },
        { defId: 'casca',  level: 8, exp: 42,
          stats: { hp: 38, str: 13, skl: 12, spd: 14, lck: 6,
                   def: 9,  res: 7, mov: 6, con: 10 }, items: [], hp: 38 },
        { defId: 'judeau', level: 6, exp: 22,
          stats: { hp: 30, str: 8,  skl: 12, spd: 13, lck: 6,
                   def: 7,  res: 7, mov: 6, con: 8 }, items: [], hp: 30 },
      ],
      fallen: [], totalTurns: 48,
    };
    const eng = new BattleEngine(CHAPTER_6, seed);
    const ps = eng.players();
    expect(ps.length).toBe(3);
    expect(ps.find(u => u.defId === 'guts')!.level).toBe(9);
    expect(ps.find(u => u.defId === 'casca')!.level).toBe(8);
    expect(ps.find(u => u.defId === 'judeau')!.level).toBe(6);
  });

  // ───────────────────────── persistence ─────────────────────────

  it('snapshot/resume keeps all three positions', () => {
    const eng = new BattleEngine(CHAPTER_6, null);
    const [g, c, j] = eng.players();
    g.x = 5; g.y = 7;
    c.x = 6; c.y = 7;
    j.x = 7; j.y = 7;
    const snap = eng.snapshot();
    const eng2 = new BattleEngine(CHAPTER_6, null, snap);
    const ps2 = eng2.players();
    expect(ps2.length).toBe(3);
    expect(ps2.find(u => u.defId === 'guts')!.y).toBe(7);
    expect(ps2.find(u => u.defId === 'judeau')!.x).toBe(7);
  });
});
