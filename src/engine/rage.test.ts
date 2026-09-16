import { describe, it, expect } from 'vitest';
import { BattleEngine, type EngineEvent } from './battle';
import { CHAPTER_1 } from '../data/chapter1';
import { fxKindFor } from './fx';

// ─────────────────── boss-rage engine event ───────────────────
//
// Chapter 1's boss is Bazuso. He starts asleep and rages on wake.
// We assert the new 'rage' EngineEvent is emitted and only emitted
// once.

describe('boss rage event', () => {
  it('emits a rage event when the boss wakes', () => {
    const eng = new BattleEngine(CHAPTER_1, null);
    const bazuso = eng.units.find(u => u.defId === 'bazuso')!;
    expect(bazuso).toBeTruthy();
    expect(bazuso.raged ?? false).toBe(false);

    // Bazuso sits at (11,5) with aggro=2 — place Guts inside that
    // bubble so evaluateTriggers will wake + rage him.
    const gut = eng.players().find(u => u.defId === 'guts')!;
    gut.x = 11; gut.y = 6;
    (eng as unknown as { evaluateTriggers: () => void }).evaluateTriggers();

    expect(bazuso.raged ?? false).toBe(true);

    const rageEvents = eng.events.filter(e => e.type === 'rage') as
      Array<Extract<EngineEvent, { type: 'rage' }>>;
    expect(rageEvents.length).toBe(1);
    expect(rageEvents[0].unit.defId).toBe('bazuso');
  });

  it('does not re-emit rage if wake fires twice', () => {
    const eng = new BattleEngine(CHAPTER_1, null);
    const gut = eng.players().find(u => u.defId === 'guts')!;
    gut.x = 11; gut.y = 6;
    // call evaluateTriggers twice — first wakes + rages, second no-ops
    (eng as unknown as { evaluateTriggers: () => void }).evaluateTriggers();
    (eng as unknown as { evaluateTriggers: () => void }).evaluateTriggers();
    const rageEvents = eng.events.filter(e => e.type === 'rage');
    expect(rageEvents.length).toBe(1);
  });

  it('fxKindFor classifies the boss class', () => {
    // bazuso uses 'Warlord' — should resolve to a non-default kind
    const k = fxKindFor('Warlord');
    expect(k).toBe('warlord');
  });
});
