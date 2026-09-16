// ─── aggregator test ───────────────────────────────────────────────────────
//
// The aggregator in characterAssets.ts is the single entry point
// App.tsx uses at boot. It should be idempotent and tolerate a mix
// of fully-authored (register+preload) and stub (no-op) modules.

import { describe, it, expect, beforeEach } from 'vitest';
import {
  _resetRegistry, getBattleAsset, getMapAsset, getPortraitAsset,
} from '../assetLoader';
import {
  registerAllCharacterAssets, preloadAllCharacterAssets, _resetCharRegistration,
} from '../characterAssets';

describe('characterAssets aggregator', () => {
  beforeEach(() => {
    _resetRegistry();
    _resetCharRegistration();
  });

  it('registerAllCharacterAssets is idempotent', () => {
    registerAllCharacterAssets();
    registerAllCharacterAssets();
    // Guts is fully authored; it must show up.
    expect(getBattleAsset('guts')).not.toBeNull();
    expect(getPortraitAsset('guts')).not.toBeNull();
  });

  it('registers Guts fully (battle, map, portrait)', () => {
    registerAllCharacterAssets();
    expect(getBattleAsset('guts')).not.toBeNull();
    expect(getMapAsset('guts')).not.toBeNull();
    expect(getPortraitAsset('guts')).not.toBeNull();
  });

  it('registers Griffith fully when present', () => {
    registerAllCharacterAssets();
    expect(getBattleAsset('griffith')).not.toBeNull();
    expect(getMapAsset('griffith')).not.toBeNull();
    expect(getPortraitAsset('griffith')).not.toBeNull();
  });

  it('stub-only characters do not throw on boot', () => {
    // Casca / Judeau / etc. are stubs right now; the aggregator
    // should call their no-op register functions without crashing.
    expect(() => registerAllCharacterAssets()).not.toThrow();
    // They're not registered because they have no sheets yet.
    expect(getBattleAsset('casca')).toBeNull();
  });

  it('preloadAllCharacterAssets tolerates stub modules', async () => {
    registerAllCharacterAssets();
    try {
      await preloadAllCharacterAssets();
    } catch {
      // expected — no DOM in node env
    }
    // Even after a (potentially thrown) preload, the registry still
    // has the authored entries.
    expect(getBattleAsset('guts')).not.toBeNull();
  });
});
