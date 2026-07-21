// src/pages/Games/SpaceShip/hooks/useDamage.ts

import { useCallback } from 'react';
import { GameData } from '../types';

export const useDamage = () => {
  
  const applyDamage = useCallback((data: GameData) => {
    if (data.hasShield) {
      data.hasShield = false;
      return true;
    }
    
    data.lives--;
    if (data.lives <= 0) {
      data.lives = 0;
      data.gameRunning = false;
    }
    return false;
  }, []);

  return { applyDamage };
};