import type { ChapterDef } from '../engine/types';

// ─── CHAPTER 3 — "The Bridge at Asthoreth" ──────────────────────────────────
//
// The Band's first assignment together. A rebel garrison holds the river
// crossing at Asthoreth, and the royal road to Doldrey goes through it. The
// Hawk gives Guts and Judeau the dawn watch. Casca stays behind with the
// main body — Griffith is testing whether the new sword swings where he
// tells it to swing.
//
// 14×10 map. Two halves divided by a river (rows 4–5), with a single bridge
// at x=6. The bridge is the only place to cross without going around the
// world. The fort on the north bank holds the rebel captain.
//
// Pacing:
//   bridge (2)        two soldiers watching the bridge from the south bank
//   patrols (2)       a pair patrolling the road between town and bridge
//   keep  (2)         the captain + one guard inside the fort (north bank)
//
// The bridge guards wake as soon as Guts steps onto a road tile near them.
// The patrols wake if Guts enters the southern half of the map. The keep
// garrison stays dormant — they only fight if Guts crosses the bridge.

export const CHAPTER_3: ChapterDef = {
  id: 3,
  name: 'Chapter 3 — The Bridge at Asthoreth',
  subtitle: 'A Way Through',
  objective: 'Defeat the rebel captain at the bridge',
  weather: 'rain',
  map: [
    '........T..T..',
    '.TTTT......TT.',
    'T.............',
    'T....RRR......',
    '~~~~WRR~~~~~~.',
    '~~~~WRR~~~~~~.',
    'T....RRR......',
    'T.....R.......',
    'T.....R...TTT.',
    'T.....R...TTT.',
  ],
  // Guts and Judeau enter together from the south-west road. Judeau scouted
  // the approach on horseback an hour earlier and knows the patrol schedule.
  playerStart: [[3, 9], [4, 9]],
  units: [
    // ── Guts, leading — Griffith's orders were to follow Judeau's lead ──
    { def: 'guts', faction: 'player', x: 3, y: 9 },
    { def: 'judeau', faction: 'player', x: 4, y: 9 },

    // ── bridge guards — watching the south end of the bridge ──
    //   They see anyone on the southern road within 3 tiles; everything
    //   south of the river is their patch. Wake together.
    { def: 'e_soldier', faction: 'enemy', x: 5, y: 7, level: 2, group: 'bridge', aggro: 3 },
    { def: 'e_soldier', faction: 'enemy', x: 7, y: 7, level: 2, group: 'bridge', aggro: 3 },

    // ── patrols — pacing the road between the bridge and the wood ──
    //   Two soldiers on patrol AI; they walk back and forth and only attack
    //   if an enemy walks into their path. A patient band can avoid them.
    { def: 'e_soldier', faction: 'enemy', x: 2, y: 8, level: 2, ai: 'patrol', group: 'patrol', aggro: 4 },
    { def: 'e_archer', faction: 'enemy', x: 9, y: 8, level: 2, ai: 'patrol', group: 'patrol', aggro: 4 },

    // ── keep garrison — the captain and his aide inside the fort ──
    //   The captain holds the north bank and does not patrol. He wakes only
    //   when Guts crosses the bridge (y<=5).
    { def: 'c_rebel', faction: 'enemy', x: 8, y: 1, ai: 'boss', group: 'keep', aggro: 4 },
    { def: 'e_soldier', faction: 'enemy', x: 10, y: 2, level: 2, group: 'keep', aggro: 4 },
  ],
  bossDefId: 'c_rebel',
  intro: {
    id: 'ch3_intro',
    lines: [
      { speaker: '', text: 'Dawn. The river Asthoreth runs high from spring melt, and the bridge over it is held against the king.' },
      { speaker: 'Judeau', portrait: 'judeau', side: 'left', text: 'Two on the bridge. Two more patrolling the south road. Their captain\'s in the keep with one more — the rest are barracks inside the wall.' },
      { speaker: 'Guts', portrait: 'guts', side: 'right', expr: 'angry', text: 'Then we go through them. Stop talking and walk.' },
      { speaker: 'Judeau', portrait: 'judeau', side: 'left', expr: 'shocked', text: 'You\'re going to do it the loud way, aren\'t you. Of course you are. Fine — I\'ll take the patrol on the right. Whistle if you need help.' },
      { speaker: '', text: 'The Hawk had said: take the bridge quiet. Judeau had said: do what you can. Guts kept walking.' },
    ],
  },
  outro: {
    id: 'ch3_outro',
    lines: [
      { speaker: 'Casca', portrait: 'casca', side: 'right', expr: 'shocked', text: 'You took it. Both flanks — at once. Nobody told me you could swing an axe one-handed and a sword two.' },
      { speaker: 'Guts', portrait: 'guts', side: 'left', expr: 'neutral', text: 'The Hawk sent scouts to plan it. I\'m no scout.' },
      { speaker: 'Casca', portrait: 'casca', side: 'right', expr: 'angry', text: 'Don\'t be modest. The captain ran. Judeau\'s chasing him down on horseback. We hold the bridge until the main body arrives.' },
      { speaker: 'Griffith', portrait: 'griffith', side: 'left', text: 'Casca. Stop shouting. Go help Judeau. Guts — stay.' },
      { speaker: '', text: 'The rain thinned. A hawk wheeled over the river, twice, and was gone.' },
      { speaker: 'Griffith', portrait: 'griffith', side: 'left', expr: 'neutral', text: 'I picked you because you\'re fast, strong, and won\'t die. You\'re proving me right. Don\'t make me wrong.' },
    ],
  },
};
