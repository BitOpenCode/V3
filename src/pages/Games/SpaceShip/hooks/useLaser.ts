// src/pages/Games/SpaceShip/hooks/useLaser.ts

import { useCallback, useRef, useEffect } from 'react';
import { GameData, Laser, Enemy, Obstacle } from '../types';
import { createLaser } from '../utils/spawn';
import { rectCollision, circleRectCollision } from '../utils/collision';
import { useObjectPool } from './useObjectPool';
import { GAME_CONFIG } from '../config';

interface UseLaserProps {
  gameDataRef: React.MutableRefObject<GameData | null>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  imagesRef: React.MutableRefObject<Record<string, HTMLImageElement>>;
  addExplosion: (x: number, y: number, width: number, height: number, duration?: number) => void;
  removeObstacle: (obstacle: Obstacle) => void;
  applyDamage: (data: GameData) => boolean;
}

export const useLaser = ({ 
  gameDataRef, 
  canvasRef, 
  imagesRef, 
  addExplosion,
  removeObstacle,
  applyDamage,
}: UseLaserProps) => {
  const shootInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const isLaserActive = useRef(false);
  const laserShotCount = useRef(0);
  const { getFromPool, returnToPool } = useObjectPool();

  const shootLaser = useCallback(() => {
    const data = gameDataRef.current;
    const canvas = canvasRef.current;
    if (!data || !canvas || !data.gameRunning) return;
    if (data.lives <= 0) return;
    if (data.lasers.length >= GAME_CONFIG.maxLasers) return;

    const player = data.player;
    
    const laser = getFromPool<Laser>('lasers');
    
    if (laser) {
      laser.x = player.x + player.width / 2 - 5;
      laser.y = player.y - 10;
      laser.width = 10;
      laser.height = 20;
      laser.speed = 8;
      laser.isEnemy = false;
      laser.active = true;
      data.lasers.push(laser);
    } else {
      const newLaser = createLaser(
        player.x + player.width / 2 - 5,
        player.y - 10,
        false
      );
      newLaser.active = true;
      data.lasers.push(newLaser);
    }

    if (isLaserActive.current) {
      laserShotCount.current++;
      if (laserShotCount.current >= 100) {
        isLaserActive.current = false;
        laserShotCount.current = 0;
        if (shootInterval.current) {
          clearInterval(shootInterval.current);
          shootInterval.current = null;
        }
      }
    }
  }, [gameDataRef, canvasRef, getFromPool]);

  const startLaserShots = useCallback(() => {
    if (isLaserActive.current) return;
    
    isLaserActive.current = true;
    laserShotCount.current = 0;
    
    if (shootInterval.current) {
      clearInterval(shootInterval.current);
      shootInterval.current = null;
    }
    
    shootInterval.current = setInterval(() => {
      shootLaser();
    }, 50);
  }, [shootLaser]);

  const clearLaserInterval = useCallback(() => {
    if (shootInterval.current) {
      clearInterval(shootInterval.current);
      shootInterval.current = null;
    }
    isLaserActive.current = false;
    laserShotCount.current = 0;
  }, []);

  const shootEnemyLaser = useCallback((enemy: Enemy) => {
    const data = gameDataRef.current;
    const canvas = canvasRef.current;
    if (!data || !canvas || !data.gameRunning) return;
    if (data.lasers.length >= GAME_CONFIG.maxLasers) return;

    const laser = getFromPool<Laser>('lasers');
    
    if (laser) {
      laser.x = enemy.x + enemy.width / 2 - 5;
      laser.y = enemy.y + enemy.height;
      laser.width = 10;
      laser.height = 20;
      laser.speed = 3;
      laser.isEnemy = true;
      laser.active = true;
      data.lasers.push(laser);
    } else {
      const newLaser = createLaser(
        enemy.x + enemy.width / 2 - 5,
        enemy.y + enemy.height,
        true
      );
      newLaser.active = true;
      data.lasers.push(newLaser);
    }
  }, [gameDataRef, canvasRef, getFromPool]);

  const updateLasers = useCallback(() => {
    const data = gameDataRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!data || !canvas || !ctx) return;

    const laserImg = imagesRef.current.laser;

    const CELL_SIZE = 150;
    const getCellKey = (x: number, y: number) => {
      const cx = Math.floor(x / CELL_SIZE);
      const cy = Math.floor(y / CELL_SIZE);
      return `${cx},${cy}`;
    };

    const enemyCells = new Map<string, Enemy[]>();
    for (const enemy of data.enemies) {
      const key = getCellKey(enemy.x, enemy.y);
      if (!enemyCells.has(key)) enemyCells.set(key, []);
      enemyCells.get(key)!.push(enemy);
    }

    for (let i = data.lasers.length - 1; i >= 0; i--) {
      const laser = data.lasers[i];
      
      if (!laser.isEnemy) {
        laser.y -= laser.speed;
      } else {
        laser.y += laser.speed;
      }

      if (laser.y < -20 || laser.y > canvas.height + 20) {
        returnToPool<Laser>('lasers', laser);
        data.lasers.splice(i, 1);
        continue;
      }

      if (laser.y > -20 && laser.y < canvas.height + 20) {
        if (laserImg && laserImg.complete) {
          ctx.drawImage(laserImg, laser.x, laser.y, laser.width, laser.height);
        } else {
          ctx.fillStyle = laser.isEnemy ? '#ff0000' : '#00ff00';
          ctx.fillRect(laser.x, laser.y, laser.width, laser.height);
        }
      }

      // ЛАЗЕР ИГРОКА
      if (!laser.isEnemy) {
        let hit = false;
        
        const laserKey = getCellKey(laser.x, laser.y);
        const nearbyEnemies = enemyCells.get(laserKey) || [];
        
        for (const enemy of nearbyEnemies) {
          if (rectCollision(
            laser.x, laser.y, laser.width, laser.height,
            enemy.x, enemy.y, enemy.width, enemy.height
          )) {
            enemy.hp = (enemy.hp || 1) - 1;
            returnToPool<Laser>('lasers', laser);
            data.lasers.splice(i, 1);
            hit = true;
            
            if (enemy.hp <= 0) {
              addExplosion(
                enemy.x + enemy.width / 2,
                enemy.y + enemy.height / 2,
                enemy.width + 40,
                enemy.height + 40,
                600
              );
              returnToPool<Enemy>('enemies', enemy);
              const enemyIndex = data.enemies.indexOf(enemy);
              if (enemyIndex !== -1) {
                data.enemies.splice(enemyIndex, 1);
              }
              data.score += enemy.isBoss ? 20 : 10;
              data.enemiesDestroyed++;
            }
            break;
          }
        }
        if (hit) continue;
        
        for (let j = data.obstacles.length - 1; j >= 0; j--) {
          const obstacle = data.obstacles[j];
          const radius = Math.min(obstacle.width, obstacle.height) / 2 * 0.8;
          const cx = obstacle.x + obstacle.width / 2;
          const cy = obstacle.y + obstacle.height / 2;
          
          if (circleRectCollision(cx, cy, radius, laser.x, laser.y, laser.width, laser.height)) {
            addExplosion(
              obstacle.x + obstacle.width / 2,
              obstacle.y + obstacle.height / 2,
              obstacle.width + 20,
              obstacle.height + 20,
              500
            );
            removeObstacle(obstacle);
            returnToPool<Laser>('lasers', laser);
            data.lasers.splice(i, 1);
            data.score += 5;
            break;
          }
        }
        
      } else {
        // ЛАЗЕР ВРАГА - ПО ИГРОКУ
        const player = data.player;
        if (rectCollision(
          laser.x, laser.y, laser.width, laser.height,
          player.x, player.y, player.width, player.height
        )) {
          applyDamage(data);
          returnToPool<Laser>('lasers', laser);
          data.lasers.splice(i, 1);
        }
      }
    }
  }, [gameDataRef, canvasRef, imagesRef, addExplosion, getFromPool, returnToPool, removeObstacle, applyDamage]);

  useEffect(() => {
    return () => {
      clearLaserInterval();
    };
  }, [clearLaserInterval]);

  return {
    shootLaser,
    startLaserShots,
    shootEnemyLaser,
    updateLasers,
    clearLaserInterval,
  };
};