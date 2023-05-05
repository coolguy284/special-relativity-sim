with (new Proxy(window, {get: (target,prop)=>{if(typeof prop=='string'&&!['window','performance','Math','Promise','Infinity'].includes(prop))console.log(target,prop);return Reflect.get(target,prop)}})) {
let ZOOM_SCALE_FACTOR = (1 / 1.5) ** (1 / 120);
let INERTIA_SLOWDOWN = 10;
let INERTIA_FASTSLOWDOWN_TIME_THRESHOLD = 0.8;
let INERTIA_FASTSLOWDOWN_VEL_THRESHOLD = 3;
let INERTIA_SLOWDOWN_FACTOR = 0.1;
let INERTIA_MOVE_THRESHOLD = 1e-6;
let INERTIA_ZOOM_FACTOR = 20;
let INERTIA_ZOOM_THRESHOLD = 1e-2;
let PREV_MOUSE_BUFFER_LENGTH = 3;
let PREV_MOUSE_BUFFER_TIMESPAN = 0.1 * 1000;

let velX, velY, velMag;
let movementLoopRunning = false;
let targetScale = SCALE, targetScalePMouseX, targetScalePMouseY;
let mouseDown = false;
let pMouseX, pMouseY;
let previousMouseDrags = [];
let timeUnclicked;

async function movementLoop() {
  if (movementLoopRunning) return;
  
  movementLoopRunning = true;
  
  let timestamp, pTimestamp;
  
  while (true) {
    let processMovement, processZoom;
    processMovement = Math.abs(velX) >= INERTIA_MOVE_THRESHOLD ||
      Math.abs(velY) >= INERTIA_MOVE_THRESHOLD;
    processZoom = Math.abs(Math.log(targetScale / SCALE)) >= INERTIA_ZOOM_THRESHOLD;
    
    let lastFrameTime;
    if (pTimestamp) {
      lastFrameTime = (timestamp - pTimestamp) / 1000;
    }
    
    // movement processing
    
    if (processMovement) {
      if (!mouseDown) {
        X -= velX / realCanvasHeight * SCALE;
        Y -= velY / realCanvasHeight * SCALE;
        
        if (pTimestamp) {
          let newVelMag;
          let timeSinceUnclicked = (timestamp - timeUnclicked) / 1000;
          if (timeSinceUnclicked > INERTIA_FASTSLOWDOWN_TIME_THRESHOLD && velMag > INERTIA_FASTSLOWDOWN_VEL_THRESHOLD) {
            // bigger for fast speeds
            newVelMag = Math.max((velMag - INERTIA_SLOWDOWN * lastFrameTime) * INERTIA_SLOWDOWN_FACTOR ** lastFrameTime, 0);
          } else {
            // linear for slow speeds
            newVelMag = Math.max(velMag - INERTIA_SLOWDOWN * lastFrameTime, 0);
          }
          
          let slowdownFactor = velMag != 0 ? newVelMag / velMag : 0;
          
          velX *= slowdownFactor;
          velY *= slowdownFactor;
          
          velMag = newVelMag;
        }
      }
    }
    
    // zoom processing
    
    if (processZoom && pTimestamp) {
      let scaleFactor = Math.exp(Math.log(targetScale / SCALE) * Math.min(INERTIA_ZOOM_FACTOR * lastFrameTime, 1));
      
      let cxCursor = X + (targetScalePMouseX - realCanvasWidth / 2) / realCanvasHeight * SCALE;
      let cyCursor = Y + -(targetScalePMouseY - realCanvasHeight / 2) / realCanvasHeight * SCALE;
      
      let cxDiff = cxCursor - X;
      let cyDiff = cyCursor - Y;
      
      let cxScaleDiff = cxDiff - cxDiff * scaleFactor;
      let cyScaleDiff = cyDiff - cyDiff * scaleFactor;
      
      X += cxScaleDiff;
      Y += cyScaleDiff;
      
      SCALE *= scaleFactor;
    }
    
    // call next iteration of loop
    
    if (Math.abs(velX) < INERTIA_MOVE_THRESHOLD &&
        Math.abs(velY) < INERTIA_MOVE_THRESHOLD &&
        Math.abs(Math.log(targetScale / SCALE)) < INERTIA_ZOOM_THRESHOLD) {
      movementLoopRunning = false;
      pTimestamp = null;
      break;
    } else {
      pTimestamp = timestamp;
    }
    
    timestamp = await new Promise(r => window.requestAnimationFrame(r));
  }
}

window.addEventListener('mousedown', e => {
  let x = e.x, y = e.y;
  
  mouseDown = true;
  
  pMouseX = x;
  pMouseY = y;
});

window.addEventListener('mouseup', e => {
  timeUnclicked = performance.now();
  
  let minValidTime = timeUnclicked - PREV_MOUSE_BUFFER_TIMESPAN;
  
  let mouseDragSum = previousMouseDrags.filter(x => x[2] > minValidTime).reduce((a, c) => [a[0] + c[0], a[1] + c[1]], [0, 0]);
  let mouseDrag = previousMouseDrags.length ? [mouseDragSum[0] / previousMouseDrags.length, mouseDragSum[1] / previousMouseDrags.length] : [0, 0];
  
  velX = mouseDrag[0];
  velY = mouseDrag[1];
  
  previousMouseDrags.splice(0, Infinity);
  
  mouseDown = false;
});

window.addEventListener('mousemove', e => {
  let x = e.x, y = e.y;
  
  if (mouseDown) {
    velX = x - pMouseX;
    velY = -y + pMouseY;
    
    velMag = Math.hypot(velX, velY);
    
    if (typeof X == 'object') {
      // math.js coordinates
      X = math.subtract(X, math.multiply(math.bignumber(velX / realCanvasHeight), SCALE));
      Y = math.subtract(Y, math.multiply(math.bignumber(velY / realCanvasHeight), SCALE));
    } else {
      // regular coordinates
      X -= velX / realCanvasHeight * SCALE;
      Y -= velY / realCanvasHeight * SCALE;
    }
  }
  
  pMouseX = x;
  pMouseY = y;
  
  previousMouseDrags.push([velX, velY, performance.now()]);
  if (previousMouseDrags.length > PREV_MOUSE_BUFFER_LENGTH) {
    previousMouseDrags.splice(0, 1);
  }
  
  if (mouseDown) {
    movementLoop();
  }
});

window.addEventListener('wheel', e => {
  let wheelDelta = e.wheelDelta
  
  let scaleFactor = ZOOM_SCALE_FACTOR ** wheelDelta;
  
  targetScale *= scaleFactor;
  
  targetScalePMouseX = pMouseX;
  targetScalePMouseY = pMouseY;
  
  if (!mouseDown) {
    velX = 0;
    velY = 0;
  }
  
  movementLoop();
});
}