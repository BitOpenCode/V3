import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchTickers } from '../../services/api';
import { usePortfolioStore } from '../../store';
import { Ticker } from '../../types';
import { BubbleCard } from '../../components/ui';
import './Portfolio.css';

const Portfolio: React.FC = () => {
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPosition, setNewPosition] = useState({ symbol: 'BTC', amount: '', buyPrice: '' });

  // Zustand store
  const { positions, addPosition, removePosition } = usePortfolioStore();

  // Fetch tickers
  const { data: tickers } = useQuery({
    queryKey: ['tickers'],
    queryFn: fetchTickers,
    staleTime: 10000,
    refetchInterval: 10000,
  });

  // Get crypto list
  const cryptoList = tickers
    ?.filter((t: Ticker) => t.symbol.endsWith('USDT'))
    .map((t: Ticker) => t.symbol.replace('USDT', ''))
    .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i)
    .sort() || [];

  // Calculate portfolio with live prices using BigNumber for precision
  const portfolioWithPrices = useMemo(() => {
    if (!tickers) return positions;
    
    const { multiply, minus, calculateProfitPercent, bn } = require('../../utils/bignumber');
    
    return positions.map(pos => {
      const ticker = tickers.find((t: Ticker) => t.symbol === `${pos.symbol}USDT`);
      const currentPrice = ticker?.lastPrice || pos.currentPrice;
      
      const value = multiply(pos.amount, currentPrice);
      const cost = multiply(pos.amount, pos.buyPrice);
      const pnl = minus(value, cost);
      const pnlPercent = calculateProfitPercent(cost, value);
      
      return { 
        ...pos, 
        currentPrice, 
        value: parseFloat(value.toString()),
        pnl: parseFloat(pnl.toString()),
        pnlPercent: parseFloat(pnlPercent.toString()),
      };
    });
  }, [positions, tickers]);

  // Portfolio totals using BigNumber
  const totals = useMemo(() => {
    const { plus, minus, multiply, calculateProfitPercent, bn } = require('../../utils/bignumber');
    
    const totalValue = portfolioWithPrices.reduce(
      (sum, p) => plus(sum, p.value), 
      bn(0)
    );
    const totalCost = portfolioWithPrices.reduce(
      (sum, p) => plus(sum, multiply(p.amount, p.buyPrice)), 
      bn(0)
    );
    const totalPnl = minus(totalValue, totalCost);
    const totalPnlPercent = calculateProfitPercent(totalCost, totalValue);
    
    return { 
      totalValue: parseFloat(totalValue.toString()),
      totalCost: parseFloat(totalCost.toString()),
      totalPnl: parseFloat(totalPnl.toString()),
      totalPnlPercent: parseFloat(totalPnlPercent.toString()),
    };
  }, [portfolioWithPrices]);

  // Add position handler
  const handleAddPosition = () => {
    if (!newPosition.amount || !newPosition.buyPrice) return;
    
    addPosition({
      symbol: newPosition.symbol,
      amount: parseFloat(newPosition.amount),
      buyPrice: parseFloat(newPosition.buyPrice),
    });
    
    setNewPosition({ symbol: 'BTC', amount: '', buyPrice: '' });
    setShowAddForm(false);
  };

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="portfolio-page">
      <div className="page-header">
        <h1 className="page-title">Portfolio</h1>
        <button onClick={() => navigate('/')} className="close-button">
          Close
        </button>
      </div>

      {/* Summary */}
      <BubbleCard className="portfolio-summary">
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">Total Value</span>
            <span className="summary-value">{formatCurrency(totals.totalValue)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total P&L</span>
            <span className={`summary-value ${totals.totalPnl >= 0 ? 'positive' : 'negative'}`}>
              {totals.totalPnl >= 0 ? '+' : ''}{formatCurrency(totals.totalPnl)}
              <span className="pnl-percent">
                ({totals.totalPnlPercent >= 0 ? '+' : ''}{totals.totalPnlPercent.toFixed(2)}%)
              </span>
            </span>
          </div>
        </div>
      </BubbleCard>

      {/* Add button */}
      <button 
        className="add-position-btn"
        onClick={() => setShowAddForm(!showAddForm)}
      >
        {showAddForm ? '✕ Cancel' : '+ Add Position'}
      </button>

      {/* Add form */}
      {showAddForm && (
        <div className="add-form">
          <select
            value={newPosition.symbol}
            onChange={(e) => setNewPosition({...newPosition, symbol: e.target.value})}
            className="form-select"
          >
            {cryptoList.map((crypto: string) => (
              <option key={crypto} value={crypto}>{crypto}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Amount"
            value={newPosition.amount}
            onChange={(e) => setNewPosition({...newPosition, amount: e.target.value})}
            className="form-input"
          />
          <input
            type="number"
            placeholder="Buy Price (USD)"
            value={newPosition.buyPrice}
            onChange={(e) => setNewPosition({...newPosition, buyPrice: e.target.value})}
            className="form-input"
          />
          <button onClick={handleAddPosition} className="form-submit">Add</button>
        </div>
      )}

      {/* Positions list */}
      <div className="positions-list">
        {portfolioWithPrices.length === 0 ? (
          <div className="empty-state">
            <p>No positions yet</p>
            <p className="empty-hint">Add your first position to track your portfolio</p>
          </div>
        ) : (
          portfolioWithPrices.map((pos) => (
            <div key={pos.id} className="position-card">
              <div className="position-header">
                <span className="position-symbol">{pos.symbol}</span>
                <button 
                  className="position-remove"
                  onClick={() => removePosition(pos.id)}
                >
                  ✕
                </button>
              </div>
              <div className="position-details">
                <div className="detail-row">
                  <span>Amount:</span>
                  <span>{pos.amount}</span>
                </div>
                <div className="detail-row">
                  <span>Buy Price:</span>
                  <span>{formatCurrency(pos.buyPrice)}</span>
                </div>
                <div className="detail-row">
                  <span>Current:</span>
                  <span>{formatCurrency(pos.currentPrice)}</span>
                </div>
                <div className="detail-row">
                  <span>Value:</span>
                  <span className="value">{formatCurrency(pos.value)}</span>
                </div>
                <div className="detail-row">
                  <span>P&L:</span>
                  <span className={pos.pnl >= 0 ? 'positive' : 'negative'}>
                    {pos.pnl >= 0 ? '+' : ''}{formatCurrency(pos.pnl)} ({pos.pnlPercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Portfolio;
