import type { ChapterDef } from '../engine/types';

// ─── CHAPTER 4 — "First Command" ────────────────────────────────────────────
//
// The Band is three weeks out of Asthoreth. Griffith has ordered the strike
// trio — Guts, Casca, Judeau — to take the night watch at the western gate
// of Vritannis, a market town that has refused to surrender to the Hawk.
//
// It's Guts' first command under Griffith's orders: the door comes down, you
// walk through, and you stop when there's nothing left that can swing a sword.
// Casca second, Judeau third; if any of them fall, Griffith will be furious,
// and it will be Guts' fault.
//
// 14×10 map. The town is bounded by a stone wall on the west (col 0) and a
// river on the east (cols 12–13). The keep is on row 0 cols 1–3. The gate
// is on the south wall (row 9 col 0–1) — but the chapter opens with the gate
// already broken, so the players enter from the southern road.
//
// Pacing:
//   walls (3)    three pikemen inside the wall — they hold the gate and only
//                fight if the players push north of the wall (y<6).
//   patrol (2)   two civilians-turned-soldiers walking the south road; their
//                patrol anchor is the gate, direction initially east. They
//                wake when the players enter the southern road.
//   garrison (3) the keep defenders — wake only if the players cross the
//                bridge of corpses that becomes the main street.
//   captain (1)  a wounded knight inside the keep — the chapter boss.

export const CHAPTER_4: ChapterDef = {
  id: 4,
  name: 'Chapter 4 — First Command',
  subtitle: 'The Gate at Vritannis',
  objective: 'Defeat the town captain in his keep',
  weather: 'rain',
  map: [
    '.FFFTT~~......',
    '.............~',
    '.R...........~',
    '.R...........~',
    '.R....T.T....~',
    '.R...........~',
    '.G...........~',
    '.R...........~',
    '.R...........~',
    '..R..........~',
  ],
  // Guts leads, Casca second, Judeau third — filing onto the south road
  // in single file (the night's mud, narrow street).
  playerStart: [[1, 9], [2, 9], [3, 9]],
  units: [
    { def: 'guts', faction: 'player', x: 1, y: 9 },
    { def: 'casca', faction: 'player', x: 2, y: 9 },
    { def: 'judeau', faction: 'player', x: 3, y: 9 },

    // ── wall garrison: three pikemen inside the gate ──
    //   They hold the gate and the keep approach. Dormant until the players
    //   cross y=6 (the wall).
    { def: 'e_soldier', faction: 'enemy', x: 2, y: 4, level: 2, group: 'walls', aggro: 3 },
    { def: 'e_soldier', faction: 'enemy', x: 4, y: 5, level: 2, group: 'walls', aggro: 3 },
    { def: 'e_archer', faction: 'enemy', x: 5, y: 3, level: 2, group: 'walls', aggro: 4 },

    // ── patrol: two soldiers east of the gate along the southern road ──
    //   They pace the south-east road (their anchor is at x=2,y=8, dir=+1
    //   i.e. east). Wake when the players move within 4 tiles.
    { def: 'e_soldier', faction: 'enemy', x: 6, y: 8, level: 2, ai: 'patrol', group: 'patrol', aggro: 4 },
    { def: 'e_soldier', faction: 'enemy', x: 9, y: 9, level: 2, ai: 'patrol', group: 'patrol', aggro: 4 },

    // ── keep garrison: two soldiers inside the fort ──
    //   Dormant until any player crosses the wall (y<=5).
    { def: 'e_soldier', faction: 'enemy', x: 8, y: 3, level: 3, group: 'garrison', aggro: 3 },
    { def: 'e_archer', faction: 'enemy', x: 10, y: 4, level: 3, group: 'garrison', aggro: 4 },

    // ── the captain himself — wounded knight holding the keep tower ──
    { def: 'c_veteran', faction: 'enemy', x: 1, y: 0, ai: 'boss', group: 'garrison', aggro: 5 },
  ],
  bossDefId: 'c_veteran',
  intro: {
    id: 'ch4_intro',
    lines: [
      { speaker: '', text: 'Vritannis. A market town on the river road. The gate was broken at midnight.' },
      { speaker: 'Griffith', portrait: 'griffith', side: 'left', text: 'Casca. Judeau. You hold the rear. Guts takes point.' },
      { speaker: 'Casca', portrait: 'casca', side: 'right', expr: 'shocked', text: 'Guts takes point? He\'s been one of us three weeks.' },
      { speaker: 'Griffith', portrait: 'griffith', side: 'left', expr: 'neutral', text: 'He is Guts. I will not tell him where to swing. He will not need to be told.' },
      { speaker: 'Judeau', portrait: 'judeau', side: 'right', text: 'Two soldiers inside the gate. One\'s an archer on the keep. And the captain holds the tower. Griffith — any word on the gate watch?' },
      { speaker: 'Griffith', portrait: 'griffith', side: 'left', text: 'Two more on the south road. They patrol east to the river and back. If they see you, kill them quiet. If they see you loud, kill them louder.' },
      { speaker: '', text: 'The night smelled of river mud and wet iron. Casca drew her sword. Guts drew his. Judeau had already drawn his.' },
    ],
  },
  outro: {
    id: 'ch4_outro',
    lines: [
      { speaker: '', text: 'The keep fell before dawn. The wounded captain yielded his sword, then his life.' },
      { speaker: 'Casca', portrait: 'casca', side: 'right', expr: 'angry', text: 'You let me draw rear. The rear was empty. You went alone and fought through three of them.' },
      { speaker: 'Guts', portrait: 'guts', side: 'left', expr: 'neutral', text: 'You said hold the rear. I held the rear — by being the front.' },
      { speaker: 'Casca', portrait: 'casca', side: 'right', expr: 'shocked', text: 'That is not what rear means. That is the opposite of what rear means.' },
      { speaker: 'Griffith', portrait: 'griffith', side: 'left', text: 'It is what rear means when Guts is in it. Casca — learn the difference between orders and outcomes. Both are useful.' },
      { speaker: 'Judeau', portrait: 'judeau', side: 'right', expr: 'shocked', text: 'He killed three soldiers on the road before I caught up with him. I was supposed to be running messages. I had no messages to run.' },
      { speaker: 'Griffith', portrait: 'griffith', side: 'left', expr: 'neutral', text: 'Casca. Judeau. Take the night\'s loot to the camp. Guts — walk with me.' },
      { speaker: '', text: 'And so the first command was the second-to-last thing Griffith said to him that night. The last thing was the road.' },
    ],
  },
};
