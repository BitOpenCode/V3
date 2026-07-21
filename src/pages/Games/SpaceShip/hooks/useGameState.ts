// src/pages/Games/SpaceShip/hooks/useGameState.ts

import { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, ShipUpgrades } from '../types';
import { SHIP_CONFIGS } from '../config';

const STORAGE_KEY = 'spaceship-';

interface SavedGameData {
  score?: number;
  lives?: number;
  distance?: number;
  enemiesDestroyed?: number;
  highScore?: number;
  shopCurrency?: number;
  currentShip?: string;
  ownedShips?: string[];
  ownedUpgrades?: string[];
  shipUpgrades?: ShipUpgrades;
}

export const useGameState = (userId: string) => {
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
  const [ownedUpgrades, setOwnedUpgrades] = useState<string[]>([]);
  const [shipUpgrades, setShipUpgrades] = useState<ShipUpgrades>({});
  const [currentSpeedLevel, setCurrentSpeedLevel] = useState(1);
  
  const isLoadedRef = useRef(false);
  const isSavingRef = useRef(false);

  // Загрузка сохранённого состояния
  const loadGameState = useCallback((id: string) => {
    if (!id || isLoadedRef.current) return;
    
    const saved = localStorage.getItem(`${STORAGE_KEY}${id}`);
    if (saved) {
      try {
        const data: SavedGameData = JSON.parse(saved);
        setGameState(prev => ({ ...prev, ...data }));
        setCurrentShip(data.currentShip || 'default');
        setOwnedShips(data.ownedShips || ['default']);
        setOwnedUpgrades(data.ownedUpgrades || []);
        setShipUpgrades(data.shipUpgrades || {});
        isLoadedRef.current = true;
      } catch (e) {
        console.error('Failed to load game state:', e);
      }
    }
  }, []);

  // Сохранение состояния — исправлено
  const saveGameState = useCallback((
    state: Partial<GameState>,
    ship?: string,
    owned?: string[],
    upgrades?: string[],
    shipUpgs?: ShipUpgrades
  ) => {
    if (!userId || isSavingRef.current) return;
    
    isSavingRef.current = true;

    const data: SavedGameData = {
      ...gameState,
      ...state,
      currentShip: ship || currentShip,
      ownedShips: owned || ownedShips,
      ownedUpgrades: upgrades !== undefined ? upgrades : ownedUpgrades,
      shipUpgrades: shipUpgs !== undefined ? shipUpgs : shipUpgrades,
    };

    try {
      localStorage.setItem(`${STORAGE_KEY}${userId}`, JSON.stringify(data));
      setGameState(prev => {
        const newState = { ...prev, ...state };
        if (JSON.stringify(prev) === JSON.stringify(newState)) {
          return prev;
        }
        return newState;
      });
    } catch (e) {
      console.error('Failed to save game state:', e);
    } finally {
      isSavingRef.current = false;
    }
  }, [gameState, userId, currentShip, ownedShips, ownedUpgrades, shipUpgrades]);

  // Получение жизней корабля
  const getShipLives = useCallback((shipType: string): number => {
    return (SHIP_CONFIGS[shipType as keyof typeof SHIP_CONFIGS]?.lives) || 3;
  }, []);

  // Получение уровня корабля
  const getShipLevel = useCallback((shipType: string): number => {
    return (SHIP_CONFIGS[shipType as keyof typeof SHIP_CONFIGS]?.level) || 1;
  }, []);

  // Сброс состояния игры
  const resetGameState = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      score: 0,
      lives: getShipLives(currentShip),
      distance: 0,
      enemiesDestroyed: 0,
    }));
    setCurrentSpeedLevel(1);
  }, [currentShip, getShipLives]);

  // Сброс флага загрузки при смене пользователя
  useEffect(() => {
    isLoadedRef.current = false;
  }, [userId]);

  return {
    gameState,
    setGameState,
    currentShip,
    setCurrentShip,
    ownedShips,
    setOwnedShips,
    ownedUpgrades,
    setOwnedUpgrades,
    shipUpgrades,
    setShipUpgrades,
    currentSpeedLevel,
    setCurrentSpeedLevel,
    loadGameState,
    saveGameState,
    getShipLives,
    getShipLevel,
    resetGameState,
  };
};