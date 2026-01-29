import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './GameMenu.css';

interface GameMenuProps {
  userId: string;
  gameState: {
    score: number;
    lives: number;
    distance: number;
    enemiesDestroyed: number;
    highScore: number;
    shopCurrency: number;
  };
  onStart: () => void;
  onShop: () => void;
  onInventory: () => void;
}

const GameMenu: React.FC<GameMenuProps> = ({ userId, gameState, onStart, onShop, onInventory }) => {
  const navigate = useNavigate();
  const staticStarsRef = useRef<HTMLDivElement>(null);

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
    <div className="game-menu-container">
      <div ref={staticStarsRef} className="static_stars_container" />
      
      <div className="game-menu">
        <h1>SPACE ADVENTURE</h1>
        
        <div className="game-info">
          <p>Welcome, {userId || 'Player'}</p>
          <p>💰 Currency: {gameState.shopCurrency}</p>
          <p>🏆 High Score: {gameState.highScore}</p>
        </div>

        <div className="game-actions">
          <button onClick={onStart} className="menu-btn play-btn">
            <span>▶</span>
            <span>Play</span>
          </button>
          <button onClick={onShop} className="menu-btn">
            <span>🛒</span>
            <span>Shop</span>
          </button>
          <button onClick={onInventory} className="menu-btn">
            <span>📦</span>
            <span>Inventory</span>
          </button>
        </div>
      </div>

      <button onClick={() => navigate('/games')} className="menu-btn back-btn">
        ← Back
      </button>
    </div>
  );
};

export default GameMenu;
