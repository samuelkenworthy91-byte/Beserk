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
};
