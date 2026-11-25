// Dapur Senja — all tuning numbers in one place. Change a number here and the
// whole game (and its tests) follows it; no magic numbers live in other files.
export const VIEW_W = 1280;
export const VIEW_H = 800;
export const HUD_H = 96;

// A shift lasts three minutes; the last thirty seconds are the rush.
export const SHIFT_SECONDS = 180;
export const RUSH_SECONDS = 30;

// The chef's feet.
export const CHEF_SPEED = 265; // px per second
export const CHEF_RADIUS = 17;
export const INTERACT_REACH = 52; // px beyond a station's edge

// Chopping takes a held press; cooking runs on its own clock.
export const CHOP_SECONDS = 1.4;
export const COOK_OVERCOOK_GRACE = 5; // seconds past done before it burns

// Plates: four on the stack, one comes back this long after a serve.
export const PLATE_COUNT = 4;
export const PLATE_RETURN_SECONDS = 6;

// Orders: patience in seconds, spawn gap in seconds.
export const ORDER_PATIENCE = 52;
export const ORDER_PATIENCE_DRINK = 36;
export const SPAWN_GAP_START = 15;
export const SPAWN_GAP_END = 8.5;
export const SPAWN_GAP_RUSH = 7;
export const MAX_OPEN_ORDERS = 4;

// Money: base price per dish, tip up to half the base for a fast serve,
// combo adds a quarter per streak step, capped at double.
export const TIP_MAX_SHARE = 0.5;
export const COMBO_STEP = 0.25;
export const COMBO_CAP = 2.0;
export const COMBO_WINDOW = 20; // seconds between serves to keep the streak

// Stars at the end of the shift, by coins earned.
export const STAR_COINS = [400, 800, 1200];

// Ingredients. state: raw -> (chopped) -> cooked. chop: needs the board.
// cook: needs a burner. chopOnly: served chopped, never cooked.
export const INGREDIENTS = {
  nasi: { name: 'Nasi', color: '#f5efe0', chop: false, cook: 4.0 },
  ayam: { name: 'Ayam', color: '#e8a06a', chop: true, cook: 6.0 },
  sayur: { name: 'Sayur', color: '#7dc383', chop: true, cook: 4.0 },
  cabai: { name: 'Cabai', color: '#e05252', chop: true, cook: 0 },
  telur: { name: 'Telur', color: '#f2c94c', chop: false, cook: 3.0 },
  teh: { name: 'Teh', color: '#c98a4b', chop: false, cook: 5.0 },
};

// Recipes: the dishes on the menu. needs lists ingredient ids in the state
// the plate must hold: 'cooked', 'chopped' or 'raw'.
export const RECIPES = [
  {
    id: 'nasi-goreng', name: 'Nasi Goreng', price: 120, patience: ORDER_PATIENCE,
    needs: [{ id: 'nasi', state: 'cooked' }, { id: 'telur', state: 'cooked' }],
    blurb: 'Nasi + telur, digoreng di wajan.',
  },
  {
    id: 'ayam-geprek', name: 'Ayam Geprek', price: 150, patience: ORDER_PATIENCE,
    needs: [{ id: 'ayam', state: 'cooked' }, { id: 'cabai', state: 'chopped' }],
    blurb: 'Ayam goreng geprek, cabai cincang segar.',
  },
  {
    id: 'sayur-sop', name: 'Sayur Sop', price: 140, patience: ORDER_PATIENCE,
    needs: [{ id: 'sayur', state: 'cooked' }, { id: 'telur', state: 'cooked' }],
    blurb: 'Sop sayur hangat dengan telur.',
  },
  {
    id: 'nasi-ayam', name: 'Nasi Ayam', price: 180, patience: ORDER_PATIENCE,
    needs: [{ id: 'nasi', state: 'cooked' }, { id: 'ayam', state: 'cooked' }],
    blurb: 'Nasi hangat, ayam goreng gurih.',
  },
  {
    id: 'teh-tarik', name: 'Teh Tarik', price: 60, patience: ORDER_PATIENCE_DRINK,
    needs: [{ id: 'teh', state: 'cooked' }],
    blurb: 'Teh panas, cepat saji.',
  },
];

export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((r) => [r.id, r]));
