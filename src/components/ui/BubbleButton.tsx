import React, { useRef, useEffect, useLayoutEffect } from 'react';
import { useSettingsStore } from '../../store';
import './BubbleButton.css';

interface BubbleButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

// Translated labels vary a lot in length (e.g. "SHARE" vs "ПОДЕЛИТЬСЯ"),
// but the buttons have a fixed size. Shrink the label's font-size just
// enough to fit instead of letting it overflow or wrap. Floor is an
// absolute px size (not a percentage of the base) so long words on the
// smallest breakpoints can still shrink enough to actually fit.
const MIN_FONT_SIZE_PX = 6;

const BubbleButton: React.FC<BubbleButtonProps> = ({ onClick, children, className, disabled }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const { theme } = useSettingsStore();

  useLayoutEffect(() => {
    const button = buttonRef.current;
    const label = labelRef.current;
    if (!button || !label) return;

    const fitText = () => {
      label.style.fontSize = '';
      const buttonStyle = getComputedStyle(button);
      const paddingX = parseFloat(buttonStyle.paddingLeft) + parseFloat(buttonStyle.paddingRight);
      // Small safety margin: font metrics don't scale perfectly linearly
      // (kerning/hinting change at different sizes), so leave a little
      // slack instead of fitting exactly to the calculated edge.
      const available = (button.clientWidth - paddingX) * 0.85;
      const needed = label.scrollWidth;
      if (available <= 0 || needed <= available) return;

      const baseFontSize = parseFloat(getComputedStyle(label).fontSize);
      let fontSize = baseFontSize * (available / needed);

      // The linear estimate above is a starting point, not a guarantee.
      // Step down further until the text actually fits (or we hit the
      // floor), since a single proportional guess can still overflow by
      // a pixel or two for some fonts/languages.
      for (let i = 0; i < 20 && fontSize > MIN_FONT_SIZE_PX; i++) {
        label.style.fontSize = `${fontSize}px`;
        if (label.scrollWidth <= available) break;
        fontSize -= 0.5;
      }
      label.style.fontSize = `${Math.max(fontSize, MIN_FONT_SIZE_PX)}px`;
    };

    fitText();
    // Web fonts (Google Fonts) load asynchronously, so the initial
    // measurement can be taken against a fallback font's metrics. Re-fit
    // once the real fonts are ready, and once more shortly after in case
    // sibling layout (e.g. the TonConnect button) settles a beat later.
    document.fonts?.ready.then(fitText);
    const settleTimer = setTimeout(fitText, 300);

    window.addEventListener('resize', fitText);
    return () => {
      window.removeEventListener('resize', fitText);
      clearTimeout(settleTimer);
    };
  }, [children]);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button || disabled || theme !== 'bubbles') return; // Only generate bubbles for bubbles theme

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
    };

    const createBubble = (btn: HTMLButtonElement) => {
      const bubble = document.createElement('div');
      bubble.className = 'bubble';
      const size = Math.random() * 8 + 4; // Bubble size between 4 and 12px
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      bubble.style.left = `${Math.random() * 100}%`;
      const duration = Math.random() * 2 + 2; // Animation duration between 2 and 4 seconds
      
      bubble.style.setProperty('--animation-duration', `${duration}s`);
      
      btn.appendChild(bubble);

      bubble.addEventListener('animationend', () => {
        bubble.remove();
      });
    };

    // Start bubbles on mount
    startBubbleGeneration();

    // Add event listeners for hover effects
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
      <span ref={labelRef} className="nav-button-content">
        {children}
      </span>
    </button>
  );
};

export default BubbleButton;

