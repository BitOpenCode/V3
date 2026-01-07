import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchTickers, formatTickerPrice } from '../../services/api';
import { Ticker } from '../../types';
import './Calculator.css';

interface CalculatorForm {
  selectedCoin: Ticker | null;
  investment: number | null;
  initialPrice: number | null;
  projectedPrice: number | null;
}

const Calculator: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [form, setForm] = useState<CalculatorForm>({
    selectedCoin: null,
    investment: null,
    initialPrice: null,
    projectedPrice: null,
  });

  // Fetch tickers
  const { data: tickers = [] } = useQuery({
    queryKey: ['tickers'],
    queryFn: fetchTickers,
    staleTime: 30000,
  });

  // Filter coins for dropdown
  const filteredCoins = useMemo(() => {
    if (!searchQuery) return [];
    
    const query = searchQuery.toLowerCase();
    return tickers
      .filter((t: Ticker) => t.symbol.endsWith('USDT'))
      .filter((t: Ticker) => {
        const symbol = t.symbol.toLowerCase();
        const displaySymbol = symbol.replace('usdt', '/usdt');
        return symbol.includes(query) || displaySymbol.includes(query);
      })
      .sort((a: Ticker, b: Ticker) => {
        const aStartsWith = a.symbol.toLowerCase().startsWith(query);
        const bStartsWith = b.symbol.toLowerCase().startsWith(query);
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        return a.symbol.localeCompare(b.symbol);
      })
      .slice(0, 5);
  }, [searchQuery, tickers]);

  // Handle coin selection
  const handleCoinSelect = (ticker: Ticker) => {
    const price = parseFloat(ticker.lastPrice.toString());
    setForm({
      ...form,
      selectedCoin: ticker,
      initialPrice: price,
      projectedPrice: price,
    });
    setSearchQuery(ticker.symbol.replace('USDT', '/USDT'));
    setShowDropdown(false);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.coin-select-group')) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Calculate results using BigNumber for precision
  const results = useMemo(() => {
    if (!form.investment || !form.initialPrice || !form.projectedPrice) {
      return null;
    }

    const { divide, multiply, minus, plus, calculatePercentChange, toFixed } = require('../../utils/bignumber');
    
    const investment = form.investment;
    const initialPrice = form.initialPrice;
    const projectedPrice = form.projectedPrice;

    const tokensBought = divide(investment, initialPrice);
    const projectedSubtotal = multiply(tokensBought, projectedPrice);
    const projectedProfit = minus(projectedSubtotal, investment);
    const profitPercent = calculatePercentChange(investment, projectedSubtotal);
    const projectedTotal = plus(investment, projectedProfit);

    return {
      tokensBought: parseFloat(tokensBought.toString()),
      projectedSubtotal: parseFloat(projectedSubtotal.toString()),
      projectedProfit: parseFloat(projectedProfit.toString()),
      profitPercent: parseFloat(profitPercent.toString()),
      projectedTotal: parseFloat(projectedTotal.toString()),
    };
  }, [form]);

  // Update form
  const updateForm = (updates: Partial<CalculatorForm>) => {
    setForm(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="calculator-page">
      <div className="page-header">
        <h1 className="page-title">Calculator</h1>
        <button onClick={() => navigate('/')} className="close-button">
          Close
        </button>
      </div>

      <div className="calculator-card">
        {/* Coin Selection */}
        <div className="calc-group coin-select-group">
          <label className="calc-label">Select Coin</label>
          <input
            type="text"
            className="calc-input"
            placeholder="Search coin..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
          />
          
          {showDropdown && filteredCoins.length > 0 && (
            <div className="coin-dropdown">
              {filteredCoins.map((ticker: Ticker) => (
                <div
                  key={ticker.symbol}
                  onClick={() => handleCoinSelect(ticker)}
                  className="coin-option"
                >
                  {ticker.symbol.replace('USDT', '/USDT')} (${formatTickerPrice(ticker)})
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Investment Amount */}
        <div className="calc-group">
          <label className="calc-label">Investment Amount (USD)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="calc-input"
            placeholder="Enter amount..."
            value={form.investment || ''}
            onChange={(e) => updateForm({ investment: parseFloat(e.target.value) || null })}
          />
        </div>

        {/* Initial Price */}
        <div className="calc-group">
          <label className="calc-label">Initial Coin Price</label>
          <input
            type="number"
            min="0"
            step="0.00000001"
            className="calc-input"
            placeholder="Enter price..."
            value={form.initialPrice || ''}
            onChange={(e) => updateForm({ initialPrice: parseFloat(e.target.value) || null })}
          />
        </div>

        {/* Projected Price */}
        <div className="calc-group">
          <label className="calc-label">Projected Coin Price</label>
          <input
            type="number"
            min="0"
            step="0.00000001"
            className="calc-input"
            placeholder="Enter projected price..."
            value={form.projectedPrice || ''}
            onChange={(e) => updateForm({ projectedPrice: parseFloat(e.target.value) || null })}
          />
        </div>

        {/* Results */}
        {results && (
          <div className="calc-results">
            <div className="result-item">
              <span className="result-label">Tokens Bought</span>
              <span className="result-value">{results.tokensBought.toFixed(8)}</span>
            </div>
            <div className="result-item">
              <span className="result-label">Projected Subtotal</span>
              <span className="result-value">${results.projectedSubtotal.toFixed(2)}</span>
            </div>
            <div className="result-item">
              <span className="result-label">Projected Profit</span>
              <span className={`result-value ${results.projectedProfit >= 0 ? 'positive' : 'negative'}`}>
                {results.projectedProfit >= 0 ? '+' : ''}${results.projectedProfit.toFixed(2)}
              </span>
            </div>
            <div className="result-item">
              <span className="result-label">Profit %</span>
              <span className={`result-value ${results.profitPercent >= 0 ? 'positive' : 'negative'}`}>
                {results.profitPercent >= 0 ? '+' : ''}{results.profitPercent.toFixed(2)}%
              </span>
            </div>
            <div className="result-item highlight">
              <span className="result-label">Projected Total</span>
              <span className="result-value">${results.projectedTotal.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Calculator;
