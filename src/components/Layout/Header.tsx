import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TonConnectButton } from '@tonconnect/ui-react';
import { BubbleButton } from '../ui';

const Header: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header className="upper-nav-panel">
      <div className="header-button-container">
        <BubbleButton 
          className="nav-button"
          onClick={() => navigate('/mempool')}
        >
          Mempool
        </BubbleButton>
      </div>

      <div className="header-button-container">
        <BubbleButton 
          className="nav-button"
          onClick={() => navigate('/news')}
        >
          News
        </BubbleButton>
      </div>

      <div className="header-button-container connect-wallet-button">
        <TonConnectButton />
      </div>

      <div className="header-button-container">
        <BubbleButton
          className="nav-button"
          onClick={() => navigate('/wallet')}
        >
          Wallet Info
        </BubbleButton>
      </div>

      <div className="header-button-container">
        <BubbleButton
          className="nav-button"
          onClick={() => navigate('/menu')}
        >
          Menu
        </BubbleButton>
      </div>
    </header>
  );
};

export default Header;

