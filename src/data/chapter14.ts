import type { ChapterDef } from '../engine/types';

// ─── CHAPTER 14 — "The Second Eclipse" ──────────────────────────────────────
//
// The Falcon of Darkness flies over Falconia. Griffith-as-God-Hand has
// returned, and the city he founded is screaming. The Band — what is left
// of the Band, what has come back to the Band — climb onto Ganishka's
// crumbling body and fight up to where Griffith is waiting.
//
// This is the chapter that closes the 14-chapter run. Six players. The
// boss is Griffith/Femto at full God-Hand power.
//
// 14×10 storm-scape. The arena is Ganishka's giant-thorn flying above
// Falconia. Mountain walls on the edges. The centre is a clearing of
// broken stone. Griffith is at the centre. Players spawn at the south.
//
// Pacing:
//   mass  (5)   five apostle-shapes emerging from the storm on the
//               south arc. They wake on turn 1 (no aggro gating —
//               there is no time for dormancy).
//   swirl (4)   four lesser apostles circling the central clearing.
//               Active from turn 1.
//   hawk  (1)   Griffith-as-Femto at full God-Hand. The chapter boss.

export const CHAPTER_14: ChapterDef = {
  id: 14,
  name: 'Chapter 14 — The Second Eclipse',
  subtitle: 'The Falcon at Falconia',
  objective: 'Reach Griffith; cut him down',
  weather: 'rain',
  map: [
    'MMMMMMMMMMMMMM',
    'M.T......T...M',
    'M..T....T....M',
    'M....T.T.....M',
    'M............M',
    'M....FFFF....M',
    'M...........M.',
    'M..T....T....M',
    'M.T........T.M',
    'MMMMMM.GMMMMMM',
  ],
  // Players enter from the south opening (col 6 row 9).
  playerStart: [[4, 8], [5, 8], [6, 8], [7, 8], [8, 8], [9, 8]],
  units: [
    // The full Hawk roster — the chapter reunites everyone.
    { def: 'guts', faction: 'player', x: 4, y: 8 },
    { def: 'casca', faction: 'player', x: 5, y: 8 },
    { def: 'judeau', faction: 'player', x: 6, y: 8 },
    { def: 'corkus', faction: 'player', x: 7, y: 8 },
    { def: 'pippin', faction: 'player', x: 8, y: 8 },
    { def: 'rickert', faction: 'player', x: 9, y: 8 },

    // ── mass: five apostle-shapes on the south arc, all active from turn 1 ──
    { def: 'a_lesser', faction: 'enemy', x: 3, y: 7, level: 8, group: 'mass', active: true, aggro: 99 },
    { def: 'a_lesser', faction: 'enemy', x: 6, y: 7, level: 8, group: 'mass', active: true, aggro: 99 },
    { def: 'a_lesser', faction: 'enemy', x: 9, y: 7, level: 8, group: 'mass', active: true, aggro: 99 },
    { def: 'a_lesser', faction: 'enemy', x: 4, y: 6, level: 8, group: 'mass', active: true, aggro: 99 },
    { def: 'a_lesser', faction: 'enemy', x: 10, y: 6, level: 8, group: 'mass', active: true, aggro: 99 },

    // ── swirl: four swirling apostles around the central clearing ──
    { def: 'a_swarm', faction: 'enemy', x: 3, y: 4, level: 10, group: 'swirl', active: true, aggro: 99 },
    { def: 'a_swarm', faction: 'enemy', x: 11, y: 4, level: 10, group: 'swirl', active: true, aggro: 99 },
    { def: 'a_swarm', faction: 'enemy', x: 5, y: 3, level: 10, group: 'swirl', active: true, aggro: 99 },
    { def: 'a_swarm', faction: 'enemy', x: 9, y: 3, level: 10, group: 'swirl', active: true, aggro: 99 },

    // ── hawk: Griffith-as-Void-Form at full God-Hand-Eclipse power. ──
    //   Distinct from chapter 13's Femto — the second-eclipse-incarnation
    //   has merged Griffith with the Idea of Evil. He is the hawk, the
    //   city, and the dream. He has begun to be Falconia itself.
    { def: 'void_form', faction: 'enemy', x: 7, y: 5, ai: 'boss', group: 'hawk', active: true, aggro: 99 },
  ],
  bossDefId: 'void_form',
  intro: {
    id: 'ch14_intro',
    lines: [
      { speaker: '', text: 'The Falcon of Darkness flew over Falconia. The city below had been Griffith\'s, and Griffith was the city, and Griffith was the Falcon, and the Falcon was eating the city that had been his.' },
      { speaker: '', text: 'Guts, Casca, Judeau, Corkus, Pippin, Rickert — six of them — stood on Ganishka\'s crumbling spine and walked north. They did not speak. They had said everything they were going to say.' },
      { speaker: '', text: 'Above them, a man was waiting who had been their friend, and their king, and their general, and their ruin.' },
    ],
  },
  outro: {
    id: 'ch14_outro',
    lines: [
      { speaker: '', text: 'The Band — what was left of the Band, what had come back, what had never left — fought their way to the clearing.' },
      { speaker: '', text: 'Femto was waiting. The Band of the Hawk was waiting. They were the same people, and they were not.' },
      { speaker: 'Guts', portrait: 'guts', side: 'left', expr: 'angry', text: 'You saved me once. I have come to save you back. The debt is paid. Now stand.' },
      { speaker: '', text: 'Griffith stood. The sword in Guts\' hand was the same sword he had lifted fifteen years before, and Griffith\'s wound had never closed where Guts had cut it first, and Griffith looked at Guts and Guts looked at Griffith, and the band of the hawk went around them, and rose.' },
      { speaker: '', text: 'On Ganishka\'s spine the Band fought. Down below Falconia screamed. Above them the storm broke into rain that tasted like iron. Behind them, the world they had walked out of was waiting for the dawn.' },
    ],
  },
};
