import React, { useEffect, useRef } from 'react';
import './GameOver.css';

interface GameOverProps {
  gameState: {
    score: number;
    distance: number;
    enemiesDestroyed: number;
  };
  onRestart: () => void;
  onMenu: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ gameState, onRestart, onMenu }) => {
  const staticStarsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = staticStarsRef.current;
    if (!container) return;

    // Создаем мерцающие звезды как в других меню
    const stars = Array.from({ length: 50 }, (_, i) => {
      const star = document.createElement('div');
      star.className = 'static_star';
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.animationDelay = `${Math.random() * 3}s`;
      container.appendChild(star);
      return star;
    });

    return () => {
      stars.forEach(star => star.remove());
    };
  }, []);

  return (
    <div className="game-over-container">
      <div className="static_stars_container" ref={staticStarsRef}></div>
      <div className="game-over-content">
        <h1>Game Over</h1>
        
        <div className="game-over-info">
          <p className="score-text">Score: {gameState.score}</p>
          <p className="score-text">Distance: {gameState.distance}</p>
          <p className="score-text">Enemies: {gameState.enemiesDestroyed}</p>
        </div>

        <div className="game-over-actions">
          <button onClick={onRestart} className="menu-btn">
            🔄 Restart
          </button>
          <button onClick={onMenu} className="menu-btn">
            📋 Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOver;
