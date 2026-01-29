import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Conquer.css';

const Conquer: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="conquer-game">
      <div className="conquer-header">
        <button className="conquer-back-btn" onClick={() => navigate('/games')}>← Back</button>
        <h1>Conquer</h1>
      </div>
      
      <div className="conquer-content">
        <div className="conquer-soon-overlay">
          <button className="conquer-back-btn-overlay" onClick={() => navigate('/games')}>
            ← Back
          </button>
          <div className="conquer-soon-content">
            <h2>Soon</h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Conquer;
