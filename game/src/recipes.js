// Pure recipe logic: no DOM, no canvas, so node --test can run it directly.
// An item is { id, state } where state is 'raw', 'chopped' or 'cooked'.
// A plate is { items: [item, ...] } — at most one of each ingredient id.
import { RECIPES, RECIPE_BY_ID, TIP_MAX_SHARE, COMBO_STEP, COMBO_CAP } from './config.js';

// The dish a plate holds, or null when its contents match no recipe.
export function dishOnPlate(plate) {
  if (!plate || !plate.items) return null;
  const held = new Map(plate.items.map((it) => [it.id, it.state]));
  for (const recipe of RECIPES) {
    if (recipe.needs.length !== plate.items.length) continue;
    if (recipe.needs.every((need) => held.get(need.id) === need.state)) return recipe;
  }
  return null;
}

// Can this item go on the plate? One of each ingredient, and only when it is
// part of some recipe in the state it is in (no raw rice on a plate, ever).
export function canAddToPlate(plate, item) {
  if (!plate || plate.items.some((it) => it.id === item.id)) return false;
  return RECIPES.some((r) => r.needs.some((n) => n.id === item.id && n.state === item.state));
}

// Coins for serving a dish: base + a tip for patience left, times the combo.
export function servePayout(recipe, patienceLeft, patienceTotal, combo) {
  const tipShare = TIP_MAX_SHARE * Math.max(0, Math.min(1, patienceLeft / patienceTotal));
  const mult = Math.min(COMBO_CAP, 1 + COMBO_STEP * combo);
  return Math.round(recipe.price * (1 + tipShare) * mult);
}

// Which recipes want this ingredient at all (for the order board's hints).
export function recipesUsing(ingredientId) {
  return RECIPES.filter((r) => r.needs.some((n) => n.id === ingredientId));
}

export { RECIPE_BY_ID };
