import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { BubbleCard } from '../../components/ui';
import './Mempool.css';

interface MempoolStats {
  count: number;
  vsize: number;
  total_fee: number;
  fee_histogram: number[][];
}

interface Block {
  height: number;
  timestamp: number;
  tx_count: number;
  size: number;
}

const MEMPOOL_API = 'https://mempool.space/api';

const Mempool: React.FC = () => {
  const navigate = useNavigate();
  const [network, setNetwork] = useState<'mainnet' | 'testnet'>('mainnet');

  // Fetch mempool stats
  const { data: stats } = useQuery({
    queryKey: ['mempoolStats', network],
    queryFn: async () => {
      const baseUrl = network === 'testnet' ? 'https://mempool.space/testnet/api' : MEMPOOL_API;
      const response = await axios.get(`${baseUrl}/mempool`);
      return response.data as MempoolStats;
    },
    refetchInterval: 10000,
  });

  // Fetch recommended fees
  const { data: fees } = useQuery({
    queryKey: ['mempoolFees', network],
    queryFn: async () => {
      const baseUrl = network === 'testnet' ? 'https://mempool.space/testnet/api' : MEMPOOL_API;
      const response = await axios.get(`${baseUrl}/v1/fees/recommended`);
      return response.data as { fastestFee: number; halfHourFee: number; hourFee: number; economyFee: number };
    },
    refetchInterval: 30000,
  });

  // Fetch recent blocks
  const { data: blocks } = useQuery({
    queryKey: ['mempoolBlocks', network],
    queryFn: async () => {
      const baseUrl = network === 'testnet' ? 'https://mempool.space/testnet/api' : MEMPOOL_API;
      const response = await axios.get(`${baseUrl}/v1/blocks`);
      return (response.data as Block[]).slice(0, 5);
    },
    refetchInterval: 60000,
  });

  // Format number
  const formatNumber = (num: number): string => {
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toString();
  };

  // Format bytes
  const formatBytes = (bytes: number): string => {
    if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
    if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(2)} MB`;
    if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(2)} KB`;
    return `${bytes} B`;
  };

  return (
    <div className="mempool-page">
      <div className="page-header">
        <h1 className="page-title">Mempool</h1>
        <button onClick={() => navigate('/')} className="close-button">
          Close
        </button>
      </div>

      {/* Network toggle */}
      <div className="network-toggle">
        <button 
          className={`toggle-btn ${network === 'mainnet' ? 'active' : ''}`}
          onClick={() => setNetwork('mainnet')}
        >
          Mainnet
        </button>
        <button 
          className={`toggle-btn ${network === 'testnet' ? 'active' : ''}`}
          onClick={() => setNetwork('testnet')}
        >
          Testnet
        </button>
      </div>

      {/* Stats */}
      <BubbleCard className="mempool-stats-card">
        <h3>Mempool Statistics</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Transactions</span>
            <span className="stat-value">{formatNumber(stats?.count || 0)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Size</span>
            <span className="stat-value">{formatBytes(stats?.vsize || 0)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Fees</span>
            <span className="stat-value">{((stats?.total_fee || 0) / 1e8).toFixed(4)} BTC</span>
          </div>
        </div>
      </BubbleCard>

      {/* Fees */}
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

      {/* Recent blocks */}
      <div className="blocks-card">
        <h3>Recent Blocks</h3>
        <div className="blocks-list">
          {blocks?.map((block) => (
            <div key={block.height} className="block-item">
              <span className="block-height">#{block.height}</span>
              <span className="block-txs">{block.tx_count} txs</span>
              <span className="block-size">{formatBytes(block.size)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Mempool;

