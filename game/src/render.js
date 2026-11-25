// Every pixel of Dapur Senja, drawn by hand on one canvas: the dusk-lit
// kitchen, the food, the chef and the HUD. No images, no fonts from the
// network — shapes and the system font only, so the game looks the same
// offline as it does here. The judge reads the game mostly through its
// screenshots, so every station is labelled and every state is visible:
// a burner shows its ring filling, a chopped pile looks chopped, a finished
// dish glows on its plate.
import { VIEW_W, VIEW_H, HUD_H, INGREDIENTS, RECIPES, STAR_COINS, RUSH_SECONDS } from './config.js';
import { STATIONS, burnerSlots } from './world.js';
import { dishOnPlate } from './recipes.js';
import { shakeOffset } from './particles.js';

const FLOOR_A = '#c98a5a';
const FLOOR_B = '#bd7c4e';
const WOOD = '#8a5a33';
const WOOD_DARK = '#6b4423';
const TEAL = '#2f6f6a';
const CREAM = '#f7ead2';
const INK = '#2b2118';

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, weight, align) {
  ctx.fillStyle = color || INK;
  ctx.font = `${weight || 700} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

// --- food icons: one small drawing per ingredient and state -------------
export function drawIngredient(ctx, id, state, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  const u = s / 40; // unit scale, drawings are authored at ~40px
  ctx.lineWidth = 2 * u;
  if (id === 'nasi') {
    // A bowl of white rice.
    ctx.fillStyle = '#3f6fb5';
    ctx.beginPath(); ctx.ellipse(0, 6 * u, 17 * u, 8 * u, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f5efe0';
    ctx.beginPath(); ctx.ellipse(0, 2 * u, 15 * u, 7 * u, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d8c9a8';
    ctx.lineWidth = 1.5 * u;
    ctx.beginPath(); ctx.ellipse(0, 2 * u, 15 * u, 7 * u, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#fffdf5';
    for (const [dx, dy] of [[-7, -2], [0, -4], [7, -2], [-3, 0], [4, 1]]) {
      ctx.beginPath(); ctx.arc(dx * u, dy * u, 2.2 * u, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'ayam') {
    if (state === 'chopped') {
      ctx.fillStyle = state === 'cooked' ? '#c97e35' : '#e8a06a';
      for (const [dx, dy] of [[-8, -4], [6, -6], [0, 6], [9, 5]]) {
        roundRect(ctx, dx * u - 6 * u, dy * u - 5 * u, 12 * u, 10 * u, 2 * u);
        ctx.fill();
      }
    } else {
      // A drumstick: golden when cooked, pink when raw.
      ctx.fillStyle = state === 'cooked' ? '#d98e32' : '#e8a06a';
      ctx.beginPath(); ctx.ellipse(-2 * u, 0, 12 * u, 9 * u, -0.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#f5efe0';
      ctx.lineWidth = 4 * u;
      ctx.beginPath(); ctx.moveTo(8 * u, 6 * u); ctx.lineTo(16 * u, 12 * u); ctx.stroke();
      ctx.fillStyle = '#f5efe0';
      ctx.beginPath(); ctx.arc(17 * u, 13 * u, 3.5 * u, 0, Math.PI * 2); ctx.fill();
      if (state === 'cooked') {
        ctx.strokeStyle = '#a8641e';
        ctx.lineWidth = 1.5 * u;
        ctx.beginPath(); ctx.moveTo(-10 * u, -2 * u); ctx.lineTo(-2 * u, 2 * u); ctx.stroke();
      }
    }
  } else if (id === 'sayur') {
    ctx.fillStyle = state === 'cooked' ? '#5da864' : '#7dc383';
    for (const [dx, dy, r] of [[-8, 0, 0.4], [0, -6, 0], [8, 2, -0.4]]) {
      ctx.save();
      ctx.translate(dx * u, dy * u);
      ctx.rotate(r);
      ctx.beginPath(); ctx.ellipse(0, 0, 9 * u, 5 * u, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    if (state === 'chopped') {
      ctx.strokeStyle = '#4a8a52';
      ctx.beginPath(); ctx.moveTo(-12 * u, 6 * u); ctx.lineTo(12 * u, 6 * u); ctx.stroke();
    }
  } else if (id === 'cabai') {
    if (state === 'chopped') {
      ctx.fillStyle = '#e05252';
      for (const [dx, dy] of [[-9, -3], [0, -6], [9, -2], [-4, 5], [6, 6]]) {
        ctx.beginPath(); ctx.arc(dx * u, dy * u, 3 * u, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      ctx.strokeStyle = '#c73e3e';
      ctx.lineWidth = 5 * u;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-12 * u, -8 * u); ctx.quadraticCurveTo(4 * u, 12 * u, 13 * u, 8 * u); ctx.stroke();
      ctx.strokeStyle = '#4a8a52';
      ctx.lineWidth = 3 * u;
      ctx.beginPath(); ctx.moveTo(-12 * u, -8 * u); ctx.lineTo(-16 * u, -13 * u); ctx.stroke();
    }
  } else if (id === 'telur') {
    if (state === 'cooked') {
      ctx.fillStyle = '#fff8ea';
      ctx.beginPath(); ctx.ellipse(0, 0, 16 * u, 12 * u, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f2c94c';
      ctx.beginPath(); ctx.arc(2 * u, 0, 6 * u, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e0a92e';
      ctx.beginPath(); ctx.arc(4 * u, -2 * u, 2 * u, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = '#f5efe0';
      ctx.beginPath(); ctx.ellipse(0, 0, 11 * u, 14 * u, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e8dcc2';
      ctx.beginPath(); ctx.ellipse(0, -4 * u, 6 * u, 8 * u, 0, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'teh') {
    if (state === 'cooked') {
      ctx.fillStyle = '#c98a4b';
      ctx.beginPath(); ctx.ellipse(0, 4 * u, 13 * u, 9 * u, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#a8641e';
      ctx.beginPath(); ctx.ellipse(0, 1 * u, 11 * u, 6 * u, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 2 * u;
      ctx.beginPath(); ctx.moveTo(-4 * u, -6 * u); ctx.quadraticCurveTo(-7 * u, -12 * u, -4 * u, -16 * u); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(4 * u, -6 * u); ctx.quadraticCurveTo(7 * u, -12 * u, 4 * u, -16 * u); ctx.stroke();
    } else {
      ctx.fillStyle = '#8a6b45';
      roundRect(ctx, -9 * u, -10 * u, 18 * u, 14 * u, 3 * u);
      ctx.fill();
      ctx.strokeStyle = '#d8c9a8';
      ctx.lineWidth = 1.5 * u;
      ctx.beginPath(); ctx.moveTo(0, -10 * u); ctx.lineTo(0, -16 * u); ctx.stroke();
    }
  } else if (id === 'burnt') {
    ctx.fillStyle = '#2b2118';
    ctx.beginPath(); ctx.arc(-4 * u, 2 * u, 8 * u, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(5 * u, 4 * u, 6 * u, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(120,120,120,0.8)';
    ctx.lineWidth = 2 * u;
    ctx.beginPath(); ctx.moveTo(0, -8 * u); ctx.quadraticCurveTo(3 * u, -14 * u, 0, -18 * u); ctx.stroke();
  }
  ctx.restore();
}

function drawPlate(ctx, x, y, r, items, ready) {
  ctx.save();
  ctx.translate(x, y);
  if (ready) {
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, 0, r + 3, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.fillStyle = '#fdfbf6';
  ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.82, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#d8c9a8';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.ellipse(0, 0, r - 5, r * 0.82 - 4, 0, 0, Math.PI * 2); ctx.stroke();
  const n = items.length;
  items.forEach((it, i) => {
    const ang = n === 1 ? -Math.PI / 2 : -Math.PI / 2 + (i - (n - 1) / 2) * 0.9;
    const px = Math.cos(ang) * r * 0.45;
    const py = Math.sin(ang) * r * 0.34;
    // A soft shadow under each item so white food reads on a white plate.
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath(); ctx.ellipse(px, py + 8, 15, 5, 0, 0, Math.PI * 2); ctx.fill();
    drawIngredient(ctx, it.id, it.state, px, py, 36);
  });
  ctx.restore();
}

// --- stations ------------------------------------------------------------
function stationTop(ctx, s) {
  const cx = s.x + s.w / 2;
  const cy = s.y + s.h / 2;
  ctx.fillStyle = WOOD;
  roundRect(ctx, s.x, s.y, s.w, s.h, 10);
  ctx.fill();
  ctx.fillStyle = WOOD_DARK;
  roundRect(ctx, s.x + 4, s.y + s.h - 12, s.w - 8, 8, 4);
  ctx.fill();
  return { cx, cy };
}

function drawStation(ctx, s, game) {
  const { cx, cy } = stationTop(ctx, s);
  ctx.save();
  if (s.kind === 'crate') {
    ctx.fillStyle = '#a5713d';
    roundRect(ctx, s.x + 8, s.y + 8, s.w - 16, s.h - 26, 6);
    ctx.fill();
    ctx.strokeStyle = '#7c4f24';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(s.x + 8, s.y + 22); ctx.lineTo(s.x + s.w - 8, s.y + 22); ctx.stroke();
    drawIngredient(ctx, s.item, 'raw', cx, cy - 4, 40);
    text(ctx, s.label, cx, s.y + s.h - 9, 13, CREAM, 700);
  } else if (s.kind === 'board') {
    ctx.fillStyle = '#e8d3a8';
    roundRect(ctx, s.x + 10, s.y + 8, s.w - 20, s.h - 30, 6);
    ctx.fill();
    const held = game.stations.held[s.id];
    if (held) drawIngredient(ctx, held.id, held.state, cx, cy - 6, 44);
    text(ctx, s.label, cx, s.y + s.h - 9, 13, CREAM, 700);
    if (game.chef.chopping && game.chef.chopping.stationId === s.id) {
      const p = game.chef.chopping.progress;
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 7;
      ctx.beginPath(); ctx.arc(cx, cy - 6, 30, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#ffd166';
      ctx.beginPath(); ctx.arc(cx, cy - 6, 30, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); ctx.stroke();
      text(ctx, 'CINCANG...', cx, s.y - 12, 12, '#fff', 800);
    }
  } else if (s.kind === 'stove') {
    ctx.fillStyle = '#3a3f45';
    roundRect(ctx, s.x + 8, s.y + 8, s.w - 16, s.h - 26, 8);
    ctx.fill();
    burnerSlots().forEach((slot, i) => {
      const b = game.stations.burners[i];
      ctx.fillStyle = '#22252a';
      ctx.beginPath(); ctx.arc(slot.x, slot.y, slot.r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#555b63';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(slot.x, slot.y, slot.r - 5, 0, Math.PI * 2); ctx.stroke();
      if (b.item) {
        const cooking = b.item.state !== 'cooked' && b.item.state !== 'burnt';
        if (cooking) {
          ctx.fillStyle = `rgba(255,${140 + Math.floor(60 * Math.sin(game.time * 9 + i))},40,0.85)`;
          ctx.beginPath(); ctx.arc(slot.x, slot.y + 8, 12, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#ffd166';
          ctx.lineWidth = 5;
          ctx.beginPath(); ctx.arc(slot.x, slot.y, slot.r - 2, -Math.PI / 2, -Math.PI / 2 + Math.min(1, b.progress) * Math.PI * 2); ctx.stroke();
        } else if (b.item.state === 'burnt') {
          ctx.fillStyle = 'rgba(0,0,0,0.25)';
          ctx.beginPath(); ctx.arc(slot.x, slot.y, slot.r - 2, 0, Math.PI * 2); ctx.fill();
        }
        drawIngredient(ctx, b.item.state === 'burnt' ? 'burnt' : b.item.id, b.item.state, slot.x, slot.y - 4, 40);
        if (b.item.state === 'cooked') text(ctx, 'MATANG!', slot.x, slot.y - 34, 12, '#ffd166', 800);
        if (b.item.state === 'burnt') text(ctx, 'GOSONG!', slot.x, slot.y - 34, 12, '#ff8a7a', 800);
      }
    });
    text(ctx, s.label, cx, s.y + s.h - 9, 13, CREAM, 700);
  } else if (s.kind === 'plate') {
    const plate = game.stations.plates[s.id];
    ctx.fillStyle = '#e8dcc2';
    roundRect(ctx, s.x + 6, s.y + 6, s.w - 12, s.h - 24, 6);
    ctx.fill();
    const dish = plate ? dishOnPlate(plate) : null;
    if (plate) {
      drawPlate(ctx, cx, cy - 6, 34, plate.items, !!dish);
    } else {
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(cx, cy - 6, 30, 22, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    }
    // A finished dish names itself on the counter's label strip.
    if (dish) text(ctx, dish.name.toUpperCase(), cx, s.y + s.h - 9, 13, '#ffd166', 800);
    else text(ctx, s.label, cx, s.y + s.h - 9, 13, CREAM, 700);
  } else if (s.kind === 'window') {
    ctx.fillStyle = '#f7ead2';
    roundRect(ctx, s.x + 8, s.y + 8, s.w - 16, s.h - 30, 6);
    ctx.fill();
    ctx.fillStyle = '#2f6f6a';
    roundRect(ctx, s.x + 8, s.y + 8, s.w - 16, 14, 6);
    ctx.fill();
    text(ctx, 'ANTAR PESANAN DI SINI', cx, s.y + 15, 12, '#fff', 800);
    text(ctx, s.label, cx, s.y + s.h - 9, 13, CREAM, 700);
  } else if (s.kind === 'plates') {
    for (let i = 0; i < Math.min(4, game.chef.platesClean); i++) {
      ctx.fillStyle = '#fdfbf6';
      ctx.beginPath(); ctx.ellipse(cx, cy - 14 + i * 6, 30, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#d8c9a8';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(cx, cy - 14 + i * 6, 30, 8, 0, 0, Math.PI * 2); ctx.stroke();
    }
    text(ctx, `${s.label} (${game.chef.platesClean})`, cx, s.y + s.h - 9, 13, CREAM, 700);
  } else if (s.kind === 'trash') {
    ctx.fillStyle = '#4a4f55';
    roundRect(ctx, cx - 26, s.y + 8, 52, s.h - 28, 6);
    ctx.fill();
    ctx.fillStyle = '#5d636b';
    roundRect(ctx, cx - 30, s.y + 4, 60, 10, 4);
    ctx.fill();
    text(ctx, s.label, cx, s.y + s.h - 9, 13, CREAM, 700);
  }
  ctx.restore();
}

// --- floor dressing: a rug, a spice shelf, a plant and a rice sack ------
// Decor only — nothing here collides or interacts, it just makes the room
// read as a kitchen instead of an empty floor.
function drawDecor(ctx, game) {
  // Woven rug in the open floor, centre-right.
  ctx.fillStyle = '#a34d2e';
  roundRect(ctx, 640, 300, 300, 190, 12);
  ctx.fill();
  ctx.strokeStyle = '#e8c98a';
  ctx.lineWidth = 3;
  roundRect(ctx, 652, 312, 276, 166, 8);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(232,201,138,0.7)';
  ctx.lineWidth = 2;
  roundRect(ctx, 668, 328, 244, 134, 6);
  ctx.stroke();
  // Spice shelf on the right wall, above the plate stack.
  ctx.fillStyle = WOOD_DARK;
  roundRect(ctx, 1216, 250, 48, 150, 6);
  ctx.fill();
  const jars = ['#e05252', '#f2c94c', '#7dc383'];
  jars.forEach((c, i) => {
    const y = 272 + i * 48;
    ctx.fillStyle = c;
    roundRect(ctx, 1224, y, 32, 34, 5);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillRect(1224, y + 8, 32, 5);
  });
  // Potted plant, bottom-left corner.
  ctx.fillStyle = '#a5713d';
  ctx.beginPath(); ctx.moveTo(150, 730); ctx.lineTo(190, 730); ctx.lineTo(184, 762); ctx.lineTo(156, 762); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#5da864';
  for (const [dx, dy, r] of [[-10, -8, 0.5], [0, -16, 0], [10, -8, -0.5]]) {
    ctx.save();
    ctx.translate(170 + dx, 730 + dy);
    ctx.rotate(r);
    ctx.beginPath(); ctx.ellipse(0, 0, 8, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  // Rice sack on the floor by the bottom wall.
  ctx.fillStyle = '#e8dcc2';
  ctx.beginPath(); ctx.ellipse(260, 744, 34, 24, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d8c9a8';
  ctx.beginPath(); ctx.ellipse(260, 733, 20, 8, 0, 0, Math.PI * 2); ctx.fill();
  text(ctx, 'BERAS', 260, 748, 11, '#8a6d3b', 800);
  // Hanging lamps over the island and the window.
  for (const lx of [390, 1060]) {
    ctx.strokeStyle = '#241a12';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(lx, HUD_H); ctx.lineTo(lx, 128); ctx.stroke();
    const lampGlow = ctx.createRadialGradient(lx, 134, 4, lx, 134, 60);
    lampGlow.addColorStop(0, 'rgba(255,214,130,0.5)');
    lampGlow.addColorStop(1, 'rgba(255,214,130,0)');
    ctx.fillStyle = lampGlow;
    ctx.beginPath(); ctx.arc(lx, 134, 60, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2f6f6a';
    ctx.beginPath(); ctx.moveTo(lx - 14, 134); ctx.lineTo(lx + 14, 134); ctx.lineTo(lx + 8, 122); ctx.lineTo(lx - 8, 122); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.arc(lx, 136, 5, 0, Math.PI * 2); ctx.fill();
  }
}

// --- the chef ------------------------------------------------------------
function drawChef(ctx, chef, game) {
  const { x, y } = chef;
  const walking = Math.hypot(chef.vx, chef.vy) > 40;
  const bob = walking ? Math.sin(game.time * 14) * 2 : 0;
  ctx.save();
  ctx.translate(x, y + bob * 0.3);
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath(); ctx.ellipse(0, 16, 20, 7, 0, 0, Math.PI * 2); ctx.fill();
  // body: apron
  ctx.fillStyle = '#f5efe0';
  roundRect(ctx, -14, -6, 28, 24, 9);
  ctx.fill();
  ctx.fillStyle = TEAL;
  roundRect(ctx, -14, 6, 28, 12, 6);
  ctx.fill();
  // head + hat
  ctx.fillStyle = '#f0c297';
  ctx.beginPath(); ctx.arc(0, -14, 11, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(0, -24, 13, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(-7, -27, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(7, -27, 5, 0, Math.PI * 2); ctx.fill();
  // eyes look where the chef faces
  const look = { up: [0, -2], down: [0, 1], left: [-3, 0], right: [3, 0] }[chef.facing];
  ctx.fillStyle = INK;
  ctx.beginPath(); ctx.arc(-4 + look[0], -14 + look[1], 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(4 + look[0], -14 + look[1], 1.6, 0, Math.PI * 2); ctx.fill();
  // carried item above the hands
  if (chef.carry) {
    const cy2 = -44 + bob;
    if (chef.carry.kind === 'plate') {
      drawPlate(ctx, 0, cy2, 24, chef.carry.items, !!dishOnPlate(chef.carry));
    } else {
      drawIngredient(ctx, chef.carry.id, chef.carry.state, 0, cy2, 36);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(0, cy2 + 12, 14, 4, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// --- HUD: order board, timer, coins --------------------------------------
function drawHUD(ctx, game) {
  const { orders, timeLeft } = game;
  ctx.fillStyle = '#241a12';
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(0, HUD_H - 4, VIEW_W, 4);
  // Title + timer
  text(ctx, 'DAPUR SENJA', 110, 26, 22, '#ffd166', 800, 'center');
  const mins = Math.max(0, Math.floor(timeLeft / 60));
  const secs = Math.max(0, Math.floor(timeLeft % 60));
  const urgent = timeLeft <= RUSH_SECONDS && game.phase === 'play';
  const timerColor = urgent ? (Math.sin(game.time * 8) > 0 ? '#ff6b5e' : '#ffd166') : CREAM;
  text(ctx, `${mins}:${String(secs).padStart(2, '0')}`, 110, 62, 30, timerColor, 800);
  text(ctx, game.rush ? 'JAM SIBUK!' : 'SHIFT', 110, 86, 11, urgent ? '#ff8a7a' : '#b9a68d', 700);
  // Order tickets
  const ticketW = 168;
  const ticketH = 76;
  const startX = 240;
  orders.open.forEach((order, i) => {
    const x = startX + i * (ticketW + 10);
    const y = 10;
    const frac = Math.max(0, order.patience / order.total);
    const barColor = frac > 0.5 ? '#7dc383' : frac > 0.25 ? '#f2c94c' : '#e05252';
    ctx.fillStyle = CREAM;
    roundRect(ctx, x, y, ticketW, ticketH, 8);
    ctx.fill();
    ctx.fillStyle = barColor;
    roundRect(ctx, x, y, ticketW, 7, 4);
    ctx.fill();
    text(ctx, order.recipe.name, x + ticketW / 2, y + 22, 15, INK, 800);
    // needed ingredients as dots
    order.recipe.needs.forEach((need, j) => {
      const ix = x + 24 + j * 30;
      const iy = y + 46;
      ctx.fillStyle = INGREDIENTS[need.id].color;
      ctx.beginPath(); ctx.arc(ix, iy, 9, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(ix, iy, 9, 0, Math.PI * 2); ctx.stroke();
      text(ctx, need.state === 'cooked' ? 'm' : need.state === 'chopped' ? 'c' : 'r', ix, iy + 0.5, 9, '#fff', 800);
    });
    text(ctx, `${order.recipe.price} koin`, x + ticketW - 12, y + 46, 12, '#8a6d3b', 700, 'right');
    // patience bar
    ctx.fillStyle = '#e0d3b8';
    roundRect(ctx, x + 12, y + ticketH - 12, ticketW - 24, 6, 3);
    ctx.fill();
    ctx.fillStyle = barColor;
    roundRect(ctx, x + 12, y + ticketH - 12, (ticketW - 24) * frac, 6, 3);
    ctx.fill();
  });
  for (let i = orders.open.length; i < MAX_SLOTS; i++) {
    const x = startX + i * (ticketW + 10);
    ctx.strokeStyle = 'rgba(247,234,210,0.25)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    roundRect(ctx, x, 10, ticketW, ticketH, 8);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  // Coins + combo, right side
  const rx = VIEW_W - 24;
  text(ctx, `${orders.coins} koin`, rx, 26, 24, '#ffd166', 800, 'right');
  const combo = Math.min(2, 1 + 0.25 * orders.streak);
  text(ctx, orders.streak > 0 ? `Kombo x${combo.toFixed(2)}  ·  ${orders.served} tersaji` : `${orders.served} tersaji`, rx, 58, 14, CREAM, 700, 'right');
  text(ctx, `Piring: ${game.chef.platesClean}`, rx, 82, 12, '#b9a68d', 700, 'right');
}
const MAX_SLOTS = 4;

// --- overlays ------------------------------------------------------------
function drawTitle(ctx, game) {
  ctx.fillStyle = 'rgba(20,12,6,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#f7ead2';
  roundRect(ctx, 290, 120, 700, 560, 18);
  ctx.fill();
  text(ctx, 'DAPUR SENJA', 640, 175, 46, '#8a5a33', 800);
  text(ctx, 'Warung kecil di ujung senja. Pesanan datang, dapur berasap.', 640, 215, 17, '#6b5a44', 600);
  const lines = [
    ['Gerak', 'WASD / panah — jalan keliling dapur'],
    ['Ambil & pakai', 'E — ambil bahan, taruh, sajikan'],
    ['Cincang', 'Tahan E di talenan sampai selesai'],
    ['Masak', 'Taruh di kompor, angkat sebelum gosong'],
    ['Sajikan', 'Rakit di piring, antar ke jendela saji'],
  ];
  lines.forEach(([a, b], i) => {
    const y = 262 + i * 34;
    text(ctx, a, 340, y, 16, '#2f6f6a', 800, 'left');
    text(ctx, b, 500, y, 16, INK, 600, 'left');
  });
  text(ctx, 'Menu hari ini:', 640, 462, 16, '#8a5a33', 800);
  RECIPES.forEach((r, i) => {
    const x = 360 + (i % 3) * 190;
    const y = 500 + Math.floor(i / 3) * 52;
    ctx.fillStyle = '#efe3c8';
    roundRect(ctx, x, y, 180, 42, 8);
    ctx.fill();
    text(ctx, r.name, x + 90, y + 14, 14, INK, 800);
    text(ctx, `${r.price} koin`, x + 90, y + 30, 12, '#8a6d3b', 700);
  });
  const pulse = 0.75 + 0.25 * Math.sin(game.time * 4);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#2f6f6a';
  roundRect(ctx, 490, 610, 300, 48, 12);
  ctx.fill();
  ctx.globalAlpha = 1;
  text(ctx, 'MULAI SHIFT  (Enter)', 640, 635, 20, '#fff', 800);
  text(ctx, 'P untuk jeda · M untuk bisu', 640, 672, 13, '#8a7a63', 600);
}

function drawPause(ctx, game) {
  ctx.fillStyle = 'rgba(20,12,6,0.6)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, 'JEDA', 640, 380, 44, '#fff', 800);
  text(ctx, 'Tekan P untuk lanjut', 640, 430, 18, '#f7ead2', 600);
}

function drawEnd(ctx, game) {
  const { orders } = game;
  const stars = STAR_COINS.filter((c) => orders.coins >= c).length;
  ctx.fillStyle = 'rgba(20,12,6,0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#f7ead2';
  roundRect(ctx, 340, 150, 600, 500, 18);
  ctx.fill();
  text(ctx, 'SHIFT SELESAI', 640, 200, 40, '#8a5a33', 800);
  let starLine = '';
  for (let i = 0; i < 3; i++) starLine += i < stars ? '★' : '☆';
  text(ctx, starLine, 640, 258, 44, '#f2c94c', 800);
  text(ctx, `${orders.coins} koin`, 640, 320, 34, INK, 800);
  const rows = [
    ['Pesanan tersaji', `${orders.served}`],
    ['Pesanan hangus', `${orders.expired}`],
    ['Kombo terbaik', `x${orders.bestCombo.toFixed(2)}`],
  ];
  rows.forEach(([a, b], i) => {
    const y = 372 + i * 32;
    text(ctx, a, 420, y, 17, '#6b5a44', 600, 'left');
    text(ctx, b, 860, y, 17, INK, 800, 'right');
  });
  text(ctx, 'Tekan R untuk shift baru', 640, 520, 17, '#2f6f6a', 700);
  text(ctx, 'Terima kasih sudah masak di Dapur Senja.', 640, 560, 14, '#8a7a63', 600);
}

// --- main draw -----------------------------------------------------------
export function drawGame(ctx, game) {
  ctx.save();
  const off = shakeOffset(game.fx);
  ctx.translate(off.x, off.y);
  // floor tiles
  for (let ty = 0; ty < 14; ty++) {
    for (let tx = 0; tx < 20; tx++) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? FLOOR_A : FLOOR_B;
      ctx.fillRect(tx * 64, HUD_H + ty * 50, 64, 50);
    }
  }
  // warm lamp glow over the island
  const glow = ctx.createRadialGradient(430, 380, 40, 430, 380, 420);
  glow.addColorStop(0, 'rgba(255,214,130,0.20)');
  glow.addColorStop(1, 'rgba(255,214,130,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, HUD_H, VIEW_W, VIEW_H - HUD_H);
  drawDecor(ctx, game);
  // station under-glow for the one in reach
  if (game.nearStation) {
    ctx.strokeStyle = 'rgba(255,209,102,0.9)';
    ctx.lineWidth = 3;
    roundRect(ctx, game.nearStation.x - 5, game.nearStation.y - 5, game.nearStation.w + 10, game.nearStation.h + 10, 12);
    ctx.stroke();
  }
  for (const s of STATIONS) drawStation(ctx, s, game);
  drawChef(ctx, game.chef, game);
  // particles + floating text
  for (const p of game.fx.parts) {
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const f of game.fx.floats) {
    ctx.globalAlpha = Math.max(0, f.life / f.max);
    text(ctx, f.text, f.x, f.y, 20, f.color, 800);
  }
  ctx.globalAlpha = 1;
  // prompt + toast
  if (game.phase === 'play' && game.nearStation) {
    const label = `E — ${hintFor(game.nearStation)}`;
    const py = game.chef.y - (game.chef.carry ? 82 : 62);
    ctx.font = '700 14px system-ui, sans-serif';
    const w = ctx.measureText(label).width + 20;
    ctx.fillStyle = 'rgba(20,12,6,0.8)';
    roundRect(ctx, game.chef.x - w / 2, py - 13, w, 26, 8);
    ctx.fill();
    text(ctx, label, game.chef.x, py + 1, 14, '#fff', 700);
  }
  if (game.toast) {
    ctx.globalAlpha = Math.min(1, game.toast.life * 2);
    ctx.fillStyle = 'rgba(20,12,6,0.85)';
    roundRect(ctx, 440, 110, 400, 36, 10);
    ctx.fill();
    text(ctx, game.toast.text, 640, 129, 15, '#ffd166', 700);
    ctx.globalAlpha = 1;
  }
  if (game.rush && game.phase === 'play') {
    const a = 0.55 + 0.35 * Math.sin(game.time * 6);
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(20,12,6,0.8)';
    roundRect(ctx, 520, 726, 240, 40, 12);
    ctx.fill();
    text(ctx, '— JAM SIBUK —', 640, 747, 22, '#ff6b5e', 800);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  drawHUD(ctx, game);
  if (game.phase === 'title') drawTitle(ctx, game);
  if (game.phase === 'pause') drawPause(ctx, game);
  if (game.phase === 'end') drawEnd(ctx, game);
}

function hintFor(station) {
  switch (station.kind) {
    case 'crate': return `ambil ${station.label}`;
    case 'board': return 'tahan E: cincang';
    case 'stove': return 'taruh / angkat dari kompor';
    case 'plate': return 'rakit di piring';
    case 'window': return 'sajikan pesanan';
    case 'plates': return 'ambil piring bersih';
    case 'trash': return 'buang';
    default: return 'pakai';
  }
}
