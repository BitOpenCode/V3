import React, { useRef, useEffect, useState } from 'react';
import { GAME_IMAGES, UPGRADES } from '../config';
import './GameShop.css';

interface GameShopProps {
  shopCurrency: number;
  ownedShips: string[];
  ownedUpgrades: string[];
  onBuy: (shipType: string, cost: number) => void;
  onBuyUpgrade: (upgradeId: string, cost: number) => void;
  onBack: () => void;
}

const GameShop: React.FC<GameShopProps> = ({ shopCurrency, ownedShips, ownedUpgrades, onBuy, onBuyUpgrade, onBack }) => {
  const staticStarsRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<'all' | 'ships' | 'upgrades'>('all');

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

  return (
    <div className="game-shop-container">
      <div ref={staticStarsRef} className="static_stars_container" />
      
      <div className="shop-content">
        <h1 className="shop-title">🛒 Space Shop</h1>
        <p className="currency-text">💰 Currency: {shopCurrency}</p>
        
        <div className="shop-filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${filter === 'ships' ? 'active' : ''}`}
            onClick={() => setFilter('ships')}
          >
            Ships
          </button>
          <button 
            className={`filter-btn ${filter === 'upgrades' ? 'active' : ''}`}
            onClick={() => setFilter('upgrades')}
          >
            Upgrades
          </button>
        </div>

        <div className="shop-scrollable">
          {(filter === 'all' || filter === 'ships') && (
            <div className="shop-section">
              <h2 className="section-title">🚀 Ships</h2>
              <div className="ships-grid">
                <div className="ship-card">
                  <img src={GAME_IMAGES.redShip} alt="Red Ship" />
                  <h3>Red Ship</h3>
                  <p>Lives: 5</p>
                  <p>Slots: 3</p>
                  <p className="ship-cost">200</p>
                  <button
                    onClick={() => onBuy('redShip', 200)}
                    disabled={shopCurrency < 200 || ownedShips.includes('redShip')}
                    className="buy-btn"
                  >
                    {ownedShips.includes('redShip') ? '✓' : 'Buy'}
                  </button>
                </div>
                
                <div className="ship-card">
                  <img src={GAME_IMAGES.elonShip} alt="Elon Ship" />
                  <h3>Elon Ship</h3>
                  <p>Lives: 7</p>
                  <p>Slots: 4</p>
                  <p className="ship-cost">400</p>
                  <button
                    onClick={() => onBuy('elonShip', 400)}
                    disabled={shopCurrency < 400 || ownedShips.includes('elonShip')}
                    className="buy-btn"
                  >
                    {ownedShips.includes('elonShip') ? '✓' : 'Buy'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {(filter === 'all' || filter === 'upgrades') && (
            <div className="shop-section">
              <h2 className="section-title">⚙️ Upgrades</h2>
              <div className="upgrades-grid">
                {Object.values(UPGRADES).map((upgrade) => {
                  // Check if speed upgrade requires specific ship level
                  let canBuy = true;
                  let requirementText = '';
                  if (upgrade.id === 'speed2') {
                    requirementText = 'Requires level 2+ ship';
                  } else if (upgrade.id === 'speed3') {
                    requirementText = 'Requires level 3 ship';
                  }
                  
                  return (
                    <div key={upgrade.id} className="upgrade-card">
                      <div className="upgrade-icon">{upgrade.icon}</div>
                      <h3>{upgrade.name}</h3>
                      <p className="upgrade-description">{upgrade.description}</p>
                      {requirementText && (
                        <p className="upgrade-requirement" style={{ color: 'rgba(255, 200, 0, 0.8)', fontSize: '0.7rem', margin: '4px 0' }}>
                          {requirementText}
                        </p>
                      )}
                      <p className="upgrade-cost">{upgrade.cost}</p>
                      <button
                        onClick={() => onBuyUpgrade(upgrade.id, upgrade.cost)}
                        disabled={shopCurrency < upgrade.cost || ownedUpgrades.includes(upgrade.id)}
                        className="buy-btn"
                      >
                        {ownedUpgrades.includes(upgrade.id) ? '✓' : 'Buy'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <button onClick={onBack} className="menu-btn back-btn">← Back</button>
    </div>
  );
};

export default GameShop;
