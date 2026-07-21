// src/pages/Games/SpaceShip/hooks/useCleanup.ts

import { useCallback } from 'react';
import { GameData } from '../types';
import { ParticleSystem } from '../utils/particles';
import {
  useLaser,
  usePlayer,
  useEnemies,
  useBonuses,
  useObstacles,
  useExplosions,
} from './index';

type GameLoopRef = {
  startLoop: () => void;
  stopLoop: () => void;
  endGame: () => void;
  resetFlags?: () => void;
  getFPS?: () => number;
};

type HooksRef = {
  gameLoop: GameLoopRef | null;
  laser: ReturnType<typeof useLaser> | null;
  player: ReturnType<typeof usePlayer> | null;
  enemies: ReturnType<typeof useEnemies> | null;
  bonuses: ReturnType<typeof useBonuses> | null;
  obstacles: ReturnType<typeof useObstacles> | null;
  explosions: ReturnType<typeof useExplosions> | null;
};

interface UseCleanupProps {
  gameDataRef: React.MutableRefObject<GameData | null>;
  hooksRef: React.MutableRefObject<HooksRef>;
  particleSystem: ParticleSystem;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export const useCleanup = ({ gameDataRef, hooksRef, particleSystem, canvasRef }: UseCleanupProps) => {
  
  const cleanupGame = useCallback(() => {
    console.log('🧹 Cleaning up game...');
    
    if (hooksRef.current.gameLoop) {
      hooksRef.current.gameLoop.stopLoop();
      if (hooksRef.current.gameLoop.resetFlags) {
        hooksRef.current.gameLoop.resetFlags();
      }
    }
    
    if (hooksRef.current.laser?.clearLaserInterval) {
      hooksRef.current.laser.clearLaserInterval();
    }
    
    if (gameDataRef.current) {
      gameDataRef.current.gameRunning = false;
      gameDataRef.current.playerExplosion = null;
      gameDataRef.current.enemies = [];
      gameDataRef.current.obstacles = [];
      gameDataRef.current.bonuses = [];
      gameDataRef.current.healboxes = [];
      gameDataRef.current.lasers = [];
      gameDataRef.current.explosions = [];
    }
    
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    particleSystem.particles = [];
    gameDataRef.current = null;
    
    console.log('✅ Cleanup complete');
  }, [gameDataRef, hooksRef, particleSystem, canvasRef]);

  return { cleanupGame };
};