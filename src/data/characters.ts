import type { CharTemplate, Stats, Growths, Unit, Faction, AIType } from '../engine/types';
import { getItem } from './weapons';

// ─── Character templates ─────────────────────────────────────────────────────
// New units (player or enemy) are added here and deployed from chapter files.

const zero: Growths = { hp: 0, str: 0, skl: 0, spd: 0, lck: 0, def: 0, res: 0 };
const g = (h: Partial<Growths>): Growths => ({ ...zero, ...h });
const s = (st: Partial<Stats>): Stats => ({
  hp: 1, str: 0, skl: 0, spd: 0, lck: 0, def: 0, res: 0, mov: 5, con: 5, ...st,
});

export const CHARACTERS: Record<string, CharTemplate> = {
  // ─────────── player cast ───────────
  guts: {
    defId: 'guts', name: 'Guts', cls: 'Mercenary', level: 1, sprite: 'guts', portrait: 'guts',
    desc: 'A young sellsword with a blade meant for a giant. SUNDER: his strikes smash through cover — terrain gives the enemy no Def or Avoid against him. Slow and inaccurate in the open. If he falls, the tale ends.',
    stats: s({ hp: 26, str: 9, skl: 5, spd: 6, lck: 4, def: 5, res: 2, mov: 5, con: 9 }),
    growths: g({ hp: 0.85, str: 0.55, skl: 0.35, spd: 0.45, lck: 0.30, def: 0.40, res: 0.20 }),
    items: [{ id: 'greatsword', uses: 40 }, { id: 'vulnerary', uses: 3 }],
    ai: 'attack', essential: true,
    traits: ['sunder'],
    quotes: { death: 'Not... here. I still... have to—' },
  },
  wyatt: {
    defId: 'wyatt', name: 'Wyatt', cls: 'Mercenary', level: 2, sprite: 'merc', portrait: 'wyatt',
    desc: 'A wiry veteran sellsword. Quick with a jab and quicker with a joke. Not essential — but try to keep him.',
    stats: s({ hp: 20, str: 6, skl: 7, spd: 8, lck: 5, def: 4, res: 2, mov: 5, con: 7 }),
    growths: g({ hp: 0.75, str: 0.45, skl: 0.50, spd: 0.50, lck: 0.35, def: 0.35, res: 0.20 }),
    items: [{ id: 'iron_sword', uses: 42 }, { id: 'vulnerary', uses: 3 }],
    ai: 'attack',
    quotes: { death: 'Heh... figures... Tell the kid... the ale\'s on me...' },
  },
  bren: {
    defId: 'bren', name: 'Bren', cls: 'Fighter', level: 2, sprite: 'fighter', portrait: 'bren',
    desc: 'A loud axeman who charges first and counts the dead later. Hits hard, aims loose.',
    stats: s({ hp: 23, str: 8, skl: 4, spd: 5, lck: 3, def: 4, res: 2, mov: 5, con: 9 }),
    growths: g({ hp: 0.80, str: 0.55, skl: 0.30, spd: 0.35, lck: 0.25, def: 0.45, res: 0.15 }),
    items: [{ id: 'iron_axe', uses: 42 }],
    ai: 'attack',
    quotes: { death: 'Shoulda... stayed... a woodcutter...' },
  },
  sena: {
    defId: 'sena', name: 'Sena', cls: 'Archer', level: 1, sprite: 'archer', portrait: 'sena',
    desc: 'A quiet scout from the eastern ridges. Her bow keeps allies alive from two tiles away.',
    stats: s({ hp: 17, str: 5, skl: 8, spd: 7, lck: 6, def: 3, res: 3, mov: 5, con: 5 }),
    growths: g({ hp: 0.65, str: 0.45, skl: 0.60, spd: 0.55, lck: 0.50, def: 0.30, res: 0.35 }),
    items: [{ id: 'short_bow', uses: 40 }],
    ai: 'attack',
    quotes: { death: 'The ridge... is quiet... at last...' },
  },

  // ─────────── Band of the Hawk (player, from chapter 2 onward) ───────────
  griffith: {
    defId: 'griffith', name: 'Griffith', cls: 'Commander', level: 7, sprite: 'griffith', portrait: 'griffith',
    // COMMAND trait: units within 2 tiles gain +10 Hit / +5 Avoid. The brief
    // calls this out as the mechanical reason the Band is so deadly around
    // Griffith, and the player should feel the loss when he falls.
    desc: 'The White Hawk. COMMAND: units within 2 tiles gain +10 Hit / +5 Avoid / +1 morale. A duellist\'s blade and a leader\'s eye — Griffith is faster than Guts and never misses, but the greatsword is heavier than any sword he can lift.',
    stats: s({ hp: 30, str: 7, skl: 12, spd: 13, lck: 9, def: 5, res: 6, mov: 6, con: 6 }),
    growths: g({ hp: 0.70, str: 0.35, skl: 0.70, spd: 0.75, lck: 0.65, def: 0.30, res: 0.50 }),
    items: [{ id: 'rapier', uses: 30 }, { id: 'vulnerary', uses: 2 }],
    ai: 'attack',
    traits: ['command'],
    quotes: { death: 'My... dream... it ends...?' },
  },
  casca: {
    defId: 'casca', name: 'Casca', cls: 'Vanguard', level: 5, sprite: 'casca', portrait: 'casca',
    desc: 'The Hawks\' vanguard commander. Sword and buckler, faster than most men and quicker to anger.',
    stats: s({ hp: 25, str: 7, skl: 10, spd: 11, lck: 7, def: 5, res: 4, mov: 5, con: 6 }),
    growths: g({ hp: 0.70, str: 0.45, skl: 0.60, spd: 0.65, lck: 0.50, def: 0.35, res: 0.40 }),
    items: [{ id: 'iron_sword', uses: 45 }, { id: 'vulnerary', uses: 2 }],
    ai: 'attack',
    quotes: { death: 'I had... so much more... to give him...' },
  },
  judeau: {
    defId: 'judeau', name: 'Judeau', cls: 'Scout', level: 4, sprite: 'judeau', portrait: 'judeau',
    desc: 'The Hawks\' scout. Daggers and bad jokes — both sharper than they look.',
    stats: s({ hp: 21, str: 5, skl: 9, spd: 10, lck: 8, def: 4, res: 4, mov: 6, con: 5 }),
    growths: g({ hp: 0.65, str: 0.35, skl: 0.55, spd: 0.60, lck: 0.55, def: 0.30, res: 0.40 }),
    items: [{ id: 'iron_sword', uses: 38 }],
    ai: 'attack',
    quotes: { death: 'Tell the captain... I followed the wind...' },
  },
  pippin: {
    defId: 'pippin', name: 'Pippin', cls: 'Heavy', level: 6, sprite: 'pippin', portrait: 'pippin',
    desc: 'The biggest man in the Band. His axe cuts through anything that doesn\'t move fast enough.',
    stats: s({ hp: 33, str: 9, skl: 6, spd: 6, lck: 4, def: 8, res: 3, mov: 4, con: 11 }),
    growths: g({ hp: 0.85, str: 0.55, skl: 0.30, spd: 0.30, lck: 0.25, def: 0.55, res: 0.20 }),
    items: [{ id: 'iron_axe', uses: 40 }],
    ai: 'attack',
    quotes: { death: 'I was... supposed to be... the wall...' },
  },
  corkus: {
    defId: 'corkus', name: 'Corkus', cls: 'Sergeant', level: 4, sprite: 'corkus', portrait: 'corkus',
    desc: 'The Hawks\' front-row sergeant. Axe and loud mouth — both effective at short range.',
    stats: s({ hp: 24, str: 8, skl: 6, spd: 7, lck: 5, def: 6, res: 3, mov: 5, con: 8 }),
    growths: g({ hp: 0.70, str: 0.50, skl: 0.40, spd: 0.40, lck: 0.35, def: 0.45, res: 0.25 }),
    items: [{ id: 'iron_axe', uses: 42 }],
    ai: 'attack',
    quotes: { death: 'Damn... the kid was right about me...' },
  },
  rickert: {
    defId: 'rickert', name: 'Rickert', cls: 'Apprentice', level: 2, sprite: 'rickert', portrait: 'rickert',
    desc: 'The youngest of the Band. A smith\'s apprentice with a hammer — not a frontline fighter, but worth protecting.',
    stats: s({ hp: 18, str: 4, skl: 6, spd: 7, lck: 7, def: 4, res: 5, mov: 5, con: 5 }),
    growths: g({ hp: 0.65, str: 0.40, skl: 0.55, spd: 0.50, lck: 0.60, def: 0.30, res: 0.50 }),
    items: [{ id: 'iron_sword', uses: 35 }],
    ai: 'guard',
    quotes: { death: 'I wanted to... be like them... one day...' },
  },

  // ─────────── enemy cast ───────────
  e_soldier: {
    defId: 'e_soldier', name: 'Soldier', cls: 'Spearman', level: 1, sprite: 'soldier', portrait: 'soldier',
    desc: 'A levy of Fort Karsenn. Spears beat swords — keep your axemen on them.',
    stats: s({ hp: 18, str: 5, skl: 3, spd: 4, lck: 1, def: 4, res: 1, mov: 4, con: 9 }),
    growths: g({ hp: 0.6, str: 0.4, def: 0.4 }),
    items: [{ id: 'iron_lance', uses: 40 }],
    ai: 'attack', quotes: { death: 'Gah... Captain...' },
  },
  e_fighter: {
    defId: 'e_fighter', name: 'Raider', cls: 'Brigand', level: 2, sprite: 'fighter', portrait: 'bren',
    desc: 'A hired cutthroat with a heavy axe. Dangerous against spears, easy prey for swords.',
    stats: s({ hp: 21, str: 6, skl: 3, spd: 4, lck: 1, def: 3, res: 1, mov: 4, con: 9 }),
    growths: g({ hp: 0.7, str: 0.5 }),
    items: [{ id: 'iron_axe', uses: 42 }],
    ai: 'attack', quotes: { death: 'Tch... worth more... alive...' },
  },
  e_archer: {
    defId: 'e_archer', name: 'Archer', cls: 'Bowman', level: 2, sprite: 'archer', portrait: 'soldier',
    desc: 'Shoots from two tiles out. He cannot answer a blade to his face.',
    stats: s({ hp: 17, str: 5, skl: 5, spd: 5, lck: 2, def: 3, res: 2, mov: 4, con: 6 }),
    growths: g({ hp: 0.6, skl: 0.5 }),
    items: [{ id: 'short_bow', uses: 40 }],
    ai: 'attack', quotes: { death: 'The wind... turned...' },
  },
  bazuso: {
    defId: 'bazuso', name: 'Bazuso', cls: 'Warlord', level: 5, sprite: 'warlord', portrait: 'bazuso',
    desc: 'The Grey Knight of Karsenn. UNFLINCHING: his armour shrugs off flurries — no one doubles him. He holds the gate and mends on its stone. Draw him off it, or break him in one push.',
    stats: s({ hp: 30, str: 9, skl: 6, spd: 5, lck: 2, def: 6, res: 3, mov: 4, con: 13 }),
    growths: zero,
    items: [{ id: 'steel_axe', uses: 30 }],
    ai: 'boss', boss: true,
    traits: ['unflinching'],
    quotes: {
      battle: 'Hm. Fresh meat for the tally. Come then, whelp.',
      rage: 'Thirty men fed this axe. Stand still, boy — you\'ll make thirty-one.',
      death: 'The tally... ends at thirty...',
    },
  },
};

let uidCounter = 1;
export function resetUids() { uidCounter = 1; }

/** Instantiate a live unit from a template + placement. */
export function mkUnit(
  defId: string, faction: Faction, x: number, y: number,
  opts: {
    ai?: AIType; level?: number;
    group?: string; aggro?: number; active?: boolean;
  } = {},
): Unit {
  const t = CHARACTERS[defId];
  if (!t) throw new Error('unknown character ' + defId);
  const u: Unit = {
    ...t,
    stats: { ...t.stats },
    growths: { ...t.growths },
    items: t.items.map(i => ({ ...i })),
    uid: uidCounter++,
    faction, x, y,
    hp: t.stats.hp, exp: 0, moved: false, dead: false,
    ai: opts.ai ?? t.ai,
    level: t.level,
    traits: t.traits ? [...t.traits] : undefined,
    group: opts.group,
    aggro: opts.aggro ?? 3,
    // players always act; enemies hold position until provoked
    active: opts.active ?? faction === 'player',
  };
  // deterministic stat padding for over-levelled deployments
  const bonus = (opts.level ?? t.level) - t.level;
  for (let i = 0; i < bonus; i++) {
    u.stats.hp += 2; u.stats.str += i % 2; u.stats.spd += i % 4 === 0 ? 1 : 0;
    u.stats.def += i % 3 === 0 ? 1 : 0;
    u.level += 1;
  }
  u.hp = u.stats.hp;
  // patrol AI: anchor is the deployment tile; direction defaults to +1
  // so the first phase walks AWAY from the anchor and then comes back
  if ((opts.ai ?? t.ai) === 'patrol') {
    u.patrolAnchor = { x, y };
    u.patrolDir = 1;
  }
  void getItem; // (keeps tree-shaking honest for future item logic)
  return u;
}
