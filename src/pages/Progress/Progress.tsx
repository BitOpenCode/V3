import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import './Progress.css';

const Progress: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Данные пользователя
  const userLevel = 6;
  const userXP = 8420;
  const xpToNextLevel = 10000;

  // Данные уровней и наград
  const levels = [
    { level: 1, xpRequired: 1000, rewards: ['🖼️ Avatar Frame Basic'] },
    { level: 2, xpRequired: 2000, rewards: ['🎮 Ship: Scout'] },
    { level: 3, xpRequired: 3500, rewards: ['🎯 Score Boost +5%'] },
    { level: 4, xpRequired: 5000, rewards: ['🖼️ Avatar Frame Silver'] },
    { level: 5, xpRequired: 7000, rewards: ['🎮 Ship: Fighter'] },
    { level: 6, xpRequired: 9000, rewards: ['🎨 Trade Room Style: Neon'] },
    { level: 7, xpRequired: 12000, rewards: ['🖼️ Avatar Frame Gold'] },
    { level: 8, xpRequired: 16000, rewards: ['🎮 Ship: Cruiser'] },
    { level: 9, xpRequired: 22000, rewards: ['🎯 Score Boost +15%'] },
    { level: 10, xpRequired: 30000, rewards: ['🌟 Secret Avatar'] },
  ];

  // Получаем награды для текущего уровня
  const getCurrentLevelRewards = () => {
    const current = levels.find(l => l.level === userLevel);
    return current ? current.rewards : [];
  };

  return (
    <div className="progress-page">
      <div className="page-header">
        <h1 className="page-title">Progress</h1>
        <button onClick={() => navigate('/menu')} className="close-button">
          {t('close')}
        </button>
      </div>

      <div className="menu-content">
        {/* XP Progress */}
        <div className="profile-card-glass progress-card">
          <div className="progress-xp-header">
            <span className="progress-level">Level {userLevel}</span>
            <span className="progress-xp-text">{userXP} / {xpToNextLevel} XP</span>
          </div>
          <div className="progress-xp-bar">
            <div 
              className="progress-xp-fill" 
              style={{ width: `${(userXP / xpToNextLevel) * 100}%` }} 
            />
          </div>
        </div>

        {/* Rewards for current level */}
        {getCurrentLevelRewards().length > 0 && (
          <div className="profile-card-glass progress-card">
            <div className="progress-card-title">Available Rewards</div>
            <div className="progress-rewards-grid">
              {getCurrentLevelRewards().map((reward, index) => {
                const [icon, ...nameParts] = reward.split(' ');
                return (
                  <div key={index} className="progress-reward-item">
                    <span className="progress-reward-icon">{icon}</span>
                    <span className="progress-reward-name">{nameParts.join(' ')}</span>
                    <button className="progress-claim-btn">Claim</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All Levels */}
        <div className="profile-card-glass progress-card">
          <div className="progress-card-title">Level Progression</div>
          <div className="progress-levels-list">
            {levels.map((level) => {
              const isUnlocked = level.level <= userLevel;
              const isCurrent = level.level === userLevel;
              
              return (
                <div 
                  key={level.level} 
                  className={`progress-level-item ${isUnlocked ? 'unlocked' : 'locked'} ${isCurrent ? 'current' : ''}`}
                >
                  <div className="progress-level-left">
                    <span className="progress-level-number">Level {level.level}</span>
                    <span className="progress-level-xp">{level.xpRequired} XP</span>
                  </div>
                  <div className="progress-level-rewards">
                    {level.rewards.map((reward, idx) => (
                      <span key={idx} className="progress-level-reward">
                        {reward}
                      </span>
                    ))}
                  </div>
                  <div className="progress-level-status">
                    {isUnlocked ? (
                      <span className="progress-status-unlocked">✅ Unlocked</span>
                    ) : (
                      <span className="progress-status-locked">🔒 Locked</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Progress;