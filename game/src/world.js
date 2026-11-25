// The kitchen: one room, counters around the edges, an island in the middle.
// A station is a rectangle the chef cannot walk through, with a kind that
// says what E does there. The serving window and plating counter sit along
// the top wall, crates along the left wall, the island holds the boards and
// the stove; the floor in between is the route every order forces you to run.
import { HUD_H } from './config.js';

export const STATIONS = [
  // Ingredient crates, left wall (top to bottom).
  { id: 'crate-nasi', kind: 'crate', item: 'nasi', label: 'Nasi', x: 20, y: 132, w: 96, h: 76 },
  { id: 'crate-ayam', kind: 'crate', item: 'ayam', label: 'Ayam', x: 20, y: 228, w: 96, h: 76 },
  { id: 'crate-sayur', kind: 'crate', item: 'sayur', label: 'Sayur', x: 20, y: 324, w: 96, h: 76 },
  { id: 'crate-cabai', kind: 'crate', item: 'cabai', label: 'Cabai', x: 20, y: 420, w: 96, h: 76 },
  { id: 'crate-teh', kind: 'crate', item: 'teh', label: 'Teh', x: 20, y: 516, w: 96, h: 76 },
  { id: 'crate-telur', kind: 'crate', item: 'telur', label: 'Telur', x: 20, y: 612, w: 96, h: 76 },
  // Chopping boards on the island.
  { id: 'board-a', kind: 'board', label: 'Talenan', x: 300, y: 190, w: 170, h: 92 },
  { id: 'board-b', kind: 'board', label: 'Talenan', x: 300, y: 330, w: 170, h: 92 },
  // Stove with two burners, island bottom.
  { id: 'stove', kind: 'stove', label: 'Kompor', x: 300, y: 500, w: 230, h: 110 },
  // Plating counter and serving window, top wall.
  { id: 'plate-a', kind: 'plate', label: 'Piring Saji', x: 560, y: 112, w: 150, h: 78 },
  { id: 'plate-b', kind: 'plate', label: 'Piring Saji', x: 730, y: 112, w: 150, h: 78 },
  { id: 'window', kind: 'window', label: 'Jendela Saji', x: 920, y: 112, w: 300, h: 78 },
  // Plate stack and trash, right wall bottom.
  { id: 'plates', kind: 'plates', label: 'Piring Bersih', x: 1100, y: 600, w: 120, h: 84 },
  { id: 'trash', kind: 'trash', label: 'Tong Sampah', x: 1100, y: 700, w: 120, h: 72 },
];

// Burner slots on the stove, relative to the stove rect.
export function burnerSlots() {
  const stove = STATIONS.find((s) => s.id === 'stove');
  return [
    { x: stove.x + 52, y: stove.y + 55, r: 34 },
    { x: stove.x + 178, y: stove.y + 55, r: 34 },
  ];
}

// The nearest station whose edge is within reach of (x, y), or null.
export function nearestStation(x, y, reach) {
  let best = null;
  let bestD = Infinity;
  for (const s of STATIONS) {
    const dx = Math.max(s.x - x, 0, x - (s.x + s.w));
    const dy = Math.max(s.y - y, 0, y - (s.y + s.h));
    const d = Math.hypot(dx, dy);
    if (d <= reach && d < bestD) {
      best = s;
      bestD = d;
    }
  }
  return best;
}

// Push a circle out of every station rect and the room walls. Returns the
// corrected position; the chef never overlaps a counter.
export function collide(x, y, radius) {
  const minX = 8 + radius;
  const maxX = 1280 - 8 - radius;
  const minY = HUD_H + 4 + radius;
  const maxY = 800 - 8 - radius;
  x = Math.max(minX, Math.min(maxX, x));
  y = Math.max(minY, Math.min(maxY, y));
  for (const s of STATIONS) {
    const cx = Math.max(s.x, Math.min(x, s.x + s.w));
    const cy = Math.max(s.y, Math.min(y, s.y + s.h));
    const dx = x - cx;
    const dy = y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 >= radius * radius) continue;
    if (d2 === 0) {
      y = s.y - radius; // dead centre: push up out of the rect
      continue;
    }
    const d = Math.sqrt(d2);
    x = cx + (dx / d) * radius;
    y = cy + (dy / d) * radius;
  }
  return { x, y };
}
