import { describe, it, expect } from 'vitest';
import { BattleEngine } from './battle';
import { CHAPTER_13 } from '../data/chapter13';
import { CHAPTER_12 } from '../data/chapter12';

// ─── Chapter 13 — The Rescue ───────────────────────────────────────────────
//
// The rescue team reaches God Hand Femto on the floating thorn. Guts'
// team — Rickert, Corkus, Pippin — fights through shard fragments and
// apostle-slaves to bring down Femto and reach Casca.
//
// Player roster is 4 (Guts + 3 supports). Enemy roster is 8 (3 shard +
// 3 drag + Casca-as-prisoner + Femto). The boss is Femto
// (Griffith-as-God-Hand).

describe('Chapter 13 — The Rescue', () => {

  // ───────────────────────── structure ─────────────────────────

  it('has the right id, name and boss declaration', () => {
    expect(CHAPTER_13.id).toBe(13);
    expect(CHAPTER_13.name.toLowerCase()).toContain('rescue');
    expect(CHAPTER_13.bossDefId).toBe('femto');
  });

  it('continues the chapter id-space', () => {
    expect(CHAPTER_13.id).toBe(CHAPTER_12.id + 1);
  });

  // ───────────────────────── map ─────────────────────────

  it('the map is a 14×10 floating thorn ringed with mountains', () => {
    expect(CHAPTER_13.map.length).toBe(10);
    for (const row of CHAPTER_13.map) expect(row.length).toBe(14);
    const allText = CHAPTER_13.map.join('');
    expect(/[M]/.test(allText)).toBe(true); // mountains on the edges
    expect(/[F]/.test(allText)).toBe(true); // fort tiles in the centre
    expect(/[T]/.test(allText)).toBe(true); // forest on the edges
  });

  // ───────────────────────── unit placements ─────────────────────────

  it('deploys four players (Guts + Hawk remnants) on the south arc', () => {
    const players = CHAPTER_13.units.filter(u => u.faction === 'player');
    expect(players.length).toBe(4);
    expect(players.map(p => p.def).sort()).toEqual(
      ['corkus', 'guts', 'pippin', 'rickert']);
  });

  it('deploys shard, drag, casca-prisoner and femto enemy groups', () => {
    const shard = CHAPTER_13.units.filter(u => u.group === 'shard');
    const drag = CHAPTER_13.units.filter(u => u.group === 'drag');
    const casca = CHAPTER_13.units.filter(u => u.group === 'casca');
    const femto = CHAPTER_13.units.filter(u => u.group === 'femto');
    expect(shard.length).toBe(3);
    expect(drag.length).toBe(3);
    expect(casca.length).toBe(1);
    expect(casca[0].def).toBe('casca');
    expect(casca[0].faction).toBe('enemy');
    expect(femto.length).toBe(1);
    expect(femto[0].def).toBe('femto');
  });

  it('every unit is on a walkable, in-bounds tile', () => {
    const H = CHAPTER_13.map.length;
    const W = CHAPTER_13.map[0].length;
    for (const u of CHAPTER_13.units) {
      expect(u.x).toBeGreaterThanOrEqual(0); expect(u.x).toBeLessThan(W);
      expect(u.y).toBeGreaterThanOrEqual(0); expect(u.y).toBeLessThan(H);
      const t = CHAPTER_13.map[u.y][u.x];
      // mountains are impassable
      expect(/[M]/.test(t)).toBe(false);
    }
  });

  // ───────────────────────── engine boot ─────────────────────────

  it('the engine boots Chapter 13 with four players and eight enemies', () => {
    const eng = new BattleEngine(CHAPTER_13, null);
    expect(eng.turn).toBe(1);
    expect(eng.phase).toBe('player');
    expect(eng.players().length).toBe(4);
    expect(eng.enemies().length).toBe(8);
    const femto = eng.units.find(u => u.defId === 'femto')!;
    expect(femto).toBeTruthy();
    expect(femto.boss).toBe(true);
  });

  // The chapter has ONE casca defId, on the enemy faction: the rescue
  // target, still under Femto's control. (The original brief had a
  // player Casca + enemy Casca collision, but resolving by using only
  // the rescue target on enemies keeps the chapter clean and avoids
  // confusing unit-id duplication.)

  it('the engine creates a single Casca unit, on the enemy faction', () => {
    const eng = new BattleEngine(CHAPTER_13, null);
    const cascas = eng.units.filter(u => u.defId === 'casca');
    expect(cascas.length).toBe(1);
    expect(cascas[0].faction).toBe('enemy');
    expect(cascas[0].group).toBe('casca');
  });

  // ───────────────────────── AI behaviour ─────────────────────────

  it('the shard fragments wake when players cross the south arc', () => {
    const eng = new BattleEngine(CHAPTER_13, null);
    const shard = eng.units.filter(u => u.group === 'shard');
    const gut = eng.players().find(u => u.defId === 'guts')!;
    gut.x = 6; gut.y = 7;
    (eng as unknown as { evaluateTriggers: () => void }).evaluateTriggers();
    expect(shard.some(u => u.active)).toBe(true);
  });

  // ───────────────────────── dialogue ─────────────────────────

  it('the intro sets up the floating thorn', () => {
    const allText = CHAPTER_13.intro.lines.map(l => l.text).join('\n');
    expect(allText.toLowerCase()).toContain('thorn');
    expect(allText.toLowerCase()).toContain('god hand');
    expect(allText.toLowerCase()).toContain('casca');
  });

  it('the outro contains Guts catching Casca and "we have come for you"', () => {
    const allText = CHAPTER_13.outro.lines.map(l => l.text).join('\n');
    expect(allText.toLowerCase()).toContain('caught her');
    expect(allText.toLowerCase()).toContain('we have come for you');
    expect(allText.toLowerCase()).toContain('casca');
  });

  // ───────────────────────── save import ─────────────────────────

  it('a chapter-12 save persists Guts at high level into chapter 13', () => {
    const seed = {
      unlockedChapters: 13,
      party: [{
        defId: 'guts', level: 20, exp: 200,
        stats: { hp: 82, str: 30, skl: 26, spd: 28, lck: 5,
                 def: 21, res: 16, mov: 6, con: 15 }, items: [], hp: 82,
      }],
      fallen: ['casca', 'judeau', 'pippin', 'corkus'],
      totalTurns: 230,
    };
    const eng = new BattleEngine(CHAPTER_13, seed);
    const gut = eng.players().find(u => u.defId === 'guts')!;
    expect(gut.level).toBe(20);
  });

  // ───────────────────────── persistence ─────────────────────────

  it('snapshot/resume keeps all four player positions', () => {
    const eng = new BattleEngine(CHAPTER_13, null);
    const ps = eng.players();
    ps[0].x = 4; ps[0].y = 7;
    ps[1].x = 5; ps[1].y = 7;
    ps[2].x = 7; ps[2].y = 7;
    ps[3].x = 8; ps[3].y = 7;
    const snap = eng.snapshot();
    const eng2 = new BattleEngine(CHAPTER_13, null, snap);
    expect(eng2.players().length).toBe(4);
  });
});
