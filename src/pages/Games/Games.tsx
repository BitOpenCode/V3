import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BubbleCard } from '../../components/ui';
import './Games.css';

interface GameCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  route?: string;
  comingSoon?: boolean;
}

const games: GameCard[] = [
  {
    id: 'spaceship',
    title: 'Space Ship',
    description: 'Navigate through space, shoot enemies and collect bonuses!',
    icon: '🚀',
    route: '/games/spaceship',
  },
  {
    id: 'runroad',
    title: 'Run the Road',
    description: 'Run and dodge obstacles on the road!',
    icon: '🏃',
    route: '/games/runroad',
  },
  {
    id: 'hugme',
    title: 'Hug Me',
    description: 'Hug the bunnies and earn points!',
    icon: '🐰',
    route: '/games/hugme',
  },
];

const Games: React.FC = () => {
  const navigate = useNavigate();

  const handleGameClick = (game: GameCard) => {
    if (game.route && !game.comingSoon) {
      navigate(game.route);
    }
  };

  return (
    <div className="games-page">
      <div className="page-header">
        <h1 className="page-title">Games</h1>
        <button onClick={() => navigate('/')} className="close-button">
          Close
        </button>
      </div>

      <div className="games-grid">
        {games.map((game) => (
          <BubbleCard
            key={game.id}
            className={`game-card ${game.comingSoon ? 'coming-soon' : 'playable'}`}
            onClick={() => handleGameClick(game)}
          >
            <div className="game-card-content">
              <span className="game-icon">{game.icon}</span>
              <h3 className="game-title">{game.title}</h3>
              <p className="game-description">{game.description}</p>
              {game.comingSoon ? (
                <span className="coming-soon-badge">Coming Soon</span>
              ) : (
                <span className="play-badge">Play Now</span>
              )}
            </div>
          </BubbleCard>
        ))}
      </div>
    </div>
  );
};

export default Games;