#version 300 es

precision highp float;

uniform vec2 iResolution;

uniform vec2 pos;
uniform float scale;
uniform float globalTime;

out vec4 outColor;

vec3 getColorAtPlace(float x, float y, float time) {
  bool xBorder = mod(x + 0.05 / 2.0, 1.0) < 0.05;
  bool yBorder = mod(y + 0.05 / 2.0, 1.0) < 0.05;
  
  if (xBorder && yBorder) {
    return vec3(0.75, 0.75, 0.75);
  } else if (xBorder || yBorder) {
    return vec3(0.5, 0.5, 0.5);
  } else {
    return vec3(0.0, 0.0, 0.0);
  }
}

void main() {
  float xNorm = gl_FragCoord.x / iResolution.x - 0.5;
  float yNorm = gl_FragCoord.y / iResolution.y - 0.5;
  
  float x = pos.x + xNorm * (iResolution.x / iResolution.y) * scale;
  float y = pos.y + yNorm * scale;
  
  outColor = vec4(getColorAtPlace(x, y, globalTime), 1.0);
}
