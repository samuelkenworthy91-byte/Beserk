import type { ChapterDef } from '../engine/types';

// ─── CHAPTER 2 — "The White Hawk" ───────────────────────────────────────────
// After Karsenn, Guts walks the ridge road alone. The Band of the Hawk has
// been watching him from the high ground — Griffith wants to see what kind
// of man killed Bazuso. Three of his riders screen the approach.
//
// 14×10 map, 4 enemies. Player: Guts, alone.
//
// Pacing:
//   sentries (2)   block the road south of the ridge — wake on approach
//   duelists (2)   Casca + Judeau screen Guts once he's past the sentries
//                  and step aside once Guts crosses the ridge line (y<=4)
//   hawk   (1)     Griffith holds the high ground; engages when Guts comes
//                  within 4 tiles, OR when the duelists have all retreated,
//                  OR when Guts crosses the ridge line.
//
// Legend: . plain | R road | T forest | F fort | G gate | H house
//         M mountain | C castle wall | ~ water

export const CHAPTER_2: ChapterDef = {
  id: 2,
  name: 'Chapter 2 — The White Hawk',
  subtitle: 'The White Hawk',
  objective: 'Defeat Griffith',
  weather: 'none',
  map: [
    'MMMMMMRRRRRRR.',
    'M....M........',
    'M.T..M..RRR...',
    'M..T.M..RRRR..',
    'M....MR.......',
    'MTT..M..RRRRR.',
    'M....M..R..R..',
    'MTT..MR..R..R.',
    'M....MR......R',
    '.MMMMM..RRRRRR',
  ],
  // Guts enters from the southwest corner — alone. The previous chapter's
  // sellswords have scattered; the Band's riders are the only other souls.
  playerStart: [[1, 9]],
  units: [
    // ── Guts, alone, walking the ridge road ──
    { def: 'guts', faction: 'player', x: 1, y: 9 },

    // ── sentries: two Hawk soldiers watching the road south of the ridge ──
    //   They hold their posts until Guts comes close; once struck, they
    //   call the alarm and retreat to the Band's main line.
    { def: 'e_soldier', faction: 'enemy', x: 6, y: 6, level: 2, group: 'sentries', aggro: 3 },
    { def: 'e_soldier', faction: 'enemy', x: 8, y: 7, level: 2, group: 'sentries', aggro: 3 },

    // ── duelists: Casca and Judeau screening the ridge approach ──
    //   'guard' AI so they hold their post and only attack if Guts comes
    //   within reach. They never pursue him past the ridge line (y<=4) —
    //   letting the duel be Griffith's alone. Once Guts is past them,
    //   they stand down (the 'attack' AI path takes over only when they
    //   see him; with no trigger they keep holding).
    { def: 'casca', faction: 'enemy', x: 7, y: 3, level: 5, ai: 'guard',
      group: 'duelists', aggro: 3 },
    { def: 'judeau', faction: 'enemy', x: 10, y: 4, level: 4, ai: 'guard',
      group: 'duelists', aggro: 3 },

    // ── the Hawk himself — holds the high ground ──
    //   The Band's flag is planted behind him; he watches the whole fight
    //   before stepping down. Engages when Guts is within 4 tiles, OR
    //   when the sentries + duelists have all fallen.
    { def: 'griffith', faction: 'enemy', x: 8, y: 1, ai: 'boss',
      group: 'hawk', aggro: 5 },
  ],
  bossDefId: 'griffith',
  intro: {
    id: 'ch2_intro',
    lines: [
      { speaker: '', text: 'The road to the north. The rain that soaked Karsenn stopped at the border of the hill country; ahead the sky is the colour of old iron.' },
      { speaker: '', text: 'Guts has been walking for two days. There is no one with him, and no one coming. Then — at the second ridge — the white flag.' },
      { speaker: 'Casca', portrait: 'casca', side: 'right', text: 'There. Just one. No horse, no armour worth taking.' },
      { speaker: 'Judeau', portrait: 'judeau', side: 'left', text: 'He\'s the one they say killed the Grey Knight with a sword twice his size. Don\'t undersell him, Captain.' },
      { speaker: 'Griffith', portrait: 'griffith', side: 'right', expr: 'neutral', text: 'A sword that size. With him or against him — that is the question.' },
      { speaker: 'Casca', portrait: 'casca', side: 'left', text: 'Shall we cut him down before he reaches the road?' },
      { speaker: 'Griffith', portrait: 'griffith', side: 'right', text: 'No. Let him come. I want to see what he does when he sees us.' },
    ],
  },
  outro: {
    id: 'ch2_outro',
    lines: [
      { speaker: '', text: 'The white hawk drops from the high stone. The road below them is silent but for the wind.' },
      { speaker: 'Griffith', portrait: 'griffith', side: 'right', expr: 'injured', text: 'You fight as if you have nothing to lose.' },
      { speaker: 'Guts', portrait: 'guts', side: 'left', expr: 'neutral', text: 'I don\'t.' },
      { speaker: 'Griffith', portrait: 'griffith', side: 'right', text: 'Then you have nothing. A man with nothing can be bought with anything.' },
      { speaker: 'Casca', portrait: 'casca', side: 'left', expr: 'shocked', text: 'Captain — he took the greatsword on the parry. You cannot mean to—' },
      { speaker: 'Griffith', portrait: 'griffith', side: 'right', expr: 'neutral', text: 'I do. A sword like that is wasted on a season\'s pay and a death in a ditch. Come with me, and you will not die for bread.' },
      { speaker: 'Guts', portrait: 'guts', side: 'left', expr: 'angry', text: 'I don\'t die for anyone.' },
      { speaker: 'Griffith', portrait: 'griffith', side: 'right', text: 'Then come with me until you do.' },
      { speaker: '', text: 'The boy did not answer. He sheathed the greatsword. The hawk did not look back. The road behind them would be a long one, and the road ahead longer.' },
    ],
  },
};
