import React, { useRef, useEffect, useState } from 'react';
import { GAME_IMAGES, SHIP_CONFIGS, UPGRADES, UpgradeType } from '../config';
import './GameInventory.css';

interface GameInventoryProps {
  currentShip: string;
  ownedShips: string[];
  ownedUpgrades: string[];
  shipUpgrades: Record<string, string[]>;  // shipType -> array of upgrade IDs
  onSelect: (shipType: string) => void;
  onUpgradeChange: (shipType: string, slotIndex: number, upgradeId: string | null) => void;
  onBack: () => void;
}

const GameInventory: React.FC<GameInventoryProps> = ({ 
  currentShip, 
  ownedShips, 
  ownedUpgrades,
  shipUpgrades,
  onSelect, 
  onUpgradeChange,
  onBack 
}) => {
  const staticStarsRef = useRef<HTMLDivElement>(null);
  const [draggedUpgrade, setDraggedUpgrade] = useState<string | null>(null);

  // Create static twinkling stars
  useEffect(() => {
    if (!staticStarsRef.current) return;

    const container = staticStarsRef.current;
    container.innerHTML = '';

    const starCount = 200;
    for (let i = 0; i < starCount; i++) {
      const star = document.createElement('div');
      star.className = 'static_star';
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.opacity = `${0.4 + Math.random() * 0.6}`;
      star.style.animationDelay = `${Math.random() * 3}s`;
      star.style.animationDuration = `${2 + Math.random() * 3}s`;
      container.appendChild(star);
    }

    return () => {
      container.innerHTML = '';
    };
  }, []);

  const handleDragStart = (e: React.DragEvent, upgradeId: string) => {
    setDraggedUpgrade(upgradeId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (shipType: string, slotIndex: number) => {
    if (draggedUpgrade) {
      onUpgradeChange(shipType, slotIndex, draggedUpgrade);
      setDraggedUpgrade(null);
    }
  };

  const handleSlotClick = (shipType: string, slotIndex: number) => {
    // Удалить улучшение из слота при клике
    onUpgradeChange(shipType, slotIndex, null);
  };

  const renderShipCard = (shipType: 'default' | 'redShip' | 'elonShip', shipName: string, lives: number) => {
    const config = SHIP_CONFIGS[shipType];
    const upgrades = shipUpgrades[shipType] || [];
    const maxSlots = config.maxUpgradeSlots;

    return (
      <div className={`ship-card ${currentShip === shipType ? 'selected' : ''}`}>
        <img src={GAME_IMAGES[shipType === 'default' ? 'ship' : shipType]} alt={shipName} />
        <h3>{shipName}</h3>
        <p>Lives: {lives}</p>
        <p>Level: {config.level}</p>
        
        <div className="upgrade-slots">
          <h4>Upgrade Slots ({upgrades.length}/{maxSlots}):</h4>
          <div className="slots-container">
            {Array.from({ length: maxSlots }).map((_, index) => {
              const upgradeId = upgrades[index];
              const upgrade = upgradeId ? UPGRADES[upgradeId] : null;
              
              return (
                <div
                  key={index}
                  className={`upgrade-slot ${upgrade ? 'filled' : 'empty'}`}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(shipType, index)}
                  onClick={() => handleSlotClick(shipType, index)}
                  title={upgrade ? `${upgrade.name} - Click to remove` : 'Drop upgrade here'}
                >
                  {upgrade ? (
                    <div className="slot-content">
                      <span className="slot-icon">{upgrade.icon}</span>
                      <span className="slot-name">{upgrade.name}</span>
                    </div>
                  ) : (
                    <div className="slot-placeholder">+</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => onSelect(shipType)}
          disabled={currentShip === shipType}
          className="select-btn"
        >
          {currentShip === shipType ? '✓ Selected' : 'Select'}
        </button>
      </div>
    );
  };

  return (
    <div className="game-inventory-container">
      <div ref={staticStarsRef} className="static_stars_container" />
      
      <div className="inventory-content">
        <h1 className="inventory-title">📦 Your Ships</h1>
        
        <div className="inventory-layout">
          <div className="ships-section">
            <div className="ships-grid">
              {renderShipCard('default', 'Default Ship', 3)}
              
              {ownedShips.includes('redShip') && 
                renderShipCard('redShip', 'Red Ship', 5)
              }
              
              {ownedShips.includes('elonShip') && 
                renderShipCard('elonShip', 'Elon Ship', 7)
              }
            </div>
          </div>

          <div className="upgrades-section">
            <h2 className="section-title">Your Upgrades</h2>
            <p className="section-hint">Drag upgrades to ship slots</p>
            <div className="owned-upgrades-grid">
              {ownedUpgrades.map((upgradeId) => {
                const upgrade = UPGRADES[upgradeId];
                if (!upgrade) return null;
                
                return (
                  <div
                    key={upgradeId}
                    className="owned-upgrade-item"
                    draggable
                    onDragStart={(e) => handleDragStart(e, upgradeId)}
                  >
                    <div className="upgrade-icon">{upgrade.icon}</div>
                    <div className="upgrade-name">{upgrade.name}</div>
                  </div>
                );
              })}
              {ownedUpgrades.length === 0 && (
                <p className="no-upgrades">No upgrades purchased yet. Buy them in the Shop!</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <button onClick={onBack} className="menu-btn back-btn">← Back</button>
    </div>
  );
};

export default GameInventory;
