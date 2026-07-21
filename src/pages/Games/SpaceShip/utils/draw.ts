// src/pages/Games/SpaceShip/utils/draw.ts

import { Star } from '../types';

export const createStars = (width: number, height: number, count: number = 50): Star[] => {
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 2 + 0.5,
    speed: Math.random() * 1.5 + 0.5,
  }));
};

export const drawStars = (
  ctx: CanvasRenderingContext2D,
  stars: Star[],
  speed: number,
  width: number,
  height: number
) => {
  const speedMultiplier = speed / 2;
  
  stars.forEach(star => {
    // СВЕЧЕНИЕ ЗВЁЗД
    ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
    ctx.shadowBlur = 3;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();

    star.y += star.speed * speedMultiplier;
    if (star.y > height) {
      star.y = 0;
      star.x = Math.random() * width;
    }
  });
  ctx.shadowBlur = 0;
};

export const drawHUD = (
  score: number,
  lives: number,
  distance: number,
  enemiesDestroyed: number,
  speedLevel: number
) => {
  const distanceEl = document.getElementById('distance-hud');
  const scoreEl = document.getElementById('score-hud');
  const livesEl = document.getElementById('lives-hud');
  const enemiesEl = document.getElementById('enemies-hud');
  const speedEl = document.getElementById('speed-hud');

  if (distanceEl) distanceEl.textContent = `Distance: ${Math.floor(distance)}`;
  if (scoreEl) scoreEl.textContent = `Score: ${score}`;
  if (livesEl) livesEl.textContent = `Lives: ${lives}`;
  if (enemiesEl) enemiesEl.textContent = `Enemies: ${enemiesDestroyed}`;
  if (speedEl) speedEl.textContent = `Speed: ${speedLevel}`;
};

export const clearCanvas = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  ctx.clearRect(0, 0, width, height);
};