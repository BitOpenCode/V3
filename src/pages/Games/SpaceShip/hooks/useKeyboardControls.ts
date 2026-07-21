// src/pages/Games/SpaceShip/hooks/useKeyboardControls.ts

import { useEffect, useCallback } from 'react';
import { GameData } from '../types';
import { SHIP_CONFIGS, GAME_CONFIG } from '../config';
import { InputManager } from '../utils/inputManager';

interface UseKeyboardControlsProps {
  gameDataRef: React.MutableRefObject<GameData | null>;
  currentShip: string;
  ownedUpgrades: string[];
  currentSpeedLevel: number;
  setCurrentSpeedLevel: (level: number) => void;
  shootLaser: () => void;
  inputManager: InputManager;
}

export const useKeyboardControls = ({
  gameDataRef,
  currentShip,
  ownedUpgrades,
  currentSpeedLevel,
  setCurrentSpeedLevel,
  shootLaser,
  inputManager,
}: UseKeyboardControlsProps) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const data = gameDataRef.current;
    if (!data) return;

    
    if (e.key === ' ') {
      e.preventDefault();
      if (data.gameRunning) {
        shootLaser();
      }
    }

    
    if (e.key >= '1' && e.key <= '3') {
      const level = parseInt(e.key);
      const shipLevel = SHIP_CONFIGS[currentShip as keyof typeof SHIP_CONFIGS]?.level || 1;
      const isUnlocked = level === 1 || ownedUpgrades.includes(`speed${level}`);
      if (level <= shipLevel && isUnlocked) {
        setCurrentSpeedLevel(level);
        data.speedLevel = level;
        data.speed = GAME_CONFIG.speedLevels[level as keyof typeof GAME_CONFIG.speedLevels] || 2;
      }
    }

    
    if (e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      console.log(`⏸️ Speed level: ${currentSpeedLevel}`);
      
    }

    const keys = inputManager.getKeys();
    if (keys['Shift'] && e.key === ' ') {
      console.log('🚀 Fast shot!');
      
    }

  }, [gameDataRef, currentShip, ownedUpgrades, currentSpeedLevel, setCurrentSpeedLevel, shootLaser, inputManager]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {};
};