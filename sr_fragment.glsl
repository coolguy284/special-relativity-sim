#version 300 es

precision highp float;

uniform vec2 iResolution;

uniform int LIGHT_TRAVEL_TIME_DELAY;
uniform int LIGHT_TRAVEL_TIME_DELAY_INCLUDES_SHIP_VELOCITY;
uniform int UNIVERSE_TIME_SHIFTING;
uniform int UNIVERSE_LENGTH_CONTRACTION;
uniform int ITEM_LENGTH_CONTRACTION;
uniform int RINDLER_METRIC_WHEN_ACCELERATING;
uniform int RINDLER_METRIC_WHEN_ACCELERATING_TIMELIKE_VIEW;
uniform int HIDE_RINDLER_METRIC_PAST_SINGULARITY;
uniform int TIMELIKE_VIEW;
uniform int BLACK_BEFORE_UNIVERSE_START;
uniform int BACKGROUND_PULSE;
uniform float SPEED_OF_LIGHT;

uniform vec2 pos;
uniform vec2 vel;
uniform float scale;
uniform float globalTime;
uniform float velMag;
uniform float velAng;
uniform float velLorenzFactor;
uniform float velRelativityScaleFactor;
uniform float velMagAdj;
uniform float accMag;
uniform float accAng;
uniform float accMagAdj;

out vec4 outColor;

const float NaN = 0.0 / 0.0;

const float UNIVERSE_START = -5.0;

const bool SHIP_ENABLED = true;
const float SHIP_RADIUS = 0.2;

const float GRID_SPACING = 1.0;
const float BORDER_THICKNESS = 0.05;

const float BACKGROUND_PULSE_INTENSITY = 0.1;

const bool EMITTER_EXISTS = true;
const bool EMITTER_ENABLED = true;
const float EMITTER_X = -2.5;
const float EMITTER_Y = 2.5;
const float EMITTER_RADIUS = 0.25;
const float EMITTER_START_TIME = 0.0;
const float PARTICLE_RADIUS = 0.2;
const float PARTICLE_SPEED = 0.8; // to reverse speed period must also be reversed, and start time of emitter must be in the future
const float PARTICLE_PERIOD = 1.0;

const bool WHEEL1_EXISTS = true;
const bool WHEEL1_ENABLED = true;
const float WHEEL1_X = -3.0;
const float WHEEL1_Y = 1.0;
const float WHEEL1_VEL_X = 0.0;
const float WHEEL1_VEL_Y = 0.0;
const float WHEEL1_RADIUS = 0.83;
const float WHEEL1_THICKNESS = 0.07;
const float WHEEL1_SPOKES = 15.0;
const float WHEEL1_CENTER_RADIUS = 0.2;
const float WHEEL1_START_TIME = 0.0;
const bool WHEEL1_LENGTH_CONTRACTION = true;
const bool WHEEL1_SPOKES_LENGTH_CONTRACTION = true;
const bool WHEEL1_SPOKES_LENGTH_CONTRACTION_BEFORE_SPIN_START = true;
const bool WHEEL1_MOVING_BEFORE_START = false;
const bool WHEEL1_ROTATING_BEFORE_START_AFTER_TRANSITION_TO_MOVING_FRAME = true;
const float WHEEL1_INNER_RADIUS = WHEEL1_RADIUS - WHEEL1_THICKNESS;
const float WHEEL1_ROTATION_SPEED = 1.0 / WHEEL1_INNER_RADIUS / 3.14159265358979 / 2.0 * 0.5; // in revolutions per second (1.0 / WHEEL1_INNER_RADIUS / 3.14159265358979 / 2.0 * SPEED_OF_LIGHT for lightspeed)

const bool WHEEL2_EXISTS = true;
const bool WHEEL2_ENABLED = true;
const float WHEEL2_X = 0.0;
const float WHEEL2_Y = -1.0;
const float WHEEL2_RADIUS = 0.83;
const float WHEEL2_THICKNESS = 0.07;
const float WHEEL2_SPOKES = 15.0;
const float WHEEL2_CENTER_RADIUS = 0.2;
const float WHEEL2_START_TIME = 0.0;
const float WHEEL2_SINE_RADIUS = 3.0;
const float WHEEL2_SINE_PERIOD = 25.0;
const bool WHEEL2_LENGTH_CONTRACTION = true;

const bool REGION_SPLICE = true;
const float REGION_SPLICE_X = 0.0;
const float REGION_SPLICE_Y = 10.0;
const float REGION_SPLICE_VEL_X = 0.5;
const float REGION_SPLICE_WIDTH_RADIUS = 10.0;

const float SHIP_RADIUS_SQ = SHIP_RADIUS * SHIP_RADIUS;

const float GRID_SPACING_1_2 = GRID_SPACING / 2.0;
const float BORDER_THICKNESS_1_2 = BORDER_THICKNESS / 2.0;

const float BACKGROUND_PULSE_INTENSITY_1_2 = BACKGROUND_PULSE_INTENSITY / 2.0;

const float PARTICLE_RADIUS_SQ = PARTICLE_RADIUS * PARTICLE_RADIUS;
const float PARTICLE_SPACING = PARTICLE_SPEED * PARTICLE_PERIOD;

const float WHEEL1_RADIUS_SQ = WHEEL1_RADIUS * WHEEL1_RADIUS;
const float WHEEL1_INNER_RADIUS_SQ = WHEEL1_INNER_RADIUS * WHEEL1_INNER_RADIUS;
const float WHEEL1_THICKNESS_RADIAL = WHEEL1_THICKNESS / WHEEL1_RADIUS / 3.14159265358979 / 2.0 / 2.0 * WHEEL1_SPOKES; // unknown reason that second / 2.0 is needed
const float WHEEL1_CENTER_RADIUS_SQ = WHEEL1_CENTER_RADIUS * WHEEL1_CENTER_RADIUS;
const float WHEEL1_VEL_MAG = sqrt(WHEEL1_VEL_X * WHEEL1_VEL_X + WHEEL1_VEL_Y * WHEEL1_VEL_Y);
const float WHEEL1_VEL_ANG = atan(WHEEL1_VEL_Y, WHEEL1_VEL_X);

const float WHEEL2_RADIUS_SQ = WHEEL2_RADIUS * WHEEL2_RADIUS;
const float WHEEL2_INNER_RADIUS = WHEEL2_RADIUS - WHEEL2_THICKNESS;
const float WHEEL2_INNER_RADIUS_SQ = WHEEL2_INNER_RADIUS * WHEEL2_INNER_RADIUS;
const float WHEEL2_THICKNESS_RADIAL = WHEEL2_THICKNESS / WHEEL2_RADIUS / 3.14159265358979 / 2.0 / 2.0 * WHEEL2_SPOKES; // unknown reason that second / 2.0 is needed
const float WHEEL2_CENTER_RADIUS_SQ = WHEEL2_CENTER_RADIUS * WHEEL2_CENTER_RADIUS;

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

// demonstration function, not used
vec3 getWorldPlaceFromFrameCoords(vec3 frameCenterPlace, vec2 frameVel, vec3 frameRelPlace, float lightSpeed) {
  float velMag = sqrt(frameVel.x * frameVel.x + frameVel.y * frameVel.y);
  float velAng = atan(frameVel.y, frameVel.x);
  float velRapidity = atanh(velMag / lightSpeed);
  float velRelativityScaleFactor = cosh(velRapidity);
  
  float velMagAdj = velMag / lightSpeed;
  
  frameRelPlace.xy = vec2(cos(velAng) * frameRelPlace.x + sin(velAng) * frameRelPlace.y, cos(velAng) * frameRelPlace.y - sin(velAng) * frameRelPlace.x);
  
  frameRelPlace.xy /= lightSpeed;
  
  vec3 worldPlace = vec3(0.0, frameRelPlace.y, 0.0);
  if (UNIVERSE_LENGTH_CONTRACTION > 0) {
    worldPlace.x = velMagAdj * frameRelPlace.z * velRelativityScaleFactor + frameRelPlace.x * velRelativityScaleFactor;
  } else {
    worldPlace.x = frameRelPlace.x;
  }
  if (UNIVERSE_TIME_SHIFTING > 0) {
    worldPlace.z = frameRelPlace.z * velRelativityScaleFactor + velMagAdj * frameRelPlace.x * velRelativityScaleFactor;
  } else {
    worldPlace.z = frameRelPlace.z;
  }
  
  worldPlace.xy *= lightSpeed;
  
  worldPlace.xy = vec2(cos(velAng) * worldPlace.x - sin(velAng) * worldPlace.y, cos(velAng) * worldPlace.y + sin(velAng) * worldPlace.x);
  
  return worldPlace + frameCenterPlace;
}

vec3 getWorldPlaceFromShipFrameCoords(vec3 frameRelPlace) {
  vec3 frameCenterPlace = vec3(pos, globalTime);
  
  frameRelPlace.xy = vec2(cos(velAng) * frameRelPlace.x + sin(velAng) * frameRelPlace.y, cos(velAng) * frameRelPlace.y - sin(velAng) * frameRelPlace.x);
  
  frameRelPlace.xy /= SPEED_OF_LIGHT;
  
  vec3 worldPlace = vec3(0.0, frameRelPlace.y, 0.0);
  if (UNIVERSE_LENGTH_CONTRACTION > 0) {
    worldPlace.x = velMagAdj * frameRelPlace.z * velRelativityScaleFactor + frameRelPlace.x * velRelativityScaleFactor;
  } else {
    worldPlace.x = frameRelPlace.x;
  }
  if (UNIVERSE_TIME_SHIFTING > 0) {
    worldPlace.z = frameRelPlace.z * velRelativityScaleFactor + velMagAdj * frameRelPlace.x * velRelativityScaleFactor;
  } else {
    worldPlace.z = frameRelPlace.z;
  }
  
  worldPlace.xy *= SPEED_OF_LIGHT;
  
  worldPlace.xy = vec2(cos(velAng) * worldPlace.x - sin(velAng) * worldPlace.y, cos(velAng) * worldPlace.y + sin(velAng) * worldPlace.x);
  
  return worldPlace + frameCenterPlace;
}

// demonstration function, not used
vec3 getWorldPlaceFromRindlerShipFrameCoords(vec2 frameAcc, vec3 rindlerFrameRelPlace) {
  float accMag = sqrt(frameAcc.x * frameAcc.x + frameAcc.y * frameAcc.y);
  float accAng = atan(frameAcc.y, frameAcc.x);
  
  rindlerFrameRelPlace.xyz /= SPEED_OF_LIGHT;
  
  rindlerFrameRelPlace.xy = vec2(cos(accAng) * rindlerFrameRelPlace.x + sin(accAng) * rindlerFrameRelPlace.y, cos(accAng) * rindlerFrameRelPlace.y - sin(accAng) * rindlerFrameRelPlace.x);
  
  rindlerFrameRelPlace.x += 1.0 / accMagAdj;
  if (HIDE_RINDLER_METRIC_PAST_SINGULARITY > 0 && rindlerFrameRelPlace.x < 0.0) {
    return vec3(NaN, NaN, NaN);
  }
  
  vec3 frameRelPlace = vec3(0.0, rindlerFrameRelPlace.y, 0.0);
  frameRelPlace.x = rindlerFrameRelPlace.x * cosh(accMag * rindlerFrameRelPlace.z);
  frameRelPlace.z = rindlerFrameRelPlace.x * sinh(accMag * rindlerFrameRelPlace.z);
  
  if (LIGHT_TRAVEL_TIME_DELAY > 0) {
    float centerDeltX = log(rindlerFrameRelPlace.x) / accMag - log(1.0 / accMag) / accMag;
    float centerDeltY = rindlerFrameRelPlace.y;
    float centerDeltDist = sqrt(centerDeltX * centerDeltX + centerDeltY * centerDeltY);
    
    float timeShift = -centerDeltDist / SPEED_OF_LIGHT;
    
    frameRelPlace.z += timeShift;
  }
  
  frameRelPlace.x -= 1.0 / accMagAdj;
  
  frameRelPlace.xy = vec2(cos(accAng) * frameRelPlace.x - sin(accAng) * frameRelPlace.y, cos(accAng) * frameRelPlace.y + sin(accAng) * frameRelPlace.x);
  
  frameRelPlace.xy *= SPEED_OF_LIGHT;
  
  return getWorldPlaceFromShipFrameCoords(frameRelPlace);
}

vec3 getWorldPlaceFromShipRindlerShipFrameCoords(vec3 rindlerFrameRelPlace) {
  rindlerFrameRelPlace.xyz /= SPEED_OF_LIGHT;
  
  rindlerFrameRelPlace.xy = vec2(cos(accAng) * rindlerFrameRelPlace.x + sin(accAng) * rindlerFrameRelPlace.y, cos(accAng) * rindlerFrameRelPlace.y - sin(accAng) * rindlerFrameRelPlace.x);
  
  rindlerFrameRelPlace.x += 1.0 / accMagAdj;
  if (HIDE_RINDLER_METRIC_PAST_SINGULARITY > 0 && rindlerFrameRelPlace.x < 0.0) {
    return vec3(0.0 / 0.0, 0.0 / 0.0, 0.0 / 0.0);
  }
  
  vec3 frameRelPlace = vec3(0.0, rindlerFrameRelPlace.y, 0.0);
  frameRelPlace.x = rindlerFrameRelPlace.x * cosh(accMag * rindlerFrameRelPlace.z);
  frameRelPlace.z = rindlerFrameRelPlace.x * sinh(accMag * rindlerFrameRelPlace.z);
  
  if (LIGHT_TRAVEL_TIME_DELAY > 0) {
    float centerDeltX = log(rindlerFrameRelPlace.x) / accMag - log(1.0 / accMag) / accMag;
    float centerDeltY = rindlerFrameRelPlace.y;
    float centerDeltDist = sqrt(centerDeltX * centerDeltX + centerDeltY * centerDeltY);
    
    float timeShift = -centerDeltDist / SPEED_OF_LIGHT;
    
    frameRelPlace.z += timeShift;
  }
  
  frameRelPlace.x -= 1.0 / accMagAdj;
  
  frameRelPlace.xy = vec2(cos(accAng) * frameRelPlace.x - sin(accAng) * frameRelPlace.y, cos(accAng) * frameRelPlace.y + sin(accAng) * frameRelPlace.x);
  
  frameRelPlace.xy *= SPEED_OF_LIGHT;
  
  return getWorldPlaceFromShipFrameCoords(frameRelPlace);
}

vec3 getFramePlaceFromWorldCoords(vec3 frameCenterPlace, vec2 frameVel, vec3 worldPlace, float lightSpeed) {
  float velMag = sqrt(frameVel.x * frameVel.x + frameVel.y * frameVel.y);
  float velAng = atan(frameVel.y, frameVel.x);
  float velRapidity = atanh(velMag / lightSpeed);
  float velRelativityScaleFactor = cosh(velRapidity);
  
  float velMagAdj = velMag / lightSpeed;
  
  worldPlace -= frameCenterPlace;
  
  worldPlace.xy = vec2(cos(velAng) * worldPlace.x + sin(velAng) * worldPlace.y, cos(velAng) * worldPlace.y - sin(velAng) * worldPlace.x);
  
  worldPlace.xy /= lightSpeed;
  
  vec3 frameRelPlace = vec3(0.0, worldPlace.y, 0.0);
  if (UNIVERSE_TIME_SHIFTING > 0) {
    frameRelPlace.z = (-worldPlace.x * velMag + worldPlace.z) / (1.0 - velMagAdj * velMagAdj) / velRelativityScaleFactor;
  } else {
    frameRelPlace.z = worldPlace.z;
  }
  if (UNIVERSE_LENGTH_CONTRACTION > 0) {
    frameRelPlace.x = (-worldPlace.z * velMag + worldPlace.x) / (1.0 - velMagAdj * velMagAdj) / velRelativityScaleFactor;
  } else {
    frameRelPlace.x = worldPlace.x;
  }
  
  frameRelPlace.xy *= SPEED_OF_LIGHT;
  
  frameRelPlace.xy = vec2(cos(velAng) * frameRelPlace.x - sin(velAng) * frameRelPlace.y, cos(velAng) * frameRelPlace.y + sin(velAng) * frameRelPlace.x);
  
  return frameRelPlace;
}

float getLorenzFactor(float vel, float lightSpeed) {
  return 1.0 / sqrt(1.0 - vel * vel / lightSpeed * lightSpeed);
}

vec3 getColorAtPlace(float x, float y, float time) {
  // region splice
  
  if (REGION_SPLICE) {
    float width = REGION_SPLICE_WIDTH_RADIUS / getLorenzFactor(REGION_SPLICE_VEL_X, SPEED_OF_LIGHT);
    if (x > time * REGION_SPLICE_VEL_X + REGION_SPLICE_X - width && x < time * REGION_SPLICE_VEL_X + REGION_SPLICE_X + width && y > REGION_SPLICE_Y - 5.0 && y < REGION_SPLICE_Y + 5.0) {
      vec3 place = getFramePlaceFromWorldCoords(vec3(0.0, 0.0, 0.0), vec2(REGION_SPLICE_VEL_X, 0.0), vec3(x - REGION_SPLICE_X, y - REGION_SPLICE_Y, time), SPEED_OF_LIGHT);
      x = place.x;
      y = place.y;
      time = place.z;
    }
  }
  
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
      float particleLengthContraction = ITEM_LENGTH_CONTRACTION > 0 ? sqrt(1.0 - PARTICLE_SPEED * PARTICLE_SPEED / SPEED_OF_LIGHT / SPEED_OF_LIGHT) : 1.0;
      float particleTime = time - EMITTER_START_TIME;
      float particleX = -mod(-(x - EMITTER_X - EMITTER_RADIUS - particleTime * PARTICLE_SPEED), PARTICLE_SPACING) + PARTICLE_RADIUS * particleLengthContraction;
      float particleY = y - EMITTER_Y;
      
      if (x > EMITTER_X + EMITTER_RADIUS && x < EMITTER_X + particleTime * PARTICLE_SPEED + EMITTER_RADIUS && particleX * particleX / particleLengthContraction / particleLengthContraction + particleY * particleY < PARTICLE_RADIUS_SQ) {
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
  
  if (WHEEL1_EXISTS) {
    float wheelTime = time - WHEEL1_START_TIME;
    float cappedWheelTime = max(wheelTime, 0.0);
    
    vec2 wheelDelt;
    
    if (WHEEL1_MOVING_BEFORE_START) {
      wheelDelt = vec2(
        x - WHEEL1_X - WHEEL1_VEL_X * wheelTime,
        y - WHEEL1_Y - WHEEL1_VEL_Y * wheelTime
      );
    } else {
      wheelDelt = vec2(
        x - WHEEL1_X - WHEEL1_VEL_X * cappedWheelTime,
        y - WHEEL1_Y - WHEEL1_VEL_Y * cappedWheelTime
      );
    }
    
    if (wheelDelt.x > -WHEEL1_RADIUS && wheelDelt.x < WHEEL1_RADIUS && wheelDelt.y > -WHEEL1_RADIUS && wheelDelt.y < WHEEL1_RADIUS) {
      bool wheelLorenzShiftOccurred;
      
      if (ITEM_LENGTH_CONTRACTION > 0 && WHEEL1_LENGTH_CONTRACTION && (wheelTime > 0.0 || WHEEL1_MOVING_BEFORE_START)) {
        float wheelLorenzFactor = getLorenzFactor(WHEEL1_VEL_MAG, SPEED_OF_LIGHT);
        
        wheelTime /= wheelLorenzFactor;
        
        vec3 wheelRelShifts = getFramePlaceFromWorldCoords(vec3(0.0, 0.0, 0.0), vec2(WHEEL1_VEL_X, WHEEL1_VEL_Y), vec3(wheelDelt, 0.0), SPEED_OF_LIGHT);
        
        wheelDelt = wheelRelShifts.xy;
        wheelTime += wheelRelShifts.z;
        wheelLorenzShiftOccurred = true;
      } else {
        wheelLorenzShiftOccurred = false;
      }
      
      float wheelDistSq = wheelDelt.x * wheelDelt.x + wheelDelt.y * wheelDelt.y;
      
      // draw wheel rim
      
      if (wheelDistSq > WHEEL1_INNER_RADIUS_SQ && wheelDistSq < WHEEL1_RADIUS_SQ) {
        return vec3(1.0, 1.0, 1.0);
      }
      
      // draw wheel center
      
      if (wheelDistSq < WHEEL1_CENTER_RADIUS_SQ) {
        return vec3(1.0, 1.0, 1.0);
      }
      
      // draw wheel spokes
      
      float wheelAngle = atan(wheelDelt.y, wheelDelt.x) / 3.14159265358979 / 2.0;
      
      bool wheelCurrentlySpinning = WHEEL1_ENABLED && (wheelTime > 0.0 || WHEEL1_ROTATING_BEFORE_START_AFTER_TRANSITION_TO_MOVING_FRAME && wheelLorenzShiftOccurred);
      
      if (wheelCurrentlySpinning) {
        wheelAngle += WHEEL1_ROTATION_SPEED * wheelTime;
      }
      
      float wheelDist = sqrt(wheelDistSq);
      
      float wheelThicknessAmplifDivis;
      if (ITEM_LENGTH_CONTRACTION > 0 && WHEEL1_SPOKES_LENGTH_CONTRACTION && (wheelCurrentlySpinning || WHEEL1_SPOKES_LENGTH_CONTRACTION_BEFORE_SPIN_START)) {
        float wheelVelocity = wheelDist * WHEEL1_ROTATION_SPEED * 3.14159265358979 * 2.0;
        
        wheelThicknessAmplifDivis = wheelDist / WHEEL1_RADIUS * getLorenzFactor(wheelVelocity, SPEED_OF_LIGHT);
      } else {
        wheelThicknessAmplifDivis = wheelDist / WHEEL1_RADIUS;
      }
      
      float wheelAngleMod = mod(wheelAngle * WHEEL1_SPOKES + WHEEL1_THICKNESS_RADIAL / wheelThicknessAmplifDivis, 1.0) - WHEEL1_THICKNESS_RADIAL / wheelThicknessAmplifDivis;
      
      if (wheelDistSq < WHEEL1_RADIUS_SQ && wheelAngleMod < WHEEL1_THICKNESS_RADIAL / wheelThicknessAmplifDivis) {
        return vec3(1.0, 1.0, 1.0);
      }
    }
  }
  
  // wheel 2
  
  if (WHEEL2_EXISTS) {
    float wheelDeltX = x - WHEEL2_X;
    float wheelDeltY = y - WHEEL2_Y;
    float wheelTime = time - WHEEL2_START_TIME;
    if (WHEEL2_ENABLED && wheelTime > 0.0) {
      wheelDeltX += cos(wheelTime * 3.14159265358979 * 2.0 / WHEEL2_SINE_PERIOD) * WHEEL2_SINE_RADIUS;
      
      if (ITEM_LENGTH_CONTRACTION > 0 && WHEEL2_LENGTH_CONTRACTION) {
        float wheelVelX = -sin(wheelTime * 3.14159265358979 * 2.0 / WHEEL2_SINE_PERIOD) * (3.14159265358979 * 2.0 / WHEEL2_SINE_PERIOD) * WHEEL2_SINE_RADIUS; // derivative of wheelDeltX equation above
        
        float wheelLorenzFactor = getLorenzFactor(wheelVelX, SPEED_OF_LIGHT);
        
        wheelDeltX *= wheelLorenzFactor;
      }
    } else {
      wheelDeltX += WHEEL2_SINE_RADIUS;
    }
    float wheelDistSq = wheelDeltX * wheelDeltX + wheelDeltY * wheelDeltY;
    
    // draw wheel rim
    
    if (wheelDistSq > WHEEL2_INNER_RADIUS_SQ && wheelDistSq < WHEEL2_RADIUS_SQ) {
      return vec3(1.0, 1.0, 1.0);
    }
    
    // draw wheel center
    
    if (wheelDistSq < WHEEL2_CENTER_RADIUS_SQ) {
      return vec3(1.0, 1.0, 1.0);
    }
    
    // draw wheel spokes
    
    float wheelAngle = atan(wheelDeltY, wheelDeltX) / 3.14159265358979 / 2.0;
    
    float wheelThicknessAmplifDivis = sqrt(wheelDistSq / WHEEL2_RADIUS_SQ);
    
    float wheelAngleMod = mod(wheelAngle * WHEEL2_SPOKES + WHEEL2_THICKNESS_RADIAL / wheelThicknessAmplifDivis, 1.0) - WHEEL2_THICKNESS_RADIAL / wheelThicknessAmplifDivis;
    
    if (wheelDistSq < WHEEL2_RADIUS_SQ && wheelAngleMod < WHEEL2_THICKNESS_RADIAL / wheelThicknessAmplifDivis) {
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
  
  float deltX = xNorm * (iResolution.x / iResolution.y) * scale;
  float deltY = yNorm * scale;
  
  vec3 place;
  
  if (TIMELIKE_VIEW > 0) {
    place = vec3(pos.x + deltX, pos.y, globalTime + deltY);
    
    if (LIGHT_TRAVEL_TIME_DELAY > 0 && !(UNIVERSE_LENGTH_CONTRACTION > 0 || UNIVERSE_TIME_SHIFTING > 0)) {
      float centerDeltDist = abs(deltX);
      
      float timeShift = -centerDeltDist / SPEED_OF_LIGHT;
      
      place.z += timeShift;
      
      if (LIGHT_TRAVEL_TIME_DELAY_INCLUDES_SHIP_VELOCITY > 0) {
        place.xy -= -timeShift * vel;
      }
    } else if (!(LIGHT_TRAVEL_TIME_DELAY > 0) && (UNIVERSE_LENGTH_CONTRACTION > 0 || UNIVERSE_TIME_SHIFTING > 0)) {
      if (RINDLER_METRIC_WHEN_ACCELERATING_TIMELIKE_VIEW > 0 && accMag > 0.0) {
        place = getWorldPlaceFromShipRindlerShipFrameCoords(vec3(deltX, 0.0, deltY));
      } else {
        place = getWorldPlaceFromShipFrameCoords(vec3(deltX, 0.0, deltY));
      }
    } else if ((LIGHT_TRAVEL_TIME_DELAY > 0) && (UNIVERSE_LENGTH_CONTRACTION > 0 || UNIVERSE_TIME_SHIFTING > 0)) {
      if (RINDLER_METRIC_WHEN_ACCELERATING_TIMELIKE_VIEW > 0 && accMag > 0.0) {
        place = getWorldPlaceFromShipRindlerShipFrameCoords(vec3(deltX, 0.0, deltY));
      } else {
        float centerDeltDist = abs(deltX);
        
        float timeShift = -centerDeltDist / SPEED_OF_LIGHT;
        
        place = getWorldPlaceFromShipFrameCoords(vec3(deltX, 0.0, deltY + timeShift));
      }
    }
  } else {
    place = vec3(pos.x + deltX, pos.y + deltY, globalTime);
    
    if (LIGHT_TRAVEL_TIME_DELAY > 0 && !(UNIVERSE_LENGTH_CONTRACTION > 0 || UNIVERSE_TIME_SHIFTING > 0)) {
      float centerDeltDist = sqrt(deltX * deltX + deltY * deltY);
      
      float timeShift = -centerDeltDist / SPEED_OF_LIGHT;
      //timeShift += pow(2.0, centerDeltX / 2.0) - pow(2.0, -centerDeltX / 2.0);
      
      place.z += timeShift;
      
      if (LIGHT_TRAVEL_TIME_DELAY_INCLUDES_SHIP_VELOCITY > 0) {
        place.xy -= -timeShift * vel;
      }
    } else if (!(LIGHT_TRAVEL_TIME_DELAY > 0) && (UNIVERSE_LENGTH_CONTRACTION > 0 || UNIVERSE_TIME_SHIFTING > 0)) {
      if (RINDLER_METRIC_WHEN_ACCELERATING > 0 && accMag > 0.0) {
        place = getWorldPlaceFromShipRindlerShipFrameCoords(vec3(deltX, deltY, 0.0));
      } else {
        place = getWorldPlaceFromShipFrameCoords(vec3(deltX, deltY, 0.0));
      }
    } else if ((LIGHT_TRAVEL_TIME_DELAY > 0) && (UNIVERSE_LENGTH_CONTRACTION > 0 || UNIVERSE_TIME_SHIFTING > 0)) {
      if (RINDLER_METRIC_WHEN_ACCELERATING > 0 && accMag > 0.0) {
        place = getWorldPlaceFromShipRindlerShipFrameCoords(vec3(deltX, deltY, 0.0));
      } else {
        float centerDeltDist = sqrt(deltX * deltX + deltY * deltY);
        
        float timeShift = -centerDeltDist / SPEED_OF_LIGHT;
        
        place = getWorldPlaceFromShipFrameCoords(vec3(deltX, deltY, timeShift));
      }
    }
  }
  
  // calculate color
  outColor = vec4(getColorAtPlace(place.x, place.y, place.z), 1.0);
  
  // draw ship
  
  if (SHIP_ENABLED) {
    if (deltX * deltX + deltY * deltY < SHIP_RADIUS_SQ) {
      outColor.r = outColor.r * 0.5 + 0.5;
      outColor.gb = outColor.gb * 0.5;
    }
  }
}
