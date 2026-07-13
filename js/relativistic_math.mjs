function nonRelativistic_accelerationCalculation(accelX, accelY) {
  return [accelX, accelY];
}

function nonRelativistic_velocityAddition(velX_1, velY_1, velX_2, velY_2) {
  return [velX_1 + velX_2, velY_1 + velY_2];
}

function relativistic_accelerationCalculation(accelX, accelY, lightSpeed) {
  return rapidityToVelocity(accelX, accelY, lightSpeed);
}

function velocityToRapidity(velX, velY, lightSpeed) {
  let velMag = Math.hypot(velX, velY);
  
  if (velMag == 0) {
    return [0, 0];
  }
  
  let velScale = 1 / velMag * Math.atanh(velMag / lightSpeed) * lightSpeed;
  
  return [velX * velScale, velY * velScale];
}

function rapidityToVelocity(rapidX, rapidY, lightSpeed) {
  let rapidMag = Math.hypot(rapidX, rapidY);
  
  if (rapidMag == 0) {
    return [0, 0];
  }
  
  let rapidScale = 1 / rapidMag * Math.tanh(rapidMag / lightSpeed) * lightSpeed;
  
  return [rapidX * rapidScale, rapidY * rapidScale];
}

function relativistic_velocityAddition(velX_1, velY_1, velX_2, velY_2, lightSpeed) {
  //return [velX_1 + velX_2, velY_1 + velY_2];
  
  [ velX_1, velY_1 ] = velocityToRapidity(velX_1, velY_1, lightSpeed);
  [ velX_2, velY_2 ] = velocityToRapidity(velX_2, velY_2, lightSpeed);
  
  let [ resVelX, resVelY ] = [velX_1 + velX_2, velY_1 + velY_2];
  
  return rapidityToVelocity(resVelX, resVelY, lightSpeed);
}

function getLorenzFactor(velX, velY, lightSpeed) {
  let velMag = Math.hypot(velX, velY);
  
  return 1 / Math.sqrt(1 - velMag ** 2 / lightSpeed ** 2);
}

// takes in array of [x, y, t] and outputs same structure as world coordinates with ship lorenz shift calculated, but not the positional shift
// similar to the function with the same name in shader code
function getWorldPlaceFromShipFrameCoords(frameRelPlace) {
  frameRelPlace = [...frameRelPlace];
  
  frameRelPlace = [
    Math.cos(velAng) * frameRelPlace[0] + Math.sin(velAng) * frameRelPlace[1],
    Math.cos(velAng) * frameRelPlace[1] - Math.sin(velAng) * frameRelPlace[0],
    frameRelPlace[2]
  ];
  
  frameRelPlace = [frameRelPlace[0] / SPEED_OF_LIGHT, frameRelPlace[1] / SPEED_OF_LIGHT, frameRelPlace[2]];
  
  let worldPlace = [0, frameRelPlace[1], 0];
  if (UNIVERSE_LENGTH_CONTRACTION > 0) {
    worldPlace[0] = velMagAdj * frameRelPlace[2] * velRelativityScaleFactor + frameRelPlace[0] * velRelativityScaleFactor;
  } else {
    worldPlace[0] = frameRelPlace[0];
  }
  if (UNIVERSE_TIME_SHIFTING > 0) {
    worldPlace[2] = frameRelPlace[2] * velRelativityScaleFactor + velMagAdj * frameRelPlace[0] * velRelativityScaleFactor;
  } else {
    worldPlace[2] = frameRelPlace[2];
  }
  
  worldPlace = [worldPlace[0] * SPEED_OF_LIGHT, worldPlace[1] * SPEED_OF_LIGHT, worldPlace[2]];
  
  worldPlace = [
    Math.cos(velAng) * worldPlace[0] - Math.sin(velAng) * worldPlace[1],
    Math.cos(velAng) * worldPlace[1] + Math.sin(velAng) * worldPlace[0],
    worldPlace[2]
  ];
  
  return worldPlace;
}
