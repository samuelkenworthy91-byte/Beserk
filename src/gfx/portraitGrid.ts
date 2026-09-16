// ─── Shared portrait grid utilities ──────────────────────────────────────────
// Lives in its own file so neither portraitArt.ts nor portraitCast*.ts need to
// import each other just to share `M96` and `Rows`. Without this split the
// round-trip import (portraitArt → portraitCast → portraitArt) creates a
// runtime circular reference under vite's ESM loader and `M96` is `undefined`
// when portraitCast executes, throwing "M96 is not a function" at module load.

export type Rows = string[];

/**
 * Pad an authored portrait grid to a strict 96×96 rectangle.
 * Hand-authored rows are trimmed to the last meaningful glyph rather than
 * padded to a full 96 columns; M96 pads them on both axes so the renderer
 * can index into the array without bounds-checking each call.
 */
export const M96 = (rows: Rows): Rows => {
  const out = rows.map(r => r.padEnd(96, '.'));
  while (out.length < 96) out.push('.'.repeat(96));
  return out.slice(0, 96);
};
