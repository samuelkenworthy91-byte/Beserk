import { useState } from 'react';
import {
  BookMarked, BookOpen, ChevronRight, Feather, Lock, Play, Swords, X,
} from 'lucide-react';
import type { CampaignSave, SuspendSave } from '../engine/save';
import { cn } from '../utils/cn';
import titleBg from '../assets/title_bg.jpg';

// ─── Title screen: New Game / Resume / Chapter Select / Field Guide ──────────

import type { ChapterDef } from '../engine/types';

const CHAPTER_SPINE: Record<number, string> = {
  1: 'The Grey Knight',
  2: 'The White Hawk',
  3: 'Sword of the Hawks',
  4: 'First Command',
  5: 'One Hundred Men',
  6: 'Band of the Hawk',
  7: 'The Fortress',
  8: 'The Golden Age',
  9: 'Bonfire of Dreams',
  10: 'Departure',
  11: 'Fall of the Hawk',
  12: 'Return',
  13: 'The Rescue',
  14: 'Eclipse',
};

export default function TitleScreen({ campaign, suspend, chapters, onNewGame, onResume, onSelectChapter }: {
  campaign: CampaignSave | null;
  suspend: SuspendSave | null;
  chapters: Record<number, ChapterDef>;
  onNewGame: () => void;
  onResume: () => void;
  onSelectChapter: (id: number) => void;
}) {
  const [showChapters, setShowChapters] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const started = !!campaign && campaign.party.length > 0;
  const unlocked = campaign?.unlockedChapters ?? 1;

  return (
    <div className="relative w-full h-full overflow-hidden vignette">
      <img src={titleBg} alt="" className="absolute inset-0 w-full h-full object-cover pixelated"
        style={{ animation: 'flicker 9s ease-in-out infinite' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#05060a99] via-[#05060a44] to-[#05060af5]" />

      {/* title block */}
      <div className="absolute top-[8%] inset-x-0 text-center px-4">
        <div className="text-[10px] tracking-[0.55em] text-[#a8763a] mb-2 flex items-center justify-center gap-2">
          <Feather size={11} className="text-[#a8763a]" /> A GOLDEN AGE CHRONICLE <Feather size={11} className="text-[#a8763a] -scale-x-100" />
        </div>
        <h1 className="font-bold text-[#e8e4d4] leading-none"
          style={{ fontSize: 'clamp(30px, 9vw, 64px)', letterSpacing: '0.14em', textShadow: '0 3px 0 #05060a, 0 0 34px rgba(216,178,90,.25)' }}>
          BLACK SWORD
        </h1>
        <div className="mt-2 inline-block bg-[#0d1120cc] border-y-2 border-[#d8b25a77] px-4 py-1 text-[10px] tracking-[0.3em] text-[#c8b48a]">
          TACTICS OF THE ONE-HUNDRED-YEAR WAR
        </div>
      </div>

      {/* menu — thumb-reachable, comfortably tappable, clear of screen edges */}
      <div className="absolute inset-x-0 flex flex-col items-center gap-2.5"
        style={{
          bottom: 'calc(var(--edge-bottom) + 8px)',
          paddingLeft: 'calc(var(--edge-x) + var(--sa-left))',
          paddingRight: 'calc(var(--edge-x) + var(--sa-right))',
        }}>
        <div className="w-full flex flex-col gap-2.5" style={{ maxWidth: 320 }}>
          {suspend && (
            <button className="gba-btn gba-btn-gold w-full !justify-between text-[15px]" onClick={onResume}>
              <span className="flex items-center gap-2"><Play size={16} /> Resume Battle</span>
              <span className="text-[11px] opacity-75">Turn {suspend.battle.turn}</span>
            </button>
          )}
          <button className="gba-btn w-full !justify-start text-[15px]" onClick={onNewGame}>
            <Swords size={16} /> {started ? 'Restart Chronicle' : 'Begin the Chronicle'}
          </button>
          <div className="flex gap-2.5">
            <button className="gba-btn flex-1 !px-2 text-[13px]" onClick={() => setShowChapters(true)}>
              <BookMarked size={15} /> Chapters
            </button>
            <button className="gba-btn flex-1 !px-2 text-[13px]" onClick={() => setShowGuide(true)}>
              <BookOpen size={15} /> Guide
            </button>
          </div>
          <div className="text-[11px] text-[#6a6a5a] text-center leading-relaxed">
            An unofficial fan work inspired by Berserk & GBA tactics classics.
            {campaign && <div className="mt-0.5 text-[#7a7a68]">Save found · {campaign.fallen.length} fallen remembered</div>}
          </div>
        </div>
      </div>

      {/* chapter select */}
      {showChapters && (
        <div className="absolute inset-0 z-30 flex items-end justify-center bg-[#050508cc]"
          onClick={() => setShowChapters(false)}>
          <div className="gba-panel anim-sheet w-full flex flex-col"
            style={{
              maxWidth: 460, maxHeight: '78vh',
              marginLeft: 'var(--edge-x)', marginRight: 'var(--edge-x)',
              marginBottom: 'var(--edge-bottom)',
            }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-3 pt-3 pb-2 shrink-0">
              <span className="text-[14px] font-bold text-[#ffd873] tracking-widest">THE CHRONICLE</span>
              <button className="gba-btn gba-btn-icon gba-btn-ghost" aria-label="Close"
                onClick={() => setShowChapters(false)}><X size={18} /></button>
            </div>
            <div className="overflow-y-auto px-3 pb-3 flex flex-col gap-2">
              {Array.from({ length: 14 }, (_, i) => i + 1).map(id => {
                const exists = !!chapters[id];
                const locked = id > unlocked;
                return (
                  <button key={id} disabled={locked || !exists}
                    className={cn('w-full gba-btn !justify-between text-[14px]',
                      exists && !locked && 'gba-btn-gold')}
                    onClick={() => { if (exists && !locked) { onSelectChapter(id); setShowChapters(false); } }}>
                    <span className="flex items-center gap-2">
                      {locked ? <Lock size={14} /> : <ChevronRight size={14} />}
                      Chapter {id}
                    </span>
                    <span className="text-[11px] opacity-80 truncate max-w-[45%]">
                      {exists ? CHAPTER_SPINE[id] ?? '???' : locked ? '???' : 'sealed'}
                    </span>
                  </button>
                );
              })}
              <p className="text-[11px] text-[#6a6a5a] leading-relaxed">
                This build contains Chapter 1. Chapters 2–14 slot into this same engine.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* guide */}
      {showGuide && (
        <div className="absolute inset-0 z-30 flex items-end justify-center bg-[#050508cc]"
          onClick={() => setShowGuide(false)}>
          <div className="gba-panel-green anim-sheet w-full flex flex-col"
            style={{
              maxWidth: 460, maxHeight: '80vh',
              marginLeft: 'var(--edge-x)', marginRight: 'var(--edge-x)',
              marginBottom: 'var(--edge-bottom)',
            }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-3 pt-3 pb-2 shrink-0">
              <span className="text-[14px] font-bold text-[#d4e0a8] tracking-widest">FIELD GUIDE</span>
              <button className="gba-btn gba-btn-icon gba-btn-ghost" aria-label="Close"
                onClick={() => setShowGuide(false)}><X size={18} /></button>
            </div>
            <div className="overflow-y-auto px-3 pb-3">
            {[
              ['Moving', 'Tap a blue ally, then tap a blue tile. After moving, choose Attack / Item / Wait. Cancel returns the unit.'],
              ['Attacking', 'Red tiles = weapon range. Tap an enemy, read the forecast (DMG · HIT · CRT), then confirm. HIT 85+ rarely misses; CRT ×3 damage.'],
              ['Weapon triangle', 'Sword beats Axe beats Lance beats Sword (+15 hit, +1 dmg). Guts’ Greatsword hits like a siege engine but weighs him down — heavy weapons lower avoid and prevent doubling.'],
              ['Terrain', 'Forest: +1 DEF +20 AVO. Fort & Gate: +2 DEF, heal each turn. Draw strong enemies off their forts.'],
              ['Phases', 'All allies act once per Player Phase, then enemies move. Forts mend wounds at the start of each side’s phase.'],
              ['Permadeath', 'If an ally falls, they are gone for good. If Guts falls, the tale ends — retry from the chapter start.'],
              ['Progress', 'Victory saves levels, items and losses for future chapters. Suspend mid-battle from the Menu.'],
              ['XP & Levels', 'Strikes and kills grant XP (+bonus vs higher levels & bosses). 100 XP = level up, stats rise by growth chance.'],
            ].map(([h, b], i) => (
              <div key={i} className="mb-3">
                <div className="text-[13px] font-bold text-[#d4e0a8] mb-0.5">{h}</div>
                <p className="text-[12.5px] leading-relaxed text-[#e0ecd4cc]">{b}</p>
              </div>
            ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
