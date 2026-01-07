import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BubbleCard } from '../../components/ui';
import { useSettingsStore, Theme } from '../../store';
import './Menu.css';

const Menu: React.FC = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useSettingsStore();

  const themes: { value: Theme; label: string; icon: string }[] = [
    { value: 'bubbles', label: 'Bubbles', icon: '🫧' },
    { value: 'space', label: 'Space', icon: '🌌' },
    { value: 'light', label: 'Light', icon: '☀️' },
  ];

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  return (
    <div className="menu-page">
      <div className="page-header">
        <h1 className="page-title">Menu</h1>
        <button onClick={() => navigate('/')} className="close-button">
          Close
        </button>
      </div>

      <div className="menu-content">
        <BubbleCard className="menu-card" title="Welcome">
          <p className="text-center text-sm opacity-80">
            Explore the features of our application. More options coming soon.
          </p>
        </BubbleCard>

        <BubbleCard className="menu-card" title="Theme Settings">
          <div className="theme-selector">
            {themes.map((t) => (
              <button
                key={t.value}
                onClick={() => handleThemeChange(t.value)}
                className={`theme-button ${theme === t.value ? 'active' : ''}`}
              >
                <span className="theme-icon">{t.icon}</span>
                <span className="theme-label">{t.label}</span>
                {theme === t.value && (
                  <span className="theme-check">✓</span>
                )}
              </button>
            ))}
          </div>
        </BubbleCard>
      </div>
    </div>
  );
};

export default Menu;

