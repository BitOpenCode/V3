import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HugMe.css';

const HugMe: React.FC = () => {
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mapCoverRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const endMessageRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const bunnyPosRefs = useRef<HTMLDivElement[]>([]);

  const [gameStarted, setGameStarted] = useState(false);

  const elementsRef = useRef<any>(null);
  const playerRef_state = useRef<any>(null);
  const settingsRef = useRef<any>(null);

  useEffect(() => {
    if (!gameStarted || !wrapperRef.current || !mapRef.current || !playerRef.current) return;

    // Initialize elements - exactly like original
    const elements = {
      wrapper: wrapperRef.current,
      mapCover: mapCoverRef.current,
      indicator: indicatorRef.current,
      player: playerRef.current,
      bunnyRadar: circleRef.current,
      bunnyPos: [],
      endMessage: endMessageRef.current,
      button: buttonRef.current
    };
    elementsRef.current = elements;

    // Helper functions - exactly like original
    const radToDeg = (rad: number) => Math.round(rad * (180 / Math.PI));
    const distanceBetween = (a: any, b: any) => Math.round(Math.sqrt(Math.pow((a.x - b.x), 2) + Math.pow((a.y - b.y), 2)));
    const randomN = (max: number) => Math.ceil(Math.random() * max);
    const px = (n: number) => `${n}px`;
    const setPos = ({ el, x, y }: any) => {
      Object.assign(el.style, { left: `${x}px`, top: `${y}px` });
    };

    const setSize = ({ el, w, h, d }: any) => {
      const m = d || 1;
      if (w) el.style.width = px(w * m);
      if (h) el.style.height = px(h * m);
    };

    // Initialize player - exactly like original
    const player = {
      id: 'bear',
      x: 0,
      y: 0,
      frameOffset: 1,
      animationTimer: null as any,
      el: elements.player,
      sprite: {
        el: elements.player.childNodes[0] as HTMLElement,
        x: 0,
        y: 0
      },
      walkingDirection: '',
      walkingInterval: null as any,
      pause: false,
      buffer: 20,
      move: { x: 0, y: 0 }
    };
    playerRef_state.current = player;

    // Initialize settings - exactly like original
    const settings = {
      d: 20,
      offsetPos: { x: 0, y: 0 },
      elements: [] as any[],
      bunnies: [] as any[],
      map: {
        el: mapRef.current,
        walls: [],
        w: 20 * 200,
        h: 20 * 200,
        x: 0,
        y: 0,
      },
      transitionTimer: null as any,
      isWindowActive: true,
      controlPos: { x: 0, y: 0 },
      bunnyRadarSize: 0,
      sadBunnies: [] as any[]
    };
    settingsRef.current = settings;

    // Resize bunny radar - exactly like original
    const resizeBunnyRadar = () => {
      const { innerWidth: w, innerHeight: h } = window;
      const size = w > h ? h : w;
      settings.bunnyRadarSize = size - 20;
      ['width', 'height'].forEach((param: any) => {
        (elements.bunnyRadar as HTMLElement).style[param] = px(settings.bunnyRadarSize);
      });
    };

    // Trigger bunny walk - exactly like original
    const triggerBunnyWalk = (bunny: any) => {
      bunny.animationTimer = setInterval(() => {
        if (!settings.isWindowActive) return;
        const dir = ['up', 'down', 'right', 'left'][Math.floor(Math.random() * 4)];
        const { d } = settings;

        bunny.move = {
          down: { x: 0, y: d },
          up: { x: 0, y: -d },
          right: { x: d, y: 0 },
          left: { x: -d, y: 0 }
        }[dir];

        walk(bunny, dir);
        setTimeout(() => walk(bunny, dir), 300);
        setTimeout(() => walk(bunny, dir), 600);
        setTimeout(() => stopSprite(bunny), 900);
      }, 2000);
    };

    const getRandomPos = (key: 'w' | 'h') => 20 * randomN((settings.map[key] / 20) - 1);

    // Add bunny - exactly like original
    const addBunny = () => {
      const bunny = {
        id: `bunny-${settings.bunnies.length + 1}`,
        x: getRandomPos('w'),
        y: getRandomPos('h'),
        frameOffset: 1,
        animationTimer: null as any,
        el: Object.assign(document.createElement('div'), {
          className: 'sprite-container sad',
          innerHTML: '<div class="bunny sprite"></div>'
        }),
        sprite: {
          el: null as any,
          x: 0,
          y: 0
        },
        sad: true,
        buffer: 30,
        move: { x: 0, y: 0 },
        walkingInterval: null as any
      };
      settings.bunnies.push(bunny);
      settings.map.el.appendChild(bunny.el);
      bunny.sprite.el = bunny.el.childNodes[0] as HTMLElement;
      bunny.el.style.zIndex = String(bunny.y);
      setPos(bunny);
      if (randomN(2) === 2) triggerBunnyWalk(bunny);
    };

    // Add tree - exactly like original
    const addTree = () => {
      const tree = {
        id: `tree-${settings.elements.length + 1}`,
        x: getRandomPos('w'),
        y: getRandomPos('h'),
        el: Object.assign(document.createElement('div'), {
          className: 'tree',
          innerHTML: '<div></div>'
        }),
        buffer: 40,
      };
      settings.elements.push(tree);
      settings.map.el.appendChild(tree.el);
      tree.el.style.zIndex = String(tree.y);
      setPos(tree);
    };

    // Set background position - exactly like original
    const setBackgroundPos = ({ el, x, y }: any) => {
      el.style.setProperty('--bx', px(x));
      el.style.setProperty('--by', px(y));
    };

    // Animate sprite - exactly like original
    const animateSprite = (actor: any, dir: string) => {
      const h = -32 * 2;
      actor.sprite.y = {
        down: 0,
        up: h,
        right: h * 2,
        left: h * 3
      }[dir];
      actor.frameOffset = actor.frameOffset === 1 ? 2 : 1;
      actor.sprite.x = actor.frameOffset * (2 * -20);
      setBackgroundPos(actor.sprite);
    };

    // Trigger bunny message - exactly like original
    const triggerBunnyMessage = (bunny: any, classToAdd: string) => {
      bunny.el.setAttribute('message', ['thanks!', 'Luv u!', 'yeah!', '^ _ ^', 'thank you!'][randomN(5) - 1]);
      bunny.el.classList.add(classToAdd);
      setTimeout(() => {
        bunny.el.classList.remove(classToAdd);
      }, 800);
    };

    // Update sad bunny count - exactly like original
    const updateSadBunnyCount = () => {
      const sadBunnyCount = settings.bunnies.filter(b => b.sad).length;
      if (elements.indicator) {
        elements.indicator.innerHTML = sadBunnyCount ? `x ${sadBunnyCount}` : '';
        if (!sadBunnyCount) {
          elements.endMessage?.classList.remove('d-none');
          elements.indicator.classList.add('happy');
        }
      }
    };

    // Hug bunny - exactly like original
    const hugBunny = (bunny: any) => {
      const classToAdd = bunny.x > player.x ? 'hug-bear-bunny' : 'hug-bunny-bear';
      player.el.classList.add('d-none');
      bunny.el.classList.add(classToAdd);
      clearInterval(bunny.animationTimer);
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
      settings.map.el.classList.add('slow-transition');
      setPos(settings.map);
      (player.el.parentNode as HTMLElement).style.zIndex = String(player.y);

      setTimeout(() => {
        player.el.classList.remove('d-none');
        [classToAdd, 'sad'].forEach(c => bunny.el.classList.remove(c));
        stopSprite(bunny);
        triggerBunnyWalk(bunny);
        player.pause = false;
        settings.map.el.classList.remove('slow-transition');
        triggerBunnyMessage(bunny, classToAdd === 'hug-bear-bunny' ? 'happy-left' : 'happy-right');
        updateSadBunnyCount();
      }, 1800);
    };

    // No wall check - exactly like original
    const noWall = (actor: any) => {
      const newPos = { ...actor };
      newPos.x += actor.move.x;
      newPos.y += actor.move.y;
      if (actor === player && !player.pause) {
        const bunnyToHug = settings.bunnies.find((el: any) => el.sad && el.id !== actor.id && distanceBetween(el, newPos) <= el.buffer);
        if (bunnyToHug) {
          hugBunny(bunnyToHug);
          stopSprite(player);
          return;
        }
      }
      if ([
        ...settings.bunnies.filter((el: any) => el.id !== actor.id),
        ...settings.elements
      ].some((el: any) => {
        return distanceBetween(el, newPos) <= el.buffer
          && distanceBetween(el, actor) > el.buffer;
      })) return;

      const buffer = 40;
      const noWallX = actor.move.x > 0
        ? newPos.x + buffer < settings.map.w
        : newPos.x - buffer > 0;
      const noWallY = actor.move.y > 0
        ? newPos.y < settings.map.h - buffer
        : newPos.y - buffer > 0;

      return noWallX && noWallY;
    };

    // Walk - exactly like original
    const walk = (actor: any, dir: string) => {
      if (!dir || player.pause || !settings.isWindowActive) return;
      if (noWall(actor)) {
        animateSprite(actor, dir);
        actor.x += actor.move.x;
        actor.y += actor.move.y;
        if (actor === player) {
          positionMap();
          setPos(settings.map);
          (player.el.parentNode as HTMLElement).style.zIndex = String(player.y);
        } else {
          setPos(actor);
          actor.el.style.zIndex = String(actor.y);
        }
      } else {
        stopSprite(actor);
      }
    };

    // Update offset - exactly like original
    const updateOffset = () => {
      const { width, height } = elements.wrapper.getBoundingClientRect();
      settings.offsetPos = {
        x: (width / 2),
        y: (height / 2),
      };
    };

    // Position map - exactly like original
    const positionMap = () => {
      settings.map.x = settings.offsetPos.x - player.x;
      settings.map.y = settings.offsetPos.y - player.y;
    };

    // Resize and reposition map - exactly like original
    const resizeAndRepositionMap = () => {
      settings.map.el.classList.add('transition');
      clearTimeout(settings.transitionTimer);
      settings.transitionTimer = setTimeout(() => {
        settings.map.el.classList.remove('transition');
      }, 500);
      updateOffset();
      positionMap();
      setPos(settings.map);
    };

    // Stop sprite - exactly like original
    const stopSprite = (actor: any) => {
      actor.sprite.x = 0;
      setBackgroundPos(actor.sprite);
      clearInterval(actor.walkingInterval);
    };

    // Handle walk - exactly like original
    const handleWalk = () => {
      let dir = 'right';
      const { d } = settings;

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

        player.move.x || player.move.y
          ? walk(player, dir)
          : stopSprite(player);
      }, 150);
    };

    // Initialize player position - exactly like original
    player.x = getRandomPos('w');
    player.y = getRandomPos('h');
    player.el.style.zIndex = String(player.y);
    setSize(settings.map);

    // Click handler - exactly like original
    const handleClick = (e: any) => {
      stopSprite(player);
      const { left, top } = settings.map.el.getBoundingClientRect();

      if (e.targetTouches) {
        settings.controlPos = {
          x: e.targetTouches[0].pageX - left,
          y: e.targetTouches[0].pageY - top
        };
      } else {
        settings.controlPos = {
          x: e.pageX - left,
          y: e.pageY - top
        };
      }

      handleWalk();
    };

    // El angle - exactly like original
    const elAngle = (pos: any) => {
      const { x, y } = pos;
      const angle = radToDeg(Math.atan2(y - player.y, x - player.x)) - 90;
      return Math.round(angle);
    };

    // Create bunny pos indicators - exactly like original
    new Array(5).fill('').forEach(() => {
      const bunnyPos = Object.assign(document.createElement('div'), { className: 'bunny-pos' });
      elements.bunnyPos.push(bunnyPos);
      elements.bunnyRadar?.appendChild(bunnyPos);
    });

    // Find sad bunnies - exactly like original
    const findSadBunnies = () => {
      settings.sadBunnies = settings.bunnies.filter((el: any) => el.sad).map((el: any) => {
        return {
          el,
          distance: distanceBetween(el, player)
        };
      }).sort((a: any, b: any) => a.distance - b.distance);
      if (settings.sadBunnies.length > 5) settings.sadBunnies.length = 5;
    };

    // Update bunny radar - exactly like original
    const radarInterval = setInterval(() => {
      findSadBunnies();
      elements.bunnyPos.forEach((indicator: any, i: number) => {
        const bunny = settings.sadBunnies[i]?.el;
        if (bunny) {
          const angle = elAngle(bunny);
          const distance = distanceBetween(bunny, player);
          indicator.innerHTML = `<div class="bunny-indicator" style="transform: rotate(${angle * -1}deg)">${distance - 40}px</div>`;
          indicator.style.setProperty('--size', px(distance > (settings.bunnyRadarSize / 2) ? settings.bunnyRadarSize : distance));
          indicator.style.transform = `rotate(${angle}deg)`;
        }
        indicator.classList[bunny ? 'remove' : 'add']('d-none');
      });
    }, 500);

    // Window event listeners - exactly like original
    const handleFocus = () => { settings.isWindowActive = true; };
    const handleBlur = () => { settings.isWindowActive = false; };
    const handleResize = () => {
      resizeAndRepositionMap();
      resizeBunnyRadar();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('resize', handleResize);

    // Initial setup
    resizeAndRepositionMap();
    resizeBunnyRadar();

    // Add bunnies and trees - exactly like original
    new Array(45).fill('').forEach(() => addBunny());
    new Array(100).fill('').forEach(() => addTree());
    updateSadBunnyCount();

    // Add click listener - exactly like original (on document!)
    document.addEventListener('click', handleClick);
    document.addEventListener('touchstart', handleClick as any);

    // Play again button - exactly like original
    elements.button?.addEventListener('click', () => {
      window.location.reload();
    });

    // Cleanup
    return () => {
      clearInterval(radarInterval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('touchstart', handleClick as any);
      settings.bunnies.forEach((bunny: any) => {
        if (bunny.animationTimer) clearInterval(bunny.animationTimer);
        if (bunny.walkingInterval) clearInterval(bunny.walkingInterval);
      });
      if (player.walkingInterval) clearInterval(player.walkingInterval);
      if (player.animationTimer) clearInterval(player.animationTimer);
    };
  }, [gameStarted]);

  const startGame = () => {
    setGameStarted(true);
  };

  return (
    <div className="hugme-game">
      {!gameStarted ? (
        <div className="hugme-menu">
          <h1>Hug Me</h1>
          <p>Обнимай грустных зайцев!</p>
          <button className="menu-btn play-btn" onClick={startGame}>🎮 Play</button>
          <button className="menu-btn back-btn" onClick={() => navigate('/games')}>← Back</button>
        </div>
      ) : (
        <>
          <div className="wrapper" ref={wrapperRef}>
            <div className="end-message d-none" ref={endMessageRef}>
              <p>Hooray! But there's no more sad bunnies!</p>
              <button ref={buttonRef}>play again</button>
            </div>
            <div className="bunny-radar">
              <div className="circle" ref={circleRef}></div>
            </div>
            <div className="map-cover overflow-hidden" ref={mapCoverRef}>
              <div className="map" ref={mapRef}>
                <div className="player-wrapper flex-center">
                  <div className="player sprite-container" ref={playerRef}>
                    <div className="bear sprite"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="indicator" ref={indicatorRef}>x 45</div>
          <button className="hugme-back-btn" onClick={() => navigate('/games')}>← Back</button>
        </>
      )}
    </div>
  );
};

export default HugMe;
