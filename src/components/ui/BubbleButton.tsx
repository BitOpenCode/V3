import React, { useRef, useEffect, useLayoutEffect, useId } from 'react';
import { useSettingsStore } from '../../store';
import { useNavButtonGroup } from './NavButtonGroup';
import './BubbleButton.css';

interface BubbleButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

// Translated labels vary a lot in length (e.g. "SHARE" vs "ПОДЕЛИТЬСЯ"),
// but the buttons have a fixed size. Multi-word labels get to wrap onto a
// second line first (buttons are tall enough for that), which usually
// needs little or no shrinking. Single-word labels can't wrap sensibly,
// so those still shrink to fit on one line. Floor is an absolute px size
// (not a percentage of the base) so long words on the smallest
// breakpoints can still shrink enough to actually fit.
const MIN_FONT_SIZE_PX = 6;
const HORIZONTAL_SAFETY = 0.95;

const BubbleButton: React.FC<BubbleButtonProps> = ({ onClick, children, className, disabled }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const { theme } = useSettingsStore();
  const group = useNavButtonGroup();
  const groupId = useId();
  // Kept in sync every render so effects can read the latest group value
  // without needing it in their dependency arrays (which would re-run —
  // and re-report — every time ANY sibling's report changes the group's
  // resolved size, since that produces a new `group` object reference).
  const groupRef = useRef(group);
  groupRef.current = group;

  const isMultiWord = typeof children === 'string' && /\s/.test(children.trim());

  useLayoutEffect(() => {
    const button = buttonRef.current;
    const label = labelRef.current;
    if (!button || !label) return;

    // Computes the largest size (down to the floor) at which this
    // button's own text fits, without actually applying it — callers
    // decide whether to use it directly or hand it to a NavButtonGroup.
    const computeFit = (): number => {
      label.style.fontSize = '';
      const buttonStyle = getComputedStyle(button);
      const paddingX = parseFloat(buttonStyle.paddingLeft) + parseFloat(buttonStyle.paddingRight);
      const paddingY = parseFloat(buttonStyle.paddingTop) + parseFloat(buttonStyle.paddingBottom);
      const availableWidth = button.clientWidth - paddingX;

      const fits = () =>
        isMultiWord
          ? label.scrollHeight <= button.clientHeight - paddingY && label.scrollWidth <= availableWidth
          : label.scrollWidth <= availableWidth * HORIZONTAL_SAFETY;

      const baseFontSize = parseFloat(getComputedStyle(label).fontSize);
      if (availableWidth <= 0 || fits()) return baseFontSize;

      // Step the font-size down until it actually fits (or hits the
      // floor) rather than trusting a single proportional guess — font
      // metrics don't scale perfectly linearly (kerning/hinting change
      // at different sizes), and for wrapped text the fit depends on
      // where the line break lands, which isn't easy to predict upfront.
      let fontSize = baseFontSize;
      for (let i = 0; i < 20 && fontSize > MIN_FONT_SIZE_PX; i++) {
        label.style.fontSize = `${fontSize}px`;
        if (fits()) break;
        fontSize -= 0.5;
      }
      return Math.max(fontSize, MIN_FONT_SIZE_PX);
    };

    const fitText = () => {
      const size = computeFit();
      const currentGroup = groupRef.current;
      if (currentGroup) {
        // Report this button's own ideal size to the shared group; the
        // group-size effect below re-applies the resulting minimum
        // whenever it changes. computeFit() resets the label's font-size
        // while measuring, so re-apply the group's *current* known size
        // right away too (falling back to this button's own size before
        // the group has resolved one) — otherwise a report that doesn't
        // change the group's minimum leaves the label at the reset value
        // instead of the shared size.
        currentGroup.report(groupId, size);
        label.style.fontSize = `${currentGroup.groupSize ?? size}px`;
      } else {
        label.style.fontSize = `${size}px`;
      }
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
      groupRef.current?.unregister(groupId);
    };
  }, [children, isMultiWord, groupId]);

  // Apply the group's shared (smallest-needed) size whenever it changes.
  // Runs separately from the fit computation above so it reacts purely to
  // the group's resolved value, without re-triggering measurement.
  useEffect(() => {
    if (group?.groupSize == null || !labelRef.current) return;
    labelRef.current.style.fontSize = `${group.groupSize}px`;
  }, [group?.groupSize]);

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
      <span
        ref={labelRef}
        className="nav-button-content"
        style={{ whiteSpace: isMultiWord ? 'normal' : 'nowrap' }}
      >
        {children}
      </span>
    </button>
  );
};

export default BubbleButton;

