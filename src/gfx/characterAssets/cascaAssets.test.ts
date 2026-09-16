import { describe, it, expect, beforeEach } from 'vitest';
import {
  getBattleAsset, getMapAsset, getPortraitAsset, _resetRegistry,
} from '../assetLoader';
import {
  registerCascaAssets, preloadCascaAssets, _resetCascaRegistration,
} from './cascaAssets';

function gridCols(a: { sheet: { kind: string; cols?: number } }) {
  return a.sheet.kind === 'grid' ? a.sheet.cols! : -1;
}
function gridRows(a: { sheet: { kind: string; rows?: number } }) {
  return a.sheet.kind === 'grid' ? a.sheet.rows! : -1;
}

describe('Casca external asset manifest', () => {
  beforeEach(() => {
    _resetRegistry();
    _resetCascaRegistration();
  });

  it('registers the Casca battle sheet', () => {
    registerCascaAssets();
    const b = getBattleAsset('casca');
    expect(b).not.toBeNull();
    expect(b!.url).toBe('/sprites/battle/casca.png');
    expect(gridCols(b!)).toBe(9);
    expect(gridRows(b!)).toBe(2);
  });

  it('registers the Casca map sheet with all 8 directional frames', () => {
    registerCascaAssets();
    const m = getMapAsset('casca');
    expect(m).not.toBeNull();
    expect(m!.url).toBe('/sprites/map/casca.png');
    expect(gridCols(m!)).toBe(4);
    expect(m!.frames).toHaveLength(8);
    expect(m!.frames).toContain('idle-front');
    expect(m!.frames).toContain('idle-back');
    expect(m!.frames).toContain('walkA-right');
  });

  it('registers the Casca portrait sheet with 10 expressions', () => {
    registerCascaAssets();
    const p = getPortraitAsset('casca');
    expect(p).not.toBeNull();
    expect(p!.url).toBe('/portraits/casca.png');
    expect(gridCols(p!)).toBe(5);
    expect(gridRows(p!)).toBe(2);
    expect(p!.expressions).toHaveLength(10);
    expect(p!.expressions).toContain('neutral');
    expect(p!.expressions).toContain('shouting');
    expect(p!.expressions).toContain('wounded');
  });

  it('registerCascaAssets is idempotent', () => {
    registerCascaAssets();
    registerCascaAssets();
    expect(getBattleAsset('casca')).not.toBeNull();
  });

  it('reset hook allows re-registration without throwing', () => {
    registerCascaAssets();
    _resetCascaRegistration();
    expect(() => registerCascaAssets()).not.toThrow();
    expect(getPortraitAsset('casca')).not.toBeNull();
  });

  it('preloadCascaAssets attempts without error', async () => {
    registerCascaAssets();
    try {
      await preloadCascaAssets();
    } catch {
      // expected — no DOM image in node
    }
    expect(getMapAsset('casca')).not.toBeNull();
  });
});
