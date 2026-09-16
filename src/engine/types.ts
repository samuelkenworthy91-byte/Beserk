// ─── Core type definitions for the tactical engine ──────────────────────────
// Everything is data-driven so new chapters / units / dialogue can be dropped
// into src/data without touching engine code.

export type Faction = 'player' | 'enemy';
export type WeaponType = 'sword' | 'lance' | 'axe' | 'bow';
export type AIType = 'attack' | 'guard' | 'boss';
export type WeatherType = 'none' | 'rain';

export interface Stats {
  hp: number; str: number; skl: number; spd: number; lck: number;
  def: number; res: number; mov: number; con: number;
}

export interface Growths {
  hp: number; str: number; skl: number; spd: number; lck: number;
  def: number; res: number;
}

export interface WeaponDef {
  id: string;
  name: string;
  kind: 'weapon';
  wtype: WeaponType;
  might: number;
  hit: number;
  crit: number;
  weight: number;
  minRange: number;
  maxRange: number;
  uses: number;
  desc: string;
  great?: boolean;
}

export interface HealDef {
  id: string;
  name: string;
  kind: 'heal';
  healAmount: number;
  uses: number;
  desc: string;
}

export type ItemDef = WeaponDef | HealDef;

export interface ItemStack { id: string; uses: number }

export interface Quotes {
  battle?: string;   // spoken when first engaged (bosses)
  death?: string;    // spoken on death
  rage?: string;     // spoken when a holding boss is provoked into advancing
}

// ─── Combat traits ───────────────────────────────────────────────────────────
// Small, readable modifiers attached to a character. Kept deliberately few.
//   sunder     — attacks ignore the defender's TERRAIN def/avoid bonuses
//   unflinching— can never be doubled (fast attackers get one strike only)
export type Trait = 'sunder' | 'unflinching';

// ─── Character template (reusable across chapters) ──────────────────────────
export interface CharTemplate {
  defId: string;
  name: string;
  cls: string;               // class label shown in UI
  desc: string;
  level: number;
  stats: Stats;              // includes MAX hp
  growths: Growths;
  items: ItemStack[];
  sprite: string;            // look id — see gfx/mapSprites + gfx/battleArt
  portrait: string;          // PortraitKey from gfx/portraits
  ai: AIType;
  boss?: boolean;
  essential?: boolean;       // death = game over (the lord)
  quotes?: Quotes;
  traits?: Trait[];
}

// ─── Live unit on the field ──────────────────────────────────────────────────
export interface Unit extends CharTemplate {
  uid: number;
  faction: Faction;
  x: number; y: number;
  hp: number;                // current hp
  items: ItemStack[];        // live copies (durability ticks down)
  exp: number;               // 0-99
  moved: boolean;            // greyed out after acting
  dead: boolean;
  quoteShown?: boolean;
  // ── encounter pacing ──
  group?: string;            // squad id; members wake together
  aggro: number;             // tiles of awareness while dormant
  active: boolean;           // false = holding position, ignores the player
  raged?: boolean;           // boss has been provoked out of its post
}

// ─── Dialogue ────────────────────────────────────────────────────────────────
export interface DialogueLine {
  speaker: string;
  portrait?: string;         // PortraitKey; undefined = narration
  side?: 'left' | 'right';
  text: string;
  /** Optional portrait variant for this line. Omitted = neutral. */
  expr?: 'neutral' | 'angry' | 'injured' | 'shocked';
}
export interface DialogueScript { id: string; lines: DialogueLine[] }

// ─── Chapter definition ──────────────────────────────────────────────────────
export interface ChapterUnit {
  def: string;               // CharTemplate.defId
  faction: Faction;
  x: number; y: number;
  ai?: AIType;
  level?: number;            // overrides template level (deterministic stat padding)
  group?: string;            // squad id — the whole squad wakes together
  aggro?: number;            // awareness radius in tiles (default 3)
  active?: boolean;          // true = awake from turn 1
}

export interface ChapterDef {
  id: number;
  name: string;
  subtitle: string;
  objective: string;
  weather: WeatherType;
  map: string[];             // rows of terrain chars (see engine/terrain.ts)
  playerStart: [number, number][];
  units: ChapterUnit[];      // player + enemy placements
  bossDefId: string;         // killing this unit wins the chapter
  intro: DialogueScript;
  outro: DialogueScript;
}

// ─── Foreground combat math ──────────────────────────────────────────────────
export interface SideForecast {
  dmg: number; hit: number; crit: number; double: boolean; weapon: ItemDef | null;
}
export interface Forecast {
  atk: SideForecast;
  def: SideForecast | null;  // null = can't counter
}

export interface CombatRound {
  by: 'atk' | 'def';
  hit: boolean;
  crit: boolean;
  dmg: number;
  killed: boolean;
}

export interface CombatPlan {
  attacker: Unit;
  defender: Unit;
  forecast: Forecast;
  rounds: CombatRound[];
  // sequential hp after each round: [hpA, hpD] pairs applied progressively
  hpSequence: { a: number; d: number }[];
  finalHpA: number;
  finalHpD: number;
  defCountered: boolean;
  weaponBroke: { a: boolean; d: boolean };
  xpA: number;
  killA: boolean;
}
