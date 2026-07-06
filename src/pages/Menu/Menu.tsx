import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BubbleCard } from '../../components/ui';
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

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
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
        <BubbleCard className="menu-card" title={t('theme_settings')}>
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

        <BubbleCard className="menu-card" title={t('languages')}>
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
        </BubbleCard>
      </div>
    </div>
  );
};

export default Menu;