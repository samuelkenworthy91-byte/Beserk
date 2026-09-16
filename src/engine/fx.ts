// ─────────────────── combat fx ───────────────────
//
// Pure helpers for the per-attack and per-kill visual flourishes.
// These are intentionally framework-free (no React, no DOM) so they
// can be tested in isolation and consumed by either canvas or DOM
// renderers.
//
// The swing arc is a parametric path: it begins behind the attacker,
// arcs through the defender, and resolves just past them. The
// `progress` is 0..1 (0 = swing start, 1 = swing resolved).
//
// The kill-animation type is a per-class hint that decides the kind
// of visual: a swordman gets a knockback + flicker; an archer gets a
// dissolve; a God-Hand gets a slow descending shatter; etc.

/** The class hint used to pick swing/arc/kill visuals. */
export type FxKind =
  | 'sword'      // mercenary / vanguard / heavy / sergeant / scout
  | 'dagger'     // scout w/ short blade (lighter swing)
  | 'bow'        // archer / bowman
  | 'spear'      // spearman
  | 'demonic'    // greater / lesser demon
  | 'godhand'    // God-Hand-Eclipse boss
  | 'warlord'    // generic heavy enemy
  | 'arcane';    // griffith / caster — glowing line

export interface SwingArc {
  /** path-key: an SVG-style cubic arc, raw control points */
  startX: number; startY: number;
  cp1X: number; cp1Y: number;
  cp2X: number; cp2Y: number;
  endX: number; endY: number;
  /** stroke color */
  color: string;
  /** stroke width at peak */
  width: number;
}

/** Duration of the swing window, in milliseconds. */
export const SWING_MS = 280;

/** Duration of the kill-fade window. */
export const KILL_FADE_MS = 700;

/** Slow-mo duration on a boss kill (player continues to act during). */
export const BOSS_KILL_SLOWMO_MS = 540;

/**
 * Classify a unit's class string into an FxKind for combat visuals.
 */
export function fxKindFor(classString: string | undefined): FxKind {
  if (!classString) return 'sword';
  const c = classString.toLowerCase();
  // 'god-hand' (hyphen) and 'god hand' (space) are both used by chapter
  // templates (femto uses 'God Hand', void_form uses 'God-Hand-Eclipse').
  if (c.includes('god-hand') || c.includes('god hand')) return 'godhand';
  if (c.includes('greater demon'))       return 'demonic';
  if (c.includes('lesser demon'))        return 'demonic';
  if (c.includes('marshal') || c.includes('warlord') || c.includes('centurion') || c.includes('knight-commander'))
                                      return 'warlord';
  if (c.includes('archer') || c.includes('bowman'))   return 'bow';
  if (c.includes('spear'))                            return 'spear';
  if (c.includes('scout'))                            return 'dagger';
  if (c.includes('commander'))                        return 'arcane';
  // default: any sword-flavored class
  return 'sword';
}

/**
 * The kill-animation style. Bosses get a slow shatter, ranged
 * dissolve, melee knockback, and arcane a shimmer.
 */
export type KillStyle = 'knockback' | 'dissolve' | 'shatter' | 'shimmer';

export function killStyleFor(kind: FxKind): KillStyle {
  switch (kind) {
    case 'godhand': return 'shatter';
    case 'demonic': return 'shatter';
    case 'warlord': return 'knockback';
    case 'bow':     return 'dissolve';
    case 'arcane':  return 'shimmer';
    default:        return 'knockback';
  }
}

/**
 * Pick a stroke color for the swing arc. By FxKind:
 *   sword  → bright steel
 *   dagger → pale silver, thin
 *   bow    → wood-tan
 *   spear  → bone-white
 *   demonic → blood-red, thick
 *   godhand → blinding white, thick
 *   warlord → iron grey
 *   arcane  → violet
 */
export function swingColor(kind: FxKind): string {
  switch (kind) {
    case 'sword':    return '#e6e6e6';
    case 'dagger':   return '#cfd2d8';
    case 'bow':      return '#b08553';
    case 'spear':    return '#e3dccb';
    case 'demonic':  return '#a8201a';
    case 'godhand':  return '#f4f4ff';
    case 'warlord':  return '#9aa2a8';
    case 'arcane':   return '#b88fff';
  }
}

export function swingWidth(kind: FxKind): number {
  switch (kind) {
    case 'dagger':  return 2;
    case 'bow':     return 3;
    case 'godhand': return 5;
    case 'demonic': return 4;
    default:        return 3;
  }
}

/**
 * Compute a swing-arc path between attacker and defender tile centers.
 * The arc rises above the line of attack (cp1 above midpoint by a
 * fixed amount), then dips down toward the defender's side.
 */
export function swingArc(
  ax: number, ay: number, dx: number, dy: number,
  kind: FxKind,
): SwingArc {
  // direction from attacker to defender
  const vx = dx - ax, vy = dy - ay;
  // perpendicular vector (left-hand normal in screen space)
  const px = -vy, py = vx;
  const plen = Math.hypot(px, py) || 1;
  const nx = px / plen, ny = py / plen;
  // arc height varies by kind
  const height =
    kind === 'godhand' ? 0.55 :
    kind === 'demonic' ? 0.45 :
    kind === 'dagger'  ? 0.30 :
                         0.40;
  // start slightly behind attacker
  const sx = ax - vx * 0.18, sy = ay - vy * 0.18;
  // first control: arc up from start
  const cp1x = ax + nx * height + vx * 0.10;
  const cp1y = ay + ny * height + vy * 0.10;
  // second control: arc down to defender
  const cp2x = dx - nx * height + vx * 0.10;
  const cp2y = dy - ny * height + vy * 0.10;
  // end slightly past defender
  const ex = dx + vx * 0.10, ey = dy + vy * 0.10;
  return {
    startX: sx, startY: sy,
    cp1X: cp1x, cp1Y: cp1y,
    cp2X: cp2x, cp2Y: cp2y,
    endX: ex,   endY: ey,
    color: swingColor(kind),
    width: swingWidth(kind),
  };
}

/**
 * Progress at a given `t` ms after the swing started. Returns 0..1.
 * Clamped. Eases in/out so the swing feels weighted rather than
 * linear.
 */
export function swingProgress(t: number): number {
  const k = Math.max(0, Math.min(1, t / SWING_MS));
  // ease-in-out cubic
  return k < 0.5
    ? 4 * k * k * k
    : 1 - Math.pow(-2 * k + 2, 3) / 2;
}

/**
 * Whether the engine is currently inside the boss-kill slow-mo window.
 * Returns a 0..1 progress; renderers should scale dt by (1 - slowmo*0.6).
 */
export function slowMo(nowMs: number, untilMs: number): number {
  if (untilMs <= 0 || nowMs >= untilMs) return 0;
  const k = (untilMs - nowMs) / BOSS_KILL_SLOWMO_MS;
  return Math.max(0, Math.min(1, k));
}
