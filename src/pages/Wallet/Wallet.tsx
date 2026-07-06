import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { useQuery } from '@tanstack/react-query';
import { Wallet as WalletIcon } from 'lucide-react';
import { fetchTonBalance, fetchTonPrice } from '../../services/api';
import { BubbleCard } from '../../components/ui';
import { useTranslation } from '../../hooks/useTranslation';
import './Wallet.css';

const Wallet: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [tonConnectUI] = useTonConnectUI();
  const connected = tonConnectUI.connected;
  const wallet = tonConnectUI.wallet;
  const address = wallet?.account?.address || '';

  // Fetch balance
  const { data: balance } = useQuery({
    queryKey: ['tonBalance', address],
    queryFn: () => fetchTonBalance(address),
    enabled: !!address,
    refetchInterval: 10000,
  });

  // Fetch TON price
  const { data: tonData } = useQuery({
    queryKey: ['tonPrice'],
    queryFn: fetchTonPrice,
    refetchInterval: 30000,
  });

  // Calculate USD value
  const balanceNum = parseFloat(balance || '0');
  const usdValue = balanceNum * (tonData?.price || 0);

  // Format address
  const formatAddress = (addr: string): string => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  };

  return (
    <div className="wallet-page">
      <div className="page-header">
        <h1 className="page-title">{t('wallet')}</h1>
        <button onClick={() => navigate('/')} className="close-button">
          {t('close')}
        </button>
      </div>

      {connected && address ? (
        <>
          {/* Wallet card */}
          <BubbleCard className="wallet-card">
            <div className="wallet-header">
              <WalletIcon className="wallet-icon" />
              <h2>{t('ton_wallet')}</h2>
            </div>
            <div className="wallet-address">
              <span className="address-label">{t('address')}</span>
              <span className="address-value">{formatAddress(address)}</span>
            </div>
            <div className="wallet-balance">
              <span className="balance-label">{t('balance')}</span>
              <span className="balance-value">{balance || '0'} TON</span>
              <span className="balance-usd">${usdValue.toFixed(2)} USD</span>
            </div>
          </BubbleCard>

          {/* TON Analytics */}
          <div className="analytics-card">
            <h3 className="analytics-title">{t('ton_analytics')}</h3>
            <div className="analytics-grid">
              <div className="analytics-item">
                <span className="analytics-label">{t('ton_price')}</span>
                <span className="analytics-value">
                  ${tonData?.price.toFixed(2) || '—'}
                </span>
              </div>
              <div className="analytics-item">
                <span className="analytics-label">{t('change_24h')}</span>
                <span className={`analytics-value ${(tonData?.change24h || 0) >= 0 ? 'positive' : 'negative'}`}>
                  {(tonData?.change24h || 0) >= 0 ? '+' : ''}{tonData?.change24h.toFixed(2) || '0'}%
                </span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="wallet-connect">
          <BubbleCard className="connect-card">
            <WalletIcon className="connect-icon" />
            <h2>{t('connect_wallet')}</h2>
            <p>{t('connect_wallet_hint')}</p>
            <button 
              className="connect-btn"
              onClick={() => tonConnectUI.openModal()}
            >
              {t('connect_ton_wallet')}
            </button>
          </BubbleCard>
        </div>
      )}
    </div>
  );
};

export default Wallet;