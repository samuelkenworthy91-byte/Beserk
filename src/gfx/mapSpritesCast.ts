import type { Faction } from '../engine/types';

// ─── Tactical map units for the named Band (22×30) ──────────────────────────
// Same construction rules as mapSprites.ts: hand-authored, anchored to the
// bottom of the tile so heads/weapons overhang, two-frame idle with the
// waistline lifting 1px on the second frame for a breathing bob.
//
// Glyph legend is identical:
//
//   .  transparent      1 2 3  armour dark→light      s S t  skin
//   h H  hair dark/lit  l L    leather dark/lit       m M W  metal
//   g    gold           r      accent (cord/crest/bandana)
//   e    eye            b      bone/horn              x      blood/red cloth
//
// Each sprite uses the COLOURS its battle palette would suggest so the
// figure reads as the same character at both scales — map and combat
// share one design, not two.

type Rows = string[];

// ═══ GRIFFITH — slim, white cloak, slender sword ═════════════════════════════
// Narrowest silhouette in the cast (10px shoulders vs Guts' 14px). Sword
// is a 1-pixel rapier held point-down. Cloak falls past the waist on both
// sides and overhangs the bottom row.
const S_GRIFFITH: Rows = [
  '......................',
  '......................',
  '.......bbbb..........',
  '......bBBBBb.........',
  '.....bBaaBBBBb.......',
  '.....bBaaaaaBB.......',
  '.....bBaaaaaab.......',
  '.....baaaaaaa........',
  '.....bassssass.......',
  '......sssss..........',
  '.....sSSSSSs.........',
  '....122221111........',
  '....12222211.........',
  '....122222211........',
  '....122222211........',
  '....s12222211........',
  '....s11222211........',
  '....s1122221.........',
  '....11222111.........',
  '....1111.111.........',
  '....lll1.lll.........',
  '....lll1.lll.........',
  '...lLLll.lLL.........',
  '...llll.llll.........',
  '..llllll.llll........',
  '..hhhhhhhhhhhh.......',
  '..hhhhhhhhhhhh.......',
  '.hhhhhhhhhhhhhh......',
  '.hhhhhhhhhhhhhh......',
  '.hhhhhhhhhhhhhh......',
];

// ═══ CASCA — slim agile, short cropped dark hair, sword and buckler ═════════
// Slightly wider than Griffith (12px shoulders). The buckler is held
// forward on the lead arm — a small round shield, 4×4 pixels. Sword is
// held across the body at rest, ready to draw.
const S_CASCA: Rows = [
  '......................',
  '......................',
  '.......66666.........',
  '......6666666........',
  '......66666666.......',
  '.....6666666666......',
  '.....6666666666......',
  '.....6sssss66........',
  '.....sseess6.........',
  '......ssssss.........',
  '......sSSSSs.........',
  '.....12222111........',
  '....122222111........',
  '....1222222111.......',
  '....1222222111.......',
  '....s122222211.......',
  '....s112222211.......',
  '....s1122221........',
  '....1122211.........',
  '....1111.111g........',
  '....lll1.lllg........',
  '....lll1.ll1.........',
  '...lLLll.lL..........',
  '...llll.lll..........',
  '..lllll.llll.........',
  '..66666.6666.........',
  '..66666666666........',
  '.6666666666666.......',
  '.6666666666666.......',
  '.6666666666666.......',
];

// ═══ JUDEAU — slim scout, easy grin, light hair ═════════════════════════════
// Slightly slimmer than Casca. Wears a scout's hood pushed back off the
// head — short-cropped, no spiky silhouette. The light hair and grin mark
// him as the optimist of the cast. Knife in a hip sheath.
const S_JUDEAU: Rows = [
  '......................',
  '......................',
  '......7.7.7..........',
  '.....7..7..7.........',
  '....7..7...7.........',
  '....7..7..77.........',
  '.....7.7.777.........',
  '......7777777........',
  '.....7ssssss.........',
  '......ssesss.........',
  '......ssssss.........',
  '......sSSSSs.........',
  '....1222211..........',
  '....122222211........',
  '....122222211........',
  '....s12222211........',
  '....s1122221.........',
  '....11222211.........',
  '....11222111.........',
  '....1111.111.........',
  '....lll1.lll.........',
  '....lll1.ll.........',
  '...lLLll.lLL.........',
  '...llll.llll........',
  '..llllll.llll........',
  '..hhhhhhhhhhhh.......',
  '..hhhhhhhhhhhh.......',
  '.hhhhhhhhhhhhhh......',
  '.hhhhhhhhhhhhhh......',
  '.hhhhhhhhhhhhhh......',
];

// ═══ PIPPIN — broad, bald, axe across his back ══════════════════════════════
// Largest silhouette apart from Bazuso — 14px shoulders (matching Guts)
// but shorter so the eye reads "broad man" not "tall man". Carries a heavy
// axe across his back, head projecting above his skull. The axe head is
// the only visible weapon — the haft lies flat against his spine.
const S_PIPPIN: Rows = [
  '......................',
  '......................',
  '.....mm.....mm........',
  '....mMMm...mMMm.......',
  '....mMMm...mMMm.......',
  '....mmmM...Mmmm.......',
  '.....sss...sss........',
  '.....ssesssess........',
  '......ssssss.........',
  '......sSSSSs.........',
  '.....1222221.........',
  '...122222211.........',
  '..12222222211........',
  '..122222222111.......',
  '..122222222211.......',
  '..s12222222111.......',
  '..s1122222221........',
  '...1122222211........',
  '...11222221..........',
  '...1111111.111.......',
  '...lllllll.lll.......',
  '...lLLLLLl.lLl.......',
  '..lLLLLLLl.lLLl......',
  '..lllllll.llll.......',
  '.llllllll.llll.......',
  '..llllll.llll........',
  '...lll..lll..........',
  '...lll..lll..........',
  '....l..l.............',
  '....l..l.............',
];

// ═══ CORKUS — sergeant, short-cropped dark hair, square jaw, axe ════════════
// Wider than Pippin in the chest but shorter; the classic front-row
// sergeant. Square shoulders, axe held upright beside him on the rear edge.
const S_CORKUS: Rows = [
  '......................',
  '......................',
  '.......6666..........',
  '......666666.........',
  '......666666.........',
  '.....66666666........',
  '.....6sss666.........',
  '.....ssesss..........',
  '......ssssss.........',
  '......sSSSSs.........',
  '.....12222221........',
  '....122222211........',
  '....1222222211.......',
  '....12222222111......',
  '....s122222221.......',
  '....s1122222221......',
  '....s112222222.......',
  '....11222222211......',
  '....1112222221.......',
  '....111.1111.........',
  '....lll.lll..........',
  '....lLl.lLl..........',
  '...lLLl.lLLl.........',
  '...llll.llll.........',
  '..llllll.llll........',
  '.lllLLLll.LLLl.......',
  '...mmm...............',
  '..mMMm...............',
  '..mMMMm..............',
  '..mMMm...............',
];

// ═══ RICKERT — youngest, smallest, hammer hanging from belt ═════════════════
// Shortest of the Band — only 24px tall. Bowl-cut hair, small frame, no
// pauldrons. Carries a smith's hammer at his belt — the haft is two pixels
// wide, the head a small block.
const S_RICKERT: Rows = [
  '......................',
  '......................',
  '......777777..........',
  '.....77777777.........',
  '.....77777777.........',
  '.....777777777........',
  '......7777777........',
  '......7sss777........',
  '......ssesss.........',
  '......ssssss.........',
  '......sSSSSs.........',
  '....12222111.........',
  '....122222111........',
  '....122222211........',
  '....s12222221........',
  '....s11222221........',
  '....s1122221.........',
  '....11222211.........',
  '....11222211.........',
  '....1111.111.........',
  '....lll1.lll.........',
  '....lll1.lll.........',
  '...lLLll.lLL.........',
  '...llll.llll........',
  '..llllll.llll........',
  '..hhhhhhhhhhhh.......',
  '..hhhhhhhhhhhh.......',
  '.hhhhhhhhhhhhhh......',
  '.hhhhhhhhhhhhhh......',
  '.hhhhhhhhhhhhhh......',
];

// ─── registry ────────────────────────────────────────────────────────────────
export const MAP_SPRITES: Record<string, Rows> = {
  griffith: S_GRIFFITH,
  casca: S_CASCA,
  judeau: S_JUDEAU,
  pippin: S_PIPPIN,
  corkus: S_CORKUS,
  rickert: S_RICKERT,
};

// ─── palettes ────────────────────────────────────────────────────────────────
// Each named sprite uses the same palette their battle frames use, lifted
// directly so the map unit and the combat unit read as one design at both
// scales. Common ramps come from the shared levies' COMMON palette.

type Pal = Record<string, string>;

const COMMON: Pal = {
  s: '#8d5f3f', S: '#b9835a', t: '#dda87c',
  e: '#141018', g: '#a8791f', b: '#ddd6c0',
  m: '#1b1e25', M: '#5a6373', W: '#9fabbc',
  l: '#1d1208', L: '#3c2614',
  x: '#7d2f28',
};

export const MAP_SPRITE_PALETTES: Record<string, Pal> = {
  // Griffith: white-and-silver to match his battle palette
  griffith: {
    ...COMMON,
    '1': '#2a2e3a', '2': '#454a58', '3': '#5e6378', '4': '#7e849a', '5': '#a8aec2',
    s: '#a07a5e', S: '#c69978', t: '#e8c4a0',
    b: '#5a5e72', B: '#7e8398', h: '#1a1d28', H: '#36394a',
    m: '#5a5e72', M: '#a8aec2', W: '#e8eef6',
  },
  // Casca: dark-haired, leather scout — same dark plate family as a levy
  casca: {
    ...COMMON,
    '1': '#241a12', '2': '#3d2c1c', '3': '#5a4228', '4': '#7a5a36', '5': '#9a7444',
    '6': '#0e0d14', h: '#0e0d14', H: '#1c1b26',
  },
  // Judeau: scout leathers, light auburn hair
  judeau: {
    ...COMMON,
    '1': '#3a2614', '2': '#5e3e22', '3': '#82603a', '4': '#a68250', '5': '#c8a868',
    h: '#3a1e10', H: '#5a3018', '7': '#5a3018',
  },
  // Pippin: largest silhouette, dark leathers, bald
  pippin: {
    ...COMMON,
    '1': '#3a2614', '2': '#5e3e22', '3': '#82603a', '4': '#a68250', '5': '#c8a868',
    m: '#3a3024', M: '#5e5240', W: '#867660',
    s: '#6d4629', S: '#94663b', t: '#b07a44',
  },
  // Corkus: sergeant, dark hair, dark plate
  corkus: {
    ...COMMON,
    '1': '#2a2418', '2': '#4a4030', '3': '#6a6048', '4': '#8c8068', '5': '#b0a488',
    '6': '#0c0a10', h: '#0c0a10', H: '#1a1820',
    m: '#3a342a', M: '#5e564a', W: '#867e6a',
  },
  // Rickert: smallest, apprentice leathers, light hair
  rickert: {
    ...COMMON,
    '1': '#3e2c1a', '2': '#604628', '3': '#826238', '4': '#a67e50', '5': '#caa068',
    h: '#3a1c10', H: '#5e2e18', '7': '#7e4828',
  },
};

// ─── helper used by mapSprites.ts ────────────────────────────────────────────
// Same shape as the existing sprite() helper, but only the named-band
// sprites are looked up through this module; the generic levy sprites
// continue to be served from mapSprites.ts. A faction ring tint is applied
// if the character belongs to one of the faction-tinted palettes — none of
// the named Band currently use one, so this is a no-op for them.

export function tintedFaction(
  _lookId: string, _faction: Faction,
): Faction | null {
  // Reserved for future named cast that should carry a player/enemy ring
  // tint (e.g. an enemy version of Pippin in the Eclipse chapter).
  return null;
}
