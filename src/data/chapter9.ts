import type { ChapterDef } from '../engine/types';

// ─── CHAPTER 9 — "Bonfire of Dreams" ────────────────────────────────────────
//
// Guts has been sent on a foraging errand. The Band's camp is on the
// river plain at Windham, and a falconer's hawk is riding the high ground
// waiting for it. What rides out of the woods at dusk is not a hawk.
//
// The eclipse has begun. Demons pour through the cracks. Apostles — human
// shapes that turn at the full moon, or at the smell of weakness — have
// come for Griffith first, and after Griffith, the rest of the Band.
// Casca, Judeau, Corkus, Pippin, Rickert — they were his people. They
// were the Band. Tonight they die together.
//
// 14×10 river-plain camp. The Band's tent is on the north side. The
// players spawn south of it. Apostles pour in from every edge. There is
// no retreat; the chapter is a last stand. The boss is the vortex
// apostle — a humanoid shape with too many arms and a mouth that should
// not be on a face.
//
// Pacing:
//   north (3)    three lesser apostles coming down from the north woods.
//   east  (3)    three crawling apostles emerging from the river east.
//   west  (3)    three reaching apostles climbing out of the western
//                marsh.
//   south (3)    three apostles in the southern road; they close on the
//                camp from behind.
//   vortex (1)   the vortex apostle — boss AI — Materialising in the
//                centre of the camp.

export const CHAPTER_9: ChapterDef = {
  id: 9,
  name: 'Chapter 9 — Bonfire of Dreams',
  subtitle: 'The Eclipse at Windham',
  objective: 'Survive the first hour of the eclipse',
  weather: 'none',
  map: [
    '..TT..HHH..TT.',
    '..T...HHH...T.',
    '......HHH.....',
    '..............',
    '....T....T....',
    '....T....T....',
    '..............',
    '....H........T',
    '....H........T',
    '....HHHH......',
  ],
  // Players enter from the south-east corner. Guts arrives last — he was
  // foraging in the woods when the eclipse started and has not yet
  // heard the screaming.
  playerStart: [[10, 9], [11, 9], [12, 9], [13, 9]],
  units: [
    // Guts is off-map. The chapter plays with the four Band members who
    // are still in camp when the eclipse lands — Casca, Judeau, Pippin,
    // Corkus.
    { def: 'casca', faction: 'player', x: 10, y: 9 },
    { def: 'judeau', faction: 'player', x: 11, y: 9 },
    { def: 'pippin', faction: 'player', x: 12, y: 9 },
    { def: 'corkus', faction: 'player', x: 13, y: 9 },

    // ── north: three lesser apostles coming down from the north woods ──
    //   They materialise at the tree-line and walk south. They wake on
    //   turn 1 — the eclipse is already happening.
    { def: 'a_lesser', faction: 'enemy', x: 1, y: 1, level: 5, group: 'north', active: true, aggro: 99 },
    { def: 'a_lesser', faction: 'enemy', x: 2, y: 2, level: 5, group: 'north', active: true, aggro: 99 },
    { def: 'a_lesser', faction: 'enemy', x: 3, y: 3, level: 5, group: 'north', active: true, aggro: 99 },

    // ── east: three crawling apostles from the river ──
    { def: 'a_lesser', faction: 'enemy', x: 11, y: 2, level: 5, group: 'east', active: true, aggro: 99 },
    { def: 'a_lesser', faction: 'enemy', x: 12, y: 3, level: 5, group: 'east', active: true, aggro: 99 },
    { def: 'a_lesser', faction: 'enemy', x: 13, y: 4, level: 5, group: 'east', active: true, aggro: 99 },

    // ── west: three reaching apostles from the marsh ──
    { def: 'a_lesser', faction: 'enemy', x: 2, y: 5, level: 5, group: 'west', active: true, aggro: 99 },
    { def: 'a_lesser', faction: 'enemy', x: 1, y: 6, level: 5, group: 'west', active: true, aggro: 99 },
    { def: 'a_lesser', faction: 'enemy', x: 3, y: 7, level: 5, group: 'west', active: true, aggro: 99 },

    // ── south: three apostles in the southern road ──
    //   These close on the camp from behind — the players spawn south of
    //   them but the apostles are bigger and they want to be first.
    { def: 'a_lesser', faction: 'enemy', x: 6, y: 7, level: 5, group: 'south', active: true, aggro: 99 },
    { def: 'a_lesser', faction: 'enemy', x: 7, y: 6, level: 5, group: 'south', active: true, aggro: 99 },
    { def: 'a_lesser', faction: 'enemy', x: 8, y: 5, level: 5, group: 'south', active: true, aggro: 99 },

    // ── vortex apostle: the eclipse itself, given a body ──
    //   The chapter boss. Awakened on turn 1 — the eclipse is already
    //   happening; there is no waking trigger.
    { def: 'a_vortex', faction: 'enemy', x: 6, y: 4, ai: 'boss', group: 'vortex', active: true, aggro: 99 },
  ],
  bossDefId: 'a_vortex',
  intro: {
    id: 'ch9_intro',
    lines: [
      { speaker: '', text: 'Dusk. The falconer\'s hawk did not return. The Band did not expect the eclipse — nobody in Midland had seen one before, and the scholars on the matter were not at the camp.' },
      { speaker: 'Casca', portrait: 'casca', side: 'left', expr: 'shocked', text: 'Something\'s wrong with the sky. The light — it\'s not — there\'s no colour.' },
      { speaker: 'Judeau', portrait: 'judeau', side: 'right', expr: 'shocked', text: 'Griffith is in his tent. They\'ve been talking for an hour. He asked not to be disturbed. He will have to be disturbed. There\'s something coming out of the woods.' },
      { speaker: 'Pippin', portrait: 'pippin', side: 'right', text: 'The horses are screaming. The horses have never screamed before. They sound — they sound like men.' },
      { speaker: 'Corkus', portrait: 'corkus', side: 'left', expr: 'shocked', text: 'It\'s not raining. Why am I wet. Why am I — why is it on my — ' },
      { speaker: '', text: 'He did not finish. Something reached out of the tent behind him and pulled him through it.' },
    ],
  },
  outro: {
    id: 'ch9_outro',
    lines: [
      { speaker: '', text: 'Guts came back from the woods at the second hour. He had not seen the eclipse yet. He had not seen the camp yet. He saw both at once.' },
      { speaker: 'Casca', portrait: 'casca', side: 'right', expr: 'shocked', text: 'Guts. Guts, the camp is — the camp is — ' },
      { speaker: 'Guts', portrait: 'guts', side: 'left', expr: 'angry', text: 'Where is Griffith. Where is Judeau. Where is — ' },
      { speaker: '', text: 'He walked into the camp. He did not find Judeau. He did not find Pippin. He did not find Corkus. He found Casca, who was standing in the middle of the wreckage holding a sword she did not know how to put down.' },
      { speaker: 'Casca', portrait: 'casca', side: 'right', text: 'I killed it. There was a — there was a thing with too many arms, and I killed it. I killed it because it killed Judeau first, and Pippin second, and Corkus was — ' },
      { speaker: 'Guts', portrait: 'guts', side: 'left', expr: 'angry', text: 'Where is Griffith. Casca. WHERE IS GRIFFITH.' },
      { speaker: '', text: 'She did not answer. He looked at the tent. He knew, before he opened it.' },
      { speaker: 'Casca', portrait: 'casca', side: 'right', expr: 'shocked', text: 'He is — they made him — he is — ' },
      { speaker: 'Guts', portrait: 'guts', side: 'left', expr: 'angry', text: 'Stop. Do not say it. Do not — ' },
      { speaker: '', text: 'He opened the tent. He saw. He walked out carrying Griffith over his shoulder, and the Band of the Hawk fell to one sword and one thousand hands behind it, and the dawn that came was the dawn Guts has been walking ever since.' },
    ],
  },
};
