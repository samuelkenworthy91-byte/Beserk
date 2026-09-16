import { useEffect, useState } from 'react';
import { EPILOGUE_CARDS, EPILOGUE_CLOSING } from '../data/epilogue';
import { Portrait } from './ui';
import type { CampaignSave } from '../engine/save';

// ─────────────────── end screen ───────────────────
//
// Plays after chapter 14 victory. The user advances through a series
// of farewell cards (one per Hawk), then a final closing line, then
// "Begin a new journey" — which calls onRestart() to reset the
// campaign save back to chapter 1.
//
// The screen intentionally has no UI affordance besides "next" and
// "restart" — it is meant to be cinematic, not tactical.

interface Props {
  campaign: CampaignSave;
  onRestart: () => void;
}

export function EndScreen({ campaign, onRestart }: Props) {
  const [index, setIndex] = useState(0);
  const [closing, setClosing] = useState(false);

  // keyboard: space/enter advance the cards.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        advance();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function advance() {
    if (!closing) {
      if (index < EPILOGUE_CARDS.length - 1) {
        setIndex(index + 1);
      } else {
        setClosing(true);
      }
    }
  }

  const card = EPILOGUE_CARDS[index];
  const speakerPortrait = card.portrait;

  return (
    <div className="end-screen">
      <div className="end-frame">
        {!closing && (
          <>
            <div className="end-frame__tone" data-tone={card.tone} aria-hidden="true" />
            <div className="end-frame__speaker">
              {speakerPortrait ? (
                <Portrait k={speakerPortrait} size={128} />
              ) : (
                <div className="end-frame__speaker--empty" aria-hidden="true">
                  <span>narrated</span>
                </div>
              )}
              <div className="end-frame__name">{card.speaker}</div>
            </div>
            <blockquote className="end-frame__quote">
              {card.text}
            </blockquote>
            <div className="end-frame__hint">
              {index + 1} / {EPILOGUE_CARDS.length} — press <kbd>space</kbd> or click to continue
            </div>
            <button
              className="end-frame__next"
              onClick={advance}
              autoFocus
              aria-label="Next epilogue card"
            >
              Continue
            </button>
          </>
        )}
        {closing && (
          <div className="end-frame__closing">
            <div className="end-frame__closing-line">{EPILOGUE_CLOSING}</div>
            <div className="end-frame__summary">
              <Summary campaign={campaign} />
            </div>
            <button
              className="end-frame__restart"
              onClick={onRestart}
              autoFocus
              aria-label="Begin a new journey"
            >
              Begin a New Journey
            </button>
            <p className="end-frame__restart-hint">
              This will reset the campaign. The Hawk will fly again.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────── summary ───────────────────
//
// A brief run-summary shown on the closing card. We display the
// field-guide unlock state, total turns, fallen list, and the trophy
// count.

function Summary({ campaign }: { campaign: CampaignSave }) {
  return (
    <ul className="end-summary">
      <li>
        <strong>Chapters cleared:</strong> {campaign.unlockedChapters - 1} / 14
      </li>
      <li>
        <strong>Total turns taken:</strong> {campaign.totalTurns}
      </li>
      <li>
        <strong>Trophies earned:</strong> {campaign.bossesDefeated?.length ?? 0}
      </li>
      <li>
        <strong>Bestiary entries:</strong> {campaign.defeated?.length ?? 0}
      </li>
      <li>
        <strong>Fallen:</strong>{' '}
        {campaign.fallen.length > 0
          ? campaign.fallen.join(', ')
          : 'no one'}
      </li>
    </ul>
  );
}
