import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import WebApp from '@twa-dev/sdk';
import TradeRoom from './pages/TradeRoom/TradeRoom';
import Profile from './pages/Profile/Profile';
import Results from './pages/Results/Results';
import Progress from './pages/Progress/Progress';

import { WalletActivationProvider } from './context/WalletActivation';
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

import './index.css';
import './App.css';
import './styles/themes.css';

WebApp.ready();
WebApp.expand();

let maxAppHeight = 0;
const setAppHeight = () => {
  const height = WebApp.viewportStableHeight || window.innerHeight;
  if (height > maxAppHeight) {
    maxAppHeight = height;
    document.documentElement.style.setProperty('--app-height', `${maxAppHeight}px`);
    // Let nav button labels (BubbleButton) know layout may have settled,
    // since Telegram's viewport can finish expanding after their own
    // initial fit-to-width measurement.
    window.dispatchEvent(new Event('resize'));
  }
};
setAppHeight();
WebApp.onEvent('viewportChanged', setAppHeight);
window.addEventListener('resize', setAppHeight);
window.addEventListener('orientationchange', () => {
  maxAppHeight = 0;
  setAppHeight();
});

setTimeout(setAppHeight, 300);
setTimeout(setAppHeight, 1000);

const savedTheme = localStorage.getItem('settings-storage');
if (savedTheme) {
  try {
    const settings = JSON.parse(savedTheme);
    if (settings.state?.theme) {
      document.body.className = document.body.className.replace(/theme-\w+/g, '');
      document.body.classList.add(`theme-${settings.state.theme}`);
    }
  } catch (e) {
    document.body.classList.add('theme-space');
  }
} else {
  document.body.classList.add('theme-space');
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, 
      retry: 2,
    },
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

console.log('React app starting...');

try {
  createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <WalletActivationProvider>
          <>
            <HashRouter>
              <Routes>
                <Route path="/" element={<Layout />}>
                  {/* Main routes */}
                  <Route index element={<Home />} />
                  <Route path="games" element={<Games />} />
                  <Route path="games/spaceship" element={<SpaceShip />} />
                  <Route path="games/runroad" element={<RunRoad />} />
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

                  {/* 3D Trade Room */}
                  <Route path="trade-room" element={<TradeRoom />} />

                  {/* Profile pages */}
                  <Route path="profile" element={<Profile />} />
                  <Route path="results" element={<Results />} />
                  <Route path="progress" element={<Progress />} />

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
          </>
        </WalletActivationProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
  );
} catch (error) {
  console.error('Failed to render app:', error);
  rootElement.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #1e1e1e;
      color: #ff0000;
      font-family: Arial, sans-serif;
      padding: 20px;
      text-align: center;
    ">
      <div>
        <h1>⚠️ Application Error</h1>
        <p>Failed to start the application.</p>
        <pre style="background: #2e2e2e; padding: 10px; border-radius: 5px; margin-top: 20px; text-align: left; overflow: auto;">
          ${error instanceof Error ? error.message : String(error)}
          ${error instanceof Error ? '\n\n' + error.stack : ''}
        </pre>
      </div>
    </div>
  `;
}