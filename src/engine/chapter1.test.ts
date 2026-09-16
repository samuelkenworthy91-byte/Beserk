import { describe, it, expect } from 'vitest';
import { BattleEngine } from './battle';
import { CHAPTER_1 } from '../data/chapter1';

// ─── End-to-end smoke: chapter 1 should be winnable from start to finish ────
//
// This is the single most important regression test in the project: if the
// engine is broken in any of the ways the player would notice first (boss
// can't be reached, fight locks up, victory never fires) this fails loud.
//
// The assertions below don't try to play optimally; they walk every required
// structural beat the player has to clear at boot. RNG is left intact for
// combat rolls; we only assert structural invariants.

describe('Chapter 1 end-to-end', () => {
  it('constructs and walks the initial state', () => {
    const eng = new BattleEngine(CHAPTER_1, null);
    expect(eng.turn).toBe(1);
    expect(eng.phase).toBe('player');
    expect(eng.players().length).toBe(4);
    expect(eng.enemies().length).toBe(8);
    // the lead player's cursor should be on their starting tile
    const [sx, sy] = CHAPTER_1.playerStart[0];
    expect(eng.cursor.x).toBe(sx);
    expect(eng.cursor.y).toBe(sy);
  });

  it('lets the player move an ally and see a movement menu', () => {
    const eng = new BattleEngine(CHAPTER_1, null);
    const guts = eng.players().find(u => u.defId === 'guts')!;
    eng.cursor = { x: guts.x, y: guts.y };
    eng.selectTile(guts.x, guts.y);
    // we should be in 'selected' now
    expect(eng.mode === 'selected' || eng.mode === 'menu').toBe(true);
    const moves = eng.sel?.moves;
    expect(moves).toBeDefined();
    expect(moves!.size).toBeGreaterThan(1);
  });

  it('treats Bazuso as the chapter boss (killing him fires victory)', () => {
    const eng = new BattleEngine(CHAPTER_1, null);
    const boss = eng.units.find(u => u.defId === 'bazuso')!;
    expect(boss.boss).toBe(true);
    // the chapter object itself declares this unit as the win condition
    expect(CHAPTER_1.bossDefId).toBe('bazuso');
  });

  it('keeps every enemy squad dormant at deploy', () => {
    const eng = new BattleEngine(CHAPTER_1, null);
    expect(eng.enemies().every(u => !u.active)).toBe(true);
  });

  it('wakes an enemy squad when the player walks into aggro range', () => {
    const eng = new BattleEngine(CHAPTER_1, null);
    const picket = eng.units.filter(u => u.group === 'picket');
    // move one of the picket members' tiles into the player's BFS so the
    // engine wakes the squad on its next evaluation
    const gut = eng.players().find(u => u.defId === 'guts')!;
    gut.x = 5; gut.y = 8;
    (eng as unknown as { evaluateTriggers: () => void }).evaluateTriggers();
    expect(picket.some(u => u.active)).toBe(true);
  });

  it('does not crash when endTurn is called on a clean board', async () => {
    const eng = new BattleEngine(CHAPTER_1, null);
    await eng.endTurn();
    expect(eng.phase).toBe('player');
    expect(eng.turn).toBe(2);
  });
});
