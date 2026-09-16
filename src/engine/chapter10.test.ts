import { describe, it, expect } from 'vitest';
import { BattleEngine } from './battle';
import { CHAPTER_10 } from '../data/chapter10';
import { CHAPTER_9 } from '../data/chapter9';

// ─── Chapter 10 — Departure ────────────────────────────────────────────────
//
// Guts walking the eastern road alone, two days out of the eclipse. The
// demons from the Eclipse have followed. The chapter stages dusk on the
// road — seven lesser apostles from three angles plus a swarm apostle
// that has been tracking him longest. Single-player.
// Carry over from chapter 9: the eclipse is unfinished business.

describe('Chapter 10 — Departure', () => {

  // ───────────────────────── structure ─────────────────────────

  it('has the right id, name and boss declaration', () => {
    expect(CHAPTER_10.id).toBe(10);
    expect(CHAPTER_10.name.toLowerCase()).toContain('departure');
    expect(CHAPTER_10.bossDefId).toBe('a_swarm');
  });

  it('continues the chapter id-space', () => {
    expect(CHAPTER_10.id).toBe(CHAPTER_9.id + 1);
  });

  // ───────────────────────── map ─────────────────────────

  it('the map is a 14×10 road with forests on the sides', () => {
    expect(CHAPTER_10.map.length).toBe(10);
    for (const row of CHAPTER_10.map) expect(row.length).toBe(14);
    const allText = CHAPTER_10.map.join('');
    expect(/[T]/.test(allText)).toBe(true);
    expect(/[R]/.test(allText)).toBe(true);
    // no defensive structures on the road — just trees and plains
    expect(/[MW~CF]/.test(allText)).toBe(false);
  });

  // ───────────────────────── unit placements ─────────────────────────

  it('deploys Guts ALONE — the chapter is a single-player survival scenario', () => {
    const players = CHAPTER_10.units.filter(u => u.faction === 'player');
    expect(players.length).toBe(1);
    expect(players[0].def).toBe('guts');
  });

  it('deploys road, flank, and swarm enemy groups', () => {
    const road = CHAPTER_10.units.filter(u => u.group === 'road');
    const flank = CHAPTER_10.units.filter(u => u.group === 'flank');
    const swarm = CHAPTER_10.units.filter(u => u.group === 'swarm');
    expect(road.length).toBe(3);
    expect(flank.length).toBe(3);
    expect(swarm.length).toBe(1);
    expect(swarm[0].def).toBe('a_swarm');
  });

  it('every unit is on a walkable, in-bounds tile', () => {
    const H = CHAPTER_10.map.length;
    const W = CHAPTER_10.map[0].length;
    for (const u of CHAPTER_10.units) {
      expect(u.x).toBeGreaterThanOrEqual(0); expect(u.x).toBeLessThan(W);
      expect(u.y).toBeGreaterThanOrEqual(0); expect(u.y).toBeLessThan(H);
      const t = CHAPTER_10.map[u.y][u.x];
      expect(/[MW~C]/.test(t)).toBe(false);
    }
  });

  // ───────────────────────── engine boot ─────────────────────────

  it('the engine boots Chapter 10 with one player and seven enemies', () => {
    const eng = new BattleEngine(CHAPTER_10, null);
    expect(eng.turn).toBe(1);
    expect(eng.phase).toBe('player');
    expect(eng.players().length).toBe(1);
    expect(eng.enemies().length).toBe(7);
    const swarm = eng.units.find(u => u.defId === 'a_swarm')!;
    expect(swarm).toBeTruthy();
    expect(swarm.boss).toBe(true);
  });

  // ───────────────────────── Eclipse-related behaviour ─────────────────────────

  it('every enemy starts ACTIVE — they have been chasing Guts for two days', () => {
    const eng = new BattleEngine(CHAPTER_10, null);
    expect(eng.enemies().every(u => u.active)).toBe(true);
  });

  it('the swarm is the only boss and is active too', () => {
    const eng = new BattleEngine(CHAPTER_10, null);
    const swarm = eng.units.find(u => u.defId === 'a_swarm')!;
    expect(swarm.active).toBe(true);
    expect(swarm.ai).toBe('boss');
  });

  // ───────────────────────── dialogue ─────────────────────────

  it('the intro sets the road-walking alone mood', () => {
    const allText = CHAPTER_10.intro.lines.map(l => l.text).join('\n');
    expect(allText.toLowerCase()).toContain('eastern road');
    expect(allText.toLowerCase()).toContain('shapes');
    // no portraits — the chapter is third-person narration
    expect(CHAPTER_10.intro.lines.every(l => !l.portrait || l.portrait === '')).toBe(true);
  });

  it('the outro ends the chapter on the river', () => {
    const allText = CHAPTER_10.outro.lines.map(l => l.text).join('\n');
    expect(allText.toLowerCase()).toContain('river');
    expect(allText.toLowerCase()).toContain('walked on');
  });

  // ───────────────────────── save import ─────────────────────────

  it('a chapter-9 save with Guts alone persists his level into chapter 10', () => {
    const seed = {
      unlockedChapters: 10,
      party: [{
        defId: 'guts', level: 16, exp: 120,
        stats: { hp: 70, str: 26, skl: 22, spd: 24, lck: 5,
                 def: 18, res: 13, mov: 6, con: 15 }, items: [], hp: 70,
      }],
      fallen: ['casca', 'judeau', 'pippin', 'corkus'],
      totalTurns: 130,
    };
    const eng = new BattleEngine(CHAPTER_10, seed);
    const gut = eng.players().find(u => u.defId === 'guts')!;
    expect(gut.level).toBe(16);
    // the four Band members were lost in the eclipse; they shouldn't be in
    // the active player roster (they will appear in the fallen list)
    expect(eng.players().length).toBe(1);
  });

  // ───────────────────────── persistence ─────────────────────────

  it('snapshot/resume keeps Guts position and enemy active states', () => {
    const eng = new BattleEngine(CHAPTER_10, null);
    const gut = eng.players()[0];
    gut.x = 2; gut.y = 7;
    const snap = eng.snapshot();
    const eng2 = new BattleEngine(CHAPTER_10, null, snap);
    expect(eng2.players()[0].x).toBe(2);
    expect(eng2.players()[0].y).toBe(7);
    // all enemies still active after resume — they don't sleep
    expect(eng2.enemies().every(u => u.active)).toBe(true);
  });
});
