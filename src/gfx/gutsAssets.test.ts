import { describe, it, expect, beforeEach } from 'vitest';
import { registerGutsAssets, preloadGutsAssets, _resetGutsRegistration } from './gutsAssets';
import { getBattleAsset, getMapAsset, getPortraitAsset, _resetRegistry } from './assetLoader';

describe('gutsAssets registration', () => {
  beforeEach(() => {
    _resetRegistry();
    _resetGutsRegistration();
  });

  it('registers the three Guts sheets in their respective domains', () => {
    registerGutsAssets();
    expect(getBattleAsset('guts')).toBeTruthy();
    expect(getMapAsset('guts')).toBeTruthy();
    expect(getPortraitAsset('guts')).toBeTruthy();
  });

  it('battle sheet is a 9-col x 2-row grid with row 0 facing right', () => {
    registerGutsAssets();
    const a = getBattleAsset('guts')!;
    expect(a.sheet.kind).toBe('grid');
    if (a.sheet.kind === 'grid') {
      expect(a.sheet.cols).toBe(9);
      expect(a.sheet.rows).toBe(2);
    }
    expect(a.rightRow).toBe(0);
  });

  it('map sheet declares 8 directional frames', () => {
    registerGutsAssets();
    const a = getMapAsset('guts')!;
    expect(a.frames?.length).toBe(8);
    expect(a.frames).toContain('idle-front');
    expect(a.frames).toContain('walkA-left');
  });

  it('portrait sheet covers every Expression variant', () => {
    registerGutsAssets();
    const a = getPortraitAsset('guts')!;
    expect(a.expressions.length).toBe(10);
    for (const required of [
      'neutral', 'grim', 'angry', 'shouting', 'wounded',
      'eyes-closed', 'side-glance', 'shocked', 'determined',
    ] as const) {
      expect(a.expressions).toContain(required);
    }
  });

  it('registerGutsAssets is idempotent', () => {
    registerGutsAssets();
    const first = getBattleAsset('guts');
    registerGutsAssets();
    const second = getBattleAsset('guts');
    expect(first).toBe(second);
  });

  it('preloadGutsAssets does not throw synchronously', async () => {
    const p = preloadGutsAssets();
    // In vitest the Image element is unavailable so the promise will
    // reject; swallow it cleanly so we don't get an unhandled
    // rejection warning.
    p.catch(() => {});
    await new Promise(res => setTimeout(res, 50));
    expect(true).toBe(true);
  });
});
