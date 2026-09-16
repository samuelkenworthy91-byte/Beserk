import { useState } from 'react';
import TitleScreen from './components/TitleScreen';
import DialogueScreen from './components/DialogueScreen';
import BattleScreen, { type BattleResult } from './components/BattleScreen';
import ResultsScreen from './components/ResultsScreen';
import { CHAPTER_1 } from './data/chapter1';
import { CHAPTER_2 } from './data/chapter2';
import { CHAPTER_3 } from './data/chapter3';
import type { ChapterDef } from './engine/types';
import {
  loadCampaign, saveCampaign, clearCampaign, newCampaign,
  loadSuspend, saveSuspend, clearSuspend,
  type BattleSnapshot, type CampaignSave,
} from './engine/save';
import { sfx } from './engine/sfx';
import campBg from './assets/camp_bg.jpg';
import titleBg from './assets/title_bg.jpg';

// Chapter registry — new campaign content registers here.
const CHAPTERS: Record<number, ChapterDef> = {
  [CHAPTER_1.id]: CHAPTER_1,
  [CHAPTER_2.id]: CHAPTER_2,
  [CHAPTER_3.id]: CHAPTER_3,
};
export { CHAPTERS };

export default function App() {
  const [campaign, setCampaign] = useState<CampaignSave | null>(() => loadCampaign());
  const [screen, setScreen] = useState<
    | { s: 'title' }
    | { s: 'dialogue'; chapter: ChapterDef; which: 'intro' | 'outro' }
    | { s: 'battle'; chapter: ChapterDef; c: CampaignSave | null; resume?: BattleSnapshot }
    | { s: 'results'; chapter: ChapterDef; result: BattleResult }
  >({ s: 'title' });

  const suspend = loadSuspend();

  const startIntro = (ch: ChapterDef) => {
    setScreen({ s: 'dialogue', chapter: ch, which: 'intro' });
  };

  const newGame = () => {
    sfx.unlock(); sfx.confirm();
    clearSuspend();
    const c = newCampaign();
    saveCampaign(c);
    setCampaign(c);
    setScreen({ s: 'dialogue', chapter: CHAPTER_1, which: 'intro' });
  };

  const resumeBattle = () => {
    sfx.unlock();
    const s = loadSuspend();
    if (!s) return;
    setCampaign(s.campaign);
    setScreen({ s: 'battle', chapter: CHAPTERS[s.battle.chapterId] ?? CHAPTER_1, c: s.campaign, resume: s.battle });
  };

  const selectChapter = (id: number) => {
    const ch = CHAPTERS[id];
    if (!ch) return;
    sfx.unlock();
    clearSuspend();
    if (!campaign) { const c = newCampaign(); saveCampaign(c); setCampaign(c); }
    startIntro(ch);
  };

  const dialogueDone = (chapter: ChapterDef, which: 'intro' | 'outro') => {
    if (which === 'intro') {
      setScreen({ s: 'battle', chapter, c: campaign ?? newCampaign() });
    } else {
      setScreen({ s: 'title' });
    }
  };

  const onVictory = (chapter: ChapterDef, result: BattleResult) => {
    // merge party into campaign save
    const base: CampaignSave = campaign ?? newCampaign();
    const party = [...base.party];
    for (const p of result.party) {
      const i = party.findIndex(x => x.defId === p.defId);
      if (i >= 0) party[i] = p; else party.push(p);
    }
    const fallen = Array.from(new Set([...base.fallen, ...result.fallen]));
    const updated: CampaignSave = {
      unlockedChapters: Math.max(base.unlockedChapters, Math.min(14, chapter.id + 1)),
      // the dead never return, so purge them from the roster too
      party: party.filter(p => !fallen.includes(p.defId)),
      fallen, totalTurns: base.totalTurns + result.turns,
    };
    saveCampaign(updated);
    setCampaign(updated);
    clearSuspend();
    setScreen({ s: 'results', chapter, result });
  };

  const [battleNonce, setBattleNonce] = useState(0);
  const startBattleFresh = (chapter: ChapterDef) => {
    setBattleNonce(n => n + 1);
    setScreen({ s: 'battle', chapter, c: campaign ?? newCampaign() });
  };

  return (
    <div className="w-full h-full bg-[#07080d]">
      {screen.s === 'title' && (
        <TitleScreen
          campaign={campaign}
          suspend={suspend}
          chapters={CHAPTERS}
          onNewGame={newGame}
          onResume={resumeBattle}
          onSelectChapter={selectChapter}
        />
      )}
      {screen.s === 'dialogue' && (
        <DialogueScreen
          script={screen.which === 'intro' ? screen.chapter.intro : screen.chapter.outro}
          bg={screen.which === 'intro' ? campBg : titleBg}
          card={screen.which === 'intro' ? { title: screen.chapter.name, subtitle: screen.chapter.subtitle } : undefined}
          onDone={() => dialogueDone(screen.chapter, screen.which)}
        />
      )}
      {screen.s === 'battle' && (
        <BattleScreen
          key={`${screen.chapter.id}-${screen.resume ? 'r' : 'n'}-${battleNonce}`}
          chapter={screen.chapter}
          campaign={screen.c}
          resume={screen.resume}
          onVictory={(result) => onVictory(screen.chapter, result)}
          onRetry={() => startBattleFresh(screen.chapter)}
          onTitle={() => setScreen({ s: 'title' })}
          onSuspend={(snap) => {
            saveSuspend({ campaign: campaign ?? newCampaign(), battle: snap, savedAt: Date.now() });
            sfx.heal();
          }}
        />
      )}
      {screen.s === 'results' && (
        <ResultsScreen
          chapter={screen.chapter}
          result={screen.result}
          onContinue={() => setScreen({ s: 'dialogue', chapter: screen.chapter, which: 'outro' })}
        />
      )}
    </div>
  );
}

// expose for future chapters/mods
export type { BattleSnapshot };
export { clearCampaign };
