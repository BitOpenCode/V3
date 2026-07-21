// src/pages/Games/SpaceShip/hooks/useGameEnd.ts

import { useCallback } from 'react';
import { GameScreen, GameState } from '../types';

interface UseGameEndProps {
  screen: GameScreen;
  setScreen: (screen: GameScreen) => void;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  saveGameState: (state: Partial<GameState>) => void;
  cleanupGame: () => void;
}

export const useGameEnd = ({ 
  screen, 
  setScreen, 
  gameState, 
  setGameState, 
  saveGameState, 
  cleanupGame 
}: UseGameEndProps) => {
  
  const handleGameEnd = useCallback((
    finalScore: number,
    finalDistance: number,
    finalEnemiesDestroyed: number,
    finalShopCurrency: number
  ) => {
    if (screen === 'gameover') {
      console.log('⚠️ Game already over, skipping');
      return;
    }

    console.log('📊 Game ended:', { finalScore, finalDistance, finalEnemiesDestroyed, finalShopCurrency });

    const newHighScore = Math.max(gameState.highScore, finalScore);
    
    setGameState(prev => ({
      ...prev,
      score: finalScore,
      distance: finalDistance,
      enemiesDestroyed: finalEnemiesDestroyed,
      shopCurrency: finalShopCurrency,
      highScore: newHighScore,
    }));

    saveGameState({
      shopCurrency: finalShopCurrency,
      highScore: newHighScore,
    });

    cleanupGame();
    setScreen('gameover');
  }, [screen, gameState.highScore, setGameState, saveGameState, cleanupGame, setScreen]);

  return { handleGameEnd };
};