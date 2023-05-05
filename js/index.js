let X = 0,
  Y = 0,
  SCALE = 10,
  TIME = 0;
let SPEED_OF_LIGHT = 1;

let SUBPIXEL_SCALE = 2;

let gl; // variable for canvas webgl context
let shaderProgram;
let shaderProgramInfo;
let glBuffers;
let pastTime;

function handleResize() {
  let canvasStyle = getComputedStyle(canvas);
  canvas.width = Math.floor(parseInt(canvasStyle.width.replace('px', '')) * SUBPIXEL_SCALE);
  canvas.height = Math.floor(parseInt(canvasStyle.height.replace('px', '')) * SUBPIXEL_SCALE);
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
    let currentTime = Date.now();
    TIME += (currentTime - pastTime) / 1000;
    pastTime = currentTime;
    
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
