export class MouseMover {
  static #ZOOM_SCALE_FACTOR = (1 / 1.5) ** (1 / 120);
  static #INERTIA_SLOWDOWN = 10;
  static #INERTIA_FASTSLOWDOWN_TIME_THRESHOLD = 0.8;
  static #INERTIA_FASTSLOWDOWN_VEL_THRESHOLD = 3;
  static #INERTIA_SLOWDOWN_FACTOR = 0.1;
  static #INERTIA_MOVE_THRESHOLD = 1e-6;
  static #INERTIA_ZOOM_FACTOR = 20;
  static #INERTIA_ZOOM_THRESHOLD = 1e-2;
  static #PREV_MOUSE_BUFFER_LENGTH = 3;
  static #PREV_MOUSE_BUFFER_TIMESPAN = 0.1 * 1000;
  
  // multiplicative factor to multiply current scale by to get target scale
  #targetScaleDelta;
  
  constructor({
    mouseMotionElem,
  }) {
    mouseMotionElem.addEventListener('mousedown', e => {
      let x = e.x, y = e.y;
      
      mouseDown = true;
      
      pMouseX = x;
      pMouseY = y;
    });
    
    mouseMotionElem.addEventListener('mouseup', e => {
      timeUnclicked = performance.now();
      
      let minValidTime = timeUnclicked - MouseMover.#PREV_MOUSE_BUFFER_TIMESPAN;
      
      let mouseDragSum = previousMouseDrags.filter(x => x[2] > minValidTime).reduce((a, c) => [a[0] + c[0], a[1] + c[1]], [0, 0]);
      let mouseDrag = previousMouseDrags.length ? [mouseDragSum[0] / previousMouseDrags.length, mouseDragSum[1] / previousMouseDrags.length] : [0, 0];
      
      screenVelX = mouseDrag[0];
      screenVelY = mouseDrag[1];
      
      previousMouseDrags.splice(0, Infinity);
      
      mouseDown = false;
    });
    
    mouseMotionElem.addEventListener('mousemove', e => {
      let x = e.x, y = e.y;
      
      if (mouseDown) {
        screenVelX = x - pMouseX;
        screenVelY = -y + pMouseY;
        
        screenVelMag = Math.hypot(screenVelX, screenVelY);
        
        shiftShipPos(screenVelX, screenVelY);
      }
      
      pMouseX = x;
      pMouseY = y;
      
      previousMouseDrags.push([screenVelX, screenVelY, performance.now()]);
      if (previousMouseDrags.length > MouseMover.#PREV_MOUSE_BUFFER_LENGTH) {
        previousMouseDrags.splice(0, 1);
      }
      
      if (mouseDown) {
        movementLoop();
      }
    });
    
    mouseMotionElem.addEventListener('wheel', e => {
      let wheelDelta = e.wheelDelta;
      
      pMouseX = getRealCanvasWidth() / 2;
      pMouseY = getRealCanvasHeight() / 2;
      
      let scaleFactor = MouseMover.#ZOOM_SCALE_FACTOR ** wheelDelta;
      
      targetScale *= scaleFactor;
      
      targetScalePMouseX = pMouseX;
      targetScalePMouseY = pMouseY;
      
      if (!mouseDown) {
        screenVelX = 0;
        screenVelY = 0;
      }
      
      movementLoop();
    });
  }
  
  setTargetScaleDelta(targetScaleDelta) {
    this.#targetScaleDelta = targetScaleDelta;
  }
}

//let shiftShipPos;
//let getRealCanvasWidth;
//let getRealCanvasHeight;
//let getScale;
//let setScale;
//
//let screenVelX, screenVelY, screenVelMag;
//let targetScalePMouseX, targetScalePMouseY;
//let mouseDown = false;
//let pMouseX, pMouseY;
//let previousMouseDrags = [];
//let timeUnclicked;
//
//export let movementLoopRunning = false;

async function movementLoop() {
  if (movementLoopRunning) return;
  
  movementLoopRunning = true;
  
  let timestamp, pTimestamp;
  
  while (true) {
    let processMovement, processZoom;
    processMovement = Math.abs(screenVelX) >= MouseMover.#INERTIA_MOVE_THRESHOLD ||
      Math.abs(screenVelY) >= MouseMover.#INERTIA_MOVE_THRESHOLD;
    processZoom = Math.abs(Math.log(targetScale / getScale())) >= MouseMover.#INERTIA_ZOOM_THRESHOLD;
    
    let lastFrameTime;
    if (pTimestamp) {
      lastFrameTime = (timestamp - pTimestamp) / 1000;
    }
    
    // movement processing
    
    if (processMovement) {
      if (!mouseDown) {
        shiftShipPos(screenVelX, screenVelY);
        
        if (pTimestamp) {
          let newVelMag;
          let timeSinceUnclicked = (timestamp - timeUnclicked) / 1000;
          if (timeSinceUnclicked > MouseMover.#INERTIA_FASTSLOWDOWN_TIME_THRESHOLD && screenVelMag > MouseMover.#INERTIA_FASTSLOWDOWN_VEL_THRESHOLD) {
            // bigger for fast speeds
            newVelMag = Math.max((screenVelMag - MouseMover.#INERTIA_SLOWDOWN * lastFrameTime) * MouseMover.#INERTIA_SLOWDOWN_FACTOR ** lastFrameTime, 0);
          } else {
            // linear for slow speeds
            newVelMag = Math.max(screenVelMag - MouseMover.#INERTIA_SLOWDOWN * lastFrameTime, 0);
          }
          
          let slowdownFactor = screenVelMag != 0 ? newVelMag / screenVelMag : 0;
          
          screenVelX *= slowdownFactor;
          screenVelY *= slowdownFactor;
          
          screenVelMag = newVelMag;
        }
      }
    }
    
    // zoom processing
    
    if (processZoom && pTimestamp) {
      let scaleFactor = Math.exp(Math.log(targetScale / getScale()) * Math.min(MouseMover.#INERTIA_ZOOM_FACTOR * lastFrameTime, 1));
      
      setScale(getScale() * scaleFactor);
    }
    
    // call next iteration of loop
    
    if (
      Math.abs(screenVelX) < MouseMover.#INERTIA_MOVE_THRESHOLD &&
      Math.abs(screenVelY) < MouseMover.#INERTIA_MOVE_THRESHOLD &&
      Math.abs(Math.log(targetScale / getScale())) < MouseMover.#INERTIA_ZOOM_THRESHOLD
    ) {
      movementLoopRunning = false;
      pTimestamp = null;
      break;
    } else {
      pTimestamp = timestamp;
    }
    
    timestamp = await new Promise(r => window.requestAnimationFrame(r));
  }
}

export function init(newGetScale, newSetScale, newShiftShipPos, newGetRealCanvasWidth, newGetRealCanvasHeight) {
  getScale = newGetScale;
  setScale = newSetScale;
  shiftShipPos = newShiftShipPos;
  getRealCanvasWidth = newGetRealCanvasWidth;
  getRealCanvasHeight = newGetRealCanvasHeight;

  targetScale = getScale();
}
