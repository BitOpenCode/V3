import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BubbleButton, BubbleCard } from '../../components/ui';
import './Home.css';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      {/* Hero Card with floating astronaut */}
      <BubbleCard className="hero-card">
        <img 
          src="https://uiverse.io/astronaut.png" 
          alt="Astronaut" 
          className="floating-avatar"
          draggable={false}
        />
      </BubbleCard>

      {/* Action Buttons */}
      <div className="main-buttons">
        <BubbleButton 
          className="nav-button main-action-button"
          onClick={() => navigate('/games')}
        >
          Games
        </BubbleButton>
        <BubbleButton 
          className="nav-button main-action-button"
          onClick={() => navigate('/avatars')}
        >
          Avatars
        </BubbleButton>
      </div>
    </div>
  );
};

export default Home;

