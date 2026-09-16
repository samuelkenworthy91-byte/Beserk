import type { ChapterDef } from '../engine/types';

// ─── CHAPTER 6 — "Band of the Hawk" ─────────────────────────────────────────
//
// The king has formally given command of the Band of the Hawk to Griffith.
// The company is marching the long road east to take a river-fort for the
// royal army — and the rebels have set an ambush in the wood.
//
// 14×10 supply-line map. A road runs along the bottom (row 9, the wagon
// column). Forest blankets the upper half (rows 0–6). The Band's supply
// wagon is parked at the south-east (a static decoration — not a unit).
// The players enter at the south-west and must run the wagons back to
// safety while fending off the ambush from the trees.
//
// Pacing:
//   forest (4)  four archers in the canopy, two tiles deep in the trees.
//               They wake when any player is within their aggro=3.
//   pincer (2)  two soldiers north of the wagon column who close on the
//               road from the east. Wake when players enter the slope.
//   wagon (2)   two escorts south of the wagon column who hold the road
//               itself. They're defending the column, not the players —
//               but if a player approaches, they treat you as a target.
//   captain (1) the rebel captain commanding the ambush from behind the
//               eastern trees; he's the chapter boss. He waits until the
//               firing starts; afterwards he advances.

// Note: the 'Band of the Hawk' as the player's marching company is not
// represented as units — by this point the AI is not strategic enough
// to drive a column across a map, so the chapter stages the moment of
// the ambush rather than its supply-line guards. Griffith appears in
// the outro to take formal command.

export const CHAPTER_6: ChapterDef = {
  id: 6,
  name: 'Chapter 6 — Band of the Hawk',
  subtitle: 'The Ambush at Eberus',
  objective: 'Survive the ambush; defeat the rebel captain',
  weather: 'rain',
  map: [
    '.T..T..T..T...',
    '.T..T..T..T...',
    '.T..T..T..T...',
    'T............T',
    '.T............',
    '.T............',
    'T......T.T....',
    '.....RRR......',
    '....RRRRR.....',
    '.....R..R.....',
  ],
  // Guts leads, Casca seconds; Judeau is already with the wagon column.
  // Corkus and Pippin hold the wagons — but only the player trio enters
  // the map itself: the wagon escorts are AI-controlled NPCs.
  playerStart: [[1, 8], [2, 8], [3, 8]],
  units: [
    { def: 'guts', faction: 'player', x: 1, y: 8 },
    { def: 'casca', faction: 'player', x: 2, y: 8 },
    { def: 'judeau', faction: 'player', x: 3, y: 8 },

    // ── forest archers: ambush from the canopy ──
    //   They see players who enter the trees within 3 tiles; their arrows
    //   have a range of 2, so they can hit players on the slope.
    { def: 'e_archer', faction: 'enemy', x: 2, y: 1, level: 3, group: 'forest', aggro: 3 },
    { def: 'e_archer', faction: 'enemy', x: 4, y: 2, level: 3, group: 'forest', aggro: 3 },
    { def: 'e_archer', faction: 'enemy', x: 8, y: 1, level: 3, group: 'forest', aggro: 3 },
    { def: 'e_archer', faction: 'enemy', x: 10, y: 2, level: 3, group: 'forest', aggro: 3 },

    // ── pincer: two soldiers closing on the column from the east ──
    //   They wake when the players enter the south road.
    { def: 'e_soldier', faction: 'enemy', x: 12, y: 6, level: 3, group: 'pincer', aggro: 3 },
    { def: 'e_fighter', faction: 'enemy', x: 13, y: 7, level: 3, group: 'pincer', aggro: 3 },

    // ── wagon escorts: two escorts south of the wagon column ──
    //   They guard the road itself and engage any player that comes too
    //   close. They function as defenders of the wagon, not the players.
    { def: 'e_soldier', faction: 'enemy', x: 5, y: 9, level: 2, group: 'wagon', aggro: 2 },
    { def: 'e_soldier', faction: 'enemy', x: 8, y: 9, level: 2, group: 'wagon', aggro: 2 },

    // ── boss: rebel captain behind the eastern trees ──
    { def: 'c_pincers', faction: 'enemy', x: 11, y: 4, ai: 'boss', group: 'pincer', aggro: 5 },
  ],
  bossDefId: 'c_pincers',
  intro: {
    id: 'ch6_intro',
    lines: [
      { speaker: '', text: 'The Band was marching east. The wagon column had been three days on the road. Griffith had taken formal command the morning before, and the rain had not stopped since.' },
      { speaker: 'Griffith', portrait: 'griffith', side: 'left', text: 'Guts. Casca. Judeau. Move to the front of the column. We are being watched.' },
      { speaker: 'Judeau', portrait: 'judeau', side: 'right', expr: 'shocked', text: 'Watched — or ambushed? There\'s a difference. One means we ride faster. The other means we ride somewhere else.' },
      { speaker: 'Griffith', portrait: 'griffith', side: 'left', expr: 'neutral', text: 'The other. The road bends east in two miles. The trees on the inside of the bend are too thick. Ride now.' },
      { speaker: 'Casca', portrait: 'casca', side: 'right', expr: 'angry', text: 'Then let the wagons go through ahead of us. We hold the bend.' },
      { speaker: 'Griffith', portrait: 'griffith', side: 'left', text: 'No. We hold the wagons. I will not lose the column for the sake of marching.' },
      { speaker: '', text: 'And so the Band — the hawk and three of its swords — found themselves between the column and the trees, in rain that would not stop.' },
    ],
  },
  outro: {
    id: 'ch6_outro',
    lines: [
      { speaker: '', text: 'The captain died in the rain. His soldiers were not so loyal. The Band had lost two wagons.' },
      { speaker: 'Judeau', portrait: 'judeau', side: 'right', text: 'Two. We lost two wagons. The king\'s grain — it was supposed to be the king\'s grain.' },
      { speaker: 'Griffith', portrait: 'griffith', side: 'left', text: 'It was. It will be replaced. The wagons will be replaced. What will not be replaced is you. So I held you.' },
      { speaker: 'Casca', portrait: 'casca', side: 'right', expr: 'shocked', text: 'You held us against two hundred men for two wagons of grain. You held us against two hundred men for —' },
      { speaker: 'Griffith', portrait: 'griffith', side: 'left', expr: 'neutral', text: 'For me, Casca. Not for the grain. Not for the king. For me. The grain will be replaced. The three of you will not.' },
      { speaker: 'Guts', portrait: 'guts', side: 'right', expr: 'neutral', text: 'You don\'t say things like that. Not out loud. Not where others can hear.' },
      { speaker: 'Griffith', portrait: 'griffith', side: 'left', text: 'I said it. So I will. To you. Now go. To the camp. The wagon train waits.' },
      { speaker: '', text: 'And so the Band of the Hawk — the hawk and three swords it had chosen — rode east through rain that did not stop, with two fewer wagons and a captain less.' },
    ],
  },
};
