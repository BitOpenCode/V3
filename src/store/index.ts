import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PortfolioPosition, TickerFilter, TickerSort, SortDirection } from '../types';

// App Settings Store
export type Theme = 'bubbles' | 'space' | 'light';

interface SettingsState {
  theme: Theme;
  currency: 'USD' | 'EUR' | 'RUB';
  setTheme: (theme: Theme) => void;
  setCurrency: (currency: 'USD' | 'EUR' | 'RUB') => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'space',
      currency: 'USD',
      setTheme: (theme) => {
        set({ theme });
        // Apply theme class to body
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${theme}`);
      },
      setCurrency: (currency) => set({ currency }),
    }),
    {
      name: 'settings-storage',
      onRehydrateStorage: () => (state) => {
        // Apply theme on hydration
        if (state?.theme) {
          document.body.className = document.body.className.replace(/theme-\w+/g, '');
          document.body.classList.add(`theme-${state.theme}`);
        }
      },
    }
  )
);

// Favorites Store
interface FavoritesState {
  favorites: string[];
  addFavorite: (symbol: string) => void;
  removeFavorite: (symbol: string) => void;
  toggleFavorite: (symbol: string) => void;
  isFavorite: (symbol: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      addFavorite: (symbol) => 
        set((state) => ({ favorites: [...state.favorites, symbol] })),
      removeFavorite: (symbol) => 
        set((state) => ({ favorites: state.favorites.filter((s) => s !== symbol) })),
      toggleFavorite: (symbol) => {
        const state = get();
        if (state.favorites.includes(symbol)) {
          state.removeFavorite(symbol);
        } else {
          state.addFavorite(symbol);
        }
      },
      isFavorite: (symbol) => get().favorites.includes(symbol),
    }),
    {
      name: 'favorites-storage',
    }
  )
);

// Portfolio Store
interface PortfolioState {
  positions: PortfolioPosition[];
  addPosition: (position: Omit<PortfolioPosition, 'id' | 'currentPrice' | 'value' | 'pnl' | 'pnlPercent'>) => void;
  removePosition: (id: string) => void;
  updatePosition: (id: string, updates: Partial<PortfolioPosition>) => void;
  clearPositions: () => void;
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set) => ({
      positions: [],
      addPosition: (position) =>
        set((state) => ({
          positions: [
            ...state.positions,
            {
              ...position,
              id: Date.now().toString(),
              currentPrice: 0,
              value: 0,
              pnl: 0,
              pnlPercent: 0,
            },
          ],
        })),
      removePosition: (id) =>
        set((state) => ({
          positions: state.positions.filter((p) => p.id !== id),
        })),
      updatePosition: (id, updates) =>
        set((state) => ({
          positions: state.positions.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),
      clearPositions: () => set({ positions: [] }),
    }),
    {
      name: 'portfolio-storage',
    }
  )
);

// Ticker Filters Store
interface TickerFiltersState {
  filter: TickerFilter;
  sort: TickerSort;
  sortDirection: SortDirection;
  searchQuery: string;
  setFilter: (filter: TickerFilter) => void;
  setSort: (sort: TickerSort) => void;
  toggleSortDirection: () => void;
  setSearchQuery: (query: string) => void;
}

export const useTickerFiltersStore = create<TickerFiltersState>()((set) => ({
  filter: 'ALL',
  sort: 'symbol',
  sortDirection: 'asc',
  searchQuery: '',
  setFilter: (filter) => set({ filter }),
  setSort: (sort) => set({ sort }),
  toggleSortDirection: () =>
    set((state) => ({
      sortDirection: state.sortDirection === 'asc' ? 'desc' : 'asc',
    })),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));

// UI State Store (for modals, loading states, etc.)
interface UIState {
  isLoading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  isLoading: false,
  error: null,
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));

