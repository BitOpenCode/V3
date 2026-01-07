import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { useQuery } from '@tanstack/react-query';
import { Wallet as WalletIcon } from 'lucide-react';
import { fetchTonBalance, fetchTonPrice } from '../../services/api';
import { BubbleCard } from '../../components/ui';
import './Wallet.css';

const Wallet: React.FC = () => {
  const navigate = useNavigate();
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
        <h1 className="page-title">Wallet</h1>
        <button onClick={() => navigate('/')} className="close-button">
          Close
        </button>
      </div>

      {connected && address ? (
        <>
          {/* Wallet card */}
          <BubbleCard className="wallet-card">
            <div className="wallet-header">
              <WalletIcon className="wallet-icon" />
              <h2>TON Wallet</h2>
            </div>
            <div className="wallet-address">
              <span className="address-label">Address</span>
              <span className="address-value">{formatAddress(address)}</span>
            </div>
            <div className="wallet-balance">
              <span className="balance-label">Balance</span>
              <span className="balance-value">{balance || '0'} TON</span>
              <span className="balance-usd">${usdValue.toFixed(2)} USD</span>
            </div>
          </BubbleCard>

          {/* TON Analytics */}
          <div className="analytics-card">
            <h3 className="analytics-title">TON Analytics</h3>
            <div className="analytics-grid">
              <div className="analytics-item">
                <span className="analytics-label">TON Price</span>
                <span className="analytics-value">
                  ${tonData?.price.toFixed(2) || '—'}
                </span>
              </div>
              <div className="analytics-item">
                <span className="analytics-label">24h Change</span>
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
            <h2>Connect Wallet</h2>
            <p>Connect your TON wallet to view balance and analytics</p>
            <button 
              className="connect-btn"
              onClick={() => tonConnectUI.openModal()}
            >
              Connect TON Wallet
            </button>
          </BubbleCard>
        </div>
      )}
    </div>
  );
};

export default Wallet;

