import React, { useEffect, useRef } from 'react';
import './ShootingStars.css';

const ShootingStars: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create shooting stars
    const stars: HTMLDivElement[] = [];
    const starCount = 20;

    for (let i = 0; i < starCount; i++) {
      const star = document.createElement('div');
      star.className = 'shooting_star';
      
      // Random delay
      const delay = Math.random() * 10000;
      star.style.animationDelay = `${delay}ms`;
      
      // Random position
      const top = 50 + (Math.random() * 400 - 200);
      const left = 50 + (Math.random() * 300);
      star.style.top = `${top}%`;
      star.style.left = `${left}%`;
      
      container.appendChild(star);
      stars.push(star);
    }

    return () => {
      stars.forEach(star => star.remove());
    };
  }, []);

  return <div ref={containerRef} className="night" />;
};

export default ShootingStars;

