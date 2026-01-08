import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSettingsStore } from '../../store';
import { ShootingStars } from '../ShootingStars';
import Header from './Header';
import BottomNav from './BottomNav';
import './Layout.css';

const Layout: React.FC = () => {
  const { theme } = useSettingsStore();

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

