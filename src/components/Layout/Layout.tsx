import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useSettingsStore } from '../../store';
import { ShootingStars } from '../ShootingStars';
import Header from './Header';
import BottomNav from './BottomNav';
import './Layout.css';

const Layout: React.FC = () => {
  const { theme } = useSettingsStore();

  // Fix TonConnect button colors for light theme
  useEffect(() => {
    const fixTonConnectColors = () => {
      const isLight = theme === 'light';
      const textColor = isLight ? '#0f172a' : '#ffffff';
      const bgColor = isLight ? '#ffffff' : '';
      const borderColor = isLight ? '#e2e8f0' : '';

      // Find all TonConnect elements and fix their colors
      const tonConnectElements = document.querySelectorAll('[data-tc-connect-button], [data-tc-dropdown-button]');
      tonConnectElements.forEach(el => {
        const htmlEl = el as HTMLElement;
        if (isLight) {
          htmlEl.style.setProperty('color', textColor, 'important');
          htmlEl.style.setProperty('background', bgColor, 'important');
          htmlEl.style.setProperty('border', `1px solid ${borderColor}`, 'important');
        } else {
          htmlEl.style.removeProperty('color');
          htmlEl.style.removeProperty('background');
          htmlEl.style.removeProperty('border');
        }
      });

      // Fix nested elements (spans, divs with address)
      const allSpans = document.querySelectorAll('.connect-wallet-button span, .connect-wallet-button div');
      allSpans.forEach(el => {
        const htmlEl = el as HTMLElement;
        if (isLight) {
          htmlEl.style.setProperty('color', textColor, 'important');
        } else {
          htmlEl.style.removeProperty('color');
        }
      });
    };

    // Run immediately
    fixTonConnectColors();

    // Run again after a delay (for dynamically loaded elements)
    const timeout1 = setTimeout(fixTonConnectColors, 100);
    const timeout2 = setTimeout(fixTonConnectColors, 500);
    const timeout3 = setTimeout(fixTonConnectColors, 1000);

    // Set up a MutationObserver to catch dynamic changes
    const observer = new MutationObserver(fixTonConnectColors);
    const targetNode = document.querySelector('.connect-wallet-button');
    if (targetNode) {
      observer.observe(targetNode, { childList: true, subtree: true, attributes: true });
    }

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
      observer.disconnect();
    };
  }, [theme]);

  return (
    <div className="app-layout">
      {theme === 'space' && <ShootingStars />}
      <Header />
      <main className="main-content">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export default Layout;

