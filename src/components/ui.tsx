import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  BookOpen, Crosshair, Heart, Swords, X,
  Zap, Skull, Shield, Ghost, FlaskConical, TrendingUp, ChevronDown,
} from 'lucide-react';
import type { Forecast, Unit } from '../engine/types';
import { paintPortrait, PORTRAIT_SIZE, type Expression } from '../gfx/portraits';
import { equippedWeapon, effectiveSpd } from '../engine/combat';
import { getItem, isWeapon } from '../data/weapons';
import { cn } from '../utils/cn';

// ─── Portrait canvas ─────────────────────────────────────────────────────────

export function Portrait({ k, size, flip, dim, expr, className }: {
  k?: string; size: number; flip?: boolean; dim?: boolean;
  expr?: Expression;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    // dimming is baked into the pixels, not applied as a CSS filter, so the
    // inactive speaker stays readable instead of collapsing into mud
    if (ref.current) paintPortrait(ref.current, k, size, flip, expr ?? 'neutral', dim);
  }, [k, size, flip, expr, dim]);
  return (
    <canvas ref={ref} width={PORTRAIT_SIZE} height={PORTRAIT_SIZE}
      className={cn('pixelated', className)}
      style={{ width: size, height: size }} />
  );
}

// ─── HP bar ──────────────────────────────────────────────────────────────────

export function HpBar({ hp, max, slim, className }: {
  hp: number; max: number; slim?: boolean; className?: string;
}) {
  const pct = Math.max(0, Math.min(1, hp / max));
  return (
    <div className={cn('hpbar', slim && 'slim', pct <= 0.25 ? 'low' : pct <= 0.55 ? 'mid' : '', className)}>
      <div style={{ width: `${pct * 100}%` }} />
    </div>
  );
}

function WTypeIcon({ id, size = 13 }: { id: string; size?: number }) {
  const it = getItem(id);
  if (!isWeapon(it)) return <FlaskConical size={size} />;
  if (it.wtype === 'bow') return <Crosshair size={size} />;
  if (it.wtype === 'lance') return <Zap size={size} className="rotate-45" />;
  if (it.wtype === 'axe') return <Shield size={size} />;
  return <Swords size={size} />;
}

// ─── Unit card ───────────────────────────────────────────────────────────────
// Collapsed by default: portrait, name, HP. Stats expand on tap so the map
// keeps its space until the player actually asks for detail.

export function UnitCard({ unit, playerPhase }: { unit: Unit; playerPhase: boolean }) {
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [unit.uid]);
  const w = equippedWeapon(unit);
  const isEnemy = unit.faction === 'enemy';
  const pct = unit.hp / unit.stats.hp;

  return (
    // width is fluid: on a narrow portrait screen this shares its row with the
    // End Turn button, so a fixed width would push out past the safe area
    <div className={cn(isEnemy ? 'gba-panel-red' : 'gba-panel', 'anim-pop pointer-events-auto select-none w-full')}
      style={{ maxWidth: 360 }}>
      {/* header row doubles as the expand control — a large, obvious target */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 p-2 text-left"
        style={{ minHeight: 'var(--tap)' }}
      >
        <Portrait k={unit.portrait} size={46} flip={isEnemy} className="shrink-0 rounded-sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={cn('text-[16px] font-bold txt3d truncate', unit.boss && 'text-[#ffd873]')}>
              {unit.name}
            </span>
            <span className="text-[12px] text-[#b8b8a4] shrink-0">Lv{unit.level}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <HpBar hp={unit.hp} max={unit.stats.hp} className="flex-1" />
            <span className={cn('text-[14px] font-bold tabular-nums shrink-0',
              pct <= 0.25 ? 'text-[#ef7258]' : pct <= 0.55 ? 'text-[#f0d264]' : 'text-[#8fe07a]')}>
              {unit.hp}
              <span className="text-[11px] text-[#9a9a88]">/{unit.stats.hp}</span>
            </span>
          </div>
        </div>
        <ChevronDown size={18}
          className={cn('shrink-0 text-[#a8a894] transition-transform', open && 'rotate-180')} />
      </button>

      {/* collapsed summary: class + current weapon only */}
      {!open && (
        <div className="flex items-center gap-2 px-2.5 pb-2 text-[12px] text-[#b8b8a4]">
          <span>{unit.cls}</span>
          {w && (
            <>
              <span className="text-[#5a6070]">|</span>
              <span className="flex items-center gap-1.5 text-[#ffe8a8]">
                <WTypeIcon id={w.id} size={12} />{w.name}
              </span>
            </>
          )}
          {!playerPhase && <span className="ml-auto text-[11px] text-[#8a8a78]">enemy phase</span>}
        </div>
      )}

      {open && (
        <div className="px-2.5 pb-2.5 space-y-2">
          <div className="gba-inset grid grid-cols-4 gap-y-1.5 py-2 px-1">
            {([
              ['STR', unit.stats.str], ['SKL', unit.stats.skl],
              ['SPD', unit.stats.spd], ['LCK', unit.stats.lck],
              ['DEF', unit.stats.def], ['RES', unit.stats.res],
              ['MOV', unit.stats.mov], ['CON', unit.stats.con],
            ] as const).map(([l, v]) => (
              <div key={l} className="text-center">
                <div className="text-[10px] text-[#8a8a78] leading-none">{l}</div>
                <div className="text-[15px] font-bold leading-tight">{v}</div>
              </div>
            ))}
          </div>
          <div className="space-y-1">
            {unit.items.map((it, i) => {
              const d = getItem(it.id);
              const active = w && it.id === w.id;
              return (
                <div key={i} className={cn(
                  'flex items-center justify-between text-[13px] px-2 py-1.5 rounded-sm',
                  active ? 'bg-[#d8b25a26] text-[#ffe8a8]' : 'text-[#b8b8a4]')}>
                  <span className="flex items-center gap-2"><WTypeIcon id={it.id} />{d.name}</span>
                  <span className="tabular-nums text-[12px]">
                    {isWeapon(d) ? `${it.uses}/${d.uses}` : `×${it.uses}`}
                  </span>
                </div>
              );
            })}
            {unit.items.length === 0 && (
              <div className="text-[12px] text-[#8a8a78] px-2">No weapons — defenceless!</div>
            )}
          </div>
          <p className="text-[11px] leading-snug text-[#a8a894]">{unit.desc}</p>
        </div>
      )}
    </div>
  );
}

// ─── Combat forecast ─────────────────────────────────────────────────────────
// Built around one question: "will this go well?". The projected HP change is
// the largest element; hit/crit sit beneath as plain large numerals.

function OutcomeSide({ name, hp, max, proj, tone }: {
  name: string; hp: number; max: number; proj: number; tone: 'ally' | 'foe';
}) {
  const lost = hp - proj;
  return (
    <div className="flex-1 min-w-0 text-center">
      <div className={cn('text-[13px] font-bold truncate txt3d',
        tone === 'ally' ? 'text-[#9db4ff]' : 'text-[#ff9d8a]')}>{name}</div>
      <div className="flex items-baseline justify-center gap-1 mt-0.5">
        <span className="text-[26px] font-bold leading-none tabular-nums">{proj}</span>
        <span className="text-[12px] text-[#9a9a88]">/{max}</span>
      </div>
      <div className={cn('text-[13px] font-bold leading-none mt-0.5',
        lost > 0 ? 'text-[#ef7258]' : 'text-[#7a8070]')}>
        {lost > 0 ? `−${lost}` : '—'}
      </div>
      <HpBar hp={proj} max={max} slim className="mt-1.5" />
    </div>
  );
}

function BigStat({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'warn' | 'crit' }) {
  return (
    <div className="flex-1 text-center">
      <div className="text-[10px] text-[#8a8a78] leading-none">{label}</div>
      <div className={cn('text-[19px] font-bold leading-tight tabular-nums',
        tone === 'warn' ? 'text-[#ef7258]' : tone === 'crit' ? 'text-[#ffd873]' : 'text-[#e8e4d4]')}>
        {value}
      </div>
    </div>
  );
}

export function ForecastPanel({ a, d, fc, terrain, onAttack, onBack }: {
  a: Unit; d: Unit; fc: Forecast; aName?: string; dName?: string;
  /** defender's terrain, used only to explain Sunder */
  terrain?: { name: string; def: number; avo: number };
  onAttack: () => void; onBack: () => void;
}) {
  const projA = Math.max(0, a.hp - (fc.def ? fc.def.dmg * (fc.def.double ? 2 : 1) : 0));
  const projD = Math.max(0, d.hp - fc.atk.dmg * (fc.atk.double ? 2 : 1));
  const kills = projD <= 0;
  const risky = projA <= 0;

  // surface the two traits that change how a fight reads
  const sundering = !!a.traits?.includes('sunder') && !!terrain && (terrain.def > 0 || terrain.avo > 0);
  const unflinching = !!d.traits?.includes('unflinching');

  return (
    <div className="gba-panel anim-pop p-2.5 pointer-events-auto" style={{ width: 'min(94vw, 380px)' }}>
      {/* projected result — the headline */}
      <div className="flex items-start gap-2">
        <OutcomeSide name={a.name} hp={a.hp} max={a.stats.hp} proj={projA} tone="ally" />
        <div className="flex flex-col items-center pt-3 px-1">
          <Swords size={16} className="text-[#d8b25a]" />
        </div>
        <OutcomeSide name={d.name} hp={d.hp} max={d.stats.hp} proj={projD} tone="foe" />
      </div>

      {(kills || risky) && (
        <div className={cn('mt-2 text-center text-[13px] font-bold py-1.5 rounded-sm',
          risky ? 'bg-[#a83a3233] text-[#ff9d8a]' : 'bg-[#4a943833] text-[#8fe07a]')}>
          {risky ? `⚠ ${a.name.toUpperCase()} MAY FALL` : '☠ LETHAL — enemy defeated'}
        </div>
      )}

      {(sundering || unflinching) && (
        <div className="mt-2 flex flex-col gap-1">
          {sundering && (
            <div className="text-[12px] text-[#ffd873] bg-[#d8b25a1f] rounded-sm px-2 py-1">
              <b>SUNDER</b> — {terrain!.name} cover ignored (+{terrain!.def} Def, +{terrain!.avo} Avo)
            </div>
          )}
          {unflinching && (
            <div className="text-[12px] text-[#ff9d8a] bg-[#a83a321f] rounded-sm px-2 py-1">
              <b>UNFLINCHING</b> — cannot be doubled
            </div>
          )}
        </div>
      )}

      {/* your numbers, then theirs — flat rows, no nested frames */}
      <div className="gba-inset mt-2 px-1 py-1.5">
        <div className="flex items-center">
          <span className="w-12 shrink-0 text-[11px] text-[#9db4ff] font-bold pl-1">YOU</span>
          <BigStat label="DMG" value={fc.atk.weapon ? `${fc.atk.dmg}${fc.atk.double ? '×2' : ''}` : '—'} tone={fc.atk.double ? 'crit' : undefined} />
          <BigStat label="HIT" value={fc.atk.weapon ? `${fc.atk.hit}` : '—'} tone={fc.atk.hit < 60 ? 'warn' : undefined} />
          <BigStat label="CRIT" value={fc.atk.weapon ? `${fc.atk.crit}` : '—'} tone={fc.atk.crit > 15 ? 'crit' : undefined} />
        </div>
        <div className="h-px bg-[#ffffff14] my-1.5" />
        <div className="flex items-center">
          <span className="w-12 shrink-0 text-[11px] text-[#ff9d8a] font-bold pl-1">FOE</span>
          {fc.def ? (
            <>
              <BigStat label="DMG" value={`${fc.def.dmg}${fc.def.double ? '×2' : ''}`} tone={fc.def.double ? 'warn' : undefined} />
              <BigStat label="HIT" value={`${fc.def.hit}`} tone={fc.def.hit > 50 ? 'warn' : undefined} />
              <BigStat label="CRIT" value={`${fc.def.crit}`} tone={fc.def.crit > 0 ? 'warn' : undefined} />
            </>
          ) : (
            <div className="flex-1 text-center text-[13px] text-[#8fe07a] font-bold">Cannot counter</div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2.5">
        <button className="gba-btn gba-btn-sm flex-1" onClick={onBack}>Back</button>
        <button className="gba-btn gba-btn-gold flex-[2] text-[15px]" onClick={onAttack}>
          <Swords size={15} /> ATTACK
        </button>
      </div>
      <div className="text-center text-[10px] text-[#7a7a68] mt-1.5">
        AS {effectiveSpd(a)} vs {effectiveSpd(d)} · their DEF {d.stats.def}
      </div>
    </div>
  );
}

// ─── Action menu ─────────────────────────────────────────────────────────────

export interface MenuEntry {
  label: string; icon: ReactNode; onClick: () => void; disabled?: boolean; danger?: boolean;
  primary?: boolean;
}

export function ActionMenu({ entries }: { entries: MenuEntry[]; right?: boolean }) {
  return (
    <div className="gba-panel p-1.5 flex flex-col gap-1.5 anim-pop" style={{ width: 168 }}>
      {entries.map((e, i) => (
        <button key={i} disabled={e.disabled} onClick={e.onClick}
          className={cn('gba-btn !justify-start w-full',
            e.primary && 'gba-btn-gold', e.danger && 'gba-btn-red')}>
          {e.icon}<span>{e.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Terrain chip ────────────────────────────────────────────────────────────

export function TerrainChipView({ name, def, avo, heal }: {
  name: string; def: number; avo: number; heal: number;
}) {
  const none = def === 0 && avo === 0 && heal === 0;
  return (
    <div className="gba-panel px-2.5 py-1.5 pointer-events-auto flex items-center gap-2">
      <span className="text-[13px] font-bold">{name}</span>
      {!none && (
        <span className="flex items-center gap-1.5 text-[12px] text-[#b8b8a4]">
          {def > 0 && <span className="flex items-center gap-0.5"><Shield size={11} />{def}</span>}
          {avo > 0 && <span className="flex items-center gap-0.5"><Zap size={11} />{avo}</span>}
          {heal > 0 && <span className="flex items-center gap-0.5 text-[#8fe07a]"><Heart size={11} />{heal}%</span>}
        </span>
      )}
    </div>
  );
}

// ─── Event modals ────────────────────────────────────────────────────────────

import type { EngineEvent } from '../engine/battle';

/** Bottom sheet shell — thumb-reachable, safe-area aware. */
function Sheet({ children, tone, onClose }: {
  children: ReactNode; tone: 'blue' | 'red' | 'green'; onClose: () => void;
}) {
  const cls = tone === 'red' ? 'gba-panel-red' : tone === 'green' ? 'gba-panel-green' : 'gba-panel';
  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center bg-black/55" onClick={onClose}>
      <div
        className={cn(cls, 'anim-sheet w-full')}
        style={{
          maxWidth: 460,
          marginLeft: 'var(--edge-x)', marginRight: 'var(--edge-x)',
          marginBottom: 'var(--edge-bottom)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function EventModal({ evt, onClose }: { evt: EngineEvent; onClose: () => void }) {
  if (evt.type === 'hint') {
    return (
      <Sheet tone="green" onClose={onClose}>
        <div className="p-3">
          <div className="flex items-center gap-2 text-[#d4e0a8] text-[13px] font-bold mb-2">
            <BookOpen size={15} /> FIELD GUIDE
          </div>
          <p className="text-[14px] leading-relaxed text-[#e6f0dc]">{evt.text}</p>
          <button className="gba-btn w-full mt-3" onClick={onClose}>Understood</button>
        </div>
      </Sheet>
    );
  }
  if (evt.type === 'quote') {
    return (
      <Sheet tone="red" onClose={onClose}>
        <div className="p-3">
          <div className="flex gap-3 items-start">
            <Portrait k={evt.unit.portrait} size={64} flip className="shrink-0 rounded-sm anim-bob" />
            <div className="flex-1 min-w-0">
              <div className="text-[#ffb0a0] text-[14px] font-bold mb-1 txt3d">{evt.unit.name}</div>
              <p className="text-[14px] leading-relaxed">{evt.text}</p>
            </div>
          </div>
          <button className="gba-btn gba-btn-red w-full mt-3" onClick={onClose}>Face him</button>
        </div>
      </Sheet>
    );
  }
  if (evt.type === 'death') {
    const u = evt.unit;
    const enemy = u.faction === 'enemy';
    return (
      <Sheet tone={enemy ? 'blue' : 'red'} onClose={onClose}>
        <div className="p-3 text-center">
          <div className="flex justify-center mb-1.5">
            {enemy ? <Ghost size={22} className="text-[#9db4ff]" /> : <Skull size={22} className="text-[#ff8a7a]" />}
          </div>
          <div className="text-[15px] font-bold txt3d mb-1.5">
            {enemy ? `${u.name || u.cls} has been slain` : `${u.name} has fallen...`}
          </div>
          {u.quotes?.death && <p className="text-[13px] italic text-[#c8c0b0]">“{u.quotes.death}”</p>}
          {!enemy && !u.essential &&
            <p className="text-[12px] text-[#a89090] mt-1.5">The dead do not return.</p>}
          <button className={cn('gba-btn w-full mt-3', !enemy && 'gba-btn-red')} onClick={onClose}>
            {enemy ? 'Onward' : 'Grieve, then march'}
          </button>
        </div>
      </Sheet>
    );
  }
  if (evt.type === 'broke') {
    return (
      <div className="absolute inset-x-0 z-40 flex justify-center pointer-events-none"
        style={{ bottom: 'calc(var(--edge-bottom) + 96px)' }}>
        <div className="gba-panel-red px-3 py-2.5 anim-pop text-[13px] pointer-events-auto flex items-center gap-2"
          onClick={onClose}>
          <X size={14} /> {evt.unit.name}’s {evt.itemName} broke!
        </div>
      </div>
    );
  }
  if (evt.type === 'levelup') {
    const u = evt.unit;
    return (
      <Sheet tone="blue" onClose={onClose}>
        <div className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={17} className="text-[#ffd873]" />
            <span className="text-[15px] font-bold text-[#ffd873] txt3d">LEVEL UP</span>
          </div>
          <div className="flex items-center gap-3 mb-2.5">
            <Portrait k={u.portrait} size={52} className="rounded-sm" />
            <div>
              <div className="text-[15px] font-bold">{u.name}</div>
              <div className="text-[13px] text-[#a8a894]">
                Lv{u.level - 1} → <b className="text-[#ffd873]">{u.level}</b>
              </div>
            </div>
          </div>
          {evt.gains.length === 0 ? (
            <p className="text-[13px] text-[#a8a894]">No stat rose. Fate is a miser.</p>
          ) : (
            <div className="gba-inset grid grid-cols-3 gap-y-2 py-2">
              {evt.gains.map((g, i) => (
                <div key={i} className="text-center">
                  <div className="text-[11px] text-[#a8a894] leading-none">{g.label}</div>
                  <div className="text-[17px] font-bold text-[#8fe07a] leading-tight">+1</div>
                </div>
              ))}
            </div>
          )}
          <button className="gba-btn w-full mt-3" onClick={onClose}>Good</button>
        </div>
      </Sheet>
    );
  }
  return null;
}

// ─── Phase banner ────────────────────────────────────────────────────────────

export function PhaseBanner({ text, sub, tone }: { text: string; sub: string; tone: 'blue' | 'red' }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
      <div className={cn('w-full px-6 py-3.5 text-center border-y-2',
        tone === 'blue'
          ? 'bg-gradient-to-r from-transparent via-[#1d2947f2] to-transparent border-[#7d9dff]'
          : 'bg-gradient-to-r from-transparent via-[#47201df2] to-transparent border-[#ff9d8a]')}
        style={{ animation: 'phasebanner 1.15s ease-out both' }}>
        <div className={cn('text-[26px] font-bold tracking-[0.2em] txt3d',
          tone === 'blue' ? 'text-[#b9ccff]' : 'text-[#ffb9a8]')}>{text}</div>
        <div className="text-[12px] text-[#c8c0b0] tracking-wide mt-0.5">{sub}</div>
      </div>
    </div>
  );
}

// ─── Game over ───────────────────────────────────────────────────────────────

export function GameOverOverlay({ onRetry, onTitle }: { onRetry: () => void; onTitle: () => void }) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#050508f5] px-6"
      style={{ paddingBottom: 'var(--edge-bottom)', paddingTop: 'var(--edge-top)' }}>
      <Ghost size={34} className="text-[#5a5a6a] mb-3" />
      <div className="text-[34px] font-bold tracking-[0.2em] text-[#a83a32] txt3d mb-3">YOU DIED</div>
      <p className="text-[14px] text-[#a8a894] max-w-xs text-center leading-relaxed mb-1">
        “Not... here. I still... have to—”
      </p>
      <p className="text-[12px] text-[#6a6a5a] max-w-xs text-center leading-relaxed mb-6">
        Guts has fallen. Rewind fate.
      </p>
      <div className="flex flex-col gap-2.5 w-full max-w-[280px]">
        <button className="gba-btn gba-btn-gold w-full text-[15px]" onClick={onRetry}>
          <Heart size={15} /> Retry Chapter
        </button>
        <button className="gba-btn w-full" onClick={onTitle}>Title</button>
      </div>
    </div>
  );
}

export { FlaskConical };
