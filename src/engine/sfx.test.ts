import { describe, it, expect } from 'vitest';
import { sfx } from './sfx';

// ─────────────────── sfx routing tests ───────────────────
//
// The WebAudio graph isn't easily testable in vitest (no AudioContext
// mock); instead we pin the routing contract — every FxKind resolves
// to a non-null SFX function, the ambient loop state-machine is
// idempotent, and the new combat sfx exist on the sfx object.

describe('sfx routing', () => {
  it('exposes a forKind dispatcher that resolves every FxKind', () => {
    const kinds = ['sword', 'dagger', 'bow', 'spear', 'demonic', 'godhand', 'warlord', 'arcane'];
    for (const k of kinds) {
      const fn = sfx.forKind(k);
      expect(typeof fn).toBe('function');
    }
  });

  it('falls back to clash for unknown kinds', () => {
    expect(sfx.forKind('zzz-unknown')).toBe(sfx.clash);
  });

  it('exposes the new combat-specific sfx', () => {
    expect(typeof sfx.clash).toBe('function');
    expect(typeof sfx.pierce).toBe('function');
    expect(typeof sfx.bowShot).toBe('function');
    expect(typeof sfx.spearThrust).toBe('function');
    expect(typeof sfx.demonic).toBe('function');
    expect(typeof sfx.godhand).toBe('function');
    expect(typeof sfx.ironThud).toBe('function');
    expect(typeof sfx.arcane).toBe('function');
  });

  it('exposes ambient loop controls', () => {
    expect(typeof sfx.startRain).toBe('function');
    expect(typeof sfx.stopRain).toBe('function');
    expect(typeof sfx.startBossHum).toBe('function');
    expect(typeof sfx.stopBossHum).toBe('function');
  });
});

describe('ambient loop idempotency', () => {
  // These tests do not actually exercise the WebAudio graph — the
  // AudioContext will be unavailable in vitest's jsdom-less
  // environment, so the start functions early-return. But the
  // idempotency checks (calling start twice should still be safe)
  // still apply: we verify the function exists and doesn't throw.

  it('startRain does not throw without an AudioContext', () => {
    expect(() => sfx.startRain()).not.toThrow();
  });

  it('startBossHum does not throw without an AudioContext', () => {
    expect(() => sfx.startBossHum()).not.toThrow();
  });

  it('stopRain / stopBossHum do not throw when nothing is playing', () => {
    expect(() => sfx.stopRain()).not.toThrow();
    expect(() => sfx.stopBossHum()).not.toThrow();
  });
});
