import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TonConnectButton } from '@tonconnect/ui-react';
import { BubbleButton } from '../ui';
import { useTranslation } from '../../hooks/useTranslation';
import { useWalletActivation } from '../../context/WalletActivation';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { active, activate } = useWalletActivation();

  return (
    <header className="upper-nav-panel">
      <div className="header-button-container">
        <BubbleButton 
          className="nav-button"
          onClick={() => navigate('/mempool')}
        >
          {t('mempool')}
        </BubbleButton>
      </div>

      <div className="header-button-container">
        <BubbleButton 
          className="nav-button"
          onClick={() => navigate('/news')}
        >
          {t('news')}
        </BubbleButton>
      </div>

      <div className="header-button-container connect-wallet-button">
        {active ? (
          <TonConnectButton />
        ) : (
          <button
            type="button"
            className="ton-connect-placeholder-button"
            onClick={() => activate(true)}
          >
            {t('connect_wallet')}
          </button>
        )}
      </div>

      <div className="header-button-container">
        <BubbleButton
          className="nav-button"
          onClick={() => navigate('/wallet')}
        >
          {t('wallet')}
        </BubbleButton>
      </div>

      <div className="header-button-container">
        <BubbleButton
          className="nav-button"
          onClick={() => navigate('/menu')}
        >
          {t('menu')}
        </BubbleButton>
      </div>
    </header>
  );
};

export default Header;