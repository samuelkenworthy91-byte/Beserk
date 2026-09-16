import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerAsset, getBattleAsset, getMapAsset, getPortraitAsset,
  BATTLE_FRAME_ORDER, battleColFor, mapColFor, portraitColFor,
  _resetRegistry, type BattleAsset, type MapAsset, type PortraitAsset,
} from './assetLoader';

describe('assetLoader', () => {
  beforeEach(() => _resetRegistry());

  describe('registry', () => {
    it('register/get round-trip for battle', () => {
      const def: BattleAsset = {
        domain: 'battle', key: 'guts', url: '/x.png',
        sheet: { kind: 'grid', cellW: 96, cellH: 96, cols: 9, rows: 2 },
      };
      registerAsset(def);
      expect(getBattleAsset('guts')).toEqual(def);
      expect(getBattleAsset('nope')).toBeNull();
    });
    it('register/get round-trip for map', () => {
      const def: MapAsset = {
        domain: 'map', key: 'guts', url: '/x.png',
        sheet: { kind: 'strip', cellW: 22, cellH: 30, count: 12 },
      };
      registerAsset(def);
      expect(getMapAsset('guts')).toEqual(def);
      expect(getMapAsset('nope')).toBeNull();
    });
    it('register/get round-trip for portrait', () => {
      const def: PortraitAsset = {
        domain: 'portrait', key: 'guts', url: '/x.png',
        sheet: { kind: 'strip', cellW: 96, cellH: 96, count: 8 },
        expressions: ['neutral', 'grim', 'angry', 'shouting', 'wounded', 'eyes-closed', 'side-glance', 'determined'],
      };
      registerAsset(def);
      expect(getPortraitAsset('guts')).toEqual(def);
      expect(getPortraitAsset('nope')).toBeNull();
    });
    it('domains are isolated', () => {
      registerAsset({
        domain: 'battle', key: 'guts', url: '/b.png',
        sheet: { kind: 'grid', cellW: 96, cellH: 96, cols: 9, rows: 2 },
      });
      expect(getMapAsset('guts')).toBeNull();
      expect(getPortraitAsset('guts')).toBeNull();
    });
    it('re-register replaces', () => {
      registerAsset({
        domain: 'battle', key: 'guts', url: '/old.png',
        sheet: { kind: 'grid', cellW: 96, cellH: 96, cols: 9, rows: 2 },
      });
      registerAsset({
        domain: 'battle', key: 'guts', url: '/new.png',
        sheet: { kind: 'grid', cellW: 96, cellH: 96, cols: 9, rows: 2 },
      });
      expect(getBattleAsset('guts')?.url).toBe('/new.png');
    });
  });

  describe('BATTLE_FRAME_ORDER', () => {
    it('has all 9 standard frame names in stable order', () => {
      expect(BATTLE_FRAME_ORDER).toEqual([
        'idle0', 'idle1', 'ready', 'wind', 'swing', 'impact', 'recover', 'hurt', 'dead',
      ]);
    });
    it('battleColFor returns the right index', () => {
      expect(battleColFor('idle0')).toBe(0);
      expect(battleColFor('swing')).toBe(4);
      expect(battleColFor('dead')).toBe(8);
    });
  });

  describe('mapColFor', () => {
    const frames = [
      'idle-front', 'idle-right', 'idle-back', 'idle-left',
      'walkA-front', 'walkA-right', 'walkA-back', 'walkA-left',
    ] as const;
    it('returns the index of the named frame', () => {
      expect(mapColFor([...frames], 'walkA-right')).toBe(5);
    });
    it('returns 0 if frames list is undefined', () => {
      expect(mapColFor(undefined, 'idle-front')).toBe(0);
    });
    it('returns 0 if name is not in the list', () => {
      expect(mapColFor([...frames], 'walkB-front')).toBe(0);
    });
  });

  describe('portraitColFor', () => {
    const asset: PortraitAsset = {
      domain: 'portrait', key: 'guts', url: '/p.png',
      sheet: { kind: 'strip', cellW: 96, cellH: 96, count: 4 },
      expressions: ['neutral', 'angry', 'injured', 'shocked'],
    };
    it('returns the right column for each expression', () => {
      expect(portraitColFor(asset, 'neutral')).toBe(0);
      expect(portraitColFor(asset, 'angry')).toBe(1);
      expect(portraitColFor(asset, 'injured')).toBe(2);
      expect(portraitColFor(asset, 'shocked')).toBe(3);
    });
    it('returns 0 for an expression not in the list', () => {
      expect(portraitColFor(asset, 'shouting' as never)).toBe(0);
    });
  });
});
