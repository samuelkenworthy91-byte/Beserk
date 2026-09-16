import type {
  ChapterDef, CombatPlan, Forecast, ItemStack, Unit,
} from './types';
import { movementRange, attackFrom, threatZone, pathTo, key, type MoveMap } from './path';
import { forecast as calcForecast, planCombat, equippedWeapon, grantExp } from './combat';
import { terrainAt } from './terrain';
import { mkUnit, resetUids } from '../data/characters';
import { getItem, isWeapon, itemExists } from '../data/weapons';
import type { BattleSnapshot, CampaignSave } from './save';
import { sfx } from './sfx';

// ─── BattleEngine ────────────────────────────────────────────────────────────
// Mutable engine; React calls methods and bounces `version` state via onChange.
// The canvas map redraws every rAF from engine state, so animations don't
// need React renders.

export type BattleMode =
  | 'idle' | 'selected' | 'menu' | 'target' | 'anim' | 'enemyPhase' | 'done';

export type EngineEvent =
  | { type: 'levelup'; unit: Unit; gains: { label: string; stat: string }[] }
  | { type: 'death'; unit: Unit }
  | { type: 'quote'; unit: Unit; text: string }
  | { type: 'victory' }
  | { type: 'gameover' }
  | { type: 'hint'; text: string; id: string }
  | { type: 'broke'; unit: Unit; itemName: string };

export interface SelState {
  unit: Unit;
  fromX: number; fromY: number;
  moves: MoveMap;
  attackTiles: Set<string>;
}

export interface CutData { plan: CombatPlan }

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
export const manh = (ax: number, ay: number, bx: number, by: number) =>
  Math.abs(ax - bx) + Math.abs(ay - by);

export class BattleEngine {
  chapter: ChapterDef;
  units: Unit[] = [];
  turn = 1;
  phase: 'player' | 'enemy' = 'player';
  mode: BattleMode = 'idle';
  cursor = { x: 0, y: 0 };
  sel: SelState | null = null;
  busy = false;
  events: EngineEvent[] = [];
  hintsShown = new Set<string>();
  combatCount = 0;

  // ephemeral render state
  animPos: { uid: number; x: number; y: number } | null = null;
  deadFx: { uid: number; t0: number }[] = [];
  cutData: CutData | null = null;
  danger: Set<string> | null = null;
  dangerForUid = -1;
  targetPreview: { enemy: Unit; fc: Forecast } | null = null;

  // banners shown as DOM overlays
  banner: { text: string; sub: string; tone: 'blue' | 'red' } | null = null;

  campaign: CampaignSave | null = null;
  fallen: string[] = [];
  onChange: () => void = () => { };
  private pendingPlan: CombatPlan | null = null;
  private cutResolve: (() => void) | null = null;

  constructor(chapter: ChapterDef, campaign: CampaignSave | null, resume?: BattleSnapshot) {
    this.chapter = chapter;
    this.campaign = campaign;
    resetUids();
    if (resume) {
      this.restore(resume);
    } else {
      for (const cu of chapter.units) {
        this.units.push(mkUnit(cu.def, cu.faction, cu.x, cu.y, {
          ai: cu.ai, level: cu.level,
          group: cu.group, aggro: cu.aggro, active: cu.active,
        }));
      }
      this.applyPartyMods();
      this.cursor = { x: chapter.playerStart[0][0], y: chapter.playerStart[0][1] };
    }
    // ── tutorial popups (concise, one concept each, shown on first relevance) ──
    this.pushHint('obj',
      `${chapter.objective}. Guts must survive — if he falls, the battle is lost.`);
    this.pushHint('move',
      'Tap an ally, then a blue tile to move. Red tiles are within weapon reach.');
  }

  // ── helpers ────────────────────────────────────────────────────────────────

  get map() { return this.chapter.map; }

  unitAt(x: number, y: number): Unit | undefined {
    return this.units.find(u => !u.dead && u.x === x && u.y === y);
  }
  players() { return this.units.filter(u => !u.dead && u.faction === 'player'); }
  enemies() { return this.units.filter(u => !u.dead && u.faction === 'enemy'); }

  pushHint(id: string, text: string) {
    if (this.hintsShown.has(id)) return;
    this.hintsShown.add(id);
    this.events.push({ type: 'hint', id, text });
  }

  // ── encounter pacing ──────────────────────────────────────────────────────
  // Enemies hold their posts until something provokes them, so the field wakes
  // up in waves instead of every defender charging on turn 1.

  /** Wake a unit and everyone sharing its squad id. */
  wake(u: Unit, reason: 'spotted' | 'struck') {
    const toWake = u.group
      ? this.enemies().filter(e => e.group === u.group)
      : [u];
    let anyNew = false;
    for (const e of toWake) {
      if (e.active) continue;
      e.active = true;
      anyNew = true;
      if (e.ai === 'boss') this.rageBoss(e);
    }
    if (anyNew) {
      this.pushHint('groups',
        'The garrison holds its posts. Patrols only rouse when you come close, or when one of them is struck — pick your fights one group at a time.');
    }
    void reason;
  }

  /** A holding boss abandons its post: advances, and fights recklessly. */
  private rageBoss(b: Unit) {
    if (b.raged) return;
    b.raged = true;
    b.active = true;
    b.ai = 'attack';
    // the rage line supersedes the on-engage taunt, so they never stack
    if (b.quotes?.rage && !b.quoteShown) {
      b.quoteShown = true;
      this.events.push({ type: 'quote', unit: b, text: b.quotes.rage });
    }
    this.pushHint('boss_rage',
      'Bazuso has left the gate. Off the stone he no longer mends each turn — but he swings harder now. He trades blows with Guts almost evenly, so soften him with the others before you close.');
  }

  /** Evaluate every dormant enemy against its triggers. */
  private evaluateTriggers() {
    const alive = this.players();
    if (!alive.length) return;

    for (const e of this.enemies()) {
      if (e.active) continue;
      for (const p of alive) {
        if (manh(e.x, e.y, p.x, p.y) <= e.aggro) { this.wake(e, 'spotted'); break; }
      }
    }

    // ── Bazuso's triggers: pressure at the gate, a thinned garrison, or time ──
    const boss = this.enemies().find(u => u.defId === this.chapter.bossDefId);
    if (!boss || boss.raged) return;

    const guards = this.units.filter(u => u.faction === 'enemy' && !u.boss);
    const guardsDown = guards.filter(u => u.dead).length;
    const guts = alive.find(u => u.defId === 'guts');

    const gutsClose = !!guts && manh(boss.x, boss.y, guts.x, guts.y) <= 4;
    const anyClose = alive.some(p => manh(boss.x, boss.y, p.x, p.y) <= 2);
    const garrisonBroken = guardsDown >= Math.ceil(guards.length / 2);
    const bossHurt = boss.hp < boss.stats.hp;

    if (gutsClose || anyClose || garrisonBroken || bossHurt || this.turn >= 8) {
      this.rageBoss(boss);
    }
  }

  private applyPartyMods() {
    if (!this.campaign) return;
    for (const u of this.players()) {
      const saved = this.campaign.party.find(p => p.defId === u.defId);
      if (saved) {
        u.stats = { ...saved.stats };
        u.hp = u.stats.hp;
        u.level = saved.level;
        u.exp = saved.exp;
        // drop anything a previous build knew about but this one does not,
        // so a stale save can never hard-crash on deploy
        u.items = saved.items.filter(i => itemExists(i.id) && i.uses > 0).map(i => ({ ...i }));
      }
    }
    for (const f of this.campaign.fallen) {
      for (const u of this.players()) if (u.defId === f) u.dead = true;
    }
  }

  // ── selection / input ─────────────────────────────────────────────────────

  selectTile(x: number, y: number) {
    if (this.busy || this.phase !== 'player' || this.mode === 'anim') return;
    this.cursor = { x, y };

    if (this.mode === 'idle') {
      const u = this.unitAt(x, y);
      if (u && u.faction === 'player' && !u.moved) {
        this.beginSelect(u);
      } else if (u && u.faction === 'enemy') {
        sfx.cursor();
        this.toggleDanger(u);
        this.pushHint('danger', 'The red haze shows everywhere this enemy could strike next turn. Keep the wounded — and archers — out of it.');
        this.onChange();
      } else {
        if (this.danger) { this.danger = null; this.dangerForUid = -1; }
        sfx.cursor();
        this.onChange();
      }
      return;
    }

    if (this.mode === 'selected' && this.sel) {
      const s = this.sel;
      const occupant = this.unitAt(x, y);
      const canStand = !occupant || occupant.uid === s.unit.uid;
      if (s.moves.has(key(x, y)) && canStand) {
        if (x === s.unit.x && y === s.unit.y && s.fromX === x && s.fromY === y) {
          this.openMenu();
          return;
        }
        void this.moveSelectedTo(x, y);
      } else {
        this.cancelSelection();
      }
      return;
    }

    if (this.mode === 'menu') { this.cancelAfterMove(); return; }

    if (this.mode === 'target') {
      const u = this.unitAt(x, y);
      if (u && u.faction === 'enemy' && this.targetsFromSel().some(t => t.uid === u.uid)) {
        this.previewTarget(u);
      } else {
        this.cancelTargeting();
      }
      return;
    }
  }

  private beginSelect(u: Unit) {
    if (u.defId === 'guts') {
      this.pushHint('sunder',
        'SUNDER — Guts\' greatsword smashes through cover. Terrain grants his target no Def or Avoid, so he is your answer to entrenched foes. He is heavy, though: poor accuracy, and never fast enough to strike twice.');
    }
    const moves = movementRange(this.map, this.units, u);
    const w = equippedWeapon(u);
    const atkTiles = w ? threatZone(this.map, moves, w.minRange, w.maxRange) : new Set<string>();
    this.sel = { unit: u, fromX: u.x, fromY: u.y, moves, attackTiles: atkTiles };
    this.mode = 'selected';
    this.danger = null;
    sfx.select();
    this.onChange();
  }

  cancelSelection() {
    this.sel = null;
    this.mode = 'idle';
    sfx.cancel();
    this.onChange();
  }

  private async moveSelectedTo(x: number, y: number) {
    const s = this.sel!;
    const path = pathTo(s.moves, x, y);
    this.busy = true;
    sfx.cursor();
    await this.slideUnit(s.unit, path);
    this.busy = false;
    this.openMenu();
  }

  private async slideUnit(u: Unit, path: [number, number][]) {
    if (!path.length) return;
    // requestAnimationFrame is a browser API. When the engine runs under
    // node (vitest, scripts) it is missing — fall back to a setTimeout-based
    // shim that yields to the microtask queue at the same cadence, so the
    // tests don't crash and headless tooling still ticks.
    const raf: (cb: () => void) => void =
      typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame
        : (cb: () => void) => setTimeout(cb, 16) as unknown as number;
    for (const [nx, ny] of path) {
      const sx = u.x, sy = u.y;
      const D = 82;
      const t0 = performance.now();
      await new Promise<void>((res) => {
        const step = () => {
          const k = Math.min(1, (performance.now() - t0) / D);
          this.animPos = { uid: u.uid, x: sx + (nx - sx) * k, y: sy + (ny - sy) * k };
          if (k < 1) raf(step); else res();
        };
        raf(step);
      });
      u.x = nx; u.y = ny;
      sfx.cursor();
    }
    this.animPos = null;
    this.onChange();
  }

  private openMenu() {
    this.mode = 'menu';
    sfx.cursor();
    this.pushHint('menu', 'Choose an action: Attack, use an Item, or Wait. Cancel returns the unit to where it started.');
    this.onChange();
  }

  /** FE-style: cancel after moving sends the unit back and reopens movement. */
  cancelAfterMove() {
    const s = this.sel!;
    s.unit.x = s.fromX; s.unit.y = s.fromY;
    this.beginSelect(s.unit);
  }

  // ── action menu hooks (called from React) ─────────────────────────────────

  menuCanAttack(): boolean { return this.targetsFromSel().length > 0; }
  menuItems(): { stack: ItemStack; index: number }[] {
    const u = this.sel?.unit;
    if (!u) return [];
    return u.items
      .map((stack, index) => ({ stack, index }))
      .filter(e => { const d = getItem(e.stack.id); return d.kind === 'heal' && e.stack.uses > 0; });
  }

  targetsFromSel(): Unit[] {
    const s = this.sel;
    if (!s) return [];
    const w = equippedWeapon(s.unit);
    if (!w) return [];
    const zone = attackFrom(this.map, s.unit.x, s.unit.y, w.minRange, w.maxRange);
    return this.enemies().filter(e => zone.has(key(e.x, e.y)));
  }

  actionEnterTarget() {
    if (!this.sel) return;
    this.mode = 'target';
    this.targetPreview = null;
    sfx.select();
    this.pushHint('attack',
      'Tap an enemy to see the forecast before committing. Weapons cycle: swords beat axes, axes beat lances, lances beat swords — the winning side gets +15 Hit.');
    this.onChange();
  }

  previewTarget(enemy: Unit) {
    if (!this.sel) return;
    const fc = calcForecast(this.sel.unit, enemy, this.map);
    this.targetPreview = { enemy, fc };
    const t = terrainAt(this.map, enemy.x, enemy.y);
    if (t.def > 0 || t.avo > 0) {
      this.pushHint('terrain',
        `Cover counts. Standing on ${t.name.toLowerCase()} gives this enemy +${t.def} Def and +${t.avo} Avoid. Guts ignores it entirely; everyone else should think twice.`);
    }
    sfx.cursor();
    this.onChange();
  }

  cancelTargeting() {
    if (!this.sel) return;
    this.targetPreview = null;
    this.mode = 'menu';
    sfx.cancel();
    this.onChange();
  }

  /** Confirm the previewed attack (or attack a chosen enemy directly). */
  confirmAttack(enemy?: Unit) {
    const s = this.sel; if (!s) return;
    const foe = enemy ?? this.targetPreview?.enemy;
    if (!foe) return;
    const plan = planCombat(s.unit, foe, this.map);
    this.targetPreview = null;
    if (foe.boss && foe.quotes?.battle && !foe.quoteShown) {
      foe.quoteShown = true;
      this.pendingPlan = plan;
      this.events.push({ type: 'quote', unit: foe, text: foe.quotes.battle });
      this.onChange();
      return;
    }
    void this.runCombat(plan);
  }

  /** React calls this after dismissing a quote event. */
  quoteDismissed() {
    if (this.pendingPlan) {
      const p = this.pendingPlan;
      this.pendingPlan = null;
      void this.runCombat(p);
    }
  }

  async actionUseItem(index: number) {
    const s = this.sel; if (!s) return;
    const stack = s.unit.items[index];
    const def = getItem(stack.id);
    if (def.kind !== 'heal' || stack.uses <= 0) return;
    stack.uses -= 1;
    s.unit.hp = Math.min(s.unit.stats.hp, s.unit.hp + def.healAmount);
    sfx.heal();
    if (stack.uses <= 0) s.unit.items.splice(index, 1);
    await this.finalizeAction(s.unit);
  }

  async actionWait() {
    const s = this.sel; if (!s) return;
    await this.finalizeAction(s.unit);
  }

  private async finalizeAction(u: Unit) {
    u.moved = true;
    this.sel = null;
    this.mode = 'idle';
    sfx.confirm();
    this.pushHint('end', 'Out of moves? Press End Turn (top right) to begin the enemy phase.');
    this.onChange();
    void u;
  }

  // ── combat flow ────────────────────────────────────────────────────────────

  private runCombat(plan: CombatPlan): Promise<void> {
    this.mode = 'anim';
    this.cutData = { plan };
    this.combatCount++;
    this.onChange();
    return new Promise<void>(res => { this.cutResolve = res; });
  }

  /** Cutscene component: apply hp state of round i (hp ticks down visually). */
  applyRound(i: number) {
    const plan = this.cutData?.plan;
    if (!plan) return;
    const st = plan.hpSequence[i];
    plan.attacker.hp = st.a;
    plan.defender.hp = st.d;
    this.onChange();
  }

  /** Cutscene component: combat finished — resolve everything. */
  finishCombat() {
    const plan = this.cutData?.plan;
    this.cutData = null;
    this.mode = 'idle';
    this.onChange();
    if (!plan) { this.cutResolve?.(); this.cutResolve = null; return; }

    const a = plan.attacker, d = plan.defender;
    a.hp = plan.finalHpA;
    d.hp = plan.finalHpD;

    // durability: one use per swing each side
    const aSwings = plan.rounds.filter(r => r.by === 'atk').length;
    const dSwings = plan.rounds.filter(r => r.by === 'def').length;
    this.consumeWeapon(a, aSwings);
    this.consumeWeapon(d, dSwings);

    // being struck rouses a defender and its whole squad
    if (d.faction === 'enemy' && !d.active && d.hp > 0) this.wake(d, 'struck');
    if (a.faction === 'enemy' && !a.active && a.hp > 0) this.wake(a, 'struck');

    // deaths
    if (d.hp <= 0 && !d.dead) this.killUnit(d);
    if (a.hp <= 0 && !a.dead) this.killUnit(a);

    // a death may thin the garrison enough to provoke the boss
    this.evaluateTriggers();

    // xp — attacker earns the bulk; a player defender earns scraps for surviving
    if (a.faction === 'player' && a.hp > 0) {
      const { leveled, gains } = grantExp(a, plan.xpA);
      if (leveled) {
        sfx.levelup();
        this.events.push({ type: 'levelup', unit: a, gains });
      }
    }
    if (d.faction === 'player' && d.hp > 0) {
      const { leveled, gains } = grantExp(d, 10);
      if (leveled) {
        sfx.levelup();
        this.events.push({ type: 'levelup', unit: d, gains });
      }
    }

    if (a.faction === 'player') a.moved = true;
    if (this.sel?.unit.uid === a.uid) { this.sel = null; }
    this.onChange();
    this.cutResolve?.();
    this.cutResolve = null;
  }

  private consumeWeapon(u: Unit, n: number) {
    if (n <= 0) return;
    const w = equippedWeapon(u);
    if (!w) return;
    const stack = u.items.find(i => i.id === w.id);
    if (!stack) return;
    stack.uses -= n;
    if (stack.uses <= 0) {
      const def = getItem(stack.id);
      if (isWeapon(def)) this.events.push({ type: 'broke', unit: u, itemName: def.name });
      u.items.splice(u.items.indexOf(stack), 1);
      sfx.broken();
    }
  }

  private killUnit(u: Unit) {
    u.dead = true;
    this.deadFx.push({ uid: u.uid, t0: performance.now() });
    this.events.push({ type: 'death', unit: u });
    if (u.faction === 'player') {
      if (u.essential) {
        this.events.push({ type: 'gameover' });
      } else if (!this.fallen.includes(u.defId)) {
        this.fallen.push(u.defId);
      }
    }
    if (u.defId === this.chapter.bossDefId) {
      this.events.push({ type: 'victory' });
    }
  }

  // ── phase control ─────────────────────────────────────────────────────────

  async endTurn() {
    if (this.phase !== 'player' || this.busy || this.mode === 'anim') return;
    this.sel = null;
    this.phase = 'enemy';
    this.mode = 'enemyPhase';
    this.busy = true;
    this.danger = null;
    this.banner = { text: 'ENEMY PHASE', sub: 'The defenders of Karsenn stir', tone: 'red' };
    sfx.phaseIn();
    this.onChange();
    await sleep(1150);
    this.banner = null;

    await this.startOfPhaseHeals('enemy');
    this.evaluateTriggers();
    for (const foe of this.enemies()) {
      if (foe.dead) continue;
      if (!foe.active) continue;        // still holding its post
      await this.enemyAct(foe);
      await sleep(140);
    }

    this.turn++;
    this.phase = 'player';
    for (const u of this.players()) u.moved = false;
    await this.startOfPhaseHeals('player');
    this.banner = { text: 'PLAYER PHASE', sub: `Turn ${this.turn} — ${this.chapter.objective}`, tone: 'blue' };
    sfx.phaseIn();
    this.onChange();
    await sleep(1100);
    this.banner = null;
    this.busy = false;
    this.mode = 'idle';
    this.onChange();
  }

  private async startOfPhaseHeals(side: 'player' | 'enemy') {
    const list = side === 'player' ? this.players() : this.enemies();
    let jingled = false;
    for (const u of list) {
      const t = terrainAt(this.map, u.x, u.y);
      if (t.heal > 0 && u.hp < u.stats.hp) {
        u.hp = Math.min(u.stats.hp, u.hp + Math.max(1, Math.floor(u.stats.hp * t.heal / 100)));
        if (!jingled) { jingled = true; sfx.heal(); }
      }
    }
    this.onChange();
    await sleep(120);
  }

  private async enemyAct(foe: Unit) {
    const w = equippedWeapon(foe);
    if (!w) return;
    const targets = this.players();
    if (!targets.length) return;

    const moves = (foe.ai === 'boss' || foe.ai === 'guard')
      ? new Map([[key(foe.x, foe.y), { cost: 0, px: -1, py: -1 }]]) as MoveMap
      : movementRange(this.map, this.units, foe);

    // choose best (dest, target) pair
    let best: { x: number; y: number; tgt: Unit; score: number } | null = null;
    for (const mk of moves.keys()) {
      const [mx, my] = mk.split(',').map(Number);
      const occ = this.unitAt(mx, my);
      if (occ && occ.uid !== foe.uid) continue; // can't end a move on an occupied tile
      const zone = attackFrom(this.map, mx, my, w.minRange, w.maxRange);
      for (const tgt of targets) {
        if (!zone.has(key(tgt.x, tgt.y))) continue;
        const ox = foe.x, oy = foe.y;
        foe.x = mx; foe.y = my;
        const fc = calcForecast(foe, tgt, this.map);
        foe.x = ox; foe.y = oy;
        const t = terrainAt(this.map, tgt.x, tgt.y);
        const wouldKill = fc.atk.dmg * (fc.atk.double ? 2 : 1) >= tgt.hp;
        const score =
          fc.atk.dmg * 3 + (fc.atk.double ? fc.atk.dmg : 0) + fc.atk.hit * 0.12 +
          (wouldKill ? 120 : 0) + (tgt.essential ? 12 : 0) - t.def * 2 + Math.random() * 6;
        if (!best || score > best.score) best = { x: mx, y: my, tgt, score };
      }
    }

    if (best) {
      const path = pathTo(moves, best.x, best.y);
      this.busy = true;
      await this.slideUnit(foe, path);
      this.busy = false;
      const plan = planCombat(foe, best.tgt, this.map);
      await this.runCombat(plan);
    } else if (foe.ai === 'patrol') {
      // Patrol: walk back-and-forth between the current position and a
      // remembered anchor tile. If a player is close (within 3 tiles) the
      // patrol drops and the next phase treats the foe as 'attack' — the
      // patrol was a way of presenting an interesting idle behaviour, not
      // a defensive one.
      const anchor = foe.patrolAnchor ?? { x: foe.x, y: foe.y };
      const target = foe.patrolDir === -1 ? anchor : { x: anchor.x, y: anchor.y + 2 };
      const dir = foe.patrolDir ?? 1;
      const targetTile = dir === 1
        ? { x: anchor.x, y: anchor.y + 2 }
        : anchor;
      let bestTile: [number, number] | null = null;
      let bestD = manh(foe.x, foe.y, targetTile.x, targetTile.y);
      for (const mk of moves.keys()) {
        const [mx, my] = mk.split(',').map(Number);
        if (this.unitAt(mx, my) && !(mx === foe.x && my === foe.y)) continue;
        const d = manh(mx, my, targetTile.x, targetTile.y);
        if (d < bestD) { bestD = d; bestTile = [mx, my]; }
      }
      if (bestTile) {
        this.busy = true;
        await this.slideUnit(foe, pathTo(moves, bestTile[0], bestTile[1]));
        this.busy = false;
        // arrived: reverse direction
        if (bestD === 0) foe.patrolDir = (foe.patrolDir ?? 1) * -1;
      }
      // promote to attacker if a player is close — patrol AI only really
      // matters when no one is in range; once someone approaches, the foe
      // switches to active pursuit on the next phase
      let closestPlayer = Infinity;
      for (const t of targets) {
        const d = manh(foe.x, foe.y, t.x, t.y);
        if (d < closestPlayer) closestPlayer = d;
      }
      if (closestPlayer <= 3) foe.ai = 'attack';
      void target;
    } else if (foe.ai === 'attack') {
      // advance toward nearest player
      let nearest = targets[0];
      for (const t of targets) if (manh(t.x, t.y, foe.x, foe.y) < manh(nearest.x, nearest.y, foe.x, foe.y)) nearest = t;
      let bestTile: [number, number] | null = null;
      let bestD = manh(foe.x, foe.y, nearest.x, nearest.y);
      for (const mk of moves.keys()) {
        const [mx, my] = mk.split(',').map(Number);
        if (this.unitAt(mx, my) && !(mx === foe.x && my === foe.y)) continue;
        const d = manh(mx, my, nearest.x, nearest.y);
        if (d < bestD) { bestD = d; bestTile = [mx, my]; }
      }
      if (bestTile) {
        this.busy = true;
        await this.slideUnit(foe, pathTo(moves, bestTile[0], bestTile[1]));
        this.busy = false;
      }
    }
  }

  // ── danger zone display ───────────────────────────────────────────────────

  toggleDanger(u: Unit) {
    if (this.dangerForUid === u.uid && this.danger) {
      this.danger = null; this.dangerForUid = -1; return;
    }
    const w = equippedWeapon(u);
    if (!w) { this.danger = null; return; }
    // A dormant unit holds its post, so showing its full movement threat would
    // lie to the player — it can only reach what it can already strike.
    const holds = !u.active || u.ai === 'boss' || u.ai === 'guard';
    const moves = holds
      ? new Map([[key(u.x, u.y), { cost: 0, px: -1, py: -1 }]]) as MoveMap
      : movementRange(this.map, this.units, u);
    this.danger = threatZone(this.map, moves, w.minRange, w.maxRange);
    this.dangerForUid = u.uid;
  }

  // ── persistence ───────────────────────────────────────────────────────────

  snapshot(): BattleSnapshot {
    return {
      chapterId: this.chapter.id,
      turn: this.turn,
      phase: 'player',
      units: this.units.map(u => ({
        defId: u.defId, faction: u.faction, x: u.x, y: u.y, hp: u.hp, exp: u.exp,
        level: u.level, stats: { ...u.stats }, items: u.items.map(i => ({ ...i })),
        moved: u.moved, dead: u.dead, ai: u.ai, quoteShown: u.quoteShown,
        group: u.group, aggro: u.aggro, active: u.active, raged: u.raged,
        patrolAnchor: u.patrolAnchor, patrolDir: u.patrolDir,
      })),
    };
  }

  private restore(snap: BattleSnapshot) {
    this.turn = snap.turn;
    for (const su of snap.units) {
      const u = mkUnit(su.defId, su.faction, su.x, su.y, {
        ai: su.ai as Unit['ai'], level: su.level,
        group: su.group, aggro: su.aggro, active: su.active,
      });
      u.hp = su.hp; u.exp = su.exp; u.level = su.level;
      u.stats = { ...su.stats };
      u.items = su.items.filter(i => itemExists(i.id)).map(i => ({ ...i }));
      u.moved = su.moved; u.dead = su.dead; u.quoteShown = su.quoteShown;
      u.raged = su.raged;
      // preserve patrol state — without this, a patrolling enemy would
      // re-anchor on resume and the player could exploit the reset.
      if (su.patrolAnchor) u.patrolAnchor = { ...su.patrolAnchor };
      if (su.patrolDir !== undefined) u.patrolDir = su.patrolDir;
      this.units.push(u);
    }
    this.mode = 'idle';
  }

  /** Campaign party export after victory. */
  partyExport() {
    return this.players().map(u => ({
      defId: u.defId, level: u.level, exp: u.exp, stats: { ...u.stats },
      items: u.items.map(i => ({ ...i })), hp: u.hp,
    }));
  }
}
