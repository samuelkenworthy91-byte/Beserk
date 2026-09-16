import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronsRight, FastForward } from 'lucide-react';
import type { DialogueScript } from '../engine/types';
import { Portrait } from './ui';
import type { Expression } from '../gfx/portraits';
import { sfx } from '../engine/sfx';
import { cn } from '../utils/cn';

// ─── Dialogue presentation ───────────────────────────────────────────────────
// Large character busts rise out of the lower-left / lower-right of the scene
// and are cropped by the dialogue box, so they read as part of the world rather
// than as two icons parked above a panel. The active speaker is fully lit and
// a touch larger; the other dims and sinks back. Narration clears the stage
// entirely and lets the background carry the moment.
//
// Scripts and typewriter behaviour are untouched.

interface StageSlot { portrait: string; name: string }

export default function DialogueScreen({ script, bg, card, onDone }: {
  script: DialogueScript;
  bg: string;
  card?: { title: string; subtitle: string };
  onDone: () => void;
}) {
  const [showCard, setShowCard] = useState(!!card);
  const [idx, setIdx] = useState(0);
  const [chars, setChars] = useState(0);
  const line = script.lines[idx];
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const full = line?.text ?? '';
  const typing = chars < full.length;

  // ── typewriter (unchanged) ────────────────────────────────────────────────
  useEffect(() => {
    setChars(0);
    if (!line) return;
    timer.current = setInterval(() => {
      setChars(c => {
        if (c >= full.length) {
          if (timer.current) clearInterval(timer.current);
          return c;
        }
        if (c % 3 === 0) sfx.dialog();
        return c + 1;
      });
    }, 16);
    return () => { if (timer.current) clearInterval(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  const advance = useCallback(() => {
    sfx.unlock();
    if (showCard) { setShowCard(false); return; }
    if (typing) { setChars(full.length); return; }
    sfx.confirm();
    if (idx < script.lines.length - 1) setIdx(idx + 1);
    else onDone();
  }, [showCard, typing, full.length, idx, script.lines.length, onDone]);

  // ── who is on stage ───────────────────────────────────────────────────────
  // Track the most recent occupant of each side up to the current line.
  let leftSlot: StageSlot | null = null;
  let rightSlot: StageSlot | null = null;
  for (let i = 0; i <= idx; i++) {
    const l = script.lines[i];
    if (!l.portrait) continue;
    const slot: StageSlot = { portrait: l.portrait, name: l.speaker };
    if (l.side === 'right') rightSlot = slot; else leftSlot = slot;
  }

  const isNarration = !line?.portrait;
  const activeSide: 'left' | 'right' | null = isNarration
    ? null
    : (line?.side === 'right' ? 'right' : 'left');
  const expr: Expression = (line?.expr as Expression) ?? 'neutral';

  // ── bust size: integer multiples of the 96px source keep pixels square ────
  const [bustPx, setBustPx] = useState(192);
  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth, h = window.innerHeight;
      const byW = Math.floor((w * 0.58) / 96);
      const byH = Math.floor((h * 0.42) / 96);
      const mult = Math.max(2, Math.min(4, Math.min(byW, byH)));
      setBustPx(mult * 96);
    };
    calc();
    window.addEventListener('resize', calc);
    window.addEventListener('orientationchange', calc);
    return () => {
      window.removeEventListener('resize', calc);
      window.removeEventListener('orientationchange', calc);
    };
  }, []);

  // ── measure the box so busts tuck behind it by a consistent amount ────────
  const boxRef = useRef<HTMLDivElement>(null);
  const [boxH, setBoxH] = useState(132);
  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBoxH(el.offsetHeight));
    ro.observe(el);
    setBoxH(el.offsetHeight);
    return () => ro.disconnect();
  }, [showCard]);

  // Sink the bust ~18% behind the panel. The art already ends at chest level,
  // so a deeper crop would eat the shoulder detail and leave a floating head.
  const bustBottom = `calc(var(--edge-bottom) + ${Math.max(0, boxH - Math.round(bustPx * 0.18))}px)`;

  const renderBust = (slot: StageSlot | null, side: 'left' | 'right') => {
    if (!slot || isNarration) return null;
    const active = activeSide === side;
    return (
      <div
        className={cn('absolute pointer-events-none', side === 'left' ? 'bust-enter-left' : 'bust-enter-right')}
        key={`${side}-${slot.portrait}`}
        style={{
          bottom: bustBottom,
          [side]: `calc(var(--sa-${side}) - ${Math.round(bustPx * 0.10)}px)`,
          zIndex: active ? 12 : 10,
        } as React.CSSProperties}
      >
        <div
          className="transition-[transform,opacity] duration-200"
          style={{
            transformOrigin: side === 'left' ? 'left bottom' : 'right bottom',
            // inactive sits a little further back and lower, as if half a step
            // behind — no colour filter, the dim is baked into the pixels
            transform: active ? 'scale(1)' : 'scale(0.94) translateY(4px)',
            filter: active
              ? 'drop-shadow(0 7px 16px rgba(0,0,0,.8))'
              : 'drop-shadow(0 4px 12px rgba(0,0,0,.7))',
            opacity: 1,
          }}
        >
          {/* speak-step on take-over, then a slow 2-frame idle sway */}
          <div key={active ? `s${idx}` : 'idle'} className={active ? 'bust-speak' : undefined}>
            <div className={active ? 'bust-breathe' : undefined}>
              <Portrait
                k={slot.portrait}
                size={bustPx}
                flip={side === 'right'}
                expr={active ? expr : 'neutral'}
                dim={!active}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const tabOnRight = activeSide === 'right';

  return (
    <div className="relative w-full h-full overflow-hidden" onPointerDown={advance}
      style={{ touchAction: 'manipulation' }}>
      <img src={bg} alt="" className="absolute inset-0 w-full h-full object-cover pixelated"
        style={{ animation: 'flicker 7s ease-in-out infinite' }} />
      {/* narration lifts the scrim so the scene itself carries the beat */}
      <div className={cn('absolute inset-0 transition-opacity duration-500',
        isNarration
          ? 'bg-gradient-to-b from-[#05060a99] via-[#05060a33] to-[#05060ae6]'
          : 'bg-gradient-to-b from-[#05060acc] via-[#05060a66] to-[#05060af5]')} />
      {/* pool of darkness the busts rise out of */}
      {!isNarration && (
        <div className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{ height: '46%', background: 'linear-gradient(to top, #05060ae0, transparent)' }} />
      )}

      {/* chapter card */}
      {showCard && card && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#050508]">
          <div className="w-24 h-[2px] bg-[#d8b25a] mb-4" style={{ animation: 'slidein-left .5s ease both' }} />
          <div className="text-[12px] tracking-[0.5em] text-[#a8763a] mb-2 uppercase">{card.title}</div>
          <div className="text-2xl sm:text-4xl font-bold tracking-[0.2em] text-[#e8e4d4] txt3d text-center px-4"
            style={{ animation: 'slidein-up .6s ease both' }}>{card.subtitle}</div>
          <div className="w-24 h-[2px] bg-[#d8b25a] mt-4" style={{ animation: 'slidein-right .5s ease both' }} />
          <div className="absolute text-[12px] text-[#7a7a68] tracking-[0.3em] anim-blink"
            style={{ bottom: 'calc(var(--edge-bottom) + 18px)' }}>TAP TO BEGIN</div>
        </div>
      )}

      {/* SKIP */}
      <button
        className="absolute z-30 gba-btn gba-btn-sm gba-btn-ghost"
        style={{
          top: 'var(--edge-top)',
          right: 'calc(var(--edge-x) + var(--sa-right))',
        }}
        onPointerDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); onDone(); }}>
        <FastForward size={14} /> SKIP
      </button>

      {!showCard && (
        <>
          {renderBust(leftSlot, 'left')}
          {renderBust(rightSlot, 'right')}

          {/* dialogue box — spans the lower screen, crops the busts */}
          <div className="absolute z-20 mx-auto inset-x-0"
            style={{
              bottom: 'var(--edge-bottom)',
              maxWidth: 760,
              paddingLeft: 'calc(var(--edge-x) + var(--sa-left))',
              paddingRight: 'calc(var(--edge-x) + var(--sa-right))',
            }}>
            <div ref={boxRef} className="gba-panel relative px-4 pt-5 pb-3.5">
              {/* speaker tab — follows the side that is speaking */}
              <div className={cn('absolute -top-3.5 flex items-center', tabOnRight ? 'right-3' : 'left-3')}>
                {line?.speaker ? (
                  <div className="bg-[#12172a] border-2 border-[#e8d9a8] rounded-sm px-3 py-1
                                  text-[15px] font-bold text-[#ffd873] txt3d leading-none">
                    {line.speaker}
                  </div>
                ) : (
                  <div className="bg-[#12172a] border-2 border-[#6a7080] rounded-sm px-3 py-1
                                  text-[12px] text-[#a8a894] tracking-[0.2em] leading-none">
                    CHRONICLE
                  </div>
                )}
              </div>

              <p className={cn('text-[17px] leading-[1.6] min-h-[76px]',
                isNarration ? 'text-[#d6cfb4] italic' : 'text-[#f2efe2]')}>
                {full.slice(0, chars)}
              </p>

              <div className={cn('absolute bottom-2 right-3 text-[#ffd873]', typing && 'opacity-20')}>
                <ChevronsRight size={18} className={typing ? '' : 'anim-blink'} />
              </div>
            </div>
            <div className="text-center text-[11px] text-[#7a7a68] mt-1.5 tracking-[0.3em]">TAP TO ADVANCE</div>
          </div>
        </>
      )}
    </div>
  );
}
