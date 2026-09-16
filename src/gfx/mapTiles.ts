import { terrainAt, mapSize } from '../engine/terrain';

// ─── Tactical map renderer — 32×32 logical tiles, connected/autotiled ────────
// The whole battlefield is composed into one cached base canvas so nothing is
// re-rendered per frame except genuinely animated tiles (water, torch flame).
// Terrain RULES are untouched: this module only decides how a tile LOOKS.
//
// Autotiling: each terrain group computes a 4-bit neighbour mask
// (N=1, E=2, S=4, W=8) and shapes its edges/corners accordingly, so roads,
// walls, forests and water flow into one another instead of tiling as squares.

export const TS = 32;

const N = 1, E = 2, S = 4, Wb = 8;

// ─── deterministic noise ─────────────────────────────────────────────────────
function hash(x: number, y: number, s: number): number {
  let h = (x * 374761393 + y * 668265263 + s * 2246822519) >>> 0;
  h = ((h ^ (h >> 13)) * 1274126177) >>> 0;
  return (h ^ (h >> 16)) >>> 0;
}


// ─── palette ─────────────────────────────────────────────────────────────────
const C = {
  grass0: '#39421f', grass1: '#46512a', grass2: '#535f33', grass3: '#63713e',
  grassDry: '#6b6a3a', grassWet: '#3d4a2c',
  mud0: '#2e2317', mud1: '#42331f', mud2: '#584429', mud3: '#6d5634',
  rut: '#241b11',
  water0: '#16242e', water1: '#1f3644', water2: '#2c4d5e', water3: '#4a7183',
  foam: '#8fb0bd',
  stone0: '#23262d', stone1: '#3a3f48', stone2: '#565c68', stone3: '#767d8b',
  stone4: '#949cab',
  wood0: '#1d1208', wood1: '#33230f', wood2: '#4d361a', wood3: '#6b4d28',
  leaf0: '#12200f', leaf1: '#1c3117', leaf2: '#274220', leaf3: '#35562a',
  leaf4: '#446b34',
  bark0: '#1a1108', bark1: '#2e2012', bark2: '#43301c',
  rock0: '#2b2c31', rock1: '#43454c', rock2: '#5d606a', rock3: '#7b7f8b',
  iron: '#4b5058', ironLit: '#767c88',
  cloth: '#3a2f22', clothLit: '#57462f',
  banner: '#6e211d', bannerLit: '#9a3229',
  bone: '#b9b2a0',
  puddle: '#43555e', puddleLit: '#6d8894',
};

type G = CanvasRenderingContext2D;
const px = (g: G, x: number, y: number, w: number, h: number, c: string) => {
  g.fillStyle = c; g.fillRect(x, y, w, h);
};

// ─── group membership for autotiling ─────────────────────────────────────────
const isRoadish = (k: string) => k === 'road' || k === 'gate';
const isWallish = (k: string) => k === 'wall' || k === 'fort' || k === 'gate';
const isWater = (k: string) => k === 'water';
const isForest = (k: string) => k === 'forest';

function maskOf(map: string[], x: number, y: number, test: (k: string) => boolean): number {
  let m = 0;
  if (test(terrainAt(map, x, y - 1).key)) m |= N;
  if (test(terrainAt(map, x + 1, y).key)) m |= E;
  if (test(terrainAt(map, x, y + 1).key)) m |= S;
  if (test(terrainAt(map, x - 1, y).key)) m |= Wb;
  return m;
}

// ═══ GRASS ═══════════════════════════════════════════════════════════════════
function drawGrass(g: G, x: number, y: number, wet: boolean) {
  px(g, 0, 0, TS, TS, wet ? C.grassWet : C.grass1);
  // coarse mottling
  for (let i = 0; i < 26; i++) {
    const hx = hash(x, y, i) % TS, hy = hash(x, y, i + 40) % TS;
    const tone = i % 4 === 0 ? C.grass3 : i % 3 === 0 ? C.grass0 : C.grass2;
    px(g, hx, hy, 2, 1, tone);
  }
  // grass tufts
  for (let i = 0; i < 7; i++) {
    const tx = 2 + (hash(x, y, i + 90) % (TS - 5));
    const ty = 3 + (hash(x, y, i + 130) % (TS - 6));
    px(g, tx, ty, 1, 3, C.grass0);
    px(g, tx + 1, ty + 1, 1, 2, C.grass3);
    px(g, tx - 1, ty + 2, 1, 1, C.grass2);
  }
  // dry patches
  if (hash(x, y, 7) % 5 === 0) {
    const dx = 4 + (hash(x, y, 11) % 20), dy = 4 + (hash(x, y, 13) % 20);
    px(g, dx, dy, 5, 2, C.grassDry);
    px(g, dx + 1, dy + 2, 3, 1, C.grassDry);
  }
  // rain puddle
  if (wet && hash(x, y, 21) % 4 === 0) {
    const pxx = 5 + (hash(x, y, 23) % 16), pyy = 8 + (hash(x, y, 27) % 14);
    const pw = 7 + (hash(x, y, 29) % 7);
    px(g, pxx, pyy, pw, 3, C.puddle);
    px(g, pxx + 1, pyy - 1, pw - 3, 1, C.puddle);
    px(g, pxx + 2, pyy, pw - 5, 1, C.puddleLit);
  }
}

// ═══ ROAD / MUD (autotiled arms) ═════════════════════════════════════════════
function drawRoad(g: G, map: string[], x: number, y: number) {
  drawGrass(g, x, y, true);
  const m = maskOf(map, x, y, isRoadish);
  const H = TS / 2;
  const half = 9;   // half-width of the track

  const band = (bx: number, by: number, bw: number, bh: number) => {
    px(g, bx, by, bw, bh, C.mud1);
    // ragged edges so the track never reads as a rectangle
    for (let i = 0; i < bw; i += 2) {
      const j = hash(x * 31 + i, y, 3) % 3;
      px(g, bx + i, by - (j === 0 ? 1 : 0), 2, 1, C.mud0);
      const k = hash(x * 17 + i, y, 5) % 3;
      px(g, bx + i, by + bh - 1 + (k === 0 ? 1 : 0), 2, 1, C.mud0);
    }
    for (let i = 0; i < bh; i += 2) {
      const j = hash(x, y * 29 + i, 9) % 3;
      px(g, bx - (j === 0 ? 1 : 0), by + i, 1, 2, C.mud0);
      px(g, bx + bw - 1 + (j === 1 ? 1 : 0), by + i, 1, 2, C.mud0);
    }
  };

  // centre blob + an arm toward every connected neighbour
  band(H - half, H - half, half * 2, half * 2);
  if (m & N) band(H - half, 0, half * 2, H);
  if (m & S) band(H - half, H, half * 2, H);
  if (m & Wb) band(0, H - half, H, half * 2);
  if (m & E) band(H, H - half, H, half * 2);
  // dead end softens into the grass
  if (m === 0) band(H - 6, H - 6, 12, 12);

  // churned texture + wheel ruts along the dominant axis
  for (let i = 0; i < 30; i++) {
    const hx = hash(x, y, i + 60) % TS, hy = hash(x, y, i + 80) % TS;
    const inside =
      (Math.abs(hx - H) < half && Math.abs(hy - H) < half) ||
      ((m & N) && hy < H && Math.abs(hx - H) < half) ||
      ((m & S) && hy > H && Math.abs(hx - H) < half) ||
      ((m & Wb) && hx < H && Math.abs(hy - H) < half) ||
      ((m & E) && hx > H && Math.abs(hy - H) < half);
    if (!inside) continue;
    px(g, hx, hy, 1 + (i % 2), 1, i % 3 === 0 ? C.mud3 : C.mud2);
  }
  const horiz = !!(m & E) || !!(m & Wb);
  if (horiz) {
    px(g, 0, H - 4, TS, 1, C.rut);
    px(g, 0, H + 4, TS, 1, C.rut);
  }
  if ((m & N) || (m & S)) {
    px(g, H - 4, 0, 1, TS, C.rut);
    px(g, H + 4, 0, 1, TS, C.rut);
  }
  // standing water in the ruts
  if (hash(x, y, 33) % 3 === 0) {
    const pxx = H - 5 + (hash(x, y, 35) % 6), pyy = H - 3 + (hash(x, y, 37) % 7);
    px(g, pxx, pyy, 8, 3, C.puddle);
    px(g, pxx + 1, pyy + 1, 5, 1, C.puddleLit);
  }
}

// ═══ FOREST ══════════════════════════════════════════════════════════════════
function drawTree(g: G, cx: number, cy: number, r: number, seed: number, x: number, y: number) {
  // trunk
  px(g, cx - 1, cy + r - 2, 3, 7, C.bark1);
  px(g, cx - 1, cy + r - 2, 1, 7, C.bark0);
  px(g, cx + 1, cy + r - 1, 1, 6, C.bark2);
  // canopy: stacked blobs, dark rim then lit crown
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    px(g, Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r * 0.85), 3, 3, C.leaf0);
  }
  px(g, cx - r, cy - r + 1, r * 2, r * 2 - 2, C.leaf1);
  px(g, cx - r + 1, cy - r + 1, r * 2 - 2, r * 2 - 3, C.leaf2);
  px(g, cx - r + 2, cy - r + 2, r * 2 - 5, r - 1, C.leaf3);
  px(g, cx - r + 3, cy - r + 2, r - 1, 2, C.leaf4);
  // leaf clumps
  for (let i = 0; i < 5; i++) {
    const lx = cx - r + 1 + (hash(x, y, seed + i) % Math.max(1, r * 2 - 2));
    const ly = cy - r + 2 + (hash(x, y, seed + i + 20) % Math.max(1, r * 2 - 4));
    px(g, lx, ly, 2, 1, i % 2 ? C.leaf4 : C.leaf0);
  }
}

function drawForest(g: G, map: string[], x: number, y: number) {
  drawGrass(g, x, y, true);
  const m = maskOf(map, x, y, isForest);
  // undergrowth floor where the canopy is dense
  px(g, 2, 6, TS - 4, TS - 8, C.leaf0);
  for (let i = 0; i < 14; i++) {
    px(g, hash(x, y, i + 3) % TS, 6 + (hash(x, y, i + 23) % (TS - 8)), 2, 1, C.leaf1);
  }
  // interior tiles get fuller cover; edge tiles open up toward the gap
  const full = m === 15;
  drawTree(g, 9, 17, 7, 1, x, y);
  drawTree(g, 22, 21, 6, 40, x, y);
  drawTree(g, 16, 10, 6, 80, x, y);
  if (full || (m & N)) drawTree(g, 27, 8, 5, 120, x, y);
  if (full || (m & Wb)) drawTree(g, 3, 25, 5, 160, x, y);
  if (full) drawTree(g, 28, 27, 5, 200, x, y);
  // fallen log on some edge tiles
  if (!full && hash(x, y, 55) % 4 === 0) {
    px(g, 4, 27, 16, 3, C.bark1);
    px(g, 4, 27, 16, 1, C.bark2);
    px(g, 3, 27, 1, 3, C.bark0);
  }
}

// ═══ WATER (animated, autotiled shoreline) ═══════════════════════════════════
function drawWater(g: G, map: string[], x: number, y: number, frame: number) {
  px(g, 0, 0, TS, TS, C.water1);
  px(g, 0, 0, TS, 12, C.water0);
  for (let i = 0; i < 18; i++) {
    px(g, hash(x, y, i) % TS, hash(x, y, i + 30) % TS, 3, 1, C.water2);
  }
  // drifting wave crests
  for (let r = 0; r < 5; r++) {
    const yy = (r * 7 + ((x * 5 + y * 3) % 7) + frame * 2) % TS;
    const sx = (hash(x, y, r) % 14);
    px(g, sx, yy, 9, 1, C.water3);
    px(g, sx + 11, yy + 2, 5, 1, C.water2);
  }
  // shoreline foam on every edge that is NOT water
  const m = maskOf(map, x, y, isWater);
  const foam = (bx: number, by: number, bw: number, bh: number, horiz: boolean) => {
    px(g, bx, by, bw, bh, C.water3);
    for (let i = 0; i < (horiz ? bw : bh); i += 2) {
      if (hash(x + i, y, 71) % 3 === 0) continue;
      if (horiz) px(g, bx + i, by, 2, 1, C.foam);
      else px(g, bx, by + i, 1, 2, C.foam);
    }
  };
  if (!(m & N)) foam(0, 0, TS, 2, true);
  if (!(m & S)) foam(0, TS - 2, TS, 2, true);
  if (!(m & Wb)) foam(0, 0, 2, TS, false);
  if (!(m & E)) foam(TS - 2, 0, 2, TS, false);
}

// ═══ STONE (wall / fort / gate) ══════════════════════════════════════════════
function stoneCourse(g: G, x: number, y: number) {
  px(g, 0, 0, TS, TS, C.stone1);
  // running-bond blocks
  for (let row = 0; row < 4; row++) {
    const yy = row * 8;
    const off = row % 2 ? 8 : 0;
    for (let bx = -8; bx < TS; bx += 16) {
      const sx = bx + off;
      px(g, sx + 1, yy + 1, 14, 6, C.stone2);
      px(g, sx + 1, yy + 1, 14, 1, C.stone3);
      px(g, sx + 1, yy + 6, 14, 1, C.stone0);
      if (hash(x + sx, y + yy, 3) % 4 === 0) px(g, sx + 3, yy + 3, 3, 2, C.stone1);
    }
    px(g, 0, yy, TS, 1, C.stone0);
  }
  // weathering
  for (let i = 0; i < 10; i++) {
    px(g, hash(x, y, i + 5) % TS, hash(x, y, i + 25) % TS, 2, 1, C.stone0);
  }
}

function drawWall(g: G, map: string[], x: number, y: number) {
  stoneCourse(g, x, y);
  const m = maskOf(map, x, y, isWallish);
  // battlements crown any edge facing open ground
  if (!(m & N)) {
    px(g, 0, 0, TS, 7, C.stone0);
    for (let i = 0; i < 4; i++) px(g, i * 8 + 1, 0, 5, 6, C.stone3);
    for (let i = 0; i < 4; i++) px(g, i * 8 + 1, 0, 5, 1, C.stone4);
    px(g, 0, 7, TS, 1, C.stone0);
  }
  if (!(m & S)) { px(g, 0, TS - 3, TS, 3, C.stone0); px(g, 0, TS - 1, TS, 1, '#14161a'); }
  if (!(m & Wb)) { px(g, 0, 0, 2, TS, C.stone0); px(g, 2, 0, 1, TS, C.stone1); }
  if (!(m & E)) { px(g, TS - 2, 0, 2, TS, C.stone0); px(g, TS - 3, 0, 1, TS, C.stone3); }
  // arrow slit on long stretches
  if ((m & Wb) && (m & E) && hash(x, y, 91) % 2 === 0) {
    px(g, 15, 12, 2, 9, '#0c0e12');
    px(g, 14, 14, 1, 5, C.stone0);
  }
}

function drawFort(g: G, map: string[], x: number, y: number) {
  stoneCourse(g, x, y);
  const m = maskOf(map, x, y, isWallish);
  // raised platform edge
  px(g, 2, 2, TS - 4, TS - 4, C.stone2);
  px(g, 3, 3, TS - 6, 1, C.stone3);
  px(g, 3, TS - 4, TS - 6, 1, C.stone0);
  for (let bx = 4; bx < TS - 4; bx += 7) px(g, bx, 6, 5, 1, C.stone1);
  // crenellations on open sides
  if (!(m & N)) for (let i = 0; i < 4; i++) { px(g, i * 8 + 1, 0, 5, 5, C.stone3); px(g, i * 8 + 1, 0, 5, 1, C.stone4); }
  if (!(m & S)) for (let i = 0; i < 4; i++) px(g, i * 8 + 1, TS - 4, 5, 4, C.stone1);
  // brazier
  px(g, 14, 18, 5, 3, C.iron);
  px(g, 13, 20, 7, 2, C.stone0);
  px(g, 15, 15, 3, 3, '#c2601f');
  px(g, 16, 14, 1, 2, '#e8a33a');
}

function drawGate(g: G, map: string[], x: number, y: number) {
  stoneCourse(g, x, y);
  const m = maskOf(map, x, y, isWallish);
  // stone jambs left and right
  px(g, 0, 0, 5, TS, C.stone1);
  px(g, TS - 5, 0, 5, TS, C.stone1);
  px(g, 4, 0, 1, TS, C.stone0);
  px(g, TS - 5, 0, 1, TS, C.stone3);
  // arch
  px(g, 5, 0, TS - 10, 6, C.stone2);
  px(g, 6, 5, TS - 12, 2, C.stone0);
  px(g, 7, 1, TS - 14, 1, C.stone3);
  // timber doors with iron bands + studs
  px(g, 5, 6, TS - 10, TS - 6, C.wood1);
  for (let i = 0; i < 5; i++) px(g, 6 + i * 4, 7, 3, TS - 8, i % 2 ? C.wood2 : C.wood1);
  px(g, 5, 11, TS - 10, 3, C.iron);
  px(g, 5, 22, TS - 10, 3, C.iron);
  px(g, 5, 11, TS - 10, 1, C.ironLit);
  px(g, 5, 22, TS - 10, 1, C.ironLit);
  for (let i = 0; i < 4; i++) { px(g, 8 + i * 5, 12, 1, 1, C.stone4); px(g, 8 + i * 5, 23, 1, 1, C.stone4); }
  px(g, 15, 6, 2, TS - 6, C.wood0);  // centre seam
  // torches flanking the gate (flame animated separately)
  px(g, 2, 13, 2, 6, C.wood2);
  px(g, TS - 4, 13, 2, 6, C.wood2);
  if (!(m & N)) for (let i = 0; i < 4; i++) { px(g, i * 8 + 1, 0, 5, 4, C.stone3); px(g, i * 8 + 1, 0, 5, 1, C.stone4); }
}

// ═══ HOUSE / MOUNTAIN ════════════════════════════════════════════════════════
function drawHouse(g: G, x: number, y: number) {
  drawGrass(g, x, y, true);
  px(g, 3, 13, 26, 17, C.stone1);
  px(g, 3, 13, 26, 1, C.stone2);
  px(g, 3, 29, 26, 1, C.stone0);
  for (let r = 0; r < 3; r++) for (let bx = 4; bx < 28; bx += 8) px(g, bx + (r % 2 ? 4 : 0), 15 + r * 5, 6, 3, C.stone2);
  // thatch roof
  px(g, 1, 4, 30, 10, C.wood2);
  px(g, 2, 3, 28, 3, C.wood3);
  for (let i = 0; i < 30; i += 3) px(g, 1 + i, 5, 2, 9, hash(x, y, i) % 2 ? C.wood1 : C.wood2);
  px(g, 0, 13, 32, 2, C.wood0);
  // door + window
  px(g, 13, 20, 7, 10, C.wood0);
  px(g, 14, 21, 5, 9, C.wood1);
  px(g, 18, 25, 1, 1, C.stone4);
  px(g, 6, 18, 4, 4, '#14161a');
  px(g, 22, 18, 4, 4, '#14161a');
}

function drawMountain(g: G, x: number, y: number) {
  px(g, 0, 0, TS, TS, C.rock1);
  px(g, 0, 0, TS, 10, C.rock0);
  // faceted peaks
  for (let i = 0; i < 3; i++) {
    const bx = 2 + i * 10 + (hash(x, y, i) % 3);
    const top = 4 + (hash(x, y, i + 9) % 7);
    for (let r = 0; r < 18; r++) {
      const w = Math.max(1, 10 - Math.abs(r - 9));
      px(g, bx + 5 - Math.floor(w / 2), top + r, w, 1, r < 6 ? C.rock3 : r < 12 ? C.rock2 : C.rock1);
    }
    px(g, bx + 4, top, 2, 4, C.rock3);
  }
  px(g, 0, TS - 6, TS, 6, C.rock0);
  for (let i = 0; i < 12; i++) px(g, hash(x, y, i + 50) % TS, 20 + (hash(x, y, i + 70) % 12), 2, 1, C.rock2);
}

// ═══ PROPS — siege-approach dressing on open ground ══════════════════════════
function drawProps(g: G, map: string[], x: number, y: number) {
  const k = terrainAt(map, x, y).key;
  if (k !== 'plain' && k !== 'road') return;
  const roll = hash(x, y, 777) % 100;

  // ruined fencing — runs along a row, broken in places
  if (k === 'plain' && roll < 16) {
    const post = (bx: number, lean: number) => {
      px(g, bx, 16 + lean, 2, 12, C.wood1);
      px(g, bx, 16 + lean, 1, 12, C.wood2);
      px(g, bx - 1, 15 + lean, 4, 1, C.wood0);
    };
    post(5, 0); post(23, 1);
    if (hash(x, y, 11) % 3) px(g, 6, 20, 18, 2, C.wood2);
    if (hash(x, y, 13) % 3) px(g, 6, 25, 16, 2, C.wood1);
    else { px(g, 6, 25, 7, 2, C.wood1); px(g, 17, 26, 5, 2, C.wood1); }
  }
  // rocks
  if (roll >= 16 && roll < 34) {
    const rx = 6 + (hash(x, y, 17) % 16), ry = 14 + (hash(x, y, 19) % 12);
    px(g, rx, ry, 8, 5, C.rock1);
    px(g, rx + 1, ry - 1, 6, 2, C.rock2);
    px(g, rx + 2, ry - 1, 3, 1, C.rock3);
    px(g, rx, ry + 4, 8, 1, C.rock0);
    px(g, rx + 10, ry + 2, 4, 3, C.rock1);
    px(g, rx + 10, ry + 2, 3, 1, C.rock2);
  }
  // battlefield debris — broken spears, a discarded shield
  if (roll >= 34 && roll < 48) {
    px(g, 7, 24, 17, 1, C.wood2);
    px(g, 6, 25, 3, 1, C.iron);
    px(g, 18, 15, 1, 12, C.wood1);
    px(g, 17, 13, 3, 3, C.iron);
    if (hash(x, y, 23) % 2) {
      px(g, 9, 17, 9, 7, C.wood1);
      px(g, 10, 18, 7, 5, C.banner);
      px(g, 12, 19, 3, 3, C.bone);
    }
  }
  // supply wagon (only on open ground beside a road)
  if (k === 'plain' && roll >= 48 && roll < 54) {
    px(g, 3, 12, 26, 9, C.wood1);
    px(g, 3, 12, 26, 2, C.wood3);
    px(g, 4, 14, 24, 1, C.wood0);
    for (let i = 0; i < 6; i++) px(g, 5 + i * 4, 15, 2, 5, C.wood2);
    px(g, 2, 20, 28, 2, C.wood0);
    // wheels
    const wheel = (wx: number) => {
      px(g, wx, 21, 9, 9, C.wood0);
      px(g, wx + 1, 22, 7, 7, C.wood2);
      px(g, wx + 3, 24, 3, 3, C.wood0);
      px(g, wx + 4, 21, 1, 9, C.wood1);
      px(g, wx, 25, 9, 1, C.wood1);
    };
    wheel(4); wheel(19);
  }
  // camp tent
  if (k === 'plain' && roll >= 54 && roll < 60) {
    px(g, 4, 10, 2, 2, C.wood2);
    for (let r = 0; r < 16; r++) {
      const w = r + 2;
      px(g, 16 - Math.floor(w / 2), 13 + r, w, 1, r % 5 === 0 ? C.clothLit : C.cloth);
    }
    px(g, 16, 11, 1, 18, C.wood1);
    px(g, 13, 22, 6, 7, '#1a1611');
    px(g, 8, 29, 17, 1, C.wood0);
    px(g, 16, 9, 1, 3, C.wood2);
    px(g, 17, 9, 4, 3, C.banner);
  }
  // scattered bones / crows' leavings
  if (roll >= 60 && roll < 66) {
    px(g, 11, 22, 6, 1, C.bone);
    px(g, 10, 21, 1, 3, C.bone);
    px(g, 17, 21, 1, 3, C.bone);
    px(g, 14, 25, 4, 1, C.bone);
  }
}

// ═══ composition ═════════════════════════════════════════════════════════════

interface Baked {
  base: HTMLCanvasElement;
  water: [number, number][];
  gates: [number, number][];
}

const bakedCache = new Map<string, Baked>();

function bake(map: string[]): Baked {
  const { w, h } = mapSize(map);
  const base = document.createElement('canvas');
  base.width = w * TS; base.height = h * TS;
  const g = base.getContext('2d')!;
  g.imageSmoothingEnabled = false;

  const water: [number, number][] = [];
  const gates: [number, number][] = [];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const key = terrainAt(map, x, y).key;
      g.save();
      g.translate(x * TS, y * TS);
      g.beginPath(); g.rect(0, 0, TS, TS); g.clip();
      switch (key) {
        case 'road': drawRoad(g, map, x, y); break;
        case 'forest': drawForest(g, map, x, y); break;
        case 'water': water.push([x, y]); drawWater(g, map, x, y, 0); break;
        case 'wall': drawWall(g, map, x, y); break;
        case 'fort': drawFort(g, map, x, y); break;
        case 'gate': gates.push([x, y]); drawGate(g, map, x, y); break;
        case 'house': drawHouse(g, x, y); break;
        case 'mountain': drawMountain(g, x, y); break;
        default: drawGrass(g, x, y, true); break;
      }
      drawProps(g, map, x, y);
      g.restore();
    }
  }

  // soften terrain seams: a faint dark edge wherever two different groups meet
  g.globalAlpha = 0.22;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const k = terrainAt(map, x, y).key;
      const solid = (kk: string) => kk === 'wall' || kk === 'mountain' || kk === 'house';
      if (!solid(k)) continue;
      if (!solid(terrainAt(map, x, y + 1).key)) {
        g.fillStyle = '#05060a';
        g.fillRect(x * TS, y * TS + TS, TS, 3);
      }
    }
  }
  g.globalAlpha = 1;

  return { base, water, gates };
}

export function getBakedMap(map: string[]): Baked {
  const key = map.join('|');
  let b = bakedCache.get(key);
  if (!b) { b = bake(map); bakedCache.set(key, b); }
  return b;
}

/** Draw the whole battlefield: cached base + per-frame animated tiles. */
export function drawMap(ctx: CanvasRenderingContext2D, map: string[], t: number) {
  const baked = getBakedMap(map);
  ctx.drawImage(baked.base, 0, 0);

  const frame = Math.floor(t / 9) % 16;
  for (const [x, y] of baked.water) {
    ctx.save();
    ctx.translate(x * TS, y * TS);
    ctx.beginPath(); ctx.rect(0, 0, TS, TS); ctx.clip();
    drawWater(ctx, map, x, y, frame);
    ctx.restore();
  }
  // torch flames beside each gate
  for (const [x, y] of baked.gates) {
    const f = Math.floor(t / 6) % 3;
    for (const tx of [x * TS + 1, x * TS + TS - 5]) {
      const ty = y * TS + 9;
      ctx.fillStyle = '#8c3a10';
      ctx.fillRect(tx, ty + 1 - (f === 1 ? 1 : 0), 4, 4);
      ctx.fillStyle = '#d9781f';
      ctx.fillRect(tx + 1, ty - (f === 2 ? 1 : 0), 2, 3);
      ctx.fillStyle = '#f2c246';
      ctx.fillRect(tx + 1, ty + 1, 1, 1);
    }
  }
}
