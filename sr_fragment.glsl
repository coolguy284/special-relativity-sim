#version 300 es

precision highp float;

uniform vec2 iResolution;

uniform vec2 pos;
uniform float scale;
uniform float globalTime;

out vec4 outColor;

bool LIGHT_TRAVEL_TIME_DELAY = true;
bool BLACK_BEFORE_UNVIERSE_START = true;
bool BACKGROUND_PULSE = true;

const float SPEED_OF_LIGHT = 1.0;

const float UNIVERSE_START = -5.0;

const float GRID_SPACING = 1.0;
const float GRID_SPACING_1_2 = GRID_SPACING / 2.0;
const float BORDER_THICKNESS = 0.05;
const float BORDER_THICKNESS_1_2 = BORDER_THICKNESS / 2.0;

const float BACKGROUND_PULSE_INTENSITY = 0.1;
const float BACKGROUND_PULSE_INTENSITY_1_2 = BACKGROUND_PULSE_INTENSITY / 2.0;

const bool EMITTER_EXISTS = true;
const bool EMITTER_ENABLED = true;
const float EMITTER_X = -2.5;
const float EMITTER_Y = 2.5;
const float EMITTER_RADIUS = 0.25;
const float EMITTER_START_TIME = 0.0;
const float PARTICLE_RADIUS = 0.2;
const float PARTICLE_RADIUS_SQ = PARTICLE_RADIUS * PARTICLE_RADIUS;
const float PARTICLE_SPEED = 0.8; // to reverse speed period must also be reversed, and start time of emitter must be in the future
const float PARTICLE_PERIOD = 1.0;
const float PARTICLE_SPACING = PARTICLE_SPEED * PARTICLE_PERIOD;

const bool WHEEL_EXISTS = true;
const bool WHEEL_ENABLED = true;
const float WHEEL_X = -3.0;
const float WHEEL_Y = 1.0;
const float WHEEL_RADIUS = 0.7;
const float WHEEL_RADIUS_SQ = WHEEL_RADIUS * WHEEL_RADIUS;
const float WHEEL_THICKNESS = 0.1;
const float WHEEL_INNER_RADIUS = WHEEL_RADIUS - WHEEL_THICKNESS;
const float WHEEL_INNER_RADIUS_SQ = WHEEL_INNER_RADIUS * WHEEL_INNER_RADIUS;
const float WHEEL_SPOKES = 15.0;
const float WHEEL_THICKNESS_RADIAL = WHEEL_THICKNESS / WHEEL_RADIUS / 3.14159265358979 / 2.0 / 4.0 * WHEEL_SPOKES; // unknown reason that / 4.0 is needed
const float WHEEL_CENTER_RADIUS = 0.2;
const float WHEEL_CENTER_RADIUS_SQ = WHEEL_CENTER_RADIUS * WHEEL_CENTER_RADIUS;
const float WHEEL_START_TIME = 0.0;
const float WHEEL_SPEED = WHEEL_INNER_RADIUS / 3.14159265358979 / 2.0 * 2.0 * SPEED_OF_LIGHT * 0.5; // in revolutions per second (WHEEL_INNER_RADIUS / 3.14159265358979 / 2.0 * 2.0 * SPEED_OF_LIGHT for lightspeed); unknown reason why * 2.0 is needed

vec3 getColorAtPlace(float x, float y, float time) {
  // all black before universe start :)
  
  if (BLACK_BEFORE_UNVIERSE_START && time < UNIVERSE_START) {
    return vec3(0.0, 0.0, 0.0);
  }
  
  // emitter
  
  if (EMITTER_EXISTS) {
    // draw emitter arrow shaft
    
    if (x > EMITTER_X - EMITTER_RADIUS * 0.75 && x < EMITTER_X + EMITTER_RADIUS * 0.65 && y > EMITTER_Y - EMITTER_RADIUS * 0.15 && y < EMITTER_Y + EMITTER_RADIUS * 0.15) {
      return vec3(0.5, 0.0, 0.0);
    }
    
    // draw emitter arrow pointer
    
    if (x > EMITTER_X + EMITTER_RADIUS * 0.5 - abs(y - EMITTER_Y) && x < EMITTER_X + EMITTER_RADIUS * 0.8 - abs(y - EMITTER_Y) && y > EMITTER_Y - EMITTER_RADIUS * 0.75 && y < EMITTER_Y + EMITTER_RADIUS * 0.75) {
      return vec3(0.5, 0.0, 0.0);
    }
    
    // draw emitter
    
    if (x > EMITTER_X - EMITTER_RADIUS && x < EMITTER_X + EMITTER_RADIUS && y > EMITTER_Y - EMITTER_RADIUS && y < EMITTER_Y + EMITTER_RADIUS) {
      return vec3(0.5, 0.5, 0.5);
    }
    
    // draw circles
    
    if (EMITTER_ENABLED) {
      float particleTime = time - EMITTER_START_TIME;
      float particleX = mod(x - EMITTER_X - particleTime * PARTICLE_SPEED - PARTICLE_RADIUS, PARTICLE_SPACING) + PARTICLE_RADIUS - PARTICLE_SPACING;
      float particleY = y - EMITTER_Y;
      
      if (x > EMITTER_X + PARTICLE_RADIUS && x < EMITTER_X + particleTime * PARTICLE_SPEED + PARTICLE_RADIUS && particleX * particleX + particleY * particleY < PARTICLE_RADIUS_SQ) {
        float colorMod = mod(-(x - EMITTER_X - particleTime * PARTICLE_SPEED) + PARTICLE_RADIUS, PARTICLE_SPACING * 6.0) / PARTICLE_SPACING;
        if (colorMod < 1.0) {
          return vec3(0.75, 0, 0);
        } else if (colorMod < 2.0) {
          return vec3(0.75, 0.75, 0);
        } else if (colorMod < 3.0) {
          return vec3(0, 0.75, 0);
        } else if (colorMod < 4.0) {
          return vec3(0, 0.75, 0.75);
        } else if (colorMod < 5.0) {
          return vec3(0, 0, 0.75);
        } else {
          return vec3(0.75, 0, 0.75);
        }
      }
    }
  }
  
  // wheel
  
  if (WHEEL_EXISTS) {
    // draw wheel rim
    
    float wheelDeltX = x - WHEEL_X;
    float wheelDeltY = y - WHEEL_Y;
    float wheelDistSq = wheelDeltX * wheelDeltX + wheelDeltY * wheelDeltY;
    
    if (wheelDistSq > WHEEL_INNER_RADIUS && wheelDistSq < WHEEL_RADIUS) {
      return vec3(1.0, 1.0, 1.0);
    }
    
    // draw wheel center
    
    if (wheelDistSq < WHEEL_CENTER_RADIUS_SQ) {
      return vec3(1.0, 1.0, 1.0);
    }
    
    // draw wheel spokes
    
    float wheelAngle = atan(wheelDeltY, wheelDeltX) / 3.14159265358979 / 2.0;
    
    if (WHEEL_ENABLED && time > WHEEL_START_TIME) {
      wheelAngle += WHEEL_SPEED * (time - WHEEL_START_TIME);
    }
    
    float wheelThicknessAmplifDivis = sqrt(wheelDistSq / WHEEL_RADIUS);
    
    float wheelAngleMod = mod(wheelAngle * WHEEL_SPOKES + WHEEL_THICKNESS_RADIAL / wheelThicknessAmplifDivis, 1.0) - WHEEL_THICKNESS_RADIAL / wheelThicknessAmplifDivis;
    
    if (wheelDistSq < WHEEL_RADIUS && wheelAngleMod < WHEEL_THICKNESS_RADIAL / wheelThicknessAmplifDivis) {
      return vec3(1.0, 1.0, 1.0);
    }
  }
  
  // draw border
  
  bool xBorder = mod(x + BORDER_THICKNESS_1_2, GRID_SPACING) < BORDER_THICKNESS;
  bool yBorder = mod(y + BORDER_THICKNESS_1_2, GRID_SPACING) < BORDER_THICKNESS;
  
  if (xBorder && x > -GRID_SPACING_1_2 && x < GRID_SPACING_1_2 || yBorder && y > -GRID_SPACING_1_2 && y < GRID_SPACING_1_2) {
    return vec3(0.75, 0.0, 0.0);
  } else if (xBorder && yBorder) {
    return vec3(0.75, 0.75, 0.75);
  } else if (xBorder || yBorder) {
    return vec3(0.5, 0.5, 0.5);
  } else {
    if (BACKGROUND_PULSE) {
      return vec3(
        -cos(time * 5.0) * BACKGROUND_PULSE_INTENSITY_1_2 + BACKGROUND_PULSE_INTENSITY_1_2,
        -cos(time * 5.0) * BACKGROUND_PULSE_INTENSITY_1_2 + BACKGROUND_PULSE_INTENSITY_1_2,
        -cos(time * 5.0) * BACKGROUND_PULSE_INTENSITY_1_2 + BACKGROUND_PULSE_INTENSITY_1_2
      );
    }
  }
}

void main() {
  float xNorm = gl_FragCoord.x / iResolution.x - 0.5;
  float yNorm = gl_FragCoord.y / iResolution.y - 0.5;
  
  float x = pos.x + xNorm * (iResolution.x / iResolution.y) * scale;
  float y = pos.y + yNorm * scale;
  
  if (LIGHT_TRAVEL_TIME_DELAY) {
    float centerDeltX = x - pos.x;
    float centerDeltY = y - pos.y;
    
    float centerDeltDist = sqrt(centerDeltX * centerDeltX + centerDeltY * centerDeltY);
    
    float newGlobalTime = globalTime;
    newGlobalTime -= centerDeltDist / SPEED_OF_LIGHT;
    //newGlobalTime += pow(2.0, centerDeltX / 2.0) - pow(2.0, -centerDeltX / 2.0);
    
    outColor = vec4(getColorAtPlace(x, y, newGlobalTime), 1.0);
  } else {
    outColor = vec4(getColorAtPlace(x, y, globalTime), 1.0);
  }
}
