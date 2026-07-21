// src/pages/Games/SpaceShip/hooks/usePlayer.ts

import { useCallback } from 'react';
import { GameData } from '../types';
import { SHIP_CONFIGS } from '../config';
import { InputManager } from '../utils/inputManager'; 

interface UsePlayerProps {
  gameDataRef: React.MutableRefObject<GameData | null>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  imagesRef: React.MutableRefObject<Record<string, HTMLImageElement>>;
  currentShip: string;
  inputManager: InputManager; 
}

export const usePlayer = ({ 
  gameDataRef, 
  canvasRef, 
  imagesRef, 
  currentShip,
  inputManager, 
}: UsePlayerProps) => {
  const movePlayer = useCallback((delta: number) => {
    const data = gameDataRef.current;
    const canvas = canvasRef.current;
    if (!data || !canvas || !data.gameRunning) return;

    const player = data.player;
    const speed = player.speed * delta;

    // ✅ Используем InputManager вместо data.keys
    const keys = inputManager.getKeys();
    if (keys['ArrowLeft'] || keys['a']) player.x -= speed;
    if (keys['ArrowRight'] || keys['d']) player.x += speed;
    if (keys['ArrowUp'] || keys['w']) player.y -= speed;
    if (keys['ArrowDown'] || keys['s']) player.y += speed;

    // ✅ Используем InputManager для тача
    const touch = inputManager.getTouchPosition();
    if (touch.x !== null && touch.y !== null) {
      const dx = touch.x - player.x - player.width / 2;
      const dy = touch.y - player.y - player.height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 10) {
        player.x += (dx / dist) * Math.min(speed, dist);
        player.y += (dy / dist) * Math.min(speed, dist);
      }
    }

    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
  }, [gameDataRef, canvasRef, inputManager]); 

  const drawPlayer = useCallback(() => {
    const data = gameDataRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!data || !canvas || !ctx) return;

    const player = data.player;
    const explosionImg = imagesRef.current.explosion;
    
    let shipKey = 'ship';
    if (currentShip === 'redShip') shipKey = 'redShip';
    else if (currentShip === 'elonShip') shipKey = 'elonShip';
    else if (currentShip === 'default') shipKey = 'ship';
    
    const shipImg = imagesRef.current[shipKey];

    let shipWidth = player.width;
    let shipHeight = player.height;
    
    const config = SHIP_CONFIGS[currentShip as keyof typeof SHIP_CONFIGS];
    if (config) {
      shipWidth = player.width * config.width;
      shipHeight = player.height * config.height;
    }

    // ВЗРЫВ ИГРОКА
    if (data.playerExplosion) {
      const exp = data.playerExplosion;
      const progress = (Date.now() - exp.startTime) / exp.duration;
      
      if (progress >= 1) {
        data.playerExplosion = null;
        return;
      }

      const alpha = 1 - progress;
      const scale = 1 + progress * 1.5;
      
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(exp.x + exp.width / 2, exp.y + exp.height / 2);
      
      if (explosionImg && explosionImg.complete) {
        const w = exp.width * scale;
        const h = exp.height * scale;
        ctx.drawImage(explosionImg, -w / 2, -h / 2, w, h);
      } else {
        const size = Math.max(exp.width, exp.height) / 2 * scale;
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
        gradient.addColorStop(0, `rgba(255, 255, 200, ${alpha})`);
        gradient.addColorStop(0.3, `rgba(255, 200, 50, ${alpha * 0.8})`);
        gradient.addColorStop(0.7, `rgba(255, 100, 0, ${alpha * 0.5})`);
        gradient.addColorStop(1, `rgba(200, 50, 0, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
      return;
    }

    if (!data.gameRunning) {
      return;
    }

    // ЩИТ
    if (data.hasShield) {
      const now = Date.now();
      ctx.strokeStyle = `rgba(0, 200, 255, ${0.3 + 0.3 * Math.sin(now / 200)})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(
        player.x + player.width/2,
        player.y + player.height/2,
        Math.max(player.width, player.height) / 2 + 10,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }

    if (shipImg && shipImg.complete) {
      const x = player.x + (player.width - shipWidth) / 2;
      const y = player.y + (player.height - shipHeight) / 2;
      ctx.drawImage(shipImg, x, y, shipWidth, shipHeight);
    } else {
      ctx.fillStyle = '#4d96ff';
      ctx.fillRect(player.x, player.y, player.width, player.height);
      ctx.fillStyle = '#6db3ff';
      ctx.fillRect(player.x + 10, player.y - 10, 10, 20);
      ctx.fillRect(player.x + player.width - 20, player.y - 10, 10, 20);
    }
  }, [gameDataRef, canvasRef, imagesRef, currentShip]);

  return {
    movePlayer,
    drawPlayer,
  };
};