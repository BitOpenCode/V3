import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BubbleButton } from '../ui';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-0">
      <div className="container">
        <BubbleButton
          onClick={() => navigate('/chart')}
          className="nav-button"
        >
          Chart
        </BubbleButton>
        <BubbleButton 
          onClick={() => navigate('/tickers')}
          className="nav-button"
        >
          Tickers
        </BubbleButton>
        <BubbleButton 
          onClick={() => navigate('/orderbook')}
          className="nav-button"
        >
          Order Book
        </BubbleButton>
        <BubbleButton 
          onClick={() => navigate('/share')}
          className="nav-button"
        >
          Share
        </BubbleButton>
        <BubbleButton 
          onClick={() => navigate('/calculator')}
          className="nav-button"
        >
          Calculator
        </BubbleButton>
        <BubbleButton 
          onClick={() => navigate('/portfolio')}
          className="nav-button"
        >
          Portfolio
        </BubbleButton>
      </div>
    </div>
  );
};

export default BottomNav;

