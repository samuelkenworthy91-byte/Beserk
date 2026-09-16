import type { ChapterDef } from '../engine/types';

// ─── CHAPTER 5 — "One Hundred Men" ─────────────────────────────────────────
//
// Griffith has been given command of a hundred men. The first real test of
// his Hawk: a hilltop fort on the south road, held by rebels who refuse the
// king's writ. Pippin carries the ladder. Casca leads the second wave when
// the gate falls. Guts walks in first because Griffith doesn't tell him not
// to, and because that's what happens when a man with a greatsword is
// standing at a gate.
//
// 14×10 hilltop. The fort walls run along cols 0–1 (rows 0–3) and rows 0–2
// (col 1). The keep is at row 0 cols 7–9. The players cross the slope from
// south (y=9) up through the gate at col 5 row 5. Forest on the east hides
// Pippin's flanking approach.
//
// Pacing:
//   wall (4)    four pikemen inside the wall — they fire on anyone walking
//               up the slope (y<=7) within 4 tiles.
//   moat (2)    two soldiers north-east of the gate, behind a low copse
//               of trees. They only see the player who's quietly flanking.
//   keep  (3)   the garrison inside the keep: two soldiers + the captain
//               sleeping in the tower. Dormant until the gate falls.
//   boss  (1)   a knight-commander who refuses to yield.

export const CHAPTER_5: ChapterDef = {
  id: 5,
  name: 'Chapter 5 — One Hundred Men',
  subtitle: 'The Hilltop at Varn',
  objective: 'Take the hilltop, defeat the knight-commander',
  weather: 'none',
  map: [
    '...FFF........',
    '..C...........',
    '..C....TTT....',
    '..C...........',
    '..C....T..T...',
    '..G...........',
    '..R.......T...',
    '..R...........',
    '..R...........',
    '..R...........',
  ],
  // Guts enters column 3 — the centre of the slope. Casca and Pippin file
  // behind. Pippin is on the right flank; he'll move through the trees
  // on the east side once the wall is engaged.
  playerStart: [[3, 9], [4, 9], [5, 9]],
  units: [
    { def: 'guts', faction: 'player', x: 3, y: 9 },
    { def: 'casca', faction: 'player', x: 4, y: 9 },
    { def: 'pippin', faction: 'player', x: 5, y: 9 },

    // ── wall: four pikemen inside the wall ──
    //   They hold the inner wall and fire arrows. aggro=4 means anyone
    //   within 4 tiles of the slope (y<=7) wakes the squad.
    { def: 'e_soldier', faction: 'enemy', x: 3, y: 5, level: 3, group: 'wall', aggro: 4 },
    { def: 'e_soldier', faction: 'enemy', x: 5, y: 5, level: 3, group: 'wall', aggro: 4 },
    { def: 'e_archer', faction: 'enemy', x: 6, y: 3, level: 3, group: 'wall', aggro: 4 },
    { def: 'e_archer', faction: 'enemy', x: 8, y: 4, level: 3, group: 'wall', aggro: 4 },

    // ── moat: two soldiers north-east of the gate behind trees ──
    //   They hold the east approach and watch the treeline. aggro=3 — they
    //   only see players inside the forest. A west-side assault can ignore
    //   them entirely until they wander out to investigate.
    { def: 'e_soldier', faction: 'enemy', x: 9, y: 3, level: 3, group: 'moat', aggro: 3 },
    { def: 'e_fighter', faction: 'enemy', x: 10, y: 4, level: 3, group: 'moat', aggro: 3 },

    // ── keep garrison: two soldiers inside the keep ──
    //   Dormant until any player walks past the gate (y<=5).
    { def: 'e_soldier', faction: 'enemy', x: 8, y: 1, level: 3, group: 'keep', aggro: 4 },
    { def: 'e_archer', faction: 'enemy', x: 9, y: 2, level: 3, group: 'keep', aggro: 4 },

    // ── boss: a knight-commander who refuses to yield ──
    { def: 'c_knight', faction: 'enemy', x: 7, y: 0, ai: 'boss', group: 'keep', aggro: 5 },
  ],
  bossDefId: 'c_knight',
  intro: {
    id: 'ch5_intro',
    lines: [
      { speaker: '', text: 'Dawn. The hilltop at Varn. The rebels have ten men and a thin stone wall, and they think that is enough.' },
      { speaker: 'Griffith', portrait: 'griffith', side: 'left', text: 'Pippin. The ladder, on the wall. Casca. The gate, when it falls. Guts — walk first. If anyone asks why, the answer is because.' },
      { speaker: 'Pippin', portrait: 'pippin', side: 'right', expr: 'shocked', text: 'Because. Of course, commander. Because.' },
      { speaker: 'Casca', portrait: 'casca', side: 'left', expr: 'angry', text: 'We have a hundred men below the hill. He has ten behind the wall. Why is anyone walking in first?' },
      { speaker: 'Griffith', portrait: 'griffith', side: 'left', expr: 'neutral', text: 'Because the gate will not fall on its own. Casca. Second wave. Casca — that is not optional.' },
      { speaker: '', text: 'Casca drew her sword. Pippin shouldered the ladder. Guts drew his. The hilltop was quiet for one more breath, and then it was not quiet at all.' },
    ],
  },
  outro: {
    id: 'ch5_outro',
    lines: [
      { speaker: '', text: 'The wall fell at the second hour. Pippin\'s ladder held. Casca\'s second wave swept the gate. Guts stood at the threshold and counted swords he had broken.' },
      { speaker: 'Casca', portrait: 'casca', side: 'right', expr: 'shocked', text: 'Twelve. You broke twelve swords.' },
      { speaker: 'Guts', portrait: 'guts', side: 'left', expr: 'neutral', text: 'They were cheap swords.' },
      { speaker: 'Pippin', portrait: 'pippin', side: 'left', expr: 'shocked', text: 'The ladder held. The ladder held, and I did not get hit, and Casca said the same thing Griffith said, which is to say, she said what he would have said.' },
      { speaker: 'Griffith', portrait: 'griffith', side: 'left', text: 'Casca. Pippin. Both of you — to the camp. Guts. Stay.' },
      { speaker: 'Casca', portrait: 'casca', side: 'right', expr: 'angry', text: 'Why does he always stay?' },
      { speaker: 'Griffith', portrait: 'griffith', side: 'left', expr: 'neutral', text: 'Because he knows what I am about to tell him. Both of you — go.' },
      { speaker: '', text: 'Casca went. Pippin went. Griffith turned to Guts, and the road that Griffith was about to walk became shorter by a hundred men and a hilltop taken.' },
    ],
  },
};
