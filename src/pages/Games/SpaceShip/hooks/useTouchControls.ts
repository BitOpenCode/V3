// src/pages/Games/SpaceShip/hooks/useTouchControls.ts

import { useCallback } from 'react';
import { GameData } from '../types';
import { InputManager } from '../utils/inputManager';

interface UseTouchControlsProps {
  gameDataRef: React.MutableRefObject<GameData | null>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  inputManager: InputManager; // ← ДОБАВИТЬ
}

export const useTouchControls = ({ 
  gameDataRef,
  canvasRef,
  inputManager, // ← ПРИНЯТЬ
}: UseTouchControlsProps) => {
  
  const handleTouch = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const data = gameDataRef.current;
    if (!data || !data.gameRunning) return;

    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!touch || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    // ✅ Обновляем InputManager
    inputManager.setTouchPosition(x, y);
    
    // Для совместимости (если нужно)
    data.touchX = x;
    data.touchY = y;
  }, [gameDataRef, canvasRef, inputManager]);

  const handleTouchEnd = useCallback(() => {
    const data = gameDataRef.current;
    if (data) {
      inputManager.setTouchPosition(null, null);
      data.touchX = null;
      data.touchY = null;
    }
  }, [gameDataRef, inputManager]);

  return { handleTouch, handleTouchEnd };
};