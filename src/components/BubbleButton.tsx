import React, { useRef, useEffect } from 'react';

interface BubbleButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string; // Allow passing existing class names
}

const BubbleButton: React.FC<BubbleButtonProps> = ({ onClick, children, className }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    const startBubbleGeneration = () => {
      // Clear existing bubbles before starting new ones
      button.querySelectorAll('.bubble').forEach(bubble => bubble.remove());

      // Start generating new bubbles
      const intervalId = setInterval(() => {
        createBubble(button);
      }, 200); // Generate a bubble every 200ms
      button.setAttribute('data-bubble-interval', intervalId.toString());
    };

    const stopBubbleGeneration = () => {
      const intervalId = button.getAttribute('data-bubble-interval');
      if (intervalId) {
        clearInterval(parseInt(intervalId));
        button.removeAttribute('data-bubble-interval');
      }
      // Optionally let existing bubbles finish their animation instead of removing immediately
      // button.querySelectorAll('.bubble').forEach(bubble => bubble.remove());
    };

    const createBubble = (btn: HTMLButtonElement) => {
      const bubble = document.createElement('div');
      bubble.className = 'bubble';
      const size = Math.random() * 8 + 4; // Bubble size between 4 and 12px
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      bubble.style.left = `${Math.random() * 100}%`; // Random horizontal position
      const duration = Math.random() * 2 + 2; // Animation duration between 2 and 4 seconds
      
      // Set CSS variable for animation duration on the bubble element
      bubble.style.setProperty('--animation-duration', `${duration}s`);

      // Animation is now applied via CSS class '.bubble' using the variable
      // bubble.style.animation = `bubble ${duration}s linear forwards`; // Remove direct animation style
      
      btn.appendChild(bubble);

      // Remove bubble after animation ends
      bubble.addEventListener('animationend', () => {
        bubble.remove();
      });
    };

    // Start bubbles on mount and stop on unmount
    startBubbleGeneration();

    // Add event listeners for hover effects
    button.addEventListener('mouseenter', stopBubbleGeneration);
    button.addEventListener('mouseleave', startBubbleGeneration);

    return () => {
      // Cleanup on unmount
      stopBubbleGeneration();
      button.removeEventListener('mouseenter', stopBubbleGeneration);
      button.removeEventListener('mouseleave', startBubbleGeneration);
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  return (
    <button ref={buttonRef} className={`nav-button ${className || ''}`} onClick={onClick}>
      {children}
    </button>
  );
};

export default BubbleButton; 