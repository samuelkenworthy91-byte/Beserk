import type { ChapterDef } from '../engine/types';

// ─── CHAPTER 7 — "Before Doldrey" ──────────────────────────────────────────
//
// The night before Doldrey. Griffith has sent Guts, Casca, and Judeau on a
// scouting mission up the river road to a small fortress that's been
// harassed by imperial scouts. If the scouts have lit signal fires, the
// Imperial main body will know the Band is here. They need to be put out.
//
// 14×10 night map. The fortress walls run along cols 9–11 (rows 1–8).
// The forest wraps the south and west (cover for the players). A dry
// moat on the east of the wall is impassable to foot soldiers. The
// signal-fire pyre is parked at the centre of the fortress on row 3.
//
// Pacing:
//   outrider (4)  four mounted scouts walking the road west of the
//                 fortress. patrol AI — they pace back and forth.
//   ward (2)      two wardens inside the gate keeping the doors shut.
//                 Dormant until a player crosses the wall.
//   pyre (2)      two soldiers guarding the pyre itself; they're the
//                 last line between the players and the signal fire.
//                 (The pyre itself is not a unit — but killing them is
//                 the chapter's mid-act goal.)
//   captain (1)   the imperial centurion. Boss AI; holds a tower on the
//                 south-east corner of the fortress.

export const CHAPTER_7: ChapterDef = {
  id: 7,
  name: 'Chapter 7 — Before Doldrey',
  subtitle: 'The Signal Fire at Foross',
  objective: 'Put out the signal fire; defeat the centurion',
  weather: 'none',
  map: [
    'T.........~~~~',
    'T..C.....~~~~~',
    'T..C.....~~~~~',
    'T..C.....~~~~~',
    'T..C.....~~~~~',
    'T..C.....~~~~~',
    'T..C.....~~~~~',
    'T.........~~~~',
    'TT..RR.......~',
    'TT...........~',
  ],
  // Players enter from the south-west where the trees are densest; the
  // open road is too exposed for a night scout.
  playerStart: [[2, 9], [3, 9], [4, 9]],
  units: [
    { def: 'guts', faction: 'player', x: 2, y: 9 },
    { def: 'casca', faction: 'player', x: 3, y: 9 },
    { def: 'judeau', faction: 'player', x: 4, y: 9 },

    // ── outrider: four mounted scouts west of the fortress, on the road ──
    //   They patrol the south road (anchor at their deployment tile).
    //   aggro=3: walking into their patrol range wakes all four.
    { def: 'e_archer', faction: 'enemy', x: 6, y: 8, level: 3, ai: 'patrol', group: 'outrider', aggro: 3 },
    { def: 'e_archer', faction: 'enemy', x: 7, y: 8, level: 3, ai: 'patrol', group: 'outrider', aggro: 3 },
    { def: 'e_fighter', faction: 'enemy', x: 6, y: 6, level: 3, ai: 'patrol', group: 'outrider', aggro: 3 },
    { def: 'e_fighter', faction: 'enemy', x: 7, y: 6, level: 3, ai: 'patrol', group: 'outrider', aggro: 3 },

    // ── ward: two wardens inside the gate ──
    //   Dormant until any player crosses the wall (x>=3).
    { def: 'e_soldier', faction: 'enemy', x: 4, y: 3, level: 4, group: 'ward', aggro: 4 },
    { def: 'e_soldier', faction: 'enemy', x: 5, y: 3, level: 4, group: 'ward', aggro: 4 },

    // ── pyre: two soldiers guarding the signal fire ──
    //   The pyre itself isn't a unit — it lives on the dialogue. The
    //   guards are the last line; killing both is the mid-chapter goal.
    { def: 'e_soldier', faction: 'enemy', x: 7, y: 3, level: 4, group: 'pyre', aggro: 4 },
    { def: 'e_archer', faction: 'enemy', x: 8, y: 3, level: 4, group: 'pyre', aggro: 4 },

    // ── boss: an imperial centurion commanding the small fortress ──
    { def: 'c_centurion', faction: 'enemy', x: 8, y: 1, ai: 'boss', group: 'ward', aggro: 5 },
  ],
  bossDefId: 'c_centurion',
  intro: {
    id: 'ch7_intro',
    lines: [
      { speaker: '', text: 'The night before Doldrey. The river was running clear and the road north to Foross was a road the Band had walked before.' },
      { speaker: 'Griffith', portrait: 'griffith', side: 'left', text: 'There is a signal fire at Foross. There is also a centurion. The centurion commands twenty men. The signal fire commands the hundred thousand.' },
      { speaker: 'Casca', portrait: 'casca', side: 'right', expr: 'shocked', text: 'Twenty men. Three of us. For a signal fire that must not be lit.' },
      { speaker: 'Griffith', portrait: 'griffith', side: 'left', expr: 'neutral', text: 'You are not three of us. You are the vanguard. You are the only three. Tonight — that is the same thing.' },
      { speaker: 'Judeau', portrait: 'judeau', side: 'left', text: 'Outriders first. Outriders are patrol, four of them, mounted. After them the gate. After the gate the pyre. After the pyre, if you can find him, the centurion.' },
      { speaker: 'Guts', portrait: 'guts', side: 'right', expr: 'angry', text: 'Then stop talking. Walk.' },
      { speaker: '', text: 'Casca drew her sword. Judeau had a knife out and the other one in his mouth. Guts\' sword was already in his hand; he had not drawn it on purpose.' },
    ],
  },
  outro: {
    id: 'ch7_outro',
    lines: [
      { speaker: '', text: 'The pyre did not light. The centurion was carried, unconscious, to a ditch. The outriders were left where they fell. The night was quiet again.' },
      { speaker: 'Casca', portrait: 'casca', side: 'right', text: 'Twelve hours until Doldrey. Twelve hours — and the signal never went up.' },
      { speaker: 'Griffith', portrait: 'griffith', side: 'left', text: 'Guts. Judeau. To camp. Casca. Stay.' },
      { speaker: 'Judeau', portrait: 'judeau', side: 'right', expr: 'shocked', text: 'Twelve hours. Twelve hours ago I was sharpening a knife. Now the war starts and I have not slept.' },
      { speaker: 'Griffith', portrait: 'griffith', side: 'left', expr: 'neutral', text: 'Casca. The centurion carried a list. There is a name on it I would like you to read to me. There is a name on it I would like you to forget.' },
      { speaker: 'Casca', portrait: 'casca', side: 'right', expr: 'shocked', text: 'A name you would like me to forget, before a battle where we may all die. You ask a great deal.' },
      { speaker: 'Griffith', portrait: 'griffith', side: 'left', text: 'I always have. You always do. Tomorrow — we do not lose. Because you will not lose. And I have not told you why yet.' },
      { speaker: '', text: 'And the night before Doldrey, the Band of the Hawk went quiet. In the morning they would walk a road that the war would not let them walk back.' },
    ],
  },
};
