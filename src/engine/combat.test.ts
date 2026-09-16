import { describe, it, expect } from 'vitest';
import { forecast, effectiveSpd, planCombat, grantExp, equippedWeapon } from './combat';
import { triangle, getItem, isWeapon } from '../data/weapons';
import { mkUnit } from '../data/characters';
import type { Unit } from './types';

// Terrain under the defender at (1,1) is forest: +1 Def, +20 Avoid.
// Run with: npx vitest run
const MAP_FOREST = [
  '....',
  '.T..',
  '....',
];
const MAP_PLAIN = [
  '....',
  '....',
  '....',
];

const at = (u: Unit, x: number, y: number) => { u.x = x; u.y = y; return u; };

describe('weapon triangle', () => {
  it('cycles sword > axe > lance > sword', () => {
    expect(triangle('sword', 'axe')).toBe(1);
    expect(triangle('axe', 'lance')).toBe(1);
    expect(triangle('lance', 'sword')).toBe(1);
  });
  it('inverts on the losing side', () => {
    expect(triangle('axe', 'sword')).toBe(-1);
    expect(triangle('lance', 'axe')).toBe(-1);
    expect(triangle('sword', 'lance')).toBe(-1);
  });
  it('is neutral for mirrors and bows', () => {
    expect(triangle('sword', 'sword')).toBe(0);
    expect(triangle('bow', 'axe')).toBe(0);
    expect(triangle('lance', 'bow')).toBe(0);
  });
});

describe('effective speed (weapon weight vs constitution)', () => {
  it('slows Guts by the greatsword overweight', () => {
    const guts = mkUnit('guts', 'player', 0, 0);
    // spd 6, con 9, greatsword weight 14 -> burden 5 -> AS 1
    expect(effectiveSpd(guts)).toBe(1);
  });
  it('does not penalise a weapon lighter than con', () => {
    const wyatt = mkUnit('wyatt', 'player', 0, 0);
    // spd 8, con 7, iron sword weight 5 -> no burden
    expect(effectiveSpd(wyatt)).toBe(8);
  });
});

describe('every weapon type resolves a forecast', () => {
  const foe = () => at(mkUnit('e_soldier', 'enemy', 1, 0), 1, 0);
  it.each([
    ['guts', 'sword'],      // greatsword
    ['wyatt', 'sword'],
    ['bren', 'axe'],
    ['e_soldier', 'lance'],
    ['sena', 'bow'],
  ])('%s wields a %s and produces finite numbers', (defId, wtype) => {
    const u = at(mkUnit(defId, 'player', 0, 0), 0, 0);
    const w = equippedWeapon(u);
    expect(w).not.toBeNull();
    expect(w!.wtype).toBe(wtype);

    const d = foe();
    // put the bow user at its own range so the attack is legal
    if (w!.minRange > 1) at(d, 2, 0);
    const fc = forecast(u, d, MAP_PLAIN);
    expect(Number.isFinite(fc.atk.dmg)).toBe(true);
    expect(fc.atk.hit).toBeGreaterThanOrEqual(0);
    expect(fc.atk.hit).toBeLessThanOrEqual(100);
    expect(fc.atk.crit).toBeGreaterThanOrEqual(0);
  });
});

describe('SUNDER — Guts ignores terrain cover', () => {
  it('strips the defender of terrain Def and Avoid', () => {
    const guts = at(mkUnit('guts', 'player', 0, 1), 0, 1);
    const foe = at(mkUnit('e_soldier', 'enemy', 1, 1), 1, 1); // on forest
    const fc = forecast(guts, foe, MAP_FOREST);
    // str 9 + might 9 + tri(-1) - def 4, forest +1 Def ignored
    expect(fc.atk.dmg).toBe(13);
    // 68 + skl*2 10 + lck/2 2 - tri 15 = 65; avoid 4*2+1 = 9, forest +20 ignored
    expect(fc.atk.hit).toBe(56);
  });

  it('without the trait the same attack is far worse', () => {
    const guts = at(mkUnit('guts', 'player', 0, 1), 0, 1);
    guts.traits = [];
    const foe = at(mkUnit('e_soldier', 'enemy', 1, 1), 1, 1);
    const fc = forecast(guts, foe, MAP_FOREST);
    expect(fc.atk.dmg).toBe(12);   // forest +1 Def now applies
    expect(fc.atk.hit).toBe(36);   // forest +20 Avoid now applies
  });
});

describe('UNFLINCHING — Bazuso cannot be doubled', () => {
  it('blocks a double that speed alone would earn', () => {
    const wyatt = at(mkUnit('wyatt', 'player', 0, 0), 0, 0);
    const bazuso = at(mkUnit('bazuso', 'enemy', 1, 0), 1, 0);
    // AS 8 vs AS 4 -> normally doubles at +4
    expect(effectiveSpd(wyatt) - effectiveSpd(bazuso)).toBeGreaterThanOrEqual(4);
    expect(forecast(wyatt, bazuso, MAP_PLAIN).atk.double).toBe(false);
  });
  it('doubles once the trait is removed', () => {
    const wyatt = at(mkUnit('wyatt', 'player', 0, 0), 0, 0);
    const bazuso = at(mkUnit('bazuso', 'enemy', 1, 0), 1, 0);
    bazuso.traits = [];
    expect(forecast(wyatt, bazuso, MAP_PLAIN).atk.double).toBe(true);
  });
});

describe('enraged boss deals flat bonus damage (never bonus crit)', () => {
  it('adds exactly +2 damage and leaves crit untouched', () => {
    const guts = at(mkUnit('guts', 'player', 0, 0), 0, 0);
    const calm = at(mkUnit('bazuso', 'enemy', 1, 0), 1, 0);
    const base = forecast(calm, guts, MAP_PLAIN).atk;

    const raged = at(mkUnit('bazuso', 'enemy', 1, 0), 1, 0);
    raged.raged = true;
    const hot = forecast(raged, guts, MAP_PLAIN).atk;

    expect(hot.dmg).toBe(base.dmg + 2);
    expect(hot.crit).toBe(base.crit);
  });

  it('cannot delete a full-HP Guts on a hidden roll', () => {
    const guts = at(mkUnit('guts', 'player', 0, 0), 0, 0);
    const raged = at(mkUnit('bazuso', 'enemy', 1, 0), 1, 0);
    raged.raged = true;
    const fc = forecast(raged, guts, MAP_PLAIN).atk;
    // no crit chance at all, so the forecast is the whole truth...
    expect(fc.crit).toBe(0);
    // ...and the worst single swing leaves him standing
    expect(fc.dmg).toBeLessThan(guts.stats.hp);
    // he also cannot be doubled into a one-round kill
    expect(fc.double).toBe(false);
  });
});

describe('counter-attack range', () => {
  it('a bow cannot retaliate at melee range', () => {
    const sena = at(mkUnit('sena', 'player', 0, 0), 0, 0);
    const foe = at(mkUnit('e_soldier', 'enemy', 1, 0), 1, 0);
    expect(forecast(foe, sena, MAP_PLAIN).def).toBeNull();
  });
  it('a bow retaliates at its own range', () => {
    const sena = at(mkUnit('sena', 'player', 0, 0), 0, 0);
    const foe = at(mkUnit('e_archer', 'enemy', 2, 0), 2, 0);
    expect(forecast(foe, sena, MAP_PLAIN).def).not.toBeNull();
  });
  it('a melee defender cannot reach an attacker two tiles away', () => {
    const sena = at(mkUnit('sena', 'player', 0, 0), 0, 0);
    const foe = at(mkUnit('e_soldier', 'enemy', 2, 0), 2, 0);
    expect(forecast(sena, foe, MAP_PLAIN).def).toBeNull();
  });
});

describe('planCombat invariants (200 randomised resolutions)', () => {
  it('never desyncs HP, never goes negative, bounds XP', () => {
    for (let i = 0; i < 200; i++) {
      const guts = at(mkUnit('guts', 'player', 0, 0), 0, 0);
      const foe = at(mkUnit('e_fighter', 'enemy', 1, 0), 1, 0);
      const plan = planCombat(guts, foe, MAP_PLAIN);

      expect(plan.rounds.length).toBeGreaterThan(0);
      expect(plan.hpSequence.length).toBe(plan.rounds.length);
      expect(plan.finalHpA).toBeGreaterThanOrEqual(0);
      expect(plan.finalHpD).toBeGreaterThanOrEqual(0);

      const last = plan.hpSequence[plan.hpSequence.length - 1];
      expect(last.a).toBe(plan.finalHpA);
      expect(last.d).toBe(plan.finalHpD);

      expect(plan.xpA).toBeGreaterThanOrEqual(1);
      expect(plan.xpA).toBeLessThanOrEqual(100);
      expect(plan.killA).toBe(plan.finalHpD <= 0);

      // combat stops the moment someone dies
      const fatal = plan.rounds.findIndex(r => r.killed);
      if (fatal >= 0) expect(fatal).toBe(plan.rounds.length - 1);
      // a missed swing deals nothing
      for (const r of plan.rounds) if (!r.hit) expect(r.dmg).toBe(0);
    }
  });

  it('a unit that cannot counter never appears as a defender round', () => {
    for (let i = 0; i < 50; i++) {
      const sena = at(mkUnit('sena', 'player', 0, 0), 0, 0);
      const foe = at(mkUnit('e_soldier', 'enemy', 1, 0), 1, 0);
      const plan = planCombat(foe, sena, MAP_PLAIN);  // melee onto the archer
      expect(plan.rounds.every(r => r.by === 'atk')).toBe(true);
    }
  });
});

describe('levelling', () => {
  it('converts 100 XP into exactly one level', () => {
    const u = mkUnit('wyatt', 'player', 0, 0);
    const before = u.level;
    const res = grantExp(u, 100);
    expect(res.leveled).toBe(true);
    expect(u.level).toBe(before + 1);
    expect(u.exp).toBe(0);
  });
  it('banks XP below the threshold', () => {
    const u = mkUnit('wyatt', 'player', 0, 0);
    const res = grantExp(u, 40);
    expect(res.leveled).toBe(false);
    expect(u.exp).toBe(40);
  });
  it('never exceeds level 20', () => {
    const u = mkUnit('wyatt', 'player', 0, 0);
    u.level = 20;
    const res = grantExp(u, 100);
    expect(res.leveled).toBe(false);
    expect(u.level).toBe(20);
  });
  it('keeps current HP within the new maximum', () => {
    for (let i = 0; i < 60; i++) {
      const u = mkUnit('bren', 'player', 0, 0);
      grantExp(u, 100);
      expect(u.hp).toBeLessThanOrEqual(u.stats.hp);
    }
  });
});

describe('item database integrity', () => {
  it('every character carries resolvable items', () => {
    for (const id of ['guts', 'wyatt', 'bren', 'sena', 'e_soldier', 'e_fighter', 'e_archer', 'bazuso']) {
      const u = mkUnit(id, 'player', 0, 0);
      expect(u.items.length).toBeGreaterThan(0);
      for (const stack of u.items) {
        const def = getItem(stack.id);
        expect(def).toBeTruthy();
        expect(stack.uses).toBeGreaterThan(0);
        // a fresh unit should never start above the item's max durability
        if (isWeapon(def)) expect(stack.uses).toBeLessThanOrEqual(def.uses);
      }
      expect(equippedWeapon(u)).not.toBeNull();
    }
  });
});
