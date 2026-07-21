// src/pages/Games/SpaceShip/hooks/useEnemies.ts

import { useCallback } from 'react';
import { GameData, Enemy } from '../types';
import { createEnemy } from '../utils/spawn';
import { rectCollision } from '../utils/collision';
import { useObjectPool } from './useObjectPool';
import { GAME_CONFIG } from '../config';

interface UseEnemiesProps {
  gameDataRef: React.MutableRefObject<GameData | null>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  imagesRef: React.MutableRefObject<Record<string, HTMLImageElement>>;
  onShootEnemyLaser: (enemy: Enemy) => void;
  addExplosion: (x: number, y: number, width: number, height: number, duration?: number) => void;
  applyDamage: (data: GameData) => boolean;
}

export const useEnemies = ({ 
  gameDataRef, 
  canvasRef, 
  imagesRef, 
  onShootEnemyLaser,
  addExplosion,
  applyDamage,
}: UseEnemiesProps) => {
  const { getFromPool, returnToPool } = useObjectPool();

  const spawnEnemy = useCallback(() => {
    const data = gameDataRef.current;
    const canvas = canvasRef.current;
    if (!data || !canvas || !data.gameRunning) return;
    if (data.enemies.length >= GAME_CONFIG.maxEnemies) return;

    let enemy = getFromPool('enemies') as Enemy | null; // ← КАСТ
    
    if (enemy) {
      const size = 50;
      enemy.x = Math.random() * (canvas.width - size);
      enemy.y = -size;
      enemy.width = size;
      enemy.height = size;
      enemy.speed = 2;
      enemy.dx = (Math.random() - 0.5) * 2;
      enemy.dy = 1;
      enemy.lastShootTime = Date.now();
      enemy.active = true;
    } else {
      enemy = createEnemy(canvas.width);
      enemy.active = true;
    }
    
    data.enemies.push(enemy);
  }, [gameDataRef, canvasRef, getFromPool]);

  const updateEnemies = useCallback(() => {
    const data = gameDataRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!data || !canvas || !ctx) return;

    const enemyImg = imagesRef.current.enemyShip;
    const now = Date.now();

    for (let i = data.enemies.length - 1; i >= 0; i--) {
      const enemy = data.enemies[i];
      
      enemy.x += enemy.dx;
      enemy.y += enemy.dy;

      if (enemy.x < 0 || enemy.x + enemy.width > canvas.width) {
        enemy.dx = -enemy.dx;
      }

      if (enemy.y > canvas.height + 100 || enemy.y < -100) {
        returnToPool('enemies', enemy);
        data.enemies.splice(i, 1);
        continue;
      }

      if (enemy.y > -50 && enemy.y < canvas.height + 50) {
        if (enemyImg && enemyImg.complete) {
          ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.width, enemy.height);
        } else {
          ctx.fillStyle = '#ff0000';
          ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        }
      }

      if (now - enemy.lastShootTime > data.enemyShootInterval) {
        onShootEnemyLaser(enemy);
        enemy.lastShootTime = now;
      }

      const player = data.player;
      if (rectCollision(
        enemy.x, enemy.y, enemy.width, enemy.height,
        player.x, player.y, player.width, player.height
      )) {
        addExplosion(
          enemy.x + enemy.width / 2,
          enemy.y + enemy.height / 2,
          enemy.width + 40,
          enemy.height + 40,
          500
        );
        
        returnToPool('enemies', enemy);
        data.enemies.splice(i, 1);
        
        applyDamage(data);
      }
    }
  }, [gameDataRef, canvasRef, imagesRef, onShootEnemyLaser, addExplosion, returnToPool, applyDamage]);

  return {
    spawnEnemy,
    updateEnemies,
  };
};