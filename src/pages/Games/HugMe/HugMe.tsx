import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './HugMe.css';

interface Position {
  x: number;
  y: number;
}

interface Bunny {
  id: string;
  x: number;
  y: number;
  frameOffset: number;
  animationTimer: ReturnType<typeof setInterval> | null;
  el: HTMLDivElement | null;
  sprite: {
    el: HTMLDivElement | null;
    x: number;
    y: number;
  };
  sad: boolean;
  buffer: number;
  move: Position;
  walkingInterval: ReturnType<typeof setInterval> | null;
}

interface TreeElement {
  id: string;
  x: number;
  y: number;
  buffer: number;
}

const HugMe: React.FC = () => {
  const navigate = useNavigate();
  const gameRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const endMessageRef = useRef<HTMLDivElement>(null);

  const [gameStarted, setGameStarted] = useState(false);
  const [sadCount, setSadCount] = useState(45);
  const [gameWon, setGameWon] = useState(false);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timer, setTimer] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('hugme-highscore');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [totalCoins, setTotalCoins] = useState(() => {
    const saved = localStorage.getItem('hugme-coins');
    return saved ? parseInt(saved, 10) : 0;
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastHugTimeRef = useRef<number>(0);

  const settingsRef = useRef({
    d: 20,
    offsetPos: { x: 0, y: 0 },
    elements: [] as TreeElement[],
    bunnies: [] as Bunny[],
    map: {
      w: 20 * 200,
      h: 20 * 200,
      x: 0,
      y: 0,
    },
    transitionTimer: null as ReturnType<typeof setTimeout> | null,
    isWindowActive: true,
    controlPos: { x: 0, y: 0 },
    bunnyRadarSize: 0,
    sadBunnies: [] as { el: Bunny; distance: number }[],
  });

  const playerStateRef = useRef({
    id: 'bear',
    x: 0,
    y: 0,
    frameOffset: 1,
    animationTimer: null as ReturnType<typeof setInterval> | null,
    sprite: { x: 0, y: 0 },
    walkingDirection: '',
    walkingInterval: null as ReturnType<typeof setInterval> | null,
    pause: false,
    buffer: 20,
    move: { x: 0, y: 0 },
  });

  const bunnyPosRefs = useRef<HTMLDivElement[]>([]);

  const px = (n: number) => `${n}px`;
  const randomN = (max: number) => Math.ceil(Math.random() * max);
  const radToDeg = (rad: number) => Math.round(rad * (180 / Math.PI));
  const distanceBetween = (a: Position, b: Position) =>
    Math.round(Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2)));

  const setPos = (el: HTMLElement | null, x: number, y: number) => {
    if (el) {
      el.style.left = px(x);
      el.style.top = px(y);
    }
  };

  const setBackgroundPos = (el: HTMLElement | null, x: number, y: number) => {
    if (el) {
      el.style.setProperty('--bx', px(x));
      el.style.setProperty('--by', px(y));
    }
  };

  const getRandomPos = useCallback((key: 'w' | 'h') => {
    return 20 * randomN(settingsRef.current.map[key] / 20 - 1);
  }, []);

  const stopSprite = useCallback((actor: typeof playerStateRef.current | Bunny) => {
    actor.sprite.x = 0;
    const spriteEl = 'el' in actor && actor.el 
      ? actor.el.querySelector('.sprite') as HTMLElement
      : playerRef.current?.querySelector('.sprite') as HTMLElement;
    setBackgroundPos(spriteEl, 0, actor.sprite.y);
    if (actor.walkingInterval) {
      clearInterval(actor.walkingInterval);
      actor.walkingInterval = null;
    }
  }, []);

  const animateSprite = useCallback((actor: typeof playerStateRef.current | Bunny, dir: string) => {
    const h = -32 * 2;
    actor.sprite.y = {
      down: 0,
      up: h,
      right: h * 2,
      left: h * 3,
    }[dir] || 0;
    actor.frameOffset = actor.frameOffset === 1 ? 2 : 1;
    actor.sprite.x = actor.frameOffset * (2 * -20);
    
    const spriteEl = 'el' in actor && actor.el 
      ? actor.el.querySelector('.sprite') as HTMLElement
      : playerRef.current?.querySelector('.sprite') as HTMLElement;
    setBackgroundPos(spriteEl, actor.sprite.x, actor.sprite.y);
  }, []);

  const updateOffset = useCallback(() => {
    if (gameRef.current) {
      const { width, height } = gameRef.current.getBoundingClientRect();
      settingsRef.current.offsetPos = {
        x: width / 2,
        y: height / 2,
      };
    }
  }, []);

  const positionMap = useCallback(() => {
    const settings = settingsRef.current;
    const player = playerStateRef.current;
    settings.map.x = settings.offsetPos.x - player.x;
    settings.map.y = settings.offsetPos.y - player.y;
  }, []);

  const updateSadBunnyCount = useCallback(() => {
    const count = settingsRef.current.bunnies.filter((b) => b.sad).length;
    const prevCount = sadCount;
    setSadCount(count);
    
    // Calculate score when a bunny is hugged
    if (count < prevCount) {
      const now = Date.now();
      const timeSinceLastHug = now - lastHugTimeRef.current;
      
      // Combo system - hug within 5 seconds for combo
      let newCombo = combo;
      if (timeSinceLastHug < 5000 && lastHugTimeRef.current > 0) {
        newCombo = Math.min(combo + 1, 10);
      } else {
        newCombo = 1;
      }
      setCombo(newCombo);
      lastHugTimeRef.current = now;
      
      // Base points + combo bonus
      const basePoints = 100;
      const comboBonus = basePoints * (newCombo - 1) * 0.5;
      const pointsEarned = Math.round(basePoints + comboBonus);
      
      // Coins (1-3 based on combo)
      const coinsEarned = Math.min(newCombo, 3);
      
      setScore(prev => prev + pointsEarned);
      setCoins(prev => prev + coinsEarned);
    }
    
    if (count === 0) {
      // Game won - bonus points for time!
      const timeBonus = Math.max(0, 3000 - timer * 10);
      setScore(prev => prev + timeBonus);
      
      // Save high score
      const finalScore = score + Math.max(0, 3000 - timer * 10);
      if (finalScore > highScore) {
        setHighScore(finalScore);
        localStorage.setItem('hugme-highscore', finalScore.toString());
      }
      
      // Save total coins
      const newTotalCoins = totalCoins + coins;
      setTotalCoins(newTotalCoins);
      localStorage.setItem('hugme-coins', newTotalCoins.toString());
      
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      setGameWon(true);
    }
  }, [sadCount, combo, timer, score, highScore, totalCoins, coins]);

  const noWall = useCallback((actor: typeof playerStateRef.current | Bunny): boolean => {
    const settings = settingsRef.current;
    const player = playerStateRef.current;
    const newPos = { x: actor.x + actor.move.x, y: actor.y + actor.move.y };

    if (actor === player && !player.pause) {
      const bunnyToHug = settings.bunnies.find(
        (el) => el.sad && el.id !== actor.id && distanceBetween(el, newPos) <= el.buffer
      );
      if (bunnyToHug) {
        return false;
      }
    }

    const allElements = [
      ...settings.bunnies.filter((el) => el.id !== actor.id),
      ...settings.elements,
    ];

    if (
      allElements.some(
        (el) =>
          distanceBetween(el, newPos) <= el.buffer &&
          distanceBetween(el, actor) > el.buffer
      )
    ) {
      return false;
    }

    const buffer = 40;
    const noWallX =
      actor.move.x > 0
        ? newPos.x + buffer < settings.map.w
        : newPos.x - buffer > 0;
    const noWallY =
      actor.move.y > 0
        ? newPos.y < settings.map.h - buffer
        : newPos.y - buffer > 0;

    return noWallX && noWallY;
  }, []);

  const walk = useCallback((actor: typeof playerStateRef.current | Bunny, dir: string) => {
    const settings = settingsRef.current;
    const player = playerStateRef.current;

    if (!dir || player.pause || !settings.isWindowActive) return;

    if (noWall(actor)) {
      animateSprite(actor, dir);
      actor.x += actor.move.x;
      actor.y += actor.move.y;

      if (actor === player) {
        positionMap();
        setPos(mapRef.current, settings.map.x, settings.map.y);
        if (playerRef.current?.parentElement) {
          playerRef.current.parentElement.style.zIndex = String(player.y);
        }
      } else {
        const bunny = actor as Bunny;
        setPos(bunny.el, bunny.x, bunny.y);
        if (bunny.el) {
          bunny.el.style.zIndex = String(bunny.y);
        }
      }
    } else {
      stopSprite(actor);
    }
  }, [animateSprite, noWall, positionMap, stopSprite]);

  const triggerBunnyMessage = useCallback((bunny: Bunny, classToAdd: string) => {
    const messages = ['thanks!', 'Luv u!', 'yeah!', '^ _ ^', 'thank you!'];
    bunny.el?.setAttribute('message', messages[randomN(5) - 1]);
    bunny.el?.classList.add(classToAdd);
    setTimeout(() => {
      bunny.el?.classList.remove(classToAdd);
    }, 800);
  }, []);

  const triggerBunnyWalk = useCallback((bunny: Bunny) => {
    bunny.animationTimer = setInterval(() => {
      if (!settingsRef.current.isWindowActive) return;
      const dir = ['up', 'down', 'right', 'left'][Math.floor(Math.random() * 4)];
      const d = settingsRef.current.d;

      bunny.move = {
        down: { x: 0, y: d },
        up: { x: 0, y: -d },
        right: { x: d, y: 0 },
        left: { x: -d, y: 0 },
      }[dir] || { x: 0, y: 0 };

      walk(bunny, dir);
      setTimeout(() => walk(bunny, dir), 300);
      setTimeout(() => walk(bunny, dir), 600);
      setTimeout(() => stopSprite(bunny), 900);
    }, 2000);
  }, [stopSprite, walk]);

  const hugBunny = useCallback((bunny: Bunny) => {
    const player = playerStateRef.current;
    const settings = settingsRef.current;

    const classToAdd = bunny.x > player.x ? 'hug-bear-bunny' : 'hug-bunny-bear';
    playerRef.current?.classList.add('d-none');
    bunny.el?.classList.add(classToAdd);
    if (bunny.animationTimer) clearInterval(bunny.animationTimer);
    player.pause = true;
    bunny.sad = false;

    player.y = bunny.y;
    if (classToAdd === 'hug-bear-bunny') {
      player.x = bunny.x - 40;
      animateSprite(player, 'right');
      animateSprite(bunny, 'left');
    } else {
      player.x = bunny.x + 40;
      animateSprite(player, 'left');
      animateSprite(bunny, 'right');
    }

    positionMap();
    mapRef.current?.classList.add('slow-transition');
    setPos(mapRef.current, settings.map.x, settings.map.y);
    if (playerRef.current?.parentElement) {
      playerRef.current.parentElement.style.zIndex = String(player.y);
    }

    setTimeout(() => {
      playerRef.current?.classList.remove('d-none');
      bunny.el?.classList.remove(classToAdd, 'sad');
      stopSprite(bunny);
      triggerBunnyWalk(bunny);
      player.pause = false;
      mapRef.current?.classList.remove('slow-transition');
      triggerBunnyMessage(bunny, classToAdd === 'hug-bear-bunny' ? 'happy-left' : 'happy-right');
      updateSadBunnyCount();
    }, 1800);
  }, [animateSprite, positionMap, stopSprite, triggerBunnyMessage, triggerBunnyWalk, updateSadBunnyCount]);

  const handleWalk = useCallback(() => {
    const player = playerStateRef.current;
    const settings = settingsRef.current;
    let dir = 'right';
    const d = settings.d;

    player.walkingInterval = setInterval(() => {
      if (Math.abs(player.y - settings.controlPos.y) > 20) {
        player.move.y = player.y > settings.controlPos.y ? -d : d;
        dir = player.move.y === -d ? 'up' : 'down';
      } else {
        player.move.y = 0;
      }
      if (Math.abs(player.x - settings.controlPos.x) > 20) {
        player.move.x = player.x > settings.controlPos.x ? -d : d;
        dir = player.move.x === -d ? 'left' : 'right';
      } else {
        player.move.x = 0;
      }

      if (player.move.x || player.move.y) {
        // Check for bunny to hug
        const newPos = { x: player.x + player.move.x, y: player.y + player.move.y };
        const bunnyToHug = settings.bunnies.find(
          (el) => el.sad && distanceBetween(el, newPos) <= el.buffer
        );
        if (bunnyToHug) {
          stopSprite(player);
          hugBunny(bunnyToHug);
        } else {
          walk(player, dir);
        }
      } else {
        stopSprite(player);
      }
    }, 150);
  }, [hugBunny, stopSprite, walk]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!gameStarted || gameWon) return;
    
    const player = playerStateRef.current;
    const settings = settingsRef.current;
    
    stopSprite(player);
    
    const rect = mapRef.current?.getBoundingClientRect();
    if (rect) {
      settings.controlPos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }

    handleWalk();
  }, [gameStarted, gameWon, handleWalk, stopSprite]);

  const startGame = useCallback(() => {
    setGameStarted(true);
    setGameWon(false);
    setSadCount(45);
    setScore(0);
    setCoins(0);
    setCombo(0);
    setTimer(0);
    lastHugTimeRef.current = 0;
    
    // Start timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);

    const settings = settingsRef.current;
    const player = playerStateRef.current;

    // Reset
    settings.bunnies = [];
    settings.elements = [];

    // Set player position
    player.x = getRandomPos('w');
    player.y = getRandomPos('h');
    player.pause = false;

    // Create bunnies
    for (let i = 0; i < 45; i++) {
      const bunny: Bunny = {
        id: `bunny-${i}`,
        x: getRandomPos('w'),
        y: getRandomPos('h'),
        frameOffset: 1,
        animationTimer: null,
        el: null,
        sprite: { el: null, x: 0, y: 0 },
        sad: true,
        buffer: 30,
        move: { x: 0, y: 0 },
        walkingInterval: null,
      };
      settings.bunnies.push(bunny);
    }

    // Create trees
    for (let i = 0; i < 100; i++) {
      const tree: TreeElement = {
        id: `tree-${i}`,
        x: getRandomPos('w'),
        y: getRandomPos('h'),
        buffer: 40,
      };
      settings.elements.push(tree);
    }

    updateOffset();
    positionMap();
  }, [getRandomPos, positionMap, updateOffset]);

  // Initialize bunny elements after render
  useEffect(() => {
    if (!gameStarted || !mapRef.current) return;

    const settings = settingsRef.current;

    // Clear map children except player wrapper
    const existingElements = mapRef.current.querySelectorAll('.sprite-container:not(.player-wrapper .sprite-container), .tree');
    existingElements.forEach((el) => el.remove());

    // Add bunnies to DOM
    settings.bunnies.forEach((bunny) => {
      const el = document.createElement('div');
      el.className = 'sprite-container sad';
      el.innerHTML = '<div class="bunny sprite"></div>';
      el.style.left = px(bunny.x);
      el.style.top = px(bunny.y);
      el.style.zIndex = String(bunny.y);
      mapRef.current?.appendChild(el);
      bunny.el = el;
      bunny.sprite.el = el.querySelector('.bunny') as HTMLDivElement;

      if (randomN(2) === 2) {
        triggerBunnyWalk(bunny);
      }
    });

    // Add trees to DOM
    settings.elements.forEach((tree) => {
      const el = document.createElement('div');
      el.className = 'tree';
      el.innerHTML = '<div></div>';
      el.style.left = px(tree.x);
      el.style.top = px(tree.y);
      el.style.zIndex = String(tree.y);
      mapRef.current?.appendChild(el);
    });

    // Position player
    if (playerRef.current?.parentElement) {
      playerRef.current.parentElement.style.zIndex = String(playerStateRef.current.y);
    }

    // Position map
    setPos(mapRef.current, settings.map.x, settings.map.y);

    // Cleanup
    return () => {
      settings.bunnies.forEach((bunny) => {
        if (bunny.animationTimer) clearInterval(bunny.animationTimer);
        if (bunny.walkingInterval) clearInterval(bunny.walkingInterval);
      });
    };
  }, [gameStarted, triggerBunnyWalk]);

  // Radar update
  useEffect(() => {
    if (!gameStarted) return;

    const interval = setInterval(() => {
      const settings = settingsRef.current;
      const player = playerStateRef.current;

      // Find sad bunnies
      settings.sadBunnies = settings.bunnies
        .filter((el) => el.sad)
        .map((el) => ({
          el,
          distance: distanceBetween(el, player),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5);

      // Update indicators
      bunnyPosRefs.current.forEach((indicator, i) => {
        const bunny = settings.sadBunnies[i]?.el;
        if (bunny && indicator) {
          const angle = radToDeg(Math.atan2(bunny.y - player.y, bunny.x - player.x)) - 90;
          const distance = distanceBetween(bunny, player);
          indicator.innerHTML = `<div class="bunny-indicator" style="transform: rotate(${-angle}deg)">${distance - 40}px</div>`;
          indicator.style.setProperty('--size', px(distance > settings.bunnyRadarSize / 2 ? settings.bunnyRadarSize : distance));
          indicator.style.transform = `rotate(${angle}deg)`;
          indicator.classList.remove('d-none');
        } else if (indicator) {
          indicator.classList.add('d-none');
        }
      });
    }, 500);

    return () => clearInterval(interval);
  }, [gameStarted]);

  // Window resize
  useEffect(() => {
    const handleResize = () => {
      updateOffset();
      positionMap();
      if (mapRef.current) {
        setPos(mapRef.current, settingsRef.current.map.x, settingsRef.current.map.y);
      }

      // Resize radar
      const { innerWidth: w, innerHeight: h } = window;
      const size = Math.min(w, h) - 20;
      settingsRef.current.bunnyRadarSize = size;
      if (circleRef.current) {
        circleRef.current.style.width = px(size);
        circleRef.current.style.height = px(size);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('focus', () => { settingsRef.current.isWindowActive = true; });
    window.addEventListener('blur', () => { settingsRef.current.isWindowActive = false; });

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [positionMap, updateOffset]);

  return (
    <div className="hugme-game">
      {/* Menu */}
      {!gameStarted && (
        <div className="hugme-menu">
          <h1>🐰 Hug Me</h1>
          <p className="game-description">Find and hug all the sad bunnies!</p>
          <div className="menu-stats">
            <div className="stat-item">🏆 Best: {highScore}</div>
            <div className="stat-item">💰 Coins: {totalCoins}</div>
          </div>
          <button onClick={startGame} className="menu-btn play-btn">🎮 Play</button>
          <button onClick={() => navigate('/games')} className="menu-btn back-btn">← Back</button>
        </div>
      )}

      {/* Game Won */}
      {gameWon && (
        <div className="hugme-menu" ref={endMessageRef}>
          <h1>🎉 Hooray!</h1>
          <p className="game-description">You hugged all the sad bunnies!</p>
          <div className="result-stats">
            <div className="result-item">⭐ Score: {score}</div>
            <div className="result-item">⏱️ Time: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</div>
            <div className="result-item">💰 Coins: +{coins}</div>
            {score >= highScore && <div className="new-record">🎊 NEW RECORD!</div>}
          </div>
          <button onClick={startGame} className="menu-btn play-btn">🔄 Play Again</button>
          <button onClick={() => navigate('/games')} className="menu-btn back-btn">← Back</button>
        </div>
      )}

      {/* Game */}
      {gameStarted && !gameWon && (
        <div className="hugme-wrapper" ref={gameRef} onClick={handleClick}>
          {/* Bunny Radar */}
          <div className="bunny-radar">
            <div className="circle" ref={circleRef}>
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bunny-pos d-none"
                  ref={(el) => { if (el) bunnyPosRefs.current[i] = el; }}
                />
              ))}
            </div>
          </div>

          {/* Map */}
          <div className="map-cover overflow-hidden">
            <div className="map" ref={mapRef} style={{ width: px(settingsRef.current.map.w), height: px(settingsRef.current.map.h) }}>
              <div className="player-wrapper flex-center">
                <div className="player sprite-container" ref={playerRef}>
                  <div className="bear sprite"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Game HUD */}
          <div className="game-hud">
            <div className="hud-left">
              <div className="hud-score">⭐ {score}</div>
              <div className="hud-coins">💰 {coins}</div>
            </div>
            <div className="hud-center">
              <div className="hud-timer">⏱️ {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</div>
              {combo > 1 && <div className="hud-combo">🔥 x{combo}</div>}
            </div>
            <div className="hud-right">
              <div className={`indicator ${sadCount === 0 ? 'happy' : ''}`} ref={indicatorRef}>
                {sadCount > 0 ? `🐰 x ${sadCount}` : ''}
              </div>
            </div>
          </div>

          {/* Back button */}
          <button className="hugme-back-btn" onClick={(e) => { e.stopPropagation(); navigate('/games'); }}>
            ← Back
          </button>
        </div>
      )}
    </div>
  );
};

export default HugMe;
