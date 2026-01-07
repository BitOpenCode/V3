import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import WebApp from '@twa-dev/sdk';

import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { 
  Home, 
  Games, 
  Avatars, 
  Menu, 
  Tickers, 
  News,
  Calculator,
  OrderBook,
  Portfolio,
  Wallet,
  Mempool,
  Chart,
  Share
} from './pages';
import SpaceShip from './pages/Games/SpaceShip';
import RunRoad from './pages/Games/RunRoad';
import HugMe from './pages/Games/HugMe';

import './index.css';
import './App.css';
import './styles/themes.css';

// Initialize Telegram WebApp
WebApp.ready();

// Initialize theme on app start
const savedTheme = localStorage.getItem('settings-storage');
if (savedTheme) {
  try {
    const settings = JSON.parse(savedTheme);
    if (settings.state?.theme) {
      document.body.className = document.body.className.replace(/theme-\w+/g, '');
      document.body.classList.add(`theme-${settings.state.theme}`);
    }
  } catch (e) {
    // Fallback to default theme
    document.body.classList.add('theme-bubbles');
  }
} else {
  document.body.classList.add('theme-bubbles');
}

// Используем рабочий URL манифеста
const manifestUrl = "https://bitopencode.github.io/EgorWorld/tonconnect-manifest.json";

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
      retry: 2,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TonConnectUIProvider manifestUrl={manifestUrl}>
          <HashRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                {/* Main routes */}
                <Route index element={<Home />} />
                <Route path="games" element={<Games />} />
                <Route path="games/spaceship" element={<SpaceShip />} />
                <Route path="games/runroad" element={<RunRoad />} />
                <Route path="games/hugme" element={<HugMe />} />
                <Route path="avatars" element={<Avatars />} />
                <Route path="menu" element={<Menu />} />
                
                {/* Functional pages */}
                <Route path="tickers" element={<Tickers />} />
                <Route path="news" element={<News />} />
                <Route path="calculator" element={<Calculator />} />
                <Route path="orderbook" element={<OrderBook />} />
                <Route path="portfolio" element={<Portfolio />} />
                <Route path="wallet" element={<Wallet />} />
                <Route path="mempool" element={<Mempool />} />
                <Route path="chart" element={<Chart />} />
                <Route path="share" element={<Share />} />
                
                {/* Fallback */}
                <Route path="*" element={<Home />} />
              </Route>
            </Routes>
          </HashRouter>
          <Toaster 
            position="top-center"
            toastOptions={{
              style: {
                background: '#1e1e1e',
                color: '#c0c0c0',
                border: '1px solid #8a2be2',
              },
            }}
          />
        </TonConnectUIProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
);
