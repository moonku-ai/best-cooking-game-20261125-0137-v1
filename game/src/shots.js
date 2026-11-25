// Deterministic screenshot staging: ?shot=play|rush|serve|end&seed=N builds
// a mid-action kitchen from a fixed seed and freezes it, so the screenshots
// are real renders of the game's own code, repeatable to the pixel. The
// cover shot is always mid-action — never a title screen.
import { makeRng } from './random.js';
import { RECIPES, RECIPE_BY_ID, SHIFT_SECONDS } from './config.js';
import { STATIONS } from './world.js';
import { makeOrders } from './orders.js';
import { makeChef } from './chef.js';
import { makeFx, steam, floatText } from './particles.js';

function baseState(seed) {
  const rng = makeRng(seed);
  const orders = makeOrders(rng);
  const chef = makeChef();
  const stations = {
    held: { 'board-a': null, 'board-b': null },
    burners: [
      { item: null, progress: 0, overcook: 0, burnt: false },
      { item: null, progress: 0, overcook: 0, burnt: false },
    ],
    plates: { 'plate-a': null, 'plate-b': null },
  };
  return {
    rng, orders, chef, stations, fx: makeFx(),
    phase: 'play', time: 0, timeLeft: 124, rush: false,
    nearStation: null, toast: null, muted: false,
  };
}

function addOrder(state, recipeId, patienceLeft) {
  const recipe = RECIPE_BY_ID[recipeId];
  state.orders.open.push({
    id: state.orders.nextId++, recipe,
    patience: patienceLeft, total: recipe.patience, born: 0,
  });
}

function stagePlay(seed) {
  const g = baseState(seed);
  g.timeLeft = 124;
  addOrder(g, 'nasi-goreng', 34);
  addOrder(g, 'ayam-geprek', 22);
  addOrder(g, 'nasi-ayam', 44);
  g.orders.coins = 360;
  g.orders.served = 3;
  g.orders.streak = 2;
  g.orders.lastServeAt = 0;
  // One dish mid-assembly: nasi + telur on a plate, waiting for the window.
  g.stations.plates['plate-a'] = {
    kind: 'plate',
    items: [
      { id: 'nasi', state: 'cooked' },
      { id: 'telur', state: 'cooked' },
    ],
  };
  // A burner mid-cook, a board mid-chop, and the chef carrying chopped ayam.
  g.stations.burners[0] = { item: { id: 'ayam', state: 'chopped' }, progress: 0.55, overcook: 0, burnt: false };
  g.stations.held['board-a'] = { id: 'sayur', state: 'raw' };
  g.chef.chopping = { stationId: 'board-a', progress: 0.6 };
  g.chef.x = 470;
  g.chef.y = 470;
  g.chef.facing = 'up';
  g.chef.carry = { kind: 'item', id: 'ayam', state: 'chopped' };
  g.nearStation = STATIONS.find((s) => s.id === 'stove');
  steam(g.fx, 352, 545);
  steam(g.fx, 478, 545);
  return g;
}

function stageRush(seed) {
  const g = baseState(seed);
  g.timeLeft = 24;
  g.rush = true;
  addOrder(g, 'ayam-geprek', 9);
  addOrder(g, 'nasi-goreng', 14);
  addOrder(g, 'sayur-sop', 7);
  addOrder(g, 'teh-tarik', 18);
  g.orders.coins = 940;
  g.orders.served = 8;
  g.orders.streak = 4;
  g.orders.lastServeAt = 0;
  g.stations.burners[0] = { item: { id: 'nasi', state: 'cooked' }, progress: 1, overcook: 1, burnt: false };
  g.stations.burners[1] = { item: { id: 'teh', state: 'raw' }, progress: 0.7, overcook: 0, burnt: false };
  g.stations.plates['plate-b'] = {
    kind: 'plate',
    items: [
      { id: 'ayam', state: 'cooked' },
      { id: 'cabai', state: 'chopped' },
    ],
  };
  g.chef.x = 1060;
  g.chef.y = 260;
  g.chef.facing = 'up';
  g.chef.carry = {
    kind: 'plate',
    items: [
      { id: 'ayam', state: 'cooked' },
      { id: 'cabai', state: 'chopped' },
    ],
  };
  g.nearStation = STATIONS.find((s) => s.id === 'window');
  floatText(g.fx, 1150, 330, '+225', '#ffd166');
  steam(g.fx, 352, 545);
  steam(g.fx, 478, 545);
  return g;
}

function stageServe(seed) {
  const g = baseState(seed);
  g.timeLeft = 88;
  addOrder(g, 'nasi-ayam', 30);
  addOrder(g, 'teh-tarik', 26);
  g.orders.coins = 545;
  g.orders.served = 4;
  g.orders.streak = 1;
  g.orders.lastServeAt = 0;
  g.stations.plates['plate-a'] = {
    kind: 'plate',
    items: [
      { id: 'sayur', state: 'cooked' },
      { id: 'telur', state: 'cooked' },
    ],
  };
  g.chef.x = 640;
  g.chef.y = 300;
  g.chef.facing = 'up';
  g.chef.carry = {
    kind: 'plate',
    items: [
      { id: 'nasi', state: 'cooked' },
      { id: 'ayam', state: 'cooked' },
    ],
  };
  g.nearStation = STATIONS.find((s) => s.id === 'window');
  floatText(g.fx, 800, 250, '+270', '#ffd166');
  return g;
}

function stageEnd(seed) {
  const g = baseState(seed);
  g.phase = 'end';
  g.timeLeft = 0;
  g.orders.coins = 1240;
  g.orders.served = 11;
  g.orders.expired = 2;
  g.orders.bestCombo = 1.75;
  return g;
}

export function stageShot(kind, seed) {
  switch (kind) {
    case 'rush': return stageRush(seed);
    case 'serve': return stageServe(seed);
    case 'end': return stageEnd(seed);
    case 'play':
    default: return stagePlay(seed);
  }
}

export { SHIFT_SECONDS };
