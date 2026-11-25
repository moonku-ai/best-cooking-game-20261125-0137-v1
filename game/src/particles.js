// Juice: steam, chop bits, sizzle sparks, floating coin text, and a small
// trauma-based screen shake. None of it touches the simulation — it only
// draws on top of it, and it all decays back to rest on its own.
import { makeRng } from './random.js';

export function makeFx() {
  return { parts: [], floats: [], trauma: 0, time: 0 };
}

export function addShake(fx, amount) {
  fx.trauma = Math.min(1, fx.trauma + amount);
}

export function burst(fx, x, y, color, n, speed) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = speed * (0.4 + Math.random() * 0.8);
    fx.parts.push({
      x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30,
      life: 0.5 + Math.random() * 0.4, max: 0.9, size: 2 + Math.random() * 3, color,
    });
  }
}

export function steam(fx, x, y) {
  fx.parts.push({
    x: x + (Math.random() - 0.5) * 20, y, vx: (Math.random() - 0.5) * 8,
    vy: -28 - Math.random() * 14, life: 0.9, max: 0.9, size: 5 + Math.random() * 4,
    color: 'rgba(255,255,255,0.55)', steam: true,
  });
}

export function floatText(fx, x, y, text, color) {
  fx.floats.push({ x, y, text, color: color || '#ffd166', life: 1.2, max: 1.2 });
}

export function tickFx(fx, dt) {
  fx.time += dt;
  fx.trauma = Math.max(0, fx.trauma - dt * 1.4);
  for (const p of fx.parts) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (!p.steam) p.vy += 160 * dt;
  }
  fx.parts = fx.parts.filter((p) => p.life > 0);
  for (const f of fx.floats) {
    f.life -= dt;
    f.y -= 42 * dt;
  }
  fx.floats = fx.floats.filter((f) => f.life > 0);
}

// Camera offset from decaying trauma (summed sines, never per-frame noise).
export function shakeOffset(fx) {
  const s = fx.trauma * fx.trauma;
  if (s <= 0) return { x: 0, y: 0 };
  const t = fx.time * 30;
  return { x: 11 * s * Math.sin(t * 1.7), y: 8 * s * Math.sin(t * 2.3) };
}

export { makeRng };
