import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Hourglass, Menu as MenuIcon, Pause, Save, Swords, Undo2,
  FlaskConical, Home, X, Target, Flag,
} from 'lucide-react';
import type { ChapterDef } from '../engine/types';
import { BattleEngine, type EngineEvent } from '../engine/battle';
import type { BattleSnapshot, CampaignSave, SavedChar } from '../engine/save';
import { terrainAt, mapSize } from '../engine/terrain';
import { drawMap, TS } from '../gfx/mapTiles';
import { drawMapUnit } from '../gfx/mapSprites';
import { pathTo, key } from '../engine/path';
import { sfx } from '../engine/sfx';
import { swingArc, swingProgress, slowMo, killStyleFor, SWING_MS, BOSS_KILL_SLOWMO_MS } from '../engine/fx';
import { cn } from '../utils/cn';
import BattleCutscene from './BattleCutscene';
import {
  UnitCard, TerrainChipView, ForecastPanel, ActionMenu, EventModal,
  PhaseBanner, GameOverOverlay, type MenuEntry,
} from './ui';

export interface BattleResult {
  turns: number;
  fallen: string[];
  party: SavedChar[];
}

export default function BattleScreen({ chapter, campaign, resume, onVictory, onRetry, onTitle, onSuspend }: {
  chapter: ChapterDef;
  campaign: CampaignSave | null;
  resume?: BattleSnapshot;
  onVictory: (r: BattleResult) => void;
  onRetry: () => void;
  onTitle: () => void;
  onSuspend: (snap: BattleSnapshot) => void;
}) {
  const [engine] = useState(() => new BattleEngine(chapter, campaign, resume));
  const [, setV] = useState(0);
  const [evt, setEvt] = useState<EngineEvent | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [suspended, setSuspended] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sizeRef = useRef({ scale: 1, ox: 0, oy: 0 });
  const victorySent = useRef(false);

  useEffect(() => { engine.onChange = () => setV(v => v + 1); }, [engine]);
  useEffect(() => {
    sfx.unlock();
    return () => { sfx.stopBossHum(); sfx.stopRain(); };
  }, []);

  // ambient weather — start the rain loop when a chapter declares
  // weather === 'rain'. Stop it on unmount or chapter change.
  useEffect(() => {
    if (chapter.weather === 'rain') sfx.startRain();
    else                            sfx.stopRain();
    return () => { sfx.stopRain(); };
  }, [chapter]);

  const lostRef = useRef(false);

  // side-effect events fire instantly; modal events stage for dismissal
  const processSideEffect = (head: EngineEvent) => {
    if (head.type === 'gameover') {
      lostRef.current = true;
      sfx.gameover();
      sfx.stopBossHum();
      setGameOver(true);
    } else if (head.type === 'rage') {
      // Boss enrage: fade in the menacing hum and an extra thunder
      // clap. The hum persists until victory / gameover / chapter end.
      sfx.thunder();
      sfx.startBossHum();
    } else if (head.type === 'victory') {
      if (!victorySent.current && !lostRef.current) {
        victorySent.current = true;
        sfx.victory();
        sfx.stopBossHum();
        setTimeout(() => {
          onVictory({
            turns: engine.turn,
            fallen: [...engine.fallen],
            party: engine.partyExport(),
          });
        }, 550);
      }
    }
  };

  // event queue → modal / side effects
  useEffect(() => {
    if (evt) return;
    if (engine.events.length) {
      const [head, ...rest] = engine.events;
      engine.events = rest;
      if (head.type === 'victory' || head.type === 'gameover') processSideEffect(head);
      else setEvt(head);
    }
  });

  const closeEvt = () => {
    if (!evt) return;
    if (evt.type === 'quote') engine.quoteDismissed();
    setEvt(null);
    engine.onChange();
  };

  // ── canvas render loop ────────────────────────────────────────────────────
  const { w: COLS, h: ROWS } = useMemo(() => mapSize(chapter.map), [chapter]);
  const LW = COLS * TS, LH = ROWS * TS;

  useEffect(() => {
    const cv = canvasRef.current!;
    cv.width = LW; cv.height = LH;
    const ctx = cv.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    let raf = 0; let t = 0;
    let lightningAt = performance.now() + 4000 + Math.random() * 6000;

    const resize = () => {
      // Measure the real content box of the padded map container so the board
      // uses every pixel the HUD isn't occupying — including on devices where
      // the safe-area insets are non-zero.
      const box = cv.parentElement as HTMLElement | null;
      let cw: number, ch: number;
      if (box) {
        const cs = getComputedStyle(box);
        cw = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        ch = box.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      } else {
        const wrap = wrapRef.current!;
        cw = wrap.clientWidth; ch = wrap.clientHeight;
      }
      cw = Math.max(40, cw - 4);
      ch = Math.max(40, ch - 4);
      // 32px tiles make the logical map 448×288, so the scale MUST be allowed
      // below 1 or the board would overflow a portrait phone. Snap to half
      // steps when upscaling to keep the pixel grid crisp.
      const raw = Math.min(cw / LW, ch / LH);
      const scale = raw >= 1 ? Math.min(4, Math.floor(raw * 2) / 2) : Math.max(0.3, raw);
      cv.style.width = `${Math.floor(LW * scale)}px`;
      cv.style.height = `${Math.floor(LH * scale)}px`;
      sizeRef.current = { scale, ox: (cw - LW * scale) / 2, oy: 0 };
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrapRef.current!);
    if (cv.parentElement) ro.observe(cv.parentElement);

    const draw = () => {
      t++;
      ctx.imageSmoothingEnabled = false;
      drawMap(ctx, chapter.map, t);

      // selection overlays
      const pulse = 0.34 + Math.sin(t / 14) * 0.06;
      const sel = engine.sel;
      if (engine.danger) {
        ctx.fillStyle = 'rgba(190,50,60,0.20)';
        for (const k of engine.danger) {
          const [x, y] = k.split(',').map(Number);
          ctx.fillRect(x * TS, y * TS, TS, TS);
        }
      }
      if (sel && (engine.mode === 'selected' || engine.mode === 'menu' || engine.mode === 'target')) {
        for (const k of sel.moves.keys()) {
          const [x, y] = k.split(',').map(Number);
          const occ = engine.unitAt(x, y);
          if (occ && occ.uid !== sel.unit.uid) continue; // pass-through tiles aren't destinations
          ctx.fillStyle = `rgba(74,134,255,${pulse})`;
          ctx.fillRect(x * TS + 2, y * TS + 2, TS - 4, TS - 4);
          ctx.strokeStyle = 'rgba(160,200,255,0.7)';
          ctx.strokeRect(x * TS + 2.5, y * TS + 2.5, TS - 5, TS - 5);
        }
        ctx.fillStyle = `rgba(255,84,72,${pulse * 0.8})`;
        for (const k of sel.attackTiles) {
          if (sel.moves.has(k)) continue;
          const [x, y] = k.split(',').map(Number);
          ctx.fillRect(x * TS + 2, y * TS + 2, TS - 4, TS - 4);
        }
      }
      // path preview
      if (sel && engine.mode === 'selected') {
        const c = engine.cursor;
        if (sel.moves.has(key(c.x, c.y)) && !(c.x === sel.unit.x && c.y === sel.unit.y)) {
          const path = pathTo(sel.moves, c.x, c.y);
          const H = TS / 2;
          ctx.strokeStyle = '#ffd873';
          ctx.lineWidth = 5;
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';
          ctx.beginPath();
          const px0 = sel.unit.x * TS + H, py0 = sel.unit.y * TS + H;
          ctx.moveTo(px0, py0);
          for (const [px, py] of path) ctx.lineTo(px * TS + H, py * TS + H);
          ctx.stroke();
          ctx.lineWidth = 1;
          const ex = path.length ? path[path.length - 1][0] * TS + H : px0;
          const ey = path.length ? path[path.length - 1][1] * TS + H : py0;
          ctx.fillStyle = '#05060a';
          ctx.fillRect(ex - 4, ey - 4, 9, 9);
          ctx.fillStyle = '#ffd873';
          ctx.fillRect(ex - 3, ey - 3, 7, 7);
        }
      }
      // target highlights
      if (engine.mode === 'target' && sel) {
        const tPulse = 0.4 + Math.sin(t / 8) * 0.18;
        for (const e of engine.targetsFromSel()) {
          ctx.fillStyle = `rgba(255,70,58,${tPulse})`;
          ctx.fillRect(e.x * TS, e.y * TS, TS, TS);
          ctx.strokeStyle = '#ff9d8a';
          ctx.lineWidth = 2;
          ctx.strokeRect(e.x * TS + 1, e.y * TS + 1, TS - 2, TS - 2);
          ctx.lineWidth = 1;
        }
      }

      // units — sorted by row so overhanging sprites layer front-to-back
      const drawList = engine.units
        .filter(u => !u.dead || engine.deadFx.some(f => f.uid === u.uid))
        .slice()
        .sort((a, b) => a.y - b.y);
      for (const u of drawList) {
        const deadFx = engine.deadFx.find(f => f.uid === u.uid);
        let alpha = 1;
        if (deadFx) {
          const elapsed = performance.now() - deadFx.t0;
          // Slow-mo extends the visible window for boss kills (the
          // renderer scales fade-out k by (1 + slowMo*0.9), so the
          // sprite lingers ~2x longer in the slow-mo window).
          const sm = slowMo(performance.now(), engine.slowMoUntil);
          const fadeMs = 700 + sm * BOSS_KILL_SLOWMO_MS * 0.9;
          const k = Math.min(1, elapsed / fadeMs);
          alpha = 1 - k;
          // Bosses additionally drop lower (knockback) during kill
          const killStyle = u.boss
            ? killStyleFor(u.boss ? 'godhand' : 'sword')
            : 'knockback';
          // (killStyle is consumed by the renderer in a future pass;
          // for now we just use it to drive a slight alpha boost so
          // the boss stays prominent during slow-mo)
          if (killStyle === 'shatter' && sm > 0) {
            alpha = Math.max(alpha, 0.4);
          }
        }
        const ap = engine.animPos && engine.animPos.uid === u.uid ? engine.animPos : null;
        const ux = ap ? ap.x : u.x, uy = ap ? ap.y : u.y;
        drawMapUnit(ctx, u.sprite, u.faction, ux, uy, TS, t,
          { grey: !u.dead && u.moved && engine.phase === 'player', alpha });

        if (!u.dead && u.hp < u.stats.hp) {
          const bw = Math.round(TS * 0.62);
          const bx = Math.round(ux * TS + (TS - bw) / 2);
          const by = Math.round(uy * TS + TS - 3);
          const pct = u.hp / u.stats.hp;
          ctx.fillStyle = '#05060a';
          ctx.fillRect(bx - 1, by - 1, bw + 2, 5);
          ctx.fillStyle = '#1a1f2e';
          ctx.fillRect(bx, by, bw, 3);
          ctx.fillStyle = pct > 0.5 ? '#7fd06a' : pct > 0.25 ? '#e8c85a' : '#e06a52';
          ctx.fillRect(bx, by, Math.max(1, Math.round(bw * pct)), 3);
        }
        if (!u.dead && u.boss) {
          const cxb = Math.round(ux * TS + TS / 2);
          const cyb = Math.round(uy * TS + TS - 34);
          ctx.fillStyle = '#05060a';
          ctx.fillRect(cxb - 5, cyb - 1, 10, 6);
          ctx.fillStyle = '#ffd873';
          ctx.fillRect(cxb - 4, cyb + 1, 8, 3);
          ctx.fillRect(cxb - 4, cyb - 1, 2, 3);
          ctx.fillRect(cxb - 1, cyb - 2, 2, 4);
          ctx.fillRect(cxb + 2, cyb - 1, 2, 3);
        }
      }

      // ─── swing arcs (combat fx) ───
      // For each active attackFx, render an arc from the attacker
      // toward the defender, faded in/out across the swing window.
      if (engine.attackFx.length) {
        const now = performance.now();
        for (const fx of engine.attackFx) {
          const elapsed = now - fx.t0;
          if (elapsed < 0 || elapsed > SWING_MS) continue;
          const k = swingProgress(elapsed);
          const arc = swingArc(fx.fromX, fx.fromY, fx.toX, fx.toY, fx.kind);
          ctx.save();
          ctx.lineCap = 'round';
          // alpha fades in then out
          const a = k < 0.4 ? k / 0.4 : 1 - (k - 0.4) / 0.6;
          ctx.globalAlpha = Math.max(0, Math.min(1, a));
          ctx.strokeStyle = arc.color;
          ctx.lineWidth = arc.width;
          ctx.beginPath();
          ctx.moveTo(arc.startX * TS, arc.startY * TS);
          ctx.bezierCurveTo(
            arc.cp1X * TS, arc.cp1Y * TS,
            arc.cp2X * TS, arc.cp2Y * TS,
            arc.endX   * TS, arc.endY   * TS,
          );
          ctx.stroke();
          // bright peak — a small white dash at midpoint on godhand swings
          if (fx.kind === 'godhand' && k > 0.4 && k < 0.7) {
            ctx.globalAlpha = 0.6 * (1 - Math.abs(k - 0.55) / 0.15);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      // cursor
      if (engine.phase === 'player' && engine.mode !== 'anim' && !engine.banner) {
        const c = engine.cursor;
        const b = Math.floor(t / 12) % 2;
        const L = 10;
        ctx.strokeStyle = '#ffd873';
        ctx.lineWidth = 3;
        const o = 1 + b;
        const cx0 = c.x * TS, cy0 = c.y * TS;
        ctx.beginPath();
        ctx.moveTo(cx0 - o, cy0 + L - o); ctx.lineTo(cx0 - o, cy0 - o); ctx.lineTo(cx0 + L - o, cy0 - o);
        ctx.moveTo(cx0 + TS + o - L, cy0 - o); ctx.lineTo(cx0 + TS + o, cy0 - o); ctx.lineTo(cx0 + TS + o, cy0 + L - o);
        ctx.moveTo(cx0 + TS + o, cy0 + TS - L + o); ctx.lineTo(cx0 + TS + o, cy0 + TS + o); ctx.lineTo(cx0 + TS - L + o, cy0 + TS + o);
        ctx.moveTo(cx0 - o + L, cy0 + TS + o); ctx.lineTo(cx0 - o, cy0 + TS + o); ctx.lineTo(cx0 - o, cy0 + TS - L + o);
        ctx.stroke();
        ctx.lineWidth = 1;
      }

      // weather: rain + dim
      if (chapter.weather === 'rain') {
        ctx.fillStyle = 'rgba(10,12,22,0.30)';
        ctx.fillRect(0, 0, LW, LH);
        ctx.strokeStyle = 'rgba(175,195,220,0.22)';
        // density follows the (now much larger) board area
        const drops = Math.round((LW * LH) / 1500);
        ctx.beginPath();
        for (let i = 0; i < drops; i++) {
          const rx = (i * 61 + t * 7) % (LW + 30) - 15;
          const ry = (i * 43 + t * 17) % (LH + 20) - 10;
          ctx.moveTo(rx, ry); ctx.lineTo(rx - 3, ry + 10);
        }
        ctx.stroke();
        const nowL = performance.now();
        if (nowL > lightningAt) {
          if (nowL - lightningAt < 130) {
            ctx.fillStyle = 'rgba(215,225,255,0.30)';
            ctx.fillRect(0, 0, LW, LH);
          } else if (nowL - lightningAt < 200) {
            ctx.fillStyle = 'rgba(215,225,255,0.12)';
            ctx.fillRect(0, 0, LW, LH);
          } else if (nowL - lightningAt > 5000) {
            if (Math.random() < 0.002) sfx.thunder();
            lightningAt = nowL + 8000 + Math.random() * 9000;
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [engine, chapter, LW, LH, COLS, ROWS]);

  // ── input ───────────────────────────────────────────────────────────────────
  const pick = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const tx = Math.floor((e.clientX - rect.left) / rect.width * COLS);
    const ty = Math.floor((e.clientY - rect.top) / rect.height * ROWS);
    if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return;
    sfx.unlock();
    engine.selectTile(tx, ty);
    setMenuOpen(false);
  };
  const hover = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType !== 'mouse') return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const tx = Math.floor((e.clientX - rect.left) / rect.width * COLS);
    const ty = Math.floor((e.clientY - rect.top) / rect.height * ROWS);
    if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return;
    engine.cursor = { x: tx, y: ty };
  };

  // ── derived UI state ────────────────────────────────────────────────────────
  const phase = engine.phase;
  const sel = engine.sel;
  const cursorUnit = engine.unitAt(engine.cursor.x, engine.cursor.y);
  const terrain = terrainAt(chapter.map, engine.cursor.x, engine.cursor.y);
  const uiLocked = engine.mode === 'anim' || !!engine.banner || phase === 'enemy' || !!evt;
  const canEnd = phase === 'player' && !engine.busy && engine.mode !== 'anim';

  const menuEntries = (): MenuEntry[] => {
    if (!sel) return [];
    const healItems = engine.menuItems();
    return [
      {
        label: 'Attack', icon: <Swords size={16} />, disabled: !engine.menuCanAttack(),
        primary: engine.menuCanAttack(),
        onClick: () => engine.actionEnterTarget(),
      },
      ...healItems.map(({ stack, index }) => ({
        label: `${stack.id === 'vulnerary' ? 'Vulnerary' : stack.id} ×${stack.uses}`,
        icon: <FlaskConical size={16} />,
        disabled: sel.unit.hp >= sel.unit.stats.hp,
        onClick: () => void engine.actionUseItem(index),
      })),
      { label: 'Wait', icon: <Pause size={16} />, onClick: () => void engine.actionWait() },
      { label: 'Cancel', icon: <Undo2 size={16} />, onClick: () => engine.cancelAfterMove() },
    ];
  };

  const activeUnit =
    engine.mode === 'idle' ? cursorUnit
      : (engine.mode === 'selected' || engine.mode === 'menu') ? sel?.unit
        : undefined;

  return (
    <div ref={wrapRef} className="relative w-full h-full overflow-hidden bg-[#07080d] vignette"
      style={{ touchAction: 'none' }}>
      {/* map canvas — reserves only the status bar above and the card strip below */}
      <div className="absolute inset-0 flex items-center justify-center"
        style={{
          paddingTop: 'calc(var(--edge-top) + 38px)',
          paddingBottom: 'calc(var(--edge-bottom) + 84px)',
        }}>
        <canvas ref={canvasRef} className="pixelated"
          style={{ boxShadow: '0 0 0 2px #05060a, 0 0 70px rgba(0,0,0,.75)' }}
          onPointerDown={pick} onPointerMove={hover}
          onContextMenu={e => e.preventDefault()} />
      </div>
      {/* CRT scanlines */}
      <div className="absolute inset-0 pointer-events-none z-10 opacity-50"
        style={{ background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.14) 0px, rgba(0,0,0,0.14) 1px, transparent 1px, transparent 3px)' }} />

      {/* ─── top status: one compact row ─── */}
      <div className="absolute inset-x-0 z-20 flex items-center gap-2 pointer-events-none"
        style={{
          top: 'var(--edge-top)',
          paddingLeft: 'calc(var(--edge-x) + var(--sa-left))',
          paddingRight: 'calc(var(--edge-x) + var(--sa-right))',
        }}>
        <div className="gba-panel flex items-center gap-2 px-2.5 py-1.5 pointer-events-auto">
          <span className={cn('text-[14px] font-bold tabular-nums',
            phase === 'player' ? 'text-[#9db4ff]' : 'text-[#ff9d8a]')}>
            T{engine.turn}
          </span>
          <span className="w-px h-4 bg-[#ffffff22]" />
          <span className="flex items-center gap-1.5 text-[12px] text-[#e8e4d4]">
            <Flag size={12} className="text-[#ffd873]" />{chapter.objective}
          </span>
        </div>
        <div className="flex-1" />
        <button
          className="gba-btn gba-btn-icon gba-btn-ghost pointer-events-auto"
          aria-label="Menu"
          onClick={() => setMenuOpen(m => !m)}>
          {menuOpen ? <X size={20} /> : <MenuIcon size={20} />}
        </button>
      </div>

      {/* terrain readout — sits just under the status row, informational only */}
      {!uiLocked && !gameOver && (
        <div className="absolute z-20 pointer-events-none"
          style={{
            top: 'calc(var(--edge-top) + 46px)',
            left: 'calc(var(--edge-x) + var(--sa-left))',
          }}>
          <TerrainChipView name={terrain.name} def={terrain.def} avo={terrain.avo} heal={terrain.heal} />
        </div>
      )}

      {/* ─── collapsible secondary controls ─── */}
      {menuOpen && (
        <div className="absolute inset-0 z-30" onClick={() => setMenuOpen(false)}>
          <div className="absolute anim-pop"
            style={{
              top: 'calc(var(--edge-top) + 56px)',
              right: 'calc(var(--edge-x) + var(--sa-right))',
            }}
            onClick={e => e.stopPropagation()}>
            <ActionMenu entries={[
              {
                label: suspended ? 'Suspended ✓' : 'Suspend', icon: <Save size={16} />,
                disabled: phase !== 'player' || engine.busy || suspended,
                onClick: () => { onSuspend(engine.snapshot()); setSuspended(true); setMenuOpen(false); },
              },
              { label: 'Quit to Title', icon: <Home size={16} />, danger: true, onClick: onTitle },
            ]} />
          </div>
        </div>
      )}

      {/* phase banner */}
      {engine.banner && <PhaseBanner text={engine.banner.text} sub={engine.banner.sub} tone={engine.banner.tone} />}

      {/* event modal */}
      {evt && evt.type !== 'gameover' && <EventModal evt={evt} onClose={closeEvt} />}
      {gameOver && <GameOverOverlay onRetry={onRetry} onTitle={onTitle} />}

      {/* battle cutscene */}
      {engine.cutData && !gameOver && (
        <BattleCutscene
          key={engine.combatCount}
          plan={engine.cutData.plan}
          map={chapter.map}
          weather={chapter.weather}
          onRound={(i) => engine.applyRound(i)}
          onDone={() => engine.finishCombat()}
        />
      )}

      {/* ─── bottom zone: unit info + primary action, all within thumb reach ─── */}
      {!uiLocked && !gameOver && !engine.targetPreview && (
        <div className="absolute inset-x-0 z-20 flex items-end gap-2 pointer-events-none"
          style={{
            bottom: 'var(--edge-bottom)',
            paddingLeft: 'calc(var(--edge-x) + var(--sa-left))',
            paddingRight: 'calc(var(--edge-x) + var(--sa-right))',
          }}>
          <div className="pointer-events-auto min-w-0 flex-1">
            {activeUnit && <UnitCard unit={activeUnit} playerPhase={phase === 'player'} />}
            {engine.mode === 'target' && (
              <div className="gba-panel px-3 py-2.5 flex items-center gap-2.5 w-full"
                style={{ maxWidth: 360 }}>
                <Target size={17} className="text-[#ff9d8a] shrink-0" />
                <span className="text-[14px] flex-1 min-w-0">Tap a highlighted enemy</span>
                <button className="gba-btn gba-btn-sm shrink-0" onClick={() => engine.cancelTargeting()}>Back</button>
              </div>
            )}
          </div>

          {/* Cancel — deselect and re-plan; replaces End Turn while a move is staged */}
          {engine.mode === 'selected' && (
            <button
              className="gba-btn pointer-events-auto shrink-0 !flex-col !gap-0.5 !px-3"
              style={{ minHeight: 60 }}
              onClick={() => engine.cancelSelection()}>
              <Undo2 size={18} />
              <span className="text-[12px] leading-none">CANCEL</span>
            </button>
          )}

          {/* End Turn — primary action, bottom-right, only when nothing else is asked of the player */}
          {engine.mode === 'idle' && (
            <button
              className="gba-btn gba-btn-gold pointer-events-auto shrink-0 !flex-col !gap-0.5 !px-3"
              style={{ minHeight: 60 }}
              disabled={!canEnd}
              onClick={() => void engine.endTurn()}>
              <Hourglass size={18} />
              <span className="text-[12px] leading-none">END TURN</span>
            </button>
          )}
        </div>
      )}

      {/* ─── action bar: horizontal, thumb-reachable, never overlaps the card ─── */}
      {!uiLocked && !gameOver && engine.mode === 'menu' && sel && (
        <div className="absolute inset-x-0 z-30 anim-sheet"
          style={{
            bottom: 'var(--edge-bottom)',
            paddingLeft: 'calc(var(--edge-x) + var(--sa-left))',
            paddingRight: 'calc(var(--edge-x) + var(--sa-right))',
          }}>
          <div className="gba-panel p-1.5 flex flex-wrap gap-1.5 pointer-events-auto">
            {menuEntries().map((e, i) => (
              <button key={i} disabled={e.disabled} onClick={e.onClick}
                className={cn('gba-btn flex-1 !px-2 text-[13px]',
                  e.primary && 'gba-btn-gold', e.danger && 'gba-btn-red')}
                style={{ minWidth: 88, flexBasis: 88 }}>
                {e.icon}<span className="truncate">{e.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* forecast — full-width sheet, the decision surface */}
      {!uiLocked && !gameOver && engine.targetPreview && sel && (
        <div className="absolute inset-x-0 z-30 flex justify-center pointer-events-none"
          style={{
            bottom: 'var(--edge-bottom)',
            paddingLeft: 'calc(var(--edge-x) + var(--sa-left))',
            paddingRight: 'calc(var(--edge-x) + var(--sa-right))',
          }}>
          <ForecastPanel
            a={sel.unit} d={engine.targetPreview.enemy} fc={engine.targetPreview.fc}
            terrain={terrainAt(chapter.map, engine.targetPreview.enemy.x, engine.targetPreview.enemy.y)}
            onAttack={() => engine.confirmAttack()}
            onBack={() => { engine.targetPreview = null; engine.onChange(); }}
          />
        </div>
      )}
    </div>
  );
}
