import { describe, it, expect } from 'vitest';
import { BattleEngine } from './battle';
import { CHAPTER_14 } from '../data/chapter14';
import { CHAPTER_13 } from '../data/chapter13';

// ─── Chapter 14 — The Second Eclipse ────────────────────────────────────────
//
// The closing chapter of the 14-chapter arc. The Falcon of Darkness flies
// over Falconia; Guts and the full Hawk roster (six players) climb onto
// Ganishka's spine to face Griffith-as-Femto at full God-Hand power.
// Active-everyone final stand — no aggro gating; everyone moves on turn 1.

describe('Chapter 14 — The Second Eclipse', () => {

  // ───────────────────────── structure ─────────────────────────

  it('has the right id, name and boss declaration', () => {
    expect(CHAPTER_14.id).toBe(14);
    expect(CHAPTER_14.name.toLowerCase()).toContain('second eclipse');
    expect(CHAPTER_14.bossDefId).toBe('femto');
  });

  it('closes the chapter id-space', () => {
    expect(CHAPTER_14.id).toBe(CHAPTER_13.id + 1);
    expect(CHAPTER_14.id).toBe(14);
  });

  // ───────────────────────── map ─────────────────────────

  it('the map is a 14×10 storm-scape with mountain walls', () => {
    expect(CHAPTER_14.map.length).toBe(10);
    for (const row of CHAPTER_14.map) expect(row.length).toBe(14);
    const allText = CHAPTER_14.map.join('');
    expect(/[M]/.test(allText)).toBe(true); // mountain walls
    expect(/[F]/.test(allText)).toBe(true); // fort tiles in the clearing
  });

  // ───────────────────────── unit placements ─────────────────────────

  it('deploys SIX players — the full Hawk roster reunites', () => {
    const players = CHAPTER_14.units.filter(u => u.faction === 'player');
    expect(players.length).toBe(6);
    expect(players.map(p => p.def).sort()).toEqual(
      ['casca', 'corkus', 'guts', 'judeau', 'pippin', 'rickert']);
  });

  it('deploys mass, swirl, and hawk enemy groups', () => {
    const mass = CHAPTER_14.units.filter(u => u.group === 'mass');
    const swirl = CHAPTER_14.units.filter(u => u.group === 'swirl');
    const hawk = CHAPTER_14.units.filter(u => u.group === 'hawk');
    expect(mass.length).toBe(5);
    expect(swirl.length).toBe(4);
    expect(hawk.length).toBe(1);
    expect(hawk[0].def).toBe('femto');
  });

  it('every unit is on a walkable, in-bounds tile', () => {
    const H = CHAPTER_14.map.length;
    const W = CHAPTER_14.map[0].length;
    for (const u of CHAPTER_14.units) {
      expect(u.x).toBeGreaterThanOrEqual(0); expect(u.x).toBeLessThan(W);
      expect(u.y).toBeGreaterThanOrEqual(0); expect(u.y).toBeLessThan(H);
      const t = CHAPTER_14.map[u.y][u.x];
      expect(/[M]/.test(t)).toBe(false);
    }
  });

  // ───────────────────────── engine boot ─────────────────────────

  it('the engine boots Chapter 14 with six players and ten enemies', () => {
    const eng = new BattleEngine(CHAPTER_14, null);
    expect(eng.turn).toBe(1);
    expect(eng.phase).toBe('player');
    expect(eng.players().length).toBe(6);
    expect(eng.enemies().length).toBe(10);
    const femto = eng.units.find(u => u.defId === 'femto')!;
    expect(femto).toBeTruthy();
    expect(femto.boss).toBe(true);
  });

  // ───────────────────────── Final stand AI behaviour ─────────────────────────

  it('every enemy is ACTIVE on turn 1 — no dormancy in the final chapter', () => {
    const eng = new BattleEngine(CHAPTER_14, null);
    expect(eng.enemies().every(u => u.active)).toBe(true);
  });

  it('Femto is the only boss and is active', () => {
    const eng = new BattleEngine(CHAPTER_14, null);
    const femto = eng.units.find(u => u.defId === 'femto')!;
    expect(femto.active).toBe(true);
    expect(femto.ai).toBe('boss');
  });

  // ───────────────────────── dialogue ─────────────────────────

  it('the intro sets up the Falcon flying over Falconia', () => {
    const allText = CHAPTER_14.intro.lines.map(l => l.text).join('\n');
    expect(allText.toLowerCase()).toContain('falcon');
    expect(allText.toLowerCase()).toContain('griffith');
    expect(allText.toLowerCase()).toContain('ganishka');
  });

  it('the outro ends the campaign with Guts\'s "the debt is paid"', () => {
    const allText = CHAPTER_14.outro.lines.map(l => l.text).join('\n');
    expect(allText.toLowerCase()).toContain('debt is paid');
    expect(allText.toLowerCase()).toContain('band');
    expect(allText.toLowerCase()).toContain('griffith');
  });

  // ───────────────────────── save import ─────────────────────────

  it('a chapter-13 save with all six Hawks boots chapter 14 with their levels', () => {
    const seed = {
      unlockedChapters: 14,
      party: [
        { defId: 'guts',   level: 22, exp: 240,
          stats: { hp: 84, str: 31, skl: 27, spd: 29, lck: 6,
                   def: 22, res: 17, mov: 6, con: 16 }, items: [], hp: 84 },
        { defId: 'casca',  level: 18, exp: 180,
          stats: { hp: 52, str: 17, skl: 16, spd: 18, lck: 7,
                   def: 12, res: 11, mov: 6, con: 11 }, items: [], hp: 52 },
        { defId: 'judeau', level: 16, exp: 130,
          stats: { hp: 44, str: 12, skl: 16, spd: 17, lck: 8,
                   def: 10, res: 9, mov: 6, con: 9 },  items: [], hp: 44 },
        { defId: 'corkus', level: 17, exp: 140,
          stats: { hp: 46, str: 16, skl: 14, spd: 15, lck: 5,
                   def: 12, res: 8, mov: 6, con: 11 },  items: [], hp: 46 },
        { defId: 'pippin', level: 18, exp: 160,
          stats: { hp: 58, str: 17, skl: 11, spd: 12, lck: 4,
                   def: 18, res: 7, mov: 5, con: 14 },   items: [], hp: 58 },
        { defId: 'rickert', level: 15, exp: 100,
          stats: { hp: 36, str: 10, skl: 14, spd: 16, lck: 9,
                   def: 8, res: 12, mov: 6, con: 8 },   items: [], hp: 36 },
      ],
      fallen: [],
      totalTurns: 320,
    };
    const eng = new BattleEngine(CHAPTER_14, seed);
    const ps = eng.players();
    expect(ps.length).toBe(6);
    expect(ps.find(u => u.defId === 'guts')!.level).toBe(22);
    expect(ps.find(u => u.defId === 'casca')!.level).toBe(18);
    expect(ps.find(u => u.defId === 'judeau')!.level).toBe(16);
    expect(ps.find(u => u.defId === 'corkus')!.level).toBe(17);
    expect(ps.find(u => u.defId === 'pippin')!.level).toBe(18);
    expect(ps.find(u => u.defId === 'rickert')!.level).toBe(15);
  });

  // ───────────────────────── persistence ─────────────────────────

  it('snapshot/resume keeps all six player positions', () => {
    const eng = new BattleEngine(CHAPTER_14, null);
    const ps = eng.players();
    for (let i = 0; i < ps.length; i++) {
      ps[i].x = 5 + i; ps[i].y = 7;
    }
    const snap = eng.snapshot();
    const eng2 = new BattleEngine(CHAPTER_14, null, snap);
    expect(eng2.players().length).toBe(6);
    // all enemies still active after resume
    expect(eng2.enemies().every(u => u.active)).toBe(true);
  });
});
