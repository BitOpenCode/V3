import React, { useEffect, useRef, memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchTickers } from '../../services/api';
import { useTranslation } from '../../hooks/useTranslation';
import './Chart.css';

type ChartMode = 'advanced' | 'overview' | 'web3' | 'summary';

/** Пары без графика в TradingView — исключаем из подборки. */
const EXCLUDED_CHART_SYMBOLS = new Set([
  'EOS', 'NULS', 'WAVES', 'ONG', 'XMR', 'OMG', 'MITH', 'MATIC', 'FTM', 'GTO',
  'COCOS', 'TOMO', 'PERL', 'MFT', 'KEY', 'DOCK', 'BUSD', 'BEAM', 'REN', 'CTX',
  'TROY', 'VITE', 'DREP', 'TCT', 'WRX', 'BTS', 'LTO', 'AION', 'STPT', 'WTC',
  'BTCUP', 'BTCDOWN', 'STMX', 'REP', 'PNT', 'ETHUP', 'ETHDOWN', 'ADAUP', 'ADADOWN',
  'LINKUP', 'LINKDOWN', 'GBP', 'MKR', 'BNBUP', 'BNBDOWN', 'AUD', 'BAL', 'BLZ',
  'IRIS', 'KMD', 'SRM', 'ANT', 'OCEAN', 'WNXM', 'YFI', 'TRXUP', 'TRXDOWN',
  'XRPUP', 'XRPDOWN', 'DOTUP', 'DOTDOWN',
  'WING', 'NBS', 'HNT', 'FLM', 'ORN', 'ALPHA', 'AKRO', 'HARD', 'DNT', 'UNFI',
  'XEM', 'REEF', 'BTCS', 'FIRO', 'LIT', 'BADGER', 'FIS', 'LINA', 'PERP', 'AUTO',
  'BTG', 'MIR', 'BAKE', 'BURGER', 'POLS', 'MDX', 'TORN', 'ERN', 'KLAY', 'BOND',
  'CLV', 'TVK', 'ALPACA', 'FOR',
  'TRIBE', 'ELF', 'POLY', 'VIDT', 'FRONT',
  'CVP', 'BETA', 'DAR', 'BNX', 'KP3R', 'VGX', 'PLAU', 'RNDR', 'MCU', 'FXS',
  'VOXEL', 'OOKI', 'LOKA', 'ANC', 'NBT', 'KDA', 'BSW', 'MULTI', 'MOB', 'REI',
  'GAL', 'EXP', 'LEVER', 'NEBL', 'HIFI', 'PROS', 'AGIX', 'VIB', 'AMB', 'BETH',
  'UFT', 'LOOM', 'OAX', 'AERGO', 'AST', 'SNT', 'COMBO', 'CREAM', 'GFT', 'PDA',
  'OMNI',
]);

/* ========== 1. Advanced — один полноэкранный график ========== */
function ChartViewAdvanced() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    const root = container.current;
    root.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      allow_symbol_change: true,
      calendar: false,
      details: false,
      hide_side_toolbar: false,
      hide_top_toolbar: false,
      hide_legend: false,
      hide_volume: true,
      hotlist: false,
      interval: 'W',
      locale: 'en',
      save_image: true,
      style: '1',
      symbol: 'KRAKEN:BTCUSDT',
      theme: 'dark',
      timezone: 'Etc/UTC',
      backgroundColor: '#0F0F0F',
      gridColor: 'rgba(242, 242, 242, 0.06)',
      watchlist: [],
      withdateranges: true,
      compareSymbols: [],
      studies: [],
      autosize: true,
    });
    root.appendChild(script);
    return () => { root.innerHTML = ''; };
  }, []);

  return (
    <div className="tradingview-widget-container chart-view-advanced" ref={container}>
      <div className="tradingview-widget-container__widget" style={{ height: '100%', width: '100%' }} />
    </div>
  );
}

/* ========== 2. Overview ========== */
function ChartViewOverview() {
  const container = useRef<HTMLDivElement>(null);
  const { data: tickers = [] } = useQuery({ queryKey: ['tickers'], queryFn: fetchTickers, staleTime: 60000 });
  const symbols = tickers
    .filter((t) => t.symbol.endsWith('USDT') && !EXCLUDED_CHART_SYMBOLS.has(t.symbol.replace('USDT', '')))
    .map((t) => [`BINANCE:${t.symbol}|ALL|XTVCUSDT`]);

  useEffect(() => {
    if (!container.current || symbols.length === 0) return;
    const root = container.current;
    const oldScript = root.querySelector('script[src*="symbol-overview"]');
    if (oldScript) oldScript.remove();
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      lineWidth: 2,
      lineType: 0,
      chartType: 'bars',
      showVolume: false,
      fontColor: 'rgb(106, 109, 120)',
      gridLineColor: 'rgba(242, 242, 242, 0.06)',
      volumeUpColor: 'rgba(34, 171, 148, 0.5)',
      volumeDownColor: 'rgba(247, 82, 95, 0.5)',
      backgroundColor: '#0F0F0F',
      widgetFontColor: '#DBDBDB',
      upColor: '#22ab94',
      downColor: '#f7525f',
      borderUpColor: '#22ab94',
      borderDownColor: '#f7525f',
      wickUpColor: '#22ab94',
      wickDownColor: '#f7525f',
      colorTheme: 'dark',
      isTransparent: false,
      locale: 'en',
      chartOnly: false,
      scalePosition: 'right',
      scaleMode: 'Normal',
      fontFamily: '-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif',
      valuesTracking: '1',
      changeMode: 'price-and-percent',
      symbols,
      dateRanges: ['1d|240', '1w|1D', '3m|240', 'all|1M'],
      fontSize: '10',
      headerFontSize: 'medium',
      autosize: true,
      dateFormat: 'dd-MM-yy',
      width: '100%',
      height: '100%',
      noTimeScale: false,
      hideDateRanges: true,
      showMA: false,
      hideMarketStatus: false,
      hideSymbolLogo: false,
      save_image: true,
      style: '1',
      disabled_features: ['widget_logo'],
    });
    root.appendChild(script);
  }, [symbols.join(',')]);

  return (
    <div className="tradingview-widget-container chart-view-overview" ref={container}>
      <div className="tradingview-widget-container__widget" />
    </div>
  );
}

/* ========== 3. Summary ========== */
function ChartViewSummary() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    const root = container.current;
    root.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: 'dark',
      dateRange: '12M',
      locale: 'en',
      largeChartUrl: '',
      isTransparent: false,
      showFloatingTooltip: false,
      plotLineColorGrowing: 'rgba(76, 175, 80, 1)',
      plotLineColorFalling: 'rgba(242, 54, 69, 1)',
      gridLineColor: 'rgba(240, 243, 250, 0)',
      scaleFontColor: '#DBDBDB',
      belowLineFillColorGrowing: 'rgba(41, 98, 255, 0.12)',
      belowLineFillColorFalling: 'rgba(41, 98, 255, 0.12)',
      belowLineFillColorGrowingBottom: 'rgba(41, 98, 255, 0)',
      belowLineFillColorFallingBottom: 'rgba(41, 98, 255, 0)',
      symbolActiveColor: 'rgba(41, 98, 255, 0.12)',
      tabs: [
        {
          title: 'Indices',
          symbols: [
            { s: 'FOREXCOM:SPXUSD', d: 'S&P 500 Index' },
            { s: 'FOREXCOM:NSXUSD', d: 'US 100 Cash CFD' },
            { s: 'FOREXCOM:DJI', d: 'Dow Jones Industrial Average Index' },
            { s: 'INDEX:NKY', d: 'Japan 225' },
            { s: 'INDEX:DEU40', d: 'DAX Index' },
            { s: 'FOREXCOM:UKXGBP', d: 'FTSE 100 Index' },
          ],
          originalTitle: 'Indices',
        },
        {
          title: 'Futures',
          symbols: [
            { s: 'BMFBOVESPA:ISP1!', d: 'S&P 500' },
            { s: 'BMFBOVESPA:EUR1!', d: 'Euro' },
            { s: 'CMCMARKETS:GOLD', d: 'Gold' },
            { s: 'PYTH:WTI3!', d: 'WTI Crude Oil' },
          ],
          originalTitle: 'Futures',
        },
        {
          title: 'Bonds',
          symbols: [
            { s: 'EUREX:FGBL1!', d: 'Euro Bund' },
            { s: 'EUREX:FBTP1!', d: 'Euro BTP' },
            { s: 'EUREX:FGBM1!', d: 'Euro BOBL' },
            { s: 'TVC:US10Y', d: 'US 10Y GB', logoid: 'country/US' },
            { s: 'TVC:US05Y', d: 'US 5Y GB', logoid: 'country/US' },
            { s: 'TVC:CN02Y', d: 'China 2Y GB', logoid: 'country/CN' },
          ],
          originalTitle: 'Bonds',
        },
        {
          title: 'Forex',
          symbols: [
            { s: 'FX:EURUSD', d: 'EUR to USD' },
            { s: 'FX:GBPUSD', d: 'GBP to USD' },
            { s: 'FX:USDJPY', d: 'USD to JPY' },
            { s: 'FX:USDCHF', d: 'USD to CHF' },
            { s: 'FX:AUDUSD', d: 'AUD to USD' },
            { s: 'FX:USDCAD', d: 'USD to CAD' },
          ],
          originalTitle: 'Forex',
        },
        {
          title: 'Crypto',
          symbols: [
            { s: 'BINANCE:BTCUSDT', d: 'BTCUSDT', 'base-currency-logoid': 'crypto/XTVCBTC', 'currency-logoid': 'crypto/XTVCUSDT' },
            { s: 'BINANCE:ETHUSDT', d: 'ETHUSDT', 'base-currency-logoid': 'crypto/XTVCETH', 'currency-logoid': 'crypto/XTVCUSDT' },
            { s: 'CRYPTOCAP:TOTAL', d: 'MCAP', logoid: 'crypto-total-market-cap', 'currency-logoid': 'country/US' },
          ],
        },
      ],
      support_host: 'https://www.tradingview.com',
      backgroundColor: '#0f0f0f',
      width: '100%',
      height: '100%',
      showSymbolLogo: true,
      showChart: true,
    });
    root.appendChild(script);
    return () => { root.innerHTML = ''; };
  }, []);

  return (
    <div className="tradingview-widget-container chart-view-summary" ref={container}>
      <div className="tradingview-widget-container__widget" />
    </div>
  );
}

/* ========== 4. Web3 ========== */
function ChartViewWeb3() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    const root = container.current;
    root.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-screener.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      defaultColumn: 'overview',
      screener_type: 'crypto_mkt',
      displayCurrency: 'USD',
      colorTheme: 'dark',
      isTransparent: false,
      largeChartUrl: '',
      locale: 'en',
      width: '100%',
      height: 550,
    });
    root.appendChild(script);

    const setSandboxOnIframe = () => {
      const iframe = root.querySelector('iframe');
      if (iframe && !iframe.hasAttribute('data-sandbox-set')) {
        iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
        iframe.setAttribute('data-sandbox-set', '1');
      }
    };
    setSandboxOnIframe();
    const observer = new MutationObserver(setSandboxOnIframe);
    observer.observe(root, { childList: true, subtree: true });
    const t = setTimeout(setSandboxOnIframe, 2000);

    return () => {
      clearTimeout(t);
      observer.disconnect();
      root.innerHTML = '';
    };
  }, []);

  return (
    <div className="tradingview-widget-container chart-view-web3" ref={container}>
      <div className="tradingview-widget-container__widget" />
    </div>
  );
}

/* ========== Страница Chart ========== */
const Chart: React.FC = () => {
  const navigate = useNavigate();
  const [chartMode, setChartMode] = useState<ChartMode>('overview');
  const { t } = useTranslation();

  const modes: { id: ChartMode; labelKey: string }[] = [
    { id: 'advanced', labelKey: 'advanced' },
    { id: 'overview', labelKey: 'overview' },
    { id: 'web3', labelKey: 'web3' },
    { id: 'summary', labelKey: 'summary' },
  ];

  return (
    <div className="chart-page">
      <div className="chart-toolbar">
        {modes.map(({ id, labelKey }) => (
          <button
            key={id}
            type="button"
            className={`nav-button chart-mode-btn ${chartMode === id ? 'chart-mode-btn--active' : ''}`}
            onClick={() => setChartMode(id)}
          >
            {t(labelKey)}
          </button>
        ))}
        <button onClick={() => navigate('/')} className="close-button">
          {t('close')}
        </button>
      </div>
      <div className="chart-content">
        {chartMode === 'advanced' && <ChartViewAdvanced key="advanced" />}
        {chartMode === 'overview' && <ChartViewOverview key="overview" />}
        {chartMode === 'web3' && <ChartViewWeb3 key="web3" />}
        {chartMode === 'summary' && <ChartViewSummary key="summary" />}
      </div>
    </div>
  );
};

export default memo(Chart);