import type { ChapterDef } from '../engine/types';

// ─── CHAPTER 13 — "The Rescue" ─────────────────────────────────────────────
//
// The rescue team reaches the God Hand's floating island. Griffith — now
// Femto — has been reborn as a demon. Casca is at his side. The team Guts
// has brought: himself, the witch Schierke, the thief Isidro, the dwarf
// Puck. They are not the Band — they are the people who came back for
// Casca.
//
// 14×10 floating isle. The arena is the top of a thorn that has cut
// itself from the world. Mountains on the edges (impassable). The centre
// is a circle of broken stone. Femto lands there. The team enters from
// the south.
//
// Pacing:
//   shard (3)   three lesser god-hand fragments on the south arc.
//   drag (3)    three apostle-slaves flanking the circle — dragon-shapes.
//   casca (1)   Casca herself — she will only be saved when Femto falls.
//   femto (1)   Griffith-as-Femto, the God Hand, the chapter boss.

export const CHAPTER_13: ChapterDef = {
  id: 13,
  name: 'Chapter 13 — The Rescue',
  subtitle: 'The Thorn on the Sea',
  objective: 'Bring down Femto; take Casca',
  weather: 'none',
  map: [
    'MMMMMMMMMMMMMM',
    'M............M',
    'M..T....T....M',
    'M..T....T....M',
    'M....T..T....M',
    'M...FFFF....M.',
    'M....T..T....M',
    'M..T....T....M',
    'M..T....T....M',
    'MMMMMMM.MMMMMM',
  ],
  // Players enter from the southern opening (col 6 row 9).
  playerStart: [[5, 8], [6, 8], [7, 8], [8, 8]],
  units: [
    // Guts and the team that came back for Casca. Rickert has grown up;
// Corkus and Pippin are the Hawk survivors who could be spared. (For
// chapters where the canon party includes characters without existing
// templates — Schierke, Isidro, Serpico, Farnese — we keep the roster
// lean and let the four-unit lineup carry the moment.)
    { def: 'guts', faction: 'player', x: 5, y: 8 },
    { def: 'rickert', faction: 'player', x: 6, y: 8 },
    { def: 'corkus', faction: 'player', x: 7, y: 8 },
    { def: 'pippin', faction: 'player', x: 8, y: 8 },

    // ── shard: three lesser god-hand fragments ──
    //   They sit on the south arc. They wake when players enter the
    //   circle.
    { def: 'a_lesser', faction: 'enemy', x: 4, y: 6, level: 7, group: 'shard', aggro: 4 },
    { def: 'a_lesser', faction: 'enemy', x: 6, y: 7, level: 7, group: 'shard', aggro: 4 },
    { def: 'a_lesser', faction: 'enemy', x: 9, y: 6, level: 7, group: 'shard', aggro: 4 },

    // ── drag: three apostle-slaves flanking the circle ──
    //   They emerge from the woods on the west and east edges when
    //   players cross y<=6.
    { def: 'a_swarm', faction: 'enemy', x: 2, y: 3, level: 9, group: 'drag', aggro: 4 },
    { def: 'a_swarm', faction: 'enemy', x: 11, y: 3, level: 9, group: 'drag', aggro: 4 },
    { def: 'a_swarm', faction: 'enemy', x: 6, y: 3, level: 9, group: 'drag', aggro: 4 },

    // ── casca herself: the rescue target ──
    //   NOTE: she is an enemy here because she is under Femto's control.
    //   Killing her unit will release her; this is the trigger for the
    //   chapter resolution.
    { def: 'casca', faction: 'enemy', x: 6, y: 5, level: 6, group: 'casca', aggro: 5 },

    // ── femto: Griffith-as-Femto, the chapter boss ──
    { def: 'femto', faction: 'enemy', x: 6, y: 4, ai: 'boss', group: 'femto', aggro: 5 },
  ],
  bossDefId: 'femto',
  intro: {
    id: 'ch13_intro',
    lines: [
      { speaker: '', text: 'The thorn that had cut itself from the world. It floated. At its tip, the God Hand had made camp.' },
      { speaker: '', text: 'Guts flew the ship up. Schierke held the sail. Isidro held his breath. Puck held the rope that held them to the deck.' },
      { speaker: '', text: 'Casca was at the centre of the circle. She was holding the wings of a man she had loved. The wings were not hers. The wings were not even his any more.' },
    ],
  },
  outro: {
    id: 'ch13_outro',
    lines: [
      { speaker: '', text: 'Femto fell. The wings folded. Casca fell with him.' },
      { speaker: '', text: 'Guts caught her.' },
      { speaker: 'Guts', portrait: 'guts', side: 'left', expr: 'neutral', text: 'Casca. Casca, we have come for you. We have come for you, and we have arrived, and you are here.' },
      { speaker: '', text: 'She did not speak. She looked at his face. She put her arms around his neck — or did the arms Guts had around her move for her — and the thorn began to fall apart, and the sea that it had cut itself from reached up for them, and Schierke flew the ship down out of the sky.' },
    ],
  },
};
