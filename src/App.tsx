import React, { useEffect, useState } from 'react';
import { TonConnectButton, useTonConnectUI } from '@tonconnect/ui-react';
import { Wallet, Coins } from 'lucide-react';
import { getHttpEndpoint } from "@orbs-network/ton-access";
import { TonClient, Address, OpenedContract, fromNano } from "ton";
import WebApp from '@twa-dev/sdk';
import axios from 'axios';

// Replace with your actual TON API key
const TONAPI_KEY = 'YOUR_TONAPI_KEY';
const TONAPI_BASE_URL = 'https://tonapi.io/v2';

function App() {
  const [balance, setBalance] = useState<string | null>(null);
  const [tonPriceChange24h, setTonPriceChange24h] = useState<string | null>(null);
  const [tonPrice, setTonPrice] = useState<string | null>(null);
  const [tonBalanceUSD, setTonBalanceUSD] = useState<string | null>(null);
  
  const [tonConnectUI] = useTonConnectUI();
  const { connected, account } = tonConnectUI;

  useEffect(() => {
    const { connected, account } = tonConnectUI;

    console.log('Connection state changed:', { connected, account });

    // This part remains to handle initial load and changes
    const fetchInitialData = async () => {
      if (connected && account) {
        console.log('Fetching data on initial connection state.');
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
    // Subscribe to status changes to handle async connection restoration
    const unsubscribe = tonConnectUI.onStatusChange(
      wallet => {
        if (wallet) {
          console.log('Wallet status changed: Connected', wallet);
          // Trigger fetchWalletData when wallet status becomes connected
          fetchWalletData();
        } else {
          console.log('Wallet status changed: Disconnected');
          setBalance(null);
          setTonPriceChange24h(null);
          setTonPrice(null);
          setTonBalanceUSD(null);
        }
      },
      // Optional: add a handler for network change if needed later
      // network => {
      //   console.log('Network changed:', network);
      // }
    );

    // Cleanup subscription on component unmount
    return () => {
      console.log('Unsubscribing from status changes.');
      unsubscribe();
    };

  }, [tonConnectUI]); // Depend only on tonConnectUI instance

  // Effect to calculate TON balance in USD when balance or price changes
  useEffect(() => {
    if (balance !== null && tonPrice !== null) {
      try {
        const tonAmount = parseFloat(balance);
        // Remove '$' and parse price
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
      setTonBalanceUSD(null); // Show loading or N/A if either is missing
    }
  }, [balance, tonPrice]);

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
      // Always use mainnet
      const network = 'mainnet';
      const endpoint = await getHttpEndpoint({ network });
      const client = new TonClient({ endpoint });

      const address = Address.parse(account.address);
      const balanceNano = await client.getBalance(address);
      const balanceTon = fromNano(balanceNano);
      
      // const mockJettons = [
      //   { name: "Tegro", balance: "1000" },
      //   { name: "Orbit Bridge", balance: "500" }
      // ];

      setBalance(balanceTon);

      // Fetch analytics data
      await fetchTonPriceData();

      WebApp.MainButton.setText('Wallet Connected');
      WebApp.MainButton.show();
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      setBalance(null);
    }
  };

  // Placeholder functions for fetching analytics data
  const fetchTonPriceData = async () => {
    console.log('Fetching TON price data...');
    try {
      // Set loading state for price while fetching
      setTonPrice(null);
      setTonPriceChange24h(null);

      // Using the public TON API rates endpoint as requested (may have rate limits)
      const response = await axios.get(`${TONAPI_BASE_URL}/rates?tokens=ton&currencies=usd`);
      console.log('TON price data response:', response.data);
      console.log('TON rates object structure:', response.data.rates);
      console.log('TON object structure under rates:', response.data.rates.TON);

      // --- Handle current price ---
      const tonData = response.data.rates.TON?.prices?.USD; // Use optional chaining for safety
      console.log('TON price data object (tonData - USD price): ', tonData);

      if (tonData !== undefined) {
        // Set current price using tonData directly
        setTonPrice(`$${parseFloat(tonData).toFixed(2)}`);
      } else {
        setTonPrice('N/A');
      }

      // --- Handle 24h change ---
      const tonDiff24hData = response.data.rates.TON?.diff_24h?.USD; // Correct path
      console.log('TON price 24h diff data object (tonDiff24hData): ', tonDiff24hData);

      if (tonDiff24hData !== undefined) {
        // Assuming tonDiff24hData is the percentage as a number, but it's a string like "-0.79%"
        // Clean the string before parsing
        const cleanedDiff24h = String(tonDiff24hData).replace('%', '').replace('−', '-'); // Remove % and replace non-standard minus
        const change = parseFloat(cleanedDiff24h);
        
        const formattedChange = change.toFixed(2);
        setTonPriceChange24h(`${change > 0 ? '+' : ''}${formattedChange}%`);
      } else {
        setTonPriceChange24h('N/A');
      }

    } catch (error) {
      console.error('Error fetching TON price data:', error);
      setTonPrice('N/A');
      setTonPriceChange24h('N/A');
    }
  };

  let content;
  if (connected && account) {
    content = (
      <div className="space-y-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold">Wallet Details</h2>
          </div>
          <div className="space-y-2">
            <p className="text-gray-400">Address:</p>
            <p className="font-mono text-sm break-all">{account.address}</p>
            <p className="text-gray-400 mt-4">Balance:</p>
            <p className="text-2xl font-bold">{balance !== null ? `${parseFloat(balance).toFixed(4)} TON` : 'Loading...'}</p>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-semibold">Analytics</h2>
          </div>
          <div className="space-y-4 text-gray-400">
            <div>
              <p>TON Price (USD): <span className="font-semibold text-white">{tonPrice !== null ? tonPrice : 'Loading...'}</span></p>
              <p>TON Price Change (24h): <span className="font-semibold text-white">{tonPriceChange24h !== null ? tonPriceChange24h : 'Loading...'}</span></p>
            </div>
            <div>
              <p>TON Wallet Balance (USD): <span className="font-semibold text-white">{tonBalanceUSD !== null ? tonBalanceUSD : 'Loading...'}</span></p>
            </div>
          </div>
        </div>

      </div>
    );
  } else {
    content = (
      <div className="text-center py-12">
        <p className="text-xl">Connect your TON wallet to view your balance and transactions</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">TON Wallet Tracker</h1>
          <TonConnectButton />
        </div>
        {content}
      </div>
    </div>
  );
}

export default App;