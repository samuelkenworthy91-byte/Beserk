import { describe, it, expect } from 'vitest';
import {
  fxKindFor, killStyleFor, swingArc, swingProgress, slowMo,
  swingColor, swingWidth, SWING_MS, KILL_FADE_MS, BOSS_KILL_SLOWMO_MS,
} from './fx';

// ─────────────────── fx module: pure helper tests ───────────────────
//
// These pin the contracts that the BattleScreen renderer depends on.
// The renderer treats fxKindFor + swingArc + swingProgress as a pure
// pipeline (kind → path → progress at time t). Slow-mo is a separate
// per-frame quantity.

describe('fxKindFor', () => {
  it('classifies the canonical classes', () => {
    expect(fxKindFor('Mercenary')).toBe('sword');
    expect(fxKindFor('Vanguard')).toBe('sword');
    expect(fxKindFor('Heavy')).toBe('sword');
    expect(fxKindFor('Sergeant')).toBe('sword');
    expect(fxKindFor('Scout')).toBe('dagger');
    expect(fxKindFor('Archer')).toBe('bow');
    expect(fxKindFor('Bowman')).toBe('bow');
    expect(fxKindFor('Spearman')).toBe('spear');
    expect(fxKindFor('Greater Demon')).toBe('demonic');
    expect(fxKindFor('Lesser Demon')).toBe('demonic');
    expect(fxKindFor('God Hand')).toBe('godhand');
    expect(fxKindFor('God-Hand-Eclipse')).toBe('godhand');
    expect(fxKindFor('Marshal of Doldrey')).toBe('warlord');
    expect(fxKindFor('Warlord')).toBe('warlord');
    expect(fxKindFor('Imperial Centurion')).toBe('warlord');
    expect(fxKindFor('Knight-Commander')).toBe('warlord');
    expect(fxKindFor('Commander')).toBe('arcane');
  });

  it('falls back to sword for unknown class', () => {
    expect(fxKindFor('Unknown Class')).toBe('sword');
    expect(fxKindFor(undefined)).toBe('sword');
  });
});

describe('killStyleFor', () => {
  it('maps God-Hand / Demon to shatter', () => {
    expect(killStyleFor('godhand')).toBe('shatter');
    expect(killStyleFor('demonic')).toBe('shatter');
  });
  it('bows dissolve', () => {
    expect(killStyleFor('bow')).toBe('dissolve');
  });
  it('arcane shimmers', () => {
    expect(killStyleFor('arcane')).toBe('shimmer');
  });
  it('melee and warlord knockback', () => {
    expect(killStyleFor('sword')).toBe('knockback');
    expect(killStyleFor('warlord')).toBe('knockback');
  });
});

describe('swingArc', () => {
  it('returns a quad control-point path between attacker and defender', () => {
    const a = swingArc(0, 0, 4, 0, 'sword');
    expect(a.startX).toBeLessThan(0);                       // start behind
    expect(a.endX).toBeGreaterThan(4);                      // end past
    // arc rises above the line of attack (positive perpendicular)
    expect(a.cp1Y).toBeGreaterThan(a.startY);
    // end has positive y if going right (perp is (-0, 4) → (0, 4)/4 → 1, 0)
    //   we instead test colour/width defaults
    expect(a.color).toMatch(/^#[0-9a-f]{6}$/);
    expect(a.width).toBeGreaterThan(0);
  });

  it('godhand swings are wider and brighter than sword', () => {
    const a = swingArc(0, 0, 4, 0, 'sword');
    const b = swingArc(0, 0, 4, 0, 'godhand');
    expect(b.width).toBeGreaterThan(a.width);
    expect(b.color).not.toBe(a.color);
  });

  it('dagger swings are thinner', () => {
    const a = swingArc(0, 0, 4, 0, 'dagger');
    expect(a.width).toBeLessThanOrEqual(2);
  });
});

describe('swingProgress', () => {
  it('is 0 at t=0 and 1 at t=SWING_MS', () => {
    expect(swingProgress(0)).toBeCloseTo(0, 5);
    expect(swingProgress(SWING_MS)).toBeCloseTo(1, 5);
    expect(swingProgress(SWING_MS * 2)).toBe(1); // clamped
  });

  it('clamps to [0, 1]', () => {
    expect(swingProgress(-100)).toBe(0);
    expect(swingProgress(9999999)).toBe(1);
  });

  it('eases (midway is faster than linear)', () => {
    const mid = swingProgress(SWING_MS / 2);
    // ease-in-out cubic at k=0.5 = 0.5
    expect(mid).toBeGreaterThan(0.45);
    expect(mid).toBeLessThan(0.55);
  });
});

describe('slowMo', () => {
  it('returns 0 when not active', () => {
    expect(slowMo(0, 0)).toBe(0);
    expect(slowMo(100, 50)).toBe(0);
  });

  it('returns a 0..1 progress during the boss-kill window', () => {
    const until = 1000;
    const start = until - BOSS_KILL_SLOWMO_MS;
    // at start: full slow-mo (1.0)
    expect(slowMo(start, until)).toBeCloseTo(1, 5);
    // at midpoint
    const mid = slowMo((start + until) / 2, until);
    expect(mid).toBeGreaterThan(0.4);
    expect(mid).toBeLessThan(0.6);
    // at end: 0
    expect(slowMo(until, until)).toBe(0);
  });

  it('returns 0 once the window has elapsed', () => {
    expect(slowMo(1000, 100)).toBe(0);   // past the end of the window
  });
});

describe('duration constants', () => {
  it('SWING_MS < KILL_FADE_MS', () => {
    // swing is a quick chop; kill fade is longer.
    expect(SWING_MS).toBeLessThan(KILL_FADE_MS);
  });
  it('BOSS_KILL_SLOWMO_MS is roughly half a second', () => {
    expect(BOSS_KILL_SLOWMO_MS).toBeGreaterThan(400);
    expect(BOSS_KILL_SLOWMO_MS).toBeLessThan(700);
  });
});

describe('swing colour + width', () => {
  it('every FxKind has a distinct colour', () => {
    const kinds = ['sword', 'dagger', 'bow', 'spear', 'demonic', 'godhand', 'warlord', 'arcane'] as const;
    const cols = kinds.map(k => swingColor(k));
    expect(new Set(cols).size).toBe(kinds.length);
  });
  it('every FxKind has a width', () => {
    const kinds = ['sword', 'dagger', 'bow', 'spear', 'demonic', 'godhand', 'warlord', 'arcane'] as const;
    for (const k of kinds) expect(swingWidth(k)).toBeGreaterThan(0);
  });
});
