import { describe, it, expect } from 'vitest';
import {
  listPortraits, hasPortrait, supportsExpression,
} from './portraits';
import {
  PORTRAIT_ART, HAS_EXPRESSIONS, EXPRESSIONS,
} from './portraitArt';
import type { Expression } from './portraitArt';

// ─── Portrait registry integrity ─────────────────────────────────────────────
// Phase 3 of the project plan: replace procedural portraits with authored
// pixel art for every named character. The portrait system must:
//   1. resolve every portrait id a chapter / dialogue can name
//   2. flag which keys support non-neutral expressions
//   3. never let an undefined portrait crash a dialogue line
// This is mostly structural — the rendering itself happens in the browser —
// but it catches the most common regression: a character was added to a
// dialogue line but the portrait id was never registered.

describe('portrait registry', () => {
  it('every named character in the campaign has an authored portrait', () => {
    // Characters the story is allowed to name in any chapter. If a chapter
    // introduces a new character, add them here AND to PORTRAIT_ART in the
    // same change.
    const required = [
      'guts', 'griffith', 'casca',
      'wyatt', 'bren', 'sena', 'bazuso',
      'judeau', 'pippin', 'corkus', 'rickert',
    ];
    for (const k of required) {
      expect(hasPortrait(k), `missing portrait for ${k}`).toBe(true);
      expect(PORTRAIT_ART[k], `missing PORTRAIT_ART row for ${k}`).toBeDefined();
      expect(PORTRAIT_ART[k].length, `${k} portrait is empty`).toBe(96);
    }
  });

  it('every named character supports the four expression overlays', () => {
    // Bazuso wears a great-helm — the visor hides his eyes and mouth, so the
    // expression patches would land on metal and look wrong. He only needs
    // the neutral portrait.
    for (const k of ['guts', 'griffith', 'casca',
      'wyatt', 'bren', 'sena',
      'judeau', 'pippin', 'corkus', 'rickert']) {
      expect(HAS_EXPRESSIONS.has(k), `${k} should support expressions`).toBe(true);
      for (const expr of ['angry', 'injured', 'shocked'] as Expression[]) {
        expect(supportsExpression(k, expr), `${k} missing ${expr}`).toBe(true);
      }
    }
  });

  it('every expression overlay defines at least one patch', () => {
    // The build pipeline silently no-ops an expression with zero patches, so
    // we want to fail loud if a future edit accidentally empties one.
    for (const expr of ['angry', 'injured', 'shocked'] as Expression[]) {
      expect(EXPRESSIONS[expr].length, `${expr} has no patches`).toBeGreaterThan(0);
    }
  });

  it('listPortraits reports the full cast', () => {
    const keys = listPortraits().map((p: { key: string }) => p.key);
    for (const required of ['guts', 'griffith', 'casca', 'judeau', 'pippin', 'corkus', 'rickert']) {
      expect(keys).toContain(required);
    }
  });

  it('hasPortrait returns false for unknown keys without throwing', () => {
    expect(hasPortrait('nonexistent')).toBe(false);
    expect(hasPortrait(undefined)).toBe(false);
    expect(supportsExpression('nonexistent', 'angry')).toBe(false);
  });
});
