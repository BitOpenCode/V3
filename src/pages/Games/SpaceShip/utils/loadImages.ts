// src/pages/Games/SpaceShip/utils/loadImages.ts

import { GAME_IMAGES } from '../config';

export const loadImages = (imagesRef: React.MutableRefObject<Record<string, HTMLImageElement>>) => {
  const imagePaths = {
    ship: GAME_IMAGES.ship,
    meteor: GAME_IMAGES.meteor,
    laser: GAME_IMAGES.laser,
    bonus: GAME_IMAGES.bonus,
    goldBonus: GAME_IMAGES.goldBonus,
    enemyShip: GAME_IMAGES.enemyShip,
    explosion: GAME_IMAGES.explosion,
    healbox: GAME_IMAGES.healbox,
    redShip: GAME_IMAGES.redShip,
    elonShip: GAME_IMAGES.elonShip,
  };

  // ✅ СОЗДАЕМ ОБЪЕКТ ДЛЯ ВОЗВРАТА
  const loadedImages: Record<string, HTMLImageElement> = {};

  Object.entries(imagePaths).forEach(([key, src]) => {
    const img = new Image();
    img.src = src;
    loadedImages[key] = img;      // ← Сохраняем для возврата
    imagesRef.current[key] = img; // ← Сохраняем в ref
  });

  // ✅ ВОЗВРАЩАЕМ ИЗОБРАЖЕНИЯ
  return loadedImages;
};