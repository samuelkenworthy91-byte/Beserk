import type { ChapterDef } from '../engine/types';

// ─── CHAPTER 1 — "The Grey Knight" ───────────────────────────────────────────
// Young Guts fights for coin in a siege on Fort Karsenn, where the
// thirty-man-slayer Bazuso holds the gate. 14×9 tile map, 8 enemies.
//
// Legend: . plain | R road | T forest | F fort | G gate | H house
//         M mountain | C castle wall | ~ water

export const CHAPTER_1: ChapterDef = {
  id: 1,
  name: 'Chapter 1',
  subtitle: 'The Grey Knight',
  objective: 'Defeat Bazuso',
  weather: 'rain',
  map: [
    'MMMM......~~..',
    'MM..T....T.~~.',
    '...T....RT....',
    '......RR......',
    '...T..R...FF..',
    '....RRR.TGGGG.',
    '.H..R.....FF..',
    'T...R...T.....',
    '...RR.....WWW.',
  ],
  playerStart: [[1, 8], [2, 7], [1, 7], [0, 8]],
  // ── Encounter pacing ──────────────────────────────────────────────────────
  // Three small squads, each dormant until the player comes close or one of
  // its members is struck. They sit at increasing depth along the road, so the
  // approach reads as: skirmish → flanking pressure → the gate itself.
  //
  //   picket  (2)  loose screen on the road      — wakes early, teaches basics
  //   thicket (2)  archer + spear in the trees   — punishes a careless advance
  //   gate    (3)  the garrison proper           — the real fight
  //   Bazuso  (1)  holds the gate until provoked
  units: [
    // ── sellswords (player) ──
    { def: 'guts', faction: 'player', x: 1, y: 8 },
    { def: 'wyatt', faction: 'player', x: 2, y: 7 },
    { def: 'bren', faction: 'player', x: 1, y: 7 },
    { def: 'sena', faction: 'player', x: 0, y: 8 },

    // ── picket: a lone spear and an axeman patrolling the road ──
    //   The axeman has a patrol AI so once he's woken up he paces between
    //   his current tile and one tile to the north rather than just
    //   standing or rushing the player — gives the awakening beat a
    //   little life.
    { def: 'e_soldier', faction: 'enemy', x: 5, y: 6, level: 1, group: 'picket', aggro: 3 },
    { def: 'e_fighter', faction: 'enemy', x: 6, y: 3, level: 1, ai: 'patrol',
      group: 'picket', aggro: 3 },

    // ── thicket: bowman in real cover with a spear screening the road ──
    { def: 'e_archer', faction: 'enemy', x: 9, y: 2, level: 2, group: 'thicket', aggro: 3 },
    { def: 'e_soldier', faction: 'enemy', x: 8, y: 2, level: 2, group: 'thicket', aggro: 3 },

    // ── gate garrison: holds the fort tiles until you press them ──
    { def: 'e_fighter', faction: 'enemy', x: 10, y: 4, level: 2, group: 'gate', aggro: 3 },
    { def: 'e_soldier', faction: 'enemy', x: 10, y: 6, level: 2, group: 'gate', aggro: 3 },
    { def: 'e_archer', faction: 'enemy', x: 12, y: 3, level: 2, group: 'gate', aggro: 4 },

    // ── the Grey Knight, posted on the gate ──
    { def: 'bazuso', faction: 'enemy', x: 11, y: 5, ai: 'boss', group: 'bazuso', aggro: 2 },
  ],
  bossDefId: 'bazuso',
  intro: {
    id: 'ch1_intro',
    lines: [
      { speaker: '', text: 'The border marches of Midland. A hundred years of war have worn the country down to mud, and the mud is what men are paid to die in.' },
      { speaker: '', text: 'A sellsword company has taken coin to break open Fort Karsenn. Among them walks a boy of fifteen, carrying a sword no grown man should be able to lift.' },
      { speaker: 'Bren', portrait: 'bren', side: 'left', text: 'There it is. Open that gate and we eat for a season. Leave it shut and we don’t eat at all.' },
      { speaker: 'Wyatt', portrait: 'wyatt', side: 'left', text: 'The gate’s held by their captain. Bazuso. They say thirty men have gone under that axe of his.' },
      { speaker: 'Sena', portrait: 'sena', side: 'left', text: 'They also say he doesn’t leave the stone. So he won’t come to us. We have to go to him.' },
      { speaker: 'Guts', portrait: 'guts', side: 'right', expr: 'neutral', text: 'Thirty. Then he’s slow, and he’s certain of himself. That’s enough.' },
      { speaker: 'Bren', portrait: 'bren', side: 'left', text: 'Listen to it. Boy hasn’t got hair on his face and he’s counting a dead man’s tally.' },
      { speaker: 'Guts', portrait: 'guts', side: 'right', expr: 'angry', text: 'I’m counting what I’m owed. Keep up, or keep out of the way.' },
    ],
  },
  outro: {
    id: 'ch1_outro',
    lines: [
      { speaker: '', text: 'The rain thins. Somewhere behind the walls a horn is sounding retreat, and the Grey Knight’s tally has stopped at thirty.' },
      { speaker: 'Bren', portrait: 'bren', side: 'left', expr: 'shocked', text: '...That was Bazuso. That was Bazuso, and the boy went through him.' },
      { speaker: 'Wyatt', portrait: 'wyatt', side: 'left', text: 'Quiet. Up on the ridge — riders. White armour. They’ve been watching a while.' },
      { speaker: 'Casca', portrait: 'casca', side: 'right', text: 'The one with the greatsword killed their captain, Griffith. I’ve never seen a man swing a blade that size.' },
      { speaker: 'Griffith', portrait: 'griffith', side: 'left', text: 'Nor has anyone here. A sword like that is wasted on siege work and a season’s bread.' },
      { speaker: 'Griffith', portrait: 'griffith', side: 'left', text: 'Learn his name, Casca. Before some other lord thinks to.' },
      { speaker: '', text: 'The boy did not look up at the ridge. He was still catching his breath — and so the road that would take everything from him began quietly, with a debt paid in full.' },
    ],
  },
};
