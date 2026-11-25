// The Copper Ladle — the food, drawn in code.
//
// No image files: every ingredient is a handful of canvas shapes. The same
// drawing serves three places — the bins along the front counter, the chips
// on an order ticket, and the layers stacked on the plate — so a tomato
// looks like a tomato everywhere a player meets one.

import { PREP } from './recipes.js';

export function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function circle(ctx, x, y, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

// A wavy leaf/frill line, used for lettuce wherever it appears.
function frill(ctx, cx, cy, w, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  const bumps = 6;
  for (let i = 0; i <= bumps; i += 1) {
    const x = cx - w / 2 + (w * i) / bumps;
    const y = cy + (i % 2 === 0 ? -4 : 4);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.lineTo(cx + w / 2, cy + 9);
  ctx.lineTo(cx - w / 2, cy + 9);
  ctx.closePath();
  ctx.fill();
}

// Draw one ingredient as a counter icon, centred on (cx, cy), roughly
// 2s wide and 2s tall.
export function drawIngredientIcon(ctx, id, cx, cy, s) {
  ctx.save();
  ctx.translate(cx, cy);
  switch (id) {
    case 'bun': {
      ctx.fillStyle = '#e8b96a';
      ctx.beginPath();
      ctx.arc(0, 4, s * 0.92, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#d99f45';
      roundRect(ctx, -s * 0.92, 2, s * 1.84, s * 0.42, 5);
      ctx.fill();
      ctx.fillStyle = '#fdf0d0';
      for (const [dx, dy] of [[-10, -8], [2, -13], [11, -6], [-3, -4]]) {
        ctx.beginPath();
        ctx.ellipse(dx * s / 22, dy * s / 22, 2.4, 1.4, 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'patty': {
      ctx.fillStyle = '#8a5a33';
      roundRect(ctx, -s * 0.95, -s * 0.42, s * 1.9, s * 0.84, 9);
      ctx.fill();
      ctx.fillStyle = '#6f4525';
      for (const [dx, dy] of [[-12, -3], [4, 4], [13, -5], [-2, -7]]) circle(ctx, dx * s / 22, dy * s / 22, 2, '#6f4525');
      break;
    }
    case 'cheese': {
      ctx.fillStyle = '#f7c948';
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.85);
      ctx.lineTo(s * 0.95, s * 0.6);
      ctx.lineTo(-s * 0.95, s * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#e0aa22';
      circle(ctx, -4, 4, 3.2, '#e0aa22');
      circle(ctx, 7, 8, 2.4, '#e0aa22');
      circle(ctx, 1, -3, 2, '#e0aa22');
      break;
    }
    case 'lettuce': {
      frill(ctx, 0, -4, s * 1.9, '#7fb069');
      frill(ctx, 0, 5, s * 1.7, '#95c284');
      break;
    }
    case 'tomato': {
      circle(ctx, 0, 2, s * 0.88, '#e4572e');
      circle(ctx, -s * 0.3, -s * 0.25, s * 0.28, '#f07a52');
      ctx.fillStyle = '#4e7a3a';
      ctx.beginPath();
      for (let i = 0; i < 5; i += 1) {
        const a = (i / 5) * Math.PI * 2;
        ctx.ellipse(Math.cos(a) * 5, -s * 0.78 + Math.sin(a) * 2.4, 4.4, 2.2, a, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'onion': {
      circle(ctx, 0, 0, s * 0.9, '#f3e9f7');
      ctx.strokeStyle = '#c9a6dd';
      ctx.lineWidth = 2;
      for (const r of [s * 0.62, s * 0.34]) {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.strokeStyle = '#a87fc4';
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.9);
      ctx.quadraticCurveTo(3, -s * 1.15, 7, -s * 1.1);
      ctx.stroke();
      break;
    }
    case 'pasta': {
      ctx.strokeStyle = '#f2d38a';
      ctx.lineWidth = 3.4;
      for (let ring = 0; ring < 3; ring += 1) {
        ctx.beginPath();
        ctx.arc(0, 0, s * (0.3 + ring * 0.26), ring * 1.2, ring * 1.2 + Math.PI * 1.55);
        ctx.stroke();
      }
      ctx.strokeStyle = '#e0b95e';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.82, 2.4, 4.4);
      ctx.stroke();
      break;
    }
    case 'egg': {
      ctx.fillStyle = '#fdf6e3';
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.98, s * 0.78, 0.3, 0, Math.PI * 2);
      ctx.fill();
      circle(ctx, 1, 0, s * 0.42, '#f7b32b');
      circle(ctx, -2, -3, s * 0.15, '#ffd166');
      break;
    }
    case 'chicken': {
      ctx.fillStyle = '#d99058';
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.95, s * 0.68, -0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#a8642f';
      ctx.lineWidth = 2.4;
      for (const dx of [-9, 0, 9]) {
        ctx.beginPath();
        ctx.moveTo(dx * s / 22 - 4, -s * 0.4);
        ctx.lineTo(dx * s / 22 + 4, s * 0.4);
        ctx.stroke();
      }
      break;
    }
    case 'shroom': {
      ctx.fillStyle = '#b08968';
      ctx.beginPath();
      ctx.arc(0, 2, s * 0.92, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#e9dcc8';
      circle(ctx, -8, -6, 3, '#e9dcc8');
      circle(ctx, 6, -10, 2.4, '#e9dcc8');
      circle(ctx, 11, -2, 2, '#e9dcc8');
      ctx.fillStyle = '#e5d3b3';
      roundRect(ctx, -s * 0.28, 2, s * 0.56, s * 0.62, 4);
      ctx.fill();
      break;
    }
    default:
      circle(ctx, 0, 0, s * 0.8, '#cccccc');
  }
  ctx.restore();
}

// Draw one ingredient as a layer of the stack on the plate: a wide, low
// shape centred on cx, sitting on the baseline cy (its bottom edge).
export function drawPlateLayer(ctx, id, cx, cy, w) {
  const half = w / 2;
  ctx.save();
  ctx.translate(cx, cy);
  switch (id) {
    case 'bun':
      ctx.fillStyle = '#e8b96a';
      roundRect(ctx, -half, -13, w, 13, 6);
      ctx.fill();
      ctx.fillStyle = '#f5cd85';
      roundRect(ctx, -half, -13, w, 5, 3);
      ctx.fill();
      break;
    case 'patty':
      ctx.fillStyle = '#8a5a33';
      roundRect(ctx, -half, -12, w, 12, 6);
      ctx.fill();
      break;
    case 'cheese':
      ctx.fillStyle = '#f7c948';
      ctx.beginPath();
      ctx.moveTo(-half - 6, -11);
      ctx.lineTo(half + 6, -11);
      ctx.lineTo(half - 4, -2);
      ctx.lineTo(half - 22, -7);
      ctx.lineTo(half - 44, -1);
      ctx.lineTo(-half + 30, -6);
      ctx.lineTo(-half + 8, -1);
      ctx.closePath();
      ctx.fill();
      break;
    case 'lettuce':
      frill(ctx, 0, -8, w + 14, '#7fb069');
      break;
    case 'tomato':
      ctx.fillStyle = '#e4572e';
      roundRect(ctx, -half + 8, -11, w - 16, 11, 5);
      ctx.fill();
      ctx.fillStyle = '#f07a52';
      for (const dx of [-40, 0, 40]) circle(ctx, dx, -5.5, 2.4, '#f07a52');
      break;
    case 'onion':
      ctx.fillStyle = '#f3e9f7';
      roundRect(ctx, -half + 16, -9, w - 32, 9, 4);
      ctx.fill();
      ctx.strokeStyle = '#c9a6dd';
      ctx.lineWidth = 1.6;
      for (const dx of [-44, -14, 16, 46]) {
        ctx.beginPath();
        ctx.arc(dx, -4.5, 4.6, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    case 'pasta':
      ctx.fillStyle = '#f2d38a';
      ctx.beginPath();
      ctx.ellipse(0, -6, half, 9, 0, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#e0b95e';
      ctx.lineWidth = 2;
      for (const dx of [-50, -18, 14, 46]) {
        ctx.beginPath();
        ctx.arc(dx, -8, 7, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
      }
      break;
    case 'egg':
      ctx.fillStyle = '#fdf6e3';
      ctx.beginPath();
      ctx.ellipse(0, -5, half - 12, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      circle(ctx, 0, -6, 6.4, '#f7b32b');
      break;
    case 'chicken':
      ctx.fillStyle = '#d99058';
      roundRect(ctx, -half + 6, -13, w - 12, 13, 6);
      ctx.fill();
      ctx.strokeStyle = '#a8642f';
      ctx.lineWidth = 2;
      for (const dx of [-42, -14, 14, 42]) {
        ctx.beginPath();
        ctx.moveTo(dx - 4, -11);
        ctx.lineTo(dx + 4, -3);
        ctx.stroke();
      }
      break;
    case 'shroom':
      ctx.fillStyle = '#cbb59a';
      roundRect(ctx, -half + 12, -8, w - 24, 8, 4);
      ctx.fill();
      ctx.fillStyle = '#b08968';
      for (const dx of [-46, -15, 16, 47]) {
        ctx.beginPath();
        ctx.arc(dx, -8, 8.5, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
      }
      break;
    default:
      ctx.fillStyle = '#cccccc';
      roundRect(ctx, -half, -10, w, 10, 5);
      ctx.fill();
  }
  ctx.restore();
}

// A small badge naming the prep an ingredient needs: a knife for the board,
// a flame for the grill, bubbles for the pot, nothing for raw.
export function drawPrepBadge(ctx, prep, x, y, s) {
  if (prep === PREP.RAW) return;
  ctx.save();
  ctx.translate(x, y);
  circle(ctx, 0, 0, s, '#3a2415');
  ctx.strokeStyle = '#e8b96a';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, 0, s, 0, Math.PI * 2);
  ctx.stroke();
  if (prep === PREP.CHOP) {
    ctx.strokeStyle = '#e8e8e8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-s * 0.5, s * 0.45);
    ctx.lineTo(s * 0.42, -s * 0.42);
    ctx.stroke();
    ctx.strokeStyle = '#b08968';
    ctx.beginPath();
    ctx.moveTo(s * 0.42, -s * 0.42);
    ctx.lineTo(s * 0.62, -s * 0.2);
    ctx.stroke();
  } else if (prep === PREP.GRILL) {
    ctx.fillStyle = '#f4842b';
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.62);
    ctx.quadraticCurveTo(s * 0.5, -s * 0.05, s * 0.34, s * 0.3);
    ctx.quadraticCurveTo(s * 0.2, s * 0.6, 0, s * 0.6);
    ctx.quadraticCurveTo(-s * 0.2, s * 0.6, -s * 0.34, s * 0.3);
    ctx.quadraticCurveTo(-s * 0.5, -s * 0.05, 0, -s * 0.62);
    ctx.fill();
    ctx.fillStyle = '#f7c948';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.28, s * 0.18, s * 0.26, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (prep === PREP.BOIL) {
    ctx.strokeStyle = '#a8d8ea';
    ctx.lineWidth = 1.8;
    for (const [dx, dy, r] of [[-4, 2, 3], [3, -3, 2.4], [5, 4, 1.8]]) {
      ctx.beginPath();
      ctx.arc(dx, dy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// A gold coin with a stamped rim, for prices and the score.
export function drawCoin(ctx, x, y, r) {
  circle(ctx, x, y, r, '#f7c948');
  ctx.strokeStyle = '#c9930a';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(x, y, r - 1, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#c9930a';
  ctx.font = `bold ${Math.round(r * 1.05)}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('c', x, y + 1);
}

// A five-pointed star, filled (a life kept) or hollow (a life lost).
export function drawStar(ctx, x, y, r, filled) {
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = x + Math.cos(a) * rad;
    const py = y + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  if (filled) {
    ctx.fillStyle = '#f7c948';
    ctx.fill();
  }
  ctx.strokeStyle = filled ? '#c9930a' : '#8a6a45';
  ctx.lineWidth = 1.6;
  ctx.stroke();
}
