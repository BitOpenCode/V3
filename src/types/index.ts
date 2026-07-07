// Ticker data from Binance API
export interface Ticker {
  symbol: string;
  pair: string;
  close: string;
  lastPrice: number;
  priceChangePercent: number;
  quoteVolume: number;
}

// Order Book entry
export interface OrderBookEntry {
  price: number;
  size: number;
  total: number;
}

// Order Book
export interface OrderBook {
  asks: OrderBookEntry[];
  bids: OrderBookEntry[];
}

// News item from CryptoCompare
export interface NewsItem {
  id: string | number;
  title: string;
  body: string;
  published_on: number;
  url: string;
  imageurl: string;
  source: string;
  categories: string;
}

// Portfolio position
export interface PortfolioPosition {
  id: string;
  symbol: string;
  amount: number;
  buyPrice: number;
  currentPrice: number;
  value: number;
  pnl: number;
  pnlPercent: number;
}

// Wallet data
export interface WalletData {
  address: string;
  balance: string;
  balanceUSD: string;
}

// TON wallet transaction (parsed from TonAPI)
export interface TonTransaction {
  hash: string;
  timestamp: number;
  direction: 'in' | 'out';
  amount: string;
  counterparty: string;
  fee: string;
}

// Filter types
export type TickerFilter = 'ALL' | 'USDT' | 'BTC' | 'FAV';
export type TickerSort = 'symbol' | 'price' | 'change' | 'volume';
export type SortDirection = 'asc' | 'desc';

