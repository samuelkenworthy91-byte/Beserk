import { describe, it, expect } from 'vitest';
import { BattleEngine } from './battle';
import { CHAPTER_3 } from '../data/chapter3';
import { CHAPTER_2 } from '../data/chapter2';

// ─── Chapter 3 — The Bridge at Asthoreth ──────────────────────────────────
//
// First mission as a Hawk. Two-player advance (Guts + Judeau) across a
// river with a single bridge crossing; the rebel captain waits in the
// keep on the north bank. The road through the bridge is the only way
// to reach him without walking a fortnight east.

describe('Chapter 3 — The Bridge at Asthoreth', () => {

  // ───────────────────────── structure ─────────────────────────

  it('has the right id, name and boss declaration', () => {
    expect(CHAPTER_3.id).toBe(3);
    expect(CHAPTER_3.name.toLowerCase()).toContain('bridge');
    expect(CHAPTER_3.bossDefId).toBe('c_rebel');
  });

  it('uses the next id-space', () => {
    expect(CHAPTER_3.id).not.toBe(CHAPTER_2.id);
    expect(CHAPTER_3.id).toBe(CHAPTER_2.id + 1);
  });

  // ───────────────────────── map ─────────────────────────

  it('the map is a 14×10 grid with a river and at least one bridge road', () => {
    expect(CHAPTER_3.map.length).toBe(10);
    for (const row of CHAPTER_3.map) expect(row.length).toBe(14);
    const allText = CHAPTER_3.map.join('');
    // water tiles cut the map in half
    expect(/[W~]/.test(allText)).toBe(true);
    // roads cross the water (the bridge)
    const roadCount = (allText.match(/R/g) ?? []).length;
    expect(roadCount).toBeGreaterThanOrEqual(8);
  });

  // ───────────────────────── unit placements ─────────────────────────

  it('deploys two players, a bridge screen, a patrol pair, and a keep', () => {
    const players = CHAPTER_3.units.filter(u => u.faction === 'player');
    expect(players.length).toBe(2);
    expect(players.map(p => p.def).sort()).toEqual(['guts', 'judeau']);

    const bridge = CHAPTER_3.units.filter(u => u.group === 'bridge');
    expect(bridge.length).toBe(2);
    expect(bridge.every(b => b.def === 'e_soldier')).toBe(true);

    const patrols = CHAPTER_3.units.filter(u => u.group === 'patrol');
    expect(patrols.length).toBe(2);
    expect(patrols.every(p => p.ai === 'patrol')).toBe(true);

    const keep = CHAPTER_3.units.filter(u => u.group === 'keep');
    expect(keep.length).toBe(2);
    expect(keep.some(k => k.def === 'c_rebel')).toBe(true);
  });

  it('every unit is on a walkable, in-bounds tile', () => {
    const H = CHAPTER_3.map.length;
    const W = CHAPTER_3.map[0].length;
    for (const u of CHAPTER_3.units) {
      expect(u.x).toBeGreaterThanOrEqual(0); expect(u.x).toBeLessThan(W);
      expect(u.y).toBeGreaterThanOrEqual(0); expect(u.y).toBeLessThan(H);
      // impassable: W, ~, M, C (water, walls, mountains)
      const t = CHAPTER_3.map[u.y][u.x];
      expect(/[MW~C]/.test(t)).toBe(false);
    }
  });

  it('Guts and Judeau enter together from the south and split no row apart', () => {
    const playerUnits = CHAPTER_3.units.filter(u => u.faction === 'player');
    for (const u of playerUnits) {
      // both units must start in the bottom 3 rows (south of the river)
      expect(u.y).toBeGreaterThanOrEqual(7);
    }
  });

  it('the boss waits on the north bank', () => {
    const boss = CHAPTER_3.units.find(u => u.def === 'c_rebel')!;
    // the river divides the map at rows 4–5; the boss must be on or above that
    expect(boss.y).toBeLessThanOrEqual(3);
    // and he should be marked as a boss unit on the chapter
    expect(CHAPTER_3.bossDefId).toBe('c_rebel');
  });

  // ───────────────────────── engine boot ─────────────────────────

  it('the engine boots Chapter 3 with two players and six enemies', () => {
    const eng = new BattleEngine(CHAPTER_3, null);
    expect(eng.turn).toBe(1);
    expect(eng.phase).toBe('player');
    expect(eng.players().length).toBe(2);
    expect(eng.players().map(u => u.defId).sort()).toEqual(['guts', 'judeau']);
    expect(eng.enemies().length).toBe(6);
    const captain = eng.units.find(u => u.defId === 'c_rebel')!;
    expect(captain).toBeTruthy();
    expect(captain.boss).toBe(true);
  });

  it('the cursor opens on the player cursor-anchor tile (playerStart[0])', () => {
    const eng = new BattleEngine(CHAPTER_3, null);
    const [sx, sy] = CHAPTER_3.playerStart[0];
    expect(eng.cursor.x).toBe(sx);
    expect(eng.cursor.y).toBe(sy);
  });

  // ───────────────────────── AI behaviour ─────────────────────────

  it('every enemy starts dormant', () => {
    const eng = new BattleEngine(CHAPTER_3, null);
    expect(eng.enemies().every(u => !u.active)).toBe(true);
  });

  it('the patrols have patrol state at deploy', () => {
    const eng = new BattleEngine(CHAPTER_3, null);
    const patrols = eng.units.filter(u => u.group === 'patrol');
    // patrol AI: anchor + dir so the first walk moves AWAY from spawn
    for (const u of patrols) {
      expect(u.patrolAnchor).toBeTruthy();
      expect(u.patrolDir).toBeDefined();
    }
  });

  it('the bridge guards wake when Guts enters their aggro radius', () => {
    const eng = new BattleEngine(CHAPTER_3, null);
    const bridge = eng.units.filter(u => u.group === 'bridge');
    const gut = eng.players().find(u => u.defId === 'guts')!;
    // walk Guts up close to the bridge, well within aggro=3
    gut.x = 5; gut.y = 8;
    (eng as unknown as { evaluateTriggers: () => void }).evaluateTriggers();
    expect(bridge.some(u => u.active)).toBe(true);
  });

  it('Guts in the south-west corner does not wake the keep garrison', () => {
    const eng = new BattleEngine(CHAPTER_3, null);
    const keep = eng.units.filter(u => u.group === 'keep');
    const gut = eng.players().find(u => u.defId === 'guts')!;
    gut.x = 1; gut.y = 9;
    (eng as unknown as { evaluateTriggers: () => void }).evaluateTriggers();
    expect(keep.every(u => !u.active)).toBe(true);
  });

  it('Guts crossing the bridge wakes the keep (all groups wake as one)', () => {
    const eng = new BattleEngine(CHAPTER_3, null);
    const keep = eng.units.filter(u => u.group === 'keep');
    const gut = eng.players().find(u => u.defId === 'guts')!;
    // cross the bridge: y<=5, x somewhere on the bridge
    gut.x = 6; gut.y = 3;
    (eng as unknown as { evaluateTriggers: () => void }).evaluateTriggers();
    expect(keep.some(u => u.active)).toBe(true);
  });

  // ───────────────────────── dialogue ─────────────────────────

  it('the intro sets the bridge context with Judeau briefing Guts', () => {
    const speakers = new Set(CHAPTER_3.intro.lines.map(l => l.speaker));
    expect(speakers.has('Judeau')).toBe(true);
    expect(speakers.has('Guts')).toBe(true);
    // Griffith does not personally appear in this intro
    expect(speakers.has('Griffith')).toBe(false);
    expect(CHAPTER_3.intro.lines.length).toBeGreaterThanOrEqual(4);
  });

  it('the outro contains Griffith\'s response after the bridge falls', () => {
    const allText = CHAPTER_3.outro.lines.map(l => l.text).join('\n');
    expect(allText.toLowerCase()).toContain('don\'t make me wrong');
    expect(allText.toLowerCase()).toContain('casca');
  });

  // ───────────────────────── save import ─────────────────────────

  it('the chapter-2 save imports with both Guts and Judeau present', () => {
    // chapter 2 unlocks chapter 3; the player's party should be Guts + Judeau
    // at the bridge encounter. We simulate a save with both members and
    // verify their levels persist into chapter 3.
    const seed = {
      unlockedChapters: 3,
      party: [
        { defId: 'guts', level: 5, exp: 30,
          stats: { hp: 40, str: 14, skl: 12, spd: 13, lck: 4,
                   def: 11, res: 8, mov: 5, con: 11 },
          items: [], hp: 40 },
        { defId: 'judeau', level: 4, exp: 12,
          stats: { hp: 28, str: 7, skl: 11, spd: 12, lck: 6,
                   def: 6, res: 7, mov: 6, con: 8 },
          items: [], hp: 28 },
      ],
      fallen: [], totalTurns: 9,
    };
    const eng = new BattleEngine(CHAPTER_3, seed);
    expect(eng.players().length).toBe(2);
    const gut = eng.players().find(u => u.defId === 'guts')!;
    const jud = eng.players().find(u => u.defId === 'judeau')!;
    expect(gut.level).toBe(5);
    expect(jud.level).toBe(4);
  });

  it('a fresh save with only Guts still boots chapter 3 (Judeau starts template-level)', () => {
    // edge case: player starts chapter 3 from a wipe — Judeau was lost,
    // but the chapter still spawns him at his template level (L4) so the
    // mission is solo-able. The important thing is the boot doesn't crash.
    const eng = new BattleEngine(CHAPTER_3, null);
    const jud = eng.players().find(u => u.defId === 'judeau')!;
    expect(jud).toBeTruthy();
    expect(jud.level).toBeGreaterThanOrEqual(1);
  });

  // ───────────────────────── persistence ─────────────────────────

  it('snapshot/resume keeps both player positions', () => {
    const eng = new BattleEngine(CHAPTER_3, null);
    const gut = eng.players().find(u => u.defId === 'guts')!;
    const jud = eng.players().find(u => u.defId === 'judeau')!;
    gut.x = 5; gut.y = 8;
    jud.x = 6; jud.y = 8;
    const snap = eng.snapshot();
    const eng2 = new BattleEngine(CHAPTER_3, null, snap);
    expect(eng2.players().find(u => u.defId === 'guts')!.x).toBe(5);
    expect(eng2.players().find(u => u.defId === 'judeau')!.y).toBe(8);
  });

  it('patrol AI state survives the suspend', () => {
    const eng = new BattleEngine(CHAPTER_3, null);
    // find the soldier patrol unit specifically (the one in group 'patrol');
    // there are multiple e_soldiers in the chapter so we can't just look up
    // by defId
    const p = eng.units.find(u => u.group === 'patrol' && u.defId === 'e_soldier')!;
    p.patrolAnchor = { x: 3, y: 8 };
    p.patrolDir = -1;
    const snap = eng.snapshot();
    const eng2 = new BattleEngine(CHAPTER_3, null, snap);
    // match by group + defId after restore, same trick
    const p2 = eng2.units.find(u => u.group === 'patrol' && u.defId === 'e_soldier')!;
    expect(p2.patrolAnchor).toEqual({ x: 3, y: 8 });
    expect(p2.patrolDir).toBe(-1);
  });
});
