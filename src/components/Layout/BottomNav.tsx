import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BubbleButton } from '../ui';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[--color-primary-black] border-t-2 border-[--color-primary-purple] z-[150] py-3">
      <div className="container mx-auto flex justify-center">
        <BubbleButton
          onClick={() => navigate('/chart')}
          className="nav-button-content bg-[--color-primary-blue] text-white rounded font-rajdhani"
        >
          Chart
        </BubbleButton>
        <BubbleButton 
          onClick={() => navigate('/tickers')}
          className="nav-button-content bg-[--color-primary-blue] text-white rounded font-rajdhani"
        >
          Tickers
        </BubbleButton>
        <BubbleButton 
          onClick={() => navigate('/orderbook')}
          className="nav-button-content bg-[--color-primary-blue] text-white rounded font-rajdhani"
        >
          Order Book
        </BubbleButton>
        <BubbleButton 
          onClick={() => navigate('/share')}
          className="nav-button-content bg-[--color-primary-blue] text-white rounded font-rajdhani"
        >
          Share
        </BubbleButton>
        <BubbleButton 
          onClick={() => navigate('/calculator')}
          className="nav-button-content bg-[--color-primary-blue] text-white rounded font-rajdhani"
        >
          Calculator
        </BubbleButton>
        <BubbleButton 
          onClick={() => navigate('/portfolio')}
          className="nav-button-content bg-[--color-primary-blue] text-white rounded font-rajdhani"
        >
          Portfolio
        </BubbleButton>
      </div>
    </div>
  );
};

export default BottomNav;

