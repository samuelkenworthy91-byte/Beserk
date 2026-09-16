import type { ChapterDef } from '../engine/types';

// ─── CHAPTER 12 — "Return" ─────────────────────────────────────────────────
//
// The world has changed. The Incarnation ceremony has pulled the souls of
// the dead into a new world. Fantasia is the name the elves give it.
// Casca — her mind shattered at the Eclipse — has been living at Godot's
// ship with the new Band of the Hawk. She does not remember Guts by name.
// She remembers him by sword.
//
// Guts walks into the ship with his new party. Casca fights him because
// Casca has been fighting for two years and has not yet stopped fighting
// and will not stop fighting until she knows the man behind the sword.
// The chapter is the moment she stops.
//
// 14×10 ship deck. The ship has docked at a moonlit cove. The deck runs
// from south to north, the gangplank on the south edge. The new Band
// (Casca led, plus three followers) holds the deck. Guts enters alone.
//
// Pacing:
//   crew  (3)   three shipmates of the new Band.
//   sentry (2)  two sentries on the gangway.
//   casca  (1)  Casca herself — chapter boss. She does not yield by
//               dying. She yields by being recognised.

export const CHAPTER_12: ChapterDef = {
  id: 12,
  name: 'Chapter 12 — Return',
  subtitle: 'The Ship at Vritannis',
  objective: 'Be recognised',
  weather: 'none',
  map: [
    '..~~..........',
    '..~~..........',
    '..............',
    '.CCC..........',
    '.C.C..........',
    '.C.C..........',
    '.CCC..........',
    '..............',
    '....RR........',
    '....G.........',
  ],
  // Guts enters from the south gangway.
  playerStart: [[5, 9]],
  units: [
    { def: 'guts', faction: 'player', x: 5, y: 9 },

    // ── crew: three shipmates of the new Band ──
    //   They hold the deck. They don't know Guts. They will fight him.
    //   aggro=99 + active: true — they've been on watch since moonrise.
    { def: 'e_archer', faction: 'enemy', x: 4, y: 6, level: 4, group: 'crew', active: true, aggro: 99 },
    { def: 'e_soldier', faction: 'enemy', x: 7, y: 6, level: 4, group: 'crew', active: true, aggro: 99 },
    { def: 'e_fighter', faction: 'enemy', x: 10, y: 5, level: 4, group: 'crew', active: true, aggro: 99 },

    // ── sentry: two sentries on the gangway ──
    //   They are on watch at all times; the new Band's standing orders
    //   are: anyone approaching the gangway is to be cut down.
    { def: 'e_soldier', faction: 'enemy', x: 5, y: 7, level: 4, group: 'sentry', active: true, aggro: 99 },
    { def: 'e_soldier', faction: 'enemy', x: 6, y: 7, level: 4, group: 'sentry', active: true, aggro: 99 },

    // ── casca: Casca herself, at the prow of the ship ──
    //   Chapter boss. She does not yield by death. She yields by being
    //   recognised — at which point the chapter ends differently.
    //   Active from turn 1 — Casca has not stopped fighting in two years.
    { def: 'casca', faction: 'enemy', x: 6, y: 4, ai: 'boss', group: 'casca', active: true, aggro: 99 },
  ],
  bossDefId: 'casca',
  intro: {
    id: 'ch12_intro',
    lines: [
      { speaker: '', text: 'The ship had been at the cove for three days. Casca had not spoken. She had not stopped swinging.' },
      { speaker: '', text: 'Godot\'s ship rides the moonlit water like a coffin with one oar still in the water. The new Band does not speak of who they were before the Eclipse. They have all been torn by something.' },
      { speaker: '', text: 'Guts walked up the gangway. He did not know Casca was aboard. He did not know who was aboard. He had come for the dock and the water and the shipwright who could mend his armour.' },
      { speaker: '', text: 'Casca saw him and drew her sword.' },
    ],
  },
  outro: {
    id: 'ch12_outro',
    lines: [
      { speaker: '', text: 'Casca fought him for an hour. She cut him across the chest. He did not parry. He did not move.' },
      { speaker: 'Casca', portrait: 'casca', side: 'right', expr: 'angry', text: 'Stand still, you — ' },
      { speaker: '', text: 'He stood still. He lifted the sword out of her hand. He looked at her. She looked at him, and what was left of her that was not screaming saw him, and she did not stop fighting, but the fighting was different now.' },
      { speaker: 'Casca', portrait: 'casca', side: 'right', expr: 'shocked', text: 'Guts. Guts. You — you are — ' },
      { speaker: 'Guts', portrait: 'guts', side: 'left', expr: 'neutral', text: 'I am here.' },
      { speaker: '', text: 'She did not put her arms around him. She did not have the arms. She put her sword back in her hand, and the man she had been swinging at for an hour was the man she had been swinging at for ten years, and the world had not stopped being cruel, but it had, briefly, stopped being silent.' },
    ],
  },
};
