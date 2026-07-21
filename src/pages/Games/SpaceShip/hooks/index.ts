// src/pages/Games/SpaceShip/hooks/index.ts

export { useGameState } from './useGameState';
export { useGameLoop } from './useGameLoop';
export { usePlayer } from './usePlayer';
export { useEnemies } from './useEnemies';
export { useBonuses } from './useBonuses';
export { useLaser } from './useLaser';
export { useObstacles } from './useObstacles';
export { useKeyboardControls } from './useKeyboardControls';
export { useExplosions } from './useExplosions';

// ✅ НОВЫЕ ХУКИ - ДОБАВЬ ЭТИ СТРОКИ
export { useCleanup } from './useCleanup';
export { useGameEnd } from './useGameEnd';
export { useGameStart } from './useGameStart';
export { useDamage } from './useDamage';
export { useShop } from './useShop';
export { useAuth } from './useAuth';
export { useTouchControls } from './useTouchControls';
export { useResize } from './useResize';
export { useGameInit } from './useGameInit';