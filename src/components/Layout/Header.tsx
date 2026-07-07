import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TonConnectButton } from '@tonconnect/ui-react';
import { Wallet as WalletIcon } from 'lucide-react';
import { BubbleButton } from '../ui';
import { useTranslation } from '../../hooks/useTranslation';
import { useWalletActivation, toTonConnectLocale } from '../../context/WalletActivation';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { active, activate } = useWalletActivation();
  // TonConnect's own button only has "en"/"ru" copy, so anything else it
  // shows falls back to English regardless of the app's language. Mirror
  // that here so the placeholder's text — and therefore its size — never
  // disagrees with what the real button swaps in to.
  const connectLabel = toTonConnectLocale(language) === 'ru' ? t('connect_wallet') : 'Connect Wallet';

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
            <WalletIcon size={18} />
            {connectLabel}
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