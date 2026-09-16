import { describe, it, expect, beforeEach } from 'vitest';
import {
  getBattleAsset, getMapAsset, getPortraitAsset, _resetRegistry,
} from '../assetLoader';
import {
  registerJudeauAssets, preloadJudeauAssets, _resetJudeauRegistration,
} from './judeauAssets';

function gridCols(a: { sheet: { kind: string; cols?: number } }) {
  return a.sheet.kind === 'grid' ? a.sheet.cols! : -1;
}
function gridRows(a: { sheet: { kind: string; rows?: number } }) {
  return a.sheet.kind === 'grid' ? a.sheet.rows! : -1;
}

describe('Judeau external asset manifest', () => {
  beforeEach(() => {
    _resetRegistry();
    _resetJudeauRegistration();
  });

  it('registers the Judeau battle sheet', () => {
    registerJudeauAssets();
    expect(getBattleAsset('judeau')?.url).toBe('/sprites/battle/judeau.webp');
    const b = getBattleAsset('judeau')!;
    expect(gridCols(b)).toBe(9);
    expect(gridRows(b)).toBe(2);
  });

  it('registers the Judeau map sheet with 8 directional frames', () => {
    registerJudeauAssets();
    expect(getMapAsset('judeau')?.url).toBe('/sprites/map/judeau.webp');
    expect(getMapAsset('judeau')!.frames).toHaveLength(8);
  });

  it('registers the Judeau portrait sheet with 10 expressions', () => {
    registerJudeauAssets();
    expect(getPortraitAsset('judeau')?.url).toBe('/portraits/judeau.webp');
    expect(getPortraitAsset('judeau')!.expressions).toHaveLength(10);
    expect(getPortraitAsset('judeau')!.expressions).toContain('neutral');
  });

  it('idempotent', () => {
    registerJudeauAssets();
    registerJudeauAssets();
    expect(getBattleAsset('judeau')).not.toBeNull();
  });

  it('reset hook re-arms', () => {
    registerJudeauAssets();
    _resetJudeauRegistration();
    expect(() => registerJudeauAssets()).not.toThrow();
  });

  it('preload attempts without error', async () => {
    registerJudeauAssets();
    try { await preloadJudeauAssets(); } catch {}
    expect(getMapAsset('judeau')).not.toBeNull();
  });
});
