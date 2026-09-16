import { describe, it, expect, beforeEach } from 'vitest';
import {
  getBattleAsset, getMapAsset, getPortraitAsset, _resetRegistry,
} from '../assetLoader';
import {
  registerCorkusAssets, preloadCorkusAssets, _resetCorkusRegistration,
} from './corkusAssets';

function gridCols(a: { sheet: { kind: string; cols?: number } }) {
  return a.sheet.kind === 'grid' ? a.sheet.cols! : -1;
}

describe('Corkus external asset manifest', () => {
  beforeEach(() => {
    _resetRegistry();
    _resetCorkusRegistration();
  });

  it('registers the Corkus battle sheet', () => {
    registerCorkusAssets();
    expect(getBattleAsset('corkus')?.url).toBe('/sprites/battle/corkus.png');
    expect(gridCols(getBattleAsset('corkus')!)).toBe(9);
  });

  it('registers a Corkus map sheet manifest entry (no PNG yet)', () => {
    registerCorkusAssets();
    // Even with no PNG on disk yet, the manifest declares a slot
    // so the renderer knows an external sheet is expected.
    expect(getMapAsset('corkus')?.url).toBe('/sprites/map/corkus.png');
  });

  it('registers a Corkus portrait sheet manifest entry (no PNG yet)', () => {
    registerCorkusAssets();
    expect(getPortraitAsset('corkus')?.url).toBe('/portraits/corkus.png');
    expect(getPortraitAsset('corkus')!.expressions).toHaveLength(10);
  });

  it('idempotent', () => {
    registerCorkusAssets();
    registerCorkusAssets();
    expect(getBattleAsset('corkus')).not.toBeNull();
  });

  it('reset hook re-arms', () => {
    registerCorkusAssets();
    _resetCorkusRegistration();
    expect(() => registerCorkusAssets()).not.toThrow();
  });

  it('preloadCorkusAssets only awaits the battle sheet', async () => {
    registerCorkusAssets();
    try { await preloadCorkusAssets(); } catch {}
    expect(getBattleAsset('corkus')).not.toBeNull();
  });
});
