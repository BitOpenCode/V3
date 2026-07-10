import React, { useRef, useEffect } from 'react';
import { useSettingsStore } from '../../store';
import './BubbleButton.css';

interface BubbleButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

const BubbleButton: React.FC<BubbleButtonProps> = ({ onClick, children, className, disabled }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { theme } = useSettingsStore();

  useEffect(() => {
    const button = buttonRef.current;
    if (!button || disabled || theme !== 'bubbles') return;

    const startBubbleGeneration = () => {
      button.querySelectorAll('.bubble').forEach(bubble => bubble.remove());
      const intervalId = setInterval(() => {
        createBubble(button);
      }, 200);
      button.setAttribute('data-bubble-interval', intervalId.toString());
    };

    const stopBubbleGeneration = () => {
      const intervalId = button.getAttribute('data-bubble-interval');
      if (intervalId) {
        clearInterval(parseInt(intervalId));
        button.removeAttribute('data-bubble-interval');
      }
    };

    const createBubble = (btn: HTMLButtonElement) => {
      const bubble = document.createElement('div');
      bubble.className = 'bubble';
      const size = Math.random() * 8 + 4;
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      bubble.style.left = `${Math.random() * 100}%`;
      const duration = Math.random() * 2 + 2;
      bubble.style.setProperty('--animation-duration', `${duration}s`);
      btn.appendChild(bubble);
      bubble.addEventListener('animationend', () => {
        bubble.remove();
      });
    };

    startBubbleGeneration();
    button.addEventListener('mouseenter', stopBubbleGeneration);
    button.addEventListener('mouseleave', startBubbleGeneration);

    return () => {
      stopBubbleGeneration();
      button.removeEventListener('mouseenter', stopBubbleGeneration);
      button.removeEventListener('mouseleave', startBubbleGeneration);
    };
  }, [disabled, theme]);

  return (
    <button
      ref={buttonRef}
      className={`nav-button ${className || ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="nav-button-content">
        {children}
      </span>
    </button>
  );
};

export default BubbleButton;