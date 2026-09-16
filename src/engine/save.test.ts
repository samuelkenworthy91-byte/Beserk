import { describe, it, expect, beforeEach } from 'vitest';
import {
  newCampaign, saveCampaign, loadCampaign, clearCampaign,
  saveSuspend, loadSuspend, clearSuspend, applyVictory,
  type CampaignSave,
} from './save';
import { BattleEngine } from './battle';
import { CHAPTER_1 } from '../data/chapter1';

// Minimal in-memory Storage so the save layer can be exercised under Node.
class MemStorage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
}

beforeEach(() => {
  (globalThis as unknown as { localStorage: Storage }).localStorage =
    new MemStorage() as unknown as Storage;
});

describe('campaign save', () => {
  it('starts a new chronicle at chapter 1 with nobody lost', () => {
    const c = newCampaign();
    expect(c.unlockedChapters).toBe(1);
    expect(c.party).toEqual([]);
    expect(c.fallen).toEqual([]);
    expect(c.totalTurns).toBe(0);
  });

  it('round-trips through storage', () => {
    const c: CampaignSave = {
      unlockedChapters: 2,
      party: [{ defId: 'guts', level: 3, exp: 40, hp: 21, stats: { hp: 28, str: 11, skl: 6, spd: 7, lck: 4, def: 6, res: 2, mov: 5, con: 9 }, items: [{ id: 'greatsword', uses: 33 }] }],
      fallen: ['bren'],
      totalTurns: 9,
    };
    saveCampaign(c);
    expect(loadCampaign()).toEqual(c);
  });

  it('returns null when empty and after clearing', () => {
    expect(loadCampaign()).toBeNull();
    saveCampaign(newCampaign());
    expect(loadCampaign()).not.toBeNull();
    clearCampaign();
    expect(loadCampaign()).toBeNull();
  });

  it('survives corrupt JSON without throwing', () => {
    localStorage.setItem('bsaga_campaign_v1', '{ not json');
    expect(() => loadCampaign()).not.toThrow();
    expect(loadCampaign()).toBeNull();
  });

  it('round-trips defeated and bossesDefeated (Field Guide state)', () => {
    const c: CampaignSave = {
      unlockedChapters: 9,
      party: [],
      fallen: [],
      totalTurns: 80,
      defeated: ['e_soldier', 'bazuso', 'casca'],
      bossesDefeated: ['bazuso'],
    };
    saveCampaign(c);
    const loaded = loadCampaign();
    expect(loaded).not.toBeNull();
    expect(loaded!.defeated).toEqual(['e_soldier', 'bazuso', 'casca']);
    expect(loaded!.bossesDefeated).toEqual(['bazuso']);
  });

  it('a save without the new fields still loads (back-compat with old saves)', () => {
    // older builds didn't write defeated/bossesDefeated; the loader must
    // not choke on the missing keys and the consumers must treat them as []
    const legacy = {
      unlockedChapters: 4,
      party: [],
      fallen: [],
      totalTurns: 30,
    };
    saveCampaign(legacy as CampaignSave);
    const loaded = loadCampaign();
    expect(loaded).not.toBeNull();
    // Both fields are optional, so they may be undefined. Consumers
    // should default to [] when undefined — this is the contract tested by
    // the consumer side in components/FieldGuide.
    expect(loaded!.defeated ?? []).toEqual([]);
    expect(loaded!.bossesDefeated ?? []).toEqual([]);
  });
});

describe('battle suspend / resume', () => {
  it('restores position, HP, turn and acted-state', () => {
    const eng = new BattleEngine(CHAPTER_1, null);
    const guts = eng.players().find(u => u.defId === 'guts')!;
    guts.x = 6; guts.y = 5; guts.hp = 11; guts.moved = true; guts.exp = 55;
    eng.turn = 4;

    const eng2 = new BattleEngine(CHAPTER_1, null, eng.snapshot());
    const guts2 = eng2.players().find(u => u.defId === 'guts')!;
    expect(eng2.turn).toBe(4);
    expect([guts2.x, guts2.y]).toEqual([6, 5]);
    expect(guts2.hp).toBe(11);
    expect(guts2.moved).toBe(true);
    expect(guts2.exp).toBe(55);
  });

  it('preserves encounter pacing state', () => {
    const eng = new BattleEngine(CHAPTER_1, null);
    const boss = eng.enemies().find(u => u.defId === 'bazuso')!;
    boss.active = true; boss.raged = true; boss.ai = 'attack';
    const picket = eng.enemies().filter(u => u.group === 'picket');
    picket.forEach(u => { u.active = true; });

    const eng2 = new BattleEngine(CHAPTER_1, null, eng.snapshot());
    const boss2 = eng2.enemies().find(u => u.defId === 'bazuso')!;
    expect(boss2.raged).toBe(true);
    expect(boss2.active).toBe(true);
    expect(boss2.ai).toBe('attack');
    expect(eng2.enemies().filter(u => u.group === 'picket').every(u => u.active)).toBe(true);
    // untouched squads stay asleep
    expect(eng2.enemies().filter(u => u.group === 'gate').every(u => !u.active)).toBe(true);
  });

  it('keeps the dead dead and preserves weapon durability', () => {
    const eng = new BattleEngine(CHAPTER_1, null);
    const victim = eng.enemies()[0];
    victim.dead = true;
    const guts = eng.players().find(u => u.defId === 'guts')!;
    guts.items[0].uses = 17;

    const eng2 = new BattleEngine(CHAPTER_1, null, eng.snapshot());
    expect(eng2.units.filter(u => u.dead).length).toBe(1);
    const guts2 = eng2.players().find(u => u.defId === 'guts')!;
    expect(guts2.items[0].uses).toBe(17);
  });

  it('writes and reads a suspend record', () => {
    const eng = new BattleEngine(CHAPTER_1, null);
    eng.turn = 3;
    saveSuspend({ campaign: newCampaign(), battle: eng.snapshot(), savedAt: 123 });
    const s = loadSuspend();
    expect(s).not.toBeNull();
    expect(s!.battle.turn).toBe(3);
    expect(s!.battle.chapterId).toBe(1);
    clearSuspend();
    expect(loadSuspend()).toBeNull();
  });
});

describe('initial encounter state', () => {
  it('deploys the player party awake and the garrison asleep', () => {
    const eng = new BattleEngine(CHAPTER_1, null);
    expect(eng.players().length).toBe(4);
    expect(eng.players().every(u => u.active)).toBe(true);
    expect(eng.enemies().length).toBe(8);
    expect(eng.enemies().every(u => !u.active)).toBe(true);
  });

  it('gives Bazuso his holding AI and both signature traits are assigned', () => {
    const eng = new BattleEngine(CHAPTER_1, null);
    const boss = eng.enemies().find(u => u.defId === 'bazuso')!;
    expect(boss.ai).toBe('boss');
    expect(boss.raged).toBeFalsy();
    expect(boss.traits).toContain('unflinching');
    const guts = eng.players().find(u => u.defId === 'guts')!;
    expect(guts.traits).toContain('sunder');
    expect(guts.essential).toBe(true);
  });

  it('applies saved party progress on deployment', () => {
    const campaign = newCampaign();
    campaign.party = [{
      defId: 'guts', level: 5, exp: 20, hp: 30,
      stats: { hp: 30, str: 14, skl: 8, spd: 8, lck: 5, def: 7, res: 3, mov: 5, con: 9 },
      items: [{ id: 'greatsword', uses: 20 }],
    }];
    const eng = new BattleEngine(CHAPTER_1, campaign);
    const guts = eng.players().find(u => u.defId === 'guts')!;
    expect(guts.level).toBe(5);
    expect(guts.stats.str).toBe(14);
    expect(guts.hp).toBe(30);
  });

  it('honours permadeath from a previous chapter', () => {
    const campaign = newCampaign();
    campaign.fallen = ['bren'];
    const eng = new BattleEngine(CHAPTER_1, campaign);
    expect(eng.players().find(u => u.defId === 'bren')).toBeUndefined();
    expect(eng.players().length).toBe(3);
  });
});

describe('applyVictory', () => {
  const baseStats = { hp: 30, str: 10, skl: 8, spd: 9, lck: 4,
                      def: 6, res: 3, mov: 5, con: 8 };

  it('unlocks the next chapter', () => {
    const next = applyVictory(
      null, 1, 'bazuso',
      { party: [{ defId: 'guts', level: 3, exp: 0,
                  stats: baseStats, items: [], hp: 30 }],
        fallen: ['e_soldier', 'bazuso'] },
      ['e_soldier', 'bazuso'],
      6,
    );
    expect(next.unlockedChapters).toBe(2);
  });

  it('records the boss in bossesDefeated', () => {
    const next = applyVictory(
      null, 1, 'bazuso',
      { party: [], fallen: ['bazuso'] },
      ['bazuso'], 4,
    );
    expect(next.bossesDefeated).toEqual(['bazuso']);
  });

  it('records every defeated defId into the Bestiary', () => {
    const next = applyVictory(
      null, 3, 'c_rebel',
      { party: [], fallen: ['e_soldier', 'e_fighter', 'e_archer', 'c_rebel'] },
      ['e_soldier', 'e_fighter', 'e_archer', 'c_rebel'], 7,
    );
    expect(next.defeated!.sort()).toEqual(
      ['c_rebel', 'e_archer', 'e_fighter', 'e_soldier']);
    // the boss is in both lists — once for the trophy, once in the
    // bestiary (it's another entry, not special).
    expect(next.bossesDefeated).toEqual(['c_rebel']);
  });

  it('does not double-count on a second clear', () => {
    const first = applyVictory(null, 1, 'bazuso',
      { party: [], fallen: ['bazuso', 'e_soldier'] },
      ['bazuso', 'e_soldier'], 4);
    const second = applyVictory(first, 2, 'griffith',
      { party: [], fallen: ['griffith', 'e_soldier'] },
      ['griffith', 'e_soldier'], 5);
    expect(second.bossesDefeated!.sort()).toEqual(['bazuso', 'griffith']);
    // 'e_soldier' appears in two rounds; Set dedupe collapses to one entry
    expect(second.defeated!.filter(d => d === 'e_soldier').length).toBe(1);
  });

  it('purges the dead from the roster', () => {
    const next = applyVictory(null, 1, 'bazuso',
      { party: [
          { defId: 'bren',  level: 1, exp: 0, stats: baseStats, items: [], hp: 25 },
          { defId: 'wyatt', level: 1, exp: 0, stats: baseStats, items: [], hp: 25 },
        ],
        fallen: ['wyatt'] },
      [], 4);
    expect(next.party.map(p => p.defId)).toEqual(['bren']);
  });

  it('caps unlockedChapters at 14', () => {
    const next = applyVictory(null, 14, 'femto',
      { party: [], fallen: [] }, [], 9);
    expect(next.unlockedChapters).toBe(14);
  });
});
