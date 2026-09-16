import type { Stats, ItemStack } from './types';

// ─── Persistence: campaign save (party progress) + battle suspend ────────────

const CAMPAIGN_KEY = 'bsaga_campaign_v1';
const SUSPEND_KEY = 'bsaga_suspend_v1';

export interface SavedChar {
  defId: string;
  level: number;
  exp: number;
  stats: Stats;     // current max stats (level-ups persisted)
  items: ItemStack[];
  hp: number;
}

export interface CampaignSave {
  unlockedChapters: number;
  party: SavedChar[];
  fallen: string[];  // defIds lost to permadeath
  totalTurns: number;
  // Bestiary tracking: defIds the player has either killed or recruited.
  // The Field Guide surfaces these so the manual grows as you play.
  // Old saves that omit this field default to an empty array on load.
  defeated?: string[];
  // The set of boss defIds the player has brought down. The Trophy
  // Cabinet surfaces one card per boss. Players who completed the
  // campaign before this field existed will see their historical
  // clears only after they finish their next chapter.
  bossesDefeated?: string[];
}

export interface UnitSnapshot {
  defId: string; faction: 'player' | 'enemy';
  x: number; y: number; hp: number; exp: number; level: number;
  stats: Stats; items: ItemStack[]; moved: boolean; dead: boolean;
  ai: string; quoteShown?: boolean;
  // encounter pacing state — must survive a suspend/resume
  group?: string; aggro?: number; active?: boolean; raged?: boolean;
  // patrol AI state — anchor + direction so a patrolling unit resumes its
  // walk rather than snapping back to a fresh anchor
  patrolAnchor?: { x: number; y: number };
  patrolDir?: number;
}

export interface BattleSnapshot {
  chapterId: number;
  turn: number;
  phase: 'player' | 'enemy';
  units: UnitSnapshot[];
}

export interface SuspendSave {
  campaign: CampaignSave;
  battle: BattleSnapshot;
  savedAt: number;
}

function read<T>(k: string): T | null {
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch { return null; }
}
function write(k: string, v: unknown) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage full/blocked */ }
}

export const loadCampaign = (): CampaignSave | null => read<CampaignSave>(CAMPAIGN_KEY);
export const saveCampaign = (c: CampaignSave) => write(CAMPAIGN_KEY, c);
export const clearCampaign = () => { try { localStorage.removeItem(CAMPAIGN_KEY); } catch { /* noop */ } };

export const loadSuspend = (): SuspendSave | null => read<SuspendSave>(SUSPEND_KEY);
export const saveSuspend = (s: SuspendSave) => write(SUSPEND_KEY, s);
export const clearSuspend = () => { try { localStorage.removeItem(SUSPEND_KEY); } catch { /* noop */ } };

export function newCampaign(): CampaignSave {
  return { unlockedChapters: 1, party: [], fallen: [], totalTurns: 0 };
}

/**
 * Build the post-victory campaign save. Pure function so it's easy to
 * unit-test without standing up the whole React tree.
 *
 * @param base        the previous save (or null on the very first win)
 * @param chapterId   the chapter just won (1–14)
 * @param bossDefId   the chapter's boss defId (added to bossesDefeated)
 * @param result      the BattleResult from the engine: surviving party +
 *                    defIds that fell this round
 * @param defeated    every defId the player killed this round — passed
 *                    straight into the Bestiary list (already includes
 *                    the boss once the engine fires victory)
 */
/**
 * Build the post-victory campaign save. Pure function so the wiring is
 * easy to unit-test. The caller still owns `saveCampaign(...)`.
 *
 * @param base        previous save or null
 * @param chapterId   chapter just won (1–14)
 * @param bossDefId   chapter boss defId (added to bossesDefeated)
 * @param result      BattleResult from engine: surviving party +
 *                    defIds that fell this round
 * @param defeated    every defId the player killed this round
 * @param turns       turns taken this chapter — added to totalTurns
 */
export function applyVictory(
  base: CampaignSave | null,
  chapterId: number,
  bossDefId: string,
  result: { party: SavedChar[]; fallen: string[] },
  defeated: string[],
  turns: number,
): CampaignSave {
  const b = base ?? newCampaign();
  const party = [...b.party];
  for (const p of result.party) {
    const i = party.findIndex(x => x.defId === p.defId);
    if (i >= 0) party[i] = p; else party.push(p);
  }
  const fallen = Array.from(new Set([...b.fallen, ...result.fallen]));
  const best = Array.from(new Set([...(b.defeated ?? []), ...defeated]));
  const trophies = Array.from(new Set([...(b.bossesDefeated ?? []), bossDefId]));
  return {
    unlockedChapters: Math.max(b.unlockedChapters, Math.min(14, chapterId + 1)),
    // the dead never return — purge them from the roster too
    party: party.filter(p => !fallen.includes(p.defId)),
    fallen,
    totalTurns: b.totalTurns + turns,
    defeated: best,
    bossesDefeated: trophies,
  };
}
