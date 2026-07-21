// src/pages/Games/SpaceShip/utils/spawn.ts

import { Enemy, Obstacle, Bonus, Healbox, Star, Laser, Explosion } from '../types';

export const createStar = (width: number, height: number): Star => ({
  x: Math.random() * width,
  y: Math.random() * height,
  size: Math.random() * 2,
  speed: Math.random() * 2 + 1,
});

export const createObstacle = (width: number, speed: number): Obstacle => {
  const size = Math.random() * 50 + 20;
  return {
    x: Math.random() * (width - size),
    y: -size,
    width: size,
    height: size,
    speed: Math.abs(speed),
    rotation: Math.random() * Math.PI * 2,
    active: true, // ← ДОБАВИЛ
  };
};

export const createBonus = (width: number, type: 'regular' | 'laser' = 'regular'): Bonus => {
  const size = type === 'laser' ? 30 : 20;
  return {
    x: Math.random() * (width - size),
    y: -size,
    width: size,
    height: size,
    speed: 3,
    type,
    active: true, // ← ДОБАВИЛ
  };
};

export const createEnemy = (width: number): Enemy => {
  const size = 50;
  return {
    x: Math.random() * (width - size),
    y: -size,
    width: size,
    height: size,
    speed: 2,
    dx: (Math.random() - 0.5) * 2,
    dy: 1,
    lastShootTime: Date.now(),
    active: true, // ← ДОБАВИЛ
    hp: 1, // ← ДОБАВИЛ
  };
};

export const createHealbox = (width: number, speed: number): Healbox => {
  const size = 30;
  return {
    x: Math.random() * (width - size),
    y: -size,
    width: size,
    height: size,
    speed: Math.abs(speed),
    active: true, // ← ДОБАВИЛ
  };
};

export const createExplosion = (
  x: number, y: number, width: number, height: number
): Explosion => ({
  x,
  y,
  width,
  height,
  alpha: 1,
  startTime: Date.now(),
  duration: 500, // ← ДОБАВИЛ
});

export const createLaser = (
  x: number, 
  y: number, 
  isEnemy: boolean = false
): Laser => ({
  x,
  y,
  width: 10,
  height: 20,
  speed: isEnemy ? 3 : 8, 
  isEnemy,
  active: true, 
});