import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import './Results.css';

const Results: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Данные пользователя (позже будут из стора)
  const userStats = {
    totalTrades: 66,
    winRate: 68,
    profit: 33,
    volume: '$1.4M',
    bestTrade: '+42%',
    worstTrade: '-12%',
    gamesPlayed: 42,
    gamesWon: 28,
    achievements: 12,
  };

  return (
    <div className="results-page">
      <div className="page-header">
        <h1 className="page-title">Results</h1>
        <button onClick={() => navigate('/menu')} className="close-button">
          {t('close')}
        </button>
      </div>

      <div className="menu-content">
        {/* Trading Stats */}
        <div className="profile-card-glass results-card">
          <div className="results-card-title">Trading Stats</div>
          <div className="results-grid">
            <div className="results-item">
              <span className="results-value">{userStats.totalTrades}</span>
              <span className="results-label">Total Trades</span>
            </div>
            <div className="results-item">
              <span className="results-value">{userStats.winRate}%</span>
              <span className="results-label">Win Rate</span>
            </div>
            <div className="results-item">
              <span className="results-value positive">+{userStats.profit}%</span>
              <span className="results-label">Profit</span>
            </div>
            <div className="results-item">
              <span className="results-value">{userStats.volume}</span>
              <span className="results-label">Volume</span>
            </div>
          </div>
        </div>

        {/* Best/Worst Trades */}
        <div className="profile-card-glass results-card">
          <div className="results-card-title">Best & Worst</div>
          <div className="results-row">
            <div className="results-item">
              <span className="results-value positive">{userStats.bestTrade}</span>
              <span className="results-label">Best Trade</span>
            </div>
            <div className="results-item">
              <span className="results-value negative">{userStats.worstTrade}</span>
              <span className="results-label">Worst Trade</span>
            </div>
          </div>
        </div>

        {/* Games Stats */}
        <div className="profile-card-glass results-card">
          <div className="results-card-title">Games Stats</div>
          <div className="results-grid">
            <div className="results-item">
              <span className="results-value">{userStats.gamesPlayed}</span>
              <span className="results-label">Games Played</span>
            </div>
            <div className="results-item">
              <span className="results-value">{userStats.gamesWon}</span>
              <span className="results-label">Games Won</span>
            </div>
            <div className="results-item">
              <span className="results-value">{userStats.achievements}</span>
              <span className="results-label">Achievements</span>
            </div>
            <div className="results-item">
              <span className="results-value">{Math.round((userStats.gamesWon / userStats.gamesPlayed) * 100)}%</span>
              <span className="results-label">Win Rate</span>
            </div>
          </div>
        </div>

        {/* Charts placeholder */}
        <div className="profile-card-glass results-card">
          <div className="results-card-title">Performance Chart</div>
          <div className="results-chart-placeholder">
            <span>📊 Chart will be here</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;