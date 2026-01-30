import React, { useEffect, useRef, memo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTickers } from '../../services/api';
import './Chart.css';

type ChartMode = 'advanced' | 'overview' | 'market' | 'web3' | 'summary';

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

/* ========== 1. Advanced — один полноэкранный график (advanced-chart), без подписи ========== */
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

/* ========== 2. Overview — текущий symbol-overview (все пары Binance USDT) ========== */
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

/* Скрыть подпись "Market summary by TradingView" внутри Shadow DOM виджета tv-market-summary */
function hideMarketSummaryBranding(container: HTMLElement) {
  const widget = container.querySelector('tv-market-summary');
  if (!widget?.shadowRoot) return;
  const sr = widget.shadowRoot;

  /* Не скрываем все ссылки на tradingview — иначе пропадают кнопки Gainers/Losers/Active. Скрываем только подпись по тексту ниже. */
  if (!sr.querySelector('style[data-hide-branding]')) {
    const sheet = document.createElement('style');
    sheet.setAttribute('data-hide-branding', 'true');
    sheet.textContent = `
      [class*="trademark"], [class*="widget-logo"], [class*="footer"],
      [class*="copyright"], [class*="branding"], [class*="attribution"] { display: none !important; }
    `;
    sr.appendChild(sheet);
  }

  const walk = (root: DocumentFragment | Element) => {
    root.querySelectorAll('*').forEach((el) => {
      const text = (el as HTMLElement).innerText?.trim() || el.textContent?.trim() || '';
      const lower = text.toLowerCase();
      if (lower.includes('market summary') && lower.includes('tradingview')) {
        const target = el.tagName === 'A' ? el : (el.closest('a') || el);
        (target as HTMLElement).style.setProperty('display', 'none', 'important');
      }
    });
  };
  walk(sr);
}

/* ========== 4. Market — tv-market-summary direction="horizontal" (как в примере) ========== */
function ChartViewMarket() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = container.current;
    if (!root) return;

    if (!document.querySelector('script[src*="tv-market-summary"]')) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://widgets.tradingview-widget.com/w/en/tv-market-summary.js';
      document.head.appendChild(script);
    }

    root.innerHTML = '';
    const widget = document.createElement('tv-market-summary');
    widget.setAttribute('layout-mode', 'grid');
    widget.setAttribute('time-frame', '7D');
    root.appendChild(widget);

    const hideBranding = () => {
      try {
        hideMarketSummaryBranding(root);
      } catch {
        // ignore
      }
    };
    hideBranding();
    const t1 = setTimeout(hideBranding, 800);
    const t2 = setTimeout(hideBranding, 2000);
    const observer = new MutationObserver(hideBranding);
    observer.observe(root, { childList: true, subtree: true });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      observer.disconnect();
      root.innerHTML = '';
    };
  }, []);

  return (
    <div className="tradingview-widget-container chart-view-market" ref={container} />
  );
}

/* ========== 5. Summary — market-overview с вкладками, без подписи ========== */
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

/* ========== Web3 — Crypto Screener (embed-widget-screener) ========== */
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

    /* После создания виджета TradingView вставляет iframe. sandbox без allow-top-navigation
       блокирует переход в новую вкладку/окно; скролл и отображение сохраняются.
       Навигация внутри iframe (клик по монете) может блокироваться с allow-scripts без allow-same-origin,
       но тогда виджет иногда не грузится — пробуем allow-scripts allow-same-origin. */
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

/* ========== Страница Chart: панель кнопок + выбранный виджет ========== */
const Chart: React.FC = () => {
  const [chartMode, setChartMode] = useState<ChartMode>('overview');

  const modes: { id: ChartMode; label: string }[] = [
    { id: 'advanced', label: 'Advanced' },
    { id: 'overview', label: 'Overview' },
    { id: 'market', label: 'Market' },
    { id: 'web3', label: 'Web3' },
    { id: 'summary', label: 'Summary' },
  ];

  return (
    <div className="chart-page">
      <div className="chart-toolbar">
        {modes.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`nav-button chart-mode-btn ${chartMode === id ? 'chart-mode-btn--active' : ''}`}
            onClick={() => setChartMode(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="chart-content">
        {chartMode === 'advanced' && <ChartViewAdvanced key="advanced" />}
        {chartMode === 'overview' && <ChartViewOverview key="overview" />}
        {chartMode === 'market' && <ChartViewMarket key="market" />}
        {chartMode === 'web3' && <ChartViewWeb3 key="web3" />}
        {chartMode === 'summary' && <ChartViewSummary key="summary" />}
      </div>
    </div>
  );
};

export default memo(Chart);
