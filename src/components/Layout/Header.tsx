import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TonConnectButton } from '@tonconnect/ui-react';
import { BubbleButton } from '../ui';

const Header: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header className="upper-nav-panel flex items-center justify-between px-1 text-sm lg:text-xl">
      <div className="header-button-container">
        <BubbleButton 
          className="nav-button-content bg-[--color-primary-blue] text-white rounded font-rajdhani" 
          onClick={() => navigate('/mempool')}
        >
          Mempool
        </BubbleButton>
      </div>

      <div className="header-button-container">
        <BubbleButton 
          className="nav-button-content bg-[--color-primary-blue] text-white rounded font-rajdhani" 
          onClick={() => navigate('/news')}
        >
          News
        </BubbleButton>
      </div>

      <div className="header-button-container flex items-center justify-center">
        <TonConnectButton />
      </div>

      <div className="header-button-container">
        <BubbleButton
          className="nav-button-content bg-[--color-primary-blue] text-white rounded font-rajdhani"
          onClick={() => navigate('/wallet')}
        >
          Wallet Info
        </BubbleButton>
      </div>

      <div className="relative header-button-container">
        <BubbleButton
          className="nav-button-content bg-[--color-primary-blue] text-white rounded font-rajdhani"
          onClick={() => navigate('/menu')}
        >
          Menu
        </BubbleButton>
      </div>
    </header>
  );
};

export default Header;

