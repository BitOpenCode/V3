import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore, useLanguageStore, Theme } from '../../store';
import { useTranslation } from '../../hooks/useTranslation';
import './Menu.css';

const Menu: React.FC = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useSettingsStore();
  const { language, setLanguage } = useLanguageStore();
  const { t } = useTranslation();

  const themes: { value: Theme; label: string; icon: string }[] = [
    { value: 'bubbles', label: 'Bubbles', icon: '🫧' },
    { value: 'space', label: 'Space', icon: '🌌' },
    { value: 'light', label: 'Light', icon: '☀️' },
  ];

  const languages: { value: string; label: string; icon: string }[] = [
    { value: 'English', label: 'English', icon: '🇬🇧' },
    { value: 'Spanish', label: 'Spanish', icon: '🇪🇸' },
    { value: 'Mandarin', label: 'Mandarin (中文)', icon: '🇨🇳' },
    { value: 'French', label: 'French', icon: '🇫🇷' },
    { value: 'Russian', label: 'Russian', icon: '🇷🇺' },
  ];

  const profileItems: { value: string; label: string; icon: string; route: string }[] = [
    { value: 'profile_info', label: 'Profile Info', icon: '👤', route: '/profile' },
    { value: 'results', label: 'Results', icon: '📊', route: '/results' },
    { value: 'progress', label: 'Progress', icon: '📈', route: '/progress' },
  ];

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
  };

  const handleProfileClick = (route: string) => {
    navigate(route);
  };

  return (
    <div className="menu-page">
      <div className="page-header">
        <h1 className="page-title">{t('menu')}</h1>
        <button onClick={() => navigate('/')} className="close-button">
          {t('close')}
        </button>
      </div>

      <div className="menu-content">
        {/* Profile Card */}
        <div className="menu-card">
          <div className="menu-card-title">Profile</div>
          <div className="theme-selector">
            {profileItems.map((item) => (
              <button
                key={item.value}
                onClick={() => handleProfileClick(item.route)}
                className="theme-button"
              >
                <span className="theme-icon">{item.icon}</span>
                <span className="theme-label">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="menu-card">
          <div className="menu-card-title">{t('theme_settings')}</div>
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
        </div>

        <div className="menu-card">
          <div className="menu-card-title">{t('languages')}</div>
          <div className="theme-selector">
            {languages.map((lang) => (
              <button
                key={lang.value}
                onClick={() => handleLanguageChange(lang.value)}
                className={`theme-button ${language === lang.value ? 'active' : ''}`}
              >
                <span className="theme-icon">{lang.icon}</span>
                <span className="theme-label">{lang.label}</span>
                {language === lang.value && (
                  <span className="theme-check">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Menu;