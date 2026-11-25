// The Copper Ladle — boot, input and the frame loop.
//
// This module owns the canvas, the mouse and the keyboard. Everything it
// hears is translated into one of the kitchen's verbs (pick, collect,
// serve, trash, target, pause); all rules live in kitchen.js and all
// drawing in render.js.

import { Kitchen, PHASE } from './kitchen.js';
import { render } from './render.js';
import {
  VIEW, ticketRect, STATION_RECTS, SERVE_BUTTON, TRASH_BUTTON,
  binRect, PAUSE_BUTTON, MUTE_BUTTON, PANEL_BUTTON, pointInRect,
} from './layout.js';
import { INGREDIENTS } from './recipes.js';
import { ensureAudio, toggleMuted, sfx } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const game = new Kitchen();

// Exposed so the maker can play-test and stage screenshots from the
// browser console; the game itself never reads it.
window.copperLadle = game;

function toCanvasCoords(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * VIEW.width,
    y: ((event.clientY - rect.top) / rect.height) * VIEW.height,
  };
}

function handleClick(event) {
  ensureAudio();
  const { x, y } = toCanvasCoords(event);

  if (pointInRect(x, y, MUTE_BUTTON)) {
    toggleMuted();
    return;
  }

  if (game.phase === PHASE.TITLE || game.phase === PHASE.OVER) {
    if (pointInRect(x, y, PANEL_BUTTON)) {
      sfx.click();
      game.startShift();
    }
    return;
  }
  if (game.phase === PHASE.PAUSED) {
    if (pointInRect(x, y, PANEL_BUTTON) || pointInRect(x, y, PAUSE_BUTTON)) game.togglePause();
    return;
  }

  // Playing.
  if (pointInRect(x, y, PAUSE_BUTTON)) {
    game.togglePause();
    return;
  }
  for (let slot = 0; slot < game.orders.length; slot += 1) {
    if (pointInRect(x, y, ticketRect(slot))) {
      game.selectTarget(game.orders[slot].id);
      return;
    }
  }
  for (const stationId of Object.keys(STATION_RECTS)) {
    if (pointInRect(x, y, STATION_RECTS[stationId])) {
      game.collectStation(stationId);
      return;
    }
  }
  if (pointInRect(x, y, SERVE_BUTTON)) {
    game.serve();
    return;
  }
  if (pointInRect(x, y, TRASH_BUTTON)) {
    game.trashPlate();
    return;
  }
  INGREDIENTS.forEach((item, i) => {
    if (pointInRect(x, y, binRect(i))) game.pickIngredient(item.id);
  });
}

function handleKey(event) {
  ensureAudio();
  if (event.key === 'p' || event.key === 'P') {
    if (game.phase === PHASE.PLAYING || game.phase === PHASE.PAUSED) game.togglePause();
    return;
  }
  if (event.key === 'm' || event.key === 'M') {
    toggleMuted();
    return;
  }
  if (game.phase === PHASE.TITLE || game.phase === PHASE.OVER) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      game.startShift();
    }
    return;
  }
  if (game.phase !== PHASE.PLAYING) return;
  if (event.key === ' ') {
    event.preventDefault();
    game.serve();
    return;
  }
  if (event.key === 'Backspace') {
    event.preventDefault();
    game.trashPlate();
    return;
  }
  const item = INGREDIENTS.find((i) => i.key === event.key);
  if (item) game.pickIngredient(item.id);
}

canvas.addEventListener('click', handleClick);
window.addEventListener('keydown', handleKey);

let lastStamp = performance.now();
function frame(stamp) {
  const dt = Math.min(0.05, (stamp - lastStamp) / 1000);
  lastStamp = stamp;
  game.update(dt);
  render(ctx, game, stamp / 1000);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
