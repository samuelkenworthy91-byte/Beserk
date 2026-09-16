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
    // COMMAND trait: units within 2 tiles gain +10 Hit / +2 Crit. The brief
    // calls this out as the mechanical reason the Band is so deadly around
    // Griffith, and the player should feel the loss when he falls.
    desc: 'The White Hawk. COMMAND: units within 2 tiles gain +10 Hit / +2 Crit. A duellist\'s blade and a leader\'s eye — Griffith is faster than Guts and never misses, but the greatsword is heavier than any sword he can lift.',
    stats: s({ hp: 30, str: 7, skl: 12, spd: 13, lck: 9, def: 5, res: 6, mov: 6, con: 6 }),
    growths: g({ hp: 0.70, str: 0.35, skl: 0.70, spd: 0.75, lck: 0.65, def: 0.30, res: 0.50 }),
    items: [{ id: 'rapier', uses: 30 }, { id: 'vulnerary', uses: 2 }],
    ai: 'attack',
    boss: true,
    traits: ['command'],
    quotes: {
      battle: 'A large sword… I haven\'t seen one swung like that since the Hundred-Year War.',
      rage: 'I won\'t grant you the release of dying for yourself. Die for me — that\'s an order.',
      death: '…One day, I will have a kingdom. And you will remember this road.',
    },
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
  // ─────────── Chapter 3 boss: rebel captain at the bridge ───────────
  c_rebel: {
    defId: 'c_rebel', name: 'Captain', cls: 'Rebel Captain', level: 4, sprite: 'soldier', portrait: 'soldier',
    desc: 'A rebel veteran who\'s held this bridge through three kings. Heavy axe, heavy armour, and a habit of standing between his king and the door.',
    stats: s({ hp: 26, str: 8, skl: 5, spd: 4, lck: 2, def: 6, res: 3, mov: 4, con: 12 }),
    growths: zero,
    items: [{ id: 'iron_axe', uses: 40 }],
    ai: 'boss', boss: true,
    quotes: {
      battle: 'You Hawk dogs — we\'ve held this bridge through worse than you. Stand and die.',
      rage: 'I\'ll not be the first captain to fall to mercenary steel!',
      death: 'The bridge... is not... yours yet...',
    },
  },
  // ─────────── Chapter 4 boss: wounded knight in the keep ───────────
  c_veteran: {
    defId: 'c_veteran', name: 'Sir Garriott', cls: 'Wounded Knight', level: 5, sprite: 'soldier', portrait: 'soldier',
    desc: 'A knight of the old order — once-armoured, now wounded. His sword arm works. His pride still drives him to swing it. UNFLINCHING: no one doubles him.',
    stats: s({ hp: 32, str: 8, skl: 7, spd: 5, lck: 2, def: 8, res: 4, mov: 4, con: 13 }),
    growths: zero,
    items: [{ id: 'iron_sword', uses: 40 }],
    ai: 'boss', boss: true,
    traits: ['unflinching'],
    quotes: {
      battle: 'The Hawk sends children to take a town? I\'ve fought longer than any of you have lived.',
      rage: 'Stand still, dogs! Stand still and learn how a sword is supposed to be swung!',
      death: 'The kingdom... will remember...',
    },
  },
  // ─────────── Chapter 5 boss: knight-commander at Varn ───────────
  c_knight: {
    defId: 'c_knight', name: 'Sir Borcas', cls: 'Knight-Commander', level: 6, sprite: 'soldier', portrait: 'soldier',
    desc: 'A knight-commander who has fought in the Hundred-Year War. UNFLINCHING: no enemy doubles him. He refuses to yield the keep and refuses to fall.',
    stats: s({ hp: 36, str: 9, skl: 8, spd: 6, lck: 3, def: 9, res: 5, mov: 5, con: 14 }),
    growths: zero,
    items: [{ id: 'iron_lance', uses: 30 }, { id: 'iron_sword', uses: 30 }],
    ai: 'boss', boss: true,
    traits: ['unflinching'],
    quotes: {
      battle: 'The Band of the Hawk — I\'ve heard that name once, at a peace treaty. I will not hear it twice.',
      rage: 'Hold this line, men! The walls will hold! The walls will — ',
      death: 'The walls... the walls always held...',
    },
  },
  // ─────────── Chapter 6 boss: ambush captain at Eberus ───────────
  c_pincers: {
    defId: 'c_pincers', name: 'Captain Vellant', cls: 'Ambush Captain', level: 5, sprite: 'fighter', portrait: 'soldier',
    desc: 'A veteran of the wood roads. He knows the moment of ambush — when the column has bent and the bend has thinned. He waits for it. Every time.',
    stats: s({ hp: 28, str: 8, skl: 9, spd: 8, lck: 4, def: 6, res: 3, mov: 6, con: 10 }),
    growths: zero,
    items: [{ id: 'iron_sword', uses: 36 }],
    ai: 'boss', boss: true,
    quotes: {
      battle: 'You were supposed to be at the column. We watched you split. We watched Griffith choose the wagons over the march. Fool.',
      rage: 'Get them! Get them off the road!',
      death: 'The grain... they choose grain over the march...',
    },
  },
  // ─────────── Chapter 7 boss: imperial centurion at Foross ───────────
  c_centurion: {
    defId: 'c_centurion', name: 'Centurion', cls: 'Imperial Centurion', level: 6, sprite: 'soldier', portrait: 'soldier',
    desc: 'An imperial centurion. Tough, cautious, and very good at his job. He holds his tower until he has reason not to — and Guts walking into his courtyard is reason enough.',
    stats: s({ hp: 34, str: 9, skl: 7, spd: 6, lck: 2, def: 8, res: 4, mov: 5, con: 13 }),
    growths: zero,
    items: [{ id: 'iron_sword', uses: 30 }, { id: 'short_bow', uses: 30 }],
    ai: 'boss', boss: true,
    quotes: {
      battle: 'A band of mercenary dogs, here — for a fire I never lit. Hold them long enough and the river-wardens will light it for me.',
      rage: 'Hold the wall! Hold the wall, or I\'ll hold it with your corpse!',
      death: 'The fire... was never lit...',
    },
  },
  // ─────────── Chapter 8 boss: Boscogn the Marshal at Doldrey ───────────
  c_marshal: {
    defId: 'c_marshal', name: 'Boscogn', cls: 'Marshal of Doldrey', level: 8, sprite: 'warlord', portrait: 'bazuso',
    desc: 'The marshal of a hundred thousand. UNFLINCHING: no enemy doubles him. His greatsword is older than this war. He has held this fortress longer than Griffith has been alive.',
    stats: s({ hp: 48, str: 12, skl: 8, spd: 5, lck: 2, def: 11, res: 6, mov: 5, con: 16 }),
    growths: zero,
    items: [{ id: 'steel_axe', uses: 30 }, { id: 'iron_sword', uses: 30 }],
    ai: 'boss', boss: true,
    traits: ['unflinching'],
    quotes: {
      battle: 'The Band of the Hawk — I have heard that name at treaty tables. You are children with a sword. This fortress has held for a hundred years.',
      rage: 'You are nothing! You are a child with an axe! I will kill you and the war will end here!',
      death: 'A hundred years... a hundred years the gate... the gate held...',
    },
  },
  // ─────────── Chapter 9: apostle templates (the eclipse) ───────────
  // Lesser apostle: humanoid shape, fast, low HP, drops on contact.
  a_lesser: {
    defId: 'a_lesser', name: 'Lesser Apostle', cls: 'Lesser Demon', level: 5, sprite: 'fighter', portrait: 'soldier',
    desc: 'A human shape that has stopped being human. It moves fast and does not stay dead for long.',
    stats: s({ hp: 24, str: 9, skl: 8, spd: 12, lck: 0, def: 5, res: 6, mov: 7, con: 8 }),
    growths: zero,
    items: [],
    ai: 'attack',
    quotes: {
      death: 'It folds in on itself like wet paper.',
    },
  },
  // Vortex apostle: the eclipse given a body. The chapter boss.
  a_vortex: {
    defId: 'a_vortex', name: 'Vortex Apostle', cls: 'Greater Demon', level: 10, sprite: 'warlord', portrait: 'bazuso',
    desc: 'A shape with too many arms and a mouth that should not be on a face. The eclipse is wearing it like a glove. There is no UNFLINCHING — there is no body to flinch from.',
    stats: s({ hp: 60, str: 14, skl: 10, spd: 11, lck: 0, def: 8, res: 12, mov: 8, con: 18 }),
    growths: zero,
    items: [],
    ai: 'boss', boss: true,
    quotes: {
      battle: 'It does not speak. It is not sure how.',
      rage: 'Its mouths widen. The air around it bends.',
      death: 'It folds in on itself. The hand of the eclipse is still there — but for a moment, the air clears.',
    },
  },
  // Swarm apostle: chapter 10 boss. The one that has been tracking
  // Guts for two days. Stronger than a lesser apostle but not as
  // terrifying as the vortex.
  a_swarm: {
    defId: 'a_swarm', name: 'Swarm Apostle', cls: 'Pursuing Demon', level: 8, sprite: 'fighter', portrait: 'soldier',
    desc: 'The one that has been following him longest. It learnt his pace on the second day. It learnt his sword on the third. It has not yet learnt to stop.',
    stats: s({ hp: 42, str: 11, skl: 9, spd: 12, lck: 0, def: 7, res: 9, mov: 8, con: 14 }),
    growths: zero,
    items: [],
    ai: 'boss', boss: true,
    quotes: {
      battle: 'You walk faster than I do. You swing slower. We will meet, soon, on a day like every other.',
      rage: 'There is no rage. There is hunger, and there is patience.',
      death: 'It folds in on itself. The road is finally quiet.',
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
