import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BubbleButton } from '../ui';
import { useTranslation } from '../../hooks/useTranslation';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="fixed bottom-0">
      <div className="container">
        <BubbleButton
          onClick={() => navigate('/chart')}
          className="nav-button"
        >
          {t('chart')}
        </BubbleButton>
        <BubbleButton
          onClick={() => navigate('/tickers')}
          className="nav-button"
        >
          {t('tickers')}
        </BubbleButton>
        <BubbleButton
          onClick={() => navigate('/orderbook')}
          className="nav-button"
        >
          {t('orderbook')}
        </BubbleButton>
        <BubbleButton
          onClick={() => navigate('/share')}
          className="nav-button"
        >
          {t('share')}
        </BubbleButton>
        <BubbleButton
          onClick={() => navigate('/calculator')}
          className="nav-button"
        >
          {t('calculator')}
        </BubbleButton>
        <BubbleButton
          onClick={() => navigate('/portfolio')}
          className="nav-button"
        >
          {t('portfolio')}
        </BubbleButton>
      </div>
    </div>
  );
};

export default BottomNav;