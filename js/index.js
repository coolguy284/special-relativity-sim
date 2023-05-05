let gl; // variable for canvas webgl context
let shaderProgram;
let shaderProgramInfo;
let glBuffers;
let pastTime;
let realCanvasWidth, realCanvasHeight;

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
  
  coords.textContent = `X: ${X.toFixed(3)}, Y: ${Y.toFixed(3)}, Scale: ${SCALE.toFixed(3)}, Time: ${TIME.toFixed(3)}`;
}

async function renderLoop() {
  while (true) {
    if (TIME_ADVANCING) {
      let currentTime = Date.now();
      TIME += (currentTime - pastTime) / 1000 * TIME_RATE;
      pastTime = currentTime;
    } else {
      pastTime = Date.now();
    }
    
    render();
    
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
      break;
    
    case 'KeyT':
      TIME = 0;
      break;
  }
});
