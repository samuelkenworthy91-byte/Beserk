import { useEffect, useRef } from 'react';
import type { CombatPlan, Unit } from '../engine/types';
import {
  paintBattleSprite, paintBattleFlash, weaponKindOf,
  type FrameName, type WKind,
} from '../gfx/battleArt';
import { swingArc } from '../gfx/battlePoses';
import { terrainAt } from '../engine/terrain';
import { equippedWeapon } from '../engine/combat';
import { sfx } from '../engine/sfx';

// ─── Battle animation ────────────────────────────────────────────────────────
// Presentation only — combat results arrive pre-computed in `plan` and are
// surfaced through onRound(i) in strict order, exactly once per round.
//
// Timing runs on a VIRTUAL clock that stops during hit-stop, so the freeze on
// impact halts poses, particles, rain and choreography together instead of
// letting the animation drift out from under the pause.

interface Fx {
  text: string; x: number; y: number; t0: number; dur: number;
  color: string; size: number; slam?: boolean;
}
type PKind = 'blood' | 'spark' | 'dust';
interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; max: number; col: string; s: number; grav: number; kind: PKind;
}
interface Splat { x: number; y: number; w: number; h: number; col: string }
interface Ghost { who: 'a' | 'd'; x: number; t0: number }

interface Side {
  u: Unit;
  look: string;
  kind: WKind;
  tint: 'player' | 'enemy';
  home: number;
  x: number;
  faceRight: boolean;
  frame: FrameName;
  flashT: number;
  flashStrong: boolean;
  hurtT: number;
  knock: number;        // current recoil offset (px, away from attacker)
  deathT: number;       // virtual-clock time the death fall began (-1 = alive)
  shownHp: number;
}

// ─── per-weapon "feel" ───────────────────────────────────────────────────────
// Everything that makes a greatsword land like a falling tree and a sword feel
// like a flick lives here. Purely cosmetic.
interface Feel {
  ready: number;     // settle into stance
  wind: number;      // anticipation (heavy = long coil)
  windBack: number;  // weight shifted backwards, px
  accel: number;     // swing travel time
  explosive: boolean;// cubic ease-in (snap) vs quad ease-out (flick)
  lunge: number;     // forward step, px
  hitStop: number;   // freeze frames on connect, ms
  shake: number;     // camera punch amplitude
  knock: number;     // enemy recoil distance, px
  post: number;      // hold on the impact frame
  recover: number;   // return to stance (heavy = short & abrupt)
  trail: number;     // trail thickness
  sparks: number;    // armour spark count
}

const FEEL: Record<WKind, Feel> = {
  // Guts. Every number here is the heaviest in the table on purpose.
  //   wind 420      the weight shift is the longest beat in any attack; you
  //                 watch him load the sword before anything happens
  //   windBack 13   he physically travels backwards hauling it up
  //   accel 85      then crosses that distance faster than anyone — the coil
  //                 is slow, the release is not
  //   hitStop 150   longest freeze in the game; the screen stops dead on impact
  //   post 260      and holds the buried-blade frame afterwards
  //   recover 340   FOLLOW-THROUGH: the blade keeps travelling and he spends
  //                 real time dragging it back. He is never instantly ready.
  great: {
    ready: 170, wind: 420, windBack: 13, accel: 85, explosive: true, lunge: 24,
    hitStop: 150, shake: 13, knock: 30, post: 260, recover: 340, trail: 11, sparks: 18,
  },
  axe: {
    ready: 115, wind: 260, windBack: 6, accel: 90, explosive: true, lunge: 15,
    hitStop: 85, shake: 7.5, knock: 17, post: 175, recover: 165, trail: 6, sparks: 11,
  },
  // light weapons — much faster on every beat
  sword: {
    ready: 50, wind: 92, windBack: 3, accel: 42, explosive: false, lunge: 13,
    hitStop: 48, shake: 4, knock: 9, post: 95, recover: 100, trail: 3, sparks: 7,
  },
  lance: {
    ready: 55, wind: 105, windBack: 4, accel: 46, explosive: false, lunge: 17,
    hitStop: 52, shake: 4.5, knock: 11, post: 105, recover: 110, trail: 3, sparks: 8,
  },
  bow: {
    ready: 90, wind: 210, windBack: 2, accel: 60, explosive: false, lunge: 0,
    hitStop: 46, shake: 3.5, knock: 8, post: 110, recover: 120, trail: 0, sparks: 5,
  },
  none: {
    ready: 60, wind: 100, windBack: 2, accel: 50, explosive: false, lunge: 8,
    hitStop: 40, shake: 3, knock: 6, post: 90, recover: 100, trail: 0, sparks: 3,
  },
};

export default function BattleCutscene({ plan, map, weather, onRound, onDone }: {
  plan: CombatPlan;
  map: string[];
  weather: string;
  onRound: (i: number) => void;
  onDone: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<() => void>(() => { });
  const skipAllRef = useRef<() => void>(() => { });
  // Double-tap detection — two taps within 280ms skip the whole cutscene
  // to its final frame. The single-tap path still advances one beat at a
  // time so the player can pace themselves through the choreography.
  const lastTapRef = useRef<number>(0);

  useEffect(() => {
    const cv = canvasRef.current!;
    const wrap = wrapRef.current!;
    const ctx = cv.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    const terrainKey = terrainAt(map, plan.defender.x, plan.defender.y).key;

    // ── responsive logical viewport ──────────────────────────────────────────
    let W = 320, H = 180, GROUND_Y = 148, POS_L = 92, POS_R = 228, SKY_H = 148;
    let scene: HTMLCanvasElement | null = null;   // baked backdrop + ground

    const layout = () => {
      const cw = Math.max(1, cv.clientWidth || wrap.clientWidth);
      const ch = Math.max(1, cv.clientHeight || wrap.clientHeight);
      const ratio = ch / cw;

      W = cw < 480 ? 224 : cw < 720 ? 288 : 360;
      H = Math.max(150, Math.round(W * ratio));

      const below = Math.round(Math.min(Math.max(H * 0.19, 28), 120));
      GROUND_Y = H - below;
      SKY_H = GROUND_Y;

      POS_L = Math.max(Math.round(W * 0.30), 74);
      POS_R = W - POS_L;

      cv.width = W; cv.height = H;
      ctx.imageSmoothingEnabled = false;
      cv.style.width = '100%';
      cv.style.height = '100%';
      for (const s2 of sides) { s2.home = s2.tint === 'player' ? POS_L : POS_R; }
      scene = buildScene();
    };

    const mkSide = (u: Unit): Side => {
      const w = equippedWeapon(u);
      const isPlayer = u.faction === 'player';
      return {
        u, look: u.sprite,
        kind: weaponKindOf(w?.wtype, w?.great),
        tint: isPlayer ? 'player' : 'enemy',
        home: 0, x: 0,
        faceRight: isPlayer,
        frame: 'idle0',
        flashT: -9999, flashStrong: false,
        hurtT: -9999, knock: 0, deathT: -1,
        shownHp: u.hp,
      };
    };

    const A = mkSide(plan.attacker);
    const D = mkSide(plan.defender);
    const sides = [A, D];
    const sideOf = (who: 'a' | 'd') => (who === 'a' ? A : D);

    // ── virtual clock (freezes during hit-stop) ──────────────────────────────
    let vClock = 0;
    let hitStop = 0;
    let lastReal = performance.now();
    // Both the choreography stepper and the render loop advance the clock, so
    // the elapsed virtual time is banked here and drained once per drawn frame.
    // Without this the renderer would only see the slice it happened to consume
    // and particles would crawl at a fraction of their intended speed.
    let pendingV = 0;

    function advanceClock() {
      const real = performance.now();
      let dt = real - lastReal;
      lastReal = real;
      if (dt > 120) dt = 120;              // tab-switch / stall guard
      if (hitStop > 0) {
        const used = Math.min(hitStop, dt);
        hitStop -= used;
        dt -= used;
      }
      pendingV += dt;
      vClock += dt;
    }

    let moving = false;
    layout();
    for (const s of sides) s.x = s.home;
    const ro = new ResizeObserver(() => {
      layout();
      if (!moving) for (const s of sides) s.x = s.home;
    });
    ro.observe(cv);
    ro.observe(wrap);

    const fx: Fx[] = [];
    const parts: Particle[] = [];
    const splats: Splat[] = [];
    const ghosts: Ghost[] = [];
    let slash: { t0: number; dur: number; who: 'a' | 'd'; from: number; to: number; feel: Feel } | null = null;
    let arrow: { t0: number; dur: number; who: 'a' | 'd' } | null = null;
    let shakeT = -9999, shakeAmp = 0, shakeDir = 1, shakeDur = 170;
    // lens punch: a brief 6% scale + translation toward the impact point.
    // Distinct from the directional shake: shake jitters the canvas while
    // the lens punch squashes it, so the heaviest hits feel like the
    // camera lurches toward the blow instead of just vibrating.
    let lensT = -9999, lensAmp = 0, lensCx = 0, lensCy = 0, lensDur = 220;
    // Honour the system "reduce motion" preference: shrink the camera punch
    // and lens punch so motion-sensitive players see a calmer scene. The
    // combat timing (wind/swing/recover) is untouched — only the camera FX.
    const motionMul = typeof window !== 'undefined'
      && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 0.25 : 1;
    let critFlashT = -9999;
    let impactRing: { x: number; y: number; t0: number; big: boolean } | null = null;
    let koT = -1;
    let finished = false;
    let t = 0;                     // ambient frame counter (freezes with clock)
    let raf = 0;
    let resolver: (() => void) | null = null;

    // virtual-time wait — pauses along with hit-stop
    const wait = (ms: number) => new Promise<void>(res => {
      const target = vClock + ms;
      const step = () => {
        advanceClock();
        if (finished || vClock >= target) { resolver = null; res(); return; }
        resolver = () => { resolver = null; res(); };
        setTimeout(step, 8);
      };
      setTimeout(step, 8);
    });
    skipRef.current = () => resolver?.();
    skipAllRef.current = () => {
      // jump the virtual clock far enough ahead that the run() loop's wait
      // targets all resolve immediately; onDone() then runs through finishCombat
      vClock = 999999;
      resolver?.();
    };
    const frame = () => new Promise<void>(res => requestAnimationFrame(() => res()));

    const easeOutQ = (k: number) => 1 - (1 - k) * (1 - k);
    const easeInCubic = (k: number) => k * k * k;

    // ── particle spawners ────────────────────────────────────────────────────
    function spawnBlood(x: number, y: number, n: number, dir: number, strong: boolean) {
      for (let i = 0; i < n; i++) {
        // spray cones away from the blow, biased along the strike direction
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.9 + dir * 0.55;
        const sp = (strong ? 2.1 : 1.3) * (0.6 + Math.random() * 1.5);
        parts.push({
          x: x + (Math.random() - 0.5) * 6, y: y + (Math.random() - 0.5) * 12,
          vx: Math.cos(a) * sp * 1.9, vy: Math.sin(a) * sp * 1.5 - 0.5,
          life: 0, max: 30 + Math.random() * 24,
          col: Math.random() < 0.3 ? '#c03330' : Math.random() < 0.62 ? '#8d2222' : '#5e1417',
          s: strong && Math.random() < 0.45 ? 2 : 1,
          grav: 0.17, kind: 'blood',
        });
      }
    }
    function spawnSparks(x: number, y: number, n: number, dir: number) {
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.6 - dir * 0.4;
        const sp = 1.8 + Math.random() * 2.6;
        parts.push({
          x, y,
          vx: Math.cos(a) * sp * 1.6, vy: Math.sin(a) * sp * 1.2,
          life: 0, max: 10 + Math.random() * 12,
          col: Math.random() < 0.4 ? '#fff6d0' : Math.random() < 0.7 ? '#ffd873' : '#e08a2a',
          s: 1, grav: 0.05, kind: 'spark',
        });
      }
    }
    function spawnDust(x: number, y: number, n: number) {
      for (let i = 0; i < n; i++) {
        const a = Math.PI + (Math.random() - 0.5) * Math.PI;
        const sp = 0.5 + Math.random() * 1.4;
        parts.push({
          x: x + (Math.random() - 0.5) * 14, y: y - Math.random() * 3,
          vx: Math.cos(a) * sp * 1.7, vy: -Math.random() * 0.9,
          life: 0, max: 22 + Math.random() * 18,
          col: Math.random() < 0.5 ? '#6b5f4c' : '#4a4236',
          s: 1 + (Math.random() < 0.3 ? 1 : 0), grav: 0.022, kind: 'dust',
        });
      }
    }

    function punch(amp: number, dir: number, dur: number) {
      shakeT = vClock; shakeAmp = amp * motionMul; shakeDir = dir; shakeDur = dur;
    }

    function lensPunch(amp: number, cx: number, cy: number, dur: number) {
      lensT = vClock; lensAmp = amp * motionMul; lensCx = cx; lensCy = cy; lensDur = dur;
    }

    // ── choreography ─────────────────────────────────────────────────────────
    async function run() {
      A.frame = 'idle0'; D.frame = 'idle0';
      await wait(340);

      for (let i = 0; i < plan.rounds.length; i++) {
        if (finished) break;
        const r = plan.rounds[i];
        const who: 'a' | 'd' = r.by === 'atk' ? 'a' : 'd';
        const me = sideOf(who);
        const foe = sideOf(who === 'a' ? 'd' : 'a');
        if (me.kind === 'none') continue;

        const F = FEEL[me.kind];
        const ranged = me.kind === 'bow';
        const dir = me.faceRight ? 1 : -1;
        moving = true;

        // ── anticipation: settle, then coil back ──
        me.frame = 'ready';
        await wait(F.ready);
        me.frame = 'wind';
        // kind-aware wind-up sfx (sword clash / pierce / ironThud / etc.)
        sfx.forKind(me.kind)();
        const t0w = vClock;
        while (!finished && vClock - t0w < F.wind) {
          const k = (vClock - t0w) / F.wind;
          me.x = me.home - dir * F.windBack * easeOutQ(k);
          await frame();
        }

        // ── attack: explosive acceleration into the target ──
        me.frame = 'swing';
        if (!ranged) {
          const arc = swingArc(me.kind);
          slash = {
            t0: vClock, dur: F.accel + F.post * 0.5, who, feel: F,
            from: arc.from, to: arc.to,
          };
        } else {
          sfx.bow();
          arrow = { t0: vClock, dur: 250, who };
        }
        const t0s = vClock;
        while (!finished && vClock - t0s < F.accel) {
          const k = (vClock - t0s) / F.accel;
          const e = F.explosive ? easeInCubic(k) : easeOutQ(k);
          me.x = me.home - dir * F.windBack + dir * (F.windBack + F.lunge) * e;
          await frame();
        }
        if (ranged) await wait(200);

        // ── impact ──
        me.frame = 'impact';
        me.x = me.home + dir * F.lunge;
        onRound(i);   // ← authoritative combat result, untouched

        const chestY = GROUND_Y - 46;
        if (r.hit) {
          if (r.crit) sfx.crit(); else sfx.hit();

          // hit-stop: the whole scene freezes for a beat
          hitStop = F.hitStop + (r.crit ? 95 : 0);

          foe.flashT = vClock;
          foe.flashStrong = !!r.crit;
          foe.hurtT = vClock;
          foe.frame = 'hurt';
          foe.knock = (F.knock + (r.crit ? 10 : 0)) * (foe.faceRight ? -1 : 1);

          punch(F.shake * (r.crit ? 1.7 : 1) + Math.min(3, r.dmg * 0.1),
            dir, r.crit ? 210 : 165);

          // lens punch: 6% scale toward the impact, longest on heavy weapons
          // and crits. Combined with the directional shake, this reads as
          // the camera lurching at the blow rather than just vibrating.
          const lensScale = F.sparks > 12 ? 0.08 : F.sparks > 7 ? 0.055 : 0.035;
          lensPunch(lensScale + (r.crit ? 0.025 : 0),
            foe.x - dir * 8, chestY + 4, 220 + (r.crit ? 40 : 0));

          spawnSparks(foe.x - dir * 8, chestY + 2, F.sparks + (r.crit ? 10 : 0), dir);
          spawnBlood(foe.x - dir * 6, chestY,
            (r.crit ? 22 : Math.min(14, 5 + r.dmg)), dir, !!r.crit);
          spawnDust(foe.x, GROUND_Y, r.crit ? 10 : 5);
          impactRing = { x: foe.x - dir * 6, y: chestY, t0: vClock, big: !!r.crit };

          if (r.crit) critFlashT = vClock;

          fx.push({
            text: r.crit ? `${r.dmg}!` : `${r.dmg}`,
            x: foe.x, y: GROUND_Y - 74, t0: vClock, dur: 860,
            color: r.crit ? '#ff6a5a' : '#ffd873', size: r.crit ? 17 : 12,
          });
          if (r.crit) {
            fx.push({
              text: 'CRITICAL', x: W / 2, y: Math.max(46, GROUND_Y - 112),
              t0: vClock, dur: 900, color: '#ff6a5a', size: 11, slam: true,
            });
          }
        } else {
          // ── clear dodge: back-leap with afterimages and a whiff of dust ──
          sfx.miss();
          foe.frame = 'ready';
          spawnDust(foe.x, GROUND_Y, 7);
          fx.push({
            text: 'MISS', x: foe.x, y: GROUND_Y - 74,
            t0: vClock, dur: 720, color: '#9db4ff', size: 10,
          });
          const away = foe.faceRight ? -1 : 1;
          const t0m = vClock;
          const dodgeDur = 260;
          let lastGhost = 0;
          while (!finished && vClock - t0m < dodgeDur) {
            const k = (vClock - t0m) / dodgeDur;
            foe.x = foe.home + away * Math.sin(k * Math.PI) * 19;
            if (vClock - lastGhost > 34 && k < 0.6) {
              ghosts.push({ who: who === 'a' ? 'd' : 'a', x: foe.x, t0: vClock });
              lastGhost = vClock;
            }
            await frame();
          }
          foe.x = foe.home;
          spawnDust(foe.x, GROUND_Y, 5);
        }

        await wait(r.hit ? F.post : 80);
        slash = null; arrow = null;

        // ── recovery ──
        me.frame = 'recover';
        const t0r = vClock;
        while (!finished && vClock - t0r < F.recover) {
          const k = (vClock - t0r) / F.recover;
          me.x = me.home + dir * F.lunge * (1 - easeOutQ(k));
          await frame();
        }
        me.x = me.home;
        me.frame = 'idle0';
        moving = false;
        if (foe.frame === 'hurt' && !r.killed) foe.frame = 'idle0';

        // ── death: stagger, hold, fall, dust, fade ──
        if (r.killed) {
          const dyingWho: 'a' | 'd' = who === 'a' ? 'd' : 'a';
          const dying = sideOf(dyingWho);
          dying.frame = 'hurt';
          await wait(240);                       // stagger on the spot
          dying.frame = 'dead';
          dying.deathT = vClock;
          spawnDust(dying.x, GROUND_Y, 16);
          punch(3.5, dying.faceRight ? -1 : 1, 150);
          koT = vClock;
          await wait(900);                       // fall + fade out
        }
        await wait(100);
      }

      if (plan.xpA > 0 && !finished && plan.attacker.faction === 'player') {
        fx.push({
          text: `+${plan.xpA} EXP`, x: A.x, y: GROUND_Y - 86,
          t0: vClock, dur: 880, color: '#7fd06a', size: 10,
        });
        await wait(620);
      }
      finished = true;
      onDone();
    }

    // ═══ terrain-specific scenery ═════════════════════════════════════════════
    // Baked once per layout. Each terrain gets its own backdrop AND ground
    // surface rather than tiling the tactical-map tile across the floor.

    function buildScene(): HTMLCanvasElement {
      const c = document.createElement('canvas');
      c.width = W; c.height = H;
      const g = c.getContext('2d')!;
      g.imageSmoothingEnabled = false;
      const hash = (n: number) => {
        let h = (n * 374761393 + 668265263) >>> 0;
        h = ((h ^ (h >> 13)) * 1274126177) >>> 0;
        return (h ^ (h >> 16)) >>> 0;
      };
      const rr = (n: number, m: number) => hash(n) % m;
      const px = (x: number, y: number, w: number, h2: number, col: string) => {
        g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), w, h2);
      };

      const open = terrainKey === 'plain' || terrainKey === 'road' || terrainKey === 'water';

      // ── distant ridgeline (all terrains, sets the gloomy horizon) ──
      g.fillStyle = '#1b2026';
      for (let i = 0; i < Math.ceil(W / 42) + 1; i++) {
        const bx = i * 42 - 14, bh = 26 + ((i * 53) % 18);
        g.beginPath();
        g.moveTo(bx, GROUND_Y - 26);
        g.lineTo(bx + 21, GROUND_Y - 26 - bh);
        g.lineTo(bx + 42, GROUND_Y - 26);
        g.closePath(); g.fill();
      }

      // ── mid-ground backdrop per terrain ──
      if (terrainKey === 'forest') {
        // dense trunks + overhead canopy closing the frame in
        g.fillStyle = '#101a0e';
        g.fillRect(0, GROUND_Y - 62, W, 62);
        for (let i = 0; i < Math.ceil(W / 17) + 1; i++) {
          const bx = i * 17 + rr(i, 6) - 4;
          const bw = 5 + rr(i + 40, 4);
          const top = GROUND_Y - 58 - rr(i + 9, 16);
          px(bx, top, bw, GROUND_Y - top, i % 2 ? '#1a2614' : '#131d0f');
          px(bx, top, 1, GROUND_Y - top, '#26351c');
          // low branch stubs
          if (i % 3 === 0) px(bx - 3, top + 10, 8, 1, '#1a2614');
        }
        // canopy hanging into the top of the frame
        g.fillStyle = '#0d1509';
        for (let i = 0; i < Math.ceil(W / 14) + 1; i++) {
          const bx = i * 14;
          const dh = 12 + rr(i + 77, 16);
          g.beginPath();
          g.moveTo(bx, 0); g.lineTo(bx + 7, dh); g.lineTo(bx + 14, 0);
          g.closePath(); g.fill();
        }
        px(0, 0, W, 6, '#0d1509');
        // ferns along the base
        for (let i = 0; i < 26; i++) {
          const fx0 = rr(i + 200, W), fy0 = GROUND_Y - 4 - rr(i + 210, 5);
          px(fx0, fy0, 1, 4, '#2b4020');
          px(fx0 - 2, fy0 + 1, 2, 1, '#22331a');
          px(fx0 + 2, fy0 + 1, 2, 1, '#22331a');
        }
      } else if (terrainKey === 'fort' || terrainKey === 'wall') {
        // stone rampart filling the mid-ground
        const wallTop = GROUND_Y - 74;
        px(0, wallTop, W, GROUND_Y - wallTop, '#3a3f48');
        for (let row = 0; row < 10; row++) {
          const yy = wallTop + 8 + row * 8;
          if (yy > GROUND_Y) break;
          px(0, yy, W, 1, '#23262d');
          for (let bx = -8; bx < W; bx += 18) {
            const sx = bx + (row % 2 ? 9 : 0);
            px(sx + 1, yy - 6, 16, 5, '#565c68');
            px(sx + 1, yy - 6, 16, 1, '#767d8b');
          }
        }
        // crenellations
        for (let i = 0; i * 16 < W + 16; i++) {
          px(i * 16, wallTop - 9, 10, 10, '#565c68');
          px(i * 16, wallTop - 9, 10, 1, '#949cab');
          px(i * 16, wallTop - 9, 1, 10, '#767d8b');
        }
        px(0, wallTop, W, 2, '#23262d');
        // hanging banner
        const bx0 = Math.round(W * 0.22);
        px(bx0, wallTop + 4, 13, 30, '#6e211d');
        px(bx0, wallTop + 4, 13, 2, '#23262d');
        px(bx0 + 2, wallTop + 8, 3, 22, '#9a3229');
        px(bx0 + 4, wallTop + 34, 5, 4, '#6e211d');
      } else if (terrainKey === 'gate') {
        // the gate itself looms directly behind the fighters
        const gw = Math.min(140, Math.round(W * 0.56));
        const gx = Math.round((W - gw) / 2);
        const top = GROUND_Y - 96;
        px(0, GROUND_Y - 80, W, 80, '#3a3f48');
        for (let row = 0; row < 10; row++) {
          const yy = GROUND_Y - 74 + row * 8;
          px(0, yy, W, 1, '#23262d');
          for (let bx = -8; bx < W; bx += 18) {
            const sx = bx + (row % 2 ? 9 : 0);
            px(sx + 1, yy - 6, 16, 5, '#4d535e');
          }
        }
        // arch + timber doors
        px(gx - 6, top, gw + 12, 10, '#565c68');
        px(gx - 6, top, gw + 12, 2, '#767d8b');
        px(gx, top + 10, gw, GROUND_Y - top - 10, '#33230f');
        for (let i = 0; i < gw; i += 9) {
          px(gx + i, top + 12, 6, GROUND_Y - top - 14, i % 18 ? '#4d361a' : '#3d2a13');
        }
        px(gx, top + 26, gw, 5, '#4b5058');
        px(gx, top + 60, gw, 5, '#4b5058');
        px(gx, top + 26, gw, 1, '#767c88');
        px(gx, top + 60, gw, 1, '#767c88');
        for (let i = 0; i < 6; i++) {
          px(gx + 8 + i * (gw / 6), top + 28, 2, 2, '#949cab');
          px(gx + 8 + i * (gw / 6), top + 62, 2, 2, '#949cab');
        }
        px(gx + gw / 2 - 1, top + 10, 2, GROUND_Y - top - 10, '#1d1208');
      } else if (terrainKey === 'house') {
        px(0, GROUND_Y - 58, W, 58, '#2a2f36');
        const hx = Math.round(W * 0.16), hw = Math.round(W * 0.68);
        px(hx, GROUND_Y - 52, hw, 52, '#565c68');
        for (let row = 0; row < 7; row++) {
          px(hx, GROUND_Y - 46 + row * 7, hw, 1, '#3a3f48');
        }
        // thatch
        g.fillStyle = '#4d361a';
        g.beginPath();
        g.moveTo(hx - 10, GROUND_Y - 50);
        g.lineTo(hx + hw / 2, GROUND_Y - 78);
        g.lineTo(hx + hw + 10, GROUND_Y - 50);
        g.closePath(); g.fill();
        for (let i = 0; i < hw; i += 5) {
          px(hx - 6 + i, GROUND_Y - 54, 3, 5, i % 10 ? '#3d2a13' : '#5a3f1e');
        }
        px(hx + hw / 2 - 9, GROUND_Y - 30, 18, 30, '#1d1208');
        px(hx + hw / 2 - 7, GROUND_Y - 27, 14, 27, '#33230f');
        px(hx + 14, GROUND_Y - 38, 10, 9, '#14161a');
        px(hx + hw - 24, GROUND_Y - 38, 10, 9, '#14161a');
      } else if (terrainKey === 'mountain') {
        px(0, GROUND_Y - 88, W, 88, '#2b2c31');
        for (let i = 0; i < 5; i++) {
          const bx = i * (W / 4) - 20, bh = 50 + rr(i + 3, 34);
          g.fillStyle = i % 2 ? '#43454c' : '#35373d';
          g.beginPath();
          g.moveTo(bx, GROUND_Y);
          g.lineTo(bx + 34, GROUND_Y - bh);
          g.lineTo(bx + 68, GROUND_Y);
          g.closePath(); g.fill();
          px(bx + 30, GROUND_Y - bh, 8, 10, '#5d606a');
        }
        for (let i = 0; i < 16; i++) {
          px(rr(i + 60, W), GROUND_Y - 30 - rr(i + 70, 40), 4, 2, '#5d606a');
        }
      } else if (terrainKey === 'water') {
        // reed-lined shoreline, open sky
        px(0, GROUND_Y - 30, W, 30, '#1f3644');
        for (let i = 0; i < 40; i++) {
          px(rr(i, W), GROUND_Y - 26 - rr(i + 5, 10), 5, 1, '#2c4d5e');
        }
        for (let i = 0; i < 34; i++) {
          const rx = rr(i + 300, W), rh = 8 + rr(i + 310, 12);
          px(rx, GROUND_Y - rh, 1, rh, '#3e4a28');
          px(rx + 1, GROUND_Y - rh - 2, 1, 3, '#5c6b36');
        }
      } else {
        // open field / road — distant treeline
        g.fillStyle = '#161c15';
        for (let i = 0; i < Math.ceil(W / 20) + 1; i++) {
          const bx = i * 20 - 6, bh = 16 + ((i * 37) % 13);
          g.beginPath();
          g.moveTo(bx, GROUND_Y - 22);
          g.lineTo(bx + 7, GROUND_Y - 22 - bh);
          g.lineTo(bx + 14, GROUND_Y - 22);
          g.closePath(); g.fill();
        }
        // siege dressing: palisade stakes and a broken cart wheel
        for (let i = 0; i < 7; i++) {
          const sx = 14 + i * Math.round(W / 7) + rr(i, 7);
          px(sx, GROUND_Y - 30, 2, 30, '#2e2012');
          px(sx, GROUND_Y - 32, 2, 3, '#43301c');
        }
        if (!open || terrainKey === 'plain') {
          const wx = Math.round(W * 0.82), wy = GROUND_Y - 4;
          g.strokeStyle = '#33230f'; g.lineWidth = 2;
          g.beginPath(); g.arc(wx, wy - 8, 9, 0, Math.PI * 2); g.stroke();
          px(wx - 1, wy - 17, 2, 18, '#33230f');
        }
      }

      // mist band softens the join between backdrop and field
      px(0, GROUND_Y - 26, W, 26, 'rgba(40,48,54,0.40)');

      // ── ground surface per terrain ──
      const bandH = H - GROUND_Y + 8;
      let g0 = '#3a2f20', g1 = '#4a3b27', g2 = '#5d4a30';
      if (terrainKey === 'forest') { g0 = '#1f2a16'; g1 = '#2b3a1e'; g2 = '#3a4d28'; }
      else if (terrainKey === 'fort' || terrainKey === 'wall' || terrainKey === 'gate') { g0 = '#2f333a'; g1 = '#3f444d'; g2 = '#525863'; }
      else if (terrainKey === 'mountain') { g0 = '#2b2c31'; g1 = '#3a3c42'; g2 = '#4c4f56'; }
      else if (terrainKey === 'water') { g0 = '#3d3a2c'; g1 = '#4f4a36'; g2 = '#655e44'; }
      else if (terrainKey === 'plain') { g0 = '#2f3a20'; g1 = '#3d4a28'; g2 = '#4d5c33'; }

      px(0, GROUND_Y - 6, W, bandH, g1);
      px(0, GROUND_Y - 6, W, 2, g0);
      for (let i = 0; i < Math.round(W * bandH / 26); i++) {
        const mx = rr(i + 500, W), my = GROUND_Y - 4 + rr(i + 520, Math.max(4, bandH - 4));
        px(mx, my, 2 + rr(i, 4), 1, i % 3 ? g0 : g2);
      }
      // stone floors get slabs; soft ground gets ruts and tufts
      if (terrainKey === 'fort' || terrainKey === 'wall' || terrainKey === 'gate') {
        for (let row = 0; row * 10 < bandH; row++) {
          const yy = GROUND_Y - 4 + row * 10;
          px(0, yy, W, 1, g0);
          for (let bx = -10; bx < W; bx += 22) {
            px(bx + (row % 2 ? 11 : 0), yy, 1, 10, g0);
          }
        }
      } else {
        for (let i = 0; i < 9; i++) {
          const ry = GROUND_Y + 2 + rr(i + 600, Math.max(3, bandH - 8));
          px(rr(i + 610, W) - 20, ry, 26 + rr(i, 22), 1, g0);
        }
        if (terrainKey === 'plain' || terrainKey === 'forest') {
          for (let i = 0; i < 22; i++) {
            const tx = rr(i + 700, W), ty = GROUND_Y - 2 + rr(i + 710, Math.max(3, bandH - 6));
            px(tx, ty, 1, 3, g0);
            px(tx + 1, ty + 1, 1, 2, g2);
          }
        }
      }
      // puddles (wet, rain-soaked field)
      for (let i = 0; i < 8; i++) {
        const pxp = rr(i + 800, W), pyp = GROUND_Y + 4 + rr(i + 810, Math.max(4, bandH - 10));
        const pw = 11 + rr(i + 820, 14);
        g.fillStyle = 'rgba(96,116,132,0.22)';
        g.beginPath(); g.ellipse(pxp, pyp, pw / 2, 2 + (i % 2), 0, 0, Math.PI * 2); g.fill();
        px(pxp - pw / 2 + 2, pyp - 1, pw - 4, 1, 'rgba(150,172,190,0.18)');
      }
      px(0, GROUND_Y - 6, W, 1, 'rgba(0,0,0,0.35)');
      return c;
    }

    // ═══ rendering ════════════════════════════════════════════════════════════

    function drawSide(s: Side, who: 'a' | 'd') {
      let alpha = 1;
      let yOff = 0;
      if (s.deathT >= 0) {
        const k = Math.min(1, (vClock - s.deathT) / 760);
        // sink into the mud, then fade
        yOff = easeOutQ(k) * 7;
        alpha = k < 0.45 ? 1 : 1 - (k - 0.45) / 0.55;
      }
      if (alpha <= 0) return;

      let x = s.x;
      // recoil: shoved back, then eased home
      if (Math.abs(s.knock) > 0.05) x += s.knock;
      const hk = vClock - s.hurtT;
      if (hk < 150) x += (s.faceRight ? -1 : 1) * (1 - hk / 150) * 4;

      // contact shadow
      ctx.save();
      ctx.globalAlpha = alpha * 0.45;
      ctx.fillStyle = '#05060a';
      ctx.beginPath();
      ctx.ellipse(x, GROUND_Y + 2, 26, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      const idleBob = s.frame === 'idle0' && Math.floor(t / 26) % 2 === 0 ? 1 : 0;
      paintBattleSprite(ctx, s.look, s.kind, s.frame, s.tint,
        x, GROUND_Y + yOff + idleBob, s.faceRight, alpha);

      const fk = vClock - s.flashT;
      const flashDur = s.flashStrong ? 190 : 130;
      if (fk >= 0 && fk < flashDur) {
        paintBattleFlash(ctx, s.look, s.kind, s.frame, s.tint,
          x, GROUND_Y + yOff + idleBob, s.faceRight,
          (1 - fk / flashDur) * (s.flashStrong ? 1 : 0.85));
      }
      void who;
    }

    function drawGhosts() {
      for (const gh of ghosts) {
        const k = (vClock - gh.t0) / 220;
        if (k >= 1 || k < 0) continue;
        const s = sideOf(gh.who);
        ctx.save();
        ctx.globalAlpha = (1 - k) * 0.30;
        paintBattleSprite(ctx, s.look, s.kind, 'ready', s.tint, gh.x, GROUND_Y, s.faceRight, 1);
        ctx.restore();
      }
    }

    /** Weapon trail — chunky pixel samples along the real swing arc. */
    function drawSlash() {
      if (!slash) return;
      const k = (vClock - slash.t0) / slash.dur;
      if (k >= 1 || k < 0) return;
      const s = sideOf(slash.who);
      const dir = s.faceRight ? 1 : -1;
      // pivot at the shoulder of the authored figure; radius matches its reach
      const arc = swingArc(s.kind);
      const pivotX = s.x - dir * 3;
      const pivotY = GROUND_Y + arc.pivotY;
      const rad = arc.radius;
      const F = slash.feel;
      const a0 = slash.from, a1 = slash.to;
      // the trail head tracks the same curve the body uses
      const prog = F.explosive ? easeInCubic(Math.min(1, k * 1.35)) : easeOutQ(Math.min(1, k * 1.3));
      const head = a0 + (a1 - a0) * prog;
      const span = (a1 - a0) * (F.explosive ? 0.62 : 0.44);
      const fade = 1 - k;

      // three concentric bands of discrete square samples = crisp GBA crescent
      const bands: [number, number, string][] = [
        [rad + F.trail * 0.55, 2 + Math.round(F.trail / 3), '#f2f6fb'],
        [rad, 2 + Math.round(F.trail / 2.4), '#b9c4d4'],
        [rad - F.trail * 0.62, 1 + Math.round(F.trail / 3), '#66748a'],
      ];
      ctx.save();
      for (let b = 0; b < bands.length; b++) {
        const [br, bs, col] = bands[b];
        ctx.fillStyle = col;
        const steps = 22;
        for (let i = 0; i < steps; i++) {
          const f = i / (steps - 1);
          const ang = head - span * f;
          const a = fade * (1 - f * 0.85) * (b === 0 ? 0.95 : b === 1 ? 0.7 : 0.45);
          if (a <= 0.03) continue;
          ctx.globalAlpha = a;
          const sx = pivotX + Math.cos(ang) * br * dir;
          const sy = pivotY + Math.sin(ang) * br;
          ctx.fillRect(Math.round(sx - bs / 2), Math.round(sy - bs / 2), bs, bs);
        }
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    function drawImpactRing() {
      if (!impactRing) return;
      const k = (vClock - impactRing.t0) / (impactRing.big ? 300 : 200);
      if (k >= 1 || k < 0) { return; }
      const spokes = impactRing.big ? 10 : 6;
      const len = (impactRing.big ? 26 : 15) * easeOutQ(k);
      const inner = len * 0.42;
      ctx.save();
      ctx.globalAlpha = 1 - k;
      ctx.fillStyle = impactRing.big ? '#ffd0a0' : '#fff2cc';
      for (let i = 0; i < spokes; i++) {
        const a = (i / spokes) * Math.PI * 2 + (impactRing.big ? 0.2 : 0);
        for (let d = inner; d < len; d += 2) {
          const sx = impactRing.x + Math.cos(a) * d;
          const sy = impactRing.y + Math.sin(a) * d * 0.8;
          ctx.fillRect(Math.round(sx), Math.round(sy), 2, 2);
        }
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    function drawParticles(dv: number) {
      for (const p of parts) {
        if (p.life >= p.max) continue;
        ctx.globalAlpha = p.life > p.max * 0.7 ? 1 - (p.life - p.max * 0.7) / (p.max * 0.3) : 1;
        ctx.fillStyle = p.col;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
        // sparks streak slightly along their motion
        if (p.kind === 'spark' && p.life < 5) {
          ctx.fillRect(Math.round(p.x - p.vx * 0.6), Math.round(p.y - p.vy * 0.6), 1, 1);
        }
      }
      ctx.globalAlpha = 1;
      if (dv <= 0) return;                  // frozen during hit-stop
      const step = Math.min(2.2, dv / 16.67);
      for (const p of parts) {
        if (p.life >= p.max) continue;
        p.x += p.vx * step; p.y += p.vy * step;
        p.vy += p.grav * step;
        if (p.kind === 'dust') { p.vx *= 0.94; }
        p.life += step;
        if (p.y > GROUND_Y + 2) {
          if (p.kind === 'blood' && p.vy > 0.6 && splats.length < 70) {
            splats.push({
              x: p.x - 1, y: GROUND_Y + 1 + (Math.random() * 2 | 0),
              w: 1 + (Math.random() * 3 | 0), h: 1, col: p.col,
            });
          }
          p.vy = 0; p.vx *= 0.6; p.y = GROUND_Y + 2;
          if (p.kind !== 'blood') p.life = p.max;
        }
      }
    }

    function drawSplats() {
      for (const s of splats) {
        ctx.fillStyle = s.col;
        ctx.fillRect(Math.round(s.x), Math.round(s.y), s.w, s.h);
      }
    }

    function drawHpPlate(x: number, y: number, side: 'left' | 'right', s: Side) {
      const wPlate = Math.min(140, Math.round(W * 0.42));
      const px0 = side === 'left' ? x : x - wPlate;
      ctx.fillStyle = 'rgba(8,11,22,0.9)';
      ctx.fillRect(px0, y, wPlate, 24);
      ctx.fillStyle = s.tint === 'player' ? '#7d9dff' : '#ff9d8a';
      ctx.fillRect(px0, y, wPlate, 1);
      ctx.fillRect(px0, y + 23, wPlate, 1);
      ctx.fillRect(px0, y, 1, 24);
      ctx.fillRect(px0 + wPlate - 1, y, 1, 24);
      ctx.font = '700 8px Silkscreen, monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#e8e4d4';
      ctx.fillText(s.u.name, px0 + 5, y + 10);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#a8a894';
      ctx.fillText(`Lv${s.u.level}`, px0 + wPlate - 5, y + 10);
      const barW = wPlate - 44, bx = px0 + 5, by = y + 14;
      const pct = Math.max(0, s.shownHp / s.u.stats.hp);
      ctx.fillStyle = '#05060a'; ctx.fillRect(bx - 1, by - 1, barW + 2, 7);
      ctx.fillStyle = '#1a1f2e'; ctx.fillRect(bx, by, barW, 5);
      ctx.fillStyle = pct > 0.5 ? '#7fd06a' : pct > 0.25 ? '#e8c85a' : '#e06a52';
      ctx.fillRect(bx, by, Math.round(barW * pct), 5);
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.fillRect(bx, by, Math.round(barW * pct), 1);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#e8e4d4';
      ctx.fillText(`${Math.max(0, Math.ceil(s.shownHp))}/${s.u.stats.hp}`, px0 + wPlate - 5, y + 20);
    }

    function draw() {
      advanceClock();
      const frameV = pendingV;          // drain the banked virtual time
      pendingV = 0;
      if (frameV > 0) t++;              // ambient motion freezes with the clock

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, W, H);

      // ── camera punch: directional impulse, short and hard ──
      const sk = vClock - shakeT;
      let ox = 0, oy = 0;
      if (sk >= 0 && sk < shakeDur) {
        const decay = (1 - sk / shakeDur) ** 2;
        const osc = Math.sin((sk / shakeDur) * Math.PI * 5);
        ox = shakeDir * shakeAmp * osc * decay;
        oy = shakeAmp * 0.5 * Math.sin((sk / shakeDur) * Math.PI * 7) * decay;
      }

      // ── lens punch: 1-frame scale around the impact point. Falls back to
      //   identity by the time the recover frame paints, so it never stacks
      //   across hits. Applied AFTER the shake so the shake still jitters.
      const lk = vClock - lensT;
      let scale = 1, sCentreX = 0, sCentreY = 0;
      if (lk >= 0 && lk < lensDur) {
        const k = lk / lensDur;
        // ease-out: most of the punch in the first 35% of the duration, then
        // smooth resolution back to identity so it doesn't read as a wobble
        const punch = (1 - k) * (1 - k * 0.6);
        scale = 1 + lensAmp * punch;
        sCentreX = lensCx;
        sCentreY = lensCy;
      }

      ctx.setTransform(scale, 0, 0, scale, ox - sCentreX * (scale - 1), oy - sCentreY * (scale - 1));

      // ── sky ──
      const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      sky.addColorStop(0, '#0b0e16');
      sky.addColorStop(0.42, '#1b202a');
      sky.addColorStop(0.78, '#2f343a');
      sky.addColorStop(1, '#474b44');
      ctx.fillStyle = sky; ctx.fillRect(-8, -8, W + 16, GROUND_Y + 12);

      const enclosed = terrainKey === 'forest' || terrainKey === 'gate'
        || terrainKey === 'fort' || terrainKey === 'wall' || terrainKey === 'house';

      // drifting cloud banks
      if (!enclosed) {
        const bands = Math.max(2, Math.min(8, Math.floor(SKY_H / 44)));
        for (let i = 0; i < bands; i++) {
          const by = Math.round(6 + (i + 0.35) * (SKY_H * 0.74) / bands);
          const drift = ((t * (0.07 + (i % 3) * 0.016) + i * 97) % (W + 160)) - 80;
          ctx.fillStyle = i % 2 ? 'rgba(58,64,75,0.34)' : 'rgba(44,50,61,0.42)';
          const segs = 4 + (i % 3);
          for (let s = 0; s < segs; s++) {
            const sx = Math.round(drift + s * 21 - (s % 2) * 7);
            const sw = 22 + ((i * 7 + s * 13) % 24);
            const sh = 3 + ((i + s) % 2) * 2;
            ctx.fillRect(sx, by + ((s % 2) ? 2 : 0), sw, sh);
          }
        }
        // burning fortress on the horizon + smoke
        const fx0 = Math.round(W * 0.60), fy0 = GROUND_Y - 30;
        ctx.fillStyle = '#12161c';
        ctx.fillRect(fx0, fy0 - 14, 34, 16);
        ctx.fillRect(fx0 - 7, fy0 - 21, 9, 23);
        ctx.fillRect(fx0 + 31, fy0 - 25, 10, 27);
        for (let i = 0; i < 4; i++) ctx.fillRect(fx0 + 2 + i * 8, fy0 - 17, 4, 4);
        for (let i = 0; i < 6; i++) {
          const sy = fy0 - 26 - i * Math.max(7, SKY_H / 16);
          if (sy < -6) break;
          const sway = Math.sin((t * 0.012) + i * 0.8) * (3 + i);
          ctx.fillStyle = `rgba(30,34,42,${0.34 - i * 0.04})`;
          ctx.fillRect(Math.round(fx0 + 16 + sway), Math.round(sy), 7 + i * 2, 5);
        }
        // crows
        for (let i = 0; i < 3; i++) {
          const cxp = ((t * (0.22 + i * 0.05) + i * 120) % (W + 60)) - 30;
          const cyp = 16 + i * 13 + Math.sin(t * 0.03 + i) * 4;
          if (cyp > SKY_H - 34) continue;
          const flap = Math.floor(t / 7 + i) % 2 === 0 ? 2 : 0;
          ctx.fillStyle = '#0c0f15';
          ctx.fillRect(Math.round(cxp), Math.round(cyp), 2, 1);
          ctx.fillRect(Math.round(cxp) - 3, Math.round(cyp) - flap, 3, 1);
          ctx.fillRect(Math.round(cxp) + 2, Math.round(cyp) - flap, 3, 1);
        }
      }

      // ── baked terrain scenery + ground ──
      if (scene) ctx.drawImage(scene, 0, 0);

      // animated water band behind a shoreline duel
      if (terrainKey === 'water') {
        for (let r = 0; r < 6; r++) {
          const yy = GROUND_Y - 28 + r * 4;
          const off = Math.round(Math.sin(t * 0.04 + r) * 6);
          ctx.fillStyle = r % 2 ? 'rgba(74,113,131,0.5)' : 'rgba(44,77,94,0.5)';
          ctx.fillRect(((r * 37 + off) % W) - 10, yy, 22, 1);
        }
      }
      // torch flames flanking the gate
      if (terrainKey === 'gate') {
        const gw = Math.min(140, Math.round(W * 0.56));
        const gx = Math.round((W - gw) / 2);
        const f = Math.floor(t / 6) % 3;
        for (const tx of [gx - 14, gx + gw + 10]) {
          const ty = GROUND_Y - 58;
          ctx.fillStyle = '#2e2012'; ctx.fillRect(tx, ty, 3, 14);
          ctx.fillStyle = '#8c3a10'; ctx.fillRect(tx - 1, ty - 6 + (f === 1 ? 1 : 0), 5, 6);
          ctx.fillStyle = '#d9781f'; ctx.fillRect(tx, ty - 8 + (f === 2 ? 1 : 0), 3, 5);
          ctx.fillStyle = '#f2c246'; ctx.fillRect(tx + 1, ty - 5, 1, 2);
        }
      }

      drawSplats();
      drawGhosts();
      drawSlash();

      // draw the further fighter first so overlaps layer correctly
      const first = A.x <= D.x ? A : D;
      const second = first === A ? D : A;
      drawSide(first, first === A ? 'a' : 'd');
      drawSide(second, second === A ? 'a' : 'd');

      drawImpactRing();
      drawParticles(frameV);

      // foreground debris silhouettes
      ctx.fillStyle = '#0b0d14';
      for (let i = 0; i < 5; i++) {
        const rx = ((i * 71) % W) + (i % 2 ? 9 : -4);
        const ry = H - 6 - (i % 3) * 3;
        ctx.beginPath();
        ctx.ellipse(rx, ry, 11 + (i % 3) * 5, 4 + (i % 2) * 2, 0, Math.PI, 0);
        ctx.fill();
      }

      if (arrow) {
        const k = Math.min(1, (vClock - arrow.t0) / arrow.dur);
        const s = sideOf(arrow.who);
        const o = sideOf(arrow.who === 'a' ? 'd' : 'a');
        const x = s.x + (o.x - s.x) * k;
        const y = GROUND_Y - 46 - Math.sin(k * Math.PI) * 10;
        const dir = s.faceRight ? 1 : -1;
        ctx.fillStyle = '#3a2412';
        ctx.fillRect(Math.round(x - dir * 7), Math.round(y), 8, 1);
        ctx.fillStyle = '#c0baa6';
        ctx.fillRect(Math.round(x), Math.round(y - 1), 3, 2);
        ctx.fillStyle = '#e4e0d0';
        ctx.fillRect(Math.round(x - dir * 8), Math.round(y - 1), 2, 3);
      }

      if (weather === 'rain') {
        ctx.strokeStyle = 'rgba(184,204,226,0.26)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const drops = Math.max(40, Math.min(190, Math.round((W * H) / 900)));
        for (let i = 0; i < drops; i++) {
          const rx = (i * 47 + t * 10) % (W + 44) - 22;
          const ry = (i * 31 + t * 23) % (H + 20) - 10;
          ctx.moveTo(rx, ry); ctx.lineTo(rx - 3, ry + 10);
        }
        ctx.stroke();
      }

      // ── damage numbers ──
      for (const f of fx) {
        const k = (vClock - f.t0) / f.dur;
        if (k >= 1 || k < 0) continue;
        ctx.save();
        ctx.globalAlpha = k < 0.75 ? 1 : 1 - (k - 0.75) * 4;
        let size = f.size;
        if (f.slam) {
          // slams in oversized then settles — pure integer steps, no tweening blur
          const s0 = k < 0.10 ? 1.7 : k < 0.17 ? 1.3 : 1;
          size = Math.round(f.size * s0);
        }
        ctx.font = `700 ${size}px Silkscreen, monospace`;
        ctx.textAlign = 'center';
        const yy = f.y - 22 * easeOutQ(k);
        ctx.fillStyle = '#05060a';
        ctx.fillText(f.text, f.x + 1, yy + 1);
        ctx.fillStyle = f.color;
        ctx.fillText(f.text, f.x, yy);
        ctx.restore();
      }

      // ── K.O. banner ──
      if (koT >= 0) {
        const k = Math.min(1, (vClock - koT) / 240);
        const koY = Math.max(40, GROUND_Y - 96);
        const size = k < 0.14 ? 16 : k < 0.24 ? 13 : 11;
        ctx.font = `700 ${size}px Silkscreen, monospace`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#05060a'; ctx.fillText('K.O.', W / 2 + 1, koY + 1);
        ctx.fillStyle = '#ff9d8a'; ctx.fillText('K.O.', W / 2, koY);
      }

      const leftSide = A.tint === 'player' ? A : D;
      const rightSide = A.tint === 'player' ? D : A;
      drawHpPlate(6, 6, 'left', leftSide);
      drawHpPlate(W - 6, 6, 'right', rightSide);

      // ── state easing (frozen during hit-stop) ──
      if (frameV > 0) {
        const step = Math.min(2.2, frameV / 16.67);
        for (const s of sides) {
          s.shownHp += (s.u.hp - s.shownHp) * Math.min(1, 0.18 * step);
          if (Math.abs(s.shownHp - s.u.hp) < 0.06) s.shownHp = s.u.hp;
          if (Math.abs(s.knock) > 0.05) s.knock *= Math.pow(0.86, step);
          else s.knock = 0;
        }
        while (ghosts.length && vClock - ghosts[0].t0 > 240) ghosts.shift();
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);

      // ── critical emphasis: hard white flash, then a red bloom of the vignette ──
      const cf = vClock - critFlashT;
      if (cf >= 0 && cf < 260) {
        if (cf < 70) {
          ctx.fillStyle = `rgba(255,246,228,${0.75 * (1 - cf / 70)})`;
          ctx.fillRect(0, 0, W, H);
        }
        const rv = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.20, W / 2, H / 2, Math.max(W, H) * 0.70);
        rv.addColorStop(0, 'rgba(0,0,0,0)');
        rv.addColorStop(1, `rgba(138,20,16,${0.55 * (1 - cf / 260)})`);
        ctx.fillStyle = rv; ctx.fillRect(0, 0, W, H);
      }

      const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.34, W / 2, H / 2, Math.max(W, H) * 0.72);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(3,4,8,0.52)');
      ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);

      if (!finished) raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);
    void run();
    return () => { finished = true; cancelAnimationFrame(raf); ro.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="absolute inset-0 z-30 bg-[#05060a] overflow-hidden"
      onPointerDown={() => {
        const now = performance.now();
        if (now - lastTapRef.current < 280) skipAllRef.current();
        else skipRef.current();
        lastTapRef.current = now;
      }}>
      <div
        ref={wrapRef}
        className="absolute inset-0"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
        }}
      >
        <canvas ref={canvasRef} className="pixelated block w-full h-full" />
      </div>
      <div
        className="absolute text-[11px] text-[#e8e4d4cc] tracking-widest pointer-events-none
                   bg-[#05060abb] px-2 py-1 rounded-sm"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
          right: 'calc(env(safe-area-inset-right, 0px) + 8px)',
        }}
      >
        TAP TO SKIP ▸▸
      </div>
    </div>
  );
}
