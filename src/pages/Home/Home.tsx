import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BubbleButton, BubbleCard } from '../../components/ui';
import './Home.css';

// Pegtop Animation Component
interface ClickEffect {
  id: number;
  x: number;
  y: number;
}

const PegtopSVG: React.FC<{ id: string }> = ({ id }) => (
  <svg
    id={id}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
  >
    <defs>
      <filter id={`shine-${id}`}>
        <feGaussianBlur stdDeviation="3" />
      </filter>
      <mask id={`mask-${id}`}>
        <path
          d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z"
          fill="white"
        />
      </mask>
      <radialGradient
        id={`gradient-1-${id}`}
        cx="50"
        cy="66"
        fx="50"
        fy="66"
        r="30"
        gradientTransform="translate(0 35) scale(1 0.5)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="black" stopOpacity="0.3" />
        <stop offset="50%" stopColor="black" stopOpacity="0.1" />
        <stop offset="100%" stopColor="black" stopOpacity="0" />
      </radialGradient>
      <radialGradient
        id={`gradient-2-${id}`}
        cx="55"
        cy="20"
        fx="55"
        fy="20"
        r="30"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="white" stopOpacity="0.3" />
        <stop offset="50%" stopColor="white" stopOpacity="0.1" />
        <stop offset="100%" stopColor="white" stopOpacity="0" />
      </radialGradient>
      <radialGradient
        id={`gradient-3-${id}`}
        cx="85"
        cy="50"
        fx="85"
        fy="50"
        r="30"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="white" stopOpacity="0.3" />
        <stop offset="50%" stopColor="white" stopOpacity="0.1" />
        <stop offset="100%" stopColor="white" stopOpacity="0" />
      </radialGradient>
      <radialGradient
        id={`gradient-4-${id}`}
        cx="50"
        cy="58"
        fx="50"
        fy="58"
        r="60"
        gradientTransform="translate(0 47) scale(1 0.2)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="white" stopOpacity="0.3" />
        <stop offset="50%" stopColor="white" stopOpacity="0.1" />
        <stop offset="100%" stopColor="white" stopOpacity="0" />
      </radialGradient>
      <linearGradient
        id={`gradient-5-${id}`}
        x1="50"
        y1="90"
        x2="50"
        y2="10"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="black" stopOpacity="0.2" />
        <stop offset="40%" stopColor="black" stopOpacity="0" />
      </linearGradient>
    </defs>
    <g>
      <path
        d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z"
        fill="currentColor"
      />
      <path
        d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z"
        fill={`url(#gradient-1-${id})`}
      />
      <path
        d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z"
        fill="none"
        stroke="white"
        opacity="0.3"
        strokeWidth="3"
        filter={`url(#shine-${id})`}
        mask={`url(#mask-${id})`}
      />
      <path
        d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z"
        fill={`url(#gradient-2-${id})`}
      />
      <path
        d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z"
        fill={`url(#gradient-3-${id})`}
      />
      <path
        d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z"
        fill={`url(#gradient-4-${id})`}
      />
      <path
        d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z"
        fill={`url(#gradient-5-${id})`}
      />
    </g>
  </svg>
);

const ClickAnimation: React.FC<{ x: number; y: number; onComplete: () => void }> = ({ x, y, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div 
      className="click-animation" 
      style={{ left: x, top: y }}
    >
      <div className="pegtop-loader">
        <PegtopSVG id="pegtop-one" />
        <PegtopSVG id="pegtop-two" />
        <PegtopSVG id="pegtop-three" />
      </div>
    </div>
  );
};

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [score, setScore] = useState<number>(() => {
    const saved = localStorage.getItem('astronaut-score');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [clickEffects, setClickEffects] = useState<ClickEffect[]>([]);

  // Save score to localStorage
  useEffect(() => {
    localStorage.setItem('astronaut-score', score.toString());
  }, [score]);

  // Handle astronaut click
  const handleAstronautClick = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    // Increment score
    setScore(prev => prev + 1);

    // Get click position relative to the card
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Add click effect
    const effectId = Date.now();
    setClickEffects(prev => [...prev, { id: effectId, x, y }]);
  }, []);

  // Remove click effect
  const removeClickEffect = useCallback((id: number) => {
    setClickEffects(prev => prev.filter(effect => effect.id !== id));
  }, []);

  // Format score with commas
  const formatScore = (num: number): string => {
    return num.toLocaleString();
  };

  return (
    <div className="home-page">
      {/* Hero Card with clickable astronaut */}
      <BubbleCard className="hero-card astronaut-card">
        <div className="astronaut-container">
          <img 
            src="https://uiverse.io/astronaut.png" 
            alt="Astronaut" 
            className="floating-avatar clickable-astronaut"
            draggable={false}
            onClick={handleAstronautClick}
          />
          {/* Click effects */}
          {clickEffects.map(effect => (
            <ClickAnimation
              key={effect.id}
              x={effect.x}
              y={effect.y}
              onComplete={() => removeClickEffect(effect.id)}
            />
          ))}
        </div>
      </BubbleCard>

      {/* Score Display */}
      <div className="score-container">
        <div className="score-label">Your Score</div>
        <div className="score-value">{formatScore(score)}</div>
        <div className="score-icon">⭐</div>
      </div>

      {/* Action Buttons */}
      <div className="main-buttons">
        <BubbleButton 
          className="nav-button main-action-button"
          onClick={() => navigate('/games')}
        >
          Games
        </BubbleButton>
        <BubbleButton 
          className="nav-button main-action-button"
          onClick={() => navigate('/avatars')}
        >
          Avatars
        </BubbleButton>
      </div>
    </div>
  );
};

export default Home;

