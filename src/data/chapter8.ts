import type { ChapterDef } from '../engine/types';

// ─── CHAPTER 8 — "Doldrey" ─────────────────────────────────────────────────
//
// The Battle of Doldrey — the Hundred-Year War's turning point. The Band of
// the Hawk has been entrusted with the dawn assault on a Midland rebel
// fortress held by Boscogn the Marshal and thirty thousand men. Griffith's
// orders: Guts leads the gate, Casca holds the flank, Judeau scouts the
// bailey, Pippin carries the ladder, Corkus commands the second wave.
//
// In the tactical framing, the Band's vanguard (Guts + Casca + Judeau +
// Corkus + Pippin) opens the south gate and clears a path into the bailey.
// Boscogn himself holds the keep on the north wall. This chapter stages the
// inner siege: the players enter the bailey, take the keep, and bring down
// Boscogn.
//
// 14×10 walled fortress with three rings:
//   1. Outer wall — the broken south gate (row 6 cols 5–6)
//   2. Bailey — open ground (rows 3–6), where the rebel garrison waits
//   3. Keep — a stone tower cluster on the north wall (row 0 cols 5–8)
//
// Pacing:
//   gate  (2)   two pikemen at the broken gate. aggro=3 — they see
//               anyone inside the bailey.
//   bailey (4)  four rebel swordsmen in the courtyard. aggro=4 — they
//               see anyone inside the courtyard.
//   keep  (4)   four veteran rebels in the keep. Dormant until the
//               courtyard falls.
//   marshal (1) Boscogn himself. UNFLINCHING boss on the keep tower.

export const CHAPTER_8: ChapterDef = {
  id: 8,
  name: 'Chapter 8 — Doldrey',
  subtitle: 'The Hundred-Year War',
  objective: 'Defeat Boscogn the Marshal in his keep',
  weather: 'none',
  map: [
    '..FFFFFF......',
    '..C....C......',
    '..R....R......',
    '..R....R......',
    '..R....R......',
    '..R....R......',
    '..GGG.........',
    '...RR.........',
    '...R..........',
    '..T.........T.',
  ],
  // Players enter the bailey from the south forest edge. Five units:
  // Guts, Casca, Judeau, Corkus, Pippin.
  playerStart: [[2, 9], [3, 9], [4, 9], [5, 9], [6, 9]],
  units: [
    { def: 'guts', faction: 'player', x: 2, y: 9 },
    { def: 'casca', faction: 'player', x: 3, y: 9 },
    { def: 'judeau', faction: 'player', x: 4, y: 9 },
    { def: 'corkus', faction: 'player', x: 5, y: 9 },
    { def: 'pippin', faction: 'player', x: 6, y: 9 },

    // ── gate: two pikemen at the broken gate ──
    //   They hold the south wall and react to anyone walking into the
    //   courtyard (y<=7).
    { def: 'e_soldier', faction: 'enemy', x: 4, y: 6, level: 4, group: 'gate', aggro: 3 },
    { def: 'e_soldier', faction: 'enemy', x: 9, y: 6, level: 4, group: 'gate', aggro: 3 },

    // ── bailey: four rebel swordsmen in the courtyard ──
    //   They hold the central courtyard. aggro=4 — anyone inside the
    //   courtyard wakes them all at once.
    { def: 'e_fighter', faction: 'enemy', x: 3, y: 4, level: 4, group: 'bailey', aggro: 4 },
    { def: 'e_fighter', faction: 'enemy', x: 6, y: 3, level: 4, group: 'bailey', aggro: 4 },
    { def: 'e_fighter', faction: 'enemy', x: 9, y: 5, level: 4, group: 'bailey', aggro: 4 },
    { def: 'e_archer', faction: 'enemy', x: 11, y: 4, level: 4, group: 'bailey', aggro: 4 },

    // ── keep: four veteran rebels in the keep ──
    //   Dormant until the courtyard falls (until any bailey unit dies,
    //   or until a player crosses the keep wall at row 1).
    { def: 'e_soldier', faction: 'enemy', x: 6, y: 1, level: 5, group: 'keep', aggro: 4 },
    { def: 'e_soldier', faction: 'enemy', x: 8, y: 1, level: 5, group: 'keep', aggro: 4 },
    { def: 'e_archer', faction: 'enemy', x: 5, y: 1, level: 5, group: 'keep', aggro: 4 },
    { def: 'e_fighter', faction: 'enemy', x: 9, y: 2, level: 5, group: 'keep', aggro: 4 },

    // ── marshal: Boscogn himself, in the keep tower ──
    //   UNFLINCHING. The Hundred-Year War marshal. He does not move,
    //   and he does not fall to a single sword.
    { def: 'c_marshal', faction: 'enemy', x: 3, y: 0, ai: 'boss', group: 'keep', aggro: 5 },
  ],
  bossDefId: 'c_marshal',
  intro: {
    id: 'ch8_intro',
    lines: [
      { speaker: '', text: 'Dawn at Doldrey. Five thousand men at the south gate. Thirty thousand in the bailey, and behind them, Boscogn.' },
      { speaker: 'Griffith', portrait: 'griffith', side: 'left', text: 'Guts. Casca. Pippin. Corkus. Judeau. You five open the gate.' },
      { speaker: 'Corkus', portrait: 'corkus', side: 'right', expr: 'shocked', text: 'Five — for thirty thousand? Griffith — is the rest of the Band — ' },
      { speaker: 'Griffith', portrait: 'griffith', side: 'left', text: 'The rest of the Band is the rest of the Band. You five are the gate. The gate falls, the Band walks in. The gate does not fall, the Band does not walk in.' },
      { speaker: 'Pippin', portrait: 'pippin', side: 'right', text: 'Five thousand men behind us. Five of us at the front. I have been in this company for six weeks and I have never seen numbers work like this.' },
      { speaker: 'Casca', portrait: 'casca', side: 'left', expr: 'angry', text: 'He has it planned. He always has it planned. When you understand the plan, you stop counting men.' },
      { speaker: 'Guts', portrait: 'guts', side: 'left', expr: 'angry', text: 'I\'m not counting. I\'m walking.' },
      { speaker: '', text: 'And they walked. Five of them, alone, into a wall that had held for a hundred years.' },
    ],
  },
  outro: {
    id: 'ch8_outro',
    lines: [
      { speaker: '', text: 'Boscogn died on the keep\'s stone. The blade that killed him was the same blade that had killed thirty men before, that morning, at the same gate.' },
      { speaker: 'Griffith', portrait: 'griffith', side: 'left', text: 'Casca. Judeau. Pippin. Corkus. The gate held. The Band walks.' },
      { speaker: 'Casca', portrait: 'casca', side: 'right', expr: 'shocked', text: 'Five of us held a gate for a hundred thousand? That — that should not be possible. Guts. What — how many did you break, on the way in?' },
      { speaker: 'Guts', portrait: 'guts', side: 'left', expr: 'neutral', text: 'I stopped counting. Corkus was at my left shoulder the whole time. He killed twelve by himself.' },
      { speaker: 'Corkus', portrait: 'corkus', side: 'left', expr: 'shocked', text: 'Twelve. He — he said twelve. Did I kill twelve? I think I killed twelve.' },
      { speaker: 'Pippin', portrait: 'pippin', side: 'right', text: 'I held the gate. I held it for the whole battle. My arms are still tired.' },
      { speaker: 'Griffith', portrait: 'griffith', side: 'left', expr: 'neutral', text: 'Guts. Walk with me. The rest of you — to the camp. To the wine. Tell them what happened. Tell them what is about to.' },
      { speaker: 'Judeau', portrait: 'judeau', side: 'right', expr: 'shocked', text: 'What is about to. He means the war. He means the Band of the Hawk. He means everything he has been building for ten years.' },
      { speaker: 'Griffith', portrait: 'griffith', side: 'left', text: 'I mean everything. Casca. Judeau. Pippin. Corkus. Guts. — I mean everything. The war has ended. Tomorrow there is another war. Tomorrow there is a kingdom. Tomorrow there is a man who will remember this dawn.' },
      { speaker: '', text: 'And they walked back through the gate, the five who had held it, and behind them the Band — the hawk and a thousand swords — walked in.' },
    ],
  },
};
