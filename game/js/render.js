// The Copper Ladle — everything the player sees, drawn on one canvas.
//
// The scene reads top to bottom like the kitchen it shows: the HUD strip,
// the cork order board, the back counter with the chopping board, grill
// and pot, the assembly counter with the plate, and the ingredient bins
// along the front. All art is drawn here or in art.js; there are no images.

import {
  VIEW, HUD, BOARD, ticketRect, STATION_RECTS, PLATE, TRASH_BUTTON,
  SERVE_BUTTON, TARGET_CHIPS_Y, binRect, PAUSE_BUTTON, MUTE_BUTTON,
  PANEL, PANEL_BUTTON,
} from './layout.js';
import { INGREDIENTS, ingredientById, plateMatchesRecipe, plateProgress } from './recipes.js';
import { drawIngredientIcon, drawPlateLayer, drawPrepBadge, drawCoin, drawStar, roundRect } from './art.js';
import { PHASE, MAX_ORDERS } from './kitchen.js';
import { isMuted } from './audio.js';

const INK = '#3a2415';
const PAPER = '#fff8ea';
const BRASS = '#e8b96a';
const WOOD = '#8a5a33';
const WOOD_LIGHT = '#a9763f';

function text(ctx, str, x, y, font, color, align = 'center') {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function formatClock(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// ---- the HUD strip ------------------------------------------------------

function drawHud(ctx, game) {
  ctx.fillStyle = '#2b1a10';
  ctx.fillRect(HUD.x, HUD.y, HUD.w, HUD.h);
  ctx.fillStyle = BRASS;
  ctx.fillRect(0, HUD.h - 3, HUD.w, 3);

  text(ctx, 'THE COPPER LADLE', 24, 30, 'bold 25px Georgia, serif', BRASS, 'left');

  drawCoin(ctx, 330, 29, 12);
  text(ctx, `${game.coins}`, 350, 30, 'bold 23px Georgia, serif', '#fdf6e3', 'left');
  text(ctx, `served ${game.served}`, 470, 30, '16px Verdana, sans-serif', '#d9bd93', 'left');

  if (game.combo >= 2) {
    text(ctx, `COMBO x${game.combo}`, 620, 30, 'bold 17px Verdana, sans-serif', '#f4842b', 'left');
  }

  const urgent = game.timeLeft <= 30 && game.phase === PHASE.PLAYING;
  text(ctx, `SHIFT ${formatClock(game.timeLeft)}`, 900, 30, 'bold 23px Georgia, serif', urgent ? '#e4572e' : '#fdf6e3');

  for (let i = 0; i < 3; i += 1) drawStar(ctx, 1004 + i * 30, 29, 12, i < game.stars);

  // Pause and mute buttons.
  for (const [rect, kind] of [[PAUSE_BUTTON, 'pause'], [MUTE_BUTTON, 'mute']]) {
    ctx.fillStyle = '#4a2d18';
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fill();
    ctx.strokeStyle = BRASS;
    ctx.lineWidth = 1.5;
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 8);
    ctx.stroke();
    ctx.fillStyle = '#fdf6e3';
    if (kind === 'pause') {
      ctx.fillRect(rect.x + 12, rect.y + 10, 5, 18);
      ctx.fillRect(rect.x + 21, rect.y + 10, 5, 18);
    } else {
      ctx.beginPath();
      ctx.moveTo(rect.x + 9, rect.y + 16);
      ctx.lineTo(rect.x + 15, rect.y + 16);
      ctx.lineTo(rect.x + 22, rect.y + 9);
      ctx.lineTo(rect.x + 22, rect.y + 29);
      ctx.lineTo(rect.x + 15, rect.y + 22);
      ctx.lineTo(rect.x + 9, rect.y + 22);
      ctx.closePath();
      ctx.fill();
      if (isMuted()) {
        ctx.strokeStyle = '#e4572e';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(rect.x + 25, rect.y + 14);
        ctx.lineTo(rect.x + 33, rect.y + 24);
        ctx.moveTo(rect.x + 33, rect.y + 14);
        ctx.lineTo(rect.x + 25, rect.y + 24);
        ctx.stroke();
      }
    }
  }
}

// ---- the order board ------------------------------------------------------

function patienceColor(frac) {
  if (frac > 0.5) return '#7fb069';
  if (frac > 0.25) return '#f4842b';
  return '#e4572e';
}

function drawTicket(ctx, game, order, slot, now) {
  const rect = ticketRect(slot);
  const targeted = game.targetId === order.id;
  const frac = Math.max(0, order.patience / order.patienceMax);
  const wobble = frac < 0.25 && game.phase === PHASE.PLAYING ? Math.sin(now * 34) * 1.6 : 0;

  ctx.save();
  ctx.translate(rect.x + rect.w / 2 + wobble, rect.y + rect.h / 2);
  ctx.rotate((slot - 1) * 0.008);

  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  roundRect(ctx, -rect.w / 2 + 4, -rect.h / 2 + 6, rect.w, rect.h, 6);
  ctx.fill();
  ctx.fillStyle = PAPER;
  roundRect(ctx, -rect.w / 2, -rect.h / 2, rect.w, rect.h, 6);
  ctx.fill();
  if (targeted) {
    ctx.strokeStyle = BRASS;
    ctx.lineWidth = 4;
    roundRect(ctx, -rect.w / 2, -rect.h / 2, rect.w, rect.h, 6);
    ctx.stroke();
  }

  // The pin.
  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.arc(0, -rect.h / 2 + 10, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e77a6a';
  ctx.beginPath();
  ctx.arc(-2, -rect.h / 2 + 8, 2.2, 0, Math.PI * 2);
  ctx.fill();

  text(ctx, order.recipe.name.toUpperCase(), 0, -rect.h / 2 + 32, 'bold 19px Georgia, serif', INK);
  if (targeted) text(ctx, 'TARGET', -rect.w / 2 + 40, -rect.h / 2 + 32, 'bold 11px Verdana, sans-serif', '#b07d2b');

  // Ingredient chips, in recipe order.
  const items = order.recipe.items;
  const chipW = 62;
  const totalW = items.length * chipW - 10;
  items.forEach((id, i) => {
    const cx = -totalW / 2 + i * chipW + 26;
    const cy = 4;
    ctx.fillStyle = '#f3e6cd';
    roundRect(ctx, cx - 26, cy - 26, 52, 52, 9);
    ctx.fill();
    drawIngredientIcon(ctx, id, cx, cy, 19);
    drawPrepBadge(ctx, ingredientById(id).prep, cx + 19, cy - 19, 9);
  });

  // Patience bar and price.
  const barW = rect.w - 110;
  ctx.fillStyle = '#e3d3ae';
  roundRect(ctx, -rect.w / 2 + 14, rect.h / 2 - 26, barW, 10, 5);
  ctx.fill();
  ctx.fillStyle = patienceColor(frac);
  if (frac > 0) {
    roundRect(ctx, -rect.w / 2 + 14, rect.h / 2 - 26, Math.max(10, barW * frac), 10, 5);
    ctx.fill();
  }
  drawCoin(ctx, rect.w / 2 - 52, rect.h / 2 - 21, 10);
  text(ctx, `${order.recipe.price}`, rect.w / 2 - 38, rect.h / 2 - 21, 'bold 17px Georgia, serif', INK, 'left');

  ctx.restore();
}

function drawBoard(ctx, game, now) {
  ctx.fillStyle = '#6d4423';
  roundRect(ctx, BOARD.x - 6, BOARD.y - 6, BOARD.w + 12, BOARD.h + 12, 10);
  ctx.fill();
  ctx.fillStyle = '#b08968';
  roundRect(ctx, BOARD.x, BOARD.y, BOARD.w, BOARD.h, 6);
  ctx.fill();

  for (let slot = 0; slot < MAX_ORDERS; slot += 1) {
    const order = game.orders[slot];
    if (order) {
      drawTicket(ctx, game, order, slot, now);
    } else {
      const rect = ticketRect(slot);
      ctx.strokeStyle = 'rgba(58,36,21,0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 7]);
      roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 6);
      ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, 'waiting for the next order…', rect.x + rect.w / 2, rect.y + rect.h / 2, 'italic 15px Georgia, serif', 'rgba(58,36,21,0.55)');
    }
  }
}

// ---- the back counter and its stations ------------------------------------

function drawWall(ctx, game, now) {
  // Wall and the window between the stations.
  ctx.fillStyle = '#efdcae';
  ctx.fillRect(0, 216, VIEW.width, 114);
  ctx.fillStyle = '#e2c78f';
  for (let x = 0; x < VIEW.width; x += 60) ctx.fillRect(x, 216, 2, 114);

  const win = { x: 400, y: 224, w: 400, h: 96 };
  ctx.fillStyle = '#7fb6d9';
  ctx.fillRect(win.x, win.y, win.w, win.h);
  ctx.fillStyle = '#a8d0e6';
  ctx.fillRect(win.x, win.y, win.w, 34);
  ctx.fillStyle = '#f7c948';
  ctx.beginPath();
  ctx.arc(win.x + 70, win.y + 30, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5d8aa8';
  ctx.beginPath();
  ctx.moveTo(win.x, win.y + win.h);
  ctx.lineTo(win.x + 90, win.y + 58);
  ctx.lineTo(win.x + 210, win.y + win.h);
  ctx.lineTo(win.x + 300, win.y + 66);
  ctx.lineTo(win.x + win.w, win.y + win.h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = WOOD;
  ctx.lineWidth = 8;
  ctx.strokeRect(win.x, win.y, win.w, win.h);
  ctx.beginPath();
  ctx.moveTo(win.x + win.w / 2, win.y);
  ctx.lineTo(win.x + win.w / 2, win.y + win.h);
  ctx.stroke();

  // A wall clock whose hand is the shift timer.
  const cx = 1058;
  const cy = 268;
  ctx.fillStyle = PAPER;
  ctx.beginPath();
  ctx.arc(cx, cy, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = WOOD;
  ctx.lineWidth = 4;
  ctx.stroke();
  const angle = -Math.PI / 2 + (1 - game.timeLeft / 150) * Math.PI * 2;
  ctx.strokeStyle = '#e4572e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(angle) * 21, cy + Math.sin(angle) * 21);
  ctx.stroke();

  // Hanging utensils under the window.
  ctx.strokeStyle = '#8a8a8a';
  ctx.lineWidth = 3;
  for (const dx of [452, 520, 690, 756]) {
    ctx.beginPath();
    ctx.moveTo(dx, 322);
    ctx.lineTo(dx, 344);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(dx, 352, 6, 9, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawProgressRing(ctx, cx, cy, r, frac, color) {
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
  ctx.stroke();
}

function drawStation(ctx, game, stationId, now) {
  const rect = STATION_RECTS[stationId];
  const station = game.stations[stationId];
  const shakeX = game.shake[stationId] > 0 ? Math.sin(now * 95) * 3.5 : 0;
  const cx = rect.x + rect.w / 2 + shakeX;
  const cy = rect.y + 52;

  ctx.save();
  ctx.translate(shakeX, 0);

  if (stationId === 'chop') {
    ctx.fillStyle = '#d9a05b';
    roundRect(ctx, rect.x + 14, rect.y + 14, rect.w - 28, 84, 10);
    ctx.fill();
    ctx.strokeStyle = '#b57e3a';
    ctx.lineWidth = 2;
    roundRect(ctx, rect.x + 14, rect.y + 14, rect.w - 28, 84, 10);
    ctx.stroke();
    if (station) {
      const jiggle = station.done ? 0 : Math.abs(Math.sin(now * 22)) * 3;
      drawIngredientIcon(ctx, station.item, cx, cy + jiggle * 0.3, 26);
      // The knife, chopping while the board is busy.
      ctx.save();
      ctx.translate(cx + 52, cy - 26);
      ctx.rotate(station.done ? -0.4 : -0.4 + Math.abs(Math.sin(now * 22)) * 0.55);
      ctx.fillStyle = '#dfe3e6';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(38, 6);
      ctx.lineTo(36, 14);
      ctx.lineTo(2, 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#6d4423';
      roundRect(ctx, -14, 2, 15, 7, 3);
      ctx.fill();
      ctx.restore();
    } else {
      text(ctx, 'CHOPPING BOARD', cx, cy, 'bold 14px Verdana, sans-serif', 'rgba(58,36,21,0.5)');
    }
  } else {
    // The stove: one black top under both the grill and the pot.
    if (stationId === 'grill') {
      ctx.fillStyle = '#33302e';
      roundRect(ctx, STATION_RECTS.grill.x - 6, rect.y + 8, (STATION_RECTS.boil.x + STATION_RECTS.boil.w) - STATION_RECTS.grill.x + 12, 96, 12);
      ctx.fill();
    }
    if (stationId === 'grill') {
      ctx.fillStyle = '#1f1d1b';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 6, 58, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#555049';
      ctx.lineWidth = 3;
      for (const dy of [-12, 0, 12]) {
        ctx.beginPath();
        ctx.moveTo(cx - 48, cy + 6 + dy);
        ctx.lineTo(cx + 48, cy + 6 + dy);
        ctx.stroke();
      }
      if (station) {
        drawIngredientIcon(ctx, station.item, cx, cy, 25);
        if (!station.done) {
          ctx.fillStyle = 'rgba(244,132,43,0.85)';
          for (let i = 0; i < 5; i += 1) {
            const px = cx - 36 + ((i * 53 + Math.floor(now * 9) * 29) % 72);
            const py = cy - 12 - ((now * 46 + i * 17) % 22);
            ctx.fillRect(px, py, 2.4, 2.4);
          }
        }
      }
    } else {
      ctx.fillStyle = '#9aa3a8';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 16, 52, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7c858b';
      roundRect(ctx, cx - 52, cy - 22, 104, 40, 8);
      ctx.fill();
      ctx.fillStyle = '#b9c6cc';
      ctx.beginPath();
      ctx.ellipse(cx, cy - 22, 52, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      if (station) {
        drawIngredientIcon(ctx, station.item, cx, cy - 30, 21);
        if (!station.done) {
          ctx.strokeStyle = 'rgba(255,255,255,0.75)';
          ctx.lineWidth = 2;
          for (let i = 0; i < 3; i += 1) {
            const sx = cx - 22 + i * 20;
            const sy = cy - 52 - ((now * 26 + i * 13) % 18);
            ctx.beginPath();
            ctx.moveTo(sx, sy + 10);
            ctx.quadraticCurveTo(sx + 5, sy + 4, sx, sy - 4);
            ctx.stroke();
          }
        }
      }
    }
  }

  // Station state: a ring while it works, a READY tag when it is done.
  if (station) {
    if (station.done) {
      const pulse = 1 + Math.sin(now * 6) * 0.06;
      ctx.save();
      ctx.translate(cx, rect.y + 106);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = '#7fb069';
      roundRect(ctx, -38, -11, 76, 22, 11);
      ctx.fill();
      text(ctx, 'READY!', 0, 1, 'bold 13px Verdana, sans-serif', '#ffffff');
      ctx.restore();
    } else {
      drawProgressRing(ctx, rect.x + rect.w - 24, rect.y + 22, 11, station.t / station.dur, BRASS);
    }
  }
  ctx.restore();

  // The brass name plate on the counter front, just under the station.
  const label = { chop: 'CHOP', grill: 'GRILL', boil: 'BOIL' }[stationId];
  text(ctx, label, rect.x + rect.w / 2, rect.y + rect.h - 2, 'bold 12px Verdana, sans-serif', '#e8c98f');
}

function drawBackCounter(ctx, game, now) {
  drawWall(ctx, game, now);
  // Counter body the stations stand on.
  ctx.fillStyle = WOOD_LIGHT;
  ctx.fillRect(0, 322, VIEW.width, 14);
  ctx.fillStyle = WOOD;
  ctx.fillRect(0, 336, VIEW.width, 134);
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  for (let x = 90; x < VIEW.width; x += 180) ctx.fillRect(x, 344, 3, 118);
  drawStation(ctx, game, 'chop', now);
  drawStation(ctx, game, 'grill', now);
  drawStation(ctx, game, 'boil', now);
}

// ---- the assembly counter ---------------------------------------------------

function drawAssembly(ctx, game, now) {
  // Counter body.
  ctx.fillStyle = '#7c4c26';
  ctx.fillRect(0, 470, VIEW.width, 170);
  ctx.fillStyle = WOOD_LIGHT;
  ctx.fillRect(0, 470, VIEW.width, 14);
  ctx.fillStyle = 'rgba(0,0,0,0.14)';
  for (let x = 140; x < VIEW.width; x += 220) ctx.fillRect(x, 492, 3, 140);

  const shakeX = game.shake.plate > 0 ? Math.sin(now * 95) * 4 : 0;

  // Target chips: what the pinned ticket still needs.
  const target = game.targetOrder();
  if (target) {
    text(ctx, `MAKING: ${target.recipe.name}`, 600, TARGET_CHIPS_Y - 2, 'bold 15px Verdana, sans-serif', '#f3e2c7');
    const items = target.recipe.items;
    const chipW = 44;
    const totalW = items.length * chipW - 6;
    const remaining = [...game.plate];
    items.forEach((id, i) => {
      const cx = 600 - totalW / 2 + i * chipW + 19;
      const cy = TARGET_CHIPS_Y + 24;
      const at = remaining.indexOf(id);
      const done = at >= 0;
      if (done) remaining.splice(at, 1);
      ctx.fillStyle = done ? 'rgba(127,176,105,0.35)' : 'rgba(0,0,0,0.25)';
      roundRect(ctx, cx - 19, cy - 19, 38, 38, 8);
      ctx.fill();
      ctx.globalAlpha = done ? 0.55 : 1;
      drawIngredientIcon(ctx, id, cx, cy, 14);
      ctx.globalAlpha = 1;
      if (done) text(ctx, '✓', cx + 12, cy - 12, 'bold 14px Verdana, sans-serif', '#a9d18e');
    });
  } else if (game.phase === PHASE.PLAYING) {
    text(ctx, 'Click a ticket to target it — or just build a dish and ring SERVE', 600, TARGET_CHIPS_Y + 8, 'italic 15px Georgia, serif', 'rgba(243,226,199,0.75)');
  }

  // Trash button.
  ctx.fillStyle = '#8c3b2e';
  roundRect(ctx, TRASH_BUTTON.x, TRASH_BUTTON.y, TRASH_BUTTON.w, TRASH_BUTTON.h, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 2;
  roundRect(ctx, TRASH_BUTTON.x, TRASH_BUTTON.y, TRASH_BUTTON.w, TRASH_BUTTON.h, 10);
  ctx.stroke();
  ctx.fillStyle = '#fdf6e3';
  ctx.fillRect(TRASH_BUTTON.x + 26, TRASH_BUTTON.y + 16, 26, 6);
  ctx.fillRect(TRASH_BUTTON.x + 30, TRASH_BUTTON.y + 24, 18, 26);
  text(ctx, 'TRASH', TRASH_BUTTON.x + 122, TRASH_BUTTON.y + 32, 'bold 17px Verdana, sans-serif', '#fdf6e3');

  // The plate and its stack.
  ctx.save();
  ctx.translate(shakeX, 0);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(PLATE.x, PLATE.y + 12, PLATE.rx + 12, PLATE.ry + 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f4f1ea';
  ctx.beginPath();
  ctx.ellipse(PLATE.x, PLATE.y, PLATE.rx, PLATE.ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#cfc8ba';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(PLATE.x, PLATE.y, PLATE.rx - 16, PLATE.ry - 7, 0, 0, Math.PI * 2);
  ctx.stroke();
  game.plate.forEach((id, i) => {
    drawPlateLayer(ctx, id, PLATE.x, PLATE.y - 4 - i * 11, 168 - Math.min(i * 6, 30));
  });
  if (game.plate.length === 0) {
    text(ctx, 'the plate is empty', PLATE.x, PLATE.y - 2, 'italic 14px Georgia, serif', 'rgba(58,36,21,0.5)');
  }
  ctx.restore();

  // What is on the plate, named in chips under it.
  game.plate.forEach((id, i) => {
    const chipW = 96;
    const totalW = game.plate.length * chipW - 8;
    const x = 600 - totalW / 2 + i * chipW;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    roundRect(ctx, x, 606, 88, 26, 13);
    ctx.fill();
    text(ctx, ingredientById(id).name, x + 44, 620, '12px Verdana, sans-serif', '#f3e2c7');
  });

  // The serve bell. It glows when the plate matches a ticket.
  const ready = game.plate.length > 0 && game.orders.some((o) => plateMatchesRecipe(game.plate, o.recipe));
  ctx.fillStyle = ready ? '#5d8a45' : '#4a2d18';
  roundRect(ctx, SERVE_BUTTON.x, SERVE_BUTTON.y, SERVE_BUTTON.w, SERVE_BUTTON.h, 10);
  ctx.fill();
  if (ready) {
    ctx.strokeStyle = '#a9d18e';
    ctx.lineWidth = 3;
    roundRect(ctx, SERVE_BUTTON.x, SERVE_BUTTON.y, SERVE_BUTTON.w, SERVE_BUTTON.h, 10);
    ctx.stroke();
  }
  const bellX = SERVE_BUTTON.x + 42;
  const bellY = SERVE_BUTTON.y + 30;
  ctx.fillStyle = BRASS;
  ctx.beginPath();
  ctx.arc(bellX, bellY + 4, 15, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(bellX - 18, bellY + 4, 36, 4);
  ctx.beginPath();
  ctx.arc(bellX, bellY - 13, 4, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, 'SERVE', SERVE_BUTTON.x + 122, SERVE_BUTTON.y + 32, 'bold 17px Verdana, sans-serif', '#fdf6e3');

  if (ready) {
    const bounce = Math.sin(now * 5) * 3;
    text(ctx, 'READY TO SERVE!', 600, 448 + bounce, 'bold 19px Georgia, serif', '#a9d18e');
  }
}

// ---- the ingredient bins ------------------------------------------------------

function drawBins(ctx, game) {
  ctx.fillStyle = '#5d3a1e';
  ctx.fillRect(0, 640, VIEW.width, 160);
  ctx.fillStyle = WOOD_LIGHT;
  ctx.fillRect(0, 640, VIEW.width, 12);

  INGREDIENTS.forEach((item, i) => {
    const rect = binRect(i);
    const busyStation = item.prep !== 'raw' ? game.stations[item.prep] : null;
    ctx.fillStyle = '#d8cfc0';
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10);
    ctx.fill();
    ctx.fillStyle = '#b8ab94';
    roundRect(ctx, rect.x + 5, rect.y + 5, rect.w - 10, 62, 8);
    ctx.fill();
    drawIngredientIcon(ctx, item.id, rect.x + rect.w / 2, rect.y + 36, 23);
    text(ctx, item.name, rect.x + rect.w / 2, rect.y + 84, 'bold 13px Verdana, sans-serif', INK);
    text(ctx, item.prep === 'raw' ? 'ready to plate' : `${ingredientStationName(item.prep)} ${item.seconds}s`, rect.x + rect.w / 2, rect.y + 104, '11px Verdana, sans-serif', '#7a6248');

    // The key cap and the prep badge.
    ctx.fillStyle = INK;
    roundRect(ctx, rect.x + 7, rect.y + 7, 20, 20, 5);
    ctx.fill();
    text(ctx, item.key, rect.x + 17, rect.y + 18, 'bold 12px Verdana, sans-serif', '#fdf6e3');
    drawPrepBadge(ctx, item.prep, rect.x + rect.w - 16, rect.y + 17, 10);

    if (busyStation) {
      ctx.fillStyle = 'rgba(43,26,16,0.45)';
      roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10);
      ctx.fill();
      const label = busyStation.done ? 'READY ↑' : 'at the station…';
      text(ctx, label, rect.x + rect.w / 2, rect.y + 40, 'bold 13px Verdana, sans-serif', '#fdf6e3');
    }
  });
}

function ingredientStationName(prep) {
  return { chop: 'board', grill: 'grill', boil: 'pot' }[prep] || '';
}

// ---- floaters and overlays ------------------------------------------------------

function drawFloaters(ctx, game) {
  for (const f of game.floaters) {
    const frac = f.t / f.life;
    ctx.globalAlpha = 1 - frac;
    text(ctx, f.text, f.x, f.y - frac * 44, 'bold 24px Georgia, serif', f.color);
  }
  ctx.globalAlpha = 1;
}

function drawPanel(ctx, title, lines, buttonLabel) {
  ctx.fillStyle = 'rgba(26,13,5,0.62)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = PAPER;
  roundRect(ctx, PANEL.x, PANEL.y, PANEL.w, PANEL.h, 14);
  ctx.fill();
  ctx.strokeStyle = WOOD;
  ctx.lineWidth = 5;
  roundRect(ctx, PANEL.x, PANEL.y, PANEL.w, PANEL.h, 14);
  ctx.stroke();
  text(ctx, title, 600, PANEL.y + 52, 'bold 34px Georgia, serif', INK);
  lines.forEach((line, i) => {
    text(ctx, line.text, 600, PANEL.y + 104 + i * 30, line.font || '17px Georgia, serif', line.color || INK);
  });
  if (buttonLabel) {
    ctx.fillStyle = '#5d8a45';
    roundRect(ctx, PANEL_BUTTON.x, PANEL_BUTTON.y, PANEL_BUTTON.w, PANEL_BUTTON.h, 12);
    ctx.fill();
    text(ctx, buttonLabel, 600, PANEL_BUTTON.y + 30, 'bold 20px Verdana, sans-serif', '#ffffff');
  }
}

function drawOverlay(ctx, game) {
  if (game.phase === PHASE.TITLE) {
    drawPanel(ctx, 'THE COPPER LADLE', [
      { text: 'a tiny diner cooking game', font: 'italic 17px Georgia, serif', color: '#7a6248' },
      { text: '' },
      { text: 'Orders land on the cork board. Each ticket lists its dish.' },
      { text: 'Click ingredients to start them — some need the chopping' },
      { text: 'board, the grill or the pot first. Click a ready station' },
      { text: 'to plate its food, match a ticket exactly, then SERVE.' },
      { text: '' },
      { text: 'Serve fast for bonuses and combos. Three walk-outs', color: '#8c3b2e' },
      { text: 'and the diner closes early. The shift lasts 2:30.', color: '#8c3b2e' },
    ], 'START SHIFT');
  } else if (game.phase === PHASE.PAUSED) {
    drawPanel(ctx, 'PAUSED', [
      { text: 'The pans are holding. Nothing burns while you rest.' },
      { text: '' },
      { text: 'Press P or click the button to keep cooking.' },
    ], 'RESUME');
  } else if (game.phase === PHASE.OVER) {
    const hats = game.hats();
    drawPanel(ctx, 'SHIFT OVER', [
      { text: game.overReason, font: 'italic 16px Georgia, serif', color: '#7a6248' },
      { text: '' },
      { text: `Coins earned ............ ${game.coins}`, font: 'bold 19px Georgia, serif' },
      { text: `Dishes served ........... ${game.served}`, font: 'bold 19px Georgia, serif' },
      { text: `Orders lost ............... ${game.lost}`, font: 'bold 19px Georgia, serif' },
      { text: `Best combo ............... x${game.bestCombo}`, font: 'bold 19px Georgia, serif' },
      { text: '' },
      { text: `Diner rating: ${'★'.repeat(hats)}${'☆'.repeat(3 - hats)}`, font: 'bold 21px Georgia, serif', color: '#b07d2b' },
    ], 'COOK AGAIN');
  }
}

// ---- the whole scene ---------------------------------------------------------

export function render(ctx, game, now) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = '#efdcae';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  drawBoard(ctx, game, now);
  drawBackCounter(ctx, game, now);
  drawAssembly(ctx, game, now);
  drawBins(ctx, game);
  drawHud(ctx, game);
  drawFloaters(ctx, game);
  if (game.phase !== PHASE.PLAYING) drawOverlay(ctx, game);
}
