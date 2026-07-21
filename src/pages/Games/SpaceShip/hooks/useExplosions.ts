// src/pages/Games/SpaceShip/hooks/useExplosions.ts

import { useCallback } from 'react';
import { GameData } from '../types';

interface UseExplosionsProps {
  gameDataRef: React.MutableRefObject<GameData | null>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  imagesRef: React.MutableRefObject<Record<string, HTMLImageElement>>;
}

export const useExplosions = ({ gameDataRef, canvasRef, imagesRef }: UseExplosionsProps) => {
  
  const addExplosion = useCallback((x: number, y: number, width: number, height: number, duration: number = 500) => {
    const data = gameDataRef.current;
    if (!data) return;
    
    data.explosions.push({
      x: x - width/2,
      y: y - height/2,
      width: width,
      height: height,
      alpha: 1,
      startTime: Date.now(),
      duration: duration,
    });
  }, [gameDataRef]);

  const updateExplosions = useCallback(() => {
    const data = gameDataRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!data || !canvas || !ctx) return;

    const explosionImg = imagesRef.current.explosion;
    const now = Date.now();

    for (let i = data.explosions.length - 1; i >= 0; i--) {
      const exp = data.explosions[i];
      const progress = (now - exp.startTime) / (exp.duration || 500);
      
      if (progress >= 1) {
        data.explosions.splice(i, 1);
        continue;
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
        const radius = Math.max(exp.width, exp.height) / 2 * scale;
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
        gradient.addColorStop(0, `rgba(255, 255, 200, ${alpha})`);
        gradient.addColorStop(0.3, `rgba(255, 200, 50, ${alpha * 0.8})`);
        gradient.addColorStop(0.7, `rgba(255, 100, 0, ${alpha * 0.5})`);
        gradient.addColorStop(1, `rgba(200, 50, 0, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    }
  }, [gameDataRef, canvasRef, imagesRef]);

  return {
    addExplosion,
    updateExplosions,
  };
};