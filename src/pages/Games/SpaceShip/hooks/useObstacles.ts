// src/pages/Games/SpaceShip/hooks/useObstacles.ts

import { useCallback, useRef } from 'react';
import { GameData, Obstacle } from '../types';
import { createObstacle } from '../utils/spawn';
import { circleRectCollision } from '../utils/collision';
import { useObjectPool } from './useObjectPool';
import { GAME_CONFIG } from '../config';

interface UseObstaclesProps {
  gameDataRef: React.MutableRefObject<GameData | null>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  imagesRef: React.MutableRefObject<Record<string, HTMLImageElement>>;
  addExplosion: (x: number, y: number, width: number, height: number, duration?: number) => void;
  applyDamage: (data: GameData) => boolean;
}

export const useObstacles = ({ 
  gameDataRef, 
  canvasRef, 
  imagesRef,
  addExplosion,
  applyDamage,
}: UseObstaclesProps) => {
  const meteorImgRef = useRef<HTMLImageElement | null>(null);
  const { getFromPool, returnToPool } = useObjectPool();
  
  const getData = () => gameDataRef.current;

  const removeObstacle = useCallback((obstacle: Obstacle) => {
    const data = getData();
    if (!data) return;
    
    const index = data.obstacles.indexOf(obstacle);
    if (index !== -1) {
      returnToPool<Obstacle>('obstacles', obstacle);
      data.obstacles.splice(index, 1);
    }
  }, [returnToPool]);

  const spawnObstacle = useCallback(() => {
    const data = getData();
    const canvas = canvasRef.current;
    if (!data || !canvas || !data.gameRunning) return;
    if (data.obstacles.length >= GAME_CONFIG.maxObstacles) return;

    const poolObstacle = getFromPool<Obstacle>('obstacles');
    
    if (poolObstacle) {
      const size = Math.random() * 50 + 20;
      poolObstacle.x = Math.random() * (canvas.width - size);
      poolObstacle.y = -size;
      poolObstacle.width = size;
      poolObstacle.height = size;
      poolObstacle.speed = Math.abs(data.speed);
      poolObstacle.rotation = Math.random() * Math.PI * 2;
      poolObstacle.active = true;
      data.obstacles.push(poolObstacle);
    } else {
      const obstacle = createObstacle(canvas.width, data.speed);
      obstacle.active = true;
      data.obstacles.push(obstacle);
    }
  }, [gameDataRef, canvasRef, getFromPool]);

  const updateObstacles = useCallback(() => {
    const data = getData();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!data || !canvas || !ctx) return;

    if (!meteorImgRef.current) {
      meteorImgRef.current = imagesRef.current.meteor;
    }
    const meteorImg = meteorImgRef.current;

    for (let i = data.obstacles.length - 1; i >= 0; i--) {
      const obstacle = data.obstacles[i];
      
      obstacle.y += obstacle.speed;

      if (obstacle.y > canvas.height + 20) {
        removeObstacle(obstacle);
        continue;
      }

      if (obstacle.y > -20 && obstacle.y < canvas.height + 20) {
        ctx.save();
        ctx.translate(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
        obstacle.rotation += 0.02;
        ctx.rotate(obstacle.rotation);

        if (meteorImg && meteorImg.complete) {
          ctx.drawImage(meteorImg, -obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height);
        } else {
          ctx.fillStyle = '#ff0000';
          ctx.fillRect(-obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height);
        }
        ctx.restore();

        const player = data.player;
        
        const radius = Math.min(obstacle.width, obstacle.height) / 2 * 0.8;
        const cx = obstacle.x + obstacle.width / 2;
        const cy = obstacle.y + obstacle.height / 2;
        
        if (circleRectCollision(
          cx, cy, radius,
          player.x, player.y, player.width, player.height
        )) {
          addExplosion(
            obstacle.x + obstacle.width / 2,
            obstacle.y + obstacle.height / 2,
            obstacle.width + 40,
            obstacle.height + 40,
            500
          );
          
          removeObstacle(obstacle);
          
          applyDamage(data);
        }
      }
    }
  }, [gameDataRef, canvasRef, imagesRef, addExplosion, removeObstacle, applyDamage]);

  return {
    spawnObstacle,
    updateObstacles,
    removeObstacle,
  };
};