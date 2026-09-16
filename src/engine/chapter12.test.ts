import { describe, it, expect } from 'vitest';
import { BattleEngine } from './battle';
import { CHAPTER_12 } from '../data/chapter12';
import { CHAPTER_11 } from '../data/chapter11';

// ─── Chapter 12 — Return ───────────────────────────────────────────────────
//
// Fantasia: the world has changed. Casca has been living at Godot's ship
// with the new Band of the Hawk for two years; she does not remember
// Guts by name. She remembers him by sword. Guts walks onto the ship
// alone. She fights him. He does not move. She recognises him.
//
// Single-player (Guts), 6 enemies, 1 boss (Casca herself).

describe('Chapter 12 — Return', () => {

  // ───────────────────────── structure ─────────────────────────

  it('has the right id, name and boss declaration', () => {
    expect(CHAPTER_12.id).toBe(12);
    expect(CHAPTER_12.name.toLowerCase()).toContain('return');
    // Casca is the boss — even though she was a player in earlier
    // chapters, in this chapter she's an enemy fighting Guts.
    expect(CHAPTER_12.bossDefId).toBe('casca');
  });

  it('continues the chapter id-space', () => {
    expect(CHAPTER_12.id).toBe(CHAPTER_11.id + 1);
  });

  // ───────────────────────── map ─────────────────────────

  it('the map is a 14×10 ship deck with water on one side and walls forming a hold', () => {
    expect(CHAPTER_12.map.length).toBe(10);
    for (const row of CHAPTER_12.map) expect(row.length).toBe(14);
    const allText = CHAPTER_12.map.join('');
    expect(/[~W]/.test(allText)).toBe(true); // water (off-ship)
    expect(/[C]/.test(allText)).toBe(true); // walls (the hold)
    expect(/[R]/.test(allText)).toBe(true); // road (gangway)
  });

  // ───────────────────────── unit placements ─────────────────────────

  it('deploys Guts ALONE on the gangway', () => {
    const players = CHAPTER_12.units.filter(u => u.faction === 'player');
    expect(players.length).toBe(1);
    expect(players[0].def).toBe('guts');
  });

  it('deploys crew, sentry and the Casca boss group', () => {
    const crew = CHAPTER_12.units.filter(u => u.group === 'crew');
    const sentry = CHAPTER_12.units.filter(u => u.group === 'sentry');
    const casca = CHAPTER_12.units.filter(u => u.group === 'casca');
    expect(crew.length).toBe(3);
    expect(sentry.length).toBe(2);
    expect(casca.length).toBe(1);
    expect(casca[0].def).toBe('casca');
    expect(casca[0].faction).toBe('enemy');
    expect(casca[0].ai).toBe('boss');
  });

  it('every unit is on a walkable, in-bounds tile', () => {
    const H = CHAPTER_12.map.length;
    const W = CHAPTER_12.map[0].length;
    for (const u of CHAPTER_12.units) {
      expect(u.x).toBeGreaterThanOrEqual(0); expect(u.x).toBeLessThan(W);
      expect(u.y).toBeGreaterThanOrEqual(0); expect(u.y).toBeLessThan(H);
      const t = CHAPTER_12.map[u.y][u.x];
      // not on water
      expect(/[MW~]/.test(t)).toBe(false);
    }
  });

  // ───────────────────────── engine boot ─────────────────────────

  it('the engine boots Chapter 12 with one player and six enemies', () => {
    const eng = new BattleEngine(CHAPTER_12, null);
    expect(eng.turn).toBe(1);
    expect(eng.phase).toBe('player');
    expect(eng.players().length).toBe(1);
    expect(eng.enemies().length).toBe(6);
    const casca = eng.units.find(u => u.defId === 'casca')!;
    expect(casca).toBeTruthy();
    expect(casca.boss).toBe(true);
  });

  // ───────────────────────── AI behaviour ─────────────────────────

  it('the sentries are awake (the new Band keeps watch)', () => {
    const eng = new BattleEngine(CHAPTER_12, null);
    const sentry = eng.units.filter(u => u.group === 'sentry');
    expect(sentry.every(u => u.active)).toBe(true);
  });

  it('every enemy is awake by turn 1 — the new Band will fight anyone', () => {
    // a different framing: Casca has been "fighting everyone" for two
    // years; the engine's dormancy system is mostly bypassed. We
    // check that everyone is active.
    const eng = new BattleEngine(CHAPTER_12, null);
    expect(eng.enemies().every(u => u.active)).toBe(true);
  });

  // ───────────────────────── dialogue ─────────────────────────

  it('the intro sets up the ship at Vritannis and Casca drawing her sword', () => {
    const allText = CHAPTER_12.intro.lines.map(l => l.text).join('\n');
    expect(allText.toLowerCase()).toContain('casca');
    expect(allText.toLowerCase()).toContain('ship');
    expect(allText.toLowerCase()).toContain('gangway');
  });

  it('the outro contains Guts saying "I am here"', () => {
    const allText = CHAPTER_12.outro.lines.map(l => l.text).join('\n');
    expect(allText.toLowerCase()).toContain('i am here');
    expect(allText.toLowerCase()).toContain('stand still');
  });

  // ───────────────────────── save import ─────────────────────────

  it('a chapter-11 save persists Guts at high level into chapter 12', () => {
    const seed = {
      unlockedChapters: 12,
      party: [{
        defId: 'guts', level: 19, exp: 180,
        stats: { hp: 80, str: 29, skl: 25, spd: 27, lck: 5,
                 def: 20, res: 15, mov: 6, con: 15 }, items: [], hp: 80,
      }],
      fallen: ['casca', 'judeau', 'pippin', 'corkus'],
      totalTurns: 200,
    };
    const eng = new BattleEngine(CHAPTER_12, seed);
    const gut = eng.players()[0];
    expect(gut.level).toBe(19);
    expect(eng.players().length).toBe(1);
  });

  // ───────────────────────── persistence ─────────────────────────

  it('snapshot/resume keeps Guts position and active enemy states', () => {
    const eng = new BattleEngine(CHAPTER_12, null);
    const gut = eng.players()[0];
    gut.x = 5; gut.y = 7;
    const snap = eng.snapshot();
    const eng2 = new BattleEngine(CHAPTER_12, null, snap);
    expect(eng2.players()[0].x).toBe(5);
    expect(eng2.players()[0].y).toBe(7);
    // all enemies still active
    expect(eng2.enemies().every(u => u.active)).toBe(true);
  });
});
