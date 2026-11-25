// The Copper Ladle — the menu: ingredients, prep stations and recipes.
//
// Every ingredient is either RAW (straight onto the plate) or needs one
// station first: the chopping board, the grill or the boiling pot. A recipe
// is just a list of ingredient ids; the kitchen serves a plate when its
// contents match a ticket's list exactly.

// How an ingredient gets ready: 'raw' needs nothing, the others name the
// station that must process it before it can be plated.
export const PREP = {
  RAW: 'raw',
  CHOP: 'chop',
  GRILL: 'grill',
  BOIL: 'boil',
};

// The three stations, in the order they stand along the back counter.
export const STATIONS = {
  chop: { id: 'chop', name: 'Chopping Board', verb: 'Chop' },
  grill: { id: 'grill', name: 'Grill', verb: 'Grill' },
  boil: { id: 'boil', name: 'Pot', verb: 'Boil' },
};

// The ten bins along the front counter, left to right. `key` is the
// keyboard shortcut drawn on the bin. `hue` is the ingredient's main colour,
// used by the art module so a bin, a ticket chip and a plate layer all agree.
export const INGREDIENTS = [
  { id: 'bun',     name: 'Bun',     prep: PREP.RAW,   seconds: 0,   key: '1', hue: '#e8b96a' },
  { id: 'patty',   name: 'Patty',   prep: PREP.GRILL, seconds: 3.2, key: '2', hue: '#8a5a33' },
  { id: 'cheese',  name: 'Cheese',  prep: PREP.RAW,   seconds: 0,   key: '3', hue: '#f7c948' },
  { id: 'lettuce', name: 'Lettuce', prep: PREP.RAW,   seconds: 0,   key: '4', hue: '#7fb069' },
  { id: 'tomato',  name: 'Tomato',  prep: PREP.CHOP,  seconds: 1.6, key: '5', hue: '#e4572e' },
  { id: 'onion',   name: 'Onion',   prep: PREP.CHOP,  seconds: 1.4, key: '6', hue: '#e8d8f0' },
  { id: 'pasta',   name: 'Pasta',   prep: PREP.BOIL,  seconds: 3.6, key: '7', hue: '#f2d38a' },
  { id: 'egg',     name: 'Egg',     prep: PREP.GRILL, seconds: 2.4, key: '8', hue: '#fdf6e3' },
  { id: 'chicken', name: 'Chicken', prep: PREP.GRILL, seconds: 3.8, key: '9', hue: '#d99058' },
  { id: 'shroom',  name: 'Shroom',  prep: PREP.CHOP,  seconds: 1.8, key: '0', hue: '#b08968' },
];

const INGREDIENT_BY_ID = new Map(INGREDIENTS.map((item) => [item.id, item]));

export function ingredientById(id) {
  return INGREDIENT_BY_ID.get(id);
}

// The six dishes the diner serves. `unlock` is the shift second from which
// the dish can appear on the order board, so the rush builds: quick plates
// first, the big stacked orders once the kitchen is warm.
export const RECIPES = [
  { id: 'sunrise-plate',  name: 'Sunrise Plate',  items: ['egg', 'tomato', 'lettuce'],                    price: 11, unlock: 0 },
  { id: 'tomato-pasta',   name: 'Tomato Pasta',   items: ['pasta', 'tomato', 'cheese'],                   price: 13, unlock: 0 },
  { id: 'copper-burger',  name: 'Copper Burger',  items: ['bun', 'patty', 'cheese', 'lettuce'],           price: 14, unlock: 0 },
  { id: 'shroom-pasta',   name: 'Shroom Pasta',   items: ['pasta', 'shroom', 'cheese'],                   price: 14, unlock: 35 },
  { id: 'chicken-melt',   name: 'Chicken Melt',   items: ['bun', 'chicken', 'cheese', 'onion'],           price: 16, unlock: 35 },
  { id: 'deluxe-burger',  name: 'Deluxe Burger',  items: ['bun', 'patty', 'cheese', 'tomato', 'onion'],   price: 18, unlock: 75 },
];

const RECIPE_BY_ID = new Map(RECIPES.map((dish) => [dish.id, dish]));

export function recipeById(id) {
  return RECIPE_BY_ID.get(id);
}

// The dishes that can be ordered `elapsed` seconds into the shift.
export function unlockedRecipes(elapsed) {
  return RECIPES.filter((dish) => elapsed >= dish.unlock);
}

// True when a plate's contents are exactly a recipe's list, in any order:
// the diner cares what is on the plate, not the order it was stacked in.
export function plateMatchesRecipe(plateItems, recipe) {
  if (plateItems.length !== recipe.items.length) return false;
  const wanted = [...recipe.items].sort();
  const have = [...plateItems].sort();
  return wanted.every((id, index) => id === have[index]);
}

// How many of a recipe's items are already on the plate (for the progress
// chips on the targeted ticket). Counts duplicates honestly.
export function plateProgress(plateItems, recipe) {
  const remaining = [...plateItems];
  let done = 0;
  for (const id of recipe.items) {
    const at = remaining.indexOf(id);
    if (at >= 0) {
      remaining.splice(at, 1);
      done += 1;
    }
  }
  return done;
}
