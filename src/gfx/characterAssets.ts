// ─────────────────── per-character external assets ───────────────────
//
// Each character has a manifest module under `src/gfx/characterAssets/`
// that registers its three sprite sheets (battle / map / portrait)
// with the asset loader. The sheets live under public/ at:
//
//   public/sprites/battle/<key>.png   — 1408×768, 9×2 grid
//   public/sprites/map/<key>.png      — 1408×768, 4×2 grid
//   public/portraits/<key>.png        — 1408×768, 5×2 grid
//
// Cells are sliced at the model's default 1408×768 artboard; the
// renderer letterbox-fits each cell into its legacy canvas size
// (96×96 battle, 22×30 map, 96×96 portrait) before drawing.
//
// This barrel re-exports each per-character manifest plus a single
// `registerAllCharacterAssets()` that wires them all up at boot.
// Adding a new character = drop a new <key>Assets.ts module in the
// subfolder, add it to the imports here. No App.tsx changes needed.

import {
  registerAsset,
  loadImage,
  type BattleAsset, type MapAsset, type PortraitAsset,
} from './assetLoader';

import * as gutsAssets      from './characterAssets/gutsAssets';
import * as griffithAssets  from './characterAssets/griffithAssets';
import * as cascaAssets     from './characterAssets/cascaAssets';
import * as judeauAssets    from './characterAssets/judeauAssets';
import * as pippinAssets    from './characterAssets/pippinAssets';
import * as corkusAssets    from './characterAssets/corkusAssets';
import * as rickertAssets   from './characterAssets/rickertAssets';

import * as bazusoAssets    from './characterAssets/bazusoAssets';
import * as femtoAssets     from './characterAssets/femtoAssets';
import * as voidAssets      from './characterAssets/void_formAssets';

import * as mercAssets      from './characterAssets/mercAssets';
import * as soldierAssets   from './characterAssets/soldierAssets';
import * as fighterAssets   from './characterAssets/fighterAssets';
import * as archerAssets    from './characterAssets/archerAssets';

import * as cRebelAssets      from './characterAssets/c_rebelAssets';
import * as cVeteranAssets    from './characterAssets/c_veteranAssets';
import * as cKnightAssets     from './characterAssets/c_knightAssets';
import * as cPincersAssets    from './characterAssets/c_pincersAssets';
import * as cCenturionAssets  from './characterAssets/c_centurionAssets';
import * as cMarshalAssets    from './characterAssets/c_marshalAssets';
import * as cWardenAssets     from './characterAssets/c_wardenAssets';

import * as aLesserAssets   from './characterAssets/a_lesserAssets';
import * as aVortexAssets   from './characterAssets/a_vortexAssets';
import * as aSwarmAssets    from './characterAssets/a_swarmAssets';

// Each module exports `register<X>Assets()`, `preload<X>Assets()`,
// and `_reset<X>Registration()`. The aggregator uses a strict name
// resolver so a `_reset<X>Registration` (which ends in "Registration",
// not "Assets") never gets picked up as the register hook.
//
// An entry that hasn't been migrated yet exports no-op functions
// that do nothing on call.

interface ResolvedModule {
  register: () => void;
  preload: () => Promise<void>;
  reset: () => void;
}

function pickFn(
  m: Record<string, unknown>,
  prefix: string,
): (...args: unknown[]) => unknown {
  // Match exact "prefix + Name + Assets" or "prefix + Name + Registration"
  // shapes so we never confuse _reset<X>Registration with the
  // register hook (both names end in the character name suffix).
  for (const key of Object.keys(m)) {
    if (key.startsWith(prefix) && key !== '_resetCharRegistration') {
      return m[key] as (...args: unknown[]) => unknown;
    }
  }
  return () => undefined;
}

function resolve(m: Record<string, unknown>, name: string): ResolvedModule {
  // Find register<X>Assets, preload<X>Assets, _reset<X>Registration by exact prefix.
  const regFn = pickFn(m, 'register' + name);
  const preFn = pickFn(m, 'preload' + name);
  const rstFn = pickFn(m, '_reset' + name + 'Registration');
  return {
    register: () => { try { (regFn as () => void)(); } catch (err) { console.warn('[characterAssets] register failed', err); } },
    preload:  async () => { try { await (preFn as () => Promise<void>)(); } catch (err) { console.warn('[characterAssets] preload failed', err); } },
    reset:    () => { try { (rstFn as () => void)(); } catch {} },
  };
}

const MODULES: ResolvedModule[] = [
  resolve(gutsAssets,      'Guts'),
  resolve(griffithAssets,  'Griffith'),
  resolve(cascaAssets,     'Casca'),
  resolve(judeauAssets,    'Judeau'),
  resolve(pippinAssets,    'Pippin'),
  resolve(corkusAssets,    'Corkus'),
  resolve(rickertAssets,   'Rickert'),
  resolve(bazusoAssets,    'Bazuso'),
  resolve(femtoAssets,     'Femto'),
  resolve(voidAssets,      'VoidForm'),
  resolve(mercAssets,      'Merc'),
  resolve(soldierAssets,   'Soldier'),
  resolve(fighterAssets,   'Fighter'),
  resolve(archerAssets,    'Archer'),
  resolve(cRebelAssets,    'CRebel'),
  resolve(cVeteranAssets,  'CVeteran'),
  resolve(cKnightAssets,   'CKnight'),
  resolve(cPincersAssets,  'CPincers'),
  resolve(cCenturionAssets,'CCenturion'),
  resolve(cMarshalAssets,  'CMarshal'),
  resolve(cWardenAssets,   'CWarden'),
  resolve(aLesserAssets,   'ALesser'),
  resolve(aVortexAssets,   'AVortex'),
  resolve(aSwarmAssets,    'ASwarm'),
];

let registered = false;

/** Test-only: reset the registration flag. */
export function _resetCharRegistration() { registered = false; }

/**
 * Register every migrated character's assets. Idempotent at the
 * aggregator level — only fires each module's register() at most
 * once per call sequence. If `_resetCharRegistration()` was called,
 * every module's register() will run again on the next call; each
 * module is responsible for its own internal idempotency, but
 * `registerAsset` is itself a fast map.set, so the common case is
 * just a few comparisons.
 *
 * New characters should `import` and add themselves to the MODULES
 * list above. App.tsx does not need to be touched.
 */
export function registerAllCharacterAssets(): void {
  if (registered) return;
  registered = true;
  for (const m of MODULES) {
    try { m.reset?.(); } catch {} // let per-module flags re-arm
    try { m.register?.(); } catch (err) {
      console.warn('[characterAssets] register failed', err);
    }
  }
}

/**
 * Preload all character sheets that have at least one URL registered.
 * Resolves once every sheet has decoded. Failures are logged but do
 * not throw — the game falls back to code-authored frames for any
 * character whose external sheet fails to load.
 */
export async function preloadAllCharacterAssets(): Promise<void> {
  registerAllCharacterAssets();
  await Promise.all(
    MODULES.map(async m => {
      if (!m.preload) return;
      try { await m.preload(); } catch (err) {
        console.warn('[characterAssets] preload failed', err);
      }
    }),
  );
}

// Re-exported for tests so they can poke individual registrations.
export {
  registerAsset,
  loadImage,
  type BattleAsset, type MapAsset, type PortraitAsset,
};
