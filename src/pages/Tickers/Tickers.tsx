import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchTickers, formatTickerPrice, createTickerWebSocket } from '../../services/api';
import { Ticker, TickerFilter, TickerSort, SortDirection } from '../../types';
import './Tickers.css';

const Tickers: React.FC = () => {
  const navigate = useNavigate();
  
  // Local state
  const [filter, setFilter] = useState<TickerFilter>('USDT');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<TickerSort>('volume');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('favoriteTickers');
    return saved ? JSON.parse(saved) : [];
  });
  const [liveTickers, setLiveTickers] = useState<Ticker[]>([]);

  // Fetch tickers with React Query
  const { data: initialTickers, isLoading, error } = useQuery({
    queryKey: ['tickers'],
    queryFn: fetchTickers,
    staleTime: 30000,
  });

  // WebSocket for real-time updates
  useEffect(() => {
    const ws = createTickerWebSocket((data) => {
      setLiveTickers(data);
    });

    return () => {
      ws.close();
    };
  }, []);

  // Merge initial and live tickers
  const tickers = useMemo(() => {
    if (!initialTickers) return [];
    
    const tickerMap = new Map(initialTickers.map(t => [t.symbol, t]));
    
    // Update with live data
    liveTickers.forEach(live => {
      if (tickerMap.has(live.symbol)) {
        tickerMap.set(live.symbol, {
          ...tickerMap.get(live.symbol)!,
          lastPrice: live.lastPrice,
          priceChangePercent: live.priceChangePercent,
          close: live.close,
        });
      }
    });
    
    return Array.from(tickerMap.values());
  }, [initialTickers, liveTickers]);

  // Filter and sort tickers
  const filteredTickers = useMemo(() => {
    let result = tickers;

    // Apply filter
    if (filter === 'USDT') {
      result = result.filter(t => t.symbol.endsWith('USDT'));
    } else if (filter === 'BTC') {
      result = result.filter(t => t.symbol.endsWith('BTC'));
    } else if (filter === 'FAV') {
      result = result.filter(t => favorites.includes(t.symbol));
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toUpperCase();
      result = result.filter(t => 
        t.symbol.includes(query) || t.pair.includes(query)
      );
    }

    // Apply sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'symbol':
          comparison = a.symbol.localeCompare(b.symbol);
          break;
        case 'price':
          comparison = a.lastPrice - b.lastPrice;
          break;
        case 'change':
          comparison = a.priceChangePercent - b.priceChangePercent;
          break;
        case 'volume':
          comparison = a.quoteVolume - b.quoteVolume;
          break;
      }
      return sortDir === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [tickers, filter, searchQuery, sortBy, sortDir, favorites]);

  // Toggle favorite
  const toggleFavorite = (symbol: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(symbol)
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol];
      localStorage.setItem('favoriteTickers', JSON.stringify(newFavorites));
      return newFavorites;
    });
  };

  // Toggle sort
  const handleSort = (column: TickerSort) => {
    if (sortBy === column) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('desc');
    }
  };

  // Format volume
  const formatVolume = (volume: number): string => {
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(2)}K`;
    return volume.toFixed(2);
  };

  return (
    <div className="tickers-page">
      <div className="page-header">
        <h1 className="page-title">Tickers </h1>
        <button onClick={() => navigate('/')} className="close-button">
          Close
        </button>
      </div>

      {/* Search */}
      <div className="tickers-search-container">
        <input
          type="text"
          placeholder="Search symbol..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="tickers-search"
        />
      </div>

      {/* Filters */}
      <div className="tickers-filters">
        {(['ALL', 'USDT', 'BTC', 'FAV'] as TickerFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`filter-button ${filter === f ? 'active' : ''}`}
          >
            {f === 'FAV' ? '⭐' : f}
          </button>
        ))}
      </div>

      {/* Table header */}
      <div className="tickers-table-header">
        <div onClick={() => handleSort('symbol')} className="sortable">
          Pair {sortBy === 'symbol' && (sortDir === 'asc' ? '↑' : '↓')}
        </div>
        <div onClick={() => handleSort('price')} className="sortable">
          Price {sortBy === 'price' && (sortDir === 'asc' ? '↑' : '↓')}
        </div>
        <div onClick={() => handleSort('change')} className="sortable">
          24h {sortBy === 'change' && (sortDir === 'asc' ? '↑' : '↓')}
        </div>
        <div onClick={() => handleSort('volume')} className="sortable">
          Vol {sortBy === 'volume' && (sortDir === 'asc' ? '↑' : '↓')}
        </div>
        <div className="fav-header">⭐</div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="tickers-loading">Loading tickers...</div>
      )}

      {/* Error state */}
      {error && (
        <div className="tickers-error">Failed to load tickers</div>
      )}

      {/* Tickers list */}
      <div className="tickers-list">
        {filteredTickers.map((ticker) => (
          <div 
            key={ticker.symbol} 
            className="ticker-row"
            onClick={() => navigate(`/orderbook?symbol=${ticker.symbol}`)}
          >
            <span className="ticker-pair">{ticker.pair}</span>
            <span className={`ticker-price ${ticker.priceChangePercent >= 0 ? 'positive' : 'negative'}`}>
              {formatTickerPrice(ticker)}
            </span>
            <span className={`ticker-change ${ticker.priceChangePercent >= 0 ? 'positive' : 'negative'}`}>
              {ticker.priceChangePercent >= 0 ? '↑' : '↓'} {Math.abs(ticker.priceChangePercent).toFixed(2)}%
            </span>
            <span className="ticker-volume">{formatVolume(ticker.quoteVolume)}</span>
            <button
              className="favorite-btn"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(ticker.symbol);
              }}
            >
              {favorites.includes(ticker.symbol) ? '★' : '☆'}
            </button>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {!isLoading && filteredTickers.length === 0 && (
        <div className="tickers-empty">No tickers found</div>
      )}
    </div>
  );
};

export default Tickers;

