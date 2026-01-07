import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BubbleCard } from '../../components/ui';
import './ComingSoon.css';

const ComingSoon: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get page name from path
  const pageName = location.pathname.slice(1).charAt(0).toUpperCase() + location.pathname.slice(2);

  return (
    <div className="coming-soon-page">
      <div className="page-header">
        <h1 className="page-title">{pageName}</h1>
        <button onClick={() => navigate('/')} className="close-button">
          Close
        </button>
      </div>

      <div className="coming-soon-content">
        <BubbleCard className="coming-soon-card">
          <div className="coming-soon-inner">
            <span className="coming-soon-icon">🚀</span>
            <h2>Coming Soon</h2>
            <p>This feature is under development. Stay tuned!</p>
          </div>
        </BubbleCard>
      </div>
    </div>
  );
};

export default ComingSoon;

