import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { BubbleCard } from '../../components/ui';
import './Mempool.css';

type Currency = 'BTC' | 'TON' | 'TRC20';

interface Block {
  id: string;
  height: number;
  timestamp: number;
  tx_count: number;
  size: number;
}

interface HashrateData {
  currentHashrate: string;
  currentDifficulty: string;
}

interface AddressData {
  chain_stats?: {
    funded_txo_sum: number;
    spent_txo_sum: number;
    tx_count: number;
  };
}

interface TxData {
  txid: string;
  status?: {
    confirmed: boolean;
    block_height?: number;
    block_time?: number;
  };
  size: number;
  weight: number;
  fee: number;
  vin: Array<{ prevout?: { value: number; scriptpubkey_address: string } }>;
  vout: Array<{ value: number; scriptpubkey_address?: string }>;
}

interface TonAddressData {
  balance: number;
  status: string;
  is_scam: boolean;
  interfaces?: string[];
}

interface TonJetton {
  balance: string;
  jetton: {
    address: string;
    symbol?: string;
    name?: string;
    decimals: number;
  };
}

interface TronAddressData {
  balance: number;
  bandwidth: { freeNetUsed: number; freeNetLimit: number };
  trc20token_balances: Array<{
    tokenName: string;
    tokenAbbr: string;
    balance: string;
    tokenDecimal: number;
  }>;
  transactions: number;
}

interface TronTxData {
  hash: string;
  confirmed: boolean;
  block: number;
  timestamp: number;
  ownerAddress: string;
  toAddress: string;
  contractType: number;
  amount?: number;
  cost: { net_fee: number; energy_fee: number };
}

const MEMPOOL_API = 'https://mempool.space/api';
const TONAPI_URL = 'https://tonapi.io/v2';
const TRONSCAN_API = 'https://apilist.tronscan.org/api';

const Mempool: React.FC = () => {
  const navigate = useNavigate();
  const [currency, setCurrency] = useState<Currency>('BTC');
  
  // BTC State
  const [btcAddress, setBtcAddress] = useState('');
  const [btcAddressData, setBtcAddressData] = useState<AddressData | null>(null);
  const [btcAddressLoading, setBtcAddressLoading] = useState(false);
  const [btcAddressError, setBtcAddressError] = useState<string | null>(null);
  
  const [btcTxId, setBtcTxId] = useState('');
  const [btcTxData, setBtcTxData] = useState<TxData | null>(null);
  const [btcTxLoading, setBtcTxLoading] = useState(false);
  const [btcTxError, setBtcTxError] = useState<string | null>(null);
  
  // TON State
  const [tonAddress, setTonAddress] = useState('');
  const [tonAddressData, setTonAddressData] = useState<TonAddressData | null>(null);
  const [tonJettons, setTonJettons] = useState<TonJetton[]>([]);
  const [tonAddressLoading, setTonAddressLoading] = useState(false);
  const [tonAddressError, setTonAddressError] = useState<string | null>(null);

  // TRON/TRC20 State
  const [tronAddress, setTronAddress] = useState('');
  const [tronAddressData, setTronAddressData] = useState<TronAddressData | null>(null);
  const [tronAddressLoading, setTronAddressLoading] = useState(false);
  const [tronAddressError, setTronAddressError] = useState<string | null>(null);

  const [tronTxId, setTronTxId] = useState('');
  const [tronTxData, setTronTxData] = useState<TronTxData | null>(null);
  const [tronTxLoading, setTronTxLoading] = useState(false);
  const [tronTxError, setTronTxError] = useState<string | null>(null);

  // Fetch BTC blocks
  const { data: blocks } = useQuery({
    queryKey: ['mempoolBlocks'],
    queryFn: async () => {
      const response = await axios.get(`${MEMPOOL_API}/blocks`);
      return (response.data as Block[]).slice(0, 10);
    },
    refetchInterval: 60000,
    enabled: currency === 'BTC',
  });

  // Fetch hashrate
  const { data: hashrateData } = useQuery({
    queryKey: ['mempoolHashrate'],
    queryFn: async () => {
      const response = await axios.get(`${MEMPOOL_API}/v1/mining/hashrate/3d`);
      const data = response.data;
      return {
        currentHashrate: formatHashrate(data.currentHashrate),
        currentDifficulty: formatDifficulty(data.currentDifficulty),
      } as HashrateData;
    },
    refetchInterval: 60000,
    enabled: currency === 'BTC',
  });

  // Fetch recommended fees
  const { data: fees } = useQuery({
    queryKey: ['mempoolFees'],
    queryFn: async () => {
      const response = await axios.get(`${MEMPOOL_API}/v1/fees/recommended`);
      return response.data as { fastestFee: number; halfHourFee: number; hourFee: number; economyFee: number };
    },
    refetchInterval: 30000,
    enabled: currency === 'BTC',
  });

  // Format functions
  const formatHashrate = (hashrate: number): string => {
    if (hashrate >= 1e18) return `${(hashrate / 1e18).toFixed(2)} EH/s`;
    if (hashrate >= 1e15) return `${(hashrate / 1e15).toFixed(2)} PH/s`;
    if (hashrate >= 1e12) return `${(hashrate / 1e12).toFixed(2)} TH/s`;
    return `${hashrate} H/s`;
  };

  const formatDifficulty = (difficulty: number): string => {
    if (difficulty >= 1e12) return `${(difficulty / 1e12).toFixed(2)} T`;
    if (difficulty >= 1e9) return `${(difficulty / 1e9).toFixed(2)} B`;
    if (difficulty >= 1e6) return `${(difficulty / 1e6).toFixed(2)} M`;
    return difficulty.toString();
  };

  const formatBtc = (satoshis: number): string => {
    return (satoshis / 1e8).toFixed(8);
  };

  const formatTon = (nanotons: number): string => {
    return (nanotons / 1e9).toFixed(4);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
    if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(2)} MB`;
    if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(2)} KB`;
    return `${bytes} B`;
  };

  const formatTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  // BTC Address Lookup
  const lookupBtcAddress = async () => {
    if (!btcAddress.trim()) {
      setBtcAddressError('Please enter a Bitcoin address');
      return;
    }

    setBtcAddressLoading(true);
    setBtcAddressError(null);
    setBtcAddressData(null);

    try {
      const response = await axios.get(`${MEMPOOL_API}/address/${btcAddress.trim()}`);
      setBtcAddressData(response.data);
    } catch (error: any) {
      setBtcAddressError(error.response?.status === 404 
        ? 'Address not found or has no transactions' 
        : 'Error fetching address data');
    } finally {
      setBtcAddressLoading(false);
    }
  };

  // BTC Transaction Lookup
  const lookupBtcTransaction = async () => {
    if (!btcTxId.trim()) {
      setBtcTxError('Please enter a Transaction ID');
      return;
    }

    setBtcTxLoading(true);
    setBtcTxError(null);
    setBtcTxData(null);

    try {
      const response = await axios.get(`${MEMPOOL_API}/tx/${btcTxId.trim()}`);
      setBtcTxData(response.data);
    } catch (error: any) {
      setBtcTxError(error.response?.status === 404 
        ? 'Transaction not found' 
        : 'Error fetching transaction data');
    } finally {
      setBtcTxLoading(false);
    }
  };

  // TON Address Lookup
  const lookupTonAddress = async () => {
    if (!tonAddress.trim()) {
      setTonAddressError('Please enter a TON address');
      return;
    }

    setTonAddressLoading(true);
    setTonAddressError(null);
    setTonAddressData(null);
    setTonJettons([]);

    try {
      // Fetch account data
      const accountResponse = await axios.get(`${TONAPI_URL}/accounts/${tonAddress.trim()}`);
      setTonAddressData(accountResponse.data);

      // Fetch jetton balances
      try {
        const jettonsResponse = await axios.get(`${TONAPI_URL}/accounts/${tonAddress.trim()}/jettons/balances`);
        if (jettonsResponse.data.balances) {
          setTonJettons(jettonsResponse.data.balances.filter((j: TonJetton) => parseFloat(j.balance) > 0));
        }
      } catch {
        // Jettons fetch failed, not critical
      }
    } catch (error: any) {
      setTonAddressError(error.response?.status === 404 
        ? 'Address not found' 
        : 'Error fetching address data');
    } finally {
      setTonAddressLoading(false);
    }
  };

  // TRON Address Lookup
  const lookupTronAddress = async () => {
    if (!tronAddress.trim()) {
      setTronAddressError('Please enter a TRON address');
      return;
    }

    setTronAddressLoading(true);
    setTronAddressError(null);
    setTronAddressData(null);

    try {
      const response = await axios.get(`${TRONSCAN_API}/account?address=${tronAddress.trim()}`);
      setTronAddressData(response.data);
    } catch (error: any) {
      setTronAddressError('Error fetching address data');
    } finally {
      setTronAddressLoading(false);
    }
  };

  // TRON Transaction Lookup
  const lookupTronTransaction = async () => {
    if (!tronTxId.trim()) {
      setTronTxError('Please enter a Transaction Hash');
      return;
    }

    setTronTxLoading(true);
    setTronTxError(null);
    setTronTxData(null);

    try {
      const response = await axios.get(`${TRONSCAN_API}/transaction-info?hash=${tronTxId.trim()}`);
      if (response.data && response.data.hash) {
        setTronTxData(response.data);
      } else {
        setTronTxError('Transaction not found');
      }
    } catch (error: any) {
      setTronTxError('Error fetching transaction data');
    } finally {
      setTronTxLoading(false);
    }
  };

  // Format TRX
  const formatTrx = (sun: number): string => {
    return (sun / 1e6).toFixed(6);
  };

  return (
    <div className="mempool-page">
      <div className="page-header">
        <h1 className="page-title">Mempool Explorer</h1>
        <button onClick={() => navigate('/')} className="close-button">
          Close
        </button>
      </div>

      {/* Currency selector */}
      <div className="currency-selector">
        <button 
          className={`currency-btn ${currency === 'BTC' ? 'active' : ''}`}
          onClick={() => setCurrency('BTC')}
        >
          ₿ BTC
        </button>
        <button 
          className={`currency-btn ${currency === 'TON' ? 'active' : ''}`}
          onClick={() => setCurrency('TON')}
        >
          💎 TON
        </button>
        <button 
          className={`currency-btn ${currency === 'TRC20' ? 'active' : ''}`}
          onClick={() => setCurrency('TRC20')}
        >
          🔴 TRC20
        </button>
      </div>

      {/* BTC Section */}
      {currency === 'BTC' && (
        <>
          {/* Address Lookup */}
          <BubbleCard className="lookup-card">
            <h3>Bitcoin Address Lookup</h3>
            <div className="lookup-input-group">
              <input
                type="text"
                placeholder="Enter BTC address"
                value={btcAddress}
                onChange={(e) => setBtcAddress(e.target.value)}
                className="lookup-input"
              />
              <button 
                onClick={lookupBtcAddress}
                disabled={btcAddressLoading}
                className="lookup-btn"
              >
                {btcAddressLoading ? '...' : 'Lookup'}
              </button>
            </div>
            
            {btcAddressError && <div className="lookup-error">{btcAddressError}</div>}
            
            {btcAddressData && (
              <div className="lookup-result">
                <div className="result-row">
                  <span>Balance:</span>
                  <span>{formatBtc((btcAddressData.chain_stats?.funded_txo_sum || 0) - (btcAddressData.chain_stats?.spent_txo_sum || 0))} BTC</span>
                </div>
                <div className="result-row">
                  <span>Transactions:</span>
                  <span>{btcAddressData.chain_stats?.tx_count || 0}</span>
                </div>
                <div className="result-row">
                  <span>Received:</span>
                  <span>{formatBtc(btcAddressData.chain_stats?.funded_txo_sum || 0)} BTC</span>
                </div>
                <div className="result-row">
                  <span>Spent:</span>
                  <span>{formatBtc(btcAddressData.chain_stats?.spent_txo_sum || 0)} BTC</span>
                </div>
              </div>
            )}
          </BubbleCard>

          {/* Transaction Lookup */}
          <BubbleCard className="lookup-card">
            <h3>Transaction Lookup</h3>
            <div className="lookup-input-group">
              <input
                type="text"
                placeholder="Enter Transaction ID (TXID)"
                value={btcTxId}
                onChange={(e) => setBtcTxId(e.target.value)}
                className="lookup-input"
              />
              <button 
                onClick={lookupBtcTransaction}
                disabled={btcTxLoading}
                className="lookup-btn"
              >
                {btcTxLoading ? '...' : 'Lookup'}
              </button>
            </div>
            
            {btcTxError && <div className="lookup-error">{btcTxError}</div>}
            
            {btcTxData && (
              <div className="lookup-result">
                <div className="result-row">
                  <span>Status:</span>
                  <span className={btcTxData.status?.confirmed ? 'text-green' : 'text-yellow'}>
                    {btcTxData.status?.confirmed ? 'Confirmed' : 'Unconfirmed'}
                  </span>
                </div>
                <div className="result-row">
                  <span>Block:</span>
                  <span>{btcTxData.status?.block_height || 'Pending'}</span>
                </div>
                <div className="result-row">
                  <span>Size:</span>
                  <span>{btcTxData.size} bytes</span>
                </div>
                <div className="result-row">
                  <span>Fee:</span>
                  <span>{formatBtc(btcTxData.fee)} BTC</span>
                </div>
                <div className="result-row">
                  <span>Inputs:</span>
                  <span>{btcTxData.vin.length}</span>
                </div>
                <div className="result-row">
                  <span>Outputs:</span>
                  <span>{btcTxData.vout.length}</span>
                </div>
              </div>
            )}
          </BubbleCard>

          {/* Hashrate & Difficulty */}
          <div className="stats-row">
            <div className="stat-card">
              <span className="stat-label">Hashrate</span>
              <span className="stat-value">{hashrateData?.currentHashrate || '—'}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Difficulty</span>
              <span className="stat-value">{hashrateData?.currentDifficulty || '—'}</span>
            </div>
          </div>

          {/* Recommended Fees */}
          <div className="fees-card">
            <h3>Recommended Fees (sat/vB)</h3>
            <div className="fees-grid">
              <div className="fee-item fastest">
                <span className="fee-label">Fastest</span>
                <span className="fee-value">{fees?.fastestFee || '—'}</span>
              </div>
              <div className="fee-item medium">
                <span className="fee-label">30 min</span>
                <span className="fee-value">{fees?.halfHourFee || '—'}</span>
              </div>
              <div className="fee-item slow">
                <span className="fee-label">1 hour</span>
                <span className="fee-value">{fees?.hourFee || '—'}</span>
              </div>
              <div className="fee-item economy">
                <span className="fee-label">Economy</span>
                <span className="fee-value">{fees?.economyFee || '—'}</span>
              </div>
            </div>
          </div>

          {/* Recent Blocks */}
          <div className="blocks-card">
            <h3>Latest Blocks</h3>
            <div className="blocks-list">
              {blocks?.map((block) => (
                <div key={block.id} className="block-item">
                  <span className="block-height">#{block.height}</span>
                  <span className="block-time">{formatTimeAgo(block.timestamp)}</span>
                  <span className="block-txs">{block.tx_count} txs</span>
                  <span className="block-size">{formatBytes(block.size)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* TON Section */}
      {currency === 'TON' && (
        <>
          {/* TON Address Lookup */}
          <BubbleCard className="lookup-card">
            <h3>TON Address Lookup</h3>
            <div className="lookup-input-group">
              <input
                type="text"
                placeholder="Enter TON address"
                value={tonAddress}
                onChange={(e) => setTonAddress(e.target.value)}
                className="lookup-input"
              />
              <button 
                onClick={lookupTonAddress}
                disabled={tonAddressLoading}
                className="lookup-btn"
              >
                {tonAddressLoading ? '...' : 'Lookup'}
              </button>
            </div>
            
            {tonAddressError && <div className="lookup-error">{tonAddressError}</div>}
            
            {tonAddressData && (
              <div className="lookup-result">
                <div className="result-row">
                  <span>Balance:</span>
                  <span>{formatTon(tonAddressData.balance)} TON</span>
                </div>
                <div className="result-row">
                  <span>Status:</span>
                  <span>{tonAddressData.status || 'N/A'}</span>
                </div>
                <div className="result-row">
                  <span>Is Scam:</span>
                  <span className={tonAddressData.is_scam ? 'text-red' : 'text-green'}>
                    {tonAddressData.is_scam ? 'Yes ⚠️' : 'No ✓'}
                  </span>
                </div>
                {tonAddressData.interfaces && tonAddressData.interfaces.length > 0 && (
                  <div className="result-row">
                    <span>Interfaces:</span>
                    <span>{tonAddressData.interfaces.join(', ')}</span>
                  </div>
                )}
              </div>
            )}

            {/* Jetton Balances */}
            {tonJettons.length > 0 && (
              <div className="jettons-section">
                <h4>Jetton Balances</h4>
                <div className="jettons-list">
                  {tonJettons.map((jetton) => (
                    <div key={jetton.jetton.address} className="jetton-item">
                      <span className="jetton-symbol">{jetton.jetton.symbol || jetton.jetton.name || 'Unknown'}</span>
                      <span className="jetton-balance">
                        {(parseFloat(jetton.balance) / Math.pow(10, jetton.jetton.decimals)).toFixed(4)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </BubbleCard>
        </>
      )}

      {/* TRC20/TRON Section */}
      {currency === 'TRC20' && (
        <>
          {/* TRON Address Lookup */}
          <BubbleCard className="lookup-card">
            <h3>TRON/TRC20 Address Lookup</h3>
            <div className="lookup-input-group">
              <input
                type="text"
                placeholder="Enter TRON address (T...)"
                value={tronAddress}
                onChange={(e) => setTronAddress(e.target.value)}
                className="lookup-input"
              />
              <button 
                onClick={lookupTronAddress}
                disabled={tronAddressLoading}
                className="lookup-btn"
              >
                {tronAddressLoading ? '...' : 'Lookup'}
              </button>
            </div>
            
            {tronAddressError && <div className="lookup-error">{tronAddressError}</div>}
            
            {tronAddressData && (
              <div className="lookup-result">
                <div className="result-row">
                  <span>TRX Balance:</span>
                  <span>{formatTrx(tronAddressData.balance)} TRX</span>
                </div>
                <div className="result-row">
                  <span>Transactions:</span>
                  <span>{tronAddressData.transactions || 0}</span>
                </div>
                <div className="result-row">
                  <span>Bandwidth:</span>
                  <span>{tronAddressData.bandwidth?.freeNetUsed || 0} / {tronAddressData.bandwidth?.freeNetLimit || 0}</span>
                </div>
              </div>
            )}

            {/* TRC20 Token Balances */}
            {tronAddressData?.trc20token_balances && tronAddressData.trc20token_balances.length > 0 && (
              <div className="jettons-section">
                <h4>TRC20 Tokens</h4>
                <div className="jettons-list">
                  {tronAddressData.trc20token_balances
                    .filter(token => parseFloat(token.balance) > 0)
                    .map((token, index) => (
                      <div key={index} className="jetton-item">
                        <span className="jetton-symbol">{token.tokenAbbr || token.tokenName}</span>
                        <span className="jetton-balance">
                          {(parseFloat(token.balance) / Math.pow(10, token.tokenDecimal)).toFixed(4)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </BubbleCard>

          {/* TRON Transaction Lookup */}
          <BubbleCard className="lookup-card">
            <h3>TRON Transaction Lookup</h3>
            <div className="lookup-input-group">
              <input
                type="text"
                placeholder="Enter Transaction Hash"
                value={tronTxId}
                onChange={(e) => setTronTxId(e.target.value)}
                className="lookup-input"
              />
              <button 
                onClick={lookupTronTransaction}
                disabled={tronTxLoading}
                className="lookup-btn"
              >
                {tronTxLoading ? '...' : 'Lookup'}
              </button>
            </div>
            
            {tronTxError && <div className="lookup-error">{tronTxError}</div>}
            
            {tronTxData && (
              <div className="lookup-result">
                <div className="result-row">
                  <span>Status:</span>
                  <span className={tronTxData.confirmed ? 'text-green' : 'text-yellow'}>
                    {tronTxData.confirmed ? 'Confirmed' : 'Unconfirmed'}
                  </span>
                </div>
                <div className="result-row">
                  <span>Block:</span>
                  <span>{tronTxData.block || 'Pending'}</span>
                </div>
                <div className="result-row">
                  <span>From:</span>
                  <span className="address-text">{tronTxData.ownerAddress?.slice(0, 8)}...{tronTxData.ownerAddress?.slice(-6)}</span>
                </div>
                <div className="result-row">
                  <span>To:</span>
                  <span className="address-text">{tronTxData.toAddress?.slice(0, 8)}...{tronTxData.toAddress?.slice(-6)}</span>
                </div>
                {tronTxData.amount && (
                  <div className="result-row">
                    <span>Amount:</span>
                    <span>{formatTrx(tronTxData.amount)} TRX</span>
                  </div>
                )}
                <div className="result-row">
                  <span>Net Fee:</span>
                  <span>{tronTxData.cost?.net_fee || 0} sun</span>
                </div>
                <div className="result-row">
                  <span>Energy Fee:</span>
                  <span>{tronTxData.cost?.energy_fee || 0} sun</span>
                </div>
              </div>
            )}
          </BubbleCard>
        </>
      )}
    </div>
  );
};

export default Mempool;
