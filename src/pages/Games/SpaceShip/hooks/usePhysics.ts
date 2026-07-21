// src/pages/Games/SpaceShip/hooks/usePhysics.ts

import { useCallback } from 'react';
import { GameData } from '../types';
import { rectCollisionObjects } from '../utils/collision';

export const usePhysics = () => {
  const updatePhysics = useCallback((data: GameData, deltaTime: number) => {
    const fixedDelta = 1 / 60;
    const steps = Math.floor(deltaTime / fixedDelta);
    
    for (let i = 0; i < Math.min(steps, 3); i++) {
      data.player.x += data.player.dx * fixedDelta * 60;
      data.player.y += data.player.dy * fixedDelta * 60;
      
      data.enemies.forEach(enemy => {
        enemy.x += enemy.dx * fixedDelta * 60;
        enemy.y += enemy.dy * fixedDelta * 60;
      });
      
      data.obstacles.forEach(obs => {
        obs.y += data.speed * fixedDelta * 60;
      });
      
      data.lasers.forEach(laser => {
        laser.y += laser.speed * fixedDelta * 60 * (laser.isEnemy ? 1 : -1);
      });
      
      checkCollisions(data);
    }
  }, []);

  const checkCollisions = useCallback((data: GameData) => {
    const player = data.player;
    const checkDistance = 200;
    
    // Враги
    for (let i = data.enemies.length - 1; i >= 0; i--) {
      const enemy = data.enemies[i];
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      if (Math.abs(dx) < checkDistance && Math.abs(dy) < checkDistance) {
        // ✅ Используем rectCollisionObjects с объектами
        if (rectCollisionObjects(enemy, player)) {
          console.log('💥 Player hit enemy!');
          // Здесь обработка коллизии
        }
      }
    }
  }, []);

  return { updatePhysics };
};