import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchTickers } from '../../services/api';
import { usePortfolioStore } from '../../store';
import { Ticker } from '../../types';
import { BubbleCard } from '../../components/ui';
import { multiply, minus, plus, bn, calculateProfitPercent } from '../../utils/bignumber';
import { useTranslation } from '../../hooks/useTranslation';
import './Portfolio.css';

const Portfolio: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPosition, setNewPosition] = useState({ symbol: '', amount: '', buyPrice: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  const { positions, addPosition, removePosition } = usePortfolioStore();

  const { data: tickers } = useQuery({
    queryKey: ['tickers'],
    queryFn: fetchTickers,
    staleTime: 10000,
    refetchInterval: 10000,
  });

  const cryptoList = tickers
    ?.filter((t: Ticker) => t.symbol.endsWith('USDT'))
    .map((t: Ticker) => t.symbol.replace('USDT', ''))
    .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i)
    .sort() || [];

  const filteredSymbols = cryptoList.filter((symbol: string) =>
    symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const portfolioWithPrices = useMemo(() => {
    if (!tickers) return positions;
    
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

  const totals = useMemo(() => {
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

  const handleAddPosition = () => {
    if (!newPosition.symbol || !newPosition.amount || !newPosition.buyPrice) return;
    
    addPosition({
      symbol: newPosition.symbol,
      amount: parseFloat(newPosition.amount),
      buyPrice: parseFloat(newPosition.buyPrice),
    });
    
    setNewPosition({ symbol: '', amount: '', buyPrice: '' });
    setShowAddForm(false);
    setSearchQuery('');
  };

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
        <h1 className="page-title">{t('portfolio')}</h1>
        <button onClick={() => navigate('/')} className="close-button">
          {t('close')}
        </button>
      </div>

      <BubbleCard className="portfolio-summary">
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">{t('total_value')}</span>
            <span className="summary-value">{formatCurrency(totals.totalValue)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">{t('total_pnl')}</span>
            <span className={`summary-value ${totals.totalPnl >= 0 ? 'positive' : 'negative'}`}>
              {totals.totalPnl >= 0 ? '+' : ''}{formatCurrency(totals.totalPnl)}
              <span className="pnl-percent">
                ({totals.totalPnlPercent >= 0 ? '+' : ''}{totals.totalPnlPercent.toFixed(2)}%)
              </span>
            </span>
          </div>
        </div>
      </BubbleCard>

      <button 
        className={`add-position-btn ${showAddForm ? 'active' : ''}`}
        onClick={() => setShowAddForm(!showAddForm)}
      >
        {showAddForm ? `✕ ${t('cancel')}` : `+ ${t('add_position')}`}
      </button>

      {showAddForm && (
        <div className="add-form">
          <div className="form-symbol-container" ref={dropdownRef}>
            <input
              type="text"
              placeholder={t('search_symbol')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && filteredSymbols.length > 0) {
                  setNewPosition({...newPosition, symbol: filteredSymbols[0]});
                  setSearchQuery(filteredSymbols[0]);
                  setIsDropdownOpen(false);
                  amountInputRef.current?.focus();
                }
              }}
              className="form-symbol-input"
            />
            {isDropdownOpen && filteredSymbols.length > 0 && (
              <div className="form-dropdown">
                {filteredSymbols.map((symbol: string) => (
                  <button
                    key={symbol}
                    onClick={() => {
                      setNewPosition({...newPosition, symbol});
                      setSearchQuery(symbol);
                      setIsDropdownOpen(false);
                      amountInputRef.current?.focus();
                    }}
                    className="dropdown-item"
                  >
                    {symbol}
                  </button>
                ))}
              </div>
            )}
          </div>
          <input
            ref={amountInputRef}
            type="number"
            placeholder={t('amount')}
            value={newPosition.amount}
            onChange={(e) => setNewPosition({...newPosition, amount: e.target.value})}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            className="form-input"
          />
          <input
            type="number"
            placeholder={t('buy_price_usd')}
            value={newPosition.buyPrice}
            onChange={(e) => setNewPosition({...newPosition, buyPrice: e.target.value})}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
                handleAddPosition();
              }
            }}
            className="form-input"
          />
          <button onClick={handleAddPosition} className="form-submit">{t('add')}</button>
        </div>
      )}

      <div className="positions-list">
        {portfolioWithPrices.length === 0 ? (
          <div className="empty-state">
            <p>{t('no_positions')}</p>
            <p className="empty-hint">{t('add_first_position')}</p>
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
                  <span>{t('amount')}:</span>
                  <span>{pos.amount}</span>
                </div>
                <div className="detail-row">
                  <span>{t('buy_price')}:</span>
                  <span>{formatCurrency(pos.buyPrice)}</span>
                </div>
                <div className="detail-row">
                  <span>{t('current_price')}:</span>
                  <span>{formatCurrency(pos.currentPrice)}</span>
                </div>
                <div className="detail-row">
                  <span>{t('value')}:</span>
                  <span className="value">{formatCurrency(pos.value)}</span>
                </div>
                <div className="detail-row">
                  <span>{t('pnl')}:</span>
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