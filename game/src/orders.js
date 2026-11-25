// Orders: what the board asks for, how long it waits, what a serve pays.
// Pure state machine — the clock is passed in, so tests can drive it.
import {
  RECIPES, ORDER_PATIENCE, ORDER_PATIENCE_DRINK, MAX_OPEN_ORDERS,
  SPAWN_GAP_START, SPAWN_GAP_END, SPAWN_GAP_RUSH, RUSH_SECONDS,
  COMBO_WINDOW, COMBO_STEP, COMBO_CAP,
} from './config.js';
import { pick } from './random.js';
import { servePayout } from './recipes.js';

export function makeOrders(rng) {
  return {
    rng,
    open: [], // { id, recipe, patience, total, born }
    nextId: 1,
    spawnIn: 6, // first order arrives six seconds in
    served: 0,
    expired: 0,
    coins: 0,
    streak: 0,
    lastServeAt: -Infinity,
    bestCombo: 1,
  };
}

function spawnGap(elapsed, shiftSeconds) {
  const left = shiftSeconds - elapsed;
  if (left <= RUSH_SECONDS) return SPAWN_GAP_RUSH;
  const t = Math.min(1, elapsed / (shiftSeconds - RUSH_SECONDS));
  return SPAWN_GAP_START + (SPAWN_GAP_END - SPAWN_GAP_START) * t;
}

function spawnOrder(state, now) {
  const recipe = pick(state.rng, RECIPES);
  const total = recipe.id === 'teh-tarik' ? ORDER_PATIENCE_DRINK : ORDER_PATIENCE;
  state.open.push({ id: state.nextId++, recipe, patience: total, total, born: now });
}

// Advance the board by dt seconds. Returns events for sound and feedback:
// [{ type: 'new-order' | 'expired', order }].
export function tickOrders(state, dt, now, shiftSeconds) {
  const events = [];
  // Patience runs out first: an order that spawns on this tick must not
  // lose patience in the same tick it was born.
  for (const order of state.open) order.patience -= dt;
  const stillOpen = [];
  for (const order of state.open) {
    if (order.patience <= 0) {
      state.expired++;
      state.streak = 0;
      events.push({ type: 'expired', order });
    } else stillOpen.push(order);
  }
  state.open = stillOpen;
  state.spawnIn -= dt;
  if (state.spawnIn <= 0 && state.open.length < MAX_OPEN_ORDERS) {
    spawnOrder(state, now);
    events.push({ type: 'new-order', order: state.open[state.open.length - 1] });
    state.spawnIn = spawnGap(now, shiftSeconds);
  }
  return events;
}

// Serve a finished dish. Returns the payout, or 0 when no open order wants it.
export function serveDish(state, recipe, now) {
  let best = null;
  for (const order of state.open) {
    if (order.recipe.id === recipe.id && (!best || order.patience < best.patience)) best = order;
  }
  if (!best) return { paid: 0, order: null };
  state.open = state.open.filter((o) => o !== best);
  state.streak = now - state.lastServeAt <= COMBO_WINDOW ? state.streak + 1 : 0;
  state.lastServeAt = now;
  const combo = Math.min(COMBO_CAP, 1 + COMBO_STEP * state.streak);
  state.bestCombo = Math.max(state.bestCombo, combo);
  const paid = servePayout(recipe, best.patience, best.total, state.streak);
  state.coins += paid;
  state.served++;
  return { paid, order: best, combo };
}
