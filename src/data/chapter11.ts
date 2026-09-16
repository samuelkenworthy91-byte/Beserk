import type { ChapterDef } from '../engine/types';

// ─── CHAPTER 11 — "Fall of the Hawk" ────────────────────────────────────────
//
// A year has passed. Guts has come back for Griffith. The Falconia
// dungeon — the Tower of Rebirth — keeps its prisoners inside a
// corridor of iron doors. The guards have orders: do not let anyone
// in. No orders were given about letting them out.
//
// 14×10 dungeon. The corridor runs along rows 5–6. Cells branch off
// to the north (where the political prisoners are held) and south
// (the lower dungeon's labour blocks). Guts enters from the south.
// The chapter is single-player: Guts cutting down the guards and
// reaching Griffith's door.
//
// Pacing:
//   door  (2)   two gate guards on the iron door at the north end.
//               They hold the door. They wake when Guts approaches.
//   patrol (3)  three wardens on patrol walking the corridor. patrol
//               AI — they pace back and forth. They see Guts within
//               aggro=3.
//   side  (3)   three guards in side cells; they don't see the
//               corridor unless Guts walks down their hall.
//   tower (1)   the chief warden — the chapter boss. He waits inside
//               the cell block, swinging a heavy axe.

export const CHAPTER_11: ChapterDef = {
  id: 11,
  name: 'Chapter 11 — Fall of the Hawk',
  subtitle: 'The Tower of Rebirth',
  objective: 'Reach Griffith\'s cell',
  weather: 'none',
  map: [
    '.C...C...C...C',
    '.C...C...C...C',
    '.C...C...C...C',
    '..............',
    '....R...R.....',
    '..............',
    '.G.....G......',
    '.G.....G......',
    '..G.........G.',
    '..GGGGG.GGGG..',
  ],
  // Guts enters from the south stairs. The cell doors are the two
  // horizontal C-walls on rows 1–3; the corridor is the middle rows.
  // The main gate is at (6, 9) — the south wall — and the iron
  // door at (6, 0) is Griffith's cell.
  playerStart: [[6, 9]],
  units: [
    { def: 'guts', faction: 'player', x: 6, y: 9 },

    // ── door: two gate guards on the iron door ──
    //   They hold the cell-block door (the iron door at top). aggro=3:
    //   they only activate when Guts enters the corridor and approaches.
    { def: 'e_soldier', faction: 'enemy', x: 6, y: 1, level: 4, group: 'door', aggro: 3 },
    { def: 'e_soldier', faction: 'enemy', x: 7, y: 1, level: 4, group: 'door', aggro: 3 },

    // ── patrol: three wardens walking the corridor ──
    //   Their patrol anchors are the corridor tiles. They pace
    //   between the cell walls.
    { def: 'e_soldier', faction: 'enemy', x: 4, y: 4, level: 4, ai: 'patrol', group: 'patrol', aggro: 3 },
    { def: 'e_soldier', faction: 'enemy', x: 7, y: 4, level: 4, ai: 'patrol', group: 'patrol', aggro: 3 },
    { def: 'e_fighter', faction: 'enemy', x: 8, y: 4, level: 4, ai: 'patrol', group: 'patrol', aggro: 3 },

    // ── side: three guards in side cells ──
    //   They hold the side halls. aggro=2 — they only see Guts if he
    //   walks down their hall. A direct corridor run can ignore them
    //   entirely.
    { def: 'e_soldier', faction: 'enemy', x: 1, y: 7, level: 3, group: 'side', aggro: 2 },
    { def: 'e_soldier', faction: 'enemy', x: 6, y: 7, level: 3, group: 'side', aggro: 2 },
    { def: 'e_soldier', faction: 'enemy', x: 12, y: 7, level: 3, group: 'side', aggro: 2 },

    // ── tower: the chief warden, inside the cell block ──
    { def: 'c_warden', faction: 'enemy', x: 7, y: 2, ai: 'boss', group: 'tower', aggro: 5 },
  ],
  bossDefId: 'c_warden',
  intro: {
    id: 'ch11_intro',
    lines: [
      { speaker: '', text: 'A year has passed. The Falconian dungeons are quiet; the king\'s orders say they will stay that way.' },
      { speaker: '', text: 'Guts walked in through a chimney that nobody had thought to guard. The chimney went up three floors and ended at a corridor of iron doors. The corridor smelled of rust and damp and the particular silence of men who have stopped being kept alive by their owners.' },
      { speaker: '', text: 'Behind the seventh iron door, Griffith was — something. Behind the eighth iron door was a man with a key.' },
    ],
  },
  outro: {
    id: 'ch11_outro',
    lines: [
      { speaker: '', text: 'The chief warden died on his own floor. He did not yield his key. The key was taken from him.' },
      { speaker: '', text: 'Guts walked down the corridor to the eighth door. It was not locked. The door was open and inside was a man sitting in a chair who had not been in a chair in a year.' },
      { speaker: '', text: 'The man in the chair was Griffith. He had no tongue. He had no hands. He had no face that was still his face.' },
      { speaker: '', text: 'Guts walked in. He lifted him. He walked out. The corridor that had been silent was silent still — the iron doors were closed behind him, and the man he was carrying was not the man he had come for.' },
      { speaker: '', text: 'He walked him out of the tower. He walked him past the king\'s soldiers. He walked him past the gates. He walked him west, where the river meets the sea, and there was nothing left of the Band except what he was carrying and the sword in his hand.' },
    ],
  },
};
