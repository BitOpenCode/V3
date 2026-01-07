import React, { useRef, useEffect } from 'react';
import './BubbleCard.css';

interface BubbleCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  onClick?: () => void;
}

const BubbleCard: React.FC<BubbleCardProps> = ({ children, className, title, onClick }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const createBubble = (element: HTMLDivElement) => {
      const bubble = document.createElement('div');
      bubble.className = 'bubble-card-bubble';
      const size = Math.random() * 10 + 6; // Bubble size between 6 and 16px (larger for card)
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      bubble.style.left = `${Math.random() * 100}%`;
      const duration = Math.random() * 3 + 3; // Animation duration between 3 and 6 seconds
      
      bubble.style.setProperty('--animation-duration', `${duration}s`);
      
      element.appendChild(bubble);

      bubble.addEventListener('animationend', () => {
        bubble.remove();
      });
    };

    // Start generating bubbles
    const intervalId = setInterval(() => {
      createBubble(card);
    }, 150); // Generate a bubble every 150ms (more bubbles)

    return () => {
      clearInterval(intervalId);
      card.querySelectorAll('.bubble-card-bubble').forEach(bubble => bubble.remove());
    };
  }, []);

  return (
    <div ref={cardRef} className={`bubble-card ${className || ''}`} onClick={onClick}>
      {title && <h3 className="bubble-card-title">{title}</h3>}
      <div className="bubble-card-content">
        {children}
      </div>
    </div>
  );
};

export default BubbleCard;

