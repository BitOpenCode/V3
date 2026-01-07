import axios from 'axios';
import { Ticker, NewsItem, OrderBook, OrderBookEntry } from '../types';

// API endpoints
const BINANCE_API = 'https://api.binance.com/api/v3';
const BINANCE_WS = 'wss://stream.binance.com:9443/ws';
const TONAPI_BASE_URL = 'https://tonapi.io/v2';
const CRYPTOCOMPARE_API = 'https://min-api.cryptocompare.com/data/v2';

// Special tokens for price formatting
const SPECIAL_PRICE_TOKENS = ['PEPE', 'BONK', 'SHIB', '1000SATS', 'BTTC'];
const TWO_DECIMAL_TOKENS = ['BTC', 'ETH', 'ORDI', 'SOL', 'TRUMP', 'AVAX', 'PAXG', 'BCH', 'WBTC', 'ETC', 'ENS', 'INJ', 'MKR', 'LINK', 'COMP', 'QNT', 'BNB', 'YFI', 'KSM', 'TAO', 'WBETH', 'DASH', 'GMX', 'GNO', 'BIFI', 'EGLD', 'TRB', 'METIS', 'AUCTION', 'BANANA', 'ZEC', 'DEXE', 'ILV', 'BNSOL', 'ALCX', 'DCR', 'FARM', 'AAVE', 'LTC'];

// Format ticker price
export const formatTickerPrice = (ticker: Ticker): string => {
  const token = ticker.symbol.replace('USDT', '').replace('BTC', '');
  
  if (ticker.symbol.endsWith('USDT')) {
    if (SPECIAL_PRICE_TOKENS.includes(token)) {
      return parseFloat(ticker.lastPrice.toString()).toFixed(5);
    } else if (TWO_DECIMAL_TOKENS.includes(token)) {
      return parseFloat(ticker.lastPrice.toString()).toFixed(2);
    } else {
      return parseFloat(ticker.lastPrice.toString()).toFixed(4);
    }
  } else {
    return parseFloat(ticker.lastPrice.toString()).toFixed(8);
  }
};

// Fetch tickers from Binance
export const fetchTickers = async (): Promise<Ticker[]> => {
  const [binanceResp, tonTickers] = await Promise.all([
    axios.get(`${BINANCE_API}/ticker/24hr`),
    fetchTonTickers()
  ]);

  const binanceData = binanceResp.data;
  
  // Filter USDT and BTC pairs
  const spotTickers: Ticker[] = binanceData
    .filter((t: { symbol: string; lastPrice: string }) => {
      const isUSDT = t.symbol.endsWith('USDT');
      const isBTC = t.symbol.endsWith('BTC') && t.symbol !== 'BTC';
      const hasValidPrice = parseFloat(t.lastPrice) > 0;
      return (isUSDT || isBTC) && hasValidPrice;
    })
    .map((t: { symbol: string; lastPrice: string; priceChangePercent: string; quoteVolume: string }) => {
      // Format pair correctly: BTCUSDT -> BTC/USDT, ETHBTC -> ETH/BTC
      let pair: string;
      if (t.symbol.endsWith('USDT')) {
        pair = t.symbol.replace('USDT', '/USDT');
      } else if (t.symbol.endsWith('BTC')) {
        pair = t.symbol.replace('BTC', '/BTC');
      } else {
        pair = t.symbol;
      }
      
      return {
        symbol: t.symbol,
        pair,
        close: t.lastPrice,
        lastPrice: parseFloat(t.lastPrice),
        priceChangePercent: parseFloat(t.priceChangePercent),
        quoteVolume: parseFloat(t.quoteVolume),
      };
    });

  // Add TON tickers
  return [...spotTickers, ...tonTickers];
};

// Fetch TON price from TONAPI
export const fetchTonTickers = async (): Promise<Ticker[]> => {
  try {
    const response = await axios.get(`${TONAPI_BASE_URL}/rates?tokens=ton&currencies=usd,btc`);
    const tonRates = response.data.rates?.TON;
    if (!tonRates) return [];
    
    const tickers: Ticker[] = [];
    if (tonRates.prices?.USD) {
      tickers.push({
        symbol: 'TONUSDT',
        pair: 'TON/USDT',
        close: tonRates.prices.USD.toString(),
        lastPrice: parseFloat(tonRates.prices.USD),
        priceChangePercent: tonRates.diff_24h?.USD ? parseFloat(String(tonRates.diff_24h.USD).replace('%', '').replace('−', '-')) : 0,
        quoteVolume: 0
      });
    }
    return tickers;
  } catch {
    return [];
  }
};

// Fetch news from CryptoCompare
export const fetchNews = async (categories?: string): Promise<NewsItem[]> => {
  const params = categories ? `?categories=${categories}` : '';
  const response = await axios.get(`${CRYPTOCOMPARE_API}/news/${params}`);
  return response.data.Data || [];
};

// Fetch order book from Binance
export const fetchOrderBook = async (symbol: string, limit: number = 20): Promise<OrderBook> => {
  const response = await axios.get(`${BINANCE_API}/depth?symbol=${symbol}&limit=${limit}`);
  
  const asks: OrderBookEntry[] = response.data.asks.map((ask: [string, string]) => ({
    price: parseFloat(ask[0]),
    size: parseFloat(ask[1]),
    total: parseFloat(ask[0]) * parseFloat(ask[1])
  }));
  
  const bids: OrderBookEntry[] = response.data.bids.map((bid: [string, string]) => ({
    price: parseFloat(bid[0]),
    size: parseFloat(bid[1]),
    total: parseFloat(bid[0]) * parseFloat(bid[1])
  }));
  
  return { asks, bids };
};

// Create WebSocket connection for real-time tickers
export const createTickerWebSocket = (onMessage: (data: Ticker[]) => void): WebSocket => {
  const ws = new WebSocket(`${BINANCE_WS}/!ticker@arr`);
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      const tickers: Ticker[] = data
        .filter((t: { s: string; c: string }) => {
          const isUSDT = t.s.endsWith('USDT');
          const isBTC = t.s.endsWith('BTC') && t.s !== 'BTC';
          return isUSDT || isBTC;
        })
        .map((t: { s: string; c: string; P: string; q: string }) => {
          // Format pair correctly
          let pair: string;
          if (t.s.endsWith('USDT')) {
            pair = t.s.replace('USDT', '/USDT');
          } else if (t.s.endsWith('BTC')) {
            pair = t.s.replace('BTC', '/BTC');
          } else {
            pair = t.s;
          }
          
          return {
            symbol: t.s,
            pair,
            close: t.c,
            lastPrice: parseFloat(t.c),
            priceChangePercent: parseFloat(t.P),
            quoteVolume: parseFloat(t.q),
          };
        });
      onMessage(tickers);
    } catch {
      // ignore parsing errors
    }
  };
  
  return ws;
};

// Fetch TON wallet balance
export const fetchTonBalance = async (address: string): Promise<string> => {
  try {
    const response = await axios.get(`${TONAPI_BASE_URL}/accounts/${address}`);
    const balance = response.data.balance;
    return (balance / 1e9).toFixed(4); // Convert from nanoTON to TON
  } catch {
    return '0';
  }
};

// Fetch TON price
export const fetchTonPrice = async (): Promise<{ price: number; change24h: number }> => {
  try {
    const response = await axios.get(`${TONAPI_BASE_URL}/rates?tokens=ton&currencies=usd`);
    const tonRates = response.data.rates?.TON;
    return {
      price: tonRates?.prices?.USD || 0,
      change24h: parseFloat(String(tonRates?.diff_24h?.USD || '0').replace('%', '').replace('−', '-'))
    };
  } catch {
    return { price: 0, change24h: 0 };
  }
};

