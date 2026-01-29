import React, { useEffect, useRef, useState, useCallback } from 'react';
import './SpaceShip.css';
import { GAME_IMAGES, SHIP_CONFIGS, GAME_CONFIG } from './config';
import LoginScreen from './components/LoginScreen';
import GameMenu from './components/GameMenu';
import GameOver from './components/GameOver';
import GameShop from './components/GameShop';
import GameInventory from './components/GameInventory';

interface GameState {
  score: number;
  lives: number;
  distance: number;
  enemiesDestroyed: number;
  highScore: number;
  shopCurrency: number;
}

type GameScreen = 'menu' | 'playing' | 'gameover' | 'shop' | 'inventory';

const SpaceShip: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const imagesRef = useRef<Record<string, HTMLImageElement>>({});
  
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [userId, setUserId] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    lives: 3,
    distance: 0,
    enemiesDestroyed: 0,
    highScore: 0,
    shopCurrency: 0,
  });
  const [currentShip, setCurrentShip] = useState('default');
  const [ownedShips, setOwnedShips] = useState<string[]>(['default']);
  const [ownedUpgrades, setOwnedUpgrades] = useState<string[]>([]);
  const [shipUpgrades, setShipUpgrades] = useState<Record<string, string[]>>({});
  const [currentSpeedLevel, setCurrentSpeedLevel] = useState(1);  // Player-controlled speed level (1-4)

  // Load images - EXACT COPY FROM ORIGINAL (БЕЗ crossOrigin, БЕЗ forEach!)
  // В оригинале каждая картинка создается ОТДЕЛЬНО, не через цикл!
  useEffect(() => {
    // EXACT COPY FROM ORIGINAL - создаем каждую картинку ОТДЕЛЬНО, как в оригинале!
    const shipImg = new Image();
    shipImg.src = GAME_IMAGES.ship;
    imagesRef.current.ship = shipImg;

    const meteorImg = new Image();
    meteorImg.src = GAME_IMAGES.meteor;
    imagesRef.current.meteor = meteorImg;

    const laserImg = new Image();
    laserImg.src = GAME_IMAGES.laser;
    imagesRef.current.laser = laserImg;

    const bonusImg = new Image();
    bonusImg.src = GAME_IMAGES.bonus;
    imagesRef.current.bonus = bonusImg;

    const goldBonusImg = new Image();
    goldBonusImg.src = GAME_IMAGES.goldBonus;
    imagesRef.current.goldBonus = goldBonusImg;

    const enemyShipImg = new Image();
    enemyShipImg.src = GAME_IMAGES.enemyShip;
    imagesRef.current.enemyShip = enemyShipImg;

    const explosionImg = new Image();
    explosionImg.src = GAME_IMAGES.explosion;
    imagesRef.current.explosion = explosionImg;

    const healboxImg = new Image();
    healboxImg.src = GAME_IMAGES.healbox;
    imagesRef.current.healbox = healboxImg;

    const redShipImg = new Image();
    redShipImg.src = GAME_IMAGES.redShip;
    imagesRef.current.redShip = redShipImg;

    const elonShipImg = new Image();
    elonShipImg.src = GAME_IMAGES.elonShip;
    imagesRef.current.elonShip = elonShipImg;
  }, []);

  // Load game state
  const loadGameState = useCallback((id: string) => {
    const saved = localStorage.getItem(`spaceship-${id}`);
    if (saved) {
      const data = JSON.parse(saved);
      setGameState(prev => ({ ...prev, ...data }));
      setCurrentShip(data.currentShip || 'default');
      setOwnedShips(data.ownedShips || ['default']);
      setOwnedUpgrades(data.ownedUpgrades || []);
      setShipUpgrades(data.shipUpgrades || {});
    }
  }, []);

  // Save game state
  const saveGameState = useCallback((state: Partial<GameState>, ship?: string, owned?: string[], upgrades?: string[], shipUpgs?: Record<string, string[]>) => {
    const data = {
      ...gameState,
      ...state,
      currentShip: ship || currentShip,
      ownedShips: owned || ownedShips,
      ownedUpgrades: upgrades !== undefined ? upgrades : ownedUpgrades,
      shipUpgrades: shipUpgs !== undefined ? shipUpgs : shipUpgrades,
    };
    localStorage.setItem(`spaceship-${userId}`, JSON.stringify(data));
    setGameState(prev => ({ ...prev, ...state }));
  }, [gameState, userId, currentShip, ownedShips, ownedUpgrades, shipUpgrades]);

  // Handle login
  const handleLogin = () => {
    if (!userId.trim()) {
      alert('Please enter your login!');
      return;
    }
    loadGameState(userId);
    setIsLoggedIn(true);
  };

  // ============================================
  // ИГРОВАЯ ЛОГИКА - ПОЛНАЯ ПЕРЕПИСЬ ПО ОРИГИНАЛУ
  // ============================================
  
  // Глобальные переменные игры (как в оригинале)
  const gameDataRef = useRef<{
    gameRunning: boolean;
    score: number;
    lives: number;
    distance: number;
    shopCurrency: number;
    speed: number;
    speedLevel: number;
    touchX: number | null;
    touchY: number | null;
    enemies: any[];
    explosions: any[];
    lastEnemySpawnDistance: number;
    enemyShootInterval: number;
    enemiesDestroyed: number;
    healboxes: any[];
    lastHealboxSpawnDistance: number;
    playerExplosion: any;
    isPlayerVisible: boolean;
    player: {
      x: number;
      y: number;
      width: number;
      height: number;
      speed: number;
      dx: number;
      dy: number;
    };
    obstacles: any[];
    bonuses: any[];
    stars: any[];
    lasers: any[];
    laserShotsCount: number;
    totalLaserShots: number;
    laserShootInterval: number;
    hasShield: boolean;
    shieldStartTime: number | null;
  } | null>(null);

  // Функции создания объектов - EXACT COPY FROM ORIGINAL
  const createObstacle = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameDataRef.current) return;
    const data = gameDataRef.current;
    const size = Math.random() * 50 + 20;
    data.obstacles.push({
      x: Math.random() * (canvas.width - size),
      y: -size,
      width: size,
      height: size,
      speed: Math.abs(data.speed), // Ensure speed is always positive (moving down)
      rotation: Math.random() * Math.PI * 2
    });
  }, []);

  const createBonus = useCallback((type: string = "regular") => {
    const canvas = canvasRef.current;
    if (!canvas || !gameDataRef.current) return;
    const data = gameDataRef.current;
    const size = type === "laser" ? 30 : 20;
    data.bonuses.push({
      x: Math.random() * (canvas.width - size),
      y: -size,
      width: size,
      height: size,
      speed: 3,
      type
    });
  }, []);

  const createEnemy = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameDataRef.current) return;
    const data = gameDataRef.current;
    const size = 50;
    data.enemies.push({
      x: Math.random() * (canvas.width - size),
      y: -size,
      width: size,
      height: size,
      speed: 2,
      dx: (Math.random() - 0.5) * 2,
      dy: 1,
      lastShootTime: Date.now()
    });
  }, []);

  const createHealbox = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameDataRef.current) return;
    const data = gameDataRef.current;
    const size = 30;
    data.healboxes.push({
      x: Math.random() * (canvas.width - size),
      y: -size,
      width: size,
      height: size,
      speed: Math.abs(data.speed) // Ensure speed is always positive (moving down)
    });
  }, []);

  const createExplosion = useCallback((x: number, y: number, width: number, height: number) => {
    if (!gameDataRef.current) return;
    const data = gameDataRef.current;
    data.explosions.push({
      x,
      y,
      width,
      height,
      alpha: 1,
      startTime: Date.now()
    });
  }, []);

  // Функции отрисовки - EXACT COPY FROM ORIGINAL
  const drawStars = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !gameDataRef.current) return;
    const data = gameDataRef.current;
    
    data.stars.forEach(star => {
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();

      // Star speed scales with game speed
      const baseStarSpeed = star.speed;
      const speedMultiplier = data.speed / GAME_CONFIG.speedLevels[1];
      star.y += baseStarSpeed * speedMultiplier;
      if (star.y > canvas.height) {
        star.y = 0;
        star.x = Math.random() * canvas.width;
      }
    });
  }, []);

  const drawPlayer = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !gameDataRef.current) return;
    const data = gameDataRef.current;

    if (!data.isPlayerVisible) return;

    if (data.playerExplosion) {
      const currentTime = Date.now();
      const elapsedTime = currentTime - data.playerExplosion.startTime;

      if (elapsedTime > data.playerExplosion.duration) {
        data.playerExplosion = null;
        data.isPlayerVisible = false;
        return;
      }

      if (currentTime - data.playerExplosion.lastBlinkTime > data.playerExplosion.blinkInterval) {
        data.playerExplosion.alpha = data.playerExplosion.alpha === 1 ? 0.3 : 1;
        data.playerExplosion.lastBlinkTime = currentTime;
      }

      ctx.globalAlpha = data.playerExplosion.alpha;
      const expImg = imagesRef.current.explosion;
      if (expImg && expImg.complete) {
        // EXACT COPY FROM ORIGINAL - используем playerExplosion.x, player.y (не playerExplosion.y!)
        ctx.drawImage(expImg, data.playerExplosion.x, data.player.y, data.playerExplosion.width, data.playerExplosion.height);
      } else {
        // Fallback для взрыва
        ctx.fillStyle = `rgba(255, 0, 0, ${data.playerExplosion.alpha})`;
        ctx.fillRect(data.playerExplosion.x, data.player.y, data.playerExplosion.width, data.playerExplosion.height);
      }
      ctx.globalAlpha = 1;
    } else if (data.gameRunning) {
      ctx.save();
      ctx.translate(data.player.x + data.player.width / 2, data.player.y + data.player.height / 2);

      let shipWidth: number;
      let shipHeight: number;
      const shipKey = currentShip === 'default' ? 'ship' : currentShip;
      const shipImg = imagesRef.current[shipKey];

      if (currentShip === 'default') {
        shipWidth = data.player.width;
        shipHeight = data.player.height;
      } else if (currentShip === 'redShip') {
        shipWidth = data.player.width * 0.65;
        shipHeight = data.player.height * 1.8;
      } else if (currentShip === 'elonShip') {
        shipWidth = data.player.width * 0.65;
        shipHeight = data.player.height * 1.6;
      } else {
        shipWidth = data.player.width;
        shipHeight = data.player.height;
      }

      if (shipImg && shipImg.complete) {
        ctx.drawImage(shipImg, -shipWidth / 2, -shipHeight / 2, shipWidth, shipHeight);
      } else {
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(-shipWidth / 2, -shipHeight / 2, shipWidth, shipHeight);
      }
      ctx.restore();

      // Рисуем щит, если он активен
      if (data.hasShield && data.shieldStartTime) {
        const currentTime = Date.now();
        const shieldDuration = GAME_CONFIG.armorShieldDuration;
        if (currentTime - data.shieldStartTime < shieldDuration) {
          // Рисуем полупрозрачный щит вокруг корабля
          ctx.save();
          ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(
            data.player.x + data.player.width / 2,
            data.player.y + data.player.height / 2,
            Math.max(data.player.width, data.player.height) * 0.7,
            0,
            Math.PI * 2
          );
          ctx.stroke();
          ctx.restore();
        } else {
          // Щит истек
          data.hasShield = false;
          data.shieldStartTime = null;
        }
      }
    }
  }, [currentShip]);

  const drawObstacles = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !gameDataRef.current) return;
    const data = gameDataRef.current;

    data.obstacles.forEach((obstacle, index) => {
      // Update obstacle speed to match current game speed
      obstacle.speed = data.speed;
      
      ctx.save();
      ctx.translate(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
      obstacle.rotation += 0.02;
      ctx.rotate(obstacle.rotation);
      
      const meteorImg = imagesRef.current.meteor;
      if (meteorImg && meteorImg.complete) {
        ctx.drawImage(meteorImg, -obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height);
      } else {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(-obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height);
      }
      ctx.restore();

      // Move obstacle DOWN (y increases = moving down screen)
      obstacle.y += obstacle.speed;

      if (obstacle.y > canvas.height) data.obstacles.splice(index, 1);

      if (
        data.player.x < obstacle.x + obstacle.width &&
        data.player.x + data.player.width > obstacle.x &&
        data.player.y < obstacle.y + obstacle.height &&
        data.player.y + data.player.height > obstacle.y
      ) {
        // Проверяем щит от брони
        if (data.hasShield && data.shieldStartTime) {
          const currentTime = Date.now();
          const shieldDuration = GAME_CONFIG.armorShieldDuration;
          if (currentTime - data.shieldStartTime < shieldDuration) {
            // Щит активен - отменяем удар
            data.hasShield = false;
            data.shieldStartTime = null;
            data.obstacles.splice(index, 1);
            return; // Выходим, не отнимая жизнь
          }
        }
        // Нет щита или он истек - отнимаем жизнь
        data.lives--;
        data.obstacles.splice(index, 1);
        if (data.lives <= 0) {
          data.lives = 0;
          endGame();
        }
      }
    });
  }, []);

  const drawBonuses = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !gameDataRef.current) return;
    const data = gameDataRef.current;

    data.bonuses.forEach((bonus, index) => {
      // Update bonus speed to match current game speed
      bonus.speed = Math.abs(data.speed);
      
      const bonusImg = bonus.type === "laser" ? imagesRef.current.goldBonus : imagesRef.current.bonus;
      if (bonusImg && bonusImg.complete) {
        ctx.drawImage(bonusImg, bonus.x, bonus.y, bonus.width, bonus.height);
      } else {
        ctx.fillStyle = bonus.type === "laser" ? '#ffd700' : '#00ff00';
        ctx.fillRect(bonus.x, bonus.y, bonus.width, bonus.height);
      }

      // Move bonus DOWN (y increases = moving down screen)
      bonus.y += bonus.speed;

      if (bonus.y > canvas.height) data.bonuses.splice(index, 1);

      if (
        data.player.x < bonus.x + bonus.width &&
        data.player.x + data.player.width > bonus.x &&
        data.player.y < bonus.y + bonus.height &&
        data.player.y + data.player.height > bonus.y
      ) {
        if (bonus.type === "laser") {
          startLaserShots();
        } else {
          data.shopCurrency++;
          data.score += 10;
        }
        data.bonuses.splice(index, 1);
      }
    });
  }, []);

  const drawEnemies = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !gameDataRef.current) return;
    const data = gameDataRef.current;

    data.enemies.forEach((enemy, index) => {
      enemy.x += enemy.dx;
      enemy.y += enemy.dy;

      if (enemy.x < 0 || enemy.x + enemy.width > canvas.width) {
        enemy.dx = -enemy.dx;
      }

      if (enemy.y > canvas.height) {
        data.enemies.splice(index, 1);
        return;
      }

      const enemyImg = imagesRef.current.enemyShip;
      if (enemyImg && enemyImg.complete) {
        ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.width, enemy.height);
      } else {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
      }

      const currentTime = Date.now();
      if (currentTime - enemy.lastShootTime > data.enemyShootInterval) {
        shootEnemyLaser(enemy);
        enemy.lastShootTime = currentTime;
      }
    });
  }, []);

  const drawExplosions = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !gameDataRef.current) return;
    const data = gameDataRef.current;

    data.explosions = data.explosions.filter((explosion) => {
      const currentTime = Date.now();
      const elapsedTime = currentTime - explosion.startTime;

      if (elapsedTime > 1000) return false;

      explosion.alpha = Math.sin((elapsedTime / 1000) * Math.PI);
      ctx.globalAlpha = explosion.alpha;
      const expImg = imagesRef.current.explosion;
      if (expImg && expImg.complete) {
        ctx.drawImage(expImg, explosion.x, explosion.y, explosion.width, explosion.height);
      } else {
        ctx.fillStyle = `rgba(255, 0, 0, ${explosion.alpha})`;
        ctx.fillRect(explosion.x, explosion.y, explosion.width, explosion.height);
      }
      ctx.globalAlpha = 1;
      return true;
    });
  }, []);

  const drawHealboxes = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !gameDataRef.current) return;
    const data = gameDataRef.current;

    data.healboxes.forEach((healbox, index) => {
      // Update healbox speed to match current game speed
      healbox.speed = Math.abs(data.speed);
      
      const hbImg = imagesRef.current.healbox;
      if (hbImg && hbImg.complete) {
        ctx.drawImage(hbImg, healbox.x, healbox.y, healbox.width, healbox.height);
      } else {
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(healbox.x, healbox.y, healbox.width, healbox.height);
      }

      // Move healbox DOWN (y increases = moving down screen)
      healbox.y += healbox.speed;

      if (healbox.y > canvas.height) {
        data.healboxes.splice(index, 1);
        return;
      }

      if (
        data.player.x < healbox.x + healbox.width &&
        data.player.x + data.player.width > healbox.x &&
        data.player.y < healbox.y + healbox.height &&
        data.player.y + data.player.height > healbox.y
      ) {
        data.lives++;
        data.healboxes.splice(index, 1);
      }
    });
  }, []);

  // Функции управления - EXACT COPY FROM ORIGINAL + улучшения
  const shootLaser = useCallback(() => {
    if (!gameDataRef.current) return;
    const data = gameDataRef.current;
    
    // Проверяем, есть ли улучшение оружия на текущем корабле
    const currentUpgrades = shipUpgrades[currentShip] || [];
    const hasWeaponUpgrade = currentUpgrades.includes('weapon');
    
    if (hasWeaponUpgrade) {
      // Двойной выстрел - два лазера с небольшим смещением
      const offset = GAME_CONFIG.weaponUpgradeLaserOffset;
      const laser1 = {
        x: data.player.x + data.player.width / 2 - 5 - offset,
        y: data.player.y - 20,
        width: 10,
        height: 20,
        speed: 10
      };
      const laser2 = {
        x: data.player.x + data.player.width / 2 - 5 + offset,
        y: data.player.y - 20,
        width: 10,
        height: 20,
        speed: 10
      };
      data.lasers.push(laser1, laser2);
    } else {
      // Обычный одиночный выстрел
      const laser = {
        x: data.player.x + data.player.width / 2 - 5,
        y: data.player.y - 20,
        width: 10,
        height: 20,
        speed: 10
      };
      data.lasers.push(laser);
    }
  }, [currentShip, shipUpgrades]);

  const shootEnemyLaser = useCallback((enemy: any) => {
    if (!gameDataRef.current) return;
    const data = gameDataRef.current;
    const laser = {
      x: enemy.x + enemy.width / 2 - 5,
      y: enemy.y + enemy.height,
      width: 10,
      height: 20,
      speed: 5,
      isEnemy: true
    };
    data.lasers.push(laser);
  }, []);

  const startLaserShots = useCallback(() => {
    if (!gameDataRef.current) return;
    const data = gameDataRef.current;
    data.laserShotsCount = 0;
    const laserShootIntervalId = setInterval(() => {
      if (data.laserShotsCount < data.totalLaserShots && data.gameRunning) {
        shootLaser();
        data.laserShotsCount++;
      } else {
        clearInterval(laserShootIntervalId);
      }
    }, data.laserShootInterval);
  }, [shootLaser]);

  const movePlayer = useCallback(() => {
    if (!gameDataRef.current) return;
    const data = gameDataRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!data.touchX) {
      data.player.x += data.player.dx;
      data.player.y += data.player.dy;
    }

    if (data.player.x < 0) data.player.x = 0;
    if (data.player.x + data.player.width > canvas.width) data.player.x = canvas.width - data.player.width;
    if (data.player.y < 0) data.player.y = 0;
    if (data.player.y + data.player.height > canvas.height) data.player.y = canvas.height - data.player.height;
  }, []);

  const handleLasers = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !gameDataRef.current) return;
    const data = gameDataRef.current;

    data.lasers.forEach((laser, index) => {
      if (laser.isEnemy) {
        laser.y += laser.speed;
        if (laser.y > canvas.height) {
          data.lasers.splice(index, 1);
          return;
        }

        const laserImg = imagesRef.current.laser;
        if (laserImg && laserImg.complete) {
          ctx.drawImage(laserImg, laser.x, laser.y, laser.width, laser.height);
        } else {
          ctx.fillStyle = '#ff0000';
          ctx.fillRect(laser.x, laser.y, laser.width, laser.height);
        }

        if (
          data.player.x < laser.x + laser.width &&
          data.player.x + data.player.width > laser.x &&
          data.player.y < laser.y + laser.height &&
          data.player.y + data.player.height > laser.y
        ) {
          // Проверяем щит от брони
          if (data.hasShield && data.shieldStartTime) {
            const currentTime = Date.now();
            const shieldDuration = GAME_CONFIG.armorShieldDuration;
            if (currentTime - data.shieldStartTime < shieldDuration) {
              // Щит активен - отменяем удар
              data.hasShield = false;
              data.shieldStartTime = null;
              data.lasers.splice(index, 1);
              return; // Выходим, не отнимая жизнь
            }
          }
          // Нет щита или он истек - отнимаем жизнь
          data.lives--;
          data.lasers.splice(index, 1);
          if (data.lives <= 0) {
            data.lives = 0;
            endGame();
          }
        }
      } else {
        laser.y -= laser.speed;
        if (laser.y < -laser.height) {
          data.lasers.splice(index, 1);
          return;
        }

        const laserImg = imagesRef.current.laser;
        if (laserImg && laserImg.complete) {
          ctx.drawImage(laserImg, laser.x, laser.y, laser.width, laser.height);
        } else {
          ctx.fillStyle = '#00ffff';
          ctx.fillRect(laser.x, laser.y, laser.width, laser.height);
        }

        data.enemies.forEach((enemy, enemyIndex) => {
          if (
            laser.x < enemy.x + enemy.width &&
            laser.x + laser.width > enemy.x &&
            laser.y < enemy.y + enemy.height &&
            laser.y + laser.height > enemy.y
          ) {
            createExplosion(enemy.x, enemy.y, enemy.width, enemy.height);
            data.enemies.splice(enemyIndex, 1);
            data.lasers.splice(index, 1);
            data.score += 50;
            data.enemiesDestroyed++;
          }
        });

        data.obstacles.forEach((obstacle, obstacleIndex) => {
          if (
            laser.x < obstacle.x + obstacle.width &&
            laser.x + laser.width > obstacle.x &&
            laser.y < obstacle.y + obstacle.height &&
            laser.y + laser.height > obstacle.y
          ) {
            data.obstacles.splice(obstacleIndex, 1);
            data.lasers.splice(index, 1);
          }
        });
      }
    });
  }, [createExplosion]);

  // End game - EXACT COPY FROM ORIGINAL
  const endGame = useCallback(() => {
    if (!gameDataRef.current) return;
    const data = gameDataRef.current;

    // EXACT COPY FROM ORIGINAL - сразу останавливаем игру, но продолжаем отрисовку взрыва
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
      startTime: Date.now()
    };

    data.shopCurrency += data.score;

    const newHighScore = Math.max(gameState.highScore, data.score);

    // EXACT COPY FROM ORIGINAL - сохраняем финальные значения
    const finalScore = data.score;
    const finalDistance = Math.floor(data.distance);
    const finalEnemiesDestroyed = data.enemiesDestroyed;
    const finalShopCurrency = data.shopCurrency;

    // EXACT COPY FROM ORIGINAL - через 1500ms показываем Game Over экран
    // НЕ обновляем gameState ДО setTimeout - это вызовет перезапуск игры через useEffect!
    setTimeout(() => {
      // Обновляем gameState перед переходом на Game Over экран (после того как screen изменится)
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

      if (gameDataRef.current) {
        gameDataRef.current.gameRunning = false;
        gameDataRef.current.playerExplosion = null;
      }
      // Меняем screen ПОСЛЕ обновления gameState, чтобы useEffect не перезапустил игру
      setScreen('gameover');
    }, 1500);
  }, [gameState.highScore, saveGameState]);

  // Game loop (update) - EXACT COPY FROM ORIGINAL
  const gameLoop = useCallback(() => {
    const data = gameDataRef.current;
    if (!data || (!data.gameRunning && !data.playerExplosion)) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawStars();
    drawPlayer();
    
    if (data.gameRunning) {
      drawObstacles();
      drawBonuses();
      drawEnemies();
      drawExplosions();
      drawHealboxes();
      movePlayer();
      handleLasers();

      data.distance += 0.1;
      const distanceElement = document.getElementById('distance-hud');
      if (distanceElement) {
        distanceElement.textContent = `Distance: ${Math.floor(data.distance)}`;
      }
      const scoreElement = document.getElementById('score-hud');
      if (scoreElement) {
        scoreElement.textContent = `Score: ${data.score}`;
      }
      const livesElement = document.getElementById('lives-hud');
      if (livesElement) {
        livesElement.textContent = `Lives: ${data.lives}`;
      }
      const enemiesElement = document.getElementById('enemies-hud');
      if (enemiesElement) {
        enemiesElement.textContent = `Enemies: ${data.enemiesDestroyed}`;
      }

      if (Math.floor(data.distance) > data.lastEnemySpawnDistance && Math.floor(data.distance) % 100 === 0) {
        createEnemy();
        data.lastEnemySpawnDistance = Math.floor(data.distance);
      }

      if (Math.floor(data.distance) > data.lastHealboxSpawnDistance && Math.floor(data.distance) % 150 === 0) {
        createHealbox();
        data.lastHealboxSpawnDistance = Math.floor(data.distance);
      }

      // Speed is now player-controlled via speedLevel, no automatic changes
      // Update speed based on current speedLevel (always positive for downward movement)
      // Check if speed is unlocked and available for this ship
      const shipLevel = (SHIP_CONFIGS[currentShip as keyof typeof SHIP_CONFIGS]?.level) || 1;
      // Speed 1 is always unlocked (base speed), others need to be purchased
      const isUnlocked = data.speedLevel === 1 || ownedUpgrades.includes(`speed${data.speedLevel}`);
      const isAvailable = data.speedLevel <= shipLevel;
      
      // If current speed is not available or unlocked, reset to 1 (base speed)
      if (!isAvailable || !isUnlocked) {
        data.speedLevel = 1;
        setCurrentSpeedLevel(1);
      }
      
      const effectiveSpeedLevel = Math.min(data.speedLevel, shipLevel);
      data.speed = Math.abs(GAME_CONFIG.speedLevels[effectiveSpeedLevel as keyof typeof GAME_CONFIG.speedLevels] || GAME_CONFIG.speedLevels[1]);

      if (Math.random() < 0.05) {
        createObstacle();
      }

      if (Math.random() < 0.03) {
        createBonus("regular");
      }

      if (Math.random() < 0.001) {
        createBonus("laser");
      }
    }

    if (data.gameRunning || data.playerExplosion) {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
  }, [currentShip, ownedUpgrades, drawStars, drawPlayer, drawObstacles, drawBonuses, drawEnemies, drawExplosions, drawHealboxes, movePlayer, handleLasers, createEnemy, createHealbox, createObstacle, createBonus]);

  // Initialize game - ПОЛНАЯ ПЕРЕПИСЬ
  useEffect(() => {
    if (screen !== 'playing') {
      // Cleanup when not playing - EXACT COPY FROM ORIGINAL
      // В оригинале игра останавливается только через setTimeout в endGame
      // НЕ очищаем сразу, если есть взрыв игрока
      if (screen === 'gameover') {
        // На экране Game Over - полностью останавливаем и очищаем
        cancelAnimationFrame(animationRef.current);
        if (gameDataRef.current) {
          gameDataRef.current.gameRunning = false;
          gameDataRef.current.playerExplosion = null;
        }
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        }
        gameDataRef.current = null;
      } else {
        // На других экранах - останавливаем игру, но не очищаем если есть взрыв
        cancelAnimationFrame(animationRef.current);
        if (gameDataRef.current) {
          gameDataRef.current.gameRunning = false;
          // НЕ обнуляем playerExplosion здесь - он должен отображаться до конца
        }
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        }
        // Обнуляем только если нет взрыва
        if (!gameDataRef.current?.playerExplosion) {
          gameDataRef.current = null;
        }
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const shipLives: Record<string, number> = {
      default: SHIP_CONFIGS.default.lives,
      redShip: SHIP_CONFIGS.redShip.lives,
      elonShip: SHIP_CONFIGS.elonShip.lives,
    };

    // Initialize game data - EXACT COPY FROM ORIGINAL startGameplay()
    gameDataRef.current = {
      gameRunning: true,
      isPlayerVisible: true,
      score: 0,
      lives: shipLives[currentShip] || 3,
      distance: 0,
      shopCurrency: gameState.shopCurrency, // Используем начальное значение, но НЕ добавляем в зависимости useEffect!
      speed: Math.abs(GAME_CONFIG.speedLevels[1]),  // Start with speed level 1 (base speed, always unlocked)
      speedLevel: 1,  // Start at speed level 1 (base speed)
      touchX: null,
      touchY: null,
      enemies: [],
      explosions: [],
      lastEnemySpawnDistance: 0,
      enemyShootInterval: GAME_CONFIG.enemyShootInterval,
      enemiesDestroyed: 0,
      healboxes: [],
      lastHealboxSpawnDistance: 0,
      playerExplosion: null,
      player: {
        x: canvas.width / 2 - 30,
        y: canvas.height - 100,
        width: 60,
        height: 60,
        speed: 10,
        dx: 0,
        dy: 0,
      },
      obstacles: [],
      bonuses: [],
      stars: Array.from({ length: 100 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2,
        speed: Math.random() * 2 + 1,
      })),
      lasers: [],
      laserShotsCount: 0,
      totalLaserShots: 100,
      laserShootInterval: 50,
      hasShield: false,
      shieldStartTime: null,
    };

    // Инициализируем щит, если на корабле есть улучшение брони
    const currentUpgrades = shipUpgrades[currentShip] || [];
    if (currentUpgrades.includes('armor') && gameDataRef.current) {
      gameDataRef.current.hasShield = true;
      gameDataRef.current.shieldStartTime = Date.now();
    }

    // Initial spawn - EXACT COPY FROM ORIGINAL
    const obstacleSize = Math.random() * 50 + 20;
    gameDataRef.current.obstacles.push({
      x: Math.random() * (canvas.width - obstacleSize),
      y: -obstacleSize,
      width: obstacleSize,
      height: obstacleSize,
      speed: Math.abs(gameDataRef.current.speed), // Ensure speed is always positive (moving down)
      rotation: Math.random() * Math.PI * 2,
    });

    gameDataRef.current.bonuses.push({
      x: Math.random() * (canvas.width - 30),
      y: -30,
      width: 30,
      height: 30,
      speed: Math.abs(gameDataRef.current.speed), // Ensure speed is always positive (moving down)
      type: 'laser',
    });

    // Reset UI state
    setGameState(prev => ({
      ...prev,
      score: 0,
      lives: shipLives[currentShip] || 3,
      // distance НЕ сбрасываем здесь - он обновляется через DOM напрямую
      enemiesDestroyed: 0,
    }));
    
    // Сбрасываем дистанцию в DOM напрямую, как в оригинале
    const distanceElement = document.getElementById('distance-hud');
    if (distanceElement) {
      distanceElement.textContent = 'Distance: 0';
    }
    // Reset speed level to 1
    setCurrentSpeedLevel(1);
    if (gameDataRef.current) {
      gameDataRef.current.speedLevel = 1;
      gameDataRef.current.speed = Math.abs(GAME_CONFIG.speedLevels[1]);
    }

    // Start game loop
    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationRef.current);
      if (gameDataRef.current) {
        gameDataRef.current.gameRunning = false;
      }
    };
  }, [screen, currentShip, gameLoop]); // УБРАЛ gameState.shopCurrency - он меняется в endGame и вызывает перезапуск!

  // Touch controls
  const handleTouch = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const data = gameDataRef.current;
    if (!data || !data.gameRunning) return;

    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!touch || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;
    
    const targetX = touchX - data.player.width / 2;
    const targetY = touchY - data.player.height / 2;
    
    data.player.x += (targetX - data.player.x) * 0.2;
    data.player.y += (targetY - data.player.y) * 0.2;
    
    data.touchX = touchX;
    data.touchY = touchY;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const data = gameDataRef.current;
    if (data) {
      data.touchX = null;
      data.touchY = null;
    }
  }, []);

  // Keyboard controls - EXACT COPY FROM ORIGINAL (ВСЕГДА активны, НЕ проверяют gameRunning!)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // EXACT COPY FROM ORIGINAL - НЕТ проверки gameRunning!
      if (e.key === 'ArrowLeft') {
        const data = gameDataRef.current;
        if (data) data.player.dx = -data.player.speed;
      }
      if (e.key === 'ArrowRight') {
        const data = gameDataRef.current;
        if (data) data.player.dx = data.player.speed;
      }
      if (e.key === 'ArrowUp') {
        const data = gameDataRef.current;
        if (data) data.player.dy = -data.player.speed;
      }
      if (e.key === 'ArrowDown') {
        const data = gameDataRef.current;
        if (data) data.player.dy = data.player.speed;
      }
      if (e.key === ' ') {
        // EXACT COPY FROM ORIGINAL - используем функцию shootLaser (убрал дублирование!)
        const data = gameDataRef.current;
        if (data && data.gameRunning) {
          shootLaser();
        }
      }
      // Speed control: 1, 2, 3 keys (only if unlocked)
      if (e.key === '1' || e.key === '2' || e.key === '3') {
        const data = gameDataRef.current;
        if (data && data.gameRunning) {
          const requestedLevel = parseInt(e.key);
          const shipLevel = (SHIP_CONFIGS[currentShip as keyof typeof SHIP_CONFIGS]?.level) || 1;
          const isAvailable = requestedLevel <= shipLevel;
          // Speed 1 is always unlocked (base speed), others need to be purchased
          const isUnlocked = requestedLevel === 1 || ownedUpgrades.includes(`speed${requestedLevel}`);
          
          if (isAvailable && isUnlocked && requestedLevel >= 1 && requestedLevel <= 3) {
            data.speedLevel = requestedLevel;
            setCurrentSpeedLevel(requestedLevel);
            data.speed = Math.abs(GAME_CONFIG.speedLevels[requestedLevel as keyof typeof GAME_CONFIG.speedLevels] || GAME_CONFIG.speedLevels[1]);
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // EXACT COPY FROM ORIGINAL - НЕТ проверки gameRunning!
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const data = gameDataRef.current;
        if (data) data.player.dx = 0;
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        const data = gameDataRef.current;
        if (data) data.player.dy = 0;
      }
    };

    // EXACT COPY FROM ORIGINAL - всегда добавляем обработчики
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [shootLaser, currentShip, ownedUpgrades]); // Добавил ownedUpgrades для проверки разблокированных скоростей

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Buy ship
  const buyShip = (shipType: string, cost: number) => {
    if (gameState.shopCurrency >= cost && !ownedShips.includes(shipType)) {
      const newCurrency = gameState.shopCurrency - cost;
      const newOwned = [...ownedShips, shipType];
      setOwnedShips(newOwned);
      setCurrentShip(shipType);
      saveGameState({ shopCurrency: newCurrency }, shipType, newOwned, ownedUpgrades, shipUpgrades);
      alert('Ship purchased!');
    }
  };

  // Buy upgrade
  const buyUpgrade = (upgradeId: string, cost: number) => {
    if (gameState.shopCurrency >= cost && !ownedUpgrades.includes(upgradeId)) {
      const newCurrency = gameState.shopCurrency - cost;
      const newOwnedUpgrades = [...ownedUpgrades, upgradeId];
      setOwnedUpgrades(newOwnedUpgrades);
      saveGameState({ shopCurrency: newCurrency }, currentShip, ownedShips, newOwnedUpgrades, shipUpgrades);
      alert('Upgrade purchased!');
    }
  };

  // Select ship
  const selectShip = (shipType: string) => {
    setCurrentShip(shipType);
    saveGameState({}, shipType, ownedShips, ownedUpgrades, shipUpgrades);
    alert('Ship selected!');
  };

  // Change upgrade on ship
  const handleUpgradeChange = (shipType: string, slotIndex: number, upgradeId: string | null) => {
    const currentUpgrades = shipUpgrades[shipType] || [];
    const newUpgrades = [...currentUpgrades];
    
    if (upgradeId === null) {
      // Удаляем улучшение из слота
      newUpgrades.splice(slotIndex, 1);
    } else {
      // Добавляем или заменяем улучшение в слоте
      if (slotIndex < newUpgrades.length) {
        newUpgrades[slotIndex] = upgradeId;
      } else {
        newUpgrades.push(upgradeId);
      }
    }
    
    const newShipUpgrades = { ...shipUpgrades, [shipType]: newUpgrades };
    setShipUpgrades(newShipUpgrades);
    saveGameState({}, currentShip, ownedShips, ownedUpgrades, newShipUpgrades);
  };

  const startGame = useCallback(() => {
    setScreen('playing');
  }, []);

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
            <div className="hud-item" id="score-hud">Score: {gameState.score}</div>
            <div className="hud-item" id="lives-hud">Lives: {gameState.lives}</div>
            <div className="hud-item" id="distance-hud">Distance: 0</div>
            <div className="hud-item" id="enemies-hud">Enemies: {gameState.enemiesDestroyed}</div>
            <div className="hud-item" id="speed-hud">Speed: {currentSpeedLevel}</div>
          </div>
          
          {/* Speed buttons */}
          <div className="speed-buttons">
            {[1, 2, 3].map((speedNum) => {
              const shipLevel = SHIP_CONFIGS[currentShip as keyof typeof SHIP_CONFIGS]?.level || 1;
              const isAvailable = speedNum <= shipLevel;
              // Speed 1 is always unlocked (base speed), others need to be purchased
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
                      data.speed = Math.abs(GAME_CONFIG.speedLevels[speedNum as keyof typeof GAME_CONFIG.speedLevels] || GAME_CONFIG.speedLevels[1]);
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
                shootLaser();
              }
            }} 
            onClick={(e) => {
              e.preventDefault();
              shootLaser();
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
            setScreen('menu');
            cancelAnimationFrame(animationRef.current);
            if (gameDataRef.current) {
              gameDataRef.current.gameRunning = false;
            }
            const canvas = canvasRef.current;
            if (canvas) {
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
              }
            }
            gameDataRef.current = null;
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

export default SpaceShip;
