// src/pages/Games/SpaceShip/hooks/useGameLoop.ts

import { useCallback, useRef, useEffect } from 'react';
import { GameData, Enemy, Obstacle, Bonus, Healbox, Laser } from '../types';
import { SHIP_CONFIGS, GAME_CONFIG } from '../config';
import { createParticleSystem } from '../utils/particles';

interface UseGameLoopProps {
  gameDataRef: React.MutableRefObject<GameData | null>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  currentShip: string;
  ownedUpgrades: string[];
  currentSpeedLevel: number;
  setCurrentSpeedLevel: (level: number) => void;
  onGameEnd: (finalScore: number, finalDistance: number, finalEnemiesDestroyed: number, finalShopCurrency: number) => void;
  updateLasers: () => void;
  updateEnemies: () => void;
  updateBonuses: () => void;
  updateObstacles: () => void;
  updateExplosions: () => void;
  drawPlayer: () => void;
  movePlayer: (delta: number) => void;
  spawnEnemy: () => void;
  spawnHealbox: () => void;
  spawnObstacle: () => void;
  spawnBonus: (type?: 'regular' | 'laser') => void;
  particleSystem: ReturnType<typeof createParticleSystem>;
}

type GamePhase = 'idle' | 'running' | 'dying' | 'dead';

interface HUDCache {
  distance: string;
  score: string;
  lives: string;
  enemies: string;
  speed: string;
  shield: string;
  fps: string;
}

export const useGameLoop = ({
  gameDataRef,
  canvasRef,
  currentShip,
  ownedUpgrades,
  currentSpeedLevel,
  setCurrentSpeedLevel,
  onGameEnd,
  updateLasers,
  updateEnemies,
  updateBonuses,
  updateObstacles,
  updateExplosions,
  drawPlayer,
  movePlayer,
  spawnEnemy,
  spawnHealbox,
  spawnObstacle,
  spawnBonus,
  particleSystem,
}: UseGameLoopProps) => {
  const state = useRef({
    phase: 'idle' as GamePhase,
    animId: 0,
    frameCount: 0,
    fps: 0,
    fpsCounter: 0,
    fpsTime: 0,
    lastFrameTime: 0,
    finalStats: {
      score: 0,
      distance: 0,
      enemies: 0,
      currency: 0,
    },
    deathTimer: 0,
    hud: {
      distance: '',
      score: '',
      lives: '',
      enemies: '',
      speed: '',
      shield: '',
      fps: '',
    } as HUDCache,
  });

  const particleRef = useRef(particleSystem);

  const getData = () => gameDataRef.current;
  const getCanvas = () => canvasRef.current;
  const getCtx = () => canvasRef.current?.getContext('2d');

  const hardStop = useCallback(() => {
    const s = state.current;
    if (s.animId) {
      cancelAnimationFrame(s.animId);
      s.animId = 0;
    }
    s.phase = 'idle';
    
    const data = getData();
    if (data) {
      data.gameRunning = false;
      data.enemies = [];
      data.obstacles = [];
      data.bonuses = [];
      data.healboxes = [];
      data.lasers = [];
      data.explosions = [];
    }
    particleRef.current.particles = [];
  }, []);

  const drawStars = useCallback(() => {
    const data = getData();
    const canvas = getCanvas();
    const ctx = getCtx();
    if (!data || !canvas || !ctx) return;

    const stars = data.stars;
    const speed = data.speed / 2;
    const h = canvas.height;
    const w = canvas.width;

    for (let i = 0; i < stars.length; i++) {
      const star = stars[i];
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
      star.y += star.speed * speed;
      if (star.y > h) {
        star.y = 0;
        star.x = Math.random() * w;
      }
    }
  }, []);

  const updateHUD = useCallback(() => {
    const data = getData();
    if (!data) return;

    const cache = state.current.hud;
    const d = Math.floor(data.distance);
    const sc = data.score;
    const l = data.lives;
    const e = data.enemiesDestroyed;
    const sp = currentSpeedLevel;
    const f = state.current.fps;

    const shieldText = data.hasShield ? '🛡️ ON' : '🛡️ OFF';

    const update = (id: string, value: string) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    const distanceText = `Distance: ${d}`;
    const scoreText = `Score: ${sc}`;
    const livesText = `Lives: ${l}`;
    const enemiesText = `Enemies: ${e}`;
    const speedText = `Speed: ${sp}`;
    const fpsText = `FPS: ${f}`;

    if (cache.distance !== distanceText) {
      update('distance-hud', distanceText);
      cache.distance = distanceText;
    }
    if (cache.score !== scoreText) {
      update('score-hud', scoreText);
      cache.score = scoreText;
    }
    if (cache.lives !== livesText) {
      update('lives-hud', livesText);
      cache.lives = livesText;
    }
    if (cache.enemies !== enemiesText) {
      update('enemies-hud', enemiesText);
      cache.enemies = enemiesText;
    }
    if (cache.speed !== speedText) {
      update('speed-hud', speedText);
      cache.speed = speedText;
    }
    if (cache.shield !== shieldText) {
      update('shield-hud', shieldText);
      cache.shield = shieldText;
    }
    if (cache.fps !== fpsText) {
      update('fps-hud', fpsText);
      cache.fps = fpsText;
    }
  }, [currentSpeedLevel]);

  const checkSpawns = useCallback(() => {
    const data = getData();
    if (!data || !data.gameRunning) return;

    const dist = Math.floor(data.distance);

    if (dist > data.lastEnemySpawnDistance && dist % 100 === 0) {
      spawnEnemy();
      data.lastEnemySpawnDistance = dist;
    }
    if (dist > data.lastHealboxSpawnDistance && dist % 150 === 0) {
      spawnHealbox();
      data.lastHealboxSpawnDistance = dist;
    }
    if (Math.random() < 0.2) spawnObstacle();
    if (Math.random() < 0.03) spawnBonus('regular');
    if (Math.random() < 0.001) spawnBonus('laser');
  }, [spawnEnemy, spawnHealbox, spawnObstacle, spawnBonus]);

  const updateSpeed = useCallback(() => {
    const data = getData();
    if (!data || !data.gameRunning) return;

    const shipConfig = SHIP_CONFIGS[currentShip as keyof typeof SHIP_CONFIGS];
    const shipLevel = shipConfig?.level || 1;
    const unlocked = currentSpeedLevel === 1 || ownedUpgrades.includes(`speed${currentSpeedLevel}`);
    const available = currentSpeedLevel <= shipLevel;

    let target = currentSpeedLevel;
    if (!available || !unlocked) target = 1;

    if (data.speedLevel !== target) {
      data.speedLevel = target;
      setCurrentSpeedLevel(target);
    }
    data.speed = GAME_CONFIG.speedLevels[target as keyof typeof GAME_CONFIG.speedLevels] || 2;
  }, [currentShip, ownedUpgrades, currentSpeedLevel, setCurrentSpeedLevel]);

  const cleanupObjects = useCallback(() => {
    const data = getData();
    const canvas = getCanvas();
    if (!data || !canvas) return;

    const limit = canvas.height + 100;
    const now = Date.now();

    data.enemies = data.enemies.filter((e: Enemy) => e.y > -100 && e.y < limit);
    data.obstacles = data.obstacles.filter((o: Obstacle) => o.y > -100 && o.y < limit);
    data.bonuses = data.bonuses.filter((b: Bonus) => b.y > -100 && b.y < limit);
    data.healboxes = data.healboxes.filter((h: Healbox) => h.y > -100 && h.y < limit);
    data.lasers = data.lasers.filter((l: Laser) => l.y > -100 && l.y < limit);
    
    data.explosions = data.explosions.filter(exp => now - exp.startTime < 1500);

    if (particleRef.current.particles.length > 60) {
      particleRef.current.particles = particleRef.current.particles.slice(-60);
    }
  }, []);

  const endGame = useCallback(() => {
    const s = state.current;
    const data = getData();
    
    if (!data || s.phase === 'dying' || s.phase === 'dead') return;

    console.log('💀 PLAYER DIED! Entering dying phase...');
    s.phase = 'dying';
    data.gameRunning = false;

    data.playerExplosion = {
      x: data.player.x,
      y: data.player.y,
      width: data.player.width,
      height: data.player.height,
      alpha: 1,
      blinkInterval: 100,
      lastBlinkTime: Date.now(),
      duration: 1000,
      startTime: Date.now(),
    };

    s.finalStats = {
      score: data.score,
      distance: Math.floor(data.distance),
      enemies: data.enemiesDestroyed,
      currency: data.shopCurrency + data.score,
    };
    data.shopCurrency = s.finalStats.currency;

    console.log('📊 Final stats:', s.finalStats);

    s.deathTimer = Date.now() + 1500;

  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const gameLoop = useCallback(() => {
    const s = state.current;
    const data = getData();
    const canvas = getCanvas();
    const ctx = getCtx();

    if (!data || !canvas || !ctx) return;

    const now = performance.now();

    s.fpsCounter++;
    if (now - s.fpsTime >= 1000) {
      s.fps = s.fpsCounter;
      s.fpsCounter = 0;
      s.fpsTime = now;
    }

    s.lastFrameTime = now;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawStars();

    if (particleRef.current.particles.length > 0) {
      particleRef.current.draw(ctx);
    }

    if (data.explosions.length > 0) {
      updateExplosions();
    }

    drawPlayer();

    switch (s.phase) {

      case 'running': {
        updateSpeed();
        movePlayer(1);
        
        if (data.enemies.length > 0) updateEnemies();
        if (data.lasers.length > 0) updateLasers();
        if (data.bonuses.length > 0) updateBonuses();
        if (data.obstacles.length > 0) updateObstacles();
        
        if (s.frameCount % 4 === 0) checkSpawns();
        
        data.distance += 0.1;
        
        if (s.frameCount % 10 === 0) updateHUD();

        if (data.isPlayerVisible && s.frameCount % 10 === 0) {
          particleRef.current.addEngineTrail(
            data.player.x + data.player.width / 2,
            data.player.y + data.player.height,
            1
          );
        }

        if (s.frameCount % 10 === 0 && particleRef.current.particles.length > 0) {
          particleRef.current.update(0.016);
        }

        if (s.frameCount % 30 === 0) {
          cleanupObjects();
        }

        if (data.lives <= 0) {
          endGame();
        }
        break;
      }

      case 'dying': {
        if (particleRef.current.particles.length > 0) {
          particleRef.current.update(0.016);
        }

        if (Date.now() >= s.deathTimer) {
          console.log('⏰ Death timer complete. Transitioning to dead.');
          s.phase = 'dead';
          s.animId = 0;
          
          if (s.animId) {
            cancelAnimationFrame(s.animId);
            s.animId = 0;
          }
          
          onGameEnd(
            s.finalStats.score,
            s.finalStats.distance,
            s.finalStats.enemies,
            s.finalStats.currency
          );
          return;
        }
        break;
      }

      case 'dead':
      case 'idle':
      default: {
        break;
      }
    }

    s.frameCount++;

    if (s.phase !== 'dead' && s.phase !== 'idle') {
      s.animId = requestAnimationFrame(gameLoop);
    }

  }, [
    drawStars,
    drawPlayer,
    updateExplosions,
    updateSpeed,
    movePlayer,
    updateEnemies,
    updateLasers,
    updateBonuses,
    updateObstacles,
    checkSpawns,
    updateHUD,
    cleanupObjects,
    endGame,
    onGameEnd,
  ]);

  const startLoop = useCallback(() => {
    const s = state.current;
    const data = getData();
    
    if (!data) {
      console.error('❌ No game data!');
      return;
    }

    if (s.phase === 'running') {
      console.warn('⚠️ Loop already running');
      return;
    }

    hardStop();

    s.phase = 'running';
    s.frameCount = 0;
    s.fps = 0;
    s.fpsCounter = 0;
    s.fpsTime = performance.now();
    s.lastFrameTime = 0;
    s.deathTimer = 0;
    s.finalStats = { score: 0, distance: 0, enemies: 0, currency: 0 };
    s.hud = { distance: '', score: '', lives: '', enemies: '', speed: '', shield: '', fps: '' };

    data.gameRunning = true;

    if (s.animId) {
      cancelAnimationFrame(s.animId);
    }
    s.animId = requestAnimationFrame(gameLoop);

    console.log('🚀 Game loop STARTED (phase: running)');
  }, [hardStop, gameLoop]);

  const stopLoop = useCallback(() => {
    const s = state.current;
    if (s.phase === 'idle' || s.phase === 'dead') return;
    
    console.log('🛑 Stopping game loop...');
    s.phase = 'idle';
    if (s.animId) {
      cancelAnimationFrame(s.animId);
      s.animId = 0;
    }
    const data = getData();
    if (data) data.gameRunning = false;
  }, []);

  const resetFlags = useCallback(() => {
    hardStop();
    state.current.phase = 'idle';
    console.log('🔄 Flags reset complete');
  }, [hardStop]);

  const getFPS = useCallback(() => {
    return state.current.fps;
  }, []);

  useEffect(() => {
    return () => {
      hardStop();
      state.current.phase = 'idle';
    };
  }, [hardStop]);

  useEffect(() => {
    particleRef.current = particleSystem;
  }, [particleSystem]);

  return {
    startLoop,
    stopLoop,
    endGame,
    resetFlags,
    getFPS,
  };
};