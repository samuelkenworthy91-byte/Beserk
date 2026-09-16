import { describe, it, expect } from 'vitest';
import { BattleEngine } from './battle';
import { CHAPTER_9 } from '../data/chapter9';
import { CHAPTER_8 } from '../data/chapter8';

// ─── Chapter 9 — Bonfire of Dreams ─────────────────────────────────────────
//
// The Eclipse. Demons pour through the cracks at Windham. Guts is away
// from camp; the four Band members there (Casca, Judeau, Pippin, Corkus)
// hold a last stand against lesser Apostles from every direction and the
// Vortex Apostle in the centre.
//
// This chapter is unique: every enemy starts active (no aggro gating —
// the eclipse is already happening). Players spawn south-east of camp.
// There is no retreat.

describe('Chapter 9 — Bonfire of Dreams', () => {

  // ───────────────────────── structure ─────────────────────────

  it('has the right id, name and boss declaration', () => {
    expect(CHAPTER_9.id).toBe(9);
    expect(CHAPTER_9.name.toLowerCase()).toContain('bonfire');
    expect(CHAPTER_9.bossDefId).toBe('a_vortex');
  });

  it('continues the chapter id-space', () => {
    expect(CHAPTER_9.id).toBe(CHAPTER_8.id + 1);
  });

  // ───────────────────────── map ─────────────────────────

  it('the map is a 14×10 river-plain camp with no walls or water', () => {
    expect(CHAPTER_9.map.length).toBe(10);
    for (const row of CHAPTER_9.map) expect(row.length).toBe(14);
    const allText = CHAPTER_9.map.join('');
    // a plain camp — no defensive structures
    expect(/[MW~C]/.test(allText)).toBe(false);
    // the Band's tent is marked with house tiles
    expect(/[H]/.test(allText)).toBe(true);
  });

  // ───────────────────────── unit placements ─────────────────────────

  it('deploys four players (Casca, Judeau, Pippin, Corkus) — NOT Guts', () => {
    const players = CHAPTER_9.units.filter(u => u.faction === 'player');
    expect(players.length).toBe(4);
    expect(players.map(p => p.def).sort()).toEqual(
      ['casca', 'corkus', 'judeau', 'pippin']);
    expect(players.some(p => p.def === 'guts')).toBe(false);
  });

  it('deploys apostles from four directions and the vortex in the centre', () => {
    const north = CHAPTER_9.units.filter(u => u.group === 'north');
    const east = CHAPTER_9.units.filter(u => u.group === 'east');
    const west = CHAPTER_9.units.filter(u => u.group === 'west');
    const south = CHAPTER_9.units.filter(u => u.group === 'south');
    const vortex = CHAPTER_9.units.filter(u => u.group === 'vortex');
    expect(north.length).toBe(3);
    expect(east.length).toBe(3);
    expect(west.length).toBe(3);
    expect(south.length).toBe(3);
    expect(vortex.length).toBe(1);
    expect(vortex[0].def).toBe('a_vortex');
  });

  it('every unit is on a walkable, in-bounds tile', () => {
    const H = CHAPTER_9.map.length;
    const W = CHAPTER_9.map[0].length;
    for (const u of CHAPTER_9.units) {
      expect(u.x).toBeGreaterThanOrEqual(0); expect(u.x).toBeLessThan(W);
      expect(u.y).toBeGreaterThanOrEqual(0); expect(u.y).toBeLessThan(H);
      const t = CHAPTER_9.map[u.y][u.x];
      // camp has no walls/water
      expect(/[MW~C]/.test(t)).toBe(false);
    }
  });

  // ───────────────────────── engine boot ─────────────────────────

  it('the engine boots Chapter 9 with four players and thirteen enemies', () => {
    const eng = new BattleEngine(CHAPTER_9, null);
    expect(eng.turn).toBe(1);
    expect(eng.phase).toBe('player');
    expect(eng.players().length).toBe(4);
    expect(eng.enemies().length).toBe(13);
    const vortex = eng.units.find(u => u.defId === 'a_vortex')!;
    expect(vortex).toBeTruthy();
    expect(vortex.boss).toBe(true);
  });

  // ───────────────────────── Eclipse-specific AI behaviour ─────────────────────────

  it('every enemy starts ACTIVE — the eclipse has already begun', () => {
    // unlike earlier chapters, no dormancy. All apostles are mobile from
    // turn 1: the trigger system is bypassed because the eclipse came
    // without warning and there is no time to be covert.
    const eng = new BattleEngine(CHAPTER_9, null);
    expect(eng.enemies().every(u => u.active)).toBe(true);
  });

  it('the vortex apostle is the only boss and starts active too', () => {
    const eng = new BattleEngine(CHAPTER_9, null);
    const vortex = eng.units.find(u => u.defId === 'a_vortex')!;
    expect(vortex.active).toBe(true);
    expect(vortex.ai).toBe('boss');
  });

  it('the vortex has no UNFLINCHING trait (apostles have no body to flinch)', () => {
    const eng = new BattleEngine(CHAPTER_9, null);
    const vortex = eng.units.find(u => u.defId === 'a_vortex')!;
    expect(vortex.traits?.includes('unflinching') ?? false).toBe(false);
  });

  // ───────────────────────── dialogue ─────────────────────────

  it('the intro sets up the eclipse with the horses screaming', () => {
    const allText = CHAPTER_9.intro.lines.map(l => l.text).join('\n');
    expect(allText.toLowerCase()).toContain('eclipse');
    expect(allText.toLowerCase()).toContain('horses');
    const speakers = new Set(CHAPTER_9.intro.lines.map(l => l.speaker));
    expect(speakers.has('Casca')).toBe(true);
    expect(speakers.has('Judeau')).toBe(true);
    expect(CHAPTER_9.intro.lines.length).toBeGreaterThanOrEqual(5);
  });

  it('the outro references Griffith, Casca, and the dawn that comes', () => {
    const allText = CHAPTER_9.outro.lines.map(l => l.text).join('\n');
    expect(allText.toLowerCase()).toContain('griffith');
    expect(allText.toLowerCase()).toContain('casca');
    expect(allText.toLowerCase()).toContain('guts');
    expect(allText.toLowerCase()).toContain('dawn');
  });

  // ───────────────────────── save import ─────────────────────────

  it('a chapter-8 save with all five members boots chapter 9 (no Guts in the roster)', () => {
    // Guts is off-map for chapter 9; even if his data is in the save,
    // chapter 9\'s units[] says who plays, and the engine uses those.
    const seed = {
      unlockedChapters: 9,
      party: [
        { defId: 'guts',   level: 14, exp: 100,
          stats: { hp: 64, str: 24, skl: 20, spd: 22, lck: 5,
                   def: 17, res: 12, mov: 6, con: 14 }, items: [], hp: 64 },
        { defId: 'casca',  level: 12, exp: 80,
          stats: { hp: 46, str: 17, skl: 16, spd: 18, lck: 6,
                   def: 12, res: 10, mov: 6, con: 11 }, items: [], hp: 46 },
        { defId: 'judeau', level: 10, exp: 50,
          stats: { hp: 38, str: 11, skl: 15, spd: 16, lck: 7,
                   def: 10, res: 8, mov: 6, con: 9 },  items: [], hp: 38 },
        { defId: 'corkus', level: 11, exp: 60,
          stats: { hp: 40, str: 15, skl: 13, spd: 14, lck: 4,
                   def: 11, res: 7, mov: 6, con: 11 }, items: [], hp: 40 },
        { defId: 'pippin', level: 12, exp: 60,
          stats: { hp: 52, str: 16, skl: 11, spd: 12, lck: 3,
                   def: 17, res: 6, mov: 5, con: 14 }, items: [], hp: 52 },
      ],
      fallen: [], totalTurns: 110,
    };
    const eng = new BattleEngine(CHAPTER_9, seed);
    const ps = eng.players();
    // chapter 9 has only 4 players; the engine spawns chapter units from
    // its own list, not from save data — so even if Guts is in the save
    // he's not on this map.
    expect(ps.length).toBe(4);
    expect(ps.some(u => u.defId === 'guts')).toBe(false);
  });

  // ───────────────────────── persistence ─────────────────────────

  it('snapshot/resume keeps the four player positions and active enemy states', () => {
    const eng = new BattleEngine(CHAPTER_9, null);
    const ps = eng.players();
    // players come out of the engine in the order: casca, judeau, pippin, corkus
    // (matches the units[] declaration order in chapter9.ts). They file in
    // to x=4..7 from left to right.
    ps[0].x = 4; ps[0].y = 4;  // casca
    ps[1].x = 5; ps[1].y = 4;  // judeau
    ps[2].x = 6; ps[2].y = 4;  // pippin
    ps[3].x = 7; ps[3].y = 4;  // corkus
    const snap = eng.snapshot();
    const eng2 = new BattleEngine(CHAPTER_9, null, snap);
    const ps2 = eng2.players();
    expect(ps2.length).toBe(4);
    expect(ps2.find(u => u.defId === 'casca')!.x).toBe(4);
    expect(ps2.find(u => u.defId === 'judeau')!.x).toBe(5);
    expect(ps2.find(u => u.defId === 'pippin')!.x).toBe(6);
    expect(ps2.find(u => u.defId === 'corkus')!.x).toBe(7);
    // all enemies still active after resume (the eclipse doesn't pause)
    expect(eng2.enemies().every(u => u.active)).toBe(true);
  });
});
