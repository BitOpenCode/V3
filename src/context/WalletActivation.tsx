import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { TonConnectUIProvider, useTonConnectUI } from '@tonconnect/ui-react';

const manifestUrl = 'https://bitopencode.github.io/V3/tonconnect-manifest.json';

// @tonconnect/ui stores its restored session under this key once a wallet
// has been connected at least once.
const CONNECTION_STORAGE_KEY = 'ton-connect-storage_bridge-connection';

function hasStoredConnection(): boolean {
  try {
    return !!localStorage.getItem(CONNECTION_STORAGE_KEY);
  } catch {
    return false;
  }
}

interface WalletActivationContextValue {
  /** Whether the TonConnect provider is mounted (wallet feature "activated"). */
  active: boolean;
  /** Mount the TonConnect provider. Pass true to also open the connect modal once ready. */
  activate: (openModal?: boolean) => void;
}

const WalletActivationContext = createContext<WalletActivationContextValue>({
  active: false,
  activate: () => {},
});

export const useWalletActivation = () => useContext(WalletActivationContext);

// @tonconnect/ui unconditionally fetches the full wallets list and preloads
// every wallet's icon (dozens of external image requests) the instant it's
// constructed, plus checks for a restorable session — regardless of whether
// the user has ever tapped "Connect Wallet". To avoid that cost on every
// app load for users who aren't using TON at all, the provider is only
// mounted once the wallet feature is actually needed: the user taps Connect
// Wallet, or a previously-saved connection exists (so it can auto-restore).
const ModalAutoOpener: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [tonConnectUI] = useTonConnectUI();
  useEffect(() => {
    tonConnectUI.openModal();
    onDone();
    // Only ever run once, right after this component mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
};

export const WalletActivationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [active, setActive] = useState(hasStoredConnection);
  const [pendingModalOpen, setPendingModalOpen] = useState(false);

  const activate = useCallback((openModal = false) => {
    setActive(true);
    if (openModal) setPendingModalOpen(true);
  }, []);

  const contextValue = { active, activate };

  if (!active) {
    return (
      <WalletActivationContext.Provider value={contextValue}>
        {children}
      </WalletActivationContext.Provider>
    );
  }

  return (
    <WalletActivationContext.Provider value={contextValue}>
      <TonConnectUIProvider manifestUrl={manifestUrl}>
        {pendingModalOpen && <ModalAutoOpener onDone={() => setPendingModalOpen(false)} />}
        {children}
      </TonConnectUIProvider>
    </WalletActivationContext.Provider>
  );
};
