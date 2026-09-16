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
}

export interface UnitSnapshot {
  defId: string; faction: 'player' | 'enemy';
  x: number; y: number; hp: number; exp: number; level: number;
  stats: Stats; items: ItemStack[]; moved: boolean; dead: boolean;
  ai: string; quoteShown?: boolean;
  // encounter pacing state — must survive a suspend/resume
  group?: string; aggro?: number; active?: boolean; raged?: boolean;
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
