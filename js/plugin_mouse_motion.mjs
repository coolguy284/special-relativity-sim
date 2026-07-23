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
  
  static #getElementDimensions(element) {
    if (element == null) {
      return [
        innerWidth,
        innerHeight,
      ];
    } else {
      const style = getComputedStyle(element);
      
      return [
        Number(style.width.slice(0, -2)),
        Number(style.height.slice(0, -2)),
      ];
    }
  }
  
  #movementLoopRunning = false;
  #endMovementLoopThenDispose = false;
  #disposed = false;
  #movementLoopEndCallbacks = new Set();
  
  // multiplicative factor to multiply current scale by to get target scale
  #targetScaleDelta = 1;
  
  #mouseDown = false;
  #screenVelX = 0;
  #screenVelY = 0;
  #screenVelMag = 0;
  #timeUnclicked = null;
  #pMouseX = null;
  #pMouseY = null;
  #previousMouseDrags = [];
  
  #mouseMotionElem = null;
  #moveViewCallback = null;
  #scaleViewCallback = null;
  
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
          Math.abs(Math.log(this.#targetScaleDelta)) >= MouseMover.#INERTIA_ZOOM_THRESHOLD;
      
      let lastFrameTime;
      
      if (pTimestamp) {
        lastFrameTime = (timestamp - pTimestamp) / 1000;
      }
      
      // movement processing
      
      if (processMovement) {
        if (!this.#mouseDown) {
          this.#moveViewCallback(this.#screenVelX, this.#screenVelY);
          
          if (pTimestamp && this.#timeUnclicked != null) {
            const timeSinceUnclicked = (timestamp - this.#timeUnclicked) / 1000;
            
            let newVelMag;
            
            if (timeSinceUnclicked > MouseMover.#INERTIA_FASTSLOWDOWN_TIME_THRESHOLD && this.#screenVelMag > MouseMover.#INERTIA_FASTSLOWDOWN_VEL_THRESHOLD) {
              // bigger for fast speeds
              newVelMag = Math.max((this.#screenVelMag - MouseMover.#INERTIA_SLOWDOWN * lastFrameTime) * MouseMover.#INERTIA_SLOWDOWN_FACTOR ** lastFrameTime, 0);
            } else {
              // linear for slow speeds
              newVelMag = Math.max(this.#screenVelMag - MouseMover.#INERTIA_SLOWDOWN * lastFrameTime, 0);
            }
            
            const slowdownFactor = this.#screenVelMag != 0 ? newVelMag / this.#screenVelMag : 0;
            
            this.#screenVelX *= slowdownFactor;
            this.#screenVelY *= slowdownFactor;
            
            this.#screenVelMag = newVelMag;
          }
        }
      }
      
      // zoom processing
      
      if (processZoom && pTimestamp) {
        const scaleFactor = Math.exp(Math.log(this.#targetScaleDelta) * Math.min(MouseMover.#INERTIA_ZOOM_FACTOR * lastFrameTime, 1));
        
        this.#scaleViewCallback(scaleFactor);
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
        Math.abs(Math.log(this.#targetScaleDelta)) < MouseMover.#INERTIA_ZOOM_THRESHOLD
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
    // moveViewCallback(xAmount, yAmount): called when view should be moved by the scale-invariant amount
    moveViewCallback,
    // scaleViewCallback(scaleMultiplier): called when view scale should be multiplied by the given amount
    scaleViewCallback,
  }) {
    this.#mouseMotionElem = mouseMotionElem;
    
    this.#moveViewCallback = moveViewCallback;
    this.#scaleViewCallback = scaleViewCallback;
    
    const workingMouseMotionElem = mouseMotionElem ?? window;
    
    workingMouseMotionElem.addEventListener('mousedown', e => {
      const x = e.clientX, y = e.clientY;
      
      this.#mouseDown = true;
      
      this.#pMouseX = x;
      this.#pMouseY = y;
    });
    
    workingMouseMotionElem.addEventListener('mouseup', e => {
      this.#timeUnclicked = performance.now();
      
      const minValidTime = this.#timeUnclicked - MouseMover.#PREV_MOUSE_BUFFER_TIMESPAN;
      
      const mouseDragSum =
        this.#previousMouseDrags
          .filter(x => x[2] > minValidTime)
          .reduce((a, c) => [a[0] + c[0], a[1] + c[1]], [0, 0]);
      
      const mouseDrag =
        this.#previousMouseDrags.length ?
          [
            mouseDragSum[0] / this.#previousMouseDrags.length,
            mouseDragSum[1] / this.#previousMouseDrags.length,
          ] :
          [0, 0];
      
      this.#screenVelX = mouseDrag[0];
      this.#screenVelY = mouseDrag[1];
      
      this.#previousMouseDrags.splice(0, Infinity);
      
      this.#mouseDown = false;
    });
    
    workingMouseMotionElem.addEventListener('mousemove', e => {
      const x = e.clientX, y = e.clientY;
      
      if (this.#mouseDown) {
        this.#screenVelX = x - this.#pMouseX;
        this.#screenVelY = -y + this.#pMouseY;
        
        this.#screenVelMag = Math.hypot(this.#screenVelX, this.#screenVelY);
        
        this.#moveViewCallback(this.#screenVelX, this.#screenVelY);
      }
      
      this.#pMouseX = x;
      this.#pMouseY = y;
      
      this.#previousMouseDrags.push([this.#screenVelX, this.#screenVelY, performance.now()]);
      if (this.#previousMouseDrags.length > MouseMover.#PREV_MOUSE_BUFFER_LENGTH) {
        this.#previousMouseDrags.splice(0, 1);
      }
      
      if (this.#mouseDown) {
        this.#movementLoop();
      }
    });
    
    workingMouseMotionElem.addEventListener('wheel', e => {
      const wheelDelta = e.wheelDelta;
      
      [this.#pMouseX, this.#pMouseY] = MouseMover.#getElementDimensions(this.#mouseMotionElem);
      
      const scaleFactor = MouseMover.#ZOOM_SCALE_FACTOR ** wheelDelta;
      
      this.#targetScaleDelta *= scaleFactor;
      
      if (!this.#mouseDown) {
        this.#screenVelX = 0;
        this.#screenVelY = 0;
      }
      
      this.#movementLoop();
    });
  }
  
  setTargetScaleDelta(targetScaleDelta) {
    this.#targetScaleDelta = targetScaleDelta;
  }
  
  movementLoopRunning() {
    return this.#movementLoopRunning;
  }
  
  async [Symbol.asyncDispose]() {
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
