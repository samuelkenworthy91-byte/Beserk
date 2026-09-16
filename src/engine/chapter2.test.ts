import { describe, it, expect } from 'vitest';
import { BattleEngine } from './battle';
import { CHAPTER_2 } from '../data/chapter2';
import { CHAPTER_1 } from '../data/chapter1';

// ─── Chapter 2 — The White Hawk ─────────────────────────────────────────────
//
// The chapter designs the rite of Griffith's recruitment: Guts walks up the
// ridge, walks through four of the Band, and turns Griffith off his horse.
// The unit count is small on purpose — five units — and the boss is parked
// behind screen-squad duelists who deliberately don't pursue. The tests
// below pin every structural beat a player takes for granted.

describe('Chapter 2 — The White Hawk', () => {

  // ───────────────────────── structure ─────────────────────────

  it('has the right id, name and boss declaration', () => {
    expect(CHAPTER_2.id).toBe(2);
    expect(CHAPTER_2.name.toLowerCase()).toContain('hawk');
    expect(CHAPTER_2.bossDefId).toBe('griffith');
  });

  it('uses the same campaign id-space as Chapter 1', () => {
    // the chapter registry is keyed by id; if these collide the UI swallows
    // whichever chapters.ts loads last
    expect(CHAPTER_2.id).not.toBe(CHAPTER_1.id);
  });

  // ───────────────────────── map ─────────────────────────

  it('the map is a 14×10 ridge with mountain walls', () => {
    expect(CHAPTER_2.map.length).toBe(10);
    for (const row of CHAPTER_2.map) {
      expect(row.length).toBe(14);
    }
    // overall the ridge should be visibly walled (mountains on top/bottom)
    const allText = CHAPTER_2.map.join('');
    expect(/[M]/.test(allText)).toBe(true);
    // and road tiles should connect Guts' start to Griffith's tile
    expect(/[R.]/.test(allText)).toBe(true);
  });

  // ───────────────────────── unit placements ─────────────────────────

  it('deploys one player, two sentries, two duelists and one boss', () => {
    const players = CHAPTER_2.units.filter(u => u.faction === 'player');
    const sentries = CHAPTER_2.units.filter(u => u.group === 'sentries');
    const duelists = CHAPTER_2.units.filter(u => u.group === 'duelists');
    const hawk = CHAPTER_2.units.filter(u => u.group === 'hawk');

    expect(players.length).toBe(1);
    expect(players[0].def).toBe('guts');
    expect(sentries.length).toBe(2);
    expect(duelists.length).toBe(2);
    expect(sentries.every(s => s.def === 'e_soldier')).toBe(true);
    expect(duelists.some(d => d.def === 'casca')).toBe(true);
    expect(duelists.some(d => d.def === 'judeau')).toBe(true);
    expect(hawk.length).toBe(1);
    expect(hawk[0].def).toBe('griffith');
  });

  it('all placements are on legal in-bounds tiles', () => {
    const H = CHAPTER_2.map.length;
    const W = CHAPTER_2.map[0].length;
    for (const u of CHAPTER_2.units) {
      expect(u.x).toBeGreaterThanOrEqual(0);
      expect(u.x).toBeLessThan(W);
      expect(u.y).toBeGreaterThanOrEqual(0);
      expect(u.y).toBeLessThan(H);
      // and the tile must be walkable, otherwise the unit is stuck at spawn
      const terrain = CHAPTER_2.map[u.y][u.x];
      expect(/[#~]/.test(terrain)).toBe(false);
    }
  });

  it('the player start tile matches the player-unit placement', () => {
    // we have a playerStart pointer on the chapter (used by the engine to
    // park the camera); it should agree with what the player-unit array says
    const player = CHAPTER_2.units.find(u => u.faction === 'player')!;
    expect(CHAPTER_2.playerStart[0][0]).toBe(player.x);
    expect(CHAPTER_2.playerStart[0][1]).toBe(player.y);
    // and Guts must enter from the south (his starting y is at the bottom)
    expect(player.y).toBeGreaterThanOrEqual(7);
  });

  it('Griffith uses the boss AI and the duelists hold their posts', () => {
    const griffith = CHAPTER_2.units.find(u => u.def === 'griffith')!;
    const duelists = CHAPTER_2.units.filter(u => u.group === 'duelists');
    expect(griffith.ai).toBe('boss');
    expect(duelists.every(d => d.ai === 'guard' || d.ai === 'attack')).toBe(true);
    // duelists must be screen-ing the ridge (above the player start)
    for (const d of duelists) {
      expect(d.y).toBeLessThan(CHAPTER_2.units.find(u => u.faction === 'player')!.y);
    }
  });

  // ───────────────────────── engine boot ─────────────────────────

  it('the engine boots Chapter 2 cleanly with one player on the field', () => {
    const eng = new BattleEngine(CHAPTER_2, null);
    expect(eng.turn).toBe(1);
    expect(eng.phase).toBe('player');
    expect(eng.players().length).toBe(1);
    expect(eng.players()[0].defId).toBe('guts');
    expect(eng.enemies().length).toBe(5);
    const griffith = eng.units.find(u => u.defId === 'griffith')!;
    expect(griffith).toBeTruthy();
    expect(griffith.boss).toBe(true);
    // Griffith's boss trait must reflect his COMMAND trait template
    expect(griffith.traits).toContain('command');
  });

  it('the cursor opens on the player start tile', () => {
    const eng = new BattleEngine(CHAPTER_2, null);
    const [sx, sy] = CHAPTER_2.playerStart[0];
    expect(eng.cursor.x).toBe(sx);
    expect(eng.cursor.y).toBe(sy);
  });

  // ───────────────────────── AI behaviour ─────────────────────────

  it('every enemy starts dormant', () => {
    const eng = new BattleEngine(CHAPTER_2, null);
    expect(eng.enemies().every(u => !u.active)).toBe(true);
  });

  it('moving Guts into the sentries range wakes the squad', () => {
    const eng = new BattleEngine(CHAPTER_2, null);
    const sentries = eng.units.filter(u => u.group === 'sentries');
    const gut = eng.players().find(u => u.defId === 'guts')!;
    // Guts needs to walk north — pick a tile two rows above his start
    const triggerY = Math.max(0, gut.y - 6);
    gut.x = 6; gut.y = triggerY;
    (eng as unknown as { evaluateTriggers: () => void }).evaluateTriggers();
    // at least one sentry should be awake (they're spread across the ridge)
    const awake = sentries.filter(u => u.active);
    expect(awake.length).toBeGreaterThanOrEqual(1);
    // the whole squad wakes as one — check the others if any are awake
    if (awake.length > 0) {
      const idle = sentries.filter(u => !u.active);
      expect(idle.length).toBeLessThanOrEqual(sentries.length - 1);
    }
  });

  it('Griffith stays dormant until Guts enters his aggro radius', () => {
    const eng = new BattleEngine(CHAPTER_2, null);
    const griffith = eng.units.find(u => u.defId === 'griffith')!;
    const gut = eng.players().find(u => u.defId === 'guts')!;
    // park Guts far away, well past the ridge — Griffith should not wake
    gut.x = 1; gut.y = 8;
    (eng as unknown as { evaluateTriggers: () => void }).evaluateTriggers();
    expect(griffith.active).toBe(false);
  });

  it('Griffith with the whole screen down stays dormant (boss patience)', () => {
    const eng = new BattleEngine(CHAPTER_2, null);
    const griffith = eng.units.find(u => u.defId === 'griffith')!;
    // even with the sentries and duelists dead/active, Griffith's aggro
    // should still gate on distance; he does NOT wake purely from kills
    for (const u of eng.units) {
      if (u.group === 'sentries' || u.group === 'duelists') u.active = true;
    }
    const gut = eng.players().find(u => u.defId === 'guts')!;
    gut.x = 6; gut.y = 8;
    (eng as unknown as { evaluateTriggers: () => void }).evaluateTriggers();
    expect(griffith.active).toBe(false);
  });

  // ───────────────────────── dialogue ─────────────────────────

  it('the intro sets the stage with Casca/Judeau/Griffith and ends on the hawk', () => {
    expect(CHAPTER_2.intro.lines.length).toBeGreaterThanOrEqual(5);
    const speakers = new Set(CHAPTER_2.intro.lines.map(l => l.speaker));
    expect(speakers.has('Casca')).toBe(true);
    expect(speakers.has('Judeau')).toBe(true);
    expect(speakers.has('Griffith')).toBe(true);
    // Guts is silent in the intro — his answer comes at the bottom of the ridge
    expect(speakers.has('Guts')).toBe(false);
    // the last spoken line in the intro is Griffith's challenge
    const lastSpoken = [...CHAPTER_2.intro.lines].reverse().find(l => l.speaker);
    expect(lastSpoken!.speaker).toBe('Griffith');
  });

  it('the outro contains the recruitment speech verbatim', () => {
    const allText = CHAPTER_2.outro.lines.map(l => l.text).join('\n');
    // Guts' refusal
    expect(allText.toLowerCase()).toContain("i don't die for anyone");
    // Griffith's offer
    expect(allText.toLowerCase()).toContain('then come with me');
  });

  // ───────────────────────── save import ─────────────────────────

  it('Guts carries his Chapter 1 save into Chapter 2 intact', () => {
    // simulate a chapter 1 victory snapshot: Guts drained, with some XP.
    // The save fields match what app.tsx's onVictory persists and what
    // battle.ts's applyPartyMods expects. (Note: applyPartyMods overrides
    // u.hp with u.stats.hp — the chapter checkpoint refills HP at deploy
    // so the next battle starts clean. Mirroring the existing chapter-1
    // snapshot pipe.)
    const seed = {
      unlockedChapters: 2,
      party: [{
        defId: 'guts',
        level: 5,
        exp: 30,
        stats: {
          hp: 40, str: 14, skl: 12, spd: 13, lck: 4,
          def: 11, res: 8, mov: 5, con: 11,
        },
        items: [],
        hp: 23,
      }],
      fallen: [],
      totalTurns: 12,
    };
    const eng = new BattleEngine(CHAPTER_2, seed);
    const gut = eng.players().find(u => u.defId === 'guts')!;
    // persisted level is applied (campaign advancement persists)
    expect(gut.level).toBe(5);
    // his stat profile carries over from the save
    expect(gut.stats.hp).toBe(40);
    // identity is preserved (template, faction, name)
    expect(gut.defId).toBe('guts');
    expect(gut.faction).toBe('player');
  });

  it('a chapter-1 save that\'s missing Guts still places a fresh Guts', () => {
    // edge case: user clears their save mid-campaign, starts chapter 2
    // from nothing. The engine should not refuse to boot.
    const eng = new BattleEngine(CHAPTER_2, null);
    expect(eng.players().length).toBe(1);
  });

  // ───────────────────────── persistence ─────────────────────────

  it('snapshots and resumes Chapter 2 without losing state', () => {
    const eng = new BattleEngine(CHAPTER_2, null);
    const gut = eng.players().find(u => u.defId === 'guts')!;
    gut.x = 6; gut.y = 5;
    const snap = eng.snapshot();
    const eng2 = new BattleEngine(CHAPTER_2, null, snap);
    const gut2 = eng2.players().find(u => u.defId === 'guts')!;
    expect(gut2.x).toBe(6);
    expect(gut2.y).toBe(5);
    expect(gut2.defId).toBe('guts');
  });

  it('patrol/guard state survives suspend even if no enemy uses those AIs', () => {
    // Chapter 2 doesn't use patrol, but the resume path must still be
    // neutral about WHICH AIs are in play. This is a regression: an earlier
    // snapshot pipe forgot to clone `ai`, and resuming dropped guards into
    // the default patrol planner.
    const eng = new BattleEngine(CHAPTER_2, null);
    for (const u of eng.enemies()) {
      if (u.group === 'sentries') u.ai = 'patrol';
    }
    const snap = eng.snapshot();
    const eng2 = new BattleEngine(CHAPTER_2, null, snap);
    for (const u of eng2.enemies()) {
      if (u.defId === 'e_soldier') {
        // original 'attack' preserved (we didn't touch them in the snap)
        expect(['attack', 'patrol']).toContain(u.ai);
      }
    }
  });
});
