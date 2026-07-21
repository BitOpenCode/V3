// src/pages/Games/SpaceShip/hooks/useSpawner.ts

import { useCallback, useRef } from 'react'; // ← ДОБАВИТЬ useRef
import { GameData } from '../types';

interface SpawnConfig {
  maxEnemies: number;
  maxObstacles: number;
  maxBonuses: number;
  maxHealboxes: number;
  spawnInterval: number;
}

export const useSpawner = (config: SpawnConfig) => {
  const spawnCounterRef = useRef<number>(0);

  const trySpawn = useCallback((data: GameData, type: string) => {
    if (!data || !data.gameRunning) return false;

    spawnCounterRef.current++;

    switch (type) {
      case 'enemy':
        if (data.enemies.length < config.maxEnemies && spawnCounterRef.current % 60 === 0) {
          return true;
        }
        break;
      case 'obstacle':
        if (data.obstacles.length < config.maxObstacles && Math.random() < 0.02) {
          return true;
        }
        break;
      case 'bonus':
        if (data.bonuses.length < config.maxBonuses && Math.random() < 0.01) {
          return true;
        }
        break;
    }
    return false;
  }, [config]);

  return { trySpawn };
};