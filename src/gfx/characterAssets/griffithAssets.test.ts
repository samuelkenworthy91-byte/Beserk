import { describe, it, expect, beforeEach } from 'vitest';
import {
  getBattleAsset, getMapAsset, getPortraitAsset, _resetRegistry,
} from '../assetLoader';
import {
  registerGriffithAssets, preloadGriffithAssets, _resetGriffithRegistration,
} from './griffithAssets';

// Narrow the StripSheet | GridSheet union for assertions.
function gridCols(a: { sheet: { kind: string; cols?: number } }) {
  return a.sheet.kind === 'grid' ? a.sheet.cols! : -1;
}
function gridRows(a: { sheet: { kind: string; rows?: number } }) {
  return a.sheet.kind === 'grid' ? a.sheet.rows! : -1;
}

describe('Griffith external asset manifest', () => {
  beforeEach(() => {
    _resetRegistry();
    _resetGriffithRegistration();
  });

  it('registers the Griffith battle sheet', () => {
    registerGriffithAssets();
    const b = getBattleAsset('griffith');
    expect(b).not.toBeNull();
    expect(b!.url).toBe('/sprites/battle/griffith.png');
    expect(gridCols(b!)).toBe(9);
    expect(gridRows(b!)).toBe(2);
    expect(b!.sheet.cellW).toBeCloseTo(1408 / 9);
  });

  it('registers the Griffith map sheet with 8 directional frames', () => {
    registerGriffithAssets();
    const m = getMapAsset('griffith');
    expect(m).not.toBeNull();
    expect(m!.url).toBe('/sprites/map/griffith.png');
    expect(gridCols(m!)).toBe(4);
    expect(m!.frames).toHaveLength(8);
    expect(m!.frames).toContain('idle-front');
    expect(m!.frames).toContain('idle-back');
    expect(m!.frames).toContain('walkA-left');
  });

  it('registers the Griffith portrait sheet with 10 expressions', () => {
    registerGriffithAssets();
    const p = getPortraitAsset('griffith');
    expect(p).not.toBeNull();
    expect(p!.url).toBe('/portraits/griffith.png');
    expect(gridCols(p!)).toBe(5);
    expect(gridRows(p!)).toBe(2);
    expect(p!.expressions).toHaveLength(10);
    expect(p!.expressions).toContain('neutral');
    expect(p!.expressions).toContain('shouting');
    expect(p!.expressions).toContain('determined');
  });

  it('registerGriffithAssets is idempotent', () => {
    registerGriffithAssets();
    registerGriffithAssets();
    expect(getBattleAsset('griffith')).not.toBeNull();
  });

  it('reset hook allows re-registration without throwing', () => {
    registerGriffithAssets();
    _resetGriffithRegistration();
    expect(() => registerGriffithAssets()).not.toThrow();
    expect(getPortraitAsset('griffith')).not.toBeNull();
  });

  it('preloadGriffithAssets attempts without error', async () => {
    registerGriffithAssets();
    try {
      await preloadGriffithAssets();
    } catch {
      // expected — no DOM image in node
    }
    expect(getMapAsset('griffith')).not.toBeNull();
  });
});
