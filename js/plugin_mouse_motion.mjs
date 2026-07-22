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
  
  #movementLoopRunning = false;
  #endMovementLoopThenDispose = false;
  #disposed = false;
  #movementLoopEndCallbacks = new Set();
  
  // multiplicative factor to multiply current scale by to get target scale
  #targetScaleDelta = 1;
  
  #mouseDown = false;
  #screenVelX = 0;
  #screenVelY = 0;
  #timeUnclicked = null;
  
  #moveViewCallback = null;
  
  async #movementLoop() {
    if (this.#movementLoopRunning) return;
    
    this.#movementLoopRunning = true;
    
    let timestamp, pTimestamp;
    
    while (true) {
      const
        processMovement =
          Math.abs(this.#screenVelX) >= MouseMover.#INERTIA_MOVE_THRESHOLD ||
          Math.abs(this.#screenVelY) >= MouseMover.#INERTIA_MOVE_THRESHOLD,
        processZoom =
          Math.abs(Math.log(targetScale / getScale())) >= MouseMover.#INERTIA_ZOOM_THRESHOLD;
      
      let lastFrameTime;
      
      if (pTimestamp) {
        lastFrameTime = (timestamp - pTimestamp) / 1000;
      }
      
      // movement processing
      
      if (processMovement) {
        if (!this.#mouseDown) {
          this.#moveViewCallback(this.#screenVelX * lastFrameTime, this.#screenVelY * lastFrameTime);
          
          if (pTimestamp && this.#timeUnclicked != null) {
            const timeSinceUnclicked = (timestamp - this.#timeUnclicked) / 1000;
            
            let newVelMag;
            
            if (timeSinceUnclicked > MouseMover.#INERTIA_FASTSLOWDOWN_TIME_THRESHOLD && screenVelMag > MouseMover.#INERTIA_FASTSLOWDOWN_VEL_THRESHOLD) {
              // bigger for fast speeds
              newVelMag = Math.max((screenVelMag - MouseMover.#INERTIA_SLOWDOWN * lastFrameTime) * MouseMover.#INERTIA_SLOWDOWN_FACTOR ** lastFrameTime, 0);
            } else {
              // linear for slow speeds
              newVelMag = Math.max(screenVelMag - MouseMover.#INERTIA_SLOWDOWN * lastFrameTime, 0);
            }
            
            let slowdownFactor = screenVelMag != 0 ? newVelMag / screenVelMag : 0;
            
            this.#screenVelX *= slowdownFactor;
            this.#screenVelY *= slowdownFactor;
            
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
      
      if (this.#endMovementLoopThenDispose) {
        this.#endMovementLoopThenDispose = false;
        this.#movementLoopRunning = false;
        this.#disposed = true;
        break;
      }
      
      if (
        Math.abs(this.#screenVelX) < MouseMover.#INERTIA_MOVE_THRESHOLD &&
        Math.abs(this.#screenVelY) < MouseMover.#INERTIA_MOVE_THRESHOLD &&
        Math.abs(Math.log(targetScale / getScale())) < MouseMover.#INERTIA_ZOOM_THRESHOLD
      ) {
        this.#movementLoopRunning = false;
        pTimestamp = null;
        break;
      } else {
        pTimestamp = timestamp;
      }
      
      timestamp = await new Promise(r => requestAnimationFrame(r));
    }
    
    for (const r of this.#movementLoopEndCallbacks) {
      try {
        r();
      } catch {}
    }
    
    this.#movementLoopEndCallbacks.clear();
  }
  
  constructor({
    mouseMotionElem,
    // moveViewCallback(xAmount, yAmount): called when view should be moved by the scale-invariant amount; scaled based on frame time
    moveViewCallback,
  }) {
    mouseMotionElem.addEventListener('mousedown', e => {
      const x = e.x, y = e.y;
      
      this.#mouseDown = true;
      
      pMouseX = x;
      pMouseY = y;
    });
    
    mouseMotionElem.addEventListener('mouseup', e => {
      this.#timeUnclicked = performance.now();
      
      let minValidTime = this.#timeUnclicked - MouseMover.#PREV_MOUSE_BUFFER_TIMESPAN;
      
      let mouseDragSum = previousMouseDrags.filter(x => x[2] > minValidTime).reduce((a, c) => [a[0] + c[0], a[1] + c[1]], [0, 0]);
      let mouseDrag = previousMouseDrags.length ? [mouseDragSum[0] / previousMouseDrags.length, mouseDragSum[1] / previousMouseDrags.length] : [0, 0];
      
      this.#screenVelX = mouseDrag[0];
      this.#screenVelY = mouseDrag[1];
      
      previousMouseDrags.splice(0, Infinity);
      
      this.#mouseDown = false;
    });
    
    mouseMotionElem.addEventListener('mousemove', e => {
      let x = e.x, y = e.y;
      
      if (this.#mouseDown) {
        this.#screenVelX = x - pMouseX;
        this.#screenVelY = -y + pMouseY;
        
        screenVelMag = Math.hypot(this.#screenVelX, this.#screenVelY);
        
        shiftShipPos(this.#screenVelX, this.#screenVelY);
      }
      
      pMouseX = x;
      pMouseY = y;
      
      previousMouseDrags.push([this.#screenVelX, this.#screenVelY, performance.now()]);
      if (previousMouseDrags.length > MouseMover.#PREV_MOUSE_BUFFER_LENGTH) {
        previousMouseDrags.splice(0, 1);
      }
      
      if (this.#mouseDown) {
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
      
      if (!this.#mouseDown) {
        this.#screenVelX = 0;
        this.#screenVelY = 0;
      }
      
      movementLoop();
    });
    
    this.#moveViewCallback = moveViewCallback;
  }
  
  setTargetScaleDelta(targetScaleDelta) {
    this.#targetScaleDelta = targetScaleDelta;
  }
  
  [Symbol.asyncDispose]() {
    if (this.#movementLoopRunning) {
      this.#endMovementLoopThenDispose = true;
      
      await new Promise(r => {
        this.#movementLoopEndCallbacks.add(r);
      });
    } else {
      this.#disposed = true;
    }
  }
}

//let shiftShipPos;
//let getRealCanvasWidth;
//let getRealCanvasHeight;
//let getScale;
//let setScale;
//
//let screenVelMag;
//let targetScalePMouseX, targetScalePMouseY;
//let pMouseX, pMouseY;
//let previousMouseDrags = [];

//export function init(newGetScale, newSetScale, newShiftShipPos, newGetRealCanvasWidth, newGetRealCanvasHeight) {
//  getScale = newGetScale;
//  setScale = newSetScale;
//  shiftShipPos = newShiftShipPos;
//  getRealCanvasWidth = newGetRealCanvasWidth;
//  getRealCanvasHeight = newGetRealCanvasHeight;
//
//  targetScale = getScale();
//}
