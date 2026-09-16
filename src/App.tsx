import { useState } from 'react';
import TitleScreen from './components/TitleScreen';
import DialogueScreen from './components/DialogueScreen';
import BattleScreen, { type BattleResult } from './components/BattleScreen';
import ResultsScreen from './components/ResultsScreen';
import { CHAPTER_1 } from './data/chapter1';
import { CHAPTER_2 } from './data/chapter2';
import { CHAPTER_3 } from './data/chapter3';
import { CHAPTER_4 } from './data/chapter4';
import { CHAPTER_5 } from './data/chapter5';
import { CHAPTER_6 } from './data/chapter6';
import { CHAPTER_7 } from './data/chapter7';
import { CHAPTER_8 } from './data/chapter8';
import { CHAPTER_9 } from './data/chapter9';
import { CHAPTER_10 } from './data/chapter10';
import { CHAPTER_11 } from './data/chapter11';
import { CHAPTER_12 } from './data/chapter12';
import { CHAPTER_13 } from './data/chapter13';
import { CHAPTER_14 } from './data/chapter14';
import type { ChapterDef } from './engine/types';
import {
  loadCampaign, saveCampaign, clearCampaign, newCampaign,
  loadSuspend, saveSuspend, clearSuspend,
  applyVictory,
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
  [CHAPTER_4.id]: CHAPTER_4,
  [CHAPTER_5.id]: CHAPTER_5,
  [CHAPTER_6.id]: CHAPTER_6,
  [CHAPTER_7.id]: CHAPTER_7,
  [CHAPTER_8.id]: CHAPTER_8,
  [CHAPTER_9.id]: CHAPTER_9,
  [CHAPTER_10.id]: CHAPTER_10,
  [CHAPTER_11.id]: CHAPTER_11,
  [CHAPTER_12.id]: CHAPTER_12,
  [CHAPTER_13.id]: CHAPTER_13,
  [CHAPTER_14.id]: CHAPTER_14,
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
    // The pure applyVictory helper does the merge, the trophy recording,
    // and the unlock chain. We persist and refresh state from its return.
    // result.fallen holds defIds of every enemy that fell; the chapter
    // boss is among them (the engine fires `victory` when the boss dies).
    const updated = applyVictory(
      campaign,
      chapter.id,
      chapter.bossDefId,
      { party: result.party, fallen: result.fallen },
      result.fallen,
      result.turns,
    );
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
