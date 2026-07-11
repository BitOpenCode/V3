import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchOrderBook, fetchTickers } from '../../services/api';
import { Ticker, OrderBookEntry } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import './OrderBook.css';

// Groups raw price levels into buckets of `step` (e.g. every $100), summing
// size/total within each bucket -- same idea as the "grouping" control on
// exchange order books, so you can see where the real depth walls are
// instead of just the first few raw ticks.
const groupEntries = (entries: OrderBookEntry[], step: number, side: 'ask' | 'bid'): OrderBookEntry[] => {
  if (!step) return entries;

  const buckets = new Map<number, { size: number; total: number }>();
  for (const entry of entries) {
    const bucketPrice = Math.floor(entry.price / step) * step;
    const existing = buckets.get(bucketPrice);
    if (existing) {
      existing.size += entry.size;
      existing.total += entry.total;
    } else {
      buckets.set(bucketPrice, { size: entry.size, total: entry.total });
    }
  }

  const grouped: OrderBookEntry[] = Array.from(buckets.entries()).map(([price, { size, total }]) => ({
    price,
    size,
    total,
  }));

  // Asks: closest to the spread (lowest price) first. Bids: closest to the
  // spread (highest price) first.
  grouped.sort((a, b) => (side === 'ask' ? a.price - b.price : b.price - a.price));
  return grouped;
};

// Price-step options scale with the asset's own price so they stay
// sensible for both a $63,000 BTC book and a $0.03 altcoin book, while
// still landing on round numbers for a higher-priced pair. Capped at two
// steps -- coarser buckets collapse the book into too few rows to be useful.
const getStepOptions = (referencePrice: number): number[] => {
  if (!referencePrice || referencePrice <= 0) return [];
  const magnitude = Math.pow(10, Math.floor(Math.log10(referencePrice)));
  return [magnitude / 100, magnitude / 10];
};

const formatStepLabel = (step: number): string => {
  if (step >= 1000) return `${step / 1000}K`;
  if (step >= 1) return step.toString();
  return step.toFixed(Math.max(0, -Math.floor(Math.log10(step))));
};

const OrderBook: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialSymbol = searchParams.get('symbol') || 'BTCUSDT';
  const [selectedSymbol, setSelectedSymbol] = useState(initialSymbol);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [groupStep, setGroupStep] = useState(0);
  const [isStepMenuOpen, setIsStepMenuOpen] = useState(false);

  useEffect(() => {
    const symbol = searchParams.get('symbol');
    if (symbol) {
      setSelectedSymbol(symbol);
    }
  }, [searchParams]);

  // Reset grouping when switching symbols -- a step tuned for BTC's price
  // makes no sense for a $0.03 altcoin.
  useEffect(() => {
    setGroupStep(0);
  }, [selectedSymbol]);

  // Fetch tickers for symbol list
  const { data: tickers } = useQuery({
    queryKey: ['tickers'],
    queryFn: fetchTickers,
    staleTime: 30000,
  });

  // Fetch order book - update every 500ms for real-time feel. Grouped
  // views need a much deeper raw snapshot to have enough levels to
  // aggregate into meaningful buckets across the selected price range.
  // 5000 is Binance's max depth for this endpoint; even that is only
  // ~$1-2K of real coverage around the spread for a liquid pair like
  // BTC/USDT, so very coarse steps (1K/10K) may still collapse into a
  // couple of rows -- that reflects real book depth, not a bug here.
  const depthLimit = groupStep > 0 ? 5000 : 15;
  const { data: orderBook, isLoading } = useQuery({
    queryKey: ['orderbook', selectedSymbol, depthLimit],
    queryFn: () => fetchOrderBook(selectedSymbol, depthLimit),
    // Fetching 5000 levels for a grouped view is a lot more data than the
    // default 15 -- refresh it less aggressively to keep bandwidth sane.
    refetchInterval: groupStep > 0 ? 3000 : 500,
  });

  const stepOptions = useMemo(
    () => getStepOptions(orderBook?.asks[0]?.price ?? orderBook?.bids[0]?.price ?? 0),
    [orderBook]
  );

  const ROWS_SHOWN = 15;
  const groupedAsks = useMemo(
    () => groupEntries(orderBook?.asks ?? [], groupStep, 'ask').slice(0, ROWS_SHOWN),
    [orderBook, groupStep]
  );
  const groupedBids = useMemo(
    () => groupEntries(orderBook?.bids ?? [], groupStep, 'bid').slice(0, ROWS_SHOWN),
    [orderBook, groupStep]
  );

  // Filter symbols, sorted by volume. No cap here -- the dropdown itself
  // scrolls (max-height + overflow-y in CSS), so every USDT pair should
  // be reachable by scrolling, not just the first 20.
  const filteredSymbols = tickers
    ?.filter((t: Ticker) => t.symbol.endsWith('USDT'))
    .filter((t: Ticker) => {
      if (!searchQuery) return true;
      return t.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a: Ticker, b: Ticker) => b.quoteVolume - a.quoteVolume) || [];

  const formatPrice = (price: number): string => {
    if (price >= 1000) return price.toFixed(2);
    if (price >= 1) return price.toFixed(4);
    return price.toFixed(6);
  };

  const formatTotal = (total: number): string => {
    if (total >= 1e6) return `${(total / 1e6).toFixed(2)}M`;
    if (total >= 1e3) return `${(total / 1e3).toFixed(2)}K`;
    return total.toFixed(2);
  };

  // Calculate max total for gradient width (based on what's actually shown)
  const maxTotal = Math.max(
    ...groupedAsks.map(a => a.total),
    ...groupedBids.map(b => b.total),
    0
  );

  return (
    <div className="orderbook-page">
      <div className="page-header">
        <h1 className="page-title">{t('orderbook')}</h1>
        <button onClick={() => navigate('/')} className="close-button">
          {t('close')}
        </button>
      </div>

      <div className="orderbook-search-container">
        <input
          type="text"
          placeholder={t('search_symbol')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsDropdownOpen(true)}
          onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            }
          }}
          className="orderbook-search"
        />

        {/* Symbol dropdown */}
        {isDropdownOpen && filteredSymbols.length > 0 && (
          <div className="orderbook-dropdown">
            {filteredSymbols.map((t: Ticker) => (
              <button
                key={t.symbol}
                onClick={() => {
                  setSelectedSymbol(t.symbol);
                  setSearchQuery('');
                  setIsDropdownOpen(false);
                }}
                className="dropdown-item"
              >
                {t.pair}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected symbol + grouping filter */}
      <div className="orderbook-symbol">
        <span className="symbol-name">{selectedSymbol.replace('USDT', '/USDT')}</span>

        {stepOptions.length > 0 && (
          <div className="group-step-control">
            <button
              type="button"
              className={`group-step-toggle ${groupStep ? 'active' : ''}`}
              onClick={() => setIsStepMenuOpen((open) => !open)}
            >
              {groupStep ? formatStepLabel(groupStep) : t('raw_orders')}
            </button>
            {isStepMenuOpen && (
              <div className="group-step-menu">
                <button
                  type="button"
                  className={`group-step-option ${groupStep === 0 ? 'active' : ''}`}
                  onClick={() => { setGroupStep(0); setIsStepMenuOpen(false); }}
                >
                  {t('raw_orders')}
                </button>
                {stepOptions.map((step) => (
                  <button
                    key={step}
                    type="button"
                    className={`group-step-option ${groupStep === step ? 'active' : ''}`}
                    onClick={() => { setGroupStep(step); setIsStepMenuOpen(false); }}
                  >
                    {formatStepLabel(step)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="orderbook-loading">{t('loading_orderbook')}</div>
      ) : orderBook ? (
        <div className="orderbook-container">
          {/* Asks (sells) */}
          <div className="orderbook-section asks">
            <div className="section-title">{t('sell_orders')}</div>
            <div className="section-header">
              <span>Total</span>
              <span>Size</span>
              <span>Price</span>
            </div>
            <div className="orderbook-rows">
              {[...groupedAsks].reverse().map((ask, i) => (
                <div
                  key={i}
                  className="orderbook-row ask"
                  style={{
                    '--gradient-width': `${(ask.total / maxTotal) * 100}%`
                  } as React.CSSProperties}
                >
                  <span className="total">{formatTotal(ask.total)}</span>
                  <span className="amount">{ask.size.toFixed(4)}</span>
                  <span className="price">{formatPrice(ask.price)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Spread */}
          <div className="orderbook-spread">
            {t('spread')}: ${orderBook.asks[0] && orderBook.bids[0]
              ? (orderBook.asks[0].price - orderBook.bids[0].price).toFixed(2)
              : '—'}
          </div>

          {/* Bids (buys) */}
          <div className="orderbook-section bids">
            <div className="section-title">{t('buy_orders')}</div>
            <div className="section-header">
              <span>Total</span>
              <span>Size</span>
              <span>Price</span>
            </div>
            <div className="orderbook-rows">
              {groupedBids.map((bid, i) => (
                <div
                  key={i}
                  className="orderbook-row bid"
                  style={{
                    '--gradient-width': `${(bid.total / maxTotal) * 100}%`
                  } as React.CSSProperties}
                >
                  <span className="total">{formatTotal(bid.total)}</span>
                  <span className="amount">{bid.size.toFixed(4)}</span>
                  <span className="price">{formatPrice(bid.price)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default OrderBook;