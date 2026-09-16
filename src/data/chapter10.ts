import type { ChapterDef } from '../engine/types';

// ─── CHAPTER 10 — "Departure" ──────────────────────────────────────────────
//
// Guts has left the Hawks. He is walking the eastern road alone, with a
// horse that has stopped trusting him and a sword that has not stopped
// needing to swing. The demons from the Eclipse have followed. They will
// always follow. The chapter stages Guts on the road at dusk, fighting
// through the stragglers of a pack that has been tracking him for two
// days and not yet caught him.
//
// 14×10 eastern road. Forest on both sides (cover he can't sleep in
// any more). The road runs along the middle. Apostles have caught up
// from behind and are closing in from the trees.
//
// Pacing:
//   road  (3)   three apostles on the road behind him. They saw him
//               walk through town and they followed.
//   flank (3)   three apostles flanking through the trees. They
//               ambush in pairs from both sides.
//   swarm (1)   one large apostle — the chapter boss — comes up the
//               centre of the road. The one that has been tracking
//               him the longest.
//
// Single-player. The chapter's centrepiece is Guts swinging alone,
// and his sword doing the work of a Band that isn't there.

export const CHAPTER_10: ChapterDef = {
  id: 10,
  name: 'Chapter 10 — Departure',
  subtitle: 'The Eastern Road',
  objective: 'Survive the dusk; reach the river',
  weather: 'none',
  map: [
    'TT...TT...T...',
    '..............',
    'TT..........TT',
    '.R............',
    '.R..TTT..T....',
    '.R...........T',
    '.R............',
    '.R.......T...T',
    '.R........TT..',
    'TT.TT.R..T..T.',
  ],
  // Guts walks alone. Spawn at south end of the road.
  playerStart: [[2, 9]],
  units: [
    { def: 'guts', faction: 'player', x: 2, y: 9 },

    // ── road: three apostles chasing him down the road ──
    //   They start already active — they have been chasing him for two
    //   days. They will not stop.
    { def: 'a_lesser', faction: 'enemy', x: 2, y: 4, level: 5, group: 'road', active: true, aggro: 99 },
    { def: 'a_lesser', faction: 'enemy', x: 3, y: 5, level: 5, group: 'road', active: true, aggro: 99 },
    { def: 'a_lesser', faction: 'enemy', x: 2, y: 6, level: 5, group: 'road', active: true, aggro: 99 },

    // ── flank: three apostles in the trees ──
    //   They close from both sides once Guts walks past them.
    { def: 'a_lesser', faction: 'enemy', x: 1, y: 2, level: 5, group: 'flank', active: true, aggro: 99 },
    { def: 'a_lesser', faction: 'enemy', x: 10, y: 4, level: 5, group: 'flank', active: true, aggro: 99 },
    { def: 'a_lesser', faction: 'enemy', x: 1, y: 8, level: 5, group: 'flank', active: true, aggro: 99 },

    // ── swarm: one larger apostle that has been tracking him longest ──
    { def: 'a_swarm', faction: 'enemy', x: 1, y: 3, ai: 'boss', group: 'swarm', active: true, aggro: 99 },
  ],
  bossDefId: 'a_swarm',
  intro: {
    id: 'ch10_intro',
    lines: [
      { speaker: '', text: 'Two days on the eastern road. Guts had not slept. The horse would not stop looking back.' },
      { speaker: '', text: 'There were things behind them. Not people. Not hawks. Shapes that had once been hawks — and before that, once had been people, and before that, no one had ever told them they had once been hawks or people. Now they were just hungry.' },
      { speaker: '', text: 'Guts had stopped asking what they had been. He only asked how many were left, and how many he had killed, and whether the sword was still sharp enough to kill more.' },
    ],
  },
  outro: {
    id: 'ch10_outro',
    lines: [
      { speaker: '', text: 'They came at dusk. They came at dawn. They came at noon. They came every hour the sun stood still. They came every hour it did not.' },
      { speaker: '', text: 'Guts killed them. He walked on. He did not stop to count the bodies because he had started counting at the Eclipse and stopped at the second day because by then they came too thick to count.' },
      { speaker: '', text: 'He walked on. The horse walked. The road bent. The river was at the end of it, and there was smoke behind the river, and behind the smoke there was the man who had sent Casca out of his tent, and behind Casca there was the sound of a sword that had not stopped being swung in a year.' },
    ],
  },
};
