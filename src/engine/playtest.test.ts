import { describe, it, expect } from 'vitest';
import { BattleEngine } from './battle';
import { CHAPTER_1 } from '../data/chapter1';
import { CHAPTER_2 } from '../data/chapter2';
import { CHAPTER_3 } from '../data/chapter3';
import { CHAPTER_4 } from '../data/chapter4';
import { CHAPTER_5 } from '../data/chapter5';
import { CHAPTER_6 } from '../data/chapter6';
import { CHAPTER_7 } from '../data/chapter7';
import { CHAPTER_8 } from '../data/chapter8';
import { CHAPTER_9 } from '../data/chapter9';
import { CHAPTER_10 } from '../data/chapter10';
import { CHAPTER_11 } from '../data/chapter11';
import { CHAPTER_12 } from '../data/chapter12';
import { CHAPTER_13 } from '../data/chapter13';
import { CHAPTER_14 } from '../data/chapter14';
import type { ChapterDef } from './types';

// ─────────────────── playtest smoke ───────────────────
//
// Boots every chapter, exercises a few end-turn cycles, and asserts
// the engine stays alive. This is the regression net for the 14-
// chapter campaign: a bad unit placement, a typo in a weapon, or a
// missing terrain rule surfaces here as a crash or stalled turn.

const CHAPTERS: ChapterDef[] = [
  CHAPTER_1, CHAPTER_2, CHAPTER_3, CHAPTER_4, CHAPTER_5,
  CHAPTER_6, CHAPTER_7, CHAPTER_8, CHAPTER_9, CHAPTER_10,
  CHAPTER_11, CHAPTER_12, CHAPTER_13, CHAPTER_14,
];

describe('playtest smoke — every chapter boots', () => {
  for (const chapter of CHAPTERS) {
    it(`ch ${chapter.id} ${chapter.name} boots cleanly`, () => {
      const eng = new BattleEngine(chapter, null);
      expect(eng.turn).toBe(1);
      expect(eng.phase).toBe('player');
      expect(eng.units.length).toBeGreaterThan(0);
      expect(eng.players().length).toBeGreaterThanOrEqual(1);
      expect(eng.enemies().length).toBeGreaterThanOrEqual(1);
      const boss = eng.units.find(u => u.defId === chapter.bossDefId);
      expect(boss, `ch ${chapter.id} boss '${chapter.bossDefId}' not present`).toBeTruthy();
    });
  }
});

// ─── turn cycle ──────────────────────────────────────────────────────────────
//
// The end-turn loop sleeps ~2.4s per turn (1150 + 140 + 1100) and walks
// every active enemy, which gets expensive with chapters that have many
// enemies. We cover the turn loop on a single representative chapter
// (chapter 1 has the smallest enemy roster) and trust the per-chapter
// boot smoke above to catch any structural regressions in chapters 2–14.

describe('turn cycle — chapter 1 runs a full turn', () => {
  it('ch 1 end-turn cycles back to player on turn 2', { timeout: 15_000 }, async () => {
    const eng = new BattleEngine(CHAPTER_1, null);
    await eng.endTurn();
    expect(eng.phase).toBe('player');
    expect(eng.turn).toBe(2);
  });
});

describe('chapter pacing sanity', () => {
  it('every chapter has at least one enemy alive in phase 1', () => {
    for (const chapter of CHAPTERS) {
      const eng = new BattleEngine(chapter, null);
      const aliveEnemies = eng.enemies();
      expect(aliveEnemies.length,
        `ch ${chapter.id} has no enemies`).toBeGreaterThanOrEqual(1);
    }
  });

  it('every chapter has the boss on the enemy faction', () => {
    for (const chapter of CHAPTERS) {
      const eng = new BattleEngine(chapter, null);
      const boss = eng.units.find(u => u.defId === chapter.bossDefId);
      expect(boss?.faction, `ch ${chapter.id} boss faction`).toBe('enemy');
    }
  });

  it('chapters 1–14 have non-empty intro + outro scripts', () => {
    for (const chapter of CHAPTERS) {
      expect(chapter.intro.lines.length,
        `ch ${chapter.id} intro`).toBeGreaterThan(0);
      expect(chapter.outro.lines.length,
        `ch ${chapter.id} outro`).toBeGreaterThan(0);
    }
  });

  it('every chapter declares a WeatherType', () => {
    for (const chapter of CHAPTERS) {
      expect(['none', 'rain'], `ch ${chapter.id}`).toContain(chapter.weather);
    }
  });

  it('player count is the number of player-faction units in the chapter', () => {
    // playerStart only seeds the cursor position; the player roster
    // comes from the units[] array filtered by faction === 'player'.
    for (const chapter of CHAPTERS) {
      const eng = new BattleEngine(chapter, null);
      const playerUnits = chapter.units.filter(u => u.faction === 'player').length;
      const live = eng.players().length;
      expect(live, `ch ${chapter.id} expected ${playerUnits} players, got ${live}`)
        .toBe(playerUnits);
    }
  });
});

describe('chapter boss unit', () => {
  it('every boss has boss=true and is a non-trivial unit', () => {
    for (const chapter of CHAPTERS) {
      const eng = new BattleEngine(chapter, null);
      const boss = eng.units.find(u => u.defId === chapter.bossDefId)!;
      expect(boss.boss, `ch ${chapter.id} boss flag`).toBe(true);
      // bosses should have hp > 1 to be a meaningful fight
      expect(boss.stats.hp, `ch ${chapter.id} boss hp`).toBeGreaterThan(1);
    }
  });
});

describe('pacing profile — enemy roster per chapter', () => {
  // No balance tweaks here — just descriptive stats so we can spot
  // outliers: a chapter with 0 active enemies (player can't lose),
  // one with too few enemies (trivial), or one with way too many
  // (overwhelming). The thresholds are loose; tightening them is
  // a balance-pass decision, not a regression net.

  for (const chapter of CHAPTERS) {
    it(`ch ${chapter.id} enemy count is sane`, () => {
      const eng = new BattleEngine(chapter, null);
      const enemies = eng.enemies();
      const dormantEnemies = enemies.filter(u => !u.active);
      // every chapter has at least one enemy AND at least one
      // dormant enemy (pacing: player should walk INTO trouble)
      expect(enemies.length).toBeGreaterThanOrEqual(2);
      // most chapters start with the player close to a few enemies
      // and the rest dormant — only chapter 12 is fully active
      // (and that one is the exception to the rule)
      // The Eclipse (ch 9), the departure (ch 10), and the final
      // storm-scape (ch 14) all skip dormancy — apostles are already
      // attacking, or the Hawk is in open country. Chapter 12 also
      // has no dormancy (the new Band keeps watch).
      const FULLY_ACTIVE = new Set([9, 10, 12, 14]);
      if (!FULLY_ACTIVE.has(chapter.id)) {
        expect(dormantEnemies.length,
          `ch ${chapter.id} should have at least one dormant enemy`)
          .toBeGreaterThanOrEqual(1);
      }
    });
  }
});

// ─── balance profile ─────────────────────────────────────────────────────────
//
// A snapshot of every chapter's roster, exposure, and enemy density.
// Useful to spot outlier chapters during balance passes.

describe('balance profile — exposes per-chapter stats', () => {
  interface Profile {
    id: number;
    name: string;
    players: number;
    enemies: number;
    dormantEnemies: number;
    bossDefId: string;
    bossHp: number;
    mapW: number;
    mapH: number;
    weather: string;
  }
  const profiles: Profile[] = [];

  for (const chapter of CHAPTERS) {
    it(`ch ${chapter.id} stats`, () => {
      const eng = new BattleEngine(chapter, null);
      const enemies = eng.enemies();
      const dormantEnemies = enemies.filter(u => !u.active).length;
      const boss = eng.units.find(u => u.defId === chapter.bossDefId)!;
      const profile: Profile = {
        id: chapter.id,
        name: chapter.name,
        players: eng.players().length,
        enemies: enemies.length,
        dormantEnemies,
        bossDefId: chapter.bossDefId,
        bossHp: boss.stats.hp,
        mapW: chapter.map[0]?.length ?? 0,
        mapH: chapter.map.length,
        weather: chapter.weather,
      };
      profiles.push(profile);
      // sanity: no chapter should have > 12 enemies (game-balance
      // ceiling). Chapter 9 (the Eclipse) is the deliberate exception:
      // the 12 apostles plus the Idea of Evil give 13 enemies.
      const ceiling = chapter.id === 9 ? 14 : 12;
      expect(profile.enemies).toBeLessThanOrEqual(ceiling);
    });
  }

  it('prints the full profile table on completion', () => {
    // Logged once at the end so the operator can read the full table.
    const lines = profiles.map(p =>
      `  ch ${p.id} ${p.name.padEnd(28)} | ` +
      `players ${p.players} | enemies ${p.enemies} (${p.dormantEnemies}d) | ` +
      `boss ${p.bossDefId} (hp ${p.bossHp}) | ` +
      `map ${p.mapW}×${p.mapH} | ${p.weather}`,
    );
    console.log('[balance profile]\n' + lines.join('\n'));
    expect(profiles.length).toBe(CHAPTERS.length);
  });
});
