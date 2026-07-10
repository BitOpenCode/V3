import axios from 'axios';
import { Ticker, NewsItem, OrderBook, OrderBookEntry, TonTransaction } from '../types';

const BINANCE_API = 'https://api.binance.com/api/v3';
const BINANCE_WS = 'wss://stream.binance.com:9443/ws';
const TONAPI_BASE_URL = 'https://tonapi.io/v2';
const CRYPTOCOMPARE_API = 'https://min-api.cryptocompare.com/data/v2';
const CRYPTOCOMPARE_NEWS_API = 'https://min-api.cryptocompare.com/data';

const EXCLUDED_SYMBOLS = ['TONUSDT'];

const SPECIAL_PRICE_TOKENS = ['PEPE', 'BONK', 'SHIB', '1000SATS', 'BTTC'];
const TWO_DECIMAL_TOKENS = ['BTC', 'ETH', 'ORDI', 'SOL', 'TRUMP', 'AVAX', 'PAXG', 'BCH', 'WBTC', 'ETC', 'ENS', 'INJ', 'MKR', 'LINK', 'COMP', 'QNT', 'BNB', 'YFI', 'KSM', 'TAO', 'WBETH', 'DASH', 'GMX', 'GNO', 'BIFI', 'EGLD', 'TRB', 'METIS', 'AUCTION', 'BANANA', 'ZEC', 'DEXE', 'ILV', 'BNSOL', 'ALCX', 'DCR', 'FARM', 'AAVE', 'LTC'];

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

export const fetchTickers = async (): Promise<Ticker[]> => {
  const binanceResp = await axios.get(`${BINANCE_API}/ticker/24hr`);
  const binanceData = binanceResp.data;
  
  const spotTickers: Ticker[] = binanceData
    .filter((t: { symbol: string; lastPrice: string }) => {
      const isUSDT = t.symbol.endsWith('USDT');
      const isBTC = t.symbol.endsWith('BTC') && t.symbol !== 'BTC';
      const hasValidPrice = parseFloat(t.lastPrice) > 0;
      const isExcluded = EXCLUDED_SYMBOLS.includes(t.symbol);
      return (isUSDT || isBTC) && hasValidPrice && !isExcluded;
    })
    .map((t: { symbol: string; lastPrice: string; priceChangePercent: string; quoteVolume: string }) => {
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

  return spotTickers;
};

// Legacy fetchNews – uses NewsData.io
export const fetchNews = async (categories?: string): Promise<NewsItem[]> => {
  const apiKey = 'pub_9fa0610a6ae5436086a15d68a372af7e';
  const coin = categories ? `&coin=${categories}` : '';
  const response = await axios.get(
    `https://newsdata.io/api/1/crypto?apikey=${apiKey}&language=en${coin}`
  );
  const items = response.data.results || [];
  return items.map((item: any) => ({
    id: item.article_id,
    title: item.title,
    body: item.description || item.title,
    url: item.link,
    imageurl: item.image_url || '',
    source: item.source_name || '',
    published_on: Math.floor(new Date(item.pubDate).getTime() / 1000),
    categories: categories || '',
  }));
};

// NewsAPI.org fetcher – always returns All news
export const fetchNewsFromNewsAPI = async (): Promise<NewsItem[]> => {
  const API_KEY = '5997a32f77814b108dc8c615a772333e';
  const query = 'cryptocurrency OR crypto OR blockchain';

  try {
    const response = await axios.get(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&pageSize=100&apiKey=${API_KEY}`
    );
    const articles = response.data.articles || [];
    return articles.map((article: any, index: number) => ({
      id: article.url || `article-${index}`,
      title: article.title || '',
      body: article.description || article.content || '',
      url: article.url || '',
      imageurl: article.urlToImage || '',
      source: article.source?.name || 'Unknown',
      published_on: article.publishedAt ? Math.floor(new Date(article.publishedAt).getTime() / 1000) : Date.now() / 1000,
      categories: '',
    }));
  } catch (error) {
    console.error('NewsAPI fetch error:', error);
    return [];
  }
};

// Combined news – always loads All news from both sources
export const fetchCombinedNews = async (): Promise<NewsItem[]> => {
  const [newsDataItems, newsApiItems] = await Promise.all([
    fetchNews(''),      // All from NewsData.io
    fetchNewsFromNewsAPI() // All from NewsAPI.org
  ]);

  const combined = [...newsDataItems, ...newsApiItems];
  const seen = new Set<string>();
  const unique = combined.filter(item => {
    const key = item.url;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  unique.sort((a, b) => b.published_on - a.published_on);
  return unique;
};

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

export const createTickerWebSocket = (onMessage: (data: Ticker[]) => void): WebSocket => {
  const ws = new WebSocket(`${BINANCE_WS}/!ticker@arr`);
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      const tickers: Ticker[] = data
        .filter((t: { s: string; c: string }) => {
          const isUSDT = t.s.endsWith('USDT');
          const isBTC = t.s.endsWith('BTC') && t.s !== 'BTC';
          const isExcluded = EXCLUDED_SYMBOLS.includes(t.s);
          return (isUSDT || isBTC) && !isExcluded;
        })
        .map((t: { s: string; c: string; P: string; q: string }) => {
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

export const fetchTonBalance = async (address: string): Promise<string> => {
  try {
    const response = await axios.get(`${TONAPI_BASE_URL}/accounts/${address}`);
    const balance = response.data.balance;
    return (balance / 1e9).toFixed(4);
  } catch {
    return '0';
  }
};

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

interface RawTonMessage {
  value?: number;
  source?: { address?: string };
  destination?: { address?: string };
}

interface RawTonTransaction {
  hash: string;
  utime: number;
  total_fees: number;
  in_msg?: RawTonMessage;
  out_msgs?: RawTonMessage[];
}

export const fetchTonTransactions = async (address: string, limit = 20): Promise<TonTransaction[]> => {
  try {
    const response = await axios.get(`${TONAPI_BASE_URL}/blockchain/accounts/${address}/transactions`, {
      params: { limit },
    });
    const transactions: RawTonTransaction[] = response.data.transactions || [];
    return transactions.map((tx): TonTransaction => {
      const outMsgs = tx.out_msgs || [];
      const isOutgoing = outMsgs.length > 0;
      const amountNano = isOutgoing
        ? outMsgs.reduce((sum, msg) => sum + (msg.value || 0), 0)
        : (tx.in_msg?.value || 0);
      const counterparty = isOutgoing
        ? (outMsgs[0]?.destination?.address || '')
        : (tx.in_msg?.source?.address || '');

      return {
        hash: tx.hash,
        timestamp: tx.utime,
        direction: isOutgoing ? 'out' : 'in',
        amount: (amountNano / 1e9).toFixed(4),
        counterparty,
        fee: (tx.total_fees / 1e9).toFixed(5),
      };
    });
  } catch {
    return [];
  }
};