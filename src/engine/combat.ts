import type { CombatPlan, CombatRound, Forecast, Growths, SideForecast, Unit, WeaponDef } from './types';
import { getItem, isWeapon, triangle } from '../data/weapons';
import { terrainAt } from './terrain';

// ─── Fire Emblem GBA-style combat mathematics ────────────────────────────────

export function equippedWeapon(u: Unit): WeaponDef | null {
  for (const it of u.items) {
    const def = getItem(it.id);
    if (isWeapon(def) && it.uses > 0) return def;
  }
  return null;
}

/** Weight in excess of constitution slows the unit (affects doubling & avoid). */
export function effectiveSpd(u: Unit): number {
  const w = equippedWeapon(u);
  const burden = w ? Math.max(0, w.weight - u.stats.con) : 0;
  return Math.max(0, u.stats.spd - burden);
}

export const hasTrait = (u: Unit, t: 'sunder' | 'unflinching') => !!u.traits?.includes(t);

function sideForecast(a: Unit, b: Unit, map: string[]): SideForecast {
  const w = equippedWeapon(a);
  if (!w) return { dmg: 0, hit: 0, crit: 0, double: false, weapon: null };
  const bw = equippedWeapon(b);
  const tri = bw ? triangle(w.wtype, bw.wtype) : 0;
  const t = terrainAt(map, b.x, b.y);

  // SUNDER — the greatsword shatters cover: the defender keeps their own
  // armour, but gains nothing from the ground they're standing on.
  const sunder = hasTrait(a, 'sunder');
  const tDef = sunder ? 0 : t.def;
  const tAvo = sunder ? 0 : t.avo;

  // A provoked boss hits harder. Deliberately flat damage rather than bonus
  // crit: a crit swing from a heavy axe could erase Guts from full HP on a
  // hidden dice roll, which is a miserable way to lose a tutorial chapter.
  const rage = a.raged ? 2 : 0;

  const dmg = Math.max(0, a.stats.str + w.might + rage + tri * 1 - (b.stats.def + tDef));
  const avoidB = effectiveSpd(b) * 2 + b.stats.lck + tAvo;
  const hit = Math.max(0, Math.min(100, Math.round(w.hit + a.stats.skl * 2 + a.stats.lck / 2 + tri * 15 - avoidB)));
  const crit = Math.max(0, Math.min(100, Math.round(w.crit + a.stats.skl / 2 - b.stats.lck)));

  // UNFLINCHING — heavy armour shrugs off flurries; this unit is never doubled.
  const double = !hasTrait(b, 'unflinching') && effectiveSpd(a) >= effectiveSpd(b) + 4;

  return { dmg, hit, crit, double, weapon: w };
}

export function forecast(a: Unit, b: Unit, map: string[]): Forecast {
  const atkSide = sideForecast(a, b, map);
  const dist = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  const bw = equippedWeapon(b);
  let defSide: SideForecast | null = null;
  if (bw && bw.uses > 0 && dist >= bw.minRange && dist <= bw.maxRange) {
    defSide = sideForecast(b, a, map);
  }
  return { atk: atkSide, def: defSide };
}

// True-hit: average of two rolls (GBA "2RN") makes high hit rates reliable.
const roll2rn = (pct: number) => (Math.random() + Math.random()) / 2 * 100 < pct;
const roll1rn = (pct: number) => Math.random() * 100 < pct;

export function planCombat(a: Unit, b: Unit, map: string[]): CombatPlan {
  const fc = forecast(a, b, map);
  const rounds: CombatRound[] = [];
  const hpSequence: { a: number; d: number }[] = [];
  let hpA = a.hp, hpB = b.hp;

  const strike = (by: 'atk' | 'def') => {
    if (hpA <= 0 || hpB <= 0) return;
    const s = by === 'atk' ? fc.atk : fc.def;
    if (!s || !s.weapon) return;
    const hit = roll2rn(s.hit);
    const crit = hit && roll1rn(s.crit);
    const dmg = hit ? (crit ? s.dmg * 3 : s.dmg) : 0;
    if (by === 'atk') hpB = Math.max(0, hpB - dmg); else hpA = Math.max(0, hpA - dmg);
    rounds.push({ by, hit, crit, dmg, killed: (by === 'atk' ? hpB : hpA) <= 0 });
    hpSequence.push({ a: hpA, d: hpB });
  };

  strike('atk');
  const defCountered = !!fc.def && hpB > 0 && hpA > 0;
  if (defCountered) strike('def');
  if (hpA > 0 && hpB > 0) {
    if (fc.atk.double) strike('atk');
    else if (fc.def?.double) strike('def');
  }

  const dmgByA = a.hp <= hpA ? 0 : 0; // computed from rounds below
  const totalDmgA = rounds.filter(r => r.by === 'atk' && r.hit).reduce((s, r) => s + r.dmg, 0);
  const killA = hpB <= 0;
  let xpA = 1 + Math.floor(totalDmgA / 2);
  if (killA) xpA += 26 + Math.max(0, b.level - a.level) * 5 + (b.boss ? 25 : 0);
  xpA = Math.max(1, Math.min(100, xpA));
  void dmgByA;

  return {
    attacker: a, defender: b, forecast: fc, rounds, hpSequence,
    finalHpA: hpA, finalHpD: hpB, defCountered,
    weaponBroke: { a: false, d: false }, // durability applied by engine
    xpA, killA,
  };
}

// ─── Levelling ───────────────────────────────────────────────────────────────

export interface LevelGains { stat: keyof Omit<Growths, never>; label: string }[]

export function applyLevelUp(u: Unit): { label: string; stat: string }[] {
  const gains: { label: string; stat: string }[] = [];
  const g = u.growths;
  const roll = (p: number) => Math.random() < p;
  const up = (stat: keyof Growths, label: string) => {
    if (roll(g[stat])) {
      gains.push({ label, stat });
      if (stat === 'hp') { u.stats.hp += 1; u.hp = Math.min(u.stats.hp, u.hp + 1); }
      else (u.stats as unknown as Record<string, number>)[stat] += 1;
    }
  };
  up('hp', 'HP'); up('str', 'Str'); up('skl', 'Skl'); up('spd', 'Spd');
  up('lck', 'Lck'); up('def', 'Def'); up('res', 'Res');
  u.level = Math.min(20, u.level + 1);
  return gains;
}

export function grantExp(u: Unit, amount: number): { leveled: boolean; gains: ReturnType<typeof applyLevelUp> } {
  if (u.level >= 20) return { leveled: false, gains: [] };
  u.exp += amount;
  if (u.exp >= 100) {
    u.exp -= 100;
    const gains = applyLevelUp(u);
    return { leveled: true, gains };
  }
  return { leveled: false, gains: [] };
}
