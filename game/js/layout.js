// The Copper Ladle — where everything stands on the 1200x800 canvas.
//
// One module owns every rectangle so the renderer and the click handler can
// never disagree about what a click hit. The kitchen reads top to bottom:
// the HUD strip, the order board, the back counter with its three stations,
// the assembly counter with the plate, and the ingredient bins along the
// front.

export const VIEW = { width: 1200, height: 800 };

export const HUD = { x: 0, y: 0, w: 1200, h: 58 };

// The order board: three ticket slots pinned in a row.
export const BOARD = { x: 16, y: 66, w: 1168, h: 150 };
export const TICKET_W = 376;
export const TICKET_H = 138;
export const TICKET_GAP = 20;

export function ticketRect(slot) {
  return {
    x: BOARD.x + 10 + slot * (TICKET_W + TICKET_GAP),
    y: BOARD.y + 6,
    w: TICKET_W,
    h: TICKET_H,
  };
}

// The back counter: chopping board left, grill and pot right, the window
// and shelves between them are scenery.
export const STATION_Y = 330;
export const STATION_H = 128;
export const STATION_RECTS = {
  chop: { x: 30, y: STATION_Y, w: 330, h: STATION_H },
  grill: { x: 850, y: STATION_Y, w: 155, h: STATION_H },
  boil: { x: 1015, y: STATION_Y, w: 155, h: STATION_H },
};

// The assembly counter: the plate in the middle, trash to its left, the
// big SERVE bell to its right.
export const PLATE = { x: 600, y: 556, rx: 128, ry: 36 };
export const TRASH_BUTTON = { x: 56, y: 512, w: 180, h: 62 };
export const SERVE_BUTTON = { x: 964, y: 512, w: 180, h: 62 };
export const TARGET_CHIPS_Y = 486;

// The front counter: ten ingredient bins in a row.
export const BIN_Y = 664;
export const BIN_H = 128;
export const BIN_W = 113;
export const BIN_GAP = 7;
export const BIN_X0 = 4;

export function binRect(index) {
  return { x: BIN_X0 + index * (BIN_W + BIN_GAP), y: BIN_Y, w: BIN_W, h: BIN_H };
}

// Small round buttons in the HUD's right corner.
export const PAUSE_BUTTON = { x: 1096, y: 10, w: 38, h: 38 };
export const MUTE_BUTTON = { x: 1144, y: 10, w: 38, h: 38 };

// Centred panels (start, pause, game over) share one card.
export const PANEL = { x: 330, y: 190, w: 540, h: 420 };
export const PANEL_BUTTON = { x: 470, y: 512, w: 260, h: 58 };

export function pointInRect(px, py, rect) {
  return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
}
