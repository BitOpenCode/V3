import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BubbleCard } from '../../components/ui';
import './Avatars.css';

const Avatars: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="avatars-page">
      <div className="page-header">
        <h1 className="page-title">Avatars</h1>
        <button onClick={() => navigate('/')} className="close-button">
          Close
        </button>
      </div>

      <div className="avatars-grid">
        <BubbleCard className="avatar-card">
          <div className="avatar-card-content">
            <img 
              src="https://uiverse.io/astronaut.png" 
              alt="Astronaut"
              className="avatar-preview"
            />
            <h3>Astronaut</h3>
            <span className="avatar-status owned">Owned</span>
          </div>
        </BubbleCard>

        <BubbleCard className="avatar-card">
          <div className="avatar-card-content">
            <span className="avatar-placeholder">?</span>
            <h3>Coming Soon</h3>
            <span className="avatar-status locked">Locked</span>
          </div>
        </BubbleCard>

        <BubbleCard className="avatar-card">
          <div className="avatar-card-content">
            <span className="avatar-placeholder">?</span>
            <h3>Coming Soon</h3>
            <span className="avatar-status locked">Locked</span>
          </div>
        </BubbleCard>

        <BubbleCard className="avatar-card">
          <div className="avatar-card-content">
            <span className="avatar-placeholder">?</span>
            <h3>Coming Soon</h3>
            <span className="avatar-status locked">Locked</span>
          </div>
        </BubbleCard>
      </div>
    </div>
  );
};

export default Avatars;

