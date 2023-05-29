let gl; // variable for canvas webgl context
let shaderProgram;
let shaderProgramInfo;
let glBuffers;
let pastTime;
let realCanvasWidth, realCanvasHeight;
let ctrlKeys = {
  'KeyW': false, 'KeyS': false, 'KeyA': false, 'KeyD': false,
  'ArrowUp': false, 'ArrowDown': false, 'ArrowLeft': false, 'ArrowRight': false, // directional acceleration
  'KeyE': false, // braking
};
let ctrlMap = {
  'KeyW': 'up', 'KeyS': 'down', 'KeyA': 'left', 'KeyD': 'right',
  'ArrowUp': 'up', 'ArrowDown': 'down', 'ArrowLeft': 'left', 'ArrowRight': 'right', // directional acceleration
  'KeyE': 'brake', // braking
};
let ctrlReverseMap = {};
Object.entries(ctrlMap).forEach(x => {
  if (x[1] in ctrlReverseMap) {
    ctrlReverseMap[x[1]].push(x[0]);
  } else {
    ctrlReverseMap[x[1]] = [x[0]];
  }
});
let ctrls = { up: false, down: false, left: false, right: false, brake: false };
let velLorenzFactor = 1;

function handleResize() {
  let canvasStyle = getComputedStyle(canvas);
  
  realCanvasWidth = parseInt(canvasStyle.width.replace('px', ''));
  realCanvasHeight = parseInt(canvasStyle.height.replace('px', ''));
  
  canvas.width = Math.floor(realCanvasWidth * SUBPIXEL_SCALE);
  canvas.height = Math.floor(realCanvasHeight * SUBPIXEL_SCALE);
}

async function glInit() {
  gl = canvas.getContext('webgl2');
  
  shaderProgram = await initShaderProgram();
  
  populateShaderProgramInfo();
  
  glBuffers = initGLBuffers();
}

function render() {
  drawGLScene(glBuffers);
  
  coords.textContent = `X: ${X.toFixed(3)}, Y: ${Y.toFixed(3)}, VelX: ${VEL_X.toFixed(17)}, VelY: ${VEL_Y.toFixed(17)}, Scale: ${SCALE.toFixed(3)}, Time: ${TIME.toFixed(3)}, Proper Time: ${PROPER_TIME.toFixed(3)}, Lorenz Factor: ${velLorenzFactor.toFixed(3)}`;
}

async function renderLoop() {
  while (true) {
    let properTimePassed, timePassed;
    if (TIME_ADVANCING) {
      let currentTime = Date.now();
      properTimePassed = (currentTime - pastTime) / 1000 * TIME_RATE;
      timePassed = properTimePassed * velLorenzFactor;
      PROPER_TIME += properTimePassed;
      TIME += timePassed;
      pastTime = currentTime;
    } else {
      timePassed = 0;
      pastTime = Date.now();
    }
    
    if (TIME_ADVANCING || movementLoopRunning) {
      if (TIME_ADVANCING) {
        let ACCEL_X, ACCEL_Y;
        if (ctrls.brake) {
          let velMag = Math.hypot(VEL_X, VEL_Y);
          if (velMag > 0) {
            if (velMag <= ACCEL * properTimePassed) {
              /*ACCEL_X = VEL_X * -velMag / properTimePassed;
              ACCEL_Y = VEL_Y * -velMag / properTimePassed;*/
              ACCEL_X = 0;
              ACCEL_Y = 0;
              VEL_X = 0;
              VEL_Y = 0;
            } else {
              ACCEL_X = VEL_X / -velMag * ACCEL;
              ACCEL_Y = VEL_Y / -velMag * ACCEL;
            }
          } else {
            ACCEL_X = 0;
            ACCEL_Y = 0;
          }
        } else {
          ACCEL_X = ctrls.left * -ACCEL + ctrls.right * ACCEL;
          ACCEL_Y = ctrls.down * -ACCEL + ctrls.up * ACCEL;
          let accelMag = Math.hypot(ACCEL_X, ACCEL_Y);
          if (accelMag != 0) {
            ACCEL_X /= accelMag;
            ACCEL_Y /= accelMag;
          }
        }
        
        if (SHIP_RELATIVISTIC_VELOCITY_ADDITION) {
          [ ACCEL_X, ACCEL_Y ] = relativistic_accelerationCalculation(ACCEL_X, ACCEL_Y, SPEED_OF_LIGHT);
          [ VEL_X, VEL_Y ] = relativistic_velocityAddition(VEL_X, VEL_Y, ACCEL_X * properTimePassed, ACCEL_Y * properTimePassed, SPEED_OF_LIGHT);
        } else {
          [ ACCEL_X, ACCEL_Y ] = nonRelativistic_accelerationCalculation(ACCEL_X, ACCEL_Y);
          [ VEL_X, VEL_Y ] = nonRelativistic_velocityAddition(VEL_X, VEL_Y, ACCEL_X * properTimePassed, ACCEL_Y * properTimePassed);
        }
        
        velLorenzFactor = getLorenzFactor(VEL_X, VEL_Y, SPEED_OF_LIGHT);
        
        X += VEL_X * timePassed;
        Y += VEL_Y * timePassed;
      }
      
      render();
    }
    
    await new Promise(r => requestAnimationFrame(r));
  }
}

window.addEventListener('load', async () => {
  handleResize();
  
  await glInit();
  
  pastTime = Date.now();
  
  render();
  
  renderLoop();
});

window.addEventListener('resize', async () => {
  handleResize();
  await glInit();
  render();
});

window.addEventListener('keydown', e => {
  switch (e.code) {
    case 'Space':
      TIME_ADVANCING = !TIME_ADVANCING;
      break;
    
    case 'KeyR':
      X = 0;
      Y = 0;
      SCALE = 10;
      targetScale = 10;
      VEL_X = 0;
      VEL_Y = 0;
      velLorenzFactor = 1;
      render();
      break;
    
    case 'KeyT':
      TIME = 0;
      PROPER_TIME = 0;
      render();
      break;
    
    default:
      if (e.code in ctrlKeys) {
        ctrlKeys[e.code] = true;
        let ctrlMapped = ctrlMap[e.code];
        if (ctrls[ctrlMapped] == false) {
          ctrls[ctrlMapped] = true;
        }
      }
  }
});

window.addEventListener('keyup', e => {
  if (e.code in ctrlKeys) {
    ctrlKeys[e.code] = false;
    let ctrlMapped = ctrlMap[e.code];
    let ctrlReverseMapped = ctrlReverseMap[ctrlMapped];
    if (!ctrlReverseMapped.some(x => ctrlKeys[x])) {
      ctrls[ctrlMapped] = false;
    }
  }
});
