function nonRelativistic_accelerationCalculation(accelX, accelY) {
  return [accelX, accelY];
}

function nonRelativistic_velocityAddition(velX_1, velY_1, velX_2, velY_2) {
  return [velX_1 + velX_2, velY_1 + velY_2];
}

function relativistic_accelerationCalculation(accelX, accelY, lightSpeed) {
  return [accelX, accelY];
  
  /*let accelMag = Math.hypot(accelX, accelY);
  
  if (accelMag == 0) {
    return [0, 0];
  }
  
  let accelScale = 1 / accelMag * Math.tanh(accelMag / lightSpeed) * lightSpeed;
  
  return [accelX * accelScale, accelY * accelScale];*/
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
