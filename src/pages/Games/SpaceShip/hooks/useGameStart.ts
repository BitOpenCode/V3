// src/pages/Games/SpaceShip/hooks/useGameStart.ts

import { useCallback } from 'react';
import { GameScreen } from '../types';

interface UseGameStartProps {
  isRestartingRef: React.MutableRefObject<boolean>;
  cleanupGame: () => void;
  setScreen: (screen: GameScreen) => void;
}

export const useGameStart = ({ isRestartingRef, cleanupGame, setScreen }: UseGameStartProps) => {
  
  const startGame = useCallback(() => {
    if (isRestartingRef.current) return;
    isRestartingRef.current = true;
    
    cleanupGame();
    setScreen('playing');
    
    setTimeout(() => {
      isRestartingRef.current = false;
    }, 100);
  }, [cleanupGame, setScreen, isRestartingRef]);

  return { startGame };
};