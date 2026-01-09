import React, { useEffect, useRef } from 'react';
import './ShootingStars.css';

const ShootingStars: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const staticStarsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const staticContainer = staticStarsRef.current;
    if (!container || !staticContainer) return;

    // Create shooting stars (increased count)
    const stars: HTMLDivElement[] = [];
    const starCount = 50; // Increased from 20 to 50

    for (let i = 0; i < starCount; i++) {
      const star = document.createElement('div');
      star.className = 'shooting_star';
      
      // Random delay (spread over longer period)
      const delay = Math.random() * 15000;
      star.style.animationDelay = `${delay}ms`;
      
      // Better distribution across screen
      const top = Math.random() * 100 - 50;
      const left = Math.random() * 150 + 50;
      star.style.top = `${top}%`;
      star.style.left = `${left}%`;
      
      // Random animation duration for variety
      const duration = 2000 + Math.random() * 2000;
      star.style.setProperty('--shooting-duration', `${duration}ms`);
      
      container.appendChild(star);
      stars.push(star);
    }

    // Create static twinkling stars
    const staticStars: HTMLDivElement[] = [];
    const staticCount = 150; // Many static stars

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
      
      // Random opacity
      star.style.opacity = `${0.3 + Math.random() * 0.7}`;
      
      staticContainer.appendChild(star);
      staticStars.push(star);
    }

    return () => {
      stars.forEach(star => star.remove());
      staticStars.forEach(star => star.remove());
    };
  }, []);

  return (
    <>
      <div ref={staticStarsRef} className="static_stars_container" />
      <div ref={containerRef} className="night" />
    </>
  );
};

export default ShootingStars;

