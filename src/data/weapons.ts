import type { ItemDef, WeaponDef, HealDef, WeaponType } from '../engine/types';

// ─── Weapon & item database ──────────────────────────────────────────────────
// Add new weapons here; chapters/characters reference them by id.

export const WEAPONS: Record<string, WeaponDef> = {
  greatsword: {
    id: 'greatsword', name: 'Greatsword', kind: 'weapon', wtype: 'sword',
    might: 9, hit: 68, crit: 0, weight: 14, minRange: 1, maxRange: 1, uses: 40,
    great: true,
    desc: 'A slab of iron too heavy for an ordinary man. Slow, brutal, hard to aim.',
  },
  iron_sword: {
    id: 'iron_sword', name: 'Iron Sword', kind: 'weapon', wtype: 'sword',
    might: 5, hit: 90, crit: 0, weight: 5, minRange: 1, maxRange: 1, uses: 42,
    desc: 'A reliable, well-balanced blade.',
  },
  iron_lance: {
    id: 'iron_lance', name: 'Iron Lance', kind: 'weapon', wtype: 'lance',
    might: 7, hit: 78, crit: 0, weight: 8, minRange: 1, maxRange: 1, uses: 40,
    desc: 'Standard soldier\'s spear. Solid reach and power.',
  },
  iron_axe: {
    id: 'iron_axe', name: 'Iron Axe', kind: 'weapon', wtype: 'axe',
    might: 8, hit: 72, crit: 0, weight: 10, minRange: 1, maxRange: 1, uses: 42,
    desc: 'A heavy chopper. Hits hard, swings wide.',
  },
  steel_axe: {
    id: 'steel_axe', name: 'Steel Axe', kind: 'weapon', wtype: 'axe',
    // crit 0 by design: enraged, this axe deals 15 to a full-HP Guts (26).
    // Any crit chance at all would make x3 = 45 an instant, invisible game
    // over from full health. The threat stays high but always readable.
    might: 10, hit: 62, crit: 0, weight: 14, minRange: 1, maxRange: 1, uses: 30,
    desc: 'Bazuso\'s cruel war-axe. Thirty men have fed it.',
  },
  short_bow: {
    id: 'short_bow', name: 'Short Bow', kind: 'weapon', wtype: 'bow',
    might: 5, hit: 85, crit: 0, weight: 4, minRange: 2, maxRange: 2, uses: 40,
    desc: 'Fires from range 2. Cannot strike adjacent foes.',
  },
  // Griffith's blade — a slender longsword with duellist reach. Faster than
  // an iron sword, accurate enough to compensate for raw power. Lower might
  // than iron sword so duels against Guts read as "Griffith is faster and
  // can double, but Guts hits like a siege engine and wins slow."
  rapier: {
    id: 'rapier', name: 'Rapier', kind: 'weapon', wtype: 'sword',
    might: 4, hit: 95, crit: 5, weight: 3, minRange: 1, maxRange: 1, uses: 30,
    desc: 'A duellist\'s blade. Light, accurate, and cruel — built for the long match.',
  },
};

export const HEALS: Record<string, HealDef> = {
  vulnerary: {
    id: 'vulnerary', name: 'Vulnerary', kind: 'heal', healAmount: 10, uses: 3,
    desc: 'Restores 10 HP. Bitter enough to wake the dead.',
  },
};

const ALL: Record<string, ItemDef> = { ...WEAPONS, ...HEALS };

export function getItem(id: string): ItemDef {
  const it = ALL[id];
  if (!it) throw new Error('Unknown item: ' + id);
  return it;
}

/** True if an id resolves. Used to sanitise saves written by older builds. */
export function itemExists(id: string): boolean {
  return !!ALL[id];
}

export function isWeapon(it: ItemDef | null | undefined): it is WeaponDef {
  return !!it && it.kind === 'weapon';
}

// Weapon triangle — sword beats axe, axe beats lance, lance beats sword.
export function triangle(a: WeaponType, b: WeaponType): number {
  if (a === b || a === 'bow' || b === 'bow') return 0;
  if (a === 'sword') return b === 'axe' ? 1 : -1;
  if (a === 'axe') return b === 'lance' ? 1 : -1;
  return b === 'sword' ? 1 : -1; // lance
}
