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
      BLACK_BEFORE_UNVIERSE_START: gl.getUniformLocation(shaderProgram, 'BLACK_BEFORE_UNVIERSE_START'),
      BACKGROUND_PULSE: gl.getUniformLocation(shaderProgram, 'BACKGROUND_PULSE'),
      SPEED_OF_LIGHT: gl.getUniformLocation(shaderProgram, 'SPEED_OF_LIGHT'),
      
      pos: gl.getUniformLocation(shaderProgram, 'pos'),
      scale: gl.getUniformLocation(shaderProgram, 'scale'),
      
      globalTime: gl.getUniformLocation(shaderProgram, 'globalTime'),
    }
  };
}

// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Adding_2D_content_to_a_WebGL_context
function initGLBuffers() {
  let positionBuffer = gl.createBuffer();
  
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  
  let positions = new Float32Array([canvas.width / canvas.height, 1.0, -canvas.width / canvas.height, 1.0, canvas.width / canvas.height, -1.0, -canvas.width / canvas.height, -1.0]);
  
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
function drawGLScene(buffers) {
  gl.clearColor(0.0, 0.0, 0.0, 0.0);
  gl.clearDepth(1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  
  gl.clear(gl.COLOR_BUFFER_BUT | gl.DEPTH_BUFFER_BIT);
  
  gl.useProgram(shaderProgram);
  
  let fieldOfView = (45 * Math.PI) / 180;
  let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
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
  
  gl.uniform1i(shaderProgramInfo.uniformLocations.LIGHT_TRAVEL_TIME_DELAY, LIGHT_TRAVEL_TIME_DELAY);
  gl.uniform1i(shaderProgramInfo.uniformLocations.BLACK_BEFORE_UNVIERSE_START, BLACK_BEFORE_UNVIERSE_START);
  gl.uniform1i(shaderProgramInfo.uniformLocations.BACKGROUND_PULSE, BACKGROUND_PULSE);
  gl.uniform1f(shaderProgramInfo.uniformLocations.SPEED_OF_LIGHT, SPEED_OF_LIGHT);
  
  gl.uniform2fv(shaderProgramInfo.uniformLocations.pos, [X, Y]);
  gl.uniform1f(shaderProgramInfo.uniformLocations.scale, SCALE);
  
  gl.uniform1f(shaderProgramInfo.uniformLocations.globalTime, TIME);
  
  let offset = 0;
  let vertexCount = 4;
  gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
}
