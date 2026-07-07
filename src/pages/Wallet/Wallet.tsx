import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { useQuery } from '@tanstack/react-query';
import { Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { fetchTonBalance, fetchTonPrice, fetchTonTransactions } from '../../services/api';
import { TonTransaction } from '../../types';
import { BubbleCard } from '../../components/ui';
import { useTranslation } from '../../hooks/useTranslation';
import { useWalletActivation } from '../../context/WalletActivation';
import './Wallet.css';

const formatShortAddress = (addr: string): string => {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
};

const formatTimeAgo = (timestamp: number): string => {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
};

const ConnectPrompt: React.FC<{ onConnect: () => void }> = ({ onConnect }) => {
  const { t } = useTranslation();
  return (
    <div className="wallet-connect">
      <BubbleCard className="connect-card">
        <WalletIcon className="connect-icon" />
        <h2>{t('connect_wallet')}</h2>
        <p>{t('connect_wallet_hint')}</p>
        <button className="connect-btn" onClick={onConnect}>
          {t('connect_ton_wallet')}
        </button>
      </BubbleCard>
    </div>
  );
};

// Only rendered once the TonConnect provider is actually mounted (see
// src/context/WalletActivation.tsx), so it's safe to call useTonConnectUI
// here without risking a missing-provider crash.
const WalletConnected: React.FC = () => {
  const { t } = useTranslation();
  const [tonConnectUI] = useTonConnectUI();
  const connected = tonConnectUI.connected;
  const wallet = tonConnectUI.wallet;
  const address = wallet?.account?.address || '';

  const { data: balance } = useQuery({
    queryKey: ['tonBalance', address],
    queryFn: () => fetchTonBalance(address),
    enabled: !!address,
    refetchInterval: 10000,
  });

  const { data: tonData } = useQuery({
    queryKey: ['tonPrice'],
    queryFn: fetchTonPrice,
    refetchInterval: 30000,
  });

  const { data: transactions, isLoading: transactionsLoading, isError: transactionsError } = useQuery({
    queryKey: ['tonTransactions', address],
    queryFn: () => fetchTonTransactions(address),
    enabled: !!address,
    refetchInterval: 20000,
  });

  const balanceNum = parseFloat(balance || '0');
  const usdValue = balanceNum * (tonData?.price || 0);

  if (!(connected && address)) {
    return <ConnectPrompt onConnect={() => tonConnectUI.openModal()} />;
  }

  return (
    <>
      {/* Wallet card */}
      <BubbleCard className="wallet-card">
        <div className="wallet-header">
          <WalletIcon className="wallet-icon" />
          <h2>{t('ton_wallet')}</h2>
        </div>
        <div className="wallet-address">
          <span className="address-label">{t('address')}</span>
          <span className="address-value">{formatShortAddress(address)}</span>
        </div>
        <div className="wallet-balance">
          <span className="balance-label">{t('balance')}</span>
          <span className="balance-value">{balance || '0'} GRAM</span>
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

      {/* Recent transactions */}
      <div className="analytics-card transactions-card">
        <h3 className="analytics-title">{t('recent_transactions')}</h3>
        <div className="transactions-list">
          {transactionsLoading ? (
            <div className="transactions-status">{t('loading_transactions')}</div>
          ) : transactionsError ? (
            <div className="transactions-status">{t('error_transactions')}</div>
          ) : !transactions || transactions.length === 0 ? (
            <div className="transactions-status">{t('no_transactions')}</div>
          ) : (
            transactions.map((tx: TonTransaction) => (
              <div key={tx.hash} className="transaction-row">
                <div
                  className={`transaction-icon ${tx.direction}`}
                  title={tx.direction === 'in' ? t('received') : t('sent')}
                >
                  {tx.direction === 'in' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                </div>
                <div className="transaction-details">
                  <span className="transaction-counterparty">{formatShortAddress(tx.counterparty)}</span>
                  <span className="transaction-time">{formatTimeAgo(tx.timestamp)}</span>
                </div>
                <span className={`transaction-amount ${tx.direction}`}>
                  {tx.direction === 'in' ? '+' : '-'}{tx.amount} GRAM
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

const Wallet: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { active, activate } = useWalletActivation();

  return (
    <div className="wallet-page">
      <div className="page-header">
        <h1 className="page-title">{t('wallet')}</h1>
        <button onClick={() => navigate('/')} className="close-button">
          {t('close')}
        </button>
      </div>

      {active ? <WalletConnected /> : <ConnectPrompt onConnect={() => activate(true)} />}
    </div>
  );
};

export default Wallet;
