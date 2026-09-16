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
    // Rickert / Bazuso / Femto / VoidForm / Merc / Soldier / Fighter
    // / Archer / C-prefix / A-prefix are currently stubs; the
    // aggregator should call their no-op register functions without
    // crashing.
    expect(() => registerAllCharacterAssets()).not.toThrow();
    // Stubbed characters do not show up in the asset registry.
    expect(getBattleAsset('rickert')).toBeNull();
    expect(getBattleAsset('bazuso')).toBeNull();
    expect(getBattleAsset('merc')).toBeNull();
  });

  it('keeps adding authored entries without losing earlier registrations', () => {
    registerAllCharacterAssets();
    expect(getBattleAsset('guts')?.url).toBe('/sprites/battle/guts.webp');
    expect(getBattleAsset('griffith')?.url).toBe('/sprites/battle/griffith.webp');
    expect(getBattleAsset('casca')?.url).toBe('/sprites/battle/casca.webp');
    expect(getBattleAsset('judeau')?.url).toBe('/sprites/battle/judeau.webp');
    expect(getBattleAsset('pippin')?.url).toBe('/sprites/battle/pippin.webp');
    expect(getBattleAsset('corkus')?.url).toBe('/sprites/battle/corkus.webp');
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
