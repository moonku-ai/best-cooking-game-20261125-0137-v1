// node --test tests/orders.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeRng } from '../game/src/random.js';
import { makeOrders, tickOrders, serveDish } from '../game/src/orders.js';
import { RECIPE_BY_ID } from '../game/src/config.js';

test('orders spawn over time and never exceed four open', () => {
  const state = makeOrders(makeRng(42));
  let now = 0;
  for (let i = 0; i < 180; i++) {
    tickOrders(state, 1, now, 180);
    now += 1;
    assert.ok(state.open.length <= 4, `open orders ${state.open.length} at t=${now}`);
  }
  assert.ok(state.served + state.expired > 0, 'some orders resolved in a full shift');
});

test('an order expires when its patience runs out', () => {
  const state = makeOrders(makeRng(1));
  tickOrders(state, 6.5, 0, 180); // first order arrives at 6s
  assert.equal(state.open.length, 1);
  const firstId = state.open[0].id;
  const events = tickOrders(state, 60, 6.5, 180);
  assert.equal(state.expired, 1);
  assert.equal(state.open.some((o) => o.id === firstId), false, 'the first order is gone');
  assert.equal(events.some((e) => e.type === 'expired'), true);
});

test('serving the dish an order wants pays and clears that order', () => {
  const state = makeOrders(makeRng(3));
  tickOrders(state, 6.5, 0, 180);
  const order = state.open[0];
  const res = serveDish(state, order.recipe, 10);
  assert.ok(res.paid > 0, 'paid something');
  assert.equal(state.open.length, 0);
  assert.equal(state.coins, res.paid);
  assert.equal(state.served, 1);
});

test('serving a dish nobody ordered pays nothing and keeps the order', () => {
  const state = makeOrders(makeRng(3));
  tickOrders(state, 6.5, 0, 180);
  const wanted = state.open[0].recipe.id;
  const other = Object.keys(RECIPE_BY_ID).find((id) => id !== wanted);
  const res = serveDish(state, RECIPE_BY_ID[other], 10);
  assert.equal(res.paid, 0);
  assert.equal(state.open.length, 1);
});

test('a fast second serve builds the combo, a slow one resets it', () => {
  const state = makeOrders(makeRng(5));
  tickOrders(state, 6.5, 0, 180);
  const first = state.open[0];
  serveDish(state, first.recipe, 10);
  tickOrders(state, 1, 10, 180);
  state.open.push({ id: 99, recipe: first.recipe, patience: 50, total: 52, born: 11 });
  const second = serveDish(state, first.recipe, 11);
  assert.ok(second.combo > 1, `combo ${second.combo} should grow on a quick second serve`);
  tickOrders(state, 1, 11, 180);
  state.open.push({ id: 100, recipe: first.recipe, patience: 50, total: 52, born: 12 });
  const third = serveDish(state, first.recipe, 40); // 29s later: streak broken
  assert.equal(third.combo, 1);
});
