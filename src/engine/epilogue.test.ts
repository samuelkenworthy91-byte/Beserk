import { describe, it, expect } from 'vitest';
import { EPILOGUE_CARDS, EPILOGUE_CLOSING } from '../data/epilogue';

// ─────────────────── epilogue data integrity ───────────────────
//
// The end-screen epilogue plays after chapter 14 victory. The cards
// are a fixed farewell sequence and the closing line is a single
// hard-coded credit. These tests pin the contract: every speaker has
// a portrait key, the closing line is a single string, and the
// farewell-tone count matches the Hawk roster that survives chapter
// 14 (Guts/Casca/Judeau/Corkus/Pippin/Rickert).

describe('epilogue data', () => {
  it('has cards', () => {
    expect(EPILOGUE_CARDS.length).toBeGreaterThan(5);
  });

  it('closing line is a single non-empty string', () => {
    expect(typeof EPILOGUE_CLOSING).toBe('string');
    expect(EPILOGUE_CLOSING.length).toBeGreaterThan(4);
    expect(EPILOGUE_CLOSING).toContain('End of Campaign');
  });

  it('every speaker-card has a portrait key', () => {
    const speakers = EPILOGUE_CARDS.filter(c => c.speaker !== 'none');
    expect(speakers.length).toBeGreaterThan(0);
    for (const card of speakers) {
      expect(card.portrait, `${card.id} should have portrait`).toBeTruthy();
      // portraits are lowercase defIds
      expect(card.portrait!.length).toBeGreaterThan(0);
    }
  });

  it('covers the full Hawk reunion (chapter 14 roster)', () => {
    const expectedHawks = ['guts', 'casca', 'judeau', 'corkus', 'pippin', 'rickert'];
    const spokenPortraits = new Set(
      EPILOGUE_CARDS
        .filter(c => c.portrait)
        .map(c => c.portrait!),
    );
    for (const h of expectedHawks) {
      expect(spokenPortraits.has(h), `${h} should speak in epilogue`).toBe(true);
    }
  });

  it('has narrative bookends (open + close)', () => {
    // the first card should be narration
    expect(EPILOGUE_CARDS[0].speaker).toBe('none');
    expect(EPILOGUE_CARDS[0].tone).toBe('narration');
    // the closing-tone card before EPILOGUE_CLOSING is Guts's line
    const lastSpeakerCard = EPILOGUE_CARDS[EPILOGUE_CARDS.length - 1];
    expect(lastSpeakerCard.speaker).toBe('none');
    expect(lastSpeakerCard.tone).toBe('closing');
  });

  it('every card has a non-empty line', () => {
    for (const card of EPILOGUE_CARDS) {
      expect(card.text.length, `${card.id} text`).toBeGreaterThan(20);
    }
  });

  it('card ids are unique', () => {
    const ids = EPILOGUE_CARDS.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
