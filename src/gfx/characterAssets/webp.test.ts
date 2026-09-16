// ─── webp pipeline test ─────────────────────────────────────────────────────
//
// Verifies that every authored character's registered battle/map/portrait
// URL points at a real .webp file on disk. The pipeline earlier used .png
// sheets; after Phase 38 we ship .webp to keep the APK small. A typo
// here would silently fall back to the code-authored frames because the
// HTMLImageElement src would 404 — this test catches that regression.

import { describe, it, expect, beforeEach } from 'vitest';
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import {
  getBattleAsset, getMapAsset, getPortraitAsset, _resetRegistry,
} from '../assetLoader';
import {
  registerAllCharacterAssets, _resetCharRegistration,
} from '../characterAssets';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_ROOT = resolve(__dirname, '../../..', 'public');

const AUTHORED_KEYS = [
  'guts', 'griffith', 'casca', 'judeau', 'pippin', 'corkus',
];

describe('WebP asset pipeline', () => {
  beforeEach(() => {
    _resetRegistry();
    _resetCharRegistration();
  });

  it('every registered asset URL ends in .webp', () => {
    registerAllCharacterAssets();
    const urls: string[] = [];
    for (const k of AUTHORED_KEYS) {
      const b = getBattleAsset(k);
      const m = getMapAsset(k);
      const p = getPortraitAsset(k);
      if (b) urls.push(b.url);
      if (m) urls.push(m.url);
      if (p) urls.push(p.url);
    }
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) {
      expect(url).toMatch(/\.webp$/);
    }
  });

  it('every registered URL points to a real file on disk', () => {
    registerAllCharacterAssets();
    const missing: string[] = [];
    for (const k of AUTHORED_KEYS) {
      const a1 = getBattleAsset(k);
      const a2 = getMapAsset(k);
      const a3 = getPortraitAsset(k);
      for (const a of [a1, a2, a3]) {
        if (!a) continue;
        const path = resolve(PUBLIC_ROOT, '.' + a.url);
        if (!existsSync(path)) missing.push(`${k}: ${a.url}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('all webp files are smaller than their png originals', () => {
    registerAllCharacterAssets();
    // Spot-check by reading byte sizes. The originals live in
    // .source-originals/ alongside the project root.
    const originalRoot = resolve(__dirname, '../../..', '.source-originals');
    let checked = 0;
    let totalSaved = 0;
    const missing: string[] = [];
    for (const k of AUTHORED_KEYS) {
      const dirs = [
        { dir: 'sprites/battle', get: getBattleAsset },
        { dir: 'sprites/map',    get: getMapAsset },
        { dir: 'portraits',      get: getPortraitAsset },
      ];
      for (const { dir, get } of dirs) {
        const a = get(k);
        if (!a) {
          missing.push(`no asset for ${k} in ${dir}`);
          continue;
        }
        const webpPath = resolve(PUBLIC_ROOT, '.' + a.url);
        const pngPath  = resolve(originalRoot, dir, k + '.png');
        if (!existsSync(webpPath)) missing.push(`webp missing: ${webpPath}`);
        if (!existsSync(pngPath)) missing.push(`png missing: ${pngPath}`);
        if (!existsSync(webpPath) || !existsSync(pngPath)) continue;
        const wSize = statSync(webpPath).size;
        const pSize = statSync(pngPath).size;
        expect(wSize).toBeLessThan(pSize);
        totalSaved += (pSize - wSize);
        checked += 1;
      }
    }
    if (checked === 0) {
      throw new Error(`No files compared. PUBLIC_ROOT=${PUBLIC_ROOT}, __dirname=${__dirname}, originalRoot=${originalRoot}\nmissing:\n${missing.join('\n')}`);
    }
    // We expect to save ~28 MB across the authored roster — assert
    // that we saved at least 10 MB as a regression guardrail.
    expect(totalSaved).toBeGreaterThan(10 * 1024 * 1024);
  });
});
