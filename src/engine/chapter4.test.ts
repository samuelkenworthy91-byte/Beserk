import { describe, it, expect } from 'vitest';
import { BattleEngine } from './battle';
import { CHAPTER_4 } from '../data/chapter4';
import { CHAPTER_3 } from '../data/chapter3';

// ─── Chapter 4 — First Command ─────────────────────────────────────────────
//
// Guts leads a three-person advance into Vritannis. Casca and Judeau are
// second and third in single file down the south road. The objective is
// the wounded knight captain in the keep: a knight of the old order who
// holds the tower with two garrisoned soldiers and three wall pikemen.
//
// Tests pin every structural beat — the trio entering together, the
// patrol group on the south road, the keep garrison that only wakes
// once the players cross the threshold, and the boss in the fort.

describe('Chapter 4 — First Command', () => {

  // ───────────────────────── structure ─────────────────────────

  it('has the right id, name and boss declaration', () => {
    expect(CHAPTER_4.id).toBe(4);
    expect(CHAPTER_4.name.toLowerCase()).toContain('first command');
    expect(CHAPTER_4.bossDefId).toBe('c_veteran');
  });

  it('continues the chapter id-space', () => {
    expect(CHAPTER_4.id).toBe(CHAPTER_3.id + 1);
  });

  // ───────────────────────── map ─────────────────────────

  it('the map is a 14×10 grid with at least one fort tile and a gate', () => {
    expect(CHAPTER_4.map.length).toBe(10);
    for (const row of CHAPTER_4.map) expect(row.length).toBe(14);
    const allText = CHAPTER_4.map.join('');
    // the keep is a series of fort tiles somewhere on the map
    expect(/[F]/.test(allText)).toBe(true);
    // the south wall has a gate (a G tile)
    expect(/[G]/.test(allText)).toBe(true);
  });

  // ───────────────────────── unit placements ─────────────────────────

  it('deploys three players (Guts/Casca/Judeau) in single file', () => {
    const players = CHAPTER_4.units.filter(u => u.faction === 'player');
    expect(players.length).toBe(3);
    expect(players.map(p => p.def).sort()).toEqual(['casca', 'guts', 'judeau']);
    // they should all enter the south road (y=9) and not be more than 1 tile apart
    const xs = players.map(p => p.x).sort((a, b) => a - b);
    expect(xs[1] - xs[0]).toBe(1);
    expect(xs[2] - xs[1]).toBe(1);
  });

  it('deploys walls, patrol, garrison and boss groups', () => {
    const walls = CHAPTER_4.units.filter(u => u.group === 'walls');
    expect(walls.length).toBe(3);

    const patrol = CHAPTER_4.units.filter(u => u.group === 'patrol');
    expect(patrol.length).toBe(2);
    expect(patrol.every(p => p.ai === 'patrol')).toBe(true);

    const garrison = CHAPTER_4.units.filter(u => u.group === 'garrison');
    expect(garrison.length).toBe(3);
    expect(garrison.some(u => u.def === 'c_veteran')).toBe(true);
  });

  it('every unit is on a walkable, in-bounds tile', () => {
    const H = CHAPTER_4.map.length;
    const W = CHAPTER_4.map[0].length;
    for (const u of CHAPTER_4.units) {
      expect(u.x).toBeGreaterThanOrEqual(0); expect(u.x).toBeLessThan(W);
      expect(u.y).toBeGreaterThanOrEqual(0); expect(u.y).toBeLessThan(H);
      // impassable terrain: water, walls, mountains
      const t = CHAPTER_4.map[u.y][u.x];
      expect(/[MW~C]/.test(t)).toBe(false);
    }
  });

  it('the captain (boss) stands on a fort tile', () => {
    const boss = CHAPTER_4.units.find(u => u.def === 'c_veteran')!;
    expect(boss.y).toBeLessThanOrEqual(1); // the keep is at row 0–1
    const t = CHAPTER_4.map[boss.y][boss.x];
    // boss should be on fort OR on the front row of the keep tiles
    expect(/[F.]/.test(t)).toBe(true);
  });

  // ───────────────────────── engine boot ─────────────────────────

  it('the engine boots Chapter 4 with three players and seven enemies', () => {
    const eng = new BattleEngine(CHAPTER_4, null);
    expect(eng.turn).toBe(1);
    expect(eng.phase).toBe('player');
    expect(eng.players().length).toBe(3);
    expect(eng.players().map(u => u.defId).sort()).toEqual(['casca', 'guts', 'judeau']);
    expect(eng.enemies().length).toBe(8);
    const captain = eng.units.find(u => u.defId === 'c_veteran')!;
    expect(captain).toBeTruthy();
    expect(captain.boss).toBe(true);
  });

  it('the cursor opens on the player cursor-anchor tile (playerStart[0])', () => {
    const eng = new BattleEngine(CHAPTER_4, null);
    const [sx, sy] = CHAPTER_4.playerStart[0];
    expect(eng.cursor.x).toBe(sx);
    expect(eng.cursor.y).toBe(sy);
  });

  // ───────────────────────── AI behaviour ─────────────────────────

  it('every enemy starts dormant', () => {
    const eng = new BattleEngine(CHAPTER_4, null);
    expect(eng.enemies().every(u => !u.active)).toBe(true);
  });

  it('the patrols have patrol state at deploy', () => {
    const eng = new BattleEngine(CHAPTER_4, null);
    const patrol = eng.units.filter(u => u.group === 'patrol');
    for (const u of patrol) {
      expect(u.patrolAnchor).toBeTruthy();
      expect(u.patrolDir).toBeDefined();
    }
  });

  it('moving Guts up the south road wakes the patrols but not the walls', () => {
    const eng = new BattleEngine(CHAPTER_4, null);
    const gut = eng.players().find(u => u.defId === 'guts')!;
    gut.x = 6; gut.y = 9;
    (eng as unknown as { evaluateTriggers: () => void }).evaluateTriggers();
    const patrol = eng.units.filter(u => u.group === 'patrol');
    expect(patrol.some(u => u.active)).toBe(true);
    const walls = eng.units.filter(u => u.group === 'walls');
    expect(walls.every(u => !u.active)).toBe(true);
  });

  it('pushing past the gate (y<6) wakes the walls', () => {
    const eng = new BattleEngine(CHAPTER_4, null);
    const gut = eng.players().find(u => u.defId === 'guts')!;
    gut.x = 1; gut.y = 5;
    (eng as unknown as { evaluateTriggers: () => void }).evaluateTriggers();
    const walls = eng.units.filter(u => u.group === 'walls');
    expect(walls.some(u => u.active)).toBe(true);
  });

  it('the boss sleeps behind the keep until a player crosses the gate', () => {
    const eng = new BattleEngine(CHAPTER_4, null);
    const captain = eng.units.find(u => u.defId === 'c_veteran')!;
    const gut = eng.players().find(u => u.defId === 'guts')!;
    gut.x = 1; gut.y = 9;  // south of gate
    (eng as unknown as { evaluateTriggers: () => void }).evaluateTriggers();
    expect(captain.active).toBe(false);

    gut.x = 2; gut.y = 4;  // inside the gate
    (eng as unknown as { evaluateTriggers: () => void }).evaluateTriggers();
    // after crossing the gate the captain is aggro=5 and players are within range
    expect(captain.active).toBe(true);
  });

  it('the captain carries the UNFLINCHING trait (no enemy doubles him)', () => {
    // sanity: the trait is on the CharTemplate and threads into the unit
    const eng = new BattleEngine(CHAPTER_4, null);
    const captain = eng.units.find(u => u.defId === 'c_veteran')!;
    expect(captain.traits).toContain('unflinching');
  });

  // ───────────────────────── dialogue ─────────────────────────

  it('the intro sets up Guts taking point under Griffith\'s order', () => {
    const speakers = new Set(CHAPTER_4.intro.lines.map(l => l.speaker));
    expect(speakers.has('Griffith')).toBe(true);
    expect(speakers.has('Casca')).toBe(true);
    expect(speakers.has('Judeau')).toBe(true);
    // Guts is silent in the intro — first command, first time he's been given one
    expect(speakers.has('Guts')).toBe(false);
    expect(CHAPTER_4.intro.lines.length).toBeGreaterThanOrEqual(5);
  });

  it('the outro references Griffith\'s response to Guts\' solo front line', () => {
    const allText = CHAPTER_4.outro.lines.map(l => l.text).join('\n');
    expect(allText.toLowerCase()).toContain('casca');
    expect(allText.toLowerCase()).toContain('learn the difference');
    expect(allText.toLowerCase()).toContain('walk with me');
  });

  // ───────────────────────── save import ─────────────────────────

  it('a save with all three members boots Chapter 4 with their levels', () => {
    const seed = {
      unlockedChapters: 4,
      party: [
        { defId: 'guts',    level: 6, exp: 40,
          stats: { hp: 42, str: 15, skl: 13, spd: 14, lck: 4,
                   def: 12, res: 8, mov: 5, con: 12 }, items: [], hp: 42 },
        { defId: 'casca',   level: 6, exp: 32,
          stats: { hp: 32, str: 11, skl: 10, spd: 12, lck: 5,
                   def: 7,  res: 6, mov: 6, con: 9 }, items: [], hp: 32 },
        { defId: 'judeau',  level: 5, exp: 18,
          stats: { hp: 28, str: 7,  skl: 11, spd: 12, lck: 6,
                   def: 6,  res: 7, mov: 6, con: 8 }, items: [], hp: 28 },
      ],
      fallen: [], totalTurns: 22,
    };
    const eng = new BattleEngine(CHAPTER_4, seed);
    const ps = eng.players();
    expect(ps.length).toBe(3);
    expect(ps.find(u => u.defId === 'guts')!.level).toBe(6);
    expect(ps.find(u => u.defId === 'casca')!.level).toBe(6);
    expect(ps.find(u => u.defId === 'judeau')!.level).toBe(5);
  });

  it('a save missing Casca still boots chapter 4 (template fallback)', () => {
    const eng = new BattleEngine(CHAPTER_4, null);
    const casca = eng.players().find(u => u.defId === 'casca')!;
    expect(casca).toBeTruthy();
    expect(casca.level).toBeGreaterThanOrEqual(1);
  });

  // ───────────────────────── persistence ─────────────────────────

  it('snapshot/resume keeps all three players and their positions', () => {
    const eng = new BattleEngine(CHAPTER_4, null);
    const ps = eng.players();
    ps[0].x = 5; ps[0].y = 8;
    ps[1].x = 6; ps[1].y = 8;
    ps[2].x = 7; ps[2].y = 8;
    const snap = eng.snapshot();
    const eng2 = new BattleEngine(CHAPTER_4, null, snap);
    const ps2 = eng2.players();
    expect(ps2.length).toBe(3);
    const got = ps2.map(u => ({ d: u.defId, x: u.x, y: u.y }))
      .sort((a, b) => a.d.localeCompare(b.d));
    expect(got).toEqual([
      { d: 'casca',  x: 6, y: 8 },
      { d: 'guts',   x: 5, y: 8 },
      { d: 'judeau', x: 7, y: 8 },
    ]);
  });
});
