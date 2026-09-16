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
    expect(getBattleAsset('corkus')?.url).toBe('/sprites/battle/corkus.webp');
    expect(gridCols(getBattleAsset('corkus')!)).toBe(9);
  });

  it('registers no Corkus map/portrait sheet (not yet authored)', () => {
    registerCorkusAssets();
    // Map and portrait fall back to the code-authored renderer for now.
    expect(getMapAsset('corkus')).toBeNull();
    expect(getPortraitAsset('corkus')).toBeNull();
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
