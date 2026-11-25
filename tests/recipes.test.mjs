// node --test tests/recipes.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { dishOnPlate, canAddToPlate, servePayout } from '../game/src/recipes.js';
import { RECIPE_BY_ID } from '../game/src/config.js';

const plate = (...items) => ({ items: items.map(([id, state]) => ({ id, state })) });

test('a plate with cooked rice and cooked egg is Nasi Goreng', () => {
  assert.equal(dishOnPlate(plate(['nasi', 'cooked'], ['telur', 'cooked'])).id, 'nasi-goreng');
});

test('Ayam Geprek wants cooked chicken and chopped (not cooked) chili', () => {
  assert.equal(dishOnPlate(plate(['ayam', 'cooked'], ['cabai', 'chopped'])).id, 'ayam-geprek');
  assert.equal(dishOnPlate(plate(['ayam', 'cooked'], ['cabai', 'cooked'])), null);
  assert.equal(dishOnPlate(plate(['ayam', 'chopped'], ['cabai', 'chopped'])), null);
});

test('Teh Tarik is one cooked tea, nothing else', () => {
  assert.equal(dishOnPlate(plate(['teh', 'cooked'])).id, 'teh-tarik');
  assert.equal(dishOnPlate(plate(['teh', 'raw'])), null);
  assert.equal(dishOnPlate(plate(['teh', 'cooked'], ['nasi', 'cooked'])), null);
});

test('a wrong combination is no dish at all', () => {
  assert.equal(dishOnPlate(plate(['nasi', 'cooked'], ['cabai', 'chopped'])), null);
  assert.equal(dishOnPlate(plate([])), null);
});

test('a plate takes one of each ingredient, only when the state fits a recipe', () => {
  const p = plate(['nasi', 'cooked']);
  assert.equal(canAddToPlate(p, { id: 'nasi', state: 'cooked' }), false); // duplicate
  assert.equal(canAddToPlate(p, { id: 'nasi', state: 'raw' }), false); // raw rice fits no recipe
  assert.equal(canAddToPlate(p, { id: 'telur', state: 'cooked' }), true);
  assert.equal(canAddToPlate(p, { id: 'telur', state: 'raw' }), false);
});

test('payout: base + tip for patience left, times the combo', () => {
  const r = RECIPE_BY_ID['nasi-goreng']; // base 120
  assert.equal(servePayout(r, 52, 52, 0), 180); // full patience, no combo: 120 * 1.5
  assert.equal(servePayout(r, 0, 52, 0), 120); // no patience left: base only
  assert.equal(servePayout(r, 26, 52, 0), 150); // half patience: 120 * 1.25
  assert.equal(servePayout(r, 52, 52, 4), 360); // combo capped at x2: 120 * 1.5 * 2
});
