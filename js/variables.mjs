export let X = 0,
  Y = 0,
  SCALE = 10,
  TIME = 0,
  PROPER_TIME = 0;
export let VEL_X = 0, VEL_Y = 0;

export function setX(newX) {
  X = newX;
}

export function setY(newY) {
  Y = newY;
}

export function setScale(newScale) {
  SCALE = newScale;
}

export function setTime(newTime) {
  TIME = newTime;
}

export function setProperTime(newProperTime) {
  PROPER_TIME = newProperTime;
}

export function setVelX(newVelX) {
  VEL_X = newVelX;
}

export function setVelY(newVelY) {
  VEL_Y = newVelY;
}

export let TIMELIKE_VIEW = false;

function setTimelikeView(newTimelikeView) {
  TIMELIKE_VIEW = newTimelikeView;
}

export const LIGHT_TRAVEL_TIME_DELAY = true;
export const LIGHT_TRAVEL_TIME_DELAY_INCLUDES_SHIP_VELOCITY = true;
// let SHIP_TIME_DIALATION = true;
export const UNIVERSE_TIME_SHIFTING = true;
export const UNIVERSE_LENGTH_CONTRACTION = true;
export const ITEM_LENGTH_CONTRACTION = true;
export const BLACK_BEFORE_UNIVERSE_START = true;
export const SHIP_RELATIVISTIC_VELOCITY_ADDITION = true;
export const RINDLER_METRIC_WHEN_ACCELERATING = false;
export const RINDLER_METRIC_WHEN_ACCELERATING_TIMELIKE_VIEW = false;
export const HIDE_RINDLER_METRIC_PAST_SINGULARITY = false;
export const TIMELIKE_VIEW_NORMALIZED_X_COORDINATE = false; // squish timelike view x coordinate so that light is a 45 degree diagonal
let MOUSEDRAG_RELATIVE_TO_FRAME = true;

export const BACKGROUND_PULSE = true;
export const SPEED_OF_LIGHT = 1;

export const ACCEL = 1;
export const TIME_RATE = 1;

export let TIME_ADVANCING = false;

export function setTimeAdvancing(newTimeAdvancing) {
  TIME_ADVANCING = newTimeAdvancing;
}

export const SUBPIXEL_SCALE = 2;
