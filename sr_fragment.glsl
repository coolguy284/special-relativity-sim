#version 300 es

precision highp float;

uniform vec2 iResolution;

uniform vec2 pos;
uniform float scale;
uniform float time;

out vec4 outColor;

void main() {
  float xNorm = gl_FragCoord.x / iResolution.x;
  float yNorm = 1.0f - (gl_FragCoord.y / iResolution.y);
  
  outColor = vec4(xNorm, yNorm, 0.0, 1.0);
}
