import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import './Profile.css';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const user = {
    name: 'LilBitcoinVert',
    username: '@LilBitcoinVert',
    level: 42,
    xp: 8420,
    xpMax: 10000,
    stats: {
      missions: 248,
      distance: '12.4M km',
      bosses: 37,
      topPercent: 5,
    },
    reputation: 4.8,
    followers: 1234,
    achievements: [
      { name: 'Gold', icon: '🥇', unlocked: true },
      { name: 'Star', icon: '⭐', unlocked: true },
      { name: 'Target', icon: '🎯', unlocked: true },
      { name: 'Diamond', icon: '💎', unlocked: false },
      { name: 'Flame', icon: '🔥', unlocked: false },
    ],
    fleetShips: [
      { name: 'Nova Fighter', icon: '🚀', unlocked: true },
      { name: 'Eclipse Cruiser', icon: '🛸', unlocked: true },
      { name: 'Legendary Ship', icon: '⭐', unlocked: false },
    ],
  };

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
        <button onClick={() => navigate('/menu')} className="close-button">
          {t('close')}
        </button>
      </div>

      <div className="menu-content">
        {/* Avatar Card */}
        <div className="profile-card-glass profile-card avatar-card">
          <div className="avatar-wrapper">
            <div className="avatar-ring">
              <div className="avatar">
                <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                  <circle cx="50" cy="50" r="48" fill="#1a1a2e" stroke="#7c3aed" strokeWidth="2"/>
                  <circle cx="50" cy="38" r="16" fill="#2a2a4a"/>
                  <path d="M16 80C16 64 30 54 50 54C70 54 84 64 84 80" fill="#2a2a4a"/>
                  <circle cx="50" cy="50" r="50" fill="none" stroke="#7c3aed" strokeWidth="2" strokeDasharray="4 4"/>
                </svg>
                <div className="level-badge">★ {user.level}</div>
              </div>
            </div>
            <div className="avatar-info">
              <h2 className="profile-name">{user.name}</h2>
              <span className="profile-username">{user.username}</span>
              <div className="profile-rank">✦ Rank {user.level}</div>
            </div>
          </div>
        </div>

        {/* XP Bar Card */}
        <div className="profile-card-glass xp-card">
          <div className="xp-header">
            <span>XP Progress</span>
            <span>{user.xp} / {user.xpMax}</span>
          </div>
          <div className="xp-bar">
            <div className="xp-fill" style={{ width: `${(user.xp / user.xpMax) * 100}%` }} />
          </div>
        </div>

        {/* Stats Grid - 4 columns */}
        <div className="stats-grid-holo">
          <div className="profile-card-glass stat-card-holo">
            <div className="stat-holo">
              <span className="stat-holo-icon">🚀</span>
              <span className="stat-holo-value">{user.stats.missions}</span>
              <span className="stat-holo-label">Missions</span>
            </div>
          </div>
          <div className="profile-card-glass stat-card-holo">
            <div className="stat-holo">
              <span className="stat-holo-icon">🌌</span>
              <span className="stat-holo-value">{user.stats.distance}</span>
              <span className="stat-holo-label">Distance</span>
            </div>
          </div>
          <div className="profile-card-glass stat-card-holo">
            <div className="stat-holo">
              <span className="stat-holo-icon">👾</span>
              <span className="stat-holo-value">{user.stats.bosses}</span>
              <span className="stat-holo-label">Bosses</span>
            </div>
          </div>
          <div className="profile-card-glass stat-card-holo">
            <div className="stat-holo">
              <span className="stat-holo-icon">🏅</span>
              <span className="stat-holo-value">Top {user.stats.topPercent}%</span>
              <span className="stat-holo-label">Ranking</span>
            </div>
          </div>
        </div>

        {/* Social Stats Card */}
        <div className="profile-card-glass stats-card">
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{user.level}</span>
              <span className="stat-label">Level</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{user.followers}</span>
              <span className="stat-label">Crew</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{user.reputation}</span>
              <span className="stat-label">Reputation</span>
            </div>
          </div>
        </div>

        {/* Achievements Card */}
        <div className="profile-card-glass achievements-card">
          <div className="profile-card-title">Achievements</div>
          <div className="achievements-grid">
            {user.achievements.map((ach, index) => (
              <div key={index} className={`achievement-badge ${ach.unlocked ? 'unlocked' : 'locked'}`}>
                <span className="ach-icon">{ach.icon}</span>
                <span className="ach-name">{ach.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fleet Ships Card */}
        <div className="profile-card-glass fleet-card">
          <div className="profile-card-title">Fleet</div>
          <div className="fleet-grid">
            {user.fleetShips.map((ship, index) => (
              <div key={index} className={`fleet-ship ${ship.unlocked ? '' : 'locked'}`}>
                <span className="ship-icon">{ship.icon}</span>
                <span className="ship-name">{ship.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions Card */}
        <div className="profile-card-glass actions-card">
          <button className="profile-action-btn primary">Customize Identity</button>
          <button className="profile-action-btn">Share Profile</button>
        </div>
      </div>
    </div>
  );
};

export default Profile;