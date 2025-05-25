import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import WebApp from '@twa-dev/sdk';
import App from './App.tsx';
import './index.css';

// Initialize Telegram WebApp
WebApp.ready();

// Обновлен URL манифеста на ваш GitHub Pages адрес
const manifestUrl = "https://LilCannaVert.github.io/BansaiTest/tonconnect-manifest.json";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <App />
    </TonConnectUIProvider>
  </StrictMode>
);