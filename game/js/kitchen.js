// The Copper Ladle — the kitchen itself: orders, stations, the plate,
// scoring and the shape of the rush. Pure state and rules; the renderer
// only reads it, and the input handler only calls its verbs.

import { ingredientById, unlockedRecipes, plateMatchesRecipe } from './recipes.js';
import { ticketRect } from './layout.js';
import { sfx } from './audio.js';

export const PHASE = { TITLE: 'title', PLAYING: 'playing', PAUSED: 'paused', OVER: 'over' };
export const SHIFT_SECONDS = 150;
export const MAX_ORDERS = 3;
export const START_STARS = 3;

let nextOrderId = 1;

export class Kitchen {
  constructor() {
    this.phase = PHASE.TITLE;
    this.resetShift();
  }

  resetShift() {
    this.elapsed = 0;
    this.timeLeft = SHIFT_SECONDS;
    this.coins = 0;
    this.served = 0;
    this.lost = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.stars = START_STARS;
    this.orders = [];
    this.stations = { chop: null, grill: null, boil: null };
    this.plate = [];
    this.targetId = null;
    this.spawnIn = 0;
    this.floaters = [];
    this.shake = { chop: 0, grill: 0, boil: 0, plate: 0 };
    this.overReason = '';
  }

  startShift() {
    this.resetShift();
    this.phase = PHASE.PLAYING;
    this.spawnOrder();
    this.spawnIn = 3;
  }

  togglePause() {
    if (this.phase === PHASE.PLAYING) this.phase = PHASE.PAUSED;
    else if (this.phase === PHASE.PAUSED) this.phase = PHASE.PLAYING;
  }

  // ---- the rush -------------------------------------------------------

  // How long a fresh ticket's customer will wait. It shrinks as the shift
  // wears on, and a bigger dish buys a little more patience.
  patienceFor(recipe) {
    const base = 54 - this.elapsed * 0.11;
    return Math.max(34, base) + recipe.items.length * 2;
  }

  spawnInterval() {
    return Math.max(4, 8.5 - this.elapsed * 0.03);
  }

  spawnOrder() {
    if (this.orders.length >= MAX_ORDERS) return;
    const pool = unlockedRecipes(this.elapsed);
    const recipe = pool[Math.floor(Math.random() * pool.length)];
    const patience = this.patienceFor(recipe);
    this.orders.push({ id: nextOrderId, recipe, patience, patienceMax: patience });
    nextOrderId += 1;
    sfx.whistle();
  }

  expireOrder(order) {
    this.orders = this.orders.filter((o) => o.id !== order.id);
    if (this.targetId === order.id) this.targetId = null;
    this.lost += 1;
    this.stars -= 1;
    this.combo = 0;
    const slot = this.orders.length;
    const rect = ticketRect(Math.min(slot, MAX_ORDERS - 1));
    this.addFloater(rect.x + rect.w / 2, rect.y + 60, 'TOO SLOW!', '#e4572e');
    sfx.thud();
    if (this.stars <= 0) this.endShift('Three customers walked out. The diner closes early.');
  }

  endShift(reason) {
    this.phase = PHASE.OVER;
    this.overReason = reason;
  }

  // ---- the verbs the player has ----------------------------------------

  // Clicking an ingredient bin: raw food goes straight to the plate, the
  // rest starts its station. A busy station refuses with a shake.
  pickIngredient(id) {
    if (this.phase !== PHASE.PLAYING) return;
    const item = ingredientById(id);
    if (!item) return;
    if (item.prep === 'raw') {
      this.plate.push(id);
      sfx.pop();
      return;
    }
    const station = this.stations[item.prep];
    if (station) {
      this.shake[item.prep] = 0.3;
      sfx.buzz();
      return;
    }
    this.stations[item.prep] = { item: id, t: 0, dur: item.seconds, done: false, pinged: false };
    if (item.prep === 'chop') sfx.chop();
    else if (item.prep === 'grill') sfx.sizzle();
    else sfx.bubble();
  }

  // Clicking a station: a finished item moves to the plate; an unfinished
  // one just rattles.
  collectStation(stationId) {
    if (this.phase !== PHASE.PLAYING) return;
    const station = this.stations[stationId];
    if (!station) return;
    if (!station.done) {
      this.shake[stationId] = 0.3;
      return;
    }
    this.plate.push(station.item);
    this.stations[stationId] = null;
    sfx.pop();
  }

  // Ring the bell: if the plate is exactly some ticket's dish, that
  // customer pays — the targeted ticket first, then the oldest match.
  serve() {
    if (this.phase !== PHASE.PLAYING) return;
    if (this.plate.length === 0) {
      this.shake.plate = 0.3;
      sfx.buzz();
      return;
    }
    let order = this.orders.find((o) => o.id === this.targetId && plateMatchesRecipe(this.plate, o.recipe));
    if (!order) order = this.orders.find((o) => plateMatchesRecipe(this.plate, o.recipe));
    if (!order) {
      this.shake.plate = 0.35;
      sfx.buzz();
      return;
    }
    const speedBonus = Math.round(6 * (order.patience / order.patienceMax));
    this.combo += 1;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    const comboBonus = this.combo >= 3 ? Math.floor(this.combo / 2) : 0;
    const award = order.recipe.price + speedBonus + comboBonus;
    this.coins += award;
    this.served += 1;
    this.orders = this.orders.filter((o) => o.id !== order.id);
    if (this.targetId === order.id) this.targetId = null;
    this.plate = [];
    this.addFloater(600, 470, `+${award}`, '#7fb069');
    if (this.combo >= 3) this.addFloater(600, 436, `COMBO x${this.combo}`, '#f4842b');
    sfx.ding();
    sfx.coin();
  }

  trashPlate() {
    if (this.phase !== PHASE.PLAYING) return;
    if (this.plate.length === 0) return;
    this.plate = [];
    sfx.click();
  }

  selectTarget(orderId) {
    this.targetId = this.targetId === orderId ? null : orderId;
    sfx.click();
  }

  // ---- time -------------------------------------------------------------

  addFloater(x, y, text, color) {
    this.floaters.push({ x, y, text, color, t: 0, life: 1.15 });
  }

  update(dt) {
    for (const key of Object.keys(this.shake)) {
      if (this.shake[key] > 0) this.shake[key] = Math.max(0, this.shake[key] - dt);
    }
    this.floaters = this.floaters.filter((f) => (f.t += dt) < f.life);
    if (this.phase !== PHASE.PLAYING) return;

    this.elapsed += dt;
    this.timeLeft = Math.max(0, SHIFT_SECONDS - this.elapsed);

    this.spawnIn -= dt;
    if (this.spawnIn <= 0) {
      this.spawnOrder();
      this.spawnIn = this.spawnInterval();
    }

    for (const stationId of Object.keys(this.stations)) {
      const station = this.stations[stationId];
      if (!station || station.done) continue;
      station.t += dt;
      if (station.t >= station.dur) {
        station.done = true;
        if (!station.pinged) {
          station.pinged = true;
          sfx.ready();
        }
      }
    }

    for (const order of [...this.orders]) {
      order.patience -= dt;
      if (order.patience <= 0) this.expireOrder(order);
    }

    if (this.phase === PHASE.PLAYING && this.timeLeft <= 0) {
      this.endShift('The shift clock ran out. Service is over for today.');
    }
  }

  // The order the player has pinned as their target, if it is still up.
  targetOrder() {
    return this.orders.find((o) => o.id === this.targetId) || null;
  }

  // Chef hats earned, 1 to 3, from the coins taken in the shift.
  hats() {
    if (this.coins >= 210) return 3;
    if (this.coins >= 140) return 2;
    return 1;
  }
}
