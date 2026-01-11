import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './SpaceShip.css';

// Image URLs from IPFS
const IMAGES = {
  ship: 'https://silver-perfect-barracuda-186.mypinata.cloud/ipfs/bafkreicructrrwqrc35uwcw4gxsqmin7j36kr4e5526itxftviduoncbd4',
  meteor: 'https://silver-perfect-barracuda-186.mypinata.cloud/ipfs/bafkreicz3tpzoa4ivu3vvqeimlxosdmujtnucsepcb6datpdo2dkx2v5mq',
  laser: 'https://silver-perfect-barracuda-186.mypinata.cloud/ipfs/bafkreicsgjm2xzh7c5u65rcy6zaxbxbtzzotyruubabwqhfvxcf6prsiei',
  bonus: 'https://silver-perfect-barracuda-186.mypinata.cloud/ipfs/bafkreifypgmjawffyw4ybii4vz3dpownbms5f35bidwujqvcabfknshima',
  goldBonus: 'https://silver-perfect-barracuda-186.mypinata.cloud/ipfs/bafkreifdzru2ygtpjknpwozh6u4upkanntutsqhtbatw4c7gerk3u7pci4',
  enemyShip: 'https://silver-perfect-barracuda-186.mypinata.cloud/ipfs/bafybeigkchachnmnilbuqxulg3avx3ewfmkfahijmy6mfj3fxam4fn2gwa',
  explosion: 'https://silver-perfect-barracuda-186.mypinata.cloud/ipfs/bafkreiacnhvhf7tg7z32crgyf7n7uosynnpnijpxmyseo6uonft2viutsu',
  healbox: 'https://silver-perfect-barracuda-186.mypinata.cloud/ipfs/bafybeig6hwmewuyvh7ln7rjjz22htfxheoesd24b45hr7yhsjwn7bclcwq',
  redShip: 'https://silver-perfect-barracuda-186.mypinata.cloud/ipfs/bafybeifq65shmzu3wxbwyd4vg562v2hhsablkkxb4fwoith6ln5fii4msq',
  elonShip: 'https://silver-perfect-barracuda-186.mypinata.cloud/ipfs/bafybeieiiqvxctwaj3oilhog3dgs5a2pl6dwh543l5by3qm7idm2kceewq',
};

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
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const gameDataRef = useRef<any>(null);
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

  // Load images
  useEffect(() => {
    Object.entries(IMAGES).forEach(([key, src]) => {
      const img = new Image();
      img.src = src;
      imagesRef.current[key] = img;
    });
  }, []);

  // Load game state from localStorage
  const loadGameState = useCallback((id: string) => {
    const saved = localStorage.getItem(`spaceship-${id}`);
    if (saved) {
      const data = JSON.parse(saved);
      setGameState(prev => ({ ...prev, ...data }));
      setCurrentShip(data.currentShip || 'default');
      setOwnedShips(data.ownedShips || ['default']);
    }
  }, []);

  // Save game state to localStorage
  const saveGameState = useCallback((state: Partial<GameState>, ship?: string, owned?: string[]) => {
    const data = {
      ...gameState,
      ...state,
      currentShip: ship || currentShip,
      ownedShips: owned || ownedShips,
    };
    localStorage.setItem(`spaceship-${userId}`, JSON.stringify(data));
    setGameState(prev => ({ ...prev, ...state }));
  }, [gameState, userId, currentShip, ownedShips]);

  // Handle login
  const handleLogin = () => {
    if (!userId.trim()) {
      alert('Please enter your login!');
      return;
    }
    loadGameState(userId);
    setIsLoggedIn(true);
  };

  // Start game
  const startGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Ship lives based on type
    const shipLives: Record<string, number> = {
      default: 3,
      redShip: 5,
      elonShip: 7,
    };

    // Initialize game data
    gameDataRef.current = {
      running: true,
      player: {
        x: canvas.width / 2 - 30,
        y: canvas.height - 100,
        width: 60,
        height: 60,
        speed: 10,
        dx: 0,
        dy: 0,
      },
      score: 0,
      lives: shipLives[currentShip] || 3,
      distance: 0,
      enemiesDestroyed: 0,
      obstacles: [],
      bonuses: [],
      lasers: [],
      enemies: [],
      explosions: [],
      healboxes: [],
      stars: Array.from({ length: 100 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2,
        speed: Math.random() * 2 + 1,
      })),
      speed: 3,
      lastEnemySpawnDistance: 0,
      lastHealboxSpawnDistance: 0,
      touchX: null,
      touchY: null,
      laserShooting: false,
      laserShotsCount: 0,
    };

    setScreen('playing');
    gameLoop(canvas, ctx);
  }, [currentShip]);

  // Game loop
  const gameLoop = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    const data = gameDataRef.current;
    if (!data || !data.running) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw stars
    data.stars.forEach((star: any) => {
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
      star.y += star.speed;
      if (star.y > canvas.height) {
        star.y = 0;
        star.x = Math.random() * canvas.width;
      }
    });

    // Draw player
    const shipImg = imagesRef.current[currentShip === 'default' ? 'ship' : currentShip];
    if (shipImg) {
      ctx.drawImage(shipImg, data.player.x, data.player.y, data.player.width, data.player.height);
    }

    // Update and draw obstacles
    data.obstacles = data.obstacles.filter((obs: any) => {
      ctx.save();
      ctx.translate(obs.x + obs.width / 2, obs.y + obs.height / 2);
      obs.rotation += 0.02;
      ctx.rotate(obs.rotation);
      const meteorImg = imagesRef.current.meteor;
      if (meteorImg) {
        ctx.drawImage(meteorImg, -obs.width / 2, -obs.height / 2, obs.width, obs.height);
      }
      ctx.restore();

      obs.y += obs.speed;

      // Collision with player
      if (
        data.player.x < obs.x + obs.width &&
        data.player.x + data.player.width > obs.x &&
        data.player.y < obs.y + obs.height &&
        data.player.y + data.player.height > obs.y
      ) {
        data.lives--;
        if (data.lives <= 0) {
          endGame();
        }
        return false;
      }

      return obs.y < canvas.height;
    });

    // Update and draw bonuses
    data.bonuses = data.bonuses.filter((bonus: any) => {
      const bonusImg = bonus.type === 'laser' ? imagesRef.current.goldBonus : imagesRef.current.bonus;
      if (bonusImg) {
        ctx.drawImage(bonusImg, bonus.x, bonus.y, bonus.width, bonus.height);
      }
      bonus.y += bonus.speed;

      // Collision with player
      if (
        data.player.x < bonus.x + bonus.width &&
        data.player.x + data.player.width > bonus.x &&
        data.player.y < bonus.y + bonus.height &&
        data.player.y + data.player.height > bonus.y
      ) {
        if (bonus.type === 'laser') {
          startLaserShots();
        } else {
          data.score += 10;
        }
        return false;
      }

      return bonus.y < canvas.height;
    });

    // Update and draw enemies
    data.enemies = data.enemies.filter((enemy: any) => {
      enemy.x += enemy.dx;
      enemy.y += enemy.dy;

      if (enemy.x < 0 || enemy.x + enemy.width > canvas.width) {
        enemy.dx = -enemy.dx;
      }

      const enemyImg = imagesRef.current.enemyShip;
      if (enemyImg) {
        ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.width, enemy.height);
      }

      // Enemy shooting
      if (Date.now() - enemy.lastShootTime > 500) {
        data.lasers.push({
          x: enemy.x + enemy.width / 2 - 5,
          y: enemy.y + enemy.height,
          width: 10,
          height: 20,
          speed: 5,
          isEnemy: true,
        });
        enemy.lastShootTime = Date.now();
      }

      return enemy.y < canvas.height;
    });

    // Update and draw lasers
    data.lasers = data.lasers.filter((laser: any) => {
      const laserImg = imagesRef.current.laser;
      if (laserImg) {
        ctx.drawImage(laserImg, laser.x, laser.y, laser.width, laser.height);
      }

      if (laser.isEnemy) {
        laser.y += laser.speed;

        // Hit player
        if (
          data.player.x < laser.x + laser.width &&
          data.player.x + data.player.width > laser.x &&
          data.player.y < laser.y + laser.height &&
          data.player.y + data.player.height > laser.y
        ) {
          data.lives--;
          if (data.lives <= 0) {
            endGame();
          }
          return false;
        }

        return laser.y < canvas.height;
      } else {
        laser.y -= laser.speed;

        // Hit enemies
        for (let i = data.enemies.length - 1; i >= 0; i--) {
          const enemy = data.enemies[i];
          if (
            laser.x < enemy.x + enemy.width &&
            laser.x + laser.width > enemy.x &&
            laser.y < enemy.y + enemy.height &&
            laser.y + laser.height > enemy.y
          ) {
            data.explosions.push({
              x: enemy.x,
              y: enemy.y,
              width: enemy.width,
              height: enemy.height,
              alpha: 1,
              startTime: Date.now(),
            });
            data.enemies.splice(i, 1);
            data.score += 50;
            data.enemiesDestroyed++;
            return false;
          }
        }

        // Hit obstacles
        for (let i = data.obstacles.length - 1; i >= 0; i--) {
          const obs = data.obstacles[i];
          if (
            laser.x < obs.x + obs.width &&
            laser.x + laser.width > obs.x &&
            laser.y < obs.y + obs.height &&
            laser.y + laser.height > obs.y
          ) {
            data.obstacles.splice(i, 1);
            return false;
          }
        }

        return laser.y > -laser.height;
      }
    });

    // Draw explosions
    data.explosions = data.explosions.filter((exp: any) => {
      const elapsed = Date.now() - exp.startTime;
      if (elapsed > 1000) return false;

      exp.alpha = Math.sin((elapsed / 1000) * Math.PI);
      ctx.globalAlpha = exp.alpha;
      const expImg = imagesRef.current.explosion;
      if (expImg) {
        ctx.drawImage(expImg, exp.x, exp.y, exp.width, exp.height);
      }
      ctx.globalAlpha = 1;
      return true;
    });

    // Draw healboxes
    data.healboxes = data.healboxes.filter((hb: any) => {
      const hbImg = imagesRef.current.healbox;
      if (hbImg) {
        ctx.drawImage(hbImg, hb.x, hb.y, hb.width, hb.height);
      }
      hb.y += hb.speed;

      // Collision with player
      if (
        data.player.x < hb.x + hb.width &&
        data.player.x + data.player.width > hb.x &&
        data.player.y < hb.y + hb.height &&
        data.player.y + data.player.height > hb.y
      ) {
        data.lives++;
        return false;
      }

      return hb.y < canvas.height;
    });

    // Move player
    if (!data.touchX) {
      data.player.x += data.player.dx;
      data.player.y += data.player.dy;
    }

    // Boundaries
    if (data.player.x < 0) data.player.x = 0;
    if (data.player.x + data.player.width > canvas.width) data.player.x = canvas.width - data.player.width;
    if (data.player.y < 0) data.player.y = 0;
    if (data.player.y + data.player.height > canvas.height) data.player.y = canvas.height - data.player.height;

    // Update distance
    data.distance += 0.1;

    // Spawn obstacles
    if (Math.random() < 0.05) {
      const size = Math.random() * 50 + 20;
      data.obstacles.push({
        x: Math.random() * (canvas.width - size),
        y: -size,
        width: size,
        height: size,
        speed: data.speed,
        rotation: Math.random() * Math.PI * 2,
      });
    }

    // Spawn bonuses
    if (Math.random() < 0.03) {
      data.bonuses.push({
        x: Math.random() * (canvas.width - 20),
        y: -20,
        width: 20,
        height: 20,
        speed: 3,
        type: 'regular',
      });
    }

    // Spawn laser bonus
    if (Math.random() < 0.001) {
      data.bonuses.push({
        x: Math.random() * (canvas.width - 30),
        y: -30,
        width: 30,
        height: 30,
        speed: 3,
        type: 'laser',
      });
    }

    // Spawn enemies
    if (Math.floor(data.distance) > data.lastEnemySpawnDistance && Math.floor(data.distance) % 100 === 0) {
      data.enemies.push({
        x: Math.random() * (canvas.width - 50),
        y: -50,
        width: 50,
        height: 50,
        speed: 2,
        dx: (Math.random() - 0.5) * 2,
        dy: 1,
        lastShootTime: Date.now(),
      });
      data.lastEnemySpawnDistance = Math.floor(data.distance);
    }

    // Spawn healboxes
    if (Math.floor(data.distance) > data.lastHealboxSpawnDistance && Math.floor(data.distance) % 150 === 0) {
      data.healboxes.push({
        x: Math.random() * (canvas.width - 30),
        y: -30,
        width: 30,
        height: 30,
        speed: 3,
      });
      data.lastHealboxSpawnDistance = Math.floor(data.distance);
    }

    // Increase speed over distance
    if (data.distance > 500 && data.distance <= 1000) {
      data.speed = 4;
    } else if (data.distance > 1000) {
      data.speed = 5;
    }

    // Update state for UI
    setGameState(prev => ({
      ...prev,
      score: data.score,
      lives: data.lives,
      distance: Math.floor(data.distance),
      enemiesDestroyed: data.enemiesDestroyed,
    }));

    if (data.running) {
      animationRef.current = requestAnimationFrame(() => gameLoop(canvas, ctx));
    }
  };

  // Start laser shots
  const startLaserShots = () => {
    const data = gameDataRef.current;
    if (!data) return;

    let count = 0;
    const interval = setInterval(() => {
      if (count < 100 && data.running) {
        data.lasers.push({
          x: data.player.x + data.player.width / 2 - 5,
          y: data.player.y - 20,
          width: 10,
          height: 20,
          speed: 10,
          isEnemy: false,
        });
        count++;
      } else {
        clearInterval(interval);
      }
    }, 50);
  };

  // Shoot laser
  const shootLaser = useCallback(() => {
    const data = gameDataRef.current;
    if (!data || !data.running) return;

    data.lasers.push({
      x: data.player.x + data.player.width / 2 - 5,
      y: data.player.y - 20,
      width: 10,
      height: 20,
      speed: 10,
      isEnemy: false,
    });
  }, []);

  // End game
  const endGame = useCallback(() => {
    const data = gameDataRef.current;
    if (!data) return;

    data.running = false;
    cancelAnimationFrame(animationRef.current);

    const newCurrency = gameState.shopCurrency + data.score;
    const newHighScore = Math.max(gameState.highScore, data.score);

    saveGameState({
      shopCurrency: newCurrency,
      highScore: newHighScore,
    });

    setScreen('gameover');
  }, [gameState.shopCurrency, gameState.highScore, saveGameState]);

  // Handle touch
  const handleTouch = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const data = gameDataRef.current;
    if (!data || !data.running) return;

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

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const data = gameDataRef.current;
      if (!data || !data.running) return;

      if (e.key === 'ArrowLeft') data.player.dx = -data.player.speed;
      if (e.key === 'ArrowRight') data.player.dx = data.player.speed;
      if (e.key === 'ArrowUp') data.player.dy = -data.player.speed;
      if (e.key === 'ArrowDown') data.player.dy = data.player.speed;
      if (e.key === ' ') shootLaser();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const data = gameDataRef.current;
      if (!data) return;

      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') data.player.dx = 0;
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') data.player.dy = 0;
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [shootLaser]);

  // Cleanup
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationRef.current);
      if (gameDataRef.current) {
        gameDataRef.current.running = false;
      }
    };
  }, []);

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
      saveGameState({ shopCurrency: newCurrency }, shipType, newOwned);
      alert('Ship purchased!');
    }
  };

  // Select ship
  const selectShip = (shipType: string) => {
    setCurrentShip(shipType);
    saveGameState({}, shipType);
    alert('Ship selected!');
  };

  return (
    <div className="spaceship-game">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="game-canvas"
        onTouchStart={handleTouch}
        onTouchMove={handleTouch}
        onTouchEnd={handleTouchEnd}
      />

      {/* HUD */}
      {screen === 'playing' && (
        <div className="game-hud">
          <div className="hud-item">Score: {gameState.score}</div>
          <div className="hud-item">Lives: {gameState.lives}</div>
          <div className="hud-item">Distance: {gameState.distance}</div>
          <div className="hud-item">Enemies: {gameState.enemiesDestroyed}</div>
          <button className="shoot-btn" onTouchStart={shootLaser} onClick={shootLaser}>
            🔥
          </button>
        </div>
      )}

      {/* Menu */}
      {screen === 'menu' && (
        <div className="game-menu">
          <h1>🚀 Space Adventure</h1>
          
          {!isLoggedIn ? (
            <>
              <input
                type="text"
                placeholder="Enter your login"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                maxLength={20}
                className="login-input"
              />
              <button onClick={handleLogin} className="menu-btn">Start</button>
            </>
          ) : (
            <>
              <p className="welcome-text">Welcome, {userId}!</p>
              <p className="currency-text">💰 Currency: {gameState.shopCurrency}</p>
              <p className="highscore-text">🏆 High Score: {gameState.highScore}</p>
              <button onClick={startGame} className="menu-btn play-btn">🎮 Play</button>
              <button onClick={() => setScreen('shop')} className="menu-btn">🛒 Shop</button>
              <button onClick={() => setScreen('inventory')} className="menu-btn">📦 Inventory</button>
            </>
          )}
          
          <button onClick={() => navigate('/games')} className="menu-btn back-btn">← Back</button>
        </div>
      )}

      {/* Game Over */}
      {screen === 'gameover' && (
        <div className="game-menu">
          <h1>💥 Game Over</h1>
          <p className="score-text">Score: {gameState.score}</p>
          <p className="score-text">Distance: {gameState.distance}</p>
          <p className="score-text">Enemies: {gameState.enemiesDestroyed}</p>
          <button onClick={startGame} className="menu-btn play-btn">🔄 Restart</button>
          <button onClick={() => setScreen('menu')} className="menu-btn">📋 Menu</button>
        </div>
      )}

      {/* Shop */}
      {screen === 'shop' && (
        <div className="game-menu shop-menu">
          <h1>🛒 Space Shop</h1>
          <p className="currency-text">💰 Currency: {gameState.shopCurrency}</p>
          
          <div className="ships-grid">
            <div className="ship-card">
              <img src={IMAGES.redShip} alt="Red Ship" />
              <h3>Red Ship</h3>
              <p>Lives: 5</p>
              <p>Cost: 200</p>
              <button
                onClick={() => buyShip('redShip', 200)}
                disabled={gameState.shopCurrency < 200 || ownedShips.includes('redShip')}
                className="buy-btn"
              >
                {ownedShips.includes('redShip') ? '✓ Owned' : 'Buy'}
              </button>
            </div>
            
            <div className="ship-card">
              <img src={IMAGES.elonShip} alt="Elon Ship" />
              <h3>Elon Ship</h3>
              <p>Lives: 7</p>
              <p>Cost: 400</p>
              <button
                onClick={() => buyShip('elonShip', 400)}
                disabled={gameState.shopCurrency < 400 || ownedShips.includes('elonShip')}
                className="buy-btn"
              >
                {ownedShips.includes('elonShip') ? '✓ Owned' : 'Buy'}
              </button>
            </div>
          </div>
          
          <button onClick={() => setScreen('menu')} className="menu-btn back-btn">← Back</button>
        </div>
      )}

      {/* Inventory */}
      {screen === 'inventory' && (
        <div className="game-menu inventory-menu">
          <h1>📦 Your Ships</h1>
          
          <div className="ships-grid">
            <div className={`ship-card ${currentShip === 'default' ? 'selected' : ''}`}>
              <img src={IMAGES.ship} alt="Default Ship" />
              <h3>Default Ship</h3>
              <p>Lives: 3</p>
              <button
                onClick={() => selectShip('default')}
                disabled={currentShip === 'default'}
                className="select-btn"
              >
                {currentShip === 'default' ? '✓ Selected' : 'Select'}
              </button>
            </div>
            
            {ownedShips.includes('redShip') && (
              <div className={`ship-card ${currentShip === 'redShip' ? 'selected' : ''}`}>
                <img src={IMAGES.redShip} alt="Red Ship" />
                <h3>Red Ship</h3>
                <p>Lives: 5</p>
                <button
                  onClick={() => selectShip('redShip')}
                  disabled={currentShip === 'redShip'}
                  className="select-btn"
                >
                  {currentShip === 'redShip' ? '✓ Selected' : 'Select'}
                </button>
              </div>
            )}
            
            {ownedShips.includes('elonShip') && (
              <div className={`ship-card ${currentShip === 'elonShip' ? 'selected' : ''}`}>
                <img src={IMAGES.elonShip} alt="Elon Ship" />
                <h3>Elon Ship</h3>
                <p>Lives: 7</p>
                <button
                  onClick={() => selectShip('elonShip')}
                  disabled={currentShip === 'elonShip'}
                  className="select-btn"
                >
                  {currentShip === 'elonShip' ? '✓ Selected' : 'Select'}
                </button>
              </div>
            )}
          </div>
          
          <button onClick={() => setScreen('menu')} className="menu-btn back-btn">← Back</button>
        </div>
      )}
    </div>
  );
};

export default SpaceShip;
