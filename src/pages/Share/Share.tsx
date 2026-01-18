import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchTickers, formatTickerPrice } from '../../services/api';
import { useFavoritesStore } from '../../store';
import { Ticker } from '../../types';
import './Share.css';

type AssetFilter = 'USDT' | 'BTC' | 'FAV';

const Share: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<AssetFilter>('USDT');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTickers, setSelectedTickers] = useState<string[]>([]);

  const { favorites } = useFavoritesStore();

  // Fetch tickers
  const { data: tickers = [], isLoading } = useQuery({
    queryKey: ['tickers'],
    queryFn: fetchTickers,
    staleTime: 30000,
  });

  // Filter tickers
  const filteredTickers = useMemo(() => {
    return tickers
      .filter((ticker: Ticker) => {
        if (filter === 'FAV') {
          return favorites.includes(ticker.symbol);
        }
        if (filter === 'USDT') {
          return ticker.symbol.endsWith('USDT') && 
                 !ticker.symbol.includes('UPUSDT') && 
                 !ticker.symbol.includes('DOWNUSDT');
        }
        if (filter === 'BTC') {
          return ticker.symbol.endsWith('BTC') && 
                 !ticker.symbol.includes('UPBTC') && 
                 !ticker.symbol.includes('DOWNBTC');
        }
        return true;
      })
      .filter((ticker: Ticker) => {
        if (!searchQuery) return true;
        return ticker.symbol.toLowerCase().includes(searchQuery.toLowerCase());
      })
      .sort((a: Ticker, b: Ticker) => b.quoteVolume - a.quoteVolume);
  }, [tickers, filter, searchQuery, favorites]);

  // Toggle ticker selection
  const toggleTicker = (symbol: string) => {
    setSelectedTickers(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  // Select all visible
  const selectAll = () => {
    const visibleSymbols = filteredTickers.slice(0, 20).map((t: Ticker) => t.symbol);
    setSelectedTickers(visibleSymbols);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedTickers([]);
  };

  // Share selected tickers
  const shareSelected = () => {
    if (selectedTickers.length === 0) return;

    const tickerData = selectedTickers
      .map(symbol => {
        const ticker = tickers.find((t: Ticker) => t.symbol === symbol);
        if (!ticker) return null;
        
        const price = formatTickerPrice(ticker);
        const change = ticker.priceChangePercent >= 0 
          ? `+${ticker.priceChangePercent.toFixed(2)}` 
          : ticker.priceChangePercent.toFixed(2);
        
        return {
          symbol: ticker.pair,
          price,
          change
        };
      })
      .filter(Boolean);

    const message = tickerData
      .map(t => `${t!.symbol}: $${t!.price} (${t!.change}%)`)
      .join('\n');

    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(message)}`;
    window.open(telegramUrl, '_blank');
    
    setSelectedTickers([]);
  };

  return (
    <div className="share-page">
      <div className="page-header">
        <h1 className="page-title">Share Tickers</h1>
        <button onClick={() => navigate('/')} className="close-button">
          Close
        </button>
      </div>

      {/* Search */}
      <div className="share-search-container">
        <input
          type="text"
          placeholder="Search tickers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="share-search"
        />
      </div>

      {/* Filters */}
      <div className="share-filters">
        <button
          className={`share-filter ${filter === 'USDT' ? 'active' : ''}`}
          onClick={() => setFilter('USDT')}
        >
          USDT
        </button>
        <button
          className={`share-filter ${filter === 'BTC' ? 'active' : ''}`}
          onClick={() => setFilter('BTC')}
        >
          BTC
        </button>
        <button
          className={`share-filter ${filter === 'FAV' ? 'active' : ''}`}
          onClick={() => setFilter('FAV')}
        >
          FAV {favorites.length > 0 && <span className="fav-star">★</span>}
        </button>
      </div>

      {/* Quick actions */}
      <div className="share-actions">
        <button className="action-btn" onClick={selectAll}>Select Top 20</button>
        <button className="action-btn" onClick={clearSelection}>Clear</button>
      </div>

      {/* Tickers grid */}
      {isLoading ? (
        <div className="share-loading">Loading tickers...</div>
      ) : (
        <div className="share-tickers-grid">
          {filteredTickers.slice(0, 100).map((ticker: Ticker) => (
            <div
              key={ticker.symbol}
              onClick={() => toggleTicker(ticker.symbol)}
              className={`share-ticker ${selectedTickers.includes(ticker.symbol) ? 'selected' : ''}`}
            >
              <div className="ticker-symbol">
                {ticker.pair}
              </div>
              <div className={`ticker-price ${ticker.priceChangePercent >= 0 ? 'positive' : 'negative'}`}>
                ${formatTickerPrice(ticker)}
              </div>
              <div className={`ticker-change ${ticker.priceChangePercent >= 0 ? 'positive' : 'negative'}`}>
                {ticker.priceChangePercent >= 0 ? '+' : ''}{ticker.priceChangePercent.toFixed(2)}%
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="share-footer">
        <div className="selected-count">
          Selected: {selectedTickers.length} tickers
        </div>
        <button
          className={`share-btn ${selectedTickers.length === 0 ? 'disabled' : ''}`}
          onClick={shareSelected}
          disabled={selectedTickers.length === 0}
        >
          Share to Telegram
        </button>
      </div>
    </div>
  );
};

export default Share;