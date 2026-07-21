// src/pages/Games/SpaceShip/hooks/useGameInit.ts

import { useEffect } from 'react';
import { 
  GameData, 
  GameScreen, 
  ShipUpgrades, 
  GameState 
} from '../types';
import { createStars } from '../utils';

// Импортируем типы из хуков
import { useLaser, usePlayer, useEnemies, useBonuses, useObstacles, useExplosions } from './index';

type GameLoopRef = {
  startLoop: () => void;
  stopLoop: () => void;
  endGame: () => void;
  resetFlags?: () => void;
  getFPS?: () => number;
};

// ✅ ТЕПЕРЬ БЕЗ any!
type HooksRef = {
  gameLoop: GameLoopRef | null;
  laser: ReturnType<typeof useLaser> | null;        // ← Правильный тип
  player: ReturnType<typeof usePlayer> | null;      // ← Правильный тип
  enemies: ReturnType<typeof useEnemies> | null;    // ← Правильный тип
  bonuses: ReturnType<typeof useBonuses> | null;    // ← Правильный тип
  obstacles: ReturnType<typeof useObstacles> | null; // ← Правильный тип
  explosions: ReturnType<typeof useExplosions> | null; // ← Правильный тип
};

// Убираем setScreen из интерфейса
interface UseGameInitProps {
  screen: GameScreen;
  // setScreen - УДАЛЯЕМ
  canvasRef: React.RefObject<HTMLCanvasElement>;
  gameDataRef: React.MutableRefObject<GameData | null>;
  hooksRef: React.MutableRefObject<HooksRef>;
  currentShip: string;
  shipUpgrades: ShipUpgrades;
  gameState: GameState;
  getShipLives: (ship: string) => number;
  cleanupGame: () => void;
  isInitializedRef: React.MutableRefObject<boolean>;
}

export const useGameInit = ({
  screen,
  // setScreen - УДАЛЯЕМ ИЗ ПАРАМЕТРОВ
  canvasRef,
  gameDataRef,
  hooksRef,
  currentShip,
  shipUpgrades,
  gameState,
  getShipLives,
  cleanupGame,
  isInitializedRef,
}: UseGameInitProps) => {

  useEffect(() => {
    if (screen !== 'playing') {
      if (isInitializedRef.current) {
        cleanupGame();
        isInitializedRef.current = false;
      }
      return;
    }

    if (isInitializedRef.current) {
      return;
    }
    
    console.log('🎮 Initializing game...');
    isInitializedRef.current = true;

    const canvas = canvasRef.current;
    if (!canvas) {
      isInitializedRef.current = false;
      return;
    }
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const playerWidth = 60;
    const playerHeight = 60;
    const shipLives = getShipLives(currentShip);
    const initialCurrency = gameState.shopCurrency || 0;

    // ✅ ДОБАВЛЯЕМ shieldStartTime
    gameDataRef.current = {
      gameRunning: true,
      isPlayerVisible: true,
      score: 0,
      lives: shipLives,
      distance: 0,
      shopCurrency: initialCurrency,
      speed: 2,
      speedLevel: 1,
      enemiesDestroyed: 0,
      player: {
        x: canvas.width / 2 - playerWidth / 2,
        y: canvas.height - 100,
        width: playerWidth,
        height: playerHeight,
        speed: 10,
        dx: 0,
        dy: 0,
      },
      enemies: [],
      obstacles: [],
      bonuses: [],
      lasers: [],
      explosions: [],
      healboxes: [],
      stars: createStars(canvas.width, canvas.height),
      playerExplosion: null,
      hasShield: false,
      shieldStartTime: null, // ← 🔥 ДОБАВЬ ЭТО!
      lastEnemySpawnDistance: 0,
      lastHealboxSpawnDistance: 0,
      enemyShootInterval: 500,
      laserShotsCount: 0,
      totalLaserShots: 100,
      laserShootInterval: 50,
      touchX: null,
      touchY: null,
    };

    const currentUpgrades = shipUpgrades[currentShip] || [];
    if (currentUpgrades.includes('armor') && gameDataRef.current) {
      gameDataRef.current.hasShield = true;
      gameDataRef.current.shieldStartTime = Date.now(); // ← 🔥 И ЭТО ТОЖЕ
    }

    if (hooksRef.current.gameLoop) {
      if (hooksRef.current.gameLoop.resetFlags) {
        hooksRef.current.gameLoop.resetFlags();
      }
      hooksRef.current.gameLoop.startLoop();
    }

    console.log('✅ Game initialized');

    // ✅ ДОБАВЛЯЕМ ЗАВИСИМОСТИ
  }, [screen, currentShip, shipUpgrades, gameState.shopCurrency]);
};