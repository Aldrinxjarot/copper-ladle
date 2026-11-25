// The Copper Ladle — kitchen sounds, synthesised with WebAudio.
//
// No audio files: every sound is a few oscillators or a burst of filtered
// noise, made on the spot. The context is created lazily on the first user
// gesture (the start button), which is when browsers allow sound at all.

let context = null;
let master = null;
let muted = false;

export function ensureAudio() {
  if (context) {
    if (context.state === 'suspended') context.resume();
    return;
  }
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return;
  context = new AudioCtor();
  master = context.createGain();
  master.gain.value = 0.5;
  master.connect(context.destination);
}

export function isMuted() {
  return muted;
}

export function toggleMuted() {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : 0.5;
  return muted;
}

// One soft tone with a quick envelope — the brick every melodic sound is
// built from.
function tone(freq, at, dur, type = 'sine', vol = 0.5, slideTo = null) {
  if (!context || muted) return;
  const t0 = context.currentTime + at;
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain);
  gain.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

// A short burst of band-passed noise: chops, sizzles and thuds.
function noise(at, dur, freq, vol = 0.4, q = 1.2) {
  if (!context || muted) return;
  const t0 = context.currentTime + at;
  const len = Math.max(1, Math.floor(context.sampleRate * dur));
  const buffer = context.createBuffer(1, len, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = context.createBufferSource();
  src.buffer = buffer;
  const filter = context.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  filter.Q.value = q;
  const gain = context.createGain();
  gain.gain.value = vol;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  src.start(t0);
}

export const sfx = {
  click() { tone(660, 0, 0.06, 'triangle', 0.25); },
  pop() { tone(340, 0, 0.09, 'sine', 0.5, 720); },
  chop() { noise(0, 0.07, 900, 0.6, 0.8); tone(180, 0, 0.05, 'square', 0.12); },
  sizzle() { noise(0, 0.35, 5200, 0.16, 0.6); },
  bubble() { tone(300, 0, 0.12, 'sine', 0.2, 520); tone(380, 0.07, 0.1, 'sine', 0.16, 640); },
  ready() { tone(880, 0, 0.1, 'triangle', 0.35); tone(1174, 0.09, 0.14, 'triangle', 0.35); },
  ding() {
    tone(1568, 0, 0.5, 'sine', 0.4);
    tone(2093, 0.02, 0.4, 'sine', 0.22);
    tone(1046, 0.16, 0.22, 'triangle', 0.25);
  },
  coin() { tone(988, 0, 0.08, 'square', 0.16); tone(1318, 0.07, 0.16, 'square', 0.16); },
  buzz() { tone(160, 0, 0.16, 'sawtooth', 0.22, 120); },
  thud() { noise(0, 0.18, 240, 0.6, 0.7); tone(110, 0, 0.2, 'sine', 0.4, 60); },
  whistle() { tone(520, 0, 0.3, 'sine', 0.25, 880); },
};
