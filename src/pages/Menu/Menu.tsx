import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BubbleCard } from '../../components/ui';
import './Menu.css';

const Menu: React.FC = () => {
  const navigate = useNavigate();

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
      </div>
    </div>
  );
};

export default Menu;

