// useBonuses.ts - ИСПРАВЛЕННЫЙ

import { useCallback, useRef, useEffect, useMemo } from 'react';
import { GameData, Bonus, Healbox } from '../types';
import { createBonus, createHealbox } from '../utils/spawn';
import { rectCollision } from '../utils/collision';
import { createParticleSystem } from '../utils/particles';
import { useObjectPool } from './useObjectPool';
import { GAME_CONFIG } from '../config';

interface UseBonusesProps {
  gameDataRef: React.MutableRefObject<GameData | null>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  imagesRef: React.MutableRefObject<Record<string, HTMLImageElement>>;
  onLaserBonusPickup?: () => void;
  particleSystem?: ReturnType<typeof createParticleSystem>;
}

export const useBonuses = ({ gameDataRef, canvasRef, imagesRef, onLaserBonusPickup, particleSystem }: UseBonusesProps) => {
  const particleSystemRef = useRef(particleSystem);
  const stableParticleSystem = useMemo(() => particleSystem, [particleSystem]);
  const { getFromPool, returnToPool } = useObjectPool();
  
  useEffect(() => {
    if (particleSystemRef.current !== stableParticleSystem) {
      particleSystemRef.current = stableParticleSystem;
    }
  }, [stableParticleSystem]);

  const spawnBonus = useCallback((type: 'regular' | 'laser' = 'regular') => {
    const data = gameDataRef.current;
    const canvas = canvasRef.current;
    if (!data || !canvas || !data.gameRunning) return;
    if (data.bonuses.length >= GAME_CONFIG.maxBonuses) return;

    let bonus = getFromPool('bonuses') as Bonus | null;
    
    if (bonus) {
      const size = type === 'laser' ? 30 : 20;
      bonus.x = Math.random() * (canvas.width - size);
      bonus.y = -size;
      bonus.width = size;
      bonus.height = size;
      bonus.speed = 3;
      bonus.type = type;
      bonus.active = true;
    } else {
      bonus = createBonus(canvas.width, type);
      bonus.active = true;
    }
    
    data.bonuses.push(bonus);
  }, [gameDataRef, canvasRef, getFromPool]);

  const spawnHealbox = useCallback(() => {
    const data = gameDataRef.current;
    const canvas = canvasRef.current;
    if (!data || !canvas || !data.gameRunning) return;
    if (data.healboxes.length >= GAME_CONFIG.maxHealboxes) return;

    let healbox = getFromPool('healboxes') as Healbox | null;
    
    if (healbox) {
      const size = 30;
      healbox.x = Math.random() * (canvas.width - size);
      healbox.y = -size;
      healbox.width = size;
      healbox.height = size;
      healbox.speed = Math.abs(data.speed);
      healbox.active = true;
    } else {
      healbox = createHealbox(canvas.width, data.speed);
      healbox.active = true;
    }
    
    data.healboxes.push(healbox);
  }, [gameDataRef, canvasRef, getFromPool]);

  const updateBonuses = useCallback(() => {
    const data = gameDataRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!data || !canvas || !ctx) return;

    const bonusImg = imagesRef.current.bonus;
    const goldBonusImg = imagesRef.current.goldBonus;
    const healboxImg = imagesRef.current.healbox;

    for (let i = data.bonuses.length - 1; i >= 0; i--) {
      const bonus = data.bonuses[i];
      bonus.y += Math.abs(data.speed);

      if (bonus.y > canvas.height + 20) {
        returnToPool('bonuses', bonus);
        data.bonuses.splice(i, 1);
        continue;
      }

      if (bonus.y > -20 && bonus.y < canvas.height + 20) {
        const img = bonus.type === 'laser' ? goldBonusImg : bonusImg;
        if (img && img.complete) {
          ctx.drawImage(img, bonus.x, bonus.y, bonus.width, bonus.height);
        } else {
          ctx.fillStyle = bonus.type === 'laser' ? '#ffd700' : '#00ff00';
          ctx.fillRect(bonus.x, bonus.y, bonus.width, bonus.height);
        }
      }

      const player = data.player;
      if (rectCollision(
        bonus.x, bonus.y, bonus.width, bonus.height,
        player.x, player.y, player.width, player.height
      )) {
        if (particleSystemRef.current) {
          particleSystemRef.current.addPickupEffect(
            bonus.x + bonus.width / 2,
            bonus.y + bonus.height / 2,
            bonus.type === 'laser' ? '#ffd700' : '#4d96ff'
          );
        }

        if (bonus.type === 'laser') {
          if (onLaserBonusPickup) onLaserBonusPickup();
        } else {
          data.shopCurrency++;
          data.score += 10;
        }
        returnToPool('bonuses', bonus);
        data.bonuses.splice(i, 1);
      }
    }

    for (let i = data.healboxes.length - 1; i >= 0; i--) {
      const healbox = data.healboxes[i];
      healbox.y += Math.abs(data.speed);

      if (healbox.y > canvas.height + 20) {
        returnToPool('healboxes', healbox);
        data.healboxes.splice(i, 1);
        continue;
      }

      if (healbox.y > -20 && healbox.y < canvas.height + 20) {
        if (healboxImg && healboxImg.complete) {
          ctx.drawImage(healboxImg, healbox.x, healbox.y, healbox.width, healbox.height);
        } else {
          ctx.fillStyle = '#00ff00';
          ctx.fillRect(healbox.x, healbox.y, healbox.width, healbox.height);
        }
      }

      const player = data.player;
      if (rectCollision(
        healbox.x, healbox.y, healbox.width, healbox.height,
        player.x, player.y, player.width, player.height
      )) {
        if (particleSystemRef.current) {
          particleSystemRef.current.addPickupEffect(
            healbox.x + healbox.width / 2,
            healbox.y + healbox.height / 2,
            '#22c55e'
          );
        }
        data.lives = Math.min(data.lives + 1, 5);
        returnToPool('healboxes', healbox);
        data.healboxes.splice(i, 1);
      }
    }
  }, [gameDataRef, canvasRef, imagesRef, onLaserBonusPickup, getFromPool, returnToPool]); // ← ТУТ ЖЕЛТОЕ

  return {
    spawnBonus,
    spawnHealbox,
    updateBonuses,
  };
};