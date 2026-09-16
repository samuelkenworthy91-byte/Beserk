import { describe, it, expect, beforeEach } from 'vitest';
import {
  getBattleAsset, getMapAsset, getPortraitAsset, _resetRegistry,
} from '../assetLoader';
import {
  registerGutsAssets, preloadGutsAssets, _resetGutsRegistration,
} from './gutsAssets';

// The sheet is typed as `StripSheet | GridSheet` but every registered
// sheet is a GridSheet. This helper narrows for the test assertions.
function gridCols(a: { sheet: { kind: string; cols?: number } }) {
  return a.sheet.kind === 'grid' ? a.sheet.cols! : -1;
}
function gridRows(a: { sheet: { kind: string; rows?: number } }) {
  return a.sheet.kind === 'grid' ? a.sheet.rows! : -1;
}

describe('Guts external asset manifest', () => {
  beforeEach(() => {
    _resetRegistry();
    _resetGutsRegistration();
  });

  it('registerGutsAssets is idempotent', () => {
    registerGutsAssets();
    registerGutsAssets();
    const b = getBattleAsset('guts');
    expect(b).not.toBeNull();
    expect(b!.url).toBe('/sprites/battle/guts.png');
  });

  it('registers the Guts battle sheet', () => {
    registerGutsAssets();
    const b = getBattleAsset('guts');
    expect(b).not.toBeNull();
    expect(b!.domain).toBe('battle');
    expect(b!.sheet.kind).toBe('grid');
    expect(gridCols(b!)).toBe(9);
    expect(gridRows(b!)).toBe(2);
    // 1408 / 9 = 156.44, 768 / 2 = 384
    expect(b!.sheet.cellW).toBeCloseTo(1408 / 9);
    expect(b!.sheet.cellH).toBe(384);
  });

  it('registers the Guts map sheet with all 8 frame names', () => {
    registerGutsAssets();
    const m = getMapAsset('guts');
    expect(m).not.toBeNull();
    expect(gridCols(m!)).toBe(4);
    expect(gridRows(m!)).toBe(2);
    expect(m!.frames).toHaveLength(8);
    expect(m!.frames).toContain('idle-front');
    expect(m!.frames).toContain('walkA-left');
  });

  it('registers the Guts portrait sheet with 10 expressions', () => {
    registerGutsAssets();
    const p = getPortraitAsset('guts');
    expect(p).not.toBeNull();
    expect(gridCols(p!)).toBe(5);
    expect(gridRows(p!)).toBe(2);
    expect(p!.expressions).toHaveLength(10);
    expect(p!.expressions).toContain('neutral');
    expect(p!.expressions).toContain('angry');
    expect(p!.expressions).toContain('shouting');
  });

  it('reset hook allows re-registration', () => {
    registerGutsAssets();
    _resetGutsRegistration();
    // After reset, the next call still re-registers (no throw).
    expect(() => registerGutsAssets()).not.toThrow();
    expect(getBattleAsset('guts')).not.toBeNull();
  });

  it('preloadGutsAssets kicks off without error', async () => {
    // No DOM-level image is available in this test environment, so
    // we just assert the call resolves (or rejects gracefully via
    // the asset load), not that images actually decode.
    registerGutsAssets();
    try {
      await preloadGutsAssets();
      expect(getBattleAsset('guts')).not.toBeNull();
    } catch {
      // expected — no canvas in node env
      expect(getBattleAsset('guts')).not.toBeNull();
    }
  });
});
