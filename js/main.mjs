import {
  accMag,
  setAccAng,
  setAccMag,
  setAccMagAdj,
  setVelLorenzFactor,
  setVelAng,
  setVelMag,
  setVelMagAdj,
  setVelRelativityScaleFactor,
  velLorenzFactor,
  velMag,
} from './globals.mjs';
import {
  movementLoopRunning,
  setShiftShipPos,
  setTargetScale,
} from './plugin_mouse_motion.mjs';
import {
  getLorenzFactor,
  getWorldPlaceFromShipFrameCoords,
  relativistic_accelerationCalculation,
  relativistic_velocityAddition,
} from './relativistic_math.mjs';
import {
  ACCEL,
  MOUSEDRAG_RELATIVE_TO_FRAME,
  PROPER_TIME,
  SCALE,
  setProperTime,
  setScale,
  setTime,
  setTimeAdvancing,
  setTimelikeView,
  setVelX,
  setVelY,
  setX,
  setY,
  SHIP_RELATIVISTIC_VELOCITY_ADDITION,
  SPEED_OF_LIGHT,
  SUBPIXEL_SCALE,
  TIME,
  TIME_ADVANCING,
  TIME_RATE,
  TIMELIKE_VIEW,
  VEL_X,
  VEL_Y,
  X,
  Y,
} from './variables.mjs';
import {
  drawGLScene,
  getShaderProgramInfo,
  glResize,
  initGLBuffers,
  initShaderProgram,
} from './webgl_boilerplate.mjs';

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
let velRapidity = 0;
let ACCEL_X, ACCEL_Y;

function handleResize() {
  let canvasStyle = getComputedStyle(canvas);
  
  realCanvasWidth = parseInt(canvasStyle.width.replace('px', ''));
  realCanvasHeight = parseInt(canvasStyle.height.replace('px', ''));
  
  canvas.width = Math.floor(realCanvasWidth * SUBPIXEL_SCALE);
  canvas.height = Math.floor(realCanvasHeight * SUBPIXEL_SCALE);
  
  if (gl) glResize(gl, shaderProgram, shaderProgramInfo, glBuffers);
}

async function glInit() {
  gl = canvas.getContext('webgl2');
  
  shaderProgram = await initShaderProgram(gl);
  
  shaderProgramInfo = getShaderProgramInfo(gl, shaderProgram);
  
  glBuffers = initGLBuffers(gl);
  
  glResize(gl, shaderProgram, shaderProgramInfo, glBuffers);
}

function render() {
  drawGLScene(gl, shaderProgramInfo);
  
  coords.innerHTML = `X: ${X.toFixed(3)}, Y: ${Y.toFixed(3)}, Scale: ${SCALE.toFixed(3)}, Time: ${TIME.toFixed(3)}<br>VelX: ${VEL_X.toFixed(17)}, VelY: ${VEL_Y.toFixed(17)}, VelMag: ${velMag.toFixed(17)}<br>Proper Time: ${PROPER_TIME.toFixed(3)}, Rapidity: ${velRapidity.toFixed(3)}, Lorenz Factor: ${velLorenzFactor.toFixed(3)}`;
}

function recalculateRelativisticVars() {
  setVelMag(Math.hypot(VEL_X, VEL_Y));
  setVelAng(Math.atan2(VEL_Y, VEL_X));
  setVelLorenzFactor(SHIP_RELATIVISTIC_VELOCITY_ADDITION ? getLorenzFactor(VEL_X, VEL_Y, SPEED_OF_LIGHT) : 1);
  velRapidity = SHIP_RELATIVISTIC_VELOCITY_ADDITION ? Math.atanh(velMag / SPEED_OF_LIGHT) : 0;
  setVelRelativityScaleFactor(SHIP_RELATIVISTIC_VELOCITY_ADDITION ? Math.cosh(velRapidity) : 1);
  setVelMagAdj(velMag / SPEED_OF_LIGHT);
  setAccMag(Math.hypot(ACCEL_X, ACCEL_Y));
  setAccAng(Math.atan2(ACCEL_Y, ACCEL_X));
  setAccMagAdj(accMag / SPEED_OF_LIGHT);
}

function resetRelativisticVars() {
  setVelMag(0);
  setVelAng(0);
  setVelLorenzFactor(1);
  velRapidity = 0;
  setVelRelativityScaleFactor(1);
  setVelMagAdj(0);
  setAccMag(0);
  setAccAng(0);
  setAccMagAdj(0);
}

// used by mousemove event handler and movement loop in plugin file
function shiftShipPos(shiftX, shiftY) {
  shiftX /= realCanvasHeight / SCALE;
  shiftY /= realCanvasHeight / SCALE;
  
  // use different axis for y if timelike view enabled
  if (TIMELIKE_VIEW) {
    setX(X - shiftX);
    setTime(TIME - shiftY);
  } else {
    if (MOUSEDRAG_RELATIVE_TO_FRAME) {
      const shiftedShifts = getWorldPlaceFromShipFrameCoords([shiftX, shiftY, 0]);
      setX(X - shiftedShifts[0]);
      setY(Y - shiftedShifts[1]);
      setTime(TIME - shiftedShifts[2]);
    } else {
      setX(X - shiftX);
      setY(Y - shiftY);
    }
  }
}

async function renderLoop() {
  while (true) {
    let properTimePassed, timePassed;
    if (TIME_ADVANCING) {
      let currentTime = Date.now();
      properTimePassed = (currentTime - pastTime) / 1000 * TIME_RATE;
      timePassed = properTimePassed * velLorenzFactor;
      setProperTime(PROPER_TIME + properTimePassed);
      setTime(TIME + timePassed);
      pastTime = currentTime;
    } else {
      timePassed = 0;
      pastTime = Date.now();
    }
    
    if (TIME_ADVANCING || movementLoopRunning) {
      if (TIME_ADVANCING) {
        if (ctrls.brake) {
          let velMag = Math.hypot(VEL_X, VEL_Y);
          if (velMag > 0) {
            if (velMag <= ACCEL * properTimePassed) {
              /*ACCEL_X = VEL_X * -velMag / properTimePassed;
              ACCEL_Y = VEL_Y * -velMag / properTimePassed;*/
              ACCEL_X = 0;
              ACCEL_Y = 0;
              setVelX(0);
              setVelY(0);
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
          if (ACCEL < 0) accelMag *= -1;
          if (accelMag != 0) {
            ACCEL_X /= accelMag / ACCEL;
            ACCEL_Y /= accelMag / ACCEL;
          }
        }
        
        if (SHIP_RELATIVISTIC_VELOCITY_ADDITION) {
          const [ ACCEL_X_ADJ, ACCEL_Y_ADJ ] = relativistic_accelerationCalculation(ACCEL_X * properTimePassed, ACCEL_Y * properTimePassed, SPEED_OF_LIGHT);
          const [ newVelX, newVelY ] = relativistic_velocityAddition(VEL_X, VEL_Y, ACCEL_X_ADJ, ACCEL_Y_ADJ, SPEED_OF_LIGHT);
          setVelX(newVelX);
          setVelY(newVelY);
        } else {
          const [ ACCEL_X_ADJ, ACCEL_Y_ADJ ] = nonRelativistic_accelerationCalculation(ACCEL_X * properTimePassed, ACCEL_Y * properTimePassed);
          const [ newVelX, newVelY ] = nonRelativistic_velocityAddition(VEL_X, VEL_Y, ACCEL_X_ADJ, ACCEL_Y_ADJ);
          setVelX(newVelX);
          setVelY(newVelY);
        }
        
        recalculateRelativisticVars();
        
        setX(X + VEL_X * timePassed);
        setY(Y + VEL_Y * timePassed);
      }
      
      render();
    }
    
    await new Promise(r => requestAnimationFrame(r));
  }
}

setShiftShipPos(shiftShipPos);

window.addEventListener('load', async () => {
  handleResize();
  
  await glInit();
  
  pastTime = Date.now();
  
  render();
  
  renderLoop();
});

window.addEventListener('resize', async () => {
  handleResize();
  render();
});

window.addEventListener('keydown', e => {
  switch (e.code) {
    case 'Space':
      setTimeAdvancing(!TIME_ADVANCING);
      break;
    
    case 'KeyR':
      setX(0);
      setY(0);
      setScale(10);
      setTargetScale(10);
      setVelX(0);
      setVelY(0);
      resetRelativisticVars();
      render();
      break;
    
    case 'KeyT':
      setTime(0);
      setProperTime(0);
      render();
      break;
    
    case 'KeyG':
      setTimelikeView(!TIMELIKE_VIEW);
      render();
      break;
    
    case 'KeyV':
      setVelX(0);
      setVelY(0);
      resetRelativisticVars();
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
