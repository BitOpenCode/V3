// src/pages/Games/SpaceShip/hooks/useShop.ts

import { useCallback } from 'react';
import { GameState, ShipUpgrades } from '../types';

interface UseShopProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>; // ← ОСТАВЛЯЕМ
  currentShip: string;
  setCurrentShip: (ship: string) => void;
  ownedShips: string[];
  setOwnedShips: (ships: string[]) => void;
  ownedUpgrades: string[];
  setOwnedUpgrades: (upgrades: string[]) => void;
  shipUpgrades: ShipUpgrades;
  setShipUpgrades: React.Dispatch<React.SetStateAction<ShipUpgrades>>;
  saveGameState: (
    state: Partial<GameState>,
    ship?: string,
    owned?: string[],
    upgrades?: string[],
    shipUpgs?: ShipUpgrades
  ) => void;
}

export const useShop = ({
  gameState,
  setGameState, // ← ТЕПЕРЬ ИСПОЛЬЗУЕМ
  currentShip,
  setCurrentShip,
  ownedShips,
  setOwnedShips,
  ownedUpgrades,
  setOwnedUpgrades,
  shipUpgrades,
  setShipUpgrades,
  saveGameState,
}: UseShopProps) => {

  const buyShip = useCallback((shipType: string, cost: number) => {
    if (gameState.shopCurrency >= cost && !ownedShips.includes(shipType)) {
      const newCurrency = gameState.shopCurrency - cost;
      const newOwned = [...ownedShips, shipType];
      
      // ✅ ИСПОЛЬЗУЕМ setGameState
      setGameState(prev => ({
        ...prev,
        shopCurrency: newCurrency,
      }));
      
      setOwnedShips(newOwned);
      setCurrentShip(shipType);
      saveGameState(
        { shopCurrency: newCurrency },
        shipType,
        newOwned,
        ownedUpgrades,
        shipUpgrades
      );
      alert('Ship purchased!');
    }
  }, [gameState.shopCurrency, ownedShips, setGameState, setOwnedShips, setCurrentShip, saveGameState, ownedUpgrades, shipUpgrades]);

  const buyUpgrade = useCallback((upgradeId: string, cost: number) => {
    if (gameState.shopCurrency >= cost && !ownedUpgrades.includes(upgradeId)) {
      const newCurrency = gameState.shopCurrency - cost;
      const newOwnedUpgrades = [...ownedUpgrades, upgradeId];
      
      // ✅ ИСПОЛЬЗУЕМ setGameState
      setGameState(prev => ({
        ...prev,
        shopCurrency: newCurrency,
      }));
      
      setOwnedUpgrades(newOwnedUpgrades);
      saveGameState(
        { shopCurrency: newCurrency },
        currentShip,
        ownedShips,
        newOwnedUpgrades,
        shipUpgrades
      );
      alert('Upgrade purchased!');
    }
  }, [gameState.shopCurrency, ownedUpgrades, setGameState, setOwnedUpgrades, saveGameState, currentShip, ownedShips, shipUpgrades]);

  const selectShip = useCallback((shipType: string) => {
    setCurrentShip(shipType);
    saveGameState({}, shipType, ownedShips, ownedUpgrades, shipUpgrades);
    alert('Ship selected!');
  }, [setCurrentShip, saveGameState, ownedShips, ownedUpgrades, shipUpgrades]);

  const handleUpgradeChange = useCallback((shipType: string, slotIndex: number, upgradeId: string | null) => {
    const currentUpgrades = shipUpgrades[shipType] || [];
    const newUpgrades = [...currentUpgrades];

    if (upgradeId === null) {
      newUpgrades.splice(slotIndex, 1);
    } else {
      if (slotIndex < newUpgrades.length) {
        newUpgrades[slotIndex] = upgradeId;
      } else {
        newUpgrades.push(upgradeId);
      }
    }

    const newShipUpgrades = { ...shipUpgrades, [shipType]: newUpgrades };
    setShipUpgrades(newShipUpgrades);
    saveGameState({}, currentShip, ownedShips, ownedUpgrades, newShipUpgrades);
  }, [shipUpgrades, setShipUpgrades, saveGameState, currentShip, ownedShips, ownedUpgrades]);

  return {
    buyShip,
    buyUpgrade,
    selectShip,
    handleUpgradeChange,
  };
};