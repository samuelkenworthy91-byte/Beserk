// ─── Tiny WebAudio chiptune/clip synth — no audio assets needed ──────────────

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.35;
      master.connect(ctx.destination);
      const len = ctx.sampleRate * 0.5;
      noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch { return null; }
}

function tone(freq: number, dur = 0.06, type: OscillatorType = 'square', vol = 1, slide = 0) {
  const c = ac(); if (!c || !master) return;
  const o = c.createOscillator(); const g = c.createGain();
  o.type = type; o.frequency.value = freq;
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), c.currentTime + dur);
  g.gain.setValueAtTime(vol, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
  o.connect(g); g.connect(master);
  o.start(); o.stop(c.currentTime + dur + 0.02);
}

function noise(dur = 0.12, vol = 0.8, freq = 1200, q = 1) {
  const c = ac(); if (!c || !master || !noiseBuf) return;
  const s = c.createBufferSource(); s.buffer = noiseBuf;
  const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
  s.connect(f); f.connect(g); g.connect(master);
  s.start(); s.stop(c.currentTime + dur + 0.02);
}

function seq(notes: [number, number][], type: OscillatorType = 'square', vol = 0.8) {
  notes.forEach(([f, d], i) => setTimeout(() => tone(f, d, type, vol), i * 78));
}

// ─── ambient loop plumbing ───────────────────────────────────────────────────
//
// A few combat scenes want a sustained hum or weather noise that
// fades in over a few seconds and persists until explicitly stopped
// (e.g. the rain on chapter 14, the boss-rage hum). Each loop is a
// single bufferSource with a feedback filter; we re-create it on
// `start()` and gain-ramp it up; on `stop()` we ramp it down and
// disconnect.

interface AmbientLoop {
  source: AudioBufferSourceNode | null;
  filter: BiquadFilterNode | null;
  gain: GainNode | null;
  kind: 'rain' | 'bossHum' | null;
}

const loop: AmbientLoop = { source: null, filter: null, gain: null, kind: null };

function stopAmbient(fadeMs = 600) {
  const c = ac(); if (!c || !loop.gain) return;
  const g = loop.gain, s = loop.source;
  g.gain.cancelScheduledValues(c.currentTime);
  g.gain.setValueAtTime(g.gain.value, c.currentTime);
  g.gain.linearRampToValueAtTime(0.0001, c.currentTime + fadeMs / 1000);
  // disconnect after fade
  setTimeout(() => {
    try { s?.stop(); s?.disconnect(); } catch { /* already stopped */ }
    if (loop.gain === g) {
      loop.source = null; loop.filter = null; loop.gain = null; loop.kind = null;
    }
  }, fadeMs + 50);
}

function startRain() {
  const c = ac(); if (!c || !master || !noiseBuf) return;
  if (loop.kind === 'rain') return;
  // crossfade: stop any other loop first
  if (loop.kind) stopAmbient(400);

  // Build a longer noise buffer (3s) and loop it for a sustained rain
  // texture — the simple bandpass at low-freq gives a quiet hiss; we
  // stack two of them (low + high) for a wind/rain combo.
  const len = c.sampleRate * 3;
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

  const src = c.createBufferSource();
  src.buffer = buf;
  src.loop = true;

  // Lowpass + slight bandpass combo gives a soft rain hiss
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2800; lp.Q.value = 0.6;
  const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1200; bp.Q.value = 0.3;

  const g = c.createGain();
  g.gain.value = 0.0001;

  src.connect(lp); lp.connect(bp); bp.connect(g); g.connect(master);
  src.start();

  // fade in over 1.5s
  g.gain.linearRampToValueAtTime(0.18, c.currentTime + 1.5);

  loop.source = src; loop.filter = lp; loop.gain = g; loop.kind = 'rain';
}

function startBossHum() {
  const c = ac(); if (!c || !master) return;
  if (loop.kind === 'bossHum') return;
  if (loop.kind) stopAmbient(400);

  // Three detuned sawtooths + lowpass give a menacing low drone.
  const freqs = [55, 82, 110];
  const g = c.createGain(); g.gain.value = 0.0001;
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 320; lp.Q.value = 4;
  g.connect(lp); lp.connect(master);

  const oscs: OscillatorNode[] = [];
  for (const f of freqs) {
    const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
    const og = c.createGain(); og.gain.value = 0.6;
    o.connect(og); og.connect(g);
    o.start();
    oscs.push(o);
  }
  // fade in over 1s
  g.gain.linearRampToValueAtTime(0.28, c.currentTime + 1.0);

  loop.source = null;       // we have many; stopAmbient stops via disconnect callback
  loop.filter = lp;
  loop.gain = g;
  loop.kind = 'bossHum';

  // store the osc list on a closure for stopAmbient to clean up
  (loop as AmbientLoop & { _oscs?: OscillatorNode[] })._oscs = oscs;
}

function stopBossHum() {
  // for the hum we don't have a single source; stop each osc instead
  const c = ac(); if (!c || loop.kind !== 'bossHum' || !loop.gain) return;
  const g = loop.gain;
  const oscs = (loop as AmbientLoop & { _oscs?: OscillatorNode[] })._oscs ?? [];
  g.gain.cancelScheduledValues(c.currentTime);
  g.gain.setValueAtTime(g.gain.value, c.currentTime);
  g.gain.linearRampToValueAtTime(0.0001, c.currentTime + 0.6);
  setTimeout(() => {
    for (const o of oscs) {
      try { o.stop(); o.disconnect(); } catch { /* already stopped */ }
    }
    if (loop.gain === g) {
      loop.source = null; loop.filter = null; loop.gain = null; loop.kind = null;
    }
  }, 700);
}

export const sfx = {
  unlock: () => { ac(); },
  cursor: () => tone(1200, 0.03, 'square', 0.25),
  select: () => { tone(660, 0.05, 'square', 0.5); setTimeout(() => tone(990, 0.06, 'square', 0.5), 55); },
  confirm: () => seq([[700, 0.05], [1050, 0.08]], 'square', 0.55),
  cancel: () => { tone(520, 0.05, 'square', 0.5); setTimeout(() => tone(340, 0.08, 'square', 0.5), 55); },
  error: () => tone(160, 0.12, 'sawtooth', 0.5),
  phaseIn: () => seq([[392, 0.09], [523, 0.09], [659, 0.14]], 'square', 0.5),
  hit: () => { noise(0.1, 0.9, 900, 0.8); tone(140, 0.12, 'triangle', 0.9, -80); },
  crit: () => { noise(0.16, 1, 600, 0.7); tone(90, 0.22, 'sawtooth', 1, -40); tone(1400, 0.08, 'square', 0.4, -600); },
  miss: () => noise(0.08, 0.35, 2400, 2),
  swing: () => noise(0.07, 0.4, 1600, 1.5),
  bow: () => tone(900, 0.06, 'sine', 0.5, 700),
  heal: () => seq([[660, 0.08], [880, 0.08], [1100, 0.12]], 'sine', 0.4),
  levelup: () => seq([[523, 0.08], [659, 0.08], [784, 0.08], [1047, 0.16]], 'square', 0.5),
  victory: () => seq([[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.12], [784, 0.08], [1047, 0.24]], 'square', 0.55),
  gameover: () => seq([[392, 0.2], [330, 0.2], [262, 0.35]], 'triangle', 0.6),
  thunder: () => { noise(0.9, 0.8, 180, 0.4); tone(60, 0.8, 'sine', 0.5, -25); },
  broken: () => { noise(0.15, 0.7, 3000, 3); tone(220, 0.2, 'sawtooth', 0.4, -120); },
  dialog: () => tone(1500, 0.015, 'square', 0.12),

  // ── combat-specific sfx (kind from fx.ts) ─────────────────────────
  // sword clash — bright noise burst + low thump
  clash: () => { noise(0.08, 0.85, 1800, 1.2); tone(180, 0.10, 'triangle', 0.9, -60); },
  // dagger — quick, light, higher-pitched
  pierce: () => { noise(0.05, 0.6, 3200, 1.8); tone(380, 0.06, 'square', 0.7, -120); },
  // bow — sine slide up
  bowShot: () => tone(900, 0.06, 'sine', 0.5, 700),
  // spear — bone crack
  spearThrust: () => { noise(0.07, 0.7, 2400, 1.4); tone(220, 0.10, 'sawtooth', 0.7, -90); },
  // demonic — long growl
  demonic: () => { noise(0.18, 0.8, 280, 0.5); tone(70, 0.22, 'sawtooth', 0.9, -25); },
  // godhand — sub-bass blast
  godhand: () => { noise(0.22, 1, 120, 0.3); tone(48, 0.28, 'sine', 1, -16); },
  // warlord — heavy iron thud
  ironThud: () => { noise(0.10, 0.9, 220, 0.7); tone(95, 0.14, 'triangle', 0.95, -40); },
  // arcane — magical shimmer
  arcane: () => {
    noise(0.10, 0.5, 5400, 2.5);
    tone(880, 0.07, 'sine', 0.5, 600);
    setTimeout(() => tone(1320, 0.06, 'sine', 0.4, 400), 30);
  },

  // ── ambient weather + boss hum ─────────────────────────────────────
  startRain,
  stopRain: () => { if (loop.kind === 'rain') stopAmbient(800); },
  startBossHum,
  stopBossHum,

  // routing helper: pass an FxKind name, get the right SFX.
  forKind(kind: string) {
    switch (kind) {
      case 'sword':    return sfx.clash;
      case 'dagger':   return sfx.pierce;
      case 'bow':      return sfx.bowShot;
      case 'spear':    return sfx.spearThrust;
      case 'demonic':  return sfx.demonic;
      case 'godhand':  return sfx.godhand;
      case 'warlord':  return sfx.ironThud;
      case 'arcane':   return sfx.arcane;
      default:         return sfx.clash;
    }
  },
};
