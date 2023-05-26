#version 300 es

precision highp float;

uniform vec2 iResolution;

uniform int LIGHT_TRAVEL_TIME_DELAY;
uniform int LIGHT_TRAVEL_TIME_DELAY_INCLUDES_SHIP_VELOCITY;
uniform int UNIVERSE_TIME_DIALATION;
uniform int UNIVERSE_LENGTH_CONTRACTION;
uniform int ITEM_LENGTH_CONTRACTION;
uniform int BLACK_BEFORE_UNIVERSE_START;
uniform int BACKGROUND_PULSE;
uniform float SPEED_OF_LIGHT;

uniform vec2 pos;
uniform vec2 vel;
uniform float scale;
uniform float globalTime;

out vec4 outColor;

const float UNIVERSE_START = -5.0;

const bool SHIP_ENABLED = true;
const float SHIP_RADIUS = 0.2;
const float SHIP_RADIUS_SQ = SHIP_RADIUS * SHIP_RADIUS;

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
const float WHEEL_VEL_X = 0.0;
const float WHEEL_VEL_Y = 0.0;
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
const float WHEEL_SPEED = WHEEL_INNER_RADIUS / 3.14159265358979 / 2.0 * 2.0 * 0.5; // in revolutions per second (WHEEL_INNER_RADIUS / 3.14159265358979 / 2.0 * 2.0 * SPEED_OF_LIGHT for lightspeed); unknown reason why * 2.0 is needed

const bool WHEEL2_EXISTS = true;
const bool WHEEL2_ENABLED = true;
const float WHEEL2_X = 0.0;
const float WHEEL2_Y = -1.0;
const float WHEEL2_RADIUS = 0.7;
const float WHEEL2_RADIUS_SQ = WHEEL2_RADIUS * WHEEL2_RADIUS;
const float WHEEL2_THICKNESS = 0.1;
const float WHEEL2_INNER_RADIUS = WHEEL2_RADIUS - WHEEL2_THICKNESS;
const float WHEEL2_INNER_RADIUS_SQ = WHEEL2_INNER_RADIUS * WHEEL2_INNER_RADIUS;
const float WHEEL2_SPOKES = 15.0;
const float WHEEL2_THICKNESS_RADIAL = WHEEL2_THICKNESS / WHEEL2_RADIUS / 3.14159265358979 / 2.0 / 4.0 * WHEEL2_SPOKES; // unknown reason that / 4.0 is needed
const float WHEEL2_CENTER_RADIUS = 0.2;
const float WHEEL2_CENTER_RADIUS_SQ = WHEEL2_CENTER_RADIUS * WHEEL2_CENTER_RADIUS;
const float WHEEL2_START_TIME = 0.0;
const float WHEEL2_SINE_RADIUS = 3.0;
const float WHEEL2_SINE_PERIOD = 25.0;

struct universeFragInfo {
  float velX;
  float velY;
  vec2[8] wavelengthIntensities;
};

universeFragInfo getColorAtPlace_new_BETA(float x, float y, float time) {
  universeFragInfo e;
  
  e.velX = 0.0;
  e.velY = 0.0;
  e.wavelengthIntensities[0].x = 1.0;
  
  return e;
}

vec3 getColorAtPlace(float x, float y, float time) {
  // all black before universe start :)
  
  if (BLACK_BEFORE_UNIVERSE_START > 0 && time < UNIVERSE_START) {
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
      float particleX = -mod(-(x - EMITTER_X - EMITTER_RADIUS - particleTime * PARTICLE_SPEED), PARTICLE_SPACING) + PARTICLE_RADIUS;
      float particleY = y - EMITTER_Y;
      
      if (x > EMITTER_X + EMITTER_RADIUS && x < EMITTER_X + particleTime * PARTICLE_SPEED + EMITTER_RADIUS && particleX * particleX + particleY * particleY < PARTICLE_RADIUS_SQ) {
        float colorMod = 6.0 - mod(x - EMITTER_X - EMITTER_RADIUS - particleTime * PARTICLE_SPEED, PARTICLE_SPACING * 6.0) / PARTICLE_SPACING;
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
    
    float wheelDeltX = x - WHEEL_X - WHEEL_VEL_X * max(time - WHEEL_START_TIME, 0.0);
    float wheelDeltY = y - WHEEL_Y - WHEEL_VEL_Y * max(time - WHEEL_START_TIME, 0.0);
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
  
  // wheel 2
  
  if (WHEEL2_EXISTS) {
    // draw wheel rim
    
    float wheelDeltX = x - WHEEL2_X;
    float wheelDeltY = y - WHEEL2_Y;
    if (time > WHEEL2_START_TIME) {
      wheelDeltX += cos((time - WHEEL2_START_TIME) * 3.14159265358979 * 2.0 / WHEEL2_SINE_PERIOD) * WHEEL2_SINE_RADIUS;
    } else {
      wheelDeltX += WHEEL2_SINE_RADIUS;
    }
    float wheelDistSq = wheelDeltX * wheelDeltX + wheelDeltY * wheelDeltY;
    
    if (wheelDistSq > WHEEL2_INNER_RADIUS && wheelDistSq < WHEEL2_RADIUS) {
      return vec3(1.0, 1.0, 1.0);
    }
    
    // draw wheel center
    
    if (wheelDistSq < WHEEL2_CENTER_RADIUS_SQ) {
      return vec3(1.0, 1.0, 1.0);
    }
    
    // draw wheel spokes
    
    float wheelAngle = atan(wheelDeltY, wheelDeltX) / 3.14159265358979 / 2.0;
    
    float wheelThicknessAmplifDivis = sqrt(wheelDistSq / WHEEL2_RADIUS);
    
    float wheelAngleMod = mod(wheelAngle * WHEEL2_SPOKES + WHEEL2_THICKNESS_RADIAL / wheelThicknessAmplifDivis, 1.0) - WHEEL2_THICKNESS_RADIAL / wheelThicknessAmplifDivis;
    
    if (wheelDistSq < WHEEL2_RADIUS && wheelAngleMod < WHEEL2_THICKNESS_RADIAL / wheelThicknessAmplifDivis) {
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
    if (BACKGROUND_PULSE > 0) {
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
  
  if (LIGHT_TRAVEL_TIME_DELAY > 0) {
    float centerDeltX = x - pos.x;
    float centerDeltY = y - pos.y;
    
    float centerDeltDist = sqrt(centerDeltX * centerDeltX + centerDeltY * centerDeltY);
    
    float newGlobalTimeDiff = centerDeltDist / SPEED_OF_LIGHT;
    float newGlobalTime = globalTime - newGlobalTimeDiff;
    //newGlobalTime += pow(2.0, centerDeltX / 2.0) - pow(2.0, -centerDeltX / 2.0);
    
    if (LIGHT_TRAVEL_TIME_DELAY_INCLUDES_SHIP_VELOCITY > 0) {
      outColor = vec4(getColorAtPlace(x - newGlobalTimeDiff * vel.x, y - newGlobalTimeDiff * vel.y, newGlobalTime), 1.0);
    } else {
      outColor = vec4(getColorAtPlace(x, y, newGlobalTime), 1.0);
    }
  } else {
    outColor = vec4(getColorAtPlace(x, y, globalTime), 1.0);
  }
  
  // draw ship
  
  if (SHIP_ENABLED) {
    float shipDeltX = x - pos.x;
    float shipDeltY = y - pos.y;
    
    if (shipDeltX * shipDeltX + shipDeltY * shipDeltY < SHIP_RADIUS_SQ) {
      outColor.r = outColor.r * 0.5 + 0.5;
      outColor.gb = outColor.gb * 0.5;
    }
  }
}
