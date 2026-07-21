// src/pages/Games/SpaceShip/hooks/useHUD.ts

import { useRef, useCallback } from 'react';
import { GameData } from '../types';

export const useHUD = (gameDataRef: React.MutableRefObject<GameData | null>) => {
  const cacheRef = useRef({
    score: -1,
    lives: -1,
    distance: -1,
    enemies: -1,
    speed: -1,
    shield: '',  // ← ДОБАВЛЕНО
    fps: -1,
  });

  const updateHUD = useCallback(() => {
    const data = gameDataRef.current;
    if (!data) return;

    const scoreEl = document.getElementById('score-hud');
    const livesEl = document.getElementById('lives-hud');
    const distanceEl = document.getElementById('distance-hud');
    const enemiesEl = document.getElementById('enemies-hud');
    const speedEl = document.getElementById('speed-hud');
    const shieldEl = document.getElementById('shield-hud');
    const fpsEl = document.getElementById('fps-hud');

    if (scoreEl && cacheRef.current.score !== data.score) {
      scoreEl.textContent = `Score: ${data.score}`;
      cacheRef.current.score = data.score;
    }
    
    if (livesEl && cacheRef.current.lives !== data.lives) {
      livesEl.textContent = `Lives: ${data.lives}`;
      cacheRef.current.lives = data.lives;
    }
    
    if (distanceEl && cacheRef.current.distance !== Math.floor(data.distance)) {
      distanceEl.textContent = `Distance: ${Math.floor(data.distance)}`;
      cacheRef.current.distance = Math.floor(data.distance);
    }
    
    if (enemiesEl && cacheRef.current.enemies !== data.enemiesDestroyed) {
      enemiesEl.textContent = `Enemies: ${data.enemiesDestroyed}`;
      cacheRef.current.enemies = data.enemiesDestroyed;
    }

    if (speedEl && cacheRef.current.speed !== data.speedLevel) {
      speedEl.textContent = `Speed: ${data.speedLevel}`;
      cacheRef.current.speed = data.speedLevel;
    }

    if (shieldEl) {
      const shieldActive = data.hasShield && data.shieldStartTime !== null;
      let shieldText = '🛡️ OFF';
      if (shieldActive) {
        const elapsed = (Date.now() - (data.shieldStartTime || 0)) / 1000;
        const remaining = Math.max(0, 5 - elapsed);
        shieldText = `🛡️ ${remaining.toFixed(1)}s`;
      }
      if (cacheRef.current.shield !== shieldText) {
        shieldEl.textContent = shieldText;
        cacheRef.current.shield = shieldText;
      }
    }

    if (fpsEl) {
      // FPS обновляется в SpaceShip.tsx
    }
  }, [gameDataRef]);

  return { updateHUD };
};