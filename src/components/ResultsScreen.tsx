import { ChevronsRight, Skull, Swords } from 'lucide-react';
import type { ChapterDef } from '../engine/types';
import type { BattleResult } from './BattleScreen';


// ─── Chapter results card ────────────────────────────────────────────────────

export default function ResultsScreen({ chapter, result, onContinue }: {
  chapter: ChapterDef;
  result: BattleResult;
  onContinue: () => void;
}) {
  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center"
      style={{
        background: 'radial-gradient(ellipse at center, rgba(20,16,30,.90), rgba(4,5,9,.97))',
        paddingTop: 'var(--edge-top)',
      }}>
      <div className="gba-panel anim-sheet w-full relative flex flex-col"
        style={{
          maxWidth: 440, maxHeight: '88vh',
          marginLeft: 'var(--edge-x)', marginRight: 'var(--edge-x)',
          marginBottom: 'var(--edge-bottom)',
        }}>
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0d1120] border-2 border-[#d8b25a] rounded-sm px-3 py-0.5 text-[12px] tracking-[0.3em] text-[#ffd873] whitespace-nowrap">
          VICTORY
        </div>

        <div className="overflow-y-auto px-4 pt-5 pb-3">
          <div className="text-center mb-3">
            <div className="text-[11px] text-[#a8763a] tracking-[0.4em]">{chapter.name.toUpperCase()}</div>
            <div className="text-[19px] font-bold txt3d text-[#e8e4d4]">{chapter.subtitle}</div>
          </div>

          <div className="gba-inset flex mb-3 py-2.5">
            <div className="flex-1 text-center">
              <div className="text-[12px] text-[#8a8a78] leading-none tracking-wider">TURNS</div>
              <div className="text-[22px] font-bold text-[#ffd873] leading-tight">{result.turns}</div>
            </div>
            <div className="w-px bg-[#ffffff14]" />
            <div className="flex-1 text-center">
              <div className="text-[12px] text-[#8a8a78] leading-none tracking-wider">SURVIVORS</div>
              <div className="text-[22px] font-bold leading-tight">{result.party.length}</div>
            </div>
          </div>

          <div className="mb-3 space-y-1">
            {result.party.map(p => (
              <div key={p.defId} className="flex items-center justify-between text-[13px] py-1">
                <span className="flex items-center gap-2">
                  <Swords size={13} className="text-[#7d9dff]" />
                  {p.defId === 'guts' ? 'Guts' : p.defId.charAt(0).toUpperCase() + p.defId.slice(1)}
                </span>
                <span className="text-[12px] text-[#a8a894] tabular-nums">Lv{p.level} · {p.exp}xp</span>
              </div>
            ))}
          </div>

          {result.fallen.length === 0 ? (
            <div className="text-[12px] text-[#8fe07a] flex items-center gap-2">
              <ChevronsRight size={13} /> No one was lost.
            </div>
          ) : (
            <div>
              <div className="text-[12px] text-[#ff9d8a] mb-1">The fallen (permadeath):</div>
              {result.fallen.map((f, i) => (
                <div key={i} className="text-[12px] text-[#c8a0a0] flex items-center gap-2">
                  <Skull size={12} /> {f.charAt(0).toUpperCase() + f.slice(1)}
                </div>
              ))}
            </div>
          )}

          <div className="text-[12px] text-[#6a6a5a] mt-3 text-center">
            Progress saved. Levels, items and losses carry forward.
          </div>
        </div>

        <div className="px-4 pb-4 shrink-0">
          <button className="gba-btn gba-btn-gold w-full text-[15px]" onClick={onContinue}>
            Continue the Chronicle
          </button>
        </div>
      </div>
    </div>
  );
}
