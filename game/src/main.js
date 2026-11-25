// Dapur Senja — boot, loop and the shift's state machine.
// Screens: title -> play <-> pause -> end. ?shot=play|rush|serve|end
// freezes a staged mid-action kitchen for screenshots instead of playing.
import { VIEW_W, VIEW_H, SHIFT_SECONDS, RUSH_SECONDS, PLATE_RETURN_SECONDS } from './config.js';
import { makeRng } from './random.js';
import { makeOrders, tickOrders, serveDish } from './orders.js';
import { makeChef, moveChef, interact, holdChop, tickBurners, tickPlates } from './chef.js';
import { nearestStation, STATIONS, burnerSlots } from './world.js';
import { INTERACT_REACH, CHEF_RADIUS } from './config.js';
import { makeFx, tickFx, burst, steam, floatText, addShake } from './particles.js';
import { makeAudio, unlockAudio, sfx, setSizzle } from './audio.js';
import { makeInput, bindInput, endFrame } from './input.js';
import { drawGame } from './render.js';
import { stageShot } from './shots.js';

const DENY_TEXT = {
  'hands-full': 'Tangan sudah penuh!',
  'need-item': 'Bawa bahan dulu.',
  'no-chop': 'Bahan ini tidak perlu dicincang.',
  'already-chopped': 'Sudah dicincang.',
  'burners-full': 'Kompor penuh!',
  'no-cook': 'Bahan ini tidak dimasak.',
  'already-cooked': 'Sudah matang.',
  'chop-first': 'Cincang dulu di talenan.',
  'nothing-ready': 'Belum ada yang matang.',
  'counter-busy': 'Meja ini sudah terisi.',
  'need-plate': 'Taruh piring dulu di meja.',
  'not-in-recipe': 'Bahan itu tidak cocok di piring ini.',
  'nothing-here': 'Tidak ada yang bisa diambil.',
  'no-plates': 'Piring habis — tunggu piring kembali.',
  'need-dish': 'Bawa piring berisi hidangan.',
  'not-a-dish': 'Ini belum jadi hidangan.',
};

export function newGame(seed) {
  const rng = makeRng(seed);
  return {
    rng,
    seed,
    phase: 'title',
    time: 0,
    elapsed: 0,
    timeLeft: SHIFT_SECONDS,
    rush: false,
    rushAnnounced: false,
    orders: makeOrders(rng),
    chef: makeChef(),
    stations: {
      held: { 'board-a': null, 'board-b': null },
      burners: [
        { item: null, progress: 0, overcook: 0, burnt: false },
        { item: null, progress: 0, overcook: 0, burnt: false },
      ],
      plates: { 'plate-a': null, 'plate-b': null },
    },
    fx: makeFx(),
    audio: makeAudio(),
    nearStation: null,
    toast: null,
    walkTarget: null, // { x, y, station } from a mouse click
    muted: false,
  };
}

function toast(game, text) {
  game.toast = { text, life: 2.2 };
}

function handleEvent(game, ev) {
  if (!ev) return;
  const chef = game.chef;
  const audio = game.audio;
  switch (ev.type) {
    case 'pickup': sfx.pickup(audio); break;
    case 'place': sfx.place(audio); break;
    case 'chopped':
      sfx.chopped(audio);
      burst(game.fx, chef.x, chef.y - 30, '#7dc383', 8, 90);
      break;
    case 'cooked':
      sfx.cooked(audio);
      break;
    case 'burnt':
      sfx.burnt(audio);
      toast(game, 'Gosong! Buang ke tong sampah.');
      addShake(game.fx, 0.3);
      break;
    case 'dish-ready':
      sfx.cooked(audio);
      floatText(game.fx, chef.x, chef.y - 60, `${ev.dish.name} siap!`, '#7dc383');
      break;
    case 'serve': {
      const res = serveDish(game.orders, ev.dish, game.elapsed);
      if (res.paid > 0) {
        chef.carry = null;
        chef.plateReturnIn.push(PLATE_RETURN_SECONDS);
        sfx.serve(audio);
        setTimeout(() => sfx.coin(audio), 120);
        floatText(game.fx, chef.x, chef.y - 60, `+${res.paid} koin`, '#ffd166');
        burst(game.fx, chef.x, chef.y - 20, '#ffd166', 14, 120);
        addShake(game.fx, 0.25);
      } else {
        sfx.deny(audio);
        toast(game, 'Tidak ada pesanan yang minta hidangan ini.');
      }
      break;
    }
    case 'trash':
      sfx.place(audio);
      break;
    case 'deny':
      sfx.deny(audio);
      toast(game, DENY_TEXT[ev.why] || 'Tidak bisa.');
      break;
    case 'new-order':
      sfx.newOrder(audio);
      break;
    case 'expired':
      sfx.expire(audio);
      toast(game, `Pesanan ${ev.order.recipe.name} hangus — pelanggan pergi.`);
      addShake(game.fx, 0.2);
      break;
    default: break;
  }
}

function startShift(game) {
  const fresh = newGame(game.seed);
  Object.assign(game, fresh, { phase: 'play' });
}

function update(game, dt, input) {
  game.time += dt;
  tickFx(game.fx, dt);
  if (game.toast) {
    game.toast.life -= dt;
    if (game.toast.life <= 0) game.toast = null;
  }
  if (input.pressed.mute) {
    game.audio.muted = !game.audio.muted;
    game.muted = game.audio.muted;
  }
  if (game.phase === 'title') {
    if (input.pressed.start) startShift(game);
    if (input.click) {
      const c = input.click;
      if (c.x >= 490 && c.x <= 790 && c.y >= 610 && c.y <= 658) startShift(game);
    }
    return;
  }
  if (game.phase === 'end') {
    if (input.pressed.restart) startShift(game);
    return;
  }
  if (input.pressed.pause) {
    game.phase = game.phase === 'pause' ? 'play' : 'pause';
    return;
  }
  if (game.phase === 'pause') return;

  // --- play ---
  game.elapsed += dt;
  game.timeLeft = Math.max(0, SHIFT_SECONDS - game.elapsed);
  if (!game.rush && game.timeLeft <= RUSH_SECONDS) {
    game.rush = true;
    sfx.rush(game.audio);
    toast(game, 'Jam sibuk! Pesanan datang lebih cepat.');
  }
  // Click-to-move: walk to the clicked station, use it on arrival.
  if (input.click) {
    const c = input.click;
    const station = STATIONS.find((s) => c.x >= s.x && c.x <= s.x + s.w && c.y >= s.y && c.y <= s.y + s.h);
    if (station) {
      game.walkTarget = { station, x: station.x + station.w / 2, y: station.y + station.h + 46 };
      if (station.y + station.h + 46 > 780) game.walkTarget.y = station.y - 46;
    } else {
      game.walkTarget = { station: null, x: c.x, y: c.y };
    }
  }
  if (game.walkTarget) {
    const t = game.walkTarget;
    const dx = t.x - game.chef.x;
    const dy = t.y - game.chef.y;
    const d = Math.hypot(dx, dy);
    const keys = {
      up: dy < -8, down: dy > 8, left: dx < -8, right: dx > 8, interact: false,
    };
    if (t.station) {
      const near = nearestStation(game.chef.x, game.chef.y, INTERACT_REACH + CHEF_RADIUS);
      if (near === t.station || d < 26) {
        handleEvent(game, interact(game.chef, game.stations, game.elapsed));
        game.walkTarget = null;
      }
    } else if (d < 12) {
      game.walkTarget = null;
    }
    moveChef(game.chef, keys, dt);
  } else {
    moveChef(game.chef, input.keys, dt);
  }
  game.nearStation = nearestStation(game.chef.x, game.chef.y, INTERACT_REACH + CHEF_RADIUS);
  if (input.pressed.interact) {
    handleEvent(game, interact(game.chef, game.stations, game.elapsed));
  }
  if (input.keys.interact) {
    handleEvent(game, holdChop(game.chef, game.stations, dt));
    if (game.chef.chopping && Math.random() < 0.4) {
      const st = STATIONS.find((s) => s.id === game.chef.chopping.stationId);
      burst(game.fx, st.x + st.w / 2, st.y + st.h / 2 - 10, '#e8d3a8', 2, 60);
      sfx.chop(game.audio);
    }
  } else {
    game.chef.chopping = null;
  }
  for (const ev of tickBurners(game.stations, dt)) handleEvent(game, ev);
  // Steam while something cooks.
  game.stations.burners.forEach((b, i) => {
    if (b.item && b.item.state !== 'cooked' && b.item.state !== 'burnt' && Math.random() < dt * 6) {
      const slot = burnerSlots()[i];
      steam(game.fx, slot.x, slot.y - 10);
    }
  });
  setSizzle(game.audio, game.stations.burners.some((b) => b.item && b.item.state !== 'cooked' && b.item.state !== 'burnt'));
  for (const ev of tickOrders(game.orders, dt, game.elapsed, SHIFT_SECONDS)) handleEvent(game, ev);
  tickPlates(game.chef, dt);
  if (game.timeLeft <= 0) {
    game.phase = 'end';
    setSizzle(game.audio, false);
  }
}

function boot() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  const seed = Number(params.get('seed') || '7');
  const input = makeInput();
  let game;
  if (shot) {
    // Staged screenshot: one frozen frame, no loop, no audio.
    game = stageShot(shot, seed);
    game.audio = makeAudio();
    drawGame(ctx, game);
    window.__game = game;
    document.title = `Dapur Senja — shot ${shot}`;
    return;
  }
  game = newGame(seed);
  game.audio = makeAudio();
  bindInput(input, canvas, () => unlockAudio(game.audio));
  window.__game = game;
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(game, dt, input);
    drawGame(ctx, game);
    endFrame(input);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

document.addEventListener('DOMContentLoaded', boot);
