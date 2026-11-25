// Synthesized sound effects (WebAudio, no audio files, no network). The
// context is created on the first key press or click, so browsers' autoplay
// rules never block the page from loading. M toggles mute.
export function makeAudio() {
  return { ctx: null, muted: false, sizzle: null };
}

function ensure(audio) {
  if (audio.ctx) {
    if (audio.ctx.state === 'suspended') audio.ctx.resume();
    return audio.ctx;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  audio.ctx = new AC();
  return audio.ctx;
}

export function unlockAudio(audio) {
  ensure(audio);
}

function tone(audio, freq, dur, type, vol, slideTo) {
  if (audio.muted) return;
  const ctx = ensure(audio);
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
  gain.gain.setValueAtTime(vol || 0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + dur + 0.02);
}

function noiseBurst(audio, dur, vol, filterFreq) {
  if (audio.muted) return;
  const ctx = ensure(audio);
  if (!ctx) return;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq || 1800;
  const gain = ctx.createGain();
  gain.gain.value = vol || 0.2;
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start();
}

export const sfx = {
  pickup(audio) { tone(audio, 520, 0.07, 'triangle', 0.1, 700); },
  place(audio) { tone(audio, 300, 0.08, 'triangle', 0.1, 220); },
  chop(audio) { noiseBurst(audio, 0.06, 0.25, 2400); },
  chopped(audio) { tone(audio, 660, 0.09, 'square', 0.06, 880); tone(audio, 990, 0.12, 'sine', 0.08); },
  cooked(audio) { tone(audio, 880, 0.12, 'sine', 0.1); setTimeout(() => tone(audio, 1174, 0.16, 'sine', 0.1), 110); },
  serve(audio) { tone(audio, 784, 0.1, 'triangle', 0.12); setTimeout(() => tone(audio, 1046, 0.18, 'triangle', 0.12), 90); },
  coin(audio) { tone(audio, 1318, 0.08, 'sine', 0.09); setTimeout(() => tone(audio, 1760, 0.14, 'sine', 0.09), 70); },
  deny(audio) { tone(audio, 160, 0.14, 'sawtooth', 0.07, 120); },
  expire(audio) { tone(audio, 392, 0.2, 'sawtooth', 0.08, 196); },
  newOrder(audio) { tone(audio, 587, 0.09, 'sine', 0.08); setTimeout(() => tone(audio, 880, 0.12, 'sine', 0.08), 100); },
  rush(audio) { tone(audio, 523, 0.12, 'square', 0.07); setTimeout(() => tone(audio, 659, 0.12, 'square', 0.07), 130); setTimeout(() => tone(audio, 784, 0.2, 'square', 0.07), 260); },
  burnt(audio) { noiseBurst(audio, 0.3, 0.15, 500); },
};

// A looping filtered-noise sizzle while any burner cooks. Call every frame
// with whether something is cooking; it starts and stops the loop itself.
export function setSizzle(audio, cooking) {
  if (audio.muted) cooking = false;
  const ctx = audio.ctx;
  if (!ctx) return;
  if (cooking && !audio.sizzle) {
    const len = ctx.sampleRate;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 4200;
    filter.Q.value = 0.6;
    const gain = ctx.createGain();
    gain.gain.value = 0.035;
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start();
    audio.sizzle = { src, gain };
  } else if (!cooking && audio.sizzle) {
    try { audio.sizzle.src.stop(); } catch (e) { /* already stopped */ }
    audio.sizzle = null;
  }
}
