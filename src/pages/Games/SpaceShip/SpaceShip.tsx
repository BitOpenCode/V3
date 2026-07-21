// src/pages/Games/SpaceShip/SpaceShip.tsx

import React, { useState, useRef, useCallback, memo, useEffect } from 'react';
import './SpaceShip.css';
import { SHIP_CONFIGS, GAME_CONFIG } from './config';
import { GameData, GameScreen } from './types';
import { createParticleSystem } from './utils/particles';
import { loadImages } from './utils/loadImages';
import { InputManager } from './utils/inputManager';
import {
  useGameState,
  useLaser,
  usePlayer,
  useEnemies,
  useBonuses,
  useObstacles,
  useKeyboardControls,
  useGameLoop,
  useExplosions,
  useCleanup,
  useGameEnd,
  useGameStart,
  useDamage,
  useShop,
  useAuth,
  useTouchControls,
  useResize,
  useGameInit,
} from './hooks';
import LoginScreen from './components/LoginScreen';
import GameMenu from './components/GameMenu';
import GameOver from './components/GameOver';
import GameShop from './components/GameShop';
import GameInventory from './components/GameInventory';

type GameLoopRef = {
  startLoop: () => void;
  stopLoop: () => void;
  endGame: () => void;
  resetFlags?: () => void;
  getFPS?: () => number;
};

type HookRefs = {
  gameLoop: GameLoopRef | null;
  laser: ReturnType<typeof useLaser> | null;
  player: ReturnType<typeof usePlayer> | null;
  enemies: ReturnType<typeof useEnemies> | null;
  bonuses: ReturnType<typeof useBonuses> | null;
  obstacles: ReturnType<typeof useObstacles> | null;
  explosions: ReturnType<typeof useExplosions> | null;
};

const SpaceShip: React.FC = () => {
  // ============================================================
  // REFS
  // ============================================================
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<Record<string, HTMLImageElement>>({});
  const gameDataRef = useRef<GameData | null>(null);
  const isInitializedRef = useRef(false);
  const isRestartingRef = useRef(false);
  const isImagesLoadedRef = useRef(false);
  const inputManagerRef = useRef(new InputManager());
  
  const hooksRef = useRef<HookRefs>({
    gameLoop: null,
    laser: null,
    player: null,
    enemies: null,
    bonuses: null,
    obstacles: null,
    explosions: null,
  });

  // ============================================================
  // STATE
  // ============================================================
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [userId, setUserId] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [fps, setFps] = useState(0);

  // ============================================================
  // СИСТЕМЫ
  // ============================================================
  const particleSystem = createParticleSystem();

  // ============================================================
  // ЗАГРУЗКА ИЗОБРАЖЕНИЙ - ТОЛЬКО 1 РАЗ
  // ============================================================
  useEffect(() => {
    if (isImagesLoadedRef.current) {
      console.log('🖼️ Images already loaded, skipping...');
      return;
    }

    console.log('🖼️ Loading images...');
    loadImages(imagesRef);
    isImagesLoadedRef.current = true;
    console.log('✅ All images loaded successfully!');
  }, []);

  // ============================================================
  // ХУКИ
  // ============================================================
  const {
    gameState,
    setGameState,
    currentShip,
    setCurrentShip,
    ownedShips,
    setOwnedShips,
    ownedUpgrades,
    setOwnedUpgrades,
    shipUpgrades,
    setShipUpgrades,
    currentSpeedLevel,
    setCurrentSpeedLevel,
    loadGameState,
    saveGameState,
    getShipLives,
  } = useGameState(userId);

  // УРОН
  const { applyDamage } = useDamage();

  // ОЧИСТКА
  const { cleanupGame } = useCleanup({ 
    gameDataRef, 
    hooksRef, 
    particleSystem, 
    canvasRef 
  });

  // ЗАВЕРШЕНИЕ ИГРЫ
  const { handleGameEnd } = useGameEnd({
    screen,
    setScreen,
    gameState,
    setGameState,
    saveGameState,
    cleanupGame,
  });

  // ЗАПУСК ИГРЫ
  const { startGame } = useGameStart({
    isRestartingRef,
    cleanupGame,
    setScreen,
  });

  // АВТОРИЗАЦИЯ
  const { handleLogin } = useAuth({
    userId,
    loadGameState,
    setIsLoggedIn,
  });

  // ТАЧ КОНТРОЛЛЫ
  const { handleTouch, handleTouchEnd } = useTouchControls({ 
    gameDataRef,
    canvasRef,
    inputManager: inputManagerRef.current,
  });

  // РЕСАЙЗ
  useResize({ canvasRef });

  // ============================================================
  // ХУКИ ИГРЫ
  // ============================================================
  const explosionsHook = useExplosions({ gameDataRef, canvasRef, imagesRef });
  
  const obstaclesHook = useObstacles({
    gameDataRef,
    canvasRef,
    imagesRef,
    addExplosion: explosionsHook.addExplosion,
    applyDamage,
  });

  const laserHook = useLaser({
    gameDataRef,
    canvasRef,
    imagesRef,
    addExplosion: explosionsHook.addExplosion,
    removeObstacle: obstaclesHook.removeObstacle,
    applyDamage,
  });

  const playerHook = usePlayer({ 
    gameDataRef, 
    canvasRef, 
    imagesRef, 
    currentShip,
    inputManager: inputManagerRef.current,
  });

  const enemiesHook = useEnemies({
    gameDataRef,
    canvasRef,
    imagesRef,
    onShootEnemyLaser: laserHook.shootEnemyLaser,
    addExplosion: explosionsHook.addExplosion,
    applyDamage,
  });

  const bonusesHook = useBonuses({
    gameDataRef,
    canvasRef,
    imagesRef,
    onLaserBonusPickup: laserHook.startLaserShots,
    particleSystem,
  });

  const gameLoopHook = useGameLoop({
    gameDataRef,
    canvasRef,
    currentShip,
    ownedUpgrades,
    currentSpeedLevel,
    setCurrentSpeedLevel,
    onGameEnd: handleGameEnd,
    updateLasers: laserHook.updateLasers,
    updateEnemies: enemiesHook.updateEnemies,
    updateBonuses: bonusesHook.updateBonuses,
    updateObstacles: obstaclesHook.updateObstacles,
    updateExplosions: explosionsHook.updateExplosions,
    drawPlayer: playerHook.drawPlayer,
    movePlayer: playerHook.movePlayer,
    spawnEnemy: enemiesHook.spawnEnemy,
    spawnHealbox: bonusesHook.spawnHealbox,
    spawnObstacle: obstaclesHook.spawnObstacle,
    spawnBonus: bonusesHook.spawnBonus,
    particleSystem,
  });

  // ============================================================
  // ОБНОВЛЯЕМ REF
  // ============================================================
  const updateHooksRef = useCallback(() => {
    hooksRef.current = {
      gameLoop: gameLoopHook,
      laser: laserHook,
      player: playerHook,
      enemies: enemiesHook,
      bonuses: bonusesHook,
      obstacles: obstaclesHook,
      explosions: explosionsHook,
    };
  }, [gameLoopHook, laserHook, playerHook, enemiesHook, bonusesHook, obstaclesHook, explosionsHook]);

  updateHooksRef();

  // ============================================================
  // КЛАВИАТУРА
  // ============================================================
  useKeyboardControls({
    gameDataRef,
    currentShip,
    ownedUpgrades,
    currentSpeedLevel,
    setCurrentSpeedLevel,
    shootLaser: laserHook.shootLaser,
    inputManager: inputManagerRef.current,
  });

  // ============================================================
  // ИНИЦИАЛИЗАЦИЯ ИГРЫ
  // ============================================================
  useGameInit({
    screen,
    canvasRef,
    gameDataRef,
    hooksRef,
    currentShip,
    shipUpgrades,
    gameState,
    getShipLives,
    cleanupGame,
    isInitializedRef,
  });

  // ============================================================
  // МАГАЗИН
  // ============================================================
  const { buyShip, buyUpgrade, selectShip, handleUpgradeChange } = useShop({
    gameState,
    setGameState,
    currentShip,
    setCurrentShip,
    ownedShips,
    setOwnedShips,
    ownedUpgrades,
    setOwnedUpgrades,
    shipUpgrades,
    setShipUpgrades,
    saveGameState,
  });

  // ============================================================
  // FPS
  // ============================================================
  useEffect(() => {
    if (screen !== 'playing') return;
    
    const interval = setInterval(() => {
      const fpsValue = hooksRef.current.gameLoop?.getFPS?.() || 0;
      setFps(fpsValue);
    }, 500);
    
    return () => clearInterval(interval);
  }, [screen]);

  // ============================================================
  // SPEED КНОПКИ
  // ============================================================
  const speedLevels = GAME_CONFIG.speedLevels as Record<number, number>;

  // ============================================================
  // РЕНДЕР
  // ============================================================
  return (
    <div className={`spaceship-game ${screen === 'playing' || screen === 'gameover' ? 'playing' : ''}`}>
      {screen === 'playing' && (
        <>
          <canvas
            ref={canvasRef}
            className="game-canvas"
            onTouchStart={handleTouch}
            onTouchMove={handleTouch}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: 'none' }}
          />
          <div className="game-hud">
            <div className="hud-item" id="score-hud">Score: 0</div>
            <div className="hud-item" id="lives-hud">Lives: 3</div>
            <div className="hud-item" id="distance-hud">Distance: 0</div>
            <div className="hud-item" id="enemies-hud">Enemies: 0</div>
            <div className="hud-item" id="speed-hud">Speed: 1</div>
            <div className="hud-item" id="shield-hud">🛡️ OFF</div>
            <div className="hud-item" id="fps-hud">FPS: {fps}</div>
          </div>

          <div className="speed-buttons">
            {[1, 2, 3].map((speedNum) => {
              const shipLevel = SHIP_CONFIGS[currentShip as keyof typeof SHIP_CONFIGS]?.level || 1;
              const isAvailable = speedNum <= shipLevel;
              const isUnlocked = speedNum === 1 || ownedUpgrades.includes(`speed${speedNum}`);
              const isActive = currentSpeedLevel === speedNum;
              const canUse = isAvailable && isUnlocked;

              return (
                <button
                  key={speedNum}
                  className={`speed-btn ${isActive ? 'active' : ''} ${!canUse ? 'locked' : ''}`}
                  onClick={() => {
                    if (canUse && gameDataRef.current) {
                      const data = gameDataRef.current;
                      data.speedLevel = speedNum;
                      setCurrentSpeedLevel(speedNum);
                      data.speed = speedLevels[speedNum] || 2;
                    }
                  }}
                  disabled={!canUse}
                  title={!isAvailable ? `Requires level ${speedNum} ship` : !isUnlocked ? `Buy Speed ${speedNum} in Shop` : `Speed ${speedNum}`}
                >
                  {!canUse ? '🔒' : speedNum}
                </button>
              );
            })}
          </div>

          <button
            className="shoot-btn"
            onTouchStart={(e) => {
              e.preventDefault();
              const data = gameDataRef.current;
              if (data && data.gameRunning) {
                laserHook.shootLaser();
              }
            }}
            onClick={(e) => {
              e.preventDefault();
              laserHook.shootLaser();
            }}
          >
            🔥
          </button>
        </>
      )}

      {screen === 'menu' && !isLoggedIn && (
        <LoginScreen
          userId={userId}
          onUserIdChange={setUserId}
          onLogin={handleLogin}
        />
      )}

      {screen === 'menu' && isLoggedIn && (
        <GameMenu
          userId={userId}
          gameState={gameState}
          onStart={startGame}
          onShop={() => setScreen('shop')}
          onInventory={() => setScreen('inventory')}
        />
      )}

      {screen === 'gameover' && (
        <GameOver
          gameState={gameState}
          onRestart={startGame}
          onMenu={() => {
            cleanupGame();
            setScreen('menu');
          }}
        />
      )}

      {screen === 'shop' && (
        <GameShop
          shopCurrency={gameState.shopCurrency}
          ownedShips={ownedShips}
          ownedUpgrades={ownedUpgrades}
          onBuy={buyShip}
          onBuyUpgrade={buyUpgrade}
          onBack={() => setScreen('menu')}
        />
      )}

      {screen === 'inventory' && (
        <GameInventory
          currentShip={currentShip}
          ownedShips={ownedShips}
          ownedUpgrades={ownedUpgrades}
          shipUpgrades={shipUpgrades}
          onSelect={selectShip}
          onUpgradeChange={handleUpgradeChange}
          onBack={() => setScreen('menu')}
        />
      )}
    </div>
  );
};

export default memo(SpaceShip);