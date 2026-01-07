import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HugMe.css';

// Game hosted on GitHub Pages
const GAME_URL = 'https://bitopencode.github.io/HugMe/';

const HugMe: React.FC = () => {
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Disable scroll when game is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    const mainContent = document.querySelector('.main-content') as HTMLElement;
    if (mainContent) {
      mainContent.style.overflow = 'hidden';
      mainContent.style.padding = '0';
      mainContent.style.gap = '0';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      if (mainContent) {
        mainContent.style.overflow = '';
        mainContent.style.padding = '';
        mainContent.style.gap = '';
      }
    };
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  if (isFullscreen) {
    return (
      <div className="hugme-fullscreen">
        <button className="exit-fullscreen-btn" onClick={toggleFullscreen}>
          ✕ Exit
        </button>
        <iframe
          src={GAME_URL}
          title="Hug Me Game"
          className="game-iframe-fullscreen"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
        />
      </div>
    );
  }

  return (
    <div className="hugme-page">
      <div className="hugme-header">
        <button onClick={() => navigate('/games')} className="back-button">
          ← Back
        </button>
        <h1 className="hugme-title">🐰 Hug Me</h1>
        <button onClick={toggleFullscreen} className="fullscreen-button">
          ⛶
        </button>
      </div>

      <div className="game-container">
        <iframe
          src={GAME_URL}
          title="Hug Me Game"
          className="game-iframe"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
        />
      </div>
    </div>
  );
};

export default HugMe;

