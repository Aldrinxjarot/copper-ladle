[![make.fun bounty](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/Aldrinxjarot/copper-ladle/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/Aldrinxjarot/copper-ladle/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

# The Copper Ladle

A tiny diner cooking game for make.fun's "Make the best cooking game"
bounty, built as static files with no build step and no network calls.

## Play

Open `game/index.html` in a desktop browser (or serve `game/` with any
static file server). Orders land on the cork board; each ticket lists a
dish. Click ingredients along the front counter to start them — some go
straight to the plate, others must visit the chopping board, the grill or
the boiling pot first. Click a ready station to plate its food, match a
ticket exactly, then ring SERVE before the customer's patience runs out.
Fast serves pay bonuses, streaks build a combo, and three walk-outs close
the diner early. The shift lasts two and a half minutes.

Keys: 1–0 pick ingredients, Space serves, Backspace trashes the plate,
P pauses, M mutes.

## Layout

- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to
  the output folder and writes `dossier.json` with the kit's library.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.
- `game/index.html`, `game/style.css` — the page and its frame.
- `game/js/recipes.js` — the menu: ingredients, stations, recipes.
- `game/js/kitchen.js` — the rules: orders, stations, scoring, the rush.
- `game/js/render.js` — the scene: board, counters, plate, overlays.
- `game/js/art.js` — the food, drawn in code.
- `game/js/audio.js` — kitchen sounds, synthesised with WebAudio.
- `game/js/layout.js` — where everything stands on the canvas.
- `game/js/main.js` — boot, mouse and keyboard, the frame loop.
- `screenshots/` — four real renders of the game, taken in a browser.

MIT licensed (see LICENSE).
