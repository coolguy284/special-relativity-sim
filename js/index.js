let X = 0, Y = 0, SCALE = 1, TIME = 0;
let SPEED_OF_LIGHT = 1;

let gl; // variable for canvas webgl context
let shaderProgram;
let shaderProgramInfo;
let glBuffers;

function handleResize() {
  let canvasStyle = getComputedStyle(canvas);
  canvas.width = canvasStyle.width.replace('px', '');
  canvas.height = canvasStyle.height.replace('px', '');
}

async function glInit() {
  gl = canvas.getContext('webgl2');
  
  shaderProgram = await initShaderProgram();
  
  populateShaderProgramInfo();
  
  glBuffers = initGLBuffers();
}

function render() {
  drawGLScene(glBuffers);
}

async function renderLoop() {
  while (true) {
    render();
    
    await new Promise(r => requestAnimationFrame(r));
  }
}

window.addEventListener('load', async () => {
  handleResize();
  await glInit();
  render();
  
  renderLoop();
});

window.addEventListener('resize', async () => {
  handleResize();
  await glInit();
  render();
});
