import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchOrderBook, fetchTickers } from '../../services/api';
import { Ticker } from '../../types';
import './OrderBook.css';

const OrderBook: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSymbol = searchParams.get('symbol') || 'BTCUSDT';
  const [selectedSymbol, setSelectedSymbol] = useState(initialSymbol);
  const [searchQuery, setSearchQuery] = useState('');

  // Update symbol when URL changes
  useEffect(() => {
    const symbol = searchParams.get('symbol');
    if (symbol) {
      setSelectedSymbol(symbol);
    }
  }, [searchParams]);

  // Fetch tickers for symbol list
  const { data: tickers } = useQuery({
    queryKey: ['tickers'],
    queryFn: fetchTickers,
    staleTime: 30000,
  });

  // Fetch order book - update every 500ms for real-time feel
  const { data: orderBook, isLoading } = useQuery({
    queryKey: ['orderbook', selectedSymbol],
    queryFn: () => fetchOrderBook(selectedSymbol, 15),
    refetchInterval: 500,
  });

  // Filter symbols
  const filteredSymbols = tickers
    ?.filter((t: Ticker) => t.symbol.endsWith('USDT'))
    .filter((t: Ticker) => {
      if (!searchQuery) return true;
      return t.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .slice(0, 20) || [];

  // Format price
  const formatPrice = (price: number): string => {
    if (price >= 1000) return price.toFixed(2);
    if (price >= 1) return price.toFixed(4);
    return price.toFixed(6);
  };

  // Calculate max total for gradient width
  const maxTotal = orderBook 
    ? Math.max(
        ...orderBook.asks.map(a => a.total),
        ...orderBook.bids.map(b => b.total)
      )
    : 0;

  return (
    <div className="orderbook-page">
      <div className="page-header">
        <h1 className="page-title">Order Book</h1>
        <button onClick={() => navigate('/')} className="close-button">
          Close
        </button>
      </div>

      {/* Symbol search */}
      <div className="orderbook-search-container">
        <input
          type="text"
          placeholder="Search symbol..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="orderbook-search"
        />
      </div>

      {/* Symbol dropdown */}
      {searchQuery && (
        <div className="orderbook-dropdown">
          {filteredSymbols.map((t: Ticker) => (
            <button
              key={t.symbol}
              onClick={() => {
                setSelectedSymbol(t.symbol);
                setSearchQuery('');
              }}
              className="dropdown-item"
            >
              {t.pair}
            </button>
          ))}
        </div>
      )}

      {/* Selected symbol */}
      <div className="orderbook-symbol">
        <span className="symbol-name">{selectedSymbol.replace('USDT', '/USDT')}</span>
      </div>

      {isLoading ? (
        <div className="orderbook-loading">Loading...</div>
      ) : orderBook ? (
        <div className="orderbook-container">
          {/* Asks (sells) */}
          <div className="orderbook-section asks">
            <div className="section-header">
              <span>Price</span>
              <span>Amount</span>
              <span>Total</span>
            </div>
            {[...orderBook.asks].reverse().map((ask, i) => (
              <div 
                key={i} 
                className="orderbook-row ask"
                style={{ 
                  '--gradient-width': `${(ask.total / maxTotal) * 100}%` 
                } as React.CSSProperties}
              >
                <span className="price">{formatPrice(ask.price)}</span>
                <span className="amount">{ask.size.toFixed(4)}</span>
                <span className="total">${ask.total.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Spread */}
          <div className="orderbook-spread">
            Spread: ${orderBook.asks[0] && orderBook.bids[0] 
              ? (orderBook.asks[0].price - orderBook.bids[0].price).toFixed(2)
              : '—'}
          </div>

          {/* Bids (buys) */}
          <div className="orderbook-section bids">
            {orderBook.bids.map((bid, i) => (
              <div 
                key={i} 
                className="orderbook-row bid"
                style={{ 
                  '--gradient-width': `${(bid.total / maxTotal) * 100}%` 
                } as React.CSSProperties}
              >
                <span className="price">{formatPrice(bid.price)}</span>
                <span className="amount">{bid.size.toFixed(4)}</span>
                <span className="total">${bid.total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default OrderBook;

