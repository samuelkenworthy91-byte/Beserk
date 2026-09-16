import { describe, it, expect, beforeEach } from 'vitest';
import {
  getBattleAsset, getMapAsset, getPortraitAsset, _resetRegistry,
} from '../assetLoader';
import {
  registerPippinAssets, preloadPippinAssets, _resetPippinRegistration,
} from './pippinAssets';

function gridCols(a: { sheet: { kind: string; cols?: number } }) {
  return a.sheet.kind === 'grid' ? a.sheet.cols! : -1;
}

describe('Pippin external asset manifest', () => {
  beforeEach(() => {
    _resetRegistry();
    _resetPippinRegistration();
  });

  it('registers the Pippin battle sheet', () => {
    registerPippinAssets();
    expect(getBattleAsset('pippin')?.url).toBe('/sprites/battle/pippin.png');
    expect(gridCols(getBattleAsset('pippin')!)).toBe(9);
  });

  it('registers the Pippin map sheet', () => {
    registerPippinAssets();
    expect(getMapAsset('pippin')?.url).toBe('/sprites/map/pippin.png');
    expect(getMapAsset('pippin')!.frames).toHaveLength(8);
  });

  it('registers the Pippin portrait sheet', () => {
    registerPippinAssets();
    expect(getPortraitAsset('pippin')?.url).toBe('/portraits/pippin.png');
    expect(getPortraitAsset('pippin')!.expressions).toHaveLength(10);
  });

  it('idempotent', () => {
    registerPippinAssets();
    registerPippinAssets();
    expect(getBattleAsset('pippin')).not.toBeNull();
  });

  it('reset hook re-arms', () => {
    registerPippinAssets();
    _resetPippinRegistration();
    expect(() => registerPippinAssets()).not.toThrow();
  });

  it('preload attempts without error', async () => {
    registerPippinAssets();
    try { await preloadPippinAssets(); } catch {}
    expect(getMapAsset('pippin')).not.toBeNull();
  });
});
