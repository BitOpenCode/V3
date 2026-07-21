// src/pages/Games/SpaceShip/hooks/useAuth.ts

import { useCallback } from 'react';

interface UseAuthProps {
  userId: string;
  loadGameState: (id: string) => void;
  setIsLoggedIn: (value: boolean) => void;
}

export const useAuth = ({ userId, loadGameState, setIsLoggedIn }: UseAuthProps) => {
  
  const handleLogin = useCallback(() => {
    if (!userId.trim()) {
      alert('Please enter your login!');
      return;
    }
    loadGameState(userId);
    setIsLoggedIn(true);
  }, [userId, loadGameState, setIsLoggedIn]);

  return { handleLogin };
};