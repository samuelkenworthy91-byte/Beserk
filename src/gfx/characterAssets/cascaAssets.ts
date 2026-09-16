// ─────────────────── Casca external assets ───────────────────
//
// TODO: drop in casca.png sheets under public/sprites/battle/,
// public/sprites/map/, public/portraits/ and replace the bodies of
// registerCascaAssets() and preloadCascaAssets(). Until then, the
// renderer falls back to the code-authored PORTRAIT_CASCA and the
// code-authored battle/cast sprites.

export function registerCascaAssets(): void {
  // no-op — sheets not yet authored
}

export async function preloadCascaAssets(): Promise<void> {
  // no-op
}

export function _resetCascaRegistration(): void {
  // no-op
}
