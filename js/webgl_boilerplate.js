// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Adding_2D_content_to_a_WebGL_context
function loadShader(gl, type, source) {
  let shader = gl.createShader(type);
  
  // send source code to shader object on gpu
  gl.shaderSource(shader, source);
  
  // compile the shader program
  gl.compileShader(shader);
  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(`Error compiling OpenGL shader: ${gl.getShaderInfoLog(shader)}`);
    
    gl.deleteShader(shader);
    
    throw new Error('stopping execution of shader');
  }
  
  return shader;
}

// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Adding_2D_content_to_a_WebGL_context
async function initShaderProgram() {
  let vertexCode = await (await fetch('sr_vertex.glsl')).text();
  let fragmentCode = await (await fetch('sr_fragment.glsl')).text();
  
  let vertexShader = loadShader(gl, gl.VERTEX_SHADER, vertexCode);
  let fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fragmentCode);
  
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert(`Cannot initialize OpenGL shader program: ${gl.getProgramInfoLog(shaderProgram)}`);
    
    throw new Error('stopping execution of shader');
  }
  
  return shaderProgram;
}

// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Adding_2D_content_to_a_WebGL_context
function populateShaderProgramInfo() {
  shaderProgramInfo = {
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
      
      iResolution: gl.getUniformLocation(shaderProgram, 'iResolution'),
      
      LIGHT_TRAVEL_TIME_DELAY: gl.getUniformLocation(shaderProgram, 'LIGHT_TRAVEL_TIME_DELAY'),
      LIGHT_TRAVEL_TIME_DELAY_INCLUDES_SHIP_VELOCITY: gl.getUniformLocation(shaderProgram, 'LIGHT_TRAVEL_TIME_DELAY_INCLUDES_SHIP_VELOCITY'),
      UNIVERSE_TIME_SHIFTING: gl.getUniformLocation(shaderProgram, 'UNIVERSE_TIME_SHIFTING'),
      UNIVERSE_LENGTH_CONTRACTION: gl.getUniformLocation(shaderProgram, 'UNIVERSE_LENGTH_CONTRACTION'),
      ITEM_LENGTH_CONTRACTION: gl.getUniformLocation(shaderProgram, 'ITEM_LENGTH_CONTRACTION'),
      RINDLER_METRIC_WHEN_ACCELERATING: gl.getUniformLocation(shaderProgram, 'RINDLER_METRIC_WHEN_ACCELERATING'),
      RINDLER_METRIC_WHEN_ACCELERATING_TIMELIKE_VIEW: gl.getUniformLocation(shaderProgram, 'RINDLER_METRIC_WHEN_ACCELERATING_TIMELIKE_VIEW'),
      HIDE_RINDLER_METRIC_PAST_SINGULARITY: gl.getUniformLocation(shaderProgram, 'HIDE_RINDLER_METRIC_PAST_SINGULARITY'),
      TIMELIKE_VIEW: gl.getUniformLocation(shaderProgram, 'TIMELIKE_VIEW'),
      TIMELIKE_VIEW_NORMALIZED_X_COORDINATE: gl.getUniformLocation(shaderProgram, 'TIMELIKE_VIEW_NORMALIZED_X_COORDINATE'),
      BLACK_BEFORE_UNIVERSE_START: gl.getUniformLocation(shaderProgram, 'BLACK_BEFORE_UNIVERSE_START'),
      BACKGROUND_PULSE: gl.getUniformLocation(shaderProgram, 'BACKGROUND_PULSE'),
      SPEED_OF_LIGHT: gl.getUniformLocation(shaderProgram, 'SPEED_OF_LIGHT'),
      
      pos: gl.getUniformLocation(shaderProgram, 'pos'),
      vel: gl.getUniformLocation(shaderProgram, 'vel'),
      scale: gl.getUniformLocation(shaderProgram, 'scale'),
      globalTime: gl.getUniformLocation(shaderProgram, 'globalTime'),
      velMag: gl.getUniformLocation(shaderProgram, 'velMag'),
      velAng: gl.getUniformLocation(shaderProgram, 'velAng'),
      velLorenzFactor: gl.getUniformLocation(shaderProgram, 'velLorenzFactor'),
      velRelativityScaleFactor: gl.getUniformLocation(shaderProgram, 'velRelativityScaleFactor'),
      velMagAdj: gl.getUniformLocation(shaderProgram, 'velMagAdj'),
      accMag: gl.getUniformLocation(shaderProgram, 'accMag'),
      accAng: gl.getUniformLocation(shaderProgram, 'accAng'),
      accMagAdj: gl.getUniformLocation(shaderProgram, 'accMagAdj'),
    }
  };
}

// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Adding_2D_content_to_a_WebGL_context
function initGLBuffers() {
  let positionBuffer = gl.createBuffer();
  
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  
  let positions = new Float32Array([
    // (x, y), make sure x coord is equal to plus or minus aspect (declared below in glResize), for screen to be fully filled
    1.0, 1.0,
    -1.0, 1.0,
    1.0, -1.0,
    -1.0, -1.0,
  ]);
  
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  
  return {
    position: positionBuffer,
  };
}

// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Adding_2D_content_to_a_WebGL_context
function setPositionAttribute(buffers) {
  let numComponents = 2;
  let type = gl.FLOAT;
  let normalize = false;
  let stride = 0;
  let offset = 0;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  gl.vertexAttribPointer(
    shaderProgramInfo.attribLocations.vertexPosition,
    numComponents,
    type,
    normalize,
    stride,
    offset
  );
  gl.enableVertexAttribArray(shaderProgramInfo.attribLocations.vertexPosition);
}

// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Adding_2D_content_to_a_WebGL_context
function drawGLScene() {
  gl.clearColor(0.0, 0.0, 0.0, 0.0);
  gl.clearDepth(1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  gl.uniform1i(shaderProgramInfo.uniformLocations.LIGHT_TRAVEL_TIME_DELAY, Number(LIGHT_TRAVEL_TIME_DELAY));
  gl.uniform1i(shaderProgramInfo.uniformLocations.LIGHT_TRAVEL_TIME_DELAY_INCLUDES_SHIP_VELOCITY, Number(LIGHT_TRAVEL_TIME_DELAY_INCLUDES_SHIP_VELOCITY));
  gl.uniform1i(shaderProgramInfo.uniformLocations.UNIVERSE_TIME_SHIFTING, Number(UNIVERSE_TIME_SHIFTING));
  gl.uniform1i(shaderProgramInfo.uniformLocations.UNIVERSE_LENGTH_CONTRACTION, Number(UNIVERSE_LENGTH_CONTRACTION));
  gl.uniform1i(shaderProgramInfo.uniformLocations.ITEM_LENGTH_CONTRACTION, Number(ITEM_LENGTH_CONTRACTION));
  gl.uniform1i(shaderProgramInfo.uniformLocations.RINDLER_METRIC_WHEN_ACCELERATING, Number(RINDLER_METRIC_WHEN_ACCELERATING));
  gl.uniform1i(shaderProgramInfo.uniformLocations.RINDLER_METRIC_WHEN_ACCELERATING_TIMELIKE_VIEW, Number(RINDLER_METRIC_WHEN_ACCELERATING_TIMELIKE_VIEW));
  gl.uniform1i(shaderProgramInfo.uniformLocations.HIDE_RINDLER_METRIC_PAST_SINGULARITY, Number(HIDE_RINDLER_METRIC_PAST_SINGULARITY));
  gl.uniform1i(shaderProgramInfo.uniformLocations.TIMELIKE_VIEW, Number(TIMELIKE_VIEW));
  gl.uniform1i(shaderProgramInfo.uniformLocations.TIMELIKE_VIEW_NORMALIZED_X_COORDINATE, Number(TIMELIKE_VIEW_NORMALIZED_X_COORDINATE));
  gl.uniform1i(shaderProgramInfo.uniformLocations.BLACK_BEFORE_UNIVERSE_START, Number(BLACK_BEFORE_UNIVERSE_START));
  gl.uniform1i(shaderProgramInfo.uniformLocations.BACKGROUND_PULSE, Number(BACKGROUND_PULSE));
  gl.uniform1f(shaderProgramInfo.uniformLocations.SPEED_OF_LIGHT, SPEED_OF_LIGHT);
  
  gl.uniform2fv(shaderProgramInfo.uniformLocations.pos, [X, Y]);
  gl.uniform2fv(shaderProgramInfo.uniformLocations.vel, [VEL_X, VEL_Y]);
  gl.uniform1f(shaderProgramInfo.uniformLocations.scale, SCALE);
  gl.uniform1f(shaderProgramInfo.uniformLocations.globalTime, TIME);
  gl.uniform1f(shaderProgramInfo.uniformLocations.velMag, velMag);
  gl.uniform1f(shaderProgramInfo.uniformLocations.velAng, velAng);
  gl.uniform1f(shaderProgramInfo.uniformLocations.velLorenzFactor, velLorenzFactor);
  gl.uniform1f(shaderProgramInfo.uniformLocations.velRelativityScaleFactor, velRelativityScaleFactor);
  gl.uniform1f(shaderProgramInfo.uniformLocations.velMagAdj, velMagAdj);
  gl.uniform1f(shaderProgramInfo.uniformLocations.accMag, accMag);
  gl.uniform1f(shaderProgramInfo.uniformLocations.accAng, accAng);
  gl.uniform1f(shaderProgramInfo.uniformLocations.accMagAdj, accMagAdj);
  
  let offset = 0;
  let vertexCount = 4;
  gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
}

function glResize(buffers) {
  gl.useProgram(shaderProgram);
  
  let fieldOfView = (45 * Math.PI) / 180;
  let aspect = 1.0;
  let zNear = 0.1;
  let zFar = 100.0;
  
  let projectionMatrix = mat4.create();
  
  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
  
  let modelViewMatrix = mat4.create();
  
  mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -2.413]);
  
  setPositionAttribute(buffers);
  
  gl.uniformMatrix4fv(
    shaderProgramInfo.uniformLocations.projectionMatrix,
    false,
    projectionMatrix
  );
  gl.uniformMatrix4fv(
    shaderProgramInfo.uniformLocations.modelViewMatrix,
    false,
    modelViewMatrix
  );
  gl.uniform2fv(shaderProgramInfo.uniformLocations.iResolution, [canvas.width, canvas.height]);
  
  gl.viewport(0, 0, canvas.width, canvas.height);
}
