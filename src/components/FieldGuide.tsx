import { useState } from 'react';
import { BookMarked, Skull, Users, X, ChevronRight } from 'lucide-react';
import type { CampaignSave } from '../engine/save';
import { CHARACTERS } from '../data/characters';
import type { ChapterDef, CharTemplate } from '../engine/types';

// ─── Field Guide: rules + bestiary + trophy cabinet + roster ───────────────
//
// The Field Guide grows with the campaign. The RULES section is static;
// the BESTIARY highlights characters you've killed (those with a
// portrait); the TROPHY CABINET tracks each chapter boss you have
// brought down; the ROSTER shows the Band members currently in the
// campaign save, with their persisted level.

const RULES: [string, string][] = [
  ['Moving', 'Tap a blue ally, then tap a blue tile. After moving, choose Attack / Item / Wait. Cancel returns the unit.'],
  ['Attacking', 'Red tiles = weapon range. Tap an enemy, read the forecast (DMG · HIT · CRT), then confirm. HIT 85+ rarely misses; CRT ×3 damage.'],
  ['Weapon triangle', 'Sword beats Axe beats Lance beats Sword (+15 hit, +1 dmg). Guts’ Greatsword hits like a siege engine but weighs him down — heavy weapons lower avoid and prevent doubling.'],
  ['Terrain', 'Forest: +1 DEF +20 AVO. Fort & Gate: +2 DEF, heal each turn. Draw strong enemies off their forts.'],
  ['Phases', 'All allies act once per Player Phase, then enemies move. Forts mend wounds at the start of each side’s phase.'],
  ['Permadeath', 'If an ally falls, they are gone for good. If Guts falls, the tale ends — retry from the chapter start.'],
  ['Progress', 'Victory saves levels, items and losses for future chapters. Suspend mid-battle from the Menu.'],
  ['XP & Levels', 'Strikes and kills grant XP (+bonus vs higher levels & bosses). 100 XP = level up, stats rise by growth chance.'],
];

type Tab = 'rules' | 'bestiary' | 'trophies' | 'roster';
const TABS: { id: Tab; label: string; icon: typeof BookMarked }[] = [
  { id: 'rules',    label: 'Rules',      icon: BookMarked },
  { id: 'bestiary', label: 'Bestiary',   icon: Skull },
  { id: 'trophies', label: 'Trophies',   icon: Skull },
  { id: 'roster',   label: 'Roster',     icon: Users },
];

export default function FieldGuide({
  campaign, chapters, onClose,
}: {
  campaign: CampaignSave | null;
  chapters: Record<number, ChapterDef>;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>('rules');

  const defeated = campaign?.defeated ?? [];
  const bossesDefeated = campaign?.bossesDefeated ?? [];
  const party = campaign?.party ?? [];

  // Build a list of all characters (bosses first), grayed-out ones first.
  const allCharacters = Object.values(CHARACTERS).sort((a, b) =>
    a.defId.localeCompare(b.defId));

  // Roster uses saved levels; everyone else is template-level.
  const savedLevel: Record<string, number> = {};
  for (const m of party) savedLevel[m.defId] = m.level;

  // Trophies: cross-reference chapter.bossDefId with bossesDefeated.
  const trophyBosses = Object.values(chapters)
    .sort((a, b) => a.id - b.id)
    .map(c => ({
      chapter: c,
      boss: CHARACTERS[c.bossDefId],
      killed: bossesDefeated.includes(c.bossDefId),
    }));

  return (
    <div
      className="absolute inset-0 z-30 flex items-end justify-center bg-[#050508cc]"
      onClick={onClose}
    >
      <div
        className="gba-panel-green anim-sheet w-full flex flex-col"
        style={{
          maxWidth: 460, maxHeight: '80vh',
          marginLeft: 'var(--edge-x)', marginRight: 'var(--edge-x)',
          marginBottom: 'var(--edge-bottom)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between px-3 pt-3 pb-2 shrink-0">
          <span className="text-[14px] font-bold text-[#d4e0a8] tracking-widest">FIELD GUIDE</span>
          <button className="gba-btn gba-btn-icon gba-btn-ghost" aria-label="Close"
            onClick={onClose}><X size={18} /></button>
        </div>

        {/* tabs */}
        <div className="flex gap-1 px-2 pb-2 shrink-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} className={cn(
              'gba-btn flex-1 text-[12px] !justify-center gap-1',
              tab === id ? 'gba-btn-gold' : 'gba-btn-ghost'
            )} onClick={() => setTab(id)}>
              <Icon size={13} />{label}
            </button>
          ))}
        </div>

        {/* body */}
        <div className="overflow-y-auto px-3 pb-3">
          {tab === 'rules' && (
            <div>
              {RULES.map(([h, b], i) => (
                <div key={i} className="mb-3">
                  <div className="text-[13px] font-bold text-[#d4e0a8] mb-0.5">{h}</div>
                  <p className="text-[12.5px] leading-relaxed text-[#e0ecd4cc]">{b}</p>
                </div>
              ))}
            </div>
          )}

          {tab === 'bestiary' && (
            <Bestiary
              characters={allCharacters}
              defeated={defeated}
            />
          )}

          {tab === 'trophies' && (
            <TrophyCabinet trophyBosses={trophyBosses} />
          )}

          {tab === 'roster' && (
            <Roster
              party={party}
              savedLevel={savedLevel}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Bestiary ─────────────────────────────────────────────────────────────

function Bestiary({
  characters, defeated,
}: {
  characters: CharTemplate[];
  defeated: string[];
}) {
  // Partition: known (defeated) vs unknown. Unknown shows as ???.
  const known = characters.filter(c => defeated.includes(c.defId));
  const unknownCount = characters.length - known.length;

  return (
    <div>
      <div className="text-[11px] text-[#7a8a5a] mb-2 tracking-widest">
        {known.length} / {characters.length} entries recorded.
        {unknownCount > 0 && ` ${unknownCount} unknowns remain.`}
      </div>
      {known.length === 0 && (
        <p className="text-[12.5px] text-[#8a9a78] italic">
          No entries yet. The bestiary fills as you fight — kill an enemy,
          and a card lights up here.
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        {known.map(c => (
          <BestiaryCard key={c.defId} c={c} />
        ))}
      </div>
    </div>
  );
}

function BestiaryCard({ c }: { c: CharTemplate }) {
  return (
    <div className="bg-[#1a2418] border border-[#3a4a30] rounded p-2">
      <div className="text-[12.5px] font-bold text-[#e0ecd4]">{c.name}</div>
      <div className="text-[10.5px] text-[#8a9a78]">
        {c.cls} · L{c.level}
      </div>
      {c.desc && (
        <div className="text-[10.5px] mt-1 text-[#aab898] leading-snug line-clamp-3">
          {c.desc}
        </div>
      )}
    </div>
  );
}

// ─── Trophy Cabinet ──────────────────────────────────────────────────────

function TrophyCabinet({
  trophyBosses,
}: {
  trophyBosses: Array<{
    chapter: ChapterDef;
    boss: CharTemplate;
    killed: boolean;
  }>;
}) {
  const killedCount = trophyBosses.filter(t => t.killed).length;

  return (
    <div>
      <div className="text-[11px] text-[#7a8a5a] mb-2 tracking-widest">
        {killedCount} / {trophyBosses.length} chapter bosses defeated.
      </div>
      <div className="flex flex-col gap-2">
        {trophyBosses.map(({ chapter, boss, killed }) => (
          <TrophyCard key={chapter.id}
            chapter={chapter}
            boss={boss}
            killed={killed}
          />
        ))}
      </div>
    </div>
  );
}

function TrophyCard({
  chapter, boss, killed,
}: {
  chapter: ChapterDef;
  boss: CharTemplate;
  killed: boolean;
}) {
  return (
    <div className={cn(
      'border rounded p-2 flex items-center gap-2',
      killed ? 'bg-[#241818] border-[#5a3a3a]' : 'bg-[#1a1a18] border-[#3a3a30]'
    )}>
      <div className={cn(
        'w-9 h-9 flex items-center justify-center rounded font-bold text-[14px] shrink-0',
        killed ? 'bg-[#a04040] text-[#fff8e0]' : 'bg-[#3a3a30] text-[#7a7a68]'
      )}>
        {killed ? '✦' : '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className={cn(
          'text-[12.5px] font-bold',
          killed ? 'text-[#e0c0a0]' : 'text-[#6a6a58]'
        )}>
          Ch {chapter.id} — {boss?.name ?? chapter.bossDefId}
        </div>
        <div className="text-[10.5px] text-[#8a8a78] truncate">
          {chapter.name.replace(/^Chapter \d+ — /, '')}
        </div>
        {killed && boss?.quotes?.death && (
          <div className="text-[10.5px] mt-0.5 text-[#a89a78] italic leading-snug">
            “{boss.quotes.death}”
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Roster ───────────────────────────────────────────────────────────────

function Roster({
  party, savedLevel,
}: {
  party: CampaignSave['party'];
  savedLevel: Record<string, number>;
}) {
  if (party.length === 0) {
    return (
      <p className="text-[12.5px] text-[#8a9a78] italic">
        No members in your party yet — start a campaign and the Hawk
        will march with you from chapter to chapter.
      </p>
    );
  }
  return (
    <div>
      <div className="text-[11px] text-[#7a8a5a] mb-2 tracking-widest">
        {party.length} in the company · {savedLevel ? '' : ''}
      </div>
      <div className="flex flex-col gap-2">
        {party
          .sort((a, b) => b.level - a.level)
          .map(m => {
            const t = CHARACTERS[m.defId];
            if (!t) return null;
            const isFallen = false; // by definition, fallen are removed from party
            return (
              <div key={m.defId}
                className="bg-[#1a2418] border border-[#3a4a30] rounded p-2 flex items-center gap-2">
                <div className="w-9 h-9 flex items-center justify-center rounded font-bold text-[12px] shrink-0 bg-[#3a4a30] text-[#e0ecd4]">
                  L{m.level}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-bold text-[#e0ecd4]">
                    {t.name}
                  </div>
                  <div className="text-[10.5px] text-[#8a9a78] truncate">
                    {t.cls} · {m.exp} XP · {m.items.length} item{m.items.length === 1 ? '' : 's'}
                  </div>
                </div>
                <ChevronRight size={14} className="text-[#5a6a48]" />
                <span className="sr-only">{isFallen ? 'fallen' : 'roster'}</span>
              </div>
            );
          })}
      </div>
    </div>
  );
}

// tiny local helpers to keep imports tidy
function cn(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(' ');
}
