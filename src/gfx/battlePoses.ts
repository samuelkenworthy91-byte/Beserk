// ─── Frame vocabulary + swing metadata ───────────────────────────────────────
// The authored sprites carry all the posing now. What survives here is the
// shared frame naming and the small amount of numeric data the cutscene needs
// to line its weapon-trail arc up with the drawn blade.

export type WKind = 'great' | 'sword' | 'axe' | 'lance' | 'bow' | 'none';
export type FrameName =
  | 'idle0' | 'idle1' | 'ready' | 'wind' | 'swing' | 'impact' | 'recover' | 'hurt' | 'dead';

/**
 * Where the weapon points during the attack, per weapon class.
 * Angles are radians (0 = forward, -PI/2 = straight up) and are read off the
 * authored art, so the trail sweeps along the blade rather than past it.
 */
interface SwingArc { from: number; to: number; pivotY: number; radius: number }

const ARCS: Record<WKind, SwingArc> = {
  // Huge overhead chop: hauled behind the head, driven down past the knee.
  // radius 60 matches the redrawn blade — the trail has to sweep the whole
  // length of the iron, not a stub in the middle of it.
  great: { from: -2.55, to: 0.62, pivotY: -32, radius: 60 },
  axe: { from: -2.30, to: 0.45, pivotY: -28, radius: 40 },
  sword: { from: -1.95, to: 0.30, pivotY: -28, radius: 34 },
  // a thrust barely rotates — a short, flat sweep reads as a stab
  lance: { from: -0.18, to: 0.10, pivotY: -26, radius: 42 },
  bow: { from: 0, to: 0, pivotY: -26, radius: 0 },
  none: { from: -1.2, to: 0.4, pivotY: -26, radius: 22 },
};

export function swingArc(kind: WKind): SwingArc {
  return ARCS[kind] ?? ARCS.sword;
}

/** Back-compat shim for the cutscene's trail code. */
export function frameMeta(kind: WKind, frame: FrameName): { grip: [number, number]; ang: number } {
  const a = swingArc(kind);
  const ang = frame === 'wind' ? a.from : frame === 'impact' ? a.to : (a.from + a.to) / 2;
  return { grip: [48, 90 + a.pivotY], ang };
}

export function weaponKindOf(wtype: string | undefined, great: boolean | undefined): WKind {
  if (!wtype) return 'none';
  if (wtype === 'sword') return great ? 'great' : 'sword';
  if (wtype === 'axe') return 'axe';
  if (wtype === 'lance') return 'lance';
  if (wtype === 'bow') return 'bow';
  return 'none';
}
