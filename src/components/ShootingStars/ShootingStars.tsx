import React, { useEffect, useRef } from 'react';
import './ShootingStars.css';

const ShootingStars: React.FC = () => {
  const staticStarsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const staticContainer = staticStarsRef.current;
    if (!staticContainer) return;

    // Create static twinkling stars
    const staticStars: HTMLDivElement[] = [];
    const staticCount = 200; // Many static stars

    for (let i = 0; i < staticCount; i++) {
      const star = document.createElement('div');
      star.className = 'static_star';
      
      // Random position
      star.style.top = `${Math.random() * 100}%`;
      star.style.left = `${Math.random() * 100}%`;
      
      // Random size (1-3px)
      const size = 1 + Math.random() * 2;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      
      // Random twinkle delay
      star.style.animationDelay = `${Math.random() * 5000}ms`;
      
      // Random twinkle duration
      const duration = 2 + Math.random() * 3;
      star.style.animationDuration = `${duration}s`;
      
      // Random opacity
      star.style.opacity = `${0.4 + Math.random() * 0.6}`;
      
      staticContainer.appendChild(star);
      staticStars.push(star);
    }

    return () => {
      staticStars.forEach(star => star.remove());
    };
  }, []);

  return <div ref={staticStarsRef} className="static_stars_container" />;
};

export default ShootingStars;

