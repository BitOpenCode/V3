import React, { useEffect, useState, useMemo, useRef } from 'react';
import { TonConnectButton, useTonConnectUI } from '@tonconnect/ui-react';
import { Wallet } from 'lucide-react';
import { getHttpEndpoint } from "@orbs-network/ton-access";
import { TonClient, Address, fromNano } from "ton";
import WebApp from '@twa-dev/sdk';
import axios from 'axios';
import './App.css';
import BubbleButton from './components/BubbleButton';

// Добавляем типы для TradingView
interface TradingViewStudy {
  id: string;
  inputs?: { [key: string]: string | number | boolean };
}

interface TradingViewConfig {
  autosize: boolean;
  symbol: string;
  interval: string;
  timezone: string;
  theme: string;
  style: string;
  locale: string;
  toolbar_bg: string;
  enable_publishing: boolean;
  withdateranges: boolean;
  hide_side_toolbar: boolean;
  allow_symbol_change: boolean;
  save_image: boolean;
  details: boolean;
  hotlist: boolean;
  calendar: boolean;
  studies: (string | TradingViewStudy)[];
  container_id: string;
  width?: string;
  height?: string;
  onChartReady?: () => void;
}

interface TradingViewWidget {
  setSymbol: (symbol: string) => void;
  setInterval: (interval: string) => void;
}

declare global {
  interface Window {
    TradingView: {
      widget: new (config: TradingViewConfig) => TradingViewWidget;
    };
    tvWidget: TradingViewWidget;
    fullscreenChart?: TradingViewWidget;
  }
}

// Define a basic interface for news items
interface NewsItem {
  id: string | number; // Assuming id can be string or number
  title: string;
  body: string;
  published_on: number; // Timestamp in seconds
  url: string;
  imageurl: string;
  source: string;
  categories: string; // Categories as a comma-separated string
  // Add other properties if needed
}

// Define interface for Ticker data from Binance API (simplified)
interface Ticker {
  symbol: string;
  pair: string;
  close: string;
  lastPrice: number;
  priceChangePercent: number;
  quoteVolume: number;
}

// Define interface for Order Book entry
interface OrderBookEntry {
  price: number;
  size: number;
  total: number;
}

// Define interface for Order Book
interface OrderBook {
  asks: OrderBookEntry[];
  bids: OrderBookEntry[];
}



// Binance API endpoint for 24hr ticker statistics
const BINANCE_TICKERS_API = 'https://api.binance.com/api/v3/ticker/24hr';

// Добавляем TONAPI_BASE_URL обратно
const TONAPI_BASE_URL = 'https://tonapi.io/v2';

// Функция форматирования цены тикера
const formatTickerPrice = (ticker: Ticker) => {
  const specialPriceTokens = ['PEPE', 'BONK', 'SHIB', '1000SATS', 'BTTC'];
  const twoDecimalTokens = ['BTC', 'ETH', 'ORDI','SOL', 'TRUMP', 'AVAX', 'PAXG', 'BCH', 'WBTC', 'ETC', 'ENS', 'INJ', 'MKR', 'LINK', 'COMP', 'QNT', 'BNB', 'YFI', 'KSM', 'TAO', 'WBETH', 'DASH', 'GMX', 'GNO', 'BIFI', 'EGLD', 'TRB', 'METIS', 'AUCTION', 'BANANA', 'ZEC', 'DEXE', 'ILV', 'BNSOL', 'ALCX', 'DCR', 'FARM', 'AAVE', 'LTC'];

  let price;
  const token = ticker.symbol.replace('USDT', '');
  
  if (ticker.symbol.endsWith('USDT')) {
    if (specialPriceTokens.includes(token)) {
      price = parseFloat(ticker.lastPrice.toString()).toFixed(5);
    } else if (twoDecimalTokens.includes(token)) {
      price = parseFloat(ticker.lastPrice.toString()).toFixed(2);
    } else {
      price = parseFloat(ticker.lastPrice.toString()).toFixed(4);
    }
  } else {
    price = parseFloat(ticker.lastPrice.toString()).toFixed(8);
  }

  return price;
};

const formatVolume = (ticker: Ticker) => {
  const volume = ticker.quoteVolume;
  if (ticker.symbol.endsWith('USDT')) {
    return Math.floor(volume).toLocaleString();
  }
  return volume.toLocaleString();
};

interface OrderBookRowStyle extends React.CSSProperties {
  '--gradient-width': string;
}

interface PortfolioForm {
  searchQuery: string;
  selectedCoin: Ticker | null;
  amount: number;
  buyPrice: number;
}

interface PortfolioPosition {
  id: string;
  symbol: string;
  pair: string;
  amount: number;
  buyPrice: number;
  currentPrice?: number;
  currentValue?: number;
  profit: number;
  profitPercent: number;
}

interface CalculatorForm {
  searchQuery: string;
  selectedCoin: Ticker | null;
  initialPrice: number | null;
  projectedPrice: number | null;
  investment: number | null;
  serviceFee: number | null;
  taxRate: number | null;
}



// Добавляем новые интерфейсы
interface MempoolStats {
  hashrate: number;
  difficulty: number;
  currentHashrate?: number;
  currentDifficulty?: number;
}

interface MempoolBlock {
  id: string;
  height: number;
  timestamp: number;
  size: number;
  tx_count: number;
}

const formatHashrate = (hashrate: number): string => {
  console.log('formatHashrate input:', hashrate);
  if (typeof hashrate !== 'number' || isNaN(hashrate)) {
    console.log('formatHashrate: invalid input, returning N/A');
    return 'N/A';
  }
  const units = ['H/s', 'KH/s', 'MH/s', 'GH/s', 'TH/s', 'PH/s', 'EH/s'];
  let unitIndex = 0;
  let value = hashrate;
  while (value >= 1000 && unitIndex < units.length - 1) {
    value /= 1000;
    unitIndex++;
  }
  const result = `${value.toFixed(2)} ${units[unitIndex]}`;
  console.log('formatHashrate result:', result);
  return result;
};

const formatDifficulty = (difficulty: number): string => {
  console.log('formatDifficulty input:', difficulty);
  if (typeof difficulty !== 'number' || isNaN(difficulty)) {
    console.log('formatDifficulty: invalid input, returning N/A');
    return 'N/A';
  }
  const result = difficulty.toLocaleString();
  console.log('formatDifficulty result:', result);
  return result;
};

const formatBtc = (satoshi: number): string => {
  if (!satoshi) return '0.00000000';
  return (satoshi / 100000000).toFixed(8);
};

interface SearchResultsData {
  type: 'address' | 'transaction' | null;
  data: {
    // BTC/USDT
    balance?: string;
    transactions?: number;
    received?: string;
    spent?: string;
    hash?: string;
    from?: string;
    to?: string;
    value?: string;
    time?: number;
    // USDT
    address?: string;
    usdtBalance?: string;
    trxBalance?: string;
    totalTransactions?: number;
    // TON
    tonBalance?: string;
    jettons?: TonJetton[];
    status?: string;
    date_of_creation?: number;
    last_activity?: number;
    is_scam?: boolean;
    frozen?: boolean;
    interfaces?: string[];
  } | null;
}

interface TonJetton {
  balance: string;
  jetton: {
    name: string;
    symbol: string;
    address: string;
    decimals: number;
    image?: string;
  };
}

function App() {
  const [balance, setBalance] = useState<string | null>(null);
  const [tonPriceChange24h, setTonPriceChange24h] = useState<string | null>(null);
  const [tonPrice, setTonPrice] = useState<string | null>(null);
  const [tonBalanceUSD, setTonBalanceUSD] = useState<string | null>(null);
  
  const [tonConnectUI] = useTonConnectUI();
  const { connected, account } = tonConnectUI;

  // Добавляем состояние для отслеживания ошибок подключения
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // State to manage visibility of wallet info, news screen, and contact dropdown

  const [showNewsScreen, setShowNewsScreen] = useState(false); // State for news screen visibility

  const [showWalletScreen, setShowWalletScreen] = useState(false); // State for wallet screen visibility
  const [showContactScreen, setShowContactScreen] = useState(false); // State for contact screen visibility
  const [showTickersScreen, setShowTickersScreen] = useState(false); // State for tickers screen visibility

  // State for news data and loading
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]); // Use NewsItem interface
  const [newsLoading, setNewsLoading] = useState(false);
  const [selectedNewsCategory, setSelectedNewsCategory] = useState('');
  const [newsSearchQuery, setNewsSearchQuery] = useState(''); // State for news search input

  // State for tickers data and loading
  const [tickers, setTickers] = useState<Ticker[]>([]); // Use Ticker interface
  const [tickersLoading, setTickersLoading] = useState(false);
  const [tickersError, setTickersError] = useState<string | null>(null);
  const [selectedTickerFilter, setSelectedTickerFilter] = useState<'ALL' | 'USDT' | 'BTC' | 'FAV'>('ALL'); // Filter state - Default to ALL
  const [tickerSearchQuery, setTickerSearchQuery] = useState(''); // Search query state

  // State for sorting tickers
  const [sortColumn, setSortColumn] = useState<string | null>('symbol'); // Column to sort by (e.g., 'symbol', 'lastPrice', 'priceChangePercent', 'quoteVolume')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc'); // Sort order ('asc' or 'desc')

  // New state for Order Book
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [orderBook, setOrderBook] = useState<OrderBook>({ asks: [], bids: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [showOrderBook, setShowOrderBook] = useState(false);

  // Добавляем состояние для фильтрации тикеров в Order Book
  const [filteredOrderBookTickers, setFilteredOrderBookTickers] = useState<Ticker[]>([]);
  const [showOrderBookDropdown, setShowOrderBookDropdown] = useState(false);

  // Добавляем состояние для избранных тикеров
  const [favorites, setFavorites] = useState<string[]>(() => {
    const savedFavorites = localStorage.getItem('favorites');
    return savedFavorites ? JSON.parse(savedFavorites) : ['BTCUSDT'];
  });

  // Обновляем состояние для графика
  const [showChartScreen, setShowChartScreen] = useState(false);
  const [currentTimeframe] = useState('1h');

  // New state for Share
  const [showShareScreen, setShowShareScreen] = useState(false);
  const [shareAssetFilter, setShareAssetFilter] = useState<'USDT' | 'BTC' | 'FAV'>('USDT');
  const [shareSearchQuery, setShareSearchQuery] = useState('');
  const [selectedTickers, setSelectedTickers] = useState<string[]>([]);

  // New state for Calculator
  const [showCalculator, setShowCalculator] = useState(false);


  // Состояния для портфеля
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [portfolioForm, setPortfolioForm] = useState<PortfolioForm>({
    searchQuery: '',
    selectedCoin: null,
    amount: 0,
    buyPrice: 0
  });
  const [filteredPortfolioCoins, setFilteredPortfolioCoins] = useState<Ticker[]>([]);
  const [showPortfolioDropdown, setShowPortfolioDropdown] = useState(false);
  const [portfolioPositions, setPortfolioPositions] = useState<PortfolioPosition[]>([]);
  const [totalInvestment, setTotalInvestment] = useState(0);
  const [currentValue, setCurrentValue] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalProfitPercent, setTotalProfitPercent] = useState(0);

  const [showCalculatorDropdown, setShowCalculatorDropdown] = useState(false);
  const [calculatorSearchQuery, setCalculatorSearchQuery] = useState('');
  const [filteredCalculatorCoins, setFilteredCalculatorCoins] = useState<Ticker[]>([]);

  const [calculatorForm, setCalculatorForm] = useState<CalculatorForm>({
    searchQuery: '',
    selectedCoin: null,
    initialPrice: null,
    projectedPrice: null,
    investment: null,
    serviceFee: null,
    taxRate: null
  });

  // Mempool states
  const [showMempoolScreen, setShowMempoolScreen] = useState(false);
  const [showUsdtScreen, setShowUsdtScreen] = useState(false);
  const [showTonScreen, setShowTonScreen] = useState(false);
  const [mempoolStats, setMempoolStats] = useState<MempoolStats>({
    hashrate: 0,
    difficulty: 0
  });
  const [mempoolStatsLoading, setMempoolStatsLoading] = useState(false);
  const [latestBlocks, setLatestBlocks] = useState<MempoolBlock[]>([]);
  const [mempoolBlocksLoading, setMempoolBlocksLoading] = useState(false);
  const [mempoolDataLoaded, setMempoolDataLoaded] = useState(false);

  const [addressSearch, setAddressSearch] = useState('');
  const [txSearch, setTxSearch] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<'BTC' | 'USDT' | 'TON'>('BTC');

  const [searchResults, setSearchResults] = useState<SearchResultsData>({ type: null, data: null });

  // --- ДОБАВЛЮ состояние tonLoading и обновлю fetchTonPriceData ---
  const [tonLoading, setTonLoading] = useState(true);

  // Хук для пузырьков на плашке summary
  const summaryPanelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const panel = summaryPanelRef.current;
    if (!panel) return;

    const createBubble = () => {
      if (!panel) return;
      const bubble = document.createElement('div');
      bubble.className = 'bubble';
      const size = Math.random() * 8 + 4;
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      bubble.style.left = `${Math.random() * 100}%`;
      const duration = Math.random() * 2 + 2;
      bubble.style.setProperty('--animation-duration', `${duration}s`);
      panel.appendChild(bubble);
      bubble.addEventListener('animationend', () => {
        bubble.remove();
      });
    };

    const intervalId: number = window.setInterval(createBubble, 200);
    return () => {
      clearInterval(intervalId);
      if (panel) {
        panel.querySelectorAll('.bubble').forEach(b => b.remove());
      }
    };
  }, []);

  useEffect(() => {
    const { connected, account } = tonConnectUI;

    console.log('Connection state changed:', { connected, account });

    const fetchInitialData = async () => {
      if (connected && account) {
        console.log('Fetching data on initial connection state.');
        setConnectionError(null);
        await fetchWalletData();
      } else {
        console.log('Not connected on initial state.');
        setBalance(null);
        setTonPriceChange24h(null);
        setTonPrice(null);
        setTonBalanceUSD(null);
      }
    };
    
    fetchInitialData();

  }, [tonConnectUI.connected, tonConnectUI.account]);

  useEffect(() => {
    const unsubscribe = tonConnectUI.onStatusChange(
      wallet => {
        if (wallet) {
          console.log('Wallet status changed: Connected', wallet);
          setConnectionError(null);
          fetchWalletData();
        } else {
          console.log('Wallet status changed: Disconnected');
          setBalance(null);
          setTonPriceChange24h(null);
          setTonPrice(null);
          setTonBalanceUSD(null);
        }
      },
    );

    return () => {
      console.log('Unsubscribing from status changes.');
      unsubscribe();
    };

  }, [tonConnectUI]);

  useEffect(() => {
    if (balance !== null && tonPrice !== null) {
      try {
        const tonAmount = parseFloat(balance);
        const priceUSD = parseFloat(tonPrice.replace('$', ''));
        if (!isNaN(tonAmount) && !isNaN(priceUSD)) {
          const balanceUSD = tonAmount * priceUSD;
          setTonBalanceUSD(`$${balanceUSD.toFixed(2)}`);
        } else {
          setTonBalanceUSD('N/A');
        }
      } catch (error) {
        console.error('Error calculating TON balance in USD:', error);
        setTonBalanceUSD('Error');
      }
    } else {
      setTonBalanceUSD(null);
    }
  }, [balance, tonPrice]);

  useEffect(() => {
    if (showTickersScreen && tickers.length === 0 && !tickersLoading) {
      fetchTickers();
    }
  }, [showTickersScreen, tickers.length, tickersLoading]); // Load tickers when screen opens if not already loaded

  // Добавляем useEffect для динамического обновления тикеров
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    if (showTickersScreen) {
      fetchTickers(); // Первоначальная загрузка
      intervalId = setInterval(updateTickers, 2000); // Обновление каждые 2 секунды
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [showTickersScreen]);

  const fetchWalletData = async () => {
    const { connected, account } = tonConnectUI;

    if (!connected || !account?.address) {
      console.log('Not connected or account address missing.');
      setBalance(null);
      return;
    }
    console.log('Connected with account:', account);
    setBalance(null);

    try {
      const network = 'mainnet';
      const endpoint = await getHttpEndpoint({ network });
        const client = new TonClient({ endpoint });

        const address = Address.parse(account.address);
      const balanceNano = await client.getBalance(address);
      const balanceTon = fromNano(balanceNano);
      
      setBalance(balanceTon);

      await fetchTonPriceData();

        WebApp.MainButton.setText('Wallet Connected');
        WebApp.MainButton.show();
      } catch (error) {
        console.error("Error fetching wallet data:", error);
      setBalance(null);
    }
  };

  const fetchTonPriceData = async () => {
    setTonLoading(true);
    try {
      // setTonPrice(null);
      // setTonPriceChange24h(null);
      const response = await axios.get(`${TONAPI_BASE_URL}/rates?tokens=ton&currencies=usd`);
      const tonData = response.data.rates.TON?.prices?.USD;
      if (tonData !== undefined) {
        setTonPrice(`$${parseFloat(tonData).toFixed(2)}`);
      } else {
        setTonPrice('N/A');
      }
      const tonDiff24hData = response.data.rates.TON?.diff_24h?.USD;
      if (tonDiff24hData !== undefined) {
        const cleanedDiff24h = String(tonDiff24hData).replace('%', '').replace('−', '-');
        const change = parseFloat(cleanedDiff24h);
        const formattedChange = change.toFixed(2);
        setTonPriceChange24h(`${change > 0 ? '+' : ''}${formattedChange}%`);
      } else {
        setTonPriceChange24h('N/A');
      }
    } catch {
      setTonPrice('N/A');
      setTonPriceChange24h('N/A');
    } finally {
      setTonLoading(false);
    }
  };

  // Function to toggle news screen visibility
  const toggleNewsScreen = () => {
    if (showNewsScreen) {
      closeAllModals();
    } else {
      closeAllModals();
      setShowNewsScreen(true);
      document.body.style.overflow = 'hidden';
      // When opening news screen, reset state and load first page
      setNewsItems([]);
      setSelectedNewsCategory('');
      setNewsSearchQuery('');
      loadNews();
    }
  };

  // Function to toggle contact screen visibility
  const toggleContactScreen = () => {
    if (showContactScreen) {
      closeAllModals();
    } else {
      closeAllModals();
      setShowContactScreen(true);
      document.body.style.overflow = 'hidden';
    }
  };

  // Function to toggle wallet screen visibility
  const toggleWalletScreen = () => {
    if (showWalletScreen) {
      closeAllModals();
    } else {
      closeAllModals();
      setShowWalletScreen(true);
      document.body.style.overflow = 'hidden';
    }
  };

  // Function to toggle tickers screen visibility
  const toggleTickersScreen = () => {
    if (showTickersScreen) {
      closeAllModals();
    } else {
      closeAllModals();
      setShowTickersScreen(true);
      document.body.style.overflow = 'hidden';
      // Reset filter and search when opening
      setSelectedTickerFilter('ALL');
      setTickerSearchQuery('');
      // Загружаем тикеры при открытии экрана
      fetchTickers();
    }
  };

  // Function to fetch tickers data from Binance API
  const fetchTickers = async () => {
    setTickersLoading(true);
    setTickersError(null);
    try {
      const [binanceResp, tonTickers] = await Promise.all([
        axios.get<Ticker[]>(BINANCE_TICKERS_API),
        fetchTonTickers()
      ]);
      const response = binanceResp;
      if (response.status !== 200 || !Array.isArray(response.data)) {
        throw new Error('Failed to fetch tickers');
      }
      const spotTickers = response.data.filter(ticker => {
        const symbol = ticker.symbol;
        const isUSDT = symbol.endsWith('USDT') && !symbol.includes('UPUSDT') && !symbol.includes('DOWNUSDT');
        const isBTC = symbol.endsWith('BTC') && !symbol.includes('UPBTC') && !symbol.includes('DOWNBTC');
        const hasValidPrice = parseFloat(ticker.lastPrice.toString()) > 0;
        return (isUSDT || isBTC) && hasValidPrice;
      });
      setTickers(prevTickers => {
        const prevMap = Object.fromEntries(prevTickers.map(t => [t.symbol, t]));
        // Создаём map для быстрого доступа к объёму с Binance
        const binanceMap = Object.fromEntries(spotTickers.map(t => [t.symbol, t]));
        const updated = spotTickers.map(t => ({ ...prevMap[t.symbol], ...t }));
        // Добавляем тикеры TON, если их нет в новом ответе
        tonTickers.forEach(tonTicker => {
          const exist = updated.find(t => t.symbol === tonTicker.symbol);
          // Берём объём с Binance, если есть
          const binanceVolume = binanceMap[tonTicker.symbol]?.quoteVolume;
          if (!exist) {
            // Если был ранее — берём старый, иначе новый
            updated.push({
              ...prevMap[tonTicker.symbol],
              ...tonTicker,
              quoteVolume: binanceVolume !== undefined ? binanceVolume : (prevMap[tonTicker.symbol]?.quoteVolume ?? 0)
            });
          } else {
            // Обновляем только цену и изменение, а объём сохраняем с Binance или предыдущий
            exist.close = tonTicker.close;
            exist.lastPrice = tonTicker.lastPrice;
            exist.priceChangePercent = tonTicker.priceChangePercent;
            exist.quoteVolume = binanceVolume !== undefined ? binanceVolume : (exist.quoteVolume ?? prevMap[tonTicker.symbol]?.quoteVolume ?? 0);
          }
        });
        // Гарантируем, что тикеры TON не исчезают
        ['TONUSDT','TONBTC'].forEach(symbol => {
          if (prevMap[symbol] && !updated.find(t => t.symbol === symbol)) {
            updated.push(prevMap[symbol]);
          }
        });
        // Добавляем тикеры из избранного, которых нет в новом ответе
        favorites.forEach(symbol => {
          if (!updated.find(t => t.symbol === symbol) && prevMap[symbol]) {
            updated.push(prevMap[symbol]);
          }
        });
        return updated;
      });
    } catch {
      setTickersError('Failed to load tickers.');
    } finally {
      setTickersLoading(false);
    }
  };

  // Function to update tickers data without showing loading indicator
  const updateTickers = async () => {
    try {
      const [binanceResp, tonTickers] = await Promise.all([
        axios.get<Ticker[]>(BINANCE_TICKERS_API),
        fetchTonTickers()
      ]);
      const response = binanceResp;
      if (response.status !== 200 || !Array.isArray(response.data)) {
        return;
      }
      const spotTickers = response.data.filter(ticker => {
        const symbol = ticker.symbol;
        const isUSDT = symbol.endsWith('USDT') && !symbol.includes('UPUSDT') && !symbol.includes('DOWNUSDT');
        const isBTC = symbol.endsWith('BTC') && !symbol.includes('UPBTC') && !symbol.includes('DOWNBTC');
        const hasValidPrice = parseFloat(ticker.lastPrice.toString()) > 0;
        return (isUSDT || isBTC) && hasValidPrice;
      });
      setTickers(prevTickers => {
        const prevMap = Object.fromEntries(prevTickers.map(t => [t.symbol, t]));
        const binanceMap = Object.fromEntries(spotTickers.map(t => [t.symbol, t]));
        const updated = spotTickers.map(t => ({ ...prevMap[t.symbol], ...t }));
        tonTickers.forEach(tonTicker => {
          const exist = updated.find(t => t.symbol === tonTicker.symbol);
          const binanceVolume = binanceMap[tonTicker.symbol]?.quoteVolume;
          if (!exist) {
            updated.push({
              ...prevMap[tonTicker.symbol],
              ...tonTicker,
              quoteVolume: binanceVolume !== undefined ? binanceVolume : (prevMap[tonTicker.symbol]?.quoteVolume ?? 0)
            });
          } else {
            exist.close = tonTicker.close;
            exist.lastPrice = tonTicker.lastPrice;
            exist.priceChangePercent = tonTicker.priceChangePercent;
            exist.quoteVolume = binanceVolume !== undefined ? binanceVolume : (exist.quoteVolume ?? prevMap[tonTicker.symbol]?.quoteVolume ?? 0);
          }
        });
        ['TONUSDT','TONBTC'].forEach(symbol => {
          if (prevMap[symbol] && !updated.find(t => t.symbol === symbol)) {
            updated.push(prevMap[symbol]);
    }
        });
        favorites.forEach(symbol => {
          if (!updated.find(t => t.symbol === symbol) && prevMap[symbol]) {
            updated.push(prevMap[symbol]);
          }
        });
        return updated;
      });
    } catch {}
  };

  // Function to load news (based on index1.html logic, adjusted for no pagination)
  const loadNews = async () => { // Remove page and reset parameters
    if (newsLoading) { // Check only newsLoading
      console.log('Already loading news, skipping load.');
      return;
    }

    setNewsLoading(true);
    console.log('Loading news (first page only).');

    try {
      const apiUrl = new URL('https://min-api.cryptocompare.com/data/v2/news/');
      const params: Record<string, string | number> = {
        lang: 'EN',
        sortOrder: 'latest',
        feeds: 'cointelegraph,coindesk,bitcoinist',
        limit: 20,
      };

      Object.keys(params).forEach(key => apiUrl.searchParams.append(key, String(params[key])));
      console.log('Fetching news from:', apiUrl.toString());

      const response = await axios.get(apiUrl.toString());
      console.log('News API response status:', response.status);

      if (response.status !== 200 || !response.data || !Array.isArray(response.data.Data)) {
        console.error('Error fetching news:', response.data);
        throw new Error('Failed to fetch news');
      }

      const fetchedNews: NewsItem[] = response.data.Data.map((item: {
        categories?: string;
        body?: string;
        imageurl?: string;
        source?: string;
        published_on: number | string;
      }) => ({
        ...item,
        categories: (item.categories || '').split('|').filter(Boolean).slice(0, 5).join(', '),
        body: (item.body || '').replace(/<[^>]*>/g, ''),
        imageurl: item.imageurl || 'https://via.placeholder.com/300x200?text=No+Image',
        source: item.source || 'Unknown Source',
        published_on: typeof item.published_on === 'string' ? parseInt(item.published_on, 10) : item.published_on,
      }));
      console.log(`Fetched ${fetchedNews.length} news items.`);

      // Always set news items directly for the first page
      setNewsItems(fetchedNews);

      // No more news after the first page (since pagination is removed)
      // setNoMoreNews(true); // Remove setting noMoreNews
      console.log('Pagination removed, only first page loaded.');

    } catch (error) {
      console.error('Error loading news:', error);
      // Optionally show an error message to the user
    } finally {
      setNewsLoading(false);
      console.log('Finished loading news.');
    }
  };

  // Helper function to format news date (copy from index1.html)
  const formatNewsDate = (timestamp: number) => {
     if (!timestamp) return "No date";
               
     const date = new Date(timestamp * 1000);
     const now = new Date();
     const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
               
     if (diff < 60) {
         return 'Just now';
     } else if (diff < 3600) {
         const minutes = Math.floor(diff / 60);
         return `${minutes}m ago`;
     } else if (diff < 86400) {
         const hours = Math.floor(diff / 3600);
         return `${hours}h ago`;
     } else if (diff < 604800) {
         const days = Math.floor(diff / 86400);
         return `${days}d ago`;
     } else {
         return date.toLocaleDateString('en-US', {
             day: 'numeric',
             month: 'short',
             year: 'numeric'
         });
     }
  };

  // Filtered news items based on category and search query
  const filteredNewsItems = newsItems.filter(item => {
    const categoryMatch = !selectedNewsCategory || (item.categories && item.categories.toLowerCase().includes(selectedNewsCategory.toLowerCase()));
    const searchMatch = !newsSearchQuery ||
                        (item.title && item.title.toLowerCase().includes(newsSearchQuery.toLowerCase())) ||
                        (item.body && item.body.toLowerCase().includes(newsSearchQuery.toLowerCase())) ||
                        (item.source && item.source.toLowerCase().includes(newsSearchQuery.toLowerCase()));
    return categoryMatch && searchMatch;
  });

  // Function to handle sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // If clicking the same column, reverse the sort order
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // If clicking a new column, set it as the sort column and default to ascending order
      setSortColumn(column);
      setSortOrder('asc');
    }
  };

  // Filtered and sorted tickers
  const filteredAndSortedTickers = useMemo(() => {
    const filtered = tickers
      .filter(ticker => {
        // Фильтр по категории (USDT, BTC, FAV)
        if (selectedTickerFilter === 'FAV') {
          return favorites.includes(ticker.symbol);
        }
        if (selectedTickerFilter === 'USDT') {
          return ticker.symbol.endsWith('USDT') && !ticker.symbol.includes('UPUSDT') && !ticker.symbol.includes('DOWNUSDT');
        }
        if (selectedTickerFilter === 'BTC') {
          return ticker.symbol.endsWith('BTC') && !ticker.symbol.includes('UPBTC') && !ticker.symbol.includes('DOWNBTC');
        }
        return true;
      })
      .filter(ticker => {
        const lowerCaseQuery = tickerSearchQuery.toLowerCase();
        return ticker.symbol.toLowerCase().includes(lowerCaseQuery);
      });

    // Применяем сортировку
    if (sortColumn) {
      filtered.sort((a, b) => {
        const aValue = a[sortColumn as keyof Ticker];
        const bValue = b[sortColumn as keyof Ticker];
        let comparison = 0;
        if (sortColumn === 'lastPrice' || sortColumn === 'priceChangePercent' || sortColumn === 'volume' || sortColumn === 'quoteVolume') {
          const numA = parseFloat(String(aValue));
          const numB = parseFloat(String(bValue));
          if (isNaN(numA) && isNaN(numB)) comparison = 0;
          else if (isNaN(numA)) comparison = 1;
          else if (isNaN(numB)) comparison = -1;
          else comparison = numA - numB;
        } else {
          const stringA = String(aValue || '');
          const stringB = String(bValue || '');
          comparison = stringA.localeCompare(stringB);
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }
    return filtered;
  }, [tickers, selectedTickerFilter, tickerSearchQuery, sortColumn, sortOrder, favorites]);

  // Добавляем функцию prepareOrderBook
  const prepareOrderBook = async () => {
    if (!selectedTicker) return;

    try {
      const response = await axios.get(`https://api.binance.com/api/v3/depth?symbol=${selectedTicker}&limit=10`);
      const data = response.data;
      
      // Преобразуем данные в нужный формат и сортируем asks по возрастанию цены
      const asks = data.asks
        .map((ask: [string, string]) => ({
          price: parseFloat(ask[0]),
          size: parseFloat(ask[1]),
          total: 0
        }))
        .sort((a: OrderBookEntry, b: OrderBookEntry) => a.price - b.price);

      // Преобразуем данные в нужный формат и сортируем bids по убыванию цены
      const bids = data.bids
        .map((bid: [string, string]) => ({
          price: parseFloat(bid[0]),
          size: parseFloat(bid[1]),
          total: 0
        }))
        .sort((a: OrderBookEntry, b: OrderBookEntry) => b.price - a.price);

      // Рассчитываем total для asks (накапливаем объем)
      let askTotal = 0;
      asks.forEach((ask: OrderBookEntry) => {
        askTotal += ask.size;
        ask.total = askTotal;
      });

      // Рассчитываем total для bids (накапливаем объем)
      let bidTotal = 0;
      bids.forEach((bid: OrderBookEntry) => {
        bidTotal += bid.size;
        bid.total = bidTotal;
      });

      setOrderBook({ asks, bids });
    } catch (error) {
      console.error('Error fetching order book:', error);
    }
  };

  // Добавляем функцию для изменения символа на графике
  const changeTicker = (symbol: string) => {
    if (window.tvWidget) {
      window.tvWidget.setSymbol('BINANCE:' + symbol);
    }
  };

  // Обновляем handleTickerClick
  const handleTickerClick = (ticker: string) => {
    setSelectedTicker(ticker);
    setShowOrderBook(true);
    prepareOrderBook();
    changeTicker(ticker); // Добавляем изменение символа на графике
  };

  // Добавляем useEffect для автоматического обновления
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    if (showOrderBook && selectedTicker) {
      prepareOrderBook(); // Первоначальная загрузка
      intervalId = setInterval(prepareOrderBook, 500); // Обновление каждые 500мс
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [showOrderBook, selectedTicker]);

  // Функция для фильтрации тикеров в Order Book
  const filterOrderBookTickers = (query: string) => {
    if (!query) {
      setFilteredOrderBookTickers([]);
      return;
    }

    const filtered = tickers
      .filter(ticker => {
        const symbol = ticker.symbol.toLowerCase();
        const pair = ticker.symbol.replace('USDT', '/USDT').toLowerCase();
        const searchQuery = query.toLowerCase();
        return (symbol.includes(searchQuery) || pair.includes(searchQuery)) && 
          ticker.symbol.endsWith('USDT');
      })
      .slice(0, 5)
      .sort((a, b) => {
        const aExact = a.symbol.toLowerCase().startsWith(query);
        const bExact = b.symbol.toLowerCase().startsWith(query);
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return a.symbol.localeCompare(b.symbol);
      });
    setFilteredOrderBookTickers(filtered);
  };

  // Функция для выбора тикера из выпадающего списка
  const selectOrderBookTicker = (ticker: Ticker) => {
    setSelectedTicker(ticker.symbol);
    setSearchQuery(ticker.symbol.replace('USDT', '/USDT'));
    setShowOrderBookDropdown(false);
    prepareOrderBook();
  };



  // Функция для работы с избранными тикерами
  const toggleFavorite = (symbol: string) => {
    setFavorites(prevFavorites => {
      const newFavorites = prevFavorites.includes(symbol)
        ? prevFavorites.filter(item => item !== symbol)
        : [...prevFavorites, symbol];
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
      return newFavorites;
    });
  };

  // Добавляем функцию для загрузки скрипта TradingView
  const appendScript = (onload: () => void) => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = onload;
    document.head.appendChild(script);
  };

  // Добавляем функцию для преобразования таймфрейма
  const getIntervalValue = (timeframe: string): string => {
    const intervalMap: { [key: string]: string } = {
      '1m': '1',
      '5m': '5',
      '15m': '15',
      '1h': '60',
      '4h': '240',
      '1d': 'D',
      '1w': 'W'
    };
    return intervalMap[timeframe] || '60';
  };

  // Обновляем функцию initChart
  const initChart = () => {
    console.log('Initializing chart...');
    if (typeof window !== 'undefined' && window.TradingView) {
      console.log('TradingView script loaded');
      const widget = new window.TradingView.widget({
        autosize: true,
        symbol: 'BINANCE:BTCUSDT',
        interval: getIntervalValue(currentTimeframe),
        timezone: 'Europe/Moscow',
        theme: 'dark',
        style: '1',
        locale: 'en',
        toolbar_bg: '#f1f3f6',
        enable_publishing: false,
        withdateranges: true,
        hide_side_toolbar: false,
        allow_symbol_change: true,
        save_image: true,
        details: true,
        hotlist: true,
        calendar: true,
        studies: [
          {
            id: 'MAExp@tv-basicstudies',
            inputs: { length: 20 }
          },
          {
            id: 'MAExp@tv-basicstudies',
            inputs: { length: 50 }
          },
          'RSI@tv-basicstudies',
          'MACD@tv-basicstudies',
          'StochasticRSI@tv-basicstudies'
        ],
        container_id: 'chart_container',
        width: '100%',
        height: '100%',
        onChartReady: () => {
          console.log('Chart ready');
          window.fullscreenChart = widget;
        }
      });
      window.tvWidget = widget;
      console.log('Widget created');
    } else {
      console.log('TradingView script not loaded');
    }
  };

  // Обновляем useEffect для инициализации графика
  useEffect(() => {
    if (showChartScreen) {
      console.log('Chart screen opened, loading script...');
      appendScript(() => {
        console.log('Script loaded, initializing chart...');
        setTimeout(initChart, 100);
      });
    }
  }, [showChartScreen]);

  // Обновляем функцию toggleChartScreen
  const toggleChartScreen = () => {
    setShowChartScreen(!showChartScreen);
    if (!showChartScreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  };

  // Функция для фильтрации тикеров в Share
  const filteredShareTickers = useMemo(() => {
    const filtered = tickers
      .filter(ticker => {
        if (shareAssetFilter === 'FAV') {
          return favorites.includes(ticker.symbol);
        }
        if (shareAssetFilter === 'USDT') {
          return ticker.symbol.endsWith('USDT') && !ticker.symbol.includes('UPUSDT') && !ticker.symbol.includes('DOWNUSDT');
        }
        if (shareAssetFilter === 'BTC') {
          return ticker.symbol.endsWith('BTC') && !ticker.symbol.includes('UPBTC') && !ticker.symbol.includes('DOWNBTC');
        }
        return true;
      })
      .filter(ticker => {
        const lowerCaseQuery = shareSearchQuery.toLowerCase();
        return ticker.symbol.toLowerCase().includes(lowerCaseQuery);
      });

    return filtered;
  }, [tickers, shareAssetFilter, shareSearchQuery, favorites]);

  // Функция для переключения выбора тикера
  const toggleSelectedTicker = (symbol: string) => {
    setSelectedTickers(prev => {
      if (prev.includes(symbol)) {
        return prev.filter(s => s !== symbol);
      } else {
        return [...prev, symbol];
      }
    });
  };

  // Обновляем функцию shareMultipleTickers
  const shareMultipleTickers = () => {
    if (selectedTickers.length === 0) return;

    const selectedTickerData = selectedTickers.map(symbol => {
      const ticker = tickers.find(t => t.symbol === symbol);
      if (!ticker) return null;
      return {
        symbol: ticker.symbol.replace('USDT', '/USDT'),
        price: formatTickerPrice(ticker),
        change: parseFloat(ticker.priceChangePercent.toString()).toFixed(2)
      };
    }).filter((ticker): ticker is NonNullable<typeof ticker> => ticker !== null);

    const message = selectedTickerData.map(ticker => 
      `${ticker.symbol}: ${ticker.price} (${ticker.change}%)`
    ).join('\n');

    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(message)}`;
    window.open(telegramUrl, '_blank');
    setSelectedTickers([]);
    setShowShareScreen(false);
  };

  // Функция для открытия Share экрана
  const toggleShareScreen = () => {
    if (!showShareScreen) {
      fetchTickers(); // Загружаем тикеры при открытии
    }
    setShowShareScreen(!showShareScreen);
    if (!showShareScreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  };

  // Функция для переключения калькулятора
  const toggleCalculator = () => {
    if (!showCalculator) {
      setShowCalculator(true);
      document.body.style.overflow = 'hidden';
    } else {
      setShowCalculator(false);
      document.body.style.overflow = 'auto';
    }
  };

  // Функция для обновления настроек калькулятора
  const updateCalcSettings = (settings: Partial<CalculatorForm>) => {
    setCalculatorForm(prev => ({
      ...prev,
      ...settings
    }));
  };

  const filterCalculatorCoins = () => {
    if (!calculatorSearchQuery || !tickers) {
      setFilteredCalculatorCoins([]);
      return;
    }

    const searchQuery = calculatorSearchQuery.toLowerCase();
    const filtered = Object.values(tickers)
      .filter(ticker => {
        const symbol = ticker.symbol.toLowerCase();
        const displaySymbol = symbol.replace('usdt', '/usdt');
        return (symbol.includes(searchQuery) || displaySymbol.includes(searchQuery)) && symbol.endsWith('usdt');
      })
      .sort((a, b) => {
        const aSymbol = a.symbol.toLowerCase();
        const bSymbol = b.symbol.toLowerCase();
        const aStartsWith = aSymbol.startsWith(searchQuery);
        const bStartsWith = bSymbol.startsWith(searchQuery);
        
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        return aSymbol.localeCompare(bSymbol);
      })
      .slice(0, 5);

    setFilteredCalculatorCoins(filtered);
  };

  useEffect(() => {
    filterCalculatorCoins();
  }, [calculatorSearchQuery, tickers]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.calculator-form-group')) {
        setShowCalculatorDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Функции для работы с портфелем
  const togglePortfolio = () => {
    if (!showPortfolio) {
      setShowPortfolio(true);
      document.body.style.overflow = 'hidden';
      updatePortfolioTotals();
    } else {
      setShowPortfolio(false);
      document.body.style.overflow = 'auto';
    }
  };

  const filterPortfolioCoins = (query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setFilteredPortfolioCoins([]);
      return;
    }
    const filtered = Object.values(tickers)
      .filter(ticker =>
        (ticker.symbol.toLowerCase().includes(q) || ticker.pair.toLowerCase().includes(q)) &&
        ticker.symbol.endsWith('USDT')
      )
      .slice(0, 8)
      .sort((a, b) => {
        const aExact = a.symbol.toLowerCase().startsWith(q);
        const bExact = b.symbol.toLowerCase().startsWith(q);
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return a.pair.localeCompare(b.pair);
      });
    setFilteredPortfolioCoins(filtered);
  };

  const selectPortfolioCoin = (ticker: Ticker) => {
    setPortfolioForm(prev => ({
      ...prev,
      selectedCoin: ticker,
      searchQuery: ticker.pair,
    }));
    setShowPortfolioDropdown(false);
    setFilteredPortfolioCoins([]);
  };

  const handlePortfolioSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPortfolioForm(prev => ({ ...prev, searchQuery: value, selectedCoin: null }));
    filterPortfolioCoins(value);
    setShowPortfolioDropdown(true);
  };

  const isPortfolioFormValid =
    portfolioForm.selectedCoin &&
    Number(portfolioForm.amount) > 0 &&
    Number(portfolioForm.buyPrice) > 0;

  const addPortfolioPosition = () => {
    if (!isPortfolioFormValid) return;
    const { selectedCoin, amount, buyPrice } = portfolioForm;
    const currentPrice = parseFloat(selectedCoin!.close);
    const investment = Number(amount) * Number(buyPrice);
    const currentValue = Number(amount) * currentPrice;
    const profit = currentValue - investment;
    const profitPercent = investment > 0 ? (profit / investment) * 100 : 0;
    const newPosition: PortfolioPosition = {
      id: `${selectedCoin!.symbol}-${Date.now()}`,
      symbol: selectedCoin!.symbol,
      pair: selectedCoin!.pair,
      amount: Number(amount),
      buyPrice: Number(buyPrice),
      currentPrice,
      currentValue,
      profit,
      profitPercent,
    };
    setPortfolioPositions(prev => {
      const updated = [...prev, newPosition];
      savePortfolioToStorage(updated);
      return updated;
    });
    setPortfolioForm({ searchQuery: '', selectedCoin: null, amount: 0, buyPrice: 0 });
    setFilteredPortfolioCoins([]);
    setShowPortfolioDropdown(false);
  };

  const removePortfolioPosition = (id: string) => {
    setPortfolioPositions(prev => {
      const updated = prev.filter(pos => pos.id !== id);
      savePortfolioToStorage(updated);
      return updated;
    });
  };

  const loadPortfolioFromStorage = () => {
    const data = localStorage.getItem('portfolioPositions');
    if (data) {
      try {
        const arr = JSON.parse(data);
        if (Array.isArray(arr)) setPortfolioPositions(arr);
      } catch { /* intentionally empty */ }
    }
  };
  useEffect(() => {
    loadPortfolioFromStorage();
  }, []);

  const updatePortfolioTotals = () => {
    if (!portfolioPositions.length) {
      setTotalInvestment(0);
      setCurrentValue(0);
      setTotalProfit(0);
      setTotalProfitPercent(0);
      return;
    }

    let totalInvestment = 0;
    let currentValue = 0;
    let tickersNotFound = false;

    portfolioPositions.forEach(position => {
      // Ищем тикер по symbol в массиве tickers
      const ticker = tickers.find(t => t.symbol === position.symbol);
      if (ticker && typeof ticker === 'object' && 'lastPrice' in ticker) {
        const investment = position.amount * position.buyPrice;
        const current = position.amount * parseFloat(ticker.lastPrice.toString());
        const profit = current - investment;
        const profitPercent = investment > 0 ? (profit / investment) * 100 : 0;

        position.currentPrice = parseFloat(ticker.lastPrice.toString());
        position.currentValue = current;
        position.profit = profit;
        position.profitPercent = profitPercent;

        totalInvestment += investment;
        currentValue += current;
      } else {
        tickersNotFound = true;
        const investment = position.amount * position.buyPrice;
        const lastKnownCurrentValue = position.currentValue || investment;

        totalInvestment += investment;
        currentValue += lastKnownCurrentValue;

        position.currentPrice = position.buyPrice;
        position.currentValue = lastKnownCurrentValue;
        position.profit = lastKnownCurrentValue - investment;
        position.profitPercent = investment > 0 ? ((lastKnownCurrentValue - investment) / investment) * 100 : 0;
      }
    });

    setTotalInvestment(totalInvestment);
    setCurrentValue(currentValue);
    setTotalProfit(currentValue - totalInvestment);
    setTotalProfitPercent(totalInvestment > 0 ? ((currentValue - totalInvestment) / totalInvestment) * 100 : 0);

    if (tickersNotFound) {
      console.warn("Some tickers were not found during updatePortfolioTotals. Displayed values might be outdated.");
    }
  };

  const savePortfolioToStorage = (positions: PortfolioPosition[]) => {
    localStorage.setItem('portfolioPositions', JSON.stringify(positions));
  };

  useEffect(() => {
    if (portfolioPositions.length > 0 && Object.keys(tickers).length > 0) {
      updatePortfolioTotals();
    }
  }, [tickers, portfolioPositions]);

  useEffect(() => {
    filterPortfolioCoins(portfolioForm.searchQuery);
  }, [portfolioForm.searchQuery, tickers]);

  const handleCalculatorCoinClick = (ticker: Ticker) => {
    setCalculatorForm(prev => ({
      ...prev,
      selectedCoin: ticker,
      searchQuery: ticker.symbol.replace('USDT', '/USDT'),
      initialPrice: parseFloat(ticker.lastPrice.toString()),
      projectedPrice: parseFloat(ticker.lastPrice.toString())
    }));
    setCalculatorSearchQuery(ticker.symbol.replace('USDT', '/USDT'));
    setShowCalculatorDropdown(false);
  };

  // Функция для переключения экрана Mempool
  const toggleMempoolScreen = () => {
    if (showMempoolScreen) {
      closeAllModals();
    } else {
      closeAllModals();
      setShowMempoolScreen(true);
      document.body.style.overflow = 'hidden';
      setMempoolDataLoaded(false); // Сбрасываем флаг загрузки
      fetchMempoolData(true); // Передаем флаг начальной загрузки
    }
  };

  // Функция для загрузки всех данных Mempool
  const fetchMempoolData = async (isInitialLoad = false) => {
    if (isInitialLoad) {
    setMempoolStatsLoading(true);
      setMempoolBlocksLoading(true);
    }
    
    try {
      // Загружаем статистику и блоки параллельно
      const [hashrateResponse, blocksResponse] = await Promise.all([
        axios.get('https://mempool.space/api/v1/mining/hashrate/3d'),
        axios.get('https://mempool.space/api/blocks')
      ]);
      
      // Обрабатываем статистику
      if (hashrateResponse.data) {
        const stats = {
          hashrate: hashrateResponse.data.currentHashrate,
          difficulty: hashrateResponse.data.currentDifficulty
        };
        setMempoolStats(stats);
      }
      
      // Обрабатываем блоки
      if (blocksResponse.data) {
        setLatestBlocks(blocksResponse.data.slice(0, 10));
      }
      
      // Отмечаем, что данные загружены
      setMempoolDataLoaded(true);
      
    } catch (error) {
      console.error('Error fetching mempool data:', error);
    } finally {
      if (isInitialLoad) {
        setMempoolStatsLoading(false);
      setMempoolBlocksLoading(false);
      }
    }
  };



  // Функция форматирования времени
  const formatTimeAgo = (timestamp: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Функция форматирования размера
  const formatBytes = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  // Обновляем useEffect для Mempool
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (showMempoolScreen && mempoolDataLoaded) {
      // Запускаем обновление только после первой загрузки
      interval = setInterval(() => {
        fetchMempoolData(false); // Обновление без показа loading
      }, 10000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [showMempoolScreen, mempoolDataLoaded]);

  const searchByAddress = async (address: string) => {
    if (!address) return;
    
    try {
      const response = await axios.get(`https://mempool.space/api/address/${address.trim()}`);
      if (response.data) {
        setSearchResults({
          type: 'address',
          data: {
            balance: formatBtc(response.data.chain_stats?.funded_txo_sum - response.data.chain_stats?.spent_txo_sum),
            transactions: response.data.chain_stats?.tx_count || 0,
            received: formatBtc(response.data.chain_stats?.funded_txo_sum),
            spent: formatBtc(response.data.chain_stats?.spent_txo_sum)
          }
        });
      }
    } catch (error) {
      console.error('Error searching by address:', error);
      console.error('Error searching by transaction:', error);
      setSearchResults({ type: null, data: null });
    }
  };

  const searchByTransaction = async (hash: string) => {
    if (!hash) return;
    
    try {
      const response = await axios.get(`https://mempool.space/api/tx/${hash.trim()}`);
      if (response.data) {
        setSearchResults({
          type: 'transaction',
          data: {
            hash: response.data.txid,
            from: response.data.vin[0]?.prevout?.scriptpubkey_address,
            to: response.data.vout[0]?.scriptpubkey_address,
            value: formatBtc(response.data.vout[0]?.value),
            time: response.data.status.block_time
          }
        });
      }
    } catch (error) {
      console.error('Error searching by transaction:', error);
      setSearchResults({ type: null, data: null });
    }
  };

  // Функция для поиска USDT адресов (TRC20) - обновленная на основе example.html
  const searchUsdtAddress = async (address: string) => {
    if (!address) return;
    
    try {
      const addressToLookup = address.trim();
      const apiUrl = `https://apilist.tronscan.org/api/account?address=${addressToLookup}`;
      console.log('Lookup TRC20 USDT Address via:', apiUrl);
      
      const response = await axios.get(apiUrl);
      console.log('TRC20 USDT address lookup response status:', response.status);
      
      if (response.status !== 200) {
        let errorText = `HTTP Error: status ${response.status}`;
        try {
          if (response.data && response.data.error) {
            errorText += ` - ${response.data.error}`;
          } else if (typeof response.data === 'string') {
            errorText += ` - ${response.data}`;
          } else if (response.data) {
            errorText += ` - ${JSON.stringify(response.data)}`;
          }
        } catch (parseError) {
          errorText = `HTTP Error: status ${response.status}. Unable to parse response body.`;
          console.warn('Unable to parse the error response body TRC20 USDT:', parseError);
        }
        
        if (response.status === 404) {
          errorText = `USDT Address in chain TRC20 "${addressToLookup}" not found. Please check the address.`;
        } else if (response.status === 400) {
          errorText = `Request error (400 Bad Request) for network TRC20. The address format may be incorrect: "${addressToLookup}".`;
        }
        
        console.error('USDT Address search failed (TRC20) HTTP error:', response.status, errorText);
        setSearchResults({ type: null, data: null });
        return;
      }
      
      const accountData = response.data;
      console.log('USDT Address details (TRC20) successfully loaded:', accountData);
      
      // Получаем баланс USDT из trc20token_balances
      let usdtBalance = '0.000000';
      if (accountData.trc20token_balances && Array.isArray(accountData.trc20token_balances)) {
        const usdtBalanceInfo = accountData.trc20token_balances.find(
          (token: { tokenId: string; balance: string; tokenDecimal: number }) => 
            token.tokenId === 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
        );
        
        if (usdtBalanceInfo) {
          usdtBalance = (parseFloat(usdtBalanceInfo.balance) / Math.pow(10, usdtBalanceInfo.tokenDecimal)).toFixed(6);
        }
      }
      
      // Получаем баланс TRX
      let trxBalance = 'N/A';
      if (accountData.balance !== undefined && accountData.balance !== null) {
        trxBalance = (parseFloat(accountData.balance) / Math.pow(10, 6)).toFixed(6);
      }
      
      setSearchResults({
        type: 'address',
        data: {
          address: addressToLookup,
          usdtBalance: `${usdtBalance} USDT`,
          trxBalance: `${trxBalance} TRX`,
          totalTransactions: accountData.totalTransactionCount || 0,
          received: 'N/A', // TRC20 не предоставляет эту информацию напрямую
          spent: 'N/A'
        }
      });
      
    } catch (error) {
      console.error('Error while executing address search request USDT (TRC20):', error);
      setSearchResults({ type: null, data: null });
    }
  };

    // Функция для поиска USDT транзакций (TRC20) - обновленная на основе example.html
  const searchUsdtTransaction = async (hash: string) => {
    if (!hash) return;
    
    try {
      const txIdToLookup = hash.trim();
      const apiUrl = `https://apilist.tronscan.org/api/transaction?hash=${txIdToLookup}`;
      console.log('Lookup TRC20 USDT Transaction via:', apiUrl);
      
      const response = await axios.get(apiUrl);
      console.log('TRC20 USDT transaction lookup response status:', response.status);
      
      if (response.status !== 200) {
        let errorText = `HTTP Error: status ${response.status}`;
        try {
          if (response.data && response.data.error) {
            errorText += ` - ${response.data.error}`;
          } else if (typeof response.data === 'string') {
            errorText += ` - ${response.data}`;
          } else if (response.data) {
            errorText += ` - ${JSON.stringify(response.data)}`;
          }
        } catch (parseError) {
          errorText = `HTTP Error: status ${response.status}. Unable to parse response body.`;
          console.warn('Unable to parse the error response body TRC20 USDT transaction:', parseError);
        }
        
        if (response.status === 404) {
          errorText = `USDT transaction in chain TRC20 with ID "${txIdToLookup}" not found. Please check ID.`;
        } else if (response.status === 400) {
          errorText = `Request Error (400 Bad Request) for chain TRC20. The transaction ID format may be incorrect: "${txIdToLookup}".`;
        }
        
        console.error('USDT transaction search failed (TRC20) with HTTP error:', response.status, errorText);
        setSearchResults({ type: null, data: null });
        return;
      }
      
      const txData = response.data;
      console.log('USDT transaction data(TRC20) successfully loaded:', txData);
      
      if (!txData.data || !Array.isArray(txData.data) || txData.data.length === 0) {
        setSearchResults({ type: null, data: null });
        return;
      }
      
      const mainTx = txData.data[0];
      console.log('Main transaction data:', mainTx);
      console.log('Main transaction keys:', Object.keys(mainTx));
      
      // Используем логику из example.html для получения деталей транзакции
      const getTrc20TokenTransferDetails = (txDetails: { rawData?: Record<string, unknown> }) => {
        if (!txDetails || !txDetails.rawData) {
          console.log('No txDetails or rawData');
          return null;
        }

        console.log('RawData keys:', Object.keys(txDetails.rawData));
        console.log('trc20TransferInfo:', txDetails.rawData.trc20TransferInfo);
        console.log('events:', txDetails.rawData.events);
        console.log('transferred:', txDetails.rawData.transferred);

        // Поиск в trc20TransferInfo
        if (txDetails.rawData.trc20TransferInfo && Array.isArray(txDetails.rawData.trc20TransferInfo)) {
          console.log('Searching in trc20TransferInfo, length:', txDetails.rawData.trc20TransferInfo.length);
          const usdtTransfer = txDetails.rawData.trc20TransferInfo.find(
            (transfer: { contract_address: string; amount_str: string; decimal: number; contract_abbr?: string; transfer_from_address: string; transfer_to_address: string }) => {
              console.log('Checking transfer:', transfer);
              return transfer.contract_address === 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
            }
          );
          if (usdtTransfer) {
            console.log('Found USDT transfer in trc20TransferInfo:', usdtTransfer);
            return {
              value: usdtTransfer.amount_str,
              tokenDecimal: usdtTransfer.decimal,
              tokenAbbr: usdtTransfer.contract_abbr || 'USDT',
              from_address: usdtTransfer.transfer_from_address,
              to_address: usdtTransfer.transfer_to_address
            };
          }
        }

        // Поиск в events
        if (txDetails.rawData.events && Array.isArray(txDetails.rawData.events)) {
          console.log('Searching in events, length:', txDetails.rawData.events.length);
          const transferEvent = txDetails.rawData.events.find((event: { detail?: { event_name?: string; data?: { value: string; from: string; to: string } }; contract?: string }) => {
            console.log('Checking event:', event);
            return event.detail &&
              event.detail.event_name === 'Transfer' &&
              event.contract &&
              event.contract === 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
          });
          if (transferEvent && transferEvent.detail.data) {
            console.log('Found USDT transfer in events:', transferEvent);
            return {
              value: transferEvent.detail.data.value,
              tokenDecimal: 6,
              tokenAbbr: 'USDT',
              from_address: transferEvent.detail.data.from,
              to_address: transferEvent.detail.data.to
            };
          }
        }

        // Поиск в transferred поле
        if (txDetails.rawData && txDetails.rawData.transferred !== undefined && txDetails.rawData.transferred !== null) {
          console.log('Found transferred field in rawData:', txDetails.rawData.transferred);
          return {
            value: txDetails.rawData.transferred,
            tokenDecimal: 6,
            tokenAbbr: 'USDT',
            from_address: txDetails.rawData.ownerAddress || 'N/A',
            to_address: txDetails.rawData.toAddress || (Array.isArray(txDetails.rawData.toAddressList) ? txDetails.rawData.toAddressList[0] : 'N/A')
          };
        }

        // Дополнительный поиск - проверяем, является ли это вызовом контракта USDT
        if (txDetails.rawData.contract_address === 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t') {
          console.log('Found USDT contract call');
          // Ищем данные в trc20TransferInfo на верхнем уровне
          if (txData.trc20TransferInfo && Array.isArray(txData.trc20TransferInfo)) {
            const usdtTransfer = txData.trc20TransferInfo.find(
              (transfer: { contract_address: string; amount_str: string; decimal: number; contract_abbr?: string; transfer_from_address: string; transfer_to_address: string }) => 
                transfer.contract_address === 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
            );
            if (usdtTransfer) {
              console.log('Found USDT transfer in top-level trc20TransferInfo:', usdtTransfer);
              return {
                value: usdtTransfer.amount_str,
                tokenDecimal: usdtTransfer.decimal,
                tokenAbbr: usdtTransfer.contract_abbr || 'USDT',
                from_address: usdtTransfer.transfer_from_address,
                to_address: usdtTransfer.transfer_to_address
              };
            }
          }
        }

        console.log('No USDT transfer found');
        return null;
      };

      // Создаем объект txDetails как в example.html
      const txDetails = {
        rawData: mainTx
      };

      const transferDetails = getTrc20TokenTransferDetails(txDetails);
      console.log('Transfer details found:', transferDetails);

      if (transferDetails) {
        const usdtValue = parseFloat(transferDetails.value) / Math.pow(10, transferDetails.tokenDecimal);
        
        setSearchResults({
          type: 'transaction',
          data: {
            hash: mainTx.hash,
            from: transferDetails.from_address,
            to: transferDetails.to_address,
            value: `${usdtValue.toFixed(6)} ${transferDetails.tokenAbbr}`,
            time: mainTx.timestamp ? mainTx.timestamp / 1000 : undefined
          }
        });
      } else {
        // Если не нашли USDT перевод, показываем общую информацию о транзакции
        setSearchResults({
          type: 'transaction',
          data: {
            hash: mainTx.hash,
            from: mainTx.ownerAddress || 'N/A',
            to: mainTx.toAddress || (Array.isArray(mainTx.toAddressList) ? mainTx.toAddressList[0] : 'N/A'),
            value: 'Not a USDT transaction',
            time: mainTx.timestamp ? mainTx.timestamp / 1000 : undefined
          }
        });
      }
      
    } catch (error) {
      console.error('Error executing USDT transaction search request (TRC20):', error);
      setSearchResults({ type: null, data: null });
    }
  };

  // Добавляем компонент для отображения результатов поиска
  const SearchResults = () => {
    if (!searchResults.type || !searchResults.data) return null;

    // Определяем, какая сеть активна для правильного отображения
    const isUsdtScreen = showUsdtScreen;
    const isTonScreen = showTonScreen;
    const isBtcScreen = showMempoolScreen && !showUsdtScreen && !showTonScreen;

    let currency = 'BTC';
    if (isUsdtScreen) currency = 'USDT';
    else if (isTonScreen) currency = 'TON';
    else if (isBtcScreen) currency = 'BTC';

    return (
      <div className="search-results">
        {searchResults.type === 'address' && (
          isTonScreen && typeof searchResults.data.address === 'string' ? (
            <TonAddressResult data={searchResults.data as TonAddressResultProps['data']} />
          ) : (
          <div className="address-results">
              <h3>Address Information ({currency})</h3>
            <div className="address-details">
                {isUsdtScreen ? (
                  <>
                    <p>Address: <span className="text-white">{searchResults.data.address}</span></p>
                    <p>USDT TRC20 Balance: <span className="text-white">{searchResults.data.usdtBalance}</span></p>
                    <p>TRX Balance: <span className="text-white">{searchResults.data.trxBalance}</span></p>
                    <p>Total Transactions: <span className="text-white">{searchResults.data.totalTransactions}</span></p>
                  </>
                ) : (
                  <>
                    <p>Balance: <span className="text-white">{searchResults.data.balance}</span></p>
              <p>Transactions: <span className="text-white">{searchResults.data.transactions}</span></p>
              <p>Received: <span className="text-white">{searchResults.data.received} BTC</span></p>
              <p>Spent: <span className="text-white">{searchResults.data.spent} BTC</span></p>
                  </>
                )}
            </div>
          </div>
          )
        )}
        {searchResults.type === 'transaction' && (
          <div className="transaction-results">
            <h3>Transaction Information ({currency})</h3>
            <div className="transaction-details">
              <p>Hash: {searchResults.data.hash}</p>
              <p>From: {searchResults.data.from}</p>
              <p>To: {searchResults.data.to}</p>
              <p>Value: {searchResults.data.value}</p>
              {searchResults.data.time && (
                <p>Time: {new Date(searchResults.data.time * 1000).toLocaleString()}</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const closeAllModals = () => {
    setShowMempoolScreen(false);
    setShowUsdtScreen(false);
    setShowTonScreen(false);
    setShowChartScreen(false);
    setShowOrderBook(false);
    setShowShareScreen(false);
    setShowCalculator(false);
    setShowPortfolio(false);
    setShowNewsScreen(false);
    setShowTickersScreen(false);
    setShowWalletScreen(false);
    setShowContactScreen(false);
    document.body.style.overflow = 'auto';
  };

  // Обновляем обработчики кнопок навигации
  const handleChartClick = () => {
    if (showChartScreen) {
      closeAllModals();
    } else {
      closeAllModals();
      setShowChartScreen(true);
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        initChart();
      }, 0);
    }
  };

  const handleOrderBookClick = () => {
    if (showOrderBook) {
      closeAllModals();
    } else {
      closeAllModals();
      setShowOrderBook(true);
      document.body.style.overflow = 'hidden';
      if (!selectedTicker) {
        setSelectedTicker('BTCUSDT');
        setSearchQuery('BTC/USDT');
      }
      prepareOrderBook();
    }
  };

  const handleShareClick = () => {
    if (showShareScreen) {
      closeAllModals();
    } else {
      closeAllModals();
      setShowShareScreen(true);
      document.body.style.overflow = 'hidden';
      fetchTickers();
    }
  };

  const handleCalculatorClick = () => {
    if (showCalculator) {
      closeAllModals();
    } else {
      closeAllModals();
      setShowCalculator(true);
      document.body.style.overflow = 'hidden';
    }
  };

  const handlePortfolioClick = () => {
    if (showPortfolio) {
      closeAllModals();
    } else {
      closeAllModals();
      setShowPortfolio(true);
      document.body.style.overflow = 'hidden';
      updatePortfolioTotals();
    }
  };

  // Функция для поиска TON адреса
  const searchTonAddress = async (address: string) => {
    if (!address) return;
    try {
      const response = await axios.get(`https://tonapi.io/v2/accounts/${address.trim()}`);
      const data = response.data;
      console.log('TONAPI response:', data); // Для отладки
      setSearchResults({
        type: 'address',
        data: {
          address: data.address || '',
          tonBalance: data.balance ? (parseInt(data.balance) / 1e9).toFixed(6) : '0', // только число
          jettons: data.jettons?.balances || [],
          status: data.status,
          date_of_creation: data.date_of_creation,
          last_activity: data.last_activity,
          is_scam: data.is_scam,
          frozen: data.frozen,
          interfaces: data.interfaces,
        }
      });
    } catch (e) {
      console.error('TONAPI error:', e);
      setSearchResults({ type: null, data: null });
    }
  };

  // Компонент для отображения TON-результатов
  interface TonAddressResultProps {
    data: {
      address: string;
      tonBalance?: string;
      jettons?: TonJetton[];
      status?: string;
      date_of_creation?: number;
      last_activity?: number;
      is_scam?: boolean;
      frozen?: boolean;
      interfaces?: string[];
    };
  }
  const TonAddressResult = ({ data }: TonAddressResultProps) => {
    if (!data) return null;
    // Форматирование дат
    const formatDate = (ts?: number) => (ts ? new Date(ts * 1000).toLocaleString() : 'N/A');
    // Формат jetton баланса
    const formatJetton = (balance: string, decimals: number) => {
      return (parseFloat(balance) / Math.pow(10, decimals)).toLocaleString(undefined, { maximumFractionDigits: 6 });
    };
    return (
      <div className="address-results">
        <div className="address-details" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8 }}>
          <div>TON balance:</div>
          <div className="font-mono text-white">{data.tonBalance || '0'} TON</div>
          <div>Status:</div>
          <div className="font-mono text-white">{data.status ?? 'N/A'}</div>
          <div>Last activity:</div>
          <div className="font-mono text-white">{data.last_activity ? formatDate(data.last_activity) : 'N/A'}</div>
          <div>Is Scam:</div>
          <div className="font-mono text-white">{data.is_scam ? 'Yes' : 'No'}</div>
          <div>Frozen:</div>
          <div className="font-mono text-white">{data.frozen ? 'Yes' : 'No'}</div>
          <div>Interfaces:</div>
          <div className="font-mono text-white">{Array.isArray(data.interfaces) && data.interfaces.length > 0 ? data.interfaces.join(', ') : 'N/A'}</div>
          {data.date_of_creation && (
            <>
              <div>Created:</div>
              <div className="font-mono text-white">{formatDate(data.date_of_creation)}</div>
            </>
          )}
          <div>Address:</div>
          <div className="font-mono text-white break-all">{data.address}</div>
        </div>
        {Array.isArray(data.jettons) && data.jettons.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Jetton Balances:</div>
            <div style={{ background: 'var(--color-bg--500)', padding: 8, borderRadius: 6, maxHeight: 120, overflowY: 'auto', fontSize: 13 }}>
              {data.jettons.map((j, idx) => (
                <div key={j.jetton?.address || idx} className="font-mono text-white break-all" style={{ marginBottom: 2 }}>
                  {formatJetton(j.balance, j.jetton?.decimals || 9)} {j.jetton?.symbol || j.jetton?.name || 'Jetton'}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // --- Portfolio Dropdown Logic ---
  const portfolioSearchRef = useRef<HTMLInputElement>(null);
  const portfolioDropdownRef = useRef<HTMLDivElement>(null);

  // Обработчик клика вне dropdown для его закрытия
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        portfolioDropdownRef.current &&
        !portfolioDropdownRef.current.contains(event.target as Node) &&
        portfolioSearchRef.current &&
        !portfolioSearchRef.current.contains(event.target as Node)
      ) {
        setShowPortfolioDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // --- Binance WebSocket for real-time tickers (like example.html) ---
  useEffect(() => {
    let ws: WebSocket | null = null;
    let isUnmounted = false;

    function handleMessage(event: MessageEvent) {
      try {
        const data = JSON.parse(event.data);
        if (Array.isArray(data)) {
          // Массив тикеров с Binance
          const spotTickers = data.filter((ticker: unknown) => {
            if (!ticker || typeof ticker !== 'object' || !('s' in ticker)) return false;
            const t = ticker as { [key: string]: unknown };
            const symbol = typeof t.s === 'string' ? t.s : '';
            const isUSDT = symbol.endsWith('USDT') && !symbol.includes('UPUSDT') && !symbol.includes('DOWNUSDT');
            const isBTC = symbol.endsWith('BTC') && !symbol.includes('UPBTC') && !symbol.includes('DOWNBTC');
            const hasValidPrice = typeof t.c === 'string' && parseFloat(t.c) > 0;
            return (isUSDT || isBTC) && hasValidPrice;
          }).map((ticker: unknown) => {
            const t = ticker as { [key: string]: unknown };
            const symbol = typeof t.s === 'string' ? t.s : '';
            return {
              symbol,
              lastPrice: typeof t.c === 'string' ? parseFloat(t.c) : 0,
              priceChangePercent: typeof t.P === 'string' ? parseFloat(t.P) : 0,
              quoteVolume: typeof t.q === 'string' ? parseFloat(t.q) : 0,
            };
          });
          // Обновляем только существующие тикеры
          if (!isUnmounted && spotTickers.length > 0) {
            setTickers(prevTickers => prevTickers.map(ticker => {
              const wsTicker = spotTickers.find(s => s.symbol === ticker.symbol);
              if (wsTicker) {
                return {
                  ...ticker,
                  lastPrice: wsTicker.lastPrice,
                  close: wsTicker.lastPrice.toString(),
                  priceChangePercent: wsTicker.priceChangePercent,
                  quoteVolume: wsTicker.quoteVolume,
                };
              }
              return ticker;
            }));
          }
        }
      } catch {
        // ignore
      }
    }

    ws = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr');
    ws.onmessage = handleMessage;

    return () => {
      isUnmounted = true;
      if (ws) ws.close();
    };
  }, []);

  // --- Динамическое обновление портфеля при каждом изменении тикеров ---
  useEffect(() => {
    if (portfolioPositions.length > 0 && tickers.length > 0) {
      updatePortfolioTotals();
    }
    // eslint-disable-next-line
  }, [tickers]);

  // --- Подсчёт уникальных тикеров в портфеле ---
  const uniqueCoinsCount = useMemo(() => {
    const symbols = portfolioPositions.map(pos => pos.symbol);
    return new Set(symbols).size;
  }, [portfolioPositions]);

  // Динамическое обновление TON (TONAPI) — обновлять цену TON каждые 5 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTonPriceData();
    }, 5000); // обновлять раз в 5 секунд
    return () => clearInterval(interval);
  }, []);

  // После обновления tonPrice пересчитывать портфель, если есть TON в портфеле
  useEffect(() => {
    if (portfolioPositions.some(pos => pos.symbol === 'TONUSDT')) {
      updatePortfolioTotals();
    }
    // eslint-disable-next-line
  }, [tonPrice]);

  // 1. Добавляем функцию для получения тикеров TON с TONAPI
  const fetchTonTickers = async () => {
    try {
      // Пример запроса к TONAPI для получения тикеров (замените на актуальный endpoint, если есть)
      // Здесь используется rates, но если есть другой endpoint для тикеров, используйте его
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
          priceChangePercent: tonRates.diff_24h?.USD ? parseFloat(String(tonRates.diff_24h.USD).replace('%','').replace('−','-')) : 0,
          quoteVolume: 0 // Можно доработать, если есть объём
        });
      }
      if (tonRates.prices?.BTC) {
        tickers.push({
          symbol: 'TONBTC',
          pair: 'TON/BTC',
          close: tonRates.prices.BTC.toString(),
          lastPrice: parseFloat(tonRates.prices.BTC),
          priceChangePercent: tonRates.diff_24h?.BTC ? parseFloat(String(tonRates.diff_24h.BTC).replace('%','').replace('−','-')) : 0,
          quoteVolume: 0
        });
      }
      return tickers;
    } catch {
      return [];
    }
  };

  return (
    <div className="relative p-2"> {/* Use relative positioning for header absolute positioning */}
      {/* Header section as upper navigation panel */}
      <header className="upper-nav-panel flex items-center justify-between px-1 text-sm lg:text-xl"> {/* Add class for upper nav panel */}
        {/* Mempool button - Wrap in container */}
        <div className="header-button-container"> {/* New container */}
          <BubbleButton 
            className="nav-button-content bg-[--color-primary-blue] text-white rounded font-rajdhani" 
            onClick={toggleMempoolScreen}
          >
            Mempool
          </BubbleButton>
        </div>

        {/* News button - Wrap in container */}
        <div className="header-button-container"> {/* New container */}
          <BubbleButton className="nav-button-content bg-[--color-primary-blue] text-white rounded font-rajdhani" onClick={toggleNewsScreen}> {/* Apply styles to inner button */}
            News
          </BubbleButton>
        </div>

        {/* Connect Wallet button - Existing container, update class */}
        {/* TonConnectButton may need styling to fit the panel */}
        <div className="header-button-container flex items-center justify-center"> {/* Update class and keep existing flex centering */}
           <TonConnectButton /> {/* TonConnectButton itself might need styling */}
        </div>

        {/* Show Wallet Info button - Wrap in container */}
        <div className="header-button-container"> {/* New container */}
          <BubbleButton
            className="nav-button-content bg-[--color-primary-blue] text-white rounded font-rajdhani" // Apply styles to inner button
            onClick={toggleWalletScreen} // Toggle wallet screen instead
          >
            Wallet Info
          </BubbleButton>
        </div>

        {/* Contact button and dropdown - Existing container, update class */}
        <div className="relative header-button-container"> {/* Update class and keep relative for dropdown */}
          <BubbleButton
            className="nav-button-content bg-[--color-primary-blue] text-white rounded font-rajdhani" // Apply styles to inner button
            onClick={toggleContactScreen} // Toggle contact screen instead
          >
            Contact
          </BubbleButton>
           {/* Contact Dropdown временно убран для устранения ошибки showContactDropdown */}
        </div>

         {/* Placeholder for Ticker display area - remove or integrate if needed */}
        {/* This area from index1.html could display live price/change data in the header */}
        {/* <div className="flex gap-1 flex-grow items-center justify-between delay-200"></div> */}

      </header>

      {/* Delimiter below header - potentially remove if header is a solid panel */}
      <div className="delimiter my-2"></div>

      {/* Wallet Screen Overlay - New structure similar to news screen */}
      {showWalletScreen && (
        <div className="wallet-screen-overlay"> {/* Class for overlay */}
          <div className="wallet-screen-content"> {/* Class for content container */}
            {/* Header for Wallet Screen */}
            <div className="flex justify-between items-center mb-2" style={{marginTop: '8px'}}> {/* Было mb-6 */}
              <h2 className="text-2xl font-bold text-[--color-primary-silver]">Wallet Information</h2>
              {/* Close Button */}
              <button onClick={toggleWalletScreen} className="wallet-screen-close">Close</button>
          </div>

            {/* Wallet Details and Analytics Content - Moved here */}
            {connected && account ? (
              <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Wallet className="w-6 h-6 text-blue-400" />
                    <h2 className="text-xl font-semibold text-white">Wallet Details</h2>
                  </div>
                  <div className="space-y-2 text-gray-400">
                    <p>Address: <span className="font-mono text-sm break-all text-white">{account.address}</span></p>
                    <p>Balance: <span className="text-lg font-bold text-white">{balance !== null ? `${parseFloat(balance).toFixed(4)} TON` : 'Loading...'}</span></p>
                  </div>
                </div>

                {/* Analytics */}
                  <div className="bg-gray-800 rounded-lg p-6 mt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <h2 className="text-xl font-semibold text-white">Analytics</h2>
                    </div>
                    <div className="space-y-4 text-gray-400">
                      <div>
                      <p>TON Price (USD): <span className="font-semibold text-white">{tonPrice !== null && tonPrice !== 'N/A' ? tonPrice : tonLoading ? 'Loading...' : 'N/A'}</span></p>
                      <p>TON Price Change (24h): <span className={`font-semibold ${tonPriceChange24h && parseFloat(tonPriceChange24h.replace('%', '').replace('+', '').replace('−', '-')) > 0 ? 'text-green' : 'text-red'}`}>{tonPriceChange24h !== null && tonPriceChange24h !== 'N/A' ? tonPriceChange24h : tonLoading ? 'Loading...' : 'N/A'}</span></p>
                      </div>
                      <div>
                      <p>TON Wallet Balance (USD): <span className="font-semibold text-white">{tonBalanceUSD !== null && tonBalanceUSD !== 'N/A' ? tonBalanceUSD : tonLoading ? 'Loading...' : 'N/A'}</span></p>
                      </div>
                    </div>
                  </div>
              </div>
            ) : (
              <div className="text-center py-12">
                 <p className="text-xl text-white">Connect your TON wallet to view your balance and transactions</p>
                {connectionError && (
                  <div className="mt-4 p-4 bg-red-900 border border-red-500 rounded-lg">
                    <p className="text-red-200">Connection Error: {connectionError}</p>
                    <p className="text-sm text-red-300 mt-2">Please try again or check your wallet settings</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contact Screen Overlay - New structure */}
      {showContactScreen && (
        <div className="contact-screen-overlay"> {/* Class for overlay */}
          <div className="contact-screen-content"> {/* Class for content container */}
            {/* Header for Contact Screen */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[--color-primary-silver]">Contact Us</h2> {/* Title */}
              {/* Close Button */}
              <button onClick={toggleContactScreen} className="contact-screen-close">Close</button>
            </div>

            {/* Contact Buttons */}
            <div className="flex flex-col items-center space-y-4"> {/* Container for buttons */}
              <BubbleButton
                 className="nav-button bg-[--color-primary-blue] text-white rounded font-rajdhani w-full max-w-xs" // Style for the button
                 onClick={() => { WebApp.openTelegramLink('http://t.me/LilBitcoinVert'); toggleContactScreen(); }}
              >
                 Contact me
              </BubbleButton>
              <BubbleButton
                 className="nav-button bg-[--color-primary-blue] text-white rounded font-rajdhani w-full max-w-xs" // Style for the button
                 onClick={() => { WebApp.openTelegramLink('https://t.me/BitcoinVertical'); toggleContactScreen(); }}
              >
                 Follow
              </BubbleButton>
            </div>

          </div>
        </div>
      )}

      {/* News Screen Overlay */}
      {showNewsScreen && (
        <div className="news-screen-overlay">
          <div className="news-screen-content">
            {/* Header for News Screen */}
            <div className="flex justify-between items-center mb-6" style={{ marginTop: '20px' }}>
              <h2 className="text-xl md:text-2xl font-bold text-[--color-primary-silver]">Crypto News</h2>
              <button onClick={toggleNewsScreen} className="news-screen-close">Close</button>
            </div>

            {/* Search and Filter Controls */}
            <div className="flex flex-col md:flex-row gap-3 mb-6">
                {/* Category Select */}
                <div className="relative news-category-select">
                  <select
                    value={selectedNewsCategory}
                    onChange={(e) => setSelectedNewsCategory(e.target.value)}
                  className="bg-[--color-bg--300] text-white px-3 py-2 md:px-4 md:py-2 rounded-lg border border-[--color-primary-purple] w-full md:w-auto text-sm md:text-base"
                  >
                    <option value="">All Categories</option>
                    {/* Add other relevant categories from index1.html or API response */}
                     <option value="Trading">Trading</option>
                     <option value="Technology">Technology</option>
                     <option value="Mining">Mining</option>
                     <option value="Regulation">Regulation</option>
                     <option value="Business">Business</option>
                     {/* You might need to dynamically generate these based on fetched news */}
                  </select>
                </div>
              {/* Search Input */}
                 <input
                   type="text"
                   placeholder="Search news..."
                   value={newsSearchQuery}
                   onChange={(e) => setNewsSearchQuery(e.target.value)}
                 className="bg-[--color-bg--300] text-white px-3 py-2 md:px-4 md:py-2 rounded-lg border border-[--color-primary-purple] w-full md:w-auto text-sm md:text-base"
                 />
            </div>

            {/* News Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredNewsItems.map((item, index) => (
                <div key={item.id || index} className="cb p-3 md:p-4 rounded-lg transition-transform hover:scale-[1.02]">
                   <div className="relative news-image">
                       <img src={item.imageurl} alt={item.title} className="w-full h-32 md:h-48 object-cover rounded-lg mb-3 md:mb-4" />
                   </div>
                   <div className="news-meta mb-2">
                       <span className="news-category text-xs md:text-sm text-[--color-primary-yellow]">{item.categories}</span>
                       <span className="news-date text-xs md:text-sm text-[--color-primary-silver] ml-2">{formatNewsDate(item.published_on)}</span>
                   </div>
                   <h3 className="news-title text-base md:text-lg font-bold mb-2 text-white leading-tight">{item.title}</h3>
                   <p className="news-excerpt text-xs md:text-sm text-[--color-primary-silver] mb-3 md:mb-4 leading-relaxed">{item.body?.slice(0, 120)}...</p> {/* Truncate body */}
                   <div className="news-footer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                       <a href={item.url} target="_blank" rel="noopener noreferrer" className="news-read-more text-[--color-primary-purple] hover:underline cursor-pointer text-sm md:text-base">Read More</a>
                       <span className="news-source text-xs md:text-sm text-[--color-primary-silver]">Source: {item.source}</span>
                   </div>
                  </div>
                ))}
            </div>

            {/* Loading Indicator */}
            {newsLoading && (
              <div className="news-loading flex justify-center items-center mt-8">
                <div className="news-spinner animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[--color-primary-purple]"></div>
              </div>
            )}

            {/* Load More Button */}
            {/* Remove Load More Button and its conditional rendering */}
            {/*
            {!newsLoading && !noMoreNews && filteredNewsItems.length > 0 && (
              <div className="flex justify-center my-8">
                <button onClick={loadMoreNews} className="load-more-news-button bg-[--color-primary-purple] text-white px-6 py-3 rounded-lg hover:bg-opacity-80">
                  Load More News
                </button>
              </div>
            )}
             {!newsLoading && noMoreNews && filteredNewsItems.length > 0 && (
                 <div className="flex justify-center my-8">
                     <span className="text-[--color-primary-silver]">No more news available</span>
                 </div>
             )}
            */}
             {!newsLoading && filteredNewsItems.length === 0 && newsSearchQuery && (
                 <div className="text-center text-[--color-primary-silver] mt-8">No news found matching your search criteria.</div>
             )}
              {!newsLoading && filteredNewsItems.length === 0 && selectedNewsCategory && (
                 <div className="text-center text-[--color-primary-silver] mt-8">No news found for the selected category.</div>
             )}
               {!newsLoading && filteredNewsItems.length === 0 && !selectedNewsCategory && !newsSearchQuery && (
                 <div className="text-center text-[--color-primary-silver] mt-8">No news available.</div>
             )}

          </div>
        </div>
      )}

      {/* Tickers Screen Overlay - New structure */}
      {showTickersScreen && (
        <div className="tickers-screen-overlay"> {/* Class for overlay */}
          <div className="tickers-screen-content" style={{ paddingTop: 0, marginTop: 0 }}> {/* Class for content container */}
            {/* Header for Tickers Screen */}
            <div className="flex justify-between items-center mb-0" style={{ marginTop: 0, paddingTop: '90px', marginBottom: 0 }}>
              <h2 className="text-xl font-bold text-[--color-primary-silver]">Ticker List</h2>
              <button onClick={toggleTickersScreen} className="tickers-screen-close">Close</button>
            </div>

            {/* Search Input and Category Filters */}
            <div className="mb-4" style={{ marginTop: '16px' }}>
                {/* Search Input */}
                <input
                   type="text"
                   placeholder="Search tickers..."
                   value={tickerSearchQuery}
                   onChange={(e) => setTickerSearchQuery(e.target.value)}
                   className="w-full bg-[--color-bg--300] text-white px-4 py-2 rounded-lg border border-[--color-primary-purple] mb-4"
                 />

                {/* Category Filter Buttons */}
                <div className="flex gap-2">
                 <button
                   className={`ticker-filter-button flex-grow text-center cursor-pointer ${selectedTickerFilter === 'USDT' ? 'active' : ''}`}
                   onClick={() => setSelectedTickerFilter('USDT')}
                 >
                   USDT
                 </button>
                 <button
                   className={`ticker-filter-button flex-grow text-center cursor-pointer ${selectedTickerFilter === 'BTC' ? 'active' : ''}`}
                   onClick={() => setSelectedTickerFilter('BTC')}
                 >
                   BTC
                 </button>
                 <button
                   className={`ticker-filter-button flex-grow text-center cursor-pointer ${selectedTickerFilter === 'FAV' ? 'active' : ''}`}
                   onClick={() => setSelectedTickerFilter('FAV')}
                 >
                   FAV
                   {favorites.length > 0 && <span className="text-[--color-primary-yellow]">★</span>}
                 </button>
                </div>
            </div>

            {/* Ticker List */}
            <div className="cb p-4 rounded-lg flex-grow overflow-y-auto ticker-table-container">
              {tickersLoading && <p className="text-[--color-primary-silver] text-center">Loading tickers...</p>}
              {tickersError && <p className="text-red-500 text-center">Error: {tickersError}</p>}
              {!tickersLoading && !tickersError && (
                 <div>
                   {/* Header Row - Make sortable */}
                   <div className="flex justify-between items-center font-bold mb-2 border-b border-gray-700 pb-1 ticker-header">
                     <span className={`w-1/4 text-center cursor-pointer ${sortColumn === 'symbol' ? 'active' : ''}`} onClick={() => handleSort('symbol')}>Pair {sortColumn === 'symbol' && (sortOrder === 'asc' ? '▲' : '▼')}</span>
                     <span className={`w-1/4 text-center cursor-pointer ${sortColumn === 'lastPrice' ? 'active' : ''}`} onClick={() => handleSort('lastPrice')}>Price {sortColumn === 'lastPrice' && (sortOrder === 'asc' ? '▲' : '▼')}</span>
                     <span className={`w-1/4 text-center cursor-pointer ${sortColumn === 'priceChangePercent' ? 'active' : ''}`} onClick={() => handleSort('priceChangePercent')}>Change% {sortColumn === 'priceChangePercent' && (sortOrder === 'asc' ? '▲' : '▼')}</span>
                     <span className={`w-1/4 text-center cursor-pointer ${sortColumn === 'quoteVolume' ? 'active' : ''}`} onClick={() => handleSort('quoteVolume')}>Volume {sortColumn === 'quoteVolume' && (sortOrder === 'asc' ? '▲' : '▼')}</span>
                   </div>

                   {/* Ticker Rows - Filtered and searched */}
                   {filteredAndSortedTickers.map((ticker) => {
                     const priceChange = parseFloat(ticker.priceChangePercent.toString());
                     const isPositive = priceChange >= 0;
                       return (
                       <div
                         key={ticker.symbol}
                         className="ticker-row"
                         onClick={() => handleTickerClick(ticker.symbol)}
                         style={{ cursor: 'pointer' }}
                       >
                         <div className="ticker-cell">{ticker.symbol}</div>
                         <div className="ticker-cell">{formatTickerPrice(ticker)}</div>
                         <div className={`ticker-cell ${isPositive ? 'text-green' : 'text-red'}`}>
                           {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                         </div>
                         <div className="ticker-cell flex justify-end items-center gap-2">
                           <span>{formatVolume(ticker)}</span>
                         <span 
                             onClick={(e) => {
                               e.stopPropagation();
                               toggleFavorite(ticker.symbol);
                             }}
                             className="cursor-pointer"
                           >
                             <svg 
                               className={`w-4 h-4 ${favorites.includes(ticker.symbol) ? 'fill-[--color-primary-yellow]' : 'fill-gray-400 hover:fill-[--color-primary-yellow]'}`}
                               xmlns="http://www.w3.org/2000/svg" 
                               viewBox="0 0 24 24"
                             >
                               <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/>
                             </svg>
                         </span>
                         </div>
                       </div>
                     );
                   })}

                   {/* Message if no tickers found */}
                   {!tickersLoading && !tickersError && tickers.filter(ticker => {
                       // Same filtering logic as above to check if any tickers match
                        if (selectedTickerFilter === 'USDT') return ticker.symbol.endsWith('USDT');
                        if (selectedTickerFilter === 'BTC') return ticker.symbol.endsWith('BTC') && !ticker.symbol.endsWith('BTCST');
                       return true; // If filter is not USDT, BTC, or FAV, show all (implicitly ALL)
                     }).filter(ticker => {
                       const lowerCaseQuery = tickerSearchQuery.toLowerCase();
                       return ticker.symbol.toLowerCase().includes(lowerCaseQuery);
                     }).length === 0 && (
                       <p className="text-[--color-primary-silver] text-center mt-4">No tickers found matching your criteria.</p>
                   )}

                 </div>
              )}
            </div>

          </div>
          </div>
        )}

      {/* Order Book Overlay */}
      {showOrderBook && (
        <div className="order-book-overlay">
          <div className="order-book-content">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', marginTop: 0 }}>
              <div className="text-xl font-bold text-[--color-primary-silver]" style={{ marginTop: 0 }}>
                  Order Book: {selectedTicker ? selectedTicker.replace('USDT', '/USDT') : 'BTC/USDT'}
                </div>
              <button
                onClick={() => setShowOrderBook(false)}
                className="order-book-close"
                style={{ marginTop: 0, marginLeft: '16px' }}
              >
                Close
              </button>
            </div>
            {/* Search ticker input снова сразу под заголовком */}
            <div style={{ marginBottom: '4px' }}>
                <input
                  type="text"
                  className="order-book-search"
                  placeholder="Search ticker..."
                  value={searchQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchQuery(value);
                    filterOrderBookTickers(value);
                    setShowOrderBookDropdown(true);
                  }}
                  onFocus={() => {
                    if (searchQuery) {
                      filterOrderBookTickers(searchQuery);
                    }
                    setShowOrderBookDropdown(true);
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowOrderBookDropdown(false), 200);
                  }}
                />
                {showOrderBookDropdown && filteredOrderBookTickers.length > 0 && (
                  <div className="order-book-dropdown">
                    {filteredOrderBookTickers.map((ticker) => (
                      <div
                        key={ticker.symbol}
                        className="order-book-dropdown-item"
                        onClick={() => selectOrderBookTicker(ticker)}
                      >
                      {ticker.symbol.replace('USDT', '/USDT')} ({formatTickerPrice(ticker)})
                      </div>
                    ))}
                  </div>
                )}
              </div>

            {/* Sell Orders (Asks) */}
            <div className="order-book-section" style={{ marginBottom: '12px' }}>
              <div className="text-sm font-semibold text-red-500 mb-1">Sell Orders</div>
                <div className="order-book-header">
                  <div>Total (USDT)</div>
                  <div>Size (Coins)</div>
                  <div>Price (USDT)</div>
                </div>
              <div className="order-book-body" style={{ maxHeight: '135px', overflowY: 'auto' }}>
                  {(() => {
                    const maxValue = Math.max(...orderBook.asks.map(ask => ask.size * ask.price));
                  return orderBook.asks.slice(0, 25).map((ask, index) => {
                      const totalValue = ask.size * ask.price;
                      return (
                        <div
                          key={index}
                          className="order-book-row order-book-asks"
                          style={{ '--gradient-width': `${(totalValue / maxValue) * 100}%` } as OrderBookRowStyle}
                        >
                          <div>${totalValue.toFixed(2)}</div>
                          <div>{ask.size.toFixed(4)}</div>
                          <div className="text-red">{ask.price.toFixed(2)}</div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

            {/* Buy Orders (Bids) */}
            <div className="order-book-section">
              <div className="text-sm font-semibold text-green-500 mb-1">Buy Orders</div>
                <div className="order-book-header">
                  <div>Total (USDT)</div>
                  <div>Size (Coins)</div>
                  <div>Price (USDT)</div>
                </div>
              <div className="order-book-body" style={{ maxHeight: '135px', overflowY: 'auto' }}>
                  {(() => {
                    const maxValue = Math.max(...orderBook.bids.map(bid => bid.size * bid.price));
                  return orderBook.bids.slice(0, 25).map((bid, index) => {
                      const totalValue = bid.size * bid.price;
                      return (
                        <div
                          key={index}
                          className="order-book-row order-book-bids"
                          style={{ '--gradient-width': `${(totalValue / maxValue) * 100}%` } as OrderBookRowStyle}
                        >
                          <div>${totalValue.toFixed(2)}</div>
                          <div>{bid.size.toFixed(4)}</div>
                          <div className="text-green">{bid.price.toFixed(2)}</div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

          </div>
        </div>
      )}

      {/* Chart Screen Overlay */}
      {showChartScreen && (
        <div className="chart-screen-overlay">
          <div className="chart-screen-content">
            {/* Header for Chart Screen */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[--color-primary-silver]">Chart</h2>
              {/* Close Button */}
              <button onClick={toggleChartScreen} className="chart-screen-close">Close</button>
            </div>

            {/* Chart Content */}
            <div className="cb p-4 rounded-lg flex-grow" style={{ height: 'calc(100vh - 40px)' }}>
              <div id="chart_container" style={{ height: '100%', width: '100%', backgroundColor: 'var(--color-bg--300)' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Share Screen */}
      {showShareScreen && (
        <div className="share-screen-overlay">
          <div className="share-screen-content">
            <div className="share-screen-header">
              <h2 className="share-screen-title">Share Tickers</h2>
              <button className="share-screen-close" onClick={toggleShareScreen}>
                Close
              </button>
            </div>

            <div className="share-screen-tickers">
            <input
              type="text"
                className="share-screen-search compact-share-search"
              placeholder="Search tickers..."
              value={shareSearchQuery}
              onChange={(e) => setShareSearchQuery(e.target.value)}
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.95rem', marginBottom: '0.7rem', height: '36px', width: '100%', boxSizing: 'border-box', display: 'block' }}
            />
              <div className="share-screen-filters" style={{ display: 'flex', gap: '0.2rem', width: '100%' }}>
              <button
                className={`share-screen-filter ${shareAssetFilter === 'USDT' ? 'active' : ''}`}
                onClick={() => setShareAssetFilter('USDT')}
                  style={{ flex: 1 }}
              >
                USDT
              </button>
              <button
                className={`share-screen-filter ${shareAssetFilter === 'BTC' ? 'active' : ''}`}
                onClick={() => setShareAssetFilter('BTC')}
                  style={{ flex: 1 }}
              >
                BTC
              </button>
              <button
                className={`share-screen-filter ${shareAssetFilter === 'FAV' ? 'active' : ''}`}
                onClick={() => setShareAssetFilter('FAV')}
                  style={{ flex: 1 }}
              >
                FAV {favorites.length > 0 && <span className="text-[--color-primary-yellow]">★</span>}
              </button>
              </div>
            </div>

            <div className="share-screen-tickers">
              {tickersLoading && <p className="text-[--color-primary-silver] text-center">Loading tickers...</p>}
              {tickersError && <p className="text-red-500 text-center">Error: {tickersError}</p>}
              {!tickersLoading && !tickersError && (
                <div className="grid grid-cols-4 gap-2 max-h-[250px] overflow-y-auto overflow-x-hidden">
                  {filteredShareTickers.map((ticker) => (
                    <div
                      key={ticker.symbol}
                      onClick={() => toggleSelectedTicker(ticker.symbol)}
                      className={`share-screen-ticker${selectedTickers.includes(ticker.symbol) ? ' selected' : ''}`}
                    >
                      <div className="text-xs font-bold">{ticker.symbol.replace('USDT', '/USDT')}</div>
                      <div className={`${parseFloat(ticker.priceChangePercent.toString()) >= 0 ? 'text-green-500' : 'text-red-500'} ${selectedTickers.includes(ticker.symbol) ? 'text-white' : ''}`}>
                        {formatTickerPrice(ticker)}
                      </div>
                      <div className={`text-xs ${parseFloat(ticker.priceChangePercent.toString()) >= 0 ? 'text-green-500' : 'text-red-500'} ${selectedTickers.includes(ticker.symbol) ? 'text-white' : ''}`}>
                        {parseFloat(ticker.priceChangePercent.toString()) >= 0 ? '↑' : '↓'} {Math.abs(parseFloat(ticker.priceChangePercent.toString())).toFixed(2)}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-[--color-primary-silver]">
                Selected: {selectedTickers.length} tickers
              </div>
              <button
                className={`share-screen-share ${selectedTickers.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={shareMultipleTickers}
                disabled={selectedTickers.length === 0}
              >
                Share Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calculator Screen */}
      {showCalculator && (
        <div className="calculator-screen-overlay">
          <div className="calculator-screen-content">
            <div className="calculator-screen-header">
              <h2 className="calculator-screen-title">Calculator</h2>
              <button className="calculator-screen-close" onClick={toggleCalculator}>
                Close
              </button>
            </div>

            <div className="calculator-container">
              <div className="input-section bg-[--color-bg--500] rounded-lg p-2">
                <div className="grid grid-cols-1 gap-2">
                  {/* Coin Selection */}
                  <div className="form-group relative calculator-form-group">
                    <label className="block text-xs text-[--color-primary-silver]">Select Coin</label>
                    <input
                      type="text"
                      className="form-control bg-[--color-bg--300] text-white p-1.5 rounded w-full text-sm"
                      placeholder="Search coin..."
                      value={calculatorSearchQuery}
                      onChange={(e) => {
                        const value = e.target.value;
                        setCalculatorSearchQuery(value);
                        setShowCalculatorDropdown(true);
                      }}
                      onFocus={() => setShowCalculatorDropdown(true)}
                    />
                    
                    {/* Dropdown for filtered results */}
                    {showCalculatorDropdown && filteredCalculatorCoins.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-[--color-bg--300] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {filteredCalculatorCoins.map((ticker) => (
                          <div
                            key={ticker.symbol}
                            onClick={() => handleCalculatorCoinClick(ticker)}
                            className="p-2 hover:bg-[--color-primary-purple] cursor-pointer text-sm"
                          >
                            {ticker.symbol.replace('USDT', '/USDT')} ({formatTickerPrice(ticker)})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Initial Investment */}
                  <div className="form-group">
                    <label className="block text-xs text-[--color-primary-silver]">Initial Investment ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="form-control bg-[--color-bg--300] text-white p-1.5 rounded w-full text-sm"
                      placeholder="Enter amount..."
                      value={calculatorForm.investment || ''}
                      onChange={(e) => updateCalcSettings({ investment: parseFloat(e.target.value) || null })}
                    />
                  </div>

                  {/* Initial Coin Price */}
                  <div className="form-group">
                    <label className="block text-xs text-[--color-primary-silver]">Initial Coin Price</label>
                    <input
                      type="number"
                      min="0"
                      step="0.00000001"
                      className="form-control bg-[--color-bg--300] text-white p-1.5 rounded w-full text-sm"
                      placeholder="Enter price..."
                      value={calculatorForm.initialPrice || ''}
                      onChange={(e) => updateCalcSettings({ initialPrice: parseFloat(e.target.value) || null })}
                    />
                  </div>

                  {/* Projected Coin Price */}
                  <div className="form-group">
                    <label className="block text-xs text-[--color-primary-silver]">Projected Coin Price</label>
                    <input
                      type="number"
                      min="0"
                      step="0.00000001"
                      className="form-control bg-[--color-bg--300] text-white p-1.5 rounded w-full text-sm"
                      placeholder="Enter price..."
                      value={calculatorForm.projectedPrice || ''}
                      onChange={(e) => updateCalcSettings({ projectedPrice: parseFloat(e.target.value) || null })}
                    />
                  </div>

                  {/* Service Fee */}
                  <div className="form-group">
                    <label className="block text-xs text-[--color-primary-silver]">Service Fee (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      className="form-control bg-[--color-bg--300] text-white p-1.5 rounded w-full text-sm"
                      placeholder="Enter fee..."
                      value={calculatorForm.serviceFee || ''}
                      onChange={(e) => updateCalcSettings({ serviceFee: parseFloat(e.target.value) || null })}
                    />
                  </div>

                  {/* Tax Rate */}
                  <div className="form-group">
                    <label className="block text-xs text-[--color-primary-silver]">Tax (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      className="form-control bg-[--color-bg--300] text-white p-1.5 rounded w-full text-sm"
                      placeholder="Enter tax..."
                      value={calculatorForm.taxRate || ''}
                      onChange={(e) => updateCalcSettings({ taxRate: parseFloat(e.target.value) || null })}
                    />
                  </div>
                </div>
              </div>

              {/* Results Section */}
              {calculatorForm.investment && calculatorForm.initialPrice && calculatorForm.projectedPrice && (
                <div className="results-section bg-[--color-bg--500] rounded-lg p-2 mt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="result-item">
                      <span className="text-xs text-[--color-primary-silver]">Total Coins</span>
                      <span className="text-sm text-white">{(calculatorForm.investment / calculatorForm.initialPrice).toFixed(8)}</span>
                    </div>
                    <div className="result-item">
                      <span className="text-xs text-[--color-primary-silver]">Projected Subtotal</span>
                      <span className="text-sm text-white">${((calculatorForm.projectedPrice * (calculatorForm.investment / calculatorForm.initialPrice))).toFixed(2)}</span>
                    </div>
                    <div className="result-item">
                      <span className="text-xs text-[--color-primary-silver]">Projected Profit</span>
                      <span className="text-sm text-white">${((calculatorForm.projectedPrice * (calculatorForm.investment / calculatorForm.initialPrice)) - calculatorForm.investment).toFixed(2)}</span>
                    </div>
                    <div className="result-item">
                      <span className="text-xs text-[--color-primary-silver]">Fees</span>
                      <span className="text-sm text-white">${(calculatorForm.investment * (calculatorForm.serviceFee || 0) / 100).toFixed(2)}</span>
                    </div>
                    <div className="result-item">
                      <span className="text-xs text-[--color-primary-silver]">Taxes</span>
                      <span className="text-sm text-white">${(((calculatorForm.projectedPrice * (calculatorForm.investment / calculatorForm.initialPrice)) - calculatorForm.investment - (calculatorForm.investment * (calculatorForm.serviceFee || 0) / 100)) * (calculatorForm.taxRate || 0) / 100).toFixed(2)}</span>
                    </div>
                    <div className="result-item">
                      <span className="text-xs text-[--color-primary-silver]">Projected Total</span>
                      <span className="text-sm text-white">${(((calculatorForm.projectedPrice * (calculatorForm.investment / calculatorForm.initialPrice)) - calculatorForm.investment - (calculatorForm.investment * (calculatorForm.serviceFee || 0) / 100) - (((calculatorForm.projectedPrice * (calculatorForm.investment / calculatorForm.initialPrice)) - calculatorForm.investment - (calculatorForm.investment * (calculatorForm.serviceFee || 0) / 100)) * (calculatorForm.taxRate || 0) / 100))).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Modal */}
      {showPortfolio && (
        <div className="portfolio-screen-overlay">
          <div className="portfolio-screen-content">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Portfolio</h2>
              <button className="portfolio-screen-close" onClick={togglePortfolio}>
                Close
              </button>
            </div>

            {/* Summary-блок: grid с двумя колонками для ровного выравнивания */}
            <div ref={summaryPanelRef} className="mb-1 portfolio-summary-panel rounded-lg" style={{ position: 'relative', overflow: 'hidden' }}>
              <div className="portfolio-bubbles" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div className="summary-grid">
                  <div className="portfolio-summary-label">Total Investment:</div>
                  <div className="portfolio-summary-value">${totalInvestment.toFixed(2)}</div>
                  <div className="portfolio-summary-label">Current Value:</div>
                  <div className="portfolio-summary-value">${currentValue.toFixed(2)}</div>
                  <div className="portfolio-summary-label">Change %:</div>
                  <div className={`portfolio-summary-value ${totalProfitPercent >= 0 ? 'text-green' : 'text-red'}`}>{totalProfitPercent >= 0 ? '+' : ''}{totalProfitPercent.toFixed(2)}%</div>
                  <div className="portfolio-summary-label">Total Profit/Loss:</div>
                  <div className={`portfolio-summary-value ${totalProfit >= 0 ? 'text-green' : 'text-red'}`}>{totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)}</div>
                  <div className="portfolio-summary-label">Tickers:</div>
                  <div className="portfolio-summary-value">{uniqueCoinsCount}</div>
                </div>
              </div>
            </div>

            {/* Add Position Form */}
            <div className="cb bg-[--color-bg--300] rounded-lg p-4 mb-0 portfolio-form-section">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="form-group relative portfolio-form-group md:col-span-4" style={{display: 'flex', flexDirection: 'column'}}>
                  <label className="block text-xs text-[--color-primary-silver] mb-1">Search coin</label>
                <input
                  type="text"
                  className="portfolio-search"
                    placeholder="Search coin"
                  value={portfolioForm.searchQuery}
                    onChange={handlePortfolioSearchInput}
                    onFocus={() => setShowPortfolioDropdown(true)}
                    ref={portfolioSearchRef}
                />
                  {showPortfolioDropdown && filteredPortfolioCoins.length > 0 && (
                    <div
                      ref={portfolioDropdownRef}
                      className="absolute z-50 w-full mt-1 bg-[--color-bg--300] rounded-lg shadow-lg max-h-36 overflow-y-auto"
                    >
                    {filteredPortfolioCoins.map((ticker) => (
                      <div
                        key={ticker.symbol}
                        onClick={() => selectPortfolioCoin(ticker)}
                          className="p-2 hover:bg-[--color-primary-purple] cursor-pointer text-xs"
                        >
                          {ticker.pair} ({ticker.lastPrice})
                      </div>
                    ))}
                  </div>
                )}
              </div>
                <div>
                  <label className="block text-xs text-[--color-primary-silver] mb-1">Amount of coins</label>
                  <input
                    type="number"
                    className="amount-input"
                    placeholder="Amount"
                    value={portfolioForm.amount || ''}
                    onChange={(e) => setPortfolioForm({ ...portfolioForm, amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-[--color-primary-silver] mb-1">Buy price per coin</label>
                  <input
                    type="number"
                    className="buy-price-input"
                    placeholder="Buy price"
                    value={portfolioForm.buyPrice || ''}
                    onChange={(e) => setPortfolioForm({ ...portfolioForm, buyPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="md:col-span-4 col-span-1">
                  <button
                    className="w-full portfolio-add-btn bg-[--color-primary-blue] text-white rounded"
                    onClick={addPortfolioPosition}
                  >
                    Add Position
                  </button>
                </div>
              </div>
            </div>

            {/* Portfolio Positions List */}
            <div className="text-lg font-semibold text-white" style={{ marginTop: '-18px' }}>Positions</div>
            <div className="cb bg-[--color-bg--300] rounded-lg p-4 portfolio-positions-container border-2" style={{ minHeight: 220, maxHeight: 420, overflowY: 'auto', borderColor: 'rgba(255,255,255,0.3)' }}>
              {portfolioPositions.length === 0 && (
                <div className="text-center text-[--color-primary-silver]">No positions yet.</div>
              )}
              {portfolioPositions.length > 0 && portfolioPositions.map((position) => (
                <div key={position.id} className="flex items-center justify-between py-2 border-b border-[--color-bg--500] last:border-b-0">
                  <div className="flex flex-col gap-1">
                    <div className="font-bold text-white">{position.pair}</div>
                    <div className="text-xs text-[--color-primary-silver]">Amount: {position.amount} | Buy: ${position.buyPrice.toFixed(2)}</div>
                    </div>
                  <div className="text-right">
                    <div className={position.profit >= 0 ? 'text-green font-bold' : 'text-red font-bold'}>
                      {position.profit >= 0 ? '+' : ''}${position.profit.toFixed(2)}
                  </div>
                    <div className={position.profitPercent >= 0 ? 'text-green text-xs' : 'text-red text-xs'}>
                      {position.profitPercent >= 0 ? '+' : ''}{position.profitPercent.toFixed(2)}%
                    </div>
                  </div>
                  <button onClick={() => removePortfolioPosition(position.id)} className="ml-2 text-red-500 hover:text-red-700 text-sm">✕</button>
                </div>
              ))}
            </div>
          </div>
          </div>
        )}

      {/* Bottom Navigation Bar from index1.html - Restored */}
      <div className="fixed bottom-0 left-0 right-0 bg-[--color-primary-black] border-t-2 border-[--color-primary-purple] z-[150] py-3">
        <div className="container mx-auto flex justify-center">
          <BubbleButton
            onClick={handleChartClick}
            className="nav-button-content bg-[--color-primary-blue] text-white rounded font-rajdhani"
          >
            Chart
          </BubbleButton>
          <BubbleButton 
            onClick={toggleTickersScreen}
            className="nav-button-content bg-[--color-primary-blue] text-white rounded font-rajdhani"
          >
            Tickers
          </BubbleButton>
          <BubbleButton 
            onClick={handleOrderBookClick}
            className="nav-button-content bg-[--color-primary-blue] text-white rounded font-rajdhani"
          >
            Order Book
          </BubbleButton>
          <BubbleButton 
            onClick={handleShareClick}
            className="nav-button-content bg-[--color-primary-blue] text-white rounded font-rajdhani"
          >
            Share
          </BubbleButton>
          <BubbleButton 
            onClick={handleCalculatorClick}
            className="nav-button-content bg-[--color-primary-blue] text-white rounded font-rajdhani"
          >
            Calculator
          </BubbleButton>
          <BubbleButton 
            onClick={handlePortfolioClick}
            className="nav-button-content bg-[--color-primary-blue] text-white rounded font-rajdhani"
          >
            Portfolio
          </BubbleButton>
        </div>
      </div>

      {/* Mempool Screen */}
      {showMempoolScreen && (
        <div className="mempool-screen-overlay">
          <div className="mempool-screen-content">
            <div className="mempool-screen-header">
              <button className="mempool-screen-close close-button" onClick={toggleMempoolScreen}>
                Close
              </button>
              <div className="mempool-screen-title">Mempool</div>
            </div>

            <div className="mempool-content">
              {/* Network Selection Buttons */}
              <div className="mempool-network-buttons">
                <button
                  className={`mempool-network-button ${selectedNetwork === 'BTC' ? 'active' : ''}`}
                  onClick={() => setSelectedNetwork('BTC')}
                >
                  BTC
                </button>
                <button
                  className={`mempool-network-button ${selectedNetwork === 'USDT' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedNetwork('USDT');
                    setShowUsdtScreen(true);
                    setShowMempoolScreen(false);
                    setSearchResults({ type: null, data: null }); // Очищаем результаты поиска
                    setAddressSearch(''); // Очищаем поле поиска адреса
                    setTxSearch(''); // Очищаем поле поиска транзакции
                  }}
                >
                  USDT
                </button>
                <button
                  className={`mempool-network-button ${selectedNetwork === 'TON' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedNetwork('TON');
                    setShowTonScreen(true);
                    setShowMempoolScreen(false);
                    setSearchResults({ type: null, data: null }); // Очищаем результаты поиска
                    setAddressSearch(''); // Очищаем поле поиска адреса
                    setTxSearch(''); // Очищаем поле поиска транзакции
                  }}
                >
                  TON
                </button>
              </div>

              {/* Search Section */}
              <div className="mempool-search">
                <div className="search-group">
                  <input
                    type="text"
                    placeholder="Search by address..."
                    className="search-input"
                    value={addressSearch}
                    onChange={(e) => setAddressSearch(e.target.value)}
                  />
                  <button 
                    className="search-button"
                    onClick={() => searchByAddress(addressSearch)}
                  >
                    Search
                  </button>
                </div>
                <div className="search-group">
                  <input
                    type="text"
                    placeholder="Search by transaction hash..."
                    className="search-input"
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                  />
                  <button 
                    className="search-button"
                    onClick={() => searchByTransaction(txSearch)}
                  >
                    Search
                  </button>
                </div>
              </div>

              {/* Search Results */}
              <SearchResults />

              {/* Stats Section */}
              <div className="mempool-stats">
                {!mempoolStatsLoading ? (
                  <>
                    <div className="stat">
                      <div className="stat-label">Current Hashrate</div>
                      <div className="stat-value">
                        {formatHashrate(mempoolStats?.hashrate ?? 0)}
                      </div>
                    </div>
                    <div className="stat">
                      <div className="stat-label">Current Difficulty</div>
                      <div className="stat-value">
                        {formatDifficulty(mempoolStats?.difficulty ?? 0)}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="loading-spinner" />
                )}
              </div>

              {/* Latest Blocks */}
              <div className="mempool-blocks">
                <h3 className="mempool-blocks-title">Latest Blocks</h3>
                <div className="mempool-blocks-header">
                  <div className="mempool-block-cell">Height</div>
                  <div className="mempool-block-cell">Time</div>
                  <div className="mempool-block-cell">Size</div>
                  <div className="mempool-block-cell">Tx Count</div>
                </div>
                <div className="mempool-blocks-body">
                  {mempoolBlocksLoading && !mempoolDataLoaded ? (
                    <div className="mempool-loading">Loading blocks...</div>
                  ) : latestBlocks.length > 0 ? (
                    latestBlocks.map((block) => (
                      <div key={block.id} className="mempool-block-row">
                        <div className="mempool-block-cell">{block.height}</div>
                        <div className="mempool-block-cell">
                          {formatTimeAgo(block.timestamp)}
                        </div>
                        <div className="mempool-block-cell">{formatBytes(block.size)}</div>
                        <div className="mempool-block-cell">{block.tx_count}</div>
                      </div>
                    ))
                  ) : (
                    <div className="mempool-loading">No blocks available</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USDT Screen */}
      {showUsdtScreen && (
        <div className="mempool-screen-overlay">
          <div className="mempool-screen-content">
            <div className="mempool-screen-header">
              <button className="mempool-screen-close close-button" onClick={() => {
                setShowUsdtScreen(false);
                setShowMempoolScreen(true);
              }}>
                Close
              </button>
              <div className="mempool-screen-title">USDT Network</div>
            </div>

            <div className="mempool-content">
              {/* Network Selection Buttons */}
              <div className="mempool-network-buttons">
                <button
                  className={`mempool-network-button ${selectedNetwork === 'BTC' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedNetwork('BTC');
                    setShowMempoolScreen(true);
                    setShowUsdtScreen(false);
                    setSearchResults({ type: null, data: null }); // Очищаем результаты поиска
                    setAddressSearch(''); // Очищаем поле поиска адреса
                    setTxSearch(''); // Очищаем поле поиска транзакции
                  }}
                >
                  BTC
                </button>
                <button
                  className={`mempool-network-button ${selectedNetwork === 'USDT' ? 'active' : ''}`}
                  onClick={() => setSelectedNetwork('USDT')}
                >
                  USDT
                </button>
                <button
                  className={`mempool-network-button ${selectedNetwork === 'TON' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedNetwork('TON');
                    setShowTonScreen(true);
                    setShowUsdtScreen(false);
                    setSearchResults({ type: null, data: null }); // Очищаем результаты поиска
                    setAddressSearch(''); // Очищаем поле поиска адреса
                    setTxSearch(''); // Очищаем поле поиска транзакции
                  }}
                >
                  TON
                </button>
              </div>

              {/* USDT Content */}
              <div className="mempool-search">
                {/* USDT Address Lookup (TRC20) */}
                <div className="search-group">
                  <input
                    type="text"
                    placeholder="USDT Address Lookup (TRC20)..."
                    className="search-input"
                    value={addressSearch}
                    onChange={(e) => setAddressSearch(e.target.value)}
                  />
                  <button 
                    className="search-button"
                    onClick={() => searchUsdtAddress(addressSearch)}
                  >
                    Search
                  </button>
                </div>
                
                {/* USDT Transactions Lookup (TRC20) */}
                <div className="search-group">
                  <input
                    type="text"
                    placeholder="USDT Transaction Hash (TRC20)..."
                    className="search-input"
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                  />
                  <button 
                    className="search-button"
                    onClick={() => searchUsdtTransaction(txSearch)}
                  >
                    Search
                  </button>
                </div>
              </div>

              {/* Search Results */}
              <SearchResults />

              {/* Убрали блок USDT Network / TRC20 / Network Status / Active */}
            </div>
          </div>
        </div>
      )}

      {/* TON Screen */}
      {showTonScreen && (
        <div className="mempool-screen-overlay">
          <div className="mempool-screen-content">
            <div className="mempool-screen-header">
              <button className="mempool-screen-close close-button" onClick={() => {
                setShowTonScreen(false);
                setShowMempoolScreen(true);
              }}>
                Close
              </button>
              <div className="mempool-screen-title">TON Network</div>
            </div>

            <div className="mempool-content">
              {/* Network Selection Buttons */}
              <div className="mempool-network-buttons">
                <button
                  className={`mempool-network-button ${selectedNetwork === 'BTC' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedNetwork('BTC');
                    setShowMempoolScreen(true);
                    setShowTonScreen(false);
                    setSearchResults({ type: null, data: null }); // Очищаем результаты поиска
                    setAddressSearch(''); // Очищаем поле поиска адреса
                    setTxSearch(''); // Очищаем поле поиска транзакции
                  }}
                >
                  BTC
                </button>
                <button
                  className={`mempool-network-button ${selectedNetwork === 'USDT' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedNetwork('USDT');
                    setShowUsdtScreen(true);
                    setShowTonScreen(false);
                    setSearchResults({ type: null, data: null }); // Очищаем результаты поиска
                    setAddressSearch(''); // Очищаем поле поиска адреса
                    setTxSearch(''); // Очищаем поле поиска транзакции
                  }}
                >
                  USDT
                </button>
                <button
                  className={`mempool-network-button ${selectedNetwork === 'TON' ? 'active' : ''}`}
                  onClick={() => setSelectedNetwork('TON')}
                >
                  TON
                </button>
              </div>

              {/* TON Content */}
              <div className="mempool-search">
                <div className="search-group">
                  <input
                    type="text"
                    placeholder="Search TON address..."
                    className="search-input"
                    value={addressSearch}
                    onChange={(e) => setAddressSearch(e.target.value)}
                  />
                  <button 
                    className="search-button"
                    onClick={() => searchTonAddress(addressSearch)}
                  >
                    Search
                  </button>
                </div>
              </div>

              {/* Search Results */}
              <SearchResults />

              {/* Убрали блок TON Network / Coming Soon */}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;