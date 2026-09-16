import type { Faction } from '../engine/types';
import { MAP_SPRITES, MAP_SPRITE_PALETTES } from './mapSpritesCast';

// ─── Tactical map units ──────────────────────────────────────────────────────
// Hand-authored 22×30 pixel figures, anchored at the bottom of their 32×32 tile
// so heads/weapons overhang the tile above (standard late-GBA presentation).
// Two-frame idle: frame 1 lifts everything above the waist by 1px, which reads
// as a breathing bob without authoring a second matrix.
//
// Glyph legend:
//   .  transparent      1 2 3  armour dark→light      s S t  skin
//   h H  hair dark/lit  l L    leather dark/lit       m M W  metal
//   g    gold           r      accent (bandana/crest/plume)
//   e    eye            b      bone/horn              x      blood/red cloth

type Rows = string[];

// ═══ GUTS — black spiky mane, dark plate, colossal sword slung on his back ═══
// The slab reaches the full height of the sprite and is 4px thick — against a
// levy's 1px spear it stays unmistakable even at 32px tiles. Shoulders are
// widened to 11px (others sit at 8) so his outline alone identifies him.
const S_GUTS: Rows = [
  '..........mmmmm.......',
  '.........mMMMMMm......',
  '........mMMWWWMMm.....',
  '.......mMMWWWWWMm.....',
  '......mMMWWWWWMMm.....',
  '.....mMMWWWWWMMm......',
  '....hhhhhWWWMMm.......',
  '...hhhhhhhWMMm........',
  '..hhHHHHhhhMMm........',
  '..hhHHHHHhhmm.........',
  '..hsssssshhg..........',
  '..hseseshhg...........',
  '...ssssssg............',
  '..1sSSSSs1............',
  '.111111111gg..........',
  '11112221111gg.........',
  '11122222211g..........',
  '11122222211...........',
  '11122222211s..........',
  '.s1122222211..........',
  '.s112222211...........',
  '..11222221............',
  '..1122211.............',
  '..111.111.............',
  '..111.111.............',
  '..lll.lll.............',
  '..lLl.lLl.............',
  '.llll.llll............',
  '.LLLl.LLLl............',
  '.llll.llll............',
];

// ═══ MERCENARY — mail, blade held low, cloak at the shoulder ════════════════
const S_MERC: Rows = [
  '......................',
  '......................',
  '.......hhhhh..........',
  '......hHHHHHh.........',
  '.....hHHHHHHHh........',
  '.....hsssssshh........',
  '.....hseseshh.........',
  '......ssssss..........',
  '......sSSSSs..........',
  '.....1111111..........',
  '....112222211.........',
  '....1222222211........',
  '...11222222211........',
  '...112222222111.......',
  '...1122222211m........',
  '...s122222211m........',
  '...s11222211mm........',
  '....112222mmm.........',
  '....11221mmm..........',
  '....111.mmW...........',
  '....111.mW............',
  '....lll.W.............',
  '....lLl...............',
  '...lLLl...............',
  '...llll...............',
  '..lLLLl...............',
  '..llll................',
  '......................',
  '......................',
  '......................',
];

// ═══ RAIDER — bandana, bare arms, heavy axe ═════════════════════════════════
const S_FIGHTER: Rows = [
  '......................',
  '......................',
  '.....rrrrrrr..........',
  '....rrrrrrrrr.........',
  '....rr.....rr.........',
  '.....sssssss..........',
  '.....seseshs..........',
  '.....ssssss...........',
  '.....hhhhhh...........',
  '....SS1111SS..........',
  '...SS112211SS.........',
  '...S11222211S....mm...',
  '...S11222211S...mMMm..',
  '...S112222111..mMWWMm.',
  '...t11222211t..mMWWMm.',
  '...t11222211t...mMMm..',
  '....112222111....mm...',
  '....11222211.....ll...',
  '....1122211......ll...',
  '....111.111......ll...',
  '....lll.lll......ll...',
  '....lLl.lLl...........',
  '....lll.lll...........',
  '...lLLl.lLLl..........',
  '...llll.llll..........',
  '......................',
  '......................',
  '......................',
  '......................',
  '......................',
];

// ═══ ARCHER — hood, cloak, bow held across the body, quiver ═════════════════
const S_ARCHER: Rows = [
  '......................',
  '......................',
  '......2222222.........',
  '.....233333332........',
  '....23333333332.......',
  '....2333sssss32.......',
  '....233seses332.......',
  '.....23ssssss2........',
  '.....2sSSSSs22........',
  '....22111111222.......',
  '...2211222211222......',
  '...221222221122b......',
  '...22122222112.b......',
  '...2212222211..b...l..',
  '...s212222211..b..lL..',
  '...s21222221......lL..',
  '....2122222.......ll..',
  '....212221........lL..',
  '....211.11........lL..',
  '....lll.ll........ll..',
  '....lLl.lL.......lL...',
  '....lll.ll.......l....',
  '...lLLl.lLL...........',
  '...llll.lll...........',
  '......................',
  '......................',
  '......................',
  '......................',
  '......................',
  '......................',
];

// ═══ SOLDIER — kettle helm, mail, upright spear, kite shield ════════════════
const S_SOLDIER: Rows = [
  '......................',
  '...............m......',
  '..............mWm.....',
  '.....mmmmmm...mWm.....',
  '....mMMMMMMm..mWm.....',
  '...mMMMMMMMMm..l......',
  '...mmmmmmmmmm..l......',
  '.....sssssm....l......',
  '.....sesesm....l......',
  '.....ssssss....l......',
  '....11111111...l......',
  '...1122222211..l......',
  '...1222222211..l......',
  '..112222222111.l......',
  '..1122222221g..l......',
  '..s122222211g..l......',
  '..s112222211...l......',
  '...11222221....l......',
  '...1122211.....l......',
  '...111.111.....l......',
  '...lll.lll.....l......',
  '...lLl.lLl............',
  '...lll.lll............',
  '..lLLl.lLLl...........',
  '..llll.llll...........',
  '......................',
  '......................',
  '......................',
  '......................',
  '......................',
];

// ═══ WARLORD (Bazuso) — horned great-helm, fur mantle, huge axe ═════════════
const S_WARLORD: Rows = [
  '..b................b..',
  '..bb....rrrr.....bb...',
  '...bb..rrrrrr...bb....',
  '....bbmmmmmmmmmbb.....',
  '.....mMMMMMMMMMm......',
  '....mMMMMMMMMMMMm.....',
  '....mMM111111MMMm.....',
  '....mMMMMMMMMMMMm.....',
  '....mMmMmMmMmMMMm.....',
  '.....mMMMMMMMMMm......',
  '...LLLLLLLLLLLLLL.....',
  '..LlLLLLLLLLLLLLlL....',
  '..L11122222221111L.mm.',
  '..L1122222222111L.mMMm',
  '..1112222222211..mMWWM',
  '..1112222222211..mMWWM',
  '..s112222222211..mMWWM',
  '..s11222222211....mMMm',
  '...1122222211......mm.',
  '...1122222211......ll.',
  '...11122111........ll.',
  '...111..111........ll.',
  '...lll..lll........ll.',
  '...lLl..lLl...........',
  '...lll..lll...........',
  '..lLLl..lLLl..........',
  '..llll..llll..........',
  '......................',
  '......................',
  '......................',
];

const MATRICES: Record<string, Rows> = {
  guts: S_GUTS, merc: S_MERC, fighter: S_FIGHTER,
  archer: S_ARCHER, soldier: S_SOLDIER, warlord: S_WARLORD,
  // Named Band — authored tiles so 'griffith' / 'casca' / 'judeau' /
  // 'pippin' / 'corkus' / 'rickert' resolve to a real sprite instead of
  // the generic mercenary fallback.
  ...MAP_SPRITES,
};

// ─── palettes ────────────────────────────────────────────────────────────────
type Pal = Record<string, string>;

// Ramps are lifted directly from the battle palettes (framesGuts /
// framesClass) so the same character reads as one design at both scales —
// this is the main thing that makes map and combat art feel like one game.
const COMMON: Pal = {
  s: '#8d5f3f', S: '#b9835a', t: '#dda87c',
  e: '#141018', g: '#a8791f', b: '#ddd6c0',
  m: '#1b1e25', M: '#5a6373', W: '#9fabbc',
  l: '#1d1208', L: '#3c2614',
  x: '#7d2f28',
};

const LOOK_PAL: Record<string, Pal> = {
  // Guts: same near-black plate + ash mane as his battle frames
  // darkest body in the cast, brightest steel — matches his battle palette so
  // the eye lands on the sword first at every scale
  guts: { ...COMMON, '1': '#06070b', '2': '#0f1119', '3': '#1b1f2a', h: '#050509', H: '#14151f',
    l: '#140d06', L: '#2c1d10', m: '#12151c', M: '#6e7889', W: '#c3cedd', g: '#8a6418' },
  merc: { ...COMMON, '1': '#151c2b', '2': '#25324c', '3': '#3b4d70', h: '#241509', H: '#4a2f16' },
  fighter: { ...COMMON, '1': '#241610', '2': '#40271a', '3': '#5e3b26', h: '#1d1309', H: '#3a2814', r: '#9e2f27' },
  archer: { ...COMMON, '1': '#151d13', '2': '#26331f', '3': '#3b4d31', h: '#241509', H: '#4a2f16' },
  soldier: { ...COMMON, '1': '#16203f', '2': '#26386b', '3': '#3d579e' },
  // Bazuso: cold steel, fur mantle, blood crest
  warlord: { ...COMMON, '1': '#0f1116', '2': '#1d2028', '3': '#2f343f', r: '#8d2222',
    L: '#4a3826', l: '#241a12', m: '#1c2028', M: '#616b7b', W: '#a6b2c2', b: '#e0d8c2' },
  // Named Band — palettes lifted from their battle frames so the same
  // character reads as one design at both scales (map and combat).
  ...MAP_SPRITE_PALETTES,
};

// faction tints for the shared levy classes — matched to PAL_SOLDIER_P/E
const TINT: Record<Faction, Pal> = {
  player: { '1': '#16203f', '2': '#26386b', '3': '#3d579e' },
  enemy: { '1': '#2a0f10', '2': '#4f1d1c', '3': '#7e2f2a' },
};
const TINTED = new Set(['soldier', 'fighter', 'archer', 'merc']);

// ─── rasterisation ───────────────────────────────────────────────────────────

const SPR_W = 22, SPR_H = 30;
const cache = new Map<string, HTMLCanvasElement>();

function build(look: string, faction: Faction, frame: number, grey: boolean): HTMLCanvasElement {
  const rows = MATRICES[look] ?? S_MERC;
  const pal: Pal = { ...(LOOK_PAL[look] ?? LOOK_PAL.merc) };
  if (TINTED.has(look)) Object.assign(pal, TINT[faction]);

  const cv = document.createElement('canvas');
  cv.width = SPR_W; cv.height = SPR_H + 1;
  const g = cv.getContext('2d', { willReadFrequently: true })!;
  const img = g.createImageData(cv.width, cv.height);
  const d = img.data;

  // waistline: everything above it lifts 1px on the second idle frame
  const WAIST = 19;

  for (let y = 0; y < rows.length && y < SPR_H; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length && x < SPR_W; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      let hex = pal[ch];
      if (!hex) continue;
      if (grey) {
        const n = parseInt(hex.slice(1), 16);
        const lum = Math.round(((n >> 16 & 255) * 0.3 + (n >> 8 & 255) * 0.5 + (n & 255) * 0.2) * 0.58 + 44);
        hex = `#${((lum << 16) | (lum << 8) | Math.min(255, lum + 10)).toString(16).padStart(6, '0')}`;
      }
      const ty = y + (frame === 1 && y < WAIST ? -1 : 0) + 1;
      if (ty < 0 || ty >= cv.height) continue;
      const n = parseInt(hex.slice(1), 16);
      const i = (ty * cv.width + x) * 4;
      d[i] = (n >> 16) & 255; d[i + 1] = (n >> 8) & 255; d[i + 2] = n & 255; d[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);

  // 1px keyline so units stay legible against busy terrain
  const im2 = g.getImageData(0, 0, cv.width, cv.height);
  const d2 = im2.data;
  const wpx = cv.width, hpx = cv.height;
  const solid = new Uint8Array(wpx * hpx);
  for (let i = 0; i < wpx * hpx; i++) solid[i] = d2[i * 4 + 3] > 128 ? 1 : 0;
  for (let y = 0; y < hpx; y++) {
    for (let x = 0; x < wpx; x++) {
      const i = y * wpx + x;
      if (solid[i]) continue;
      const near =
        (x > 0 && solid[i - 1]) || (x < wpx - 1 && solid[i + 1]) ||
        (y > 0 && solid[i - wpx]) || (y < hpx - 1 && solid[i + wpx]);
      if (!near) continue;
      const o = i * 4;
      d2[o] = 8; d2[o + 1] = 7; d2[o + 2] = 13; d2[o + 3] = 255;
    }
  }
  g.putImageData(im2, 0, 0);
  return cv;
}

function sprite(look: string, faction: Faction, frame: number, grey: boolean): HTMLCanvasElement {
  const k = `${look}|${faction}|${frame}|${grey}`;
  let cv = cache.get(k);
  if (!cv) { cv = build(look, faction, frame, grey); cache.set(k, cv); }
  return cv;
}

/**
 * Draw a map unit. `col`/`row` are (possibly fractional) tile coordinates;
 * the figure is anchored to the BOTTOM of its tile and overhangs upward.
 */
export function drawMapUnit(
  ctx: CanvasRenderingContext2D, look: string, faction: Faction,
  col: number, row: number, ts: number, t: number,
  opts: { grey?: boolean; alpha?: number; selected?: boolean } = {},
) {
  const frame = Math.floor(t / 30) % 2;
  const cv = sprite(look, faction, frame, !!opts.grey);
  const cx = col * ts + ts / 2;
  const by = row * ts + ts;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;

  // ground shadow anchors the figure to its tile
  ctx.fillStyle = 'rgba(6,8,14,0.42)';
  ctx.beginPath();
  ctx.ellipse(cx, by - 3, ts * 0.30, ts * 0.11, 0, 0, Math.PI * 2);
  ctx.fill();

  // faction ring — keeps ally/enemy readable at a glance on busy terrain
  ctx.strokeStyle = faction === 'player'
    ? (opts.grey ? 'rgba(120,140,190,0.5)' : 'rgba(110,150,255,0.85)')
    : 'rgba(255,110,95,0.85)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(cx, by - 3, ts * 0.30, ts * 0.11, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.drawImage(cv, Math.round(cx - SPR_W / 2), Math.round(by - SPR_H));
  ctx.restore();
}


