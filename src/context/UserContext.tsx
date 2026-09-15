'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface UserContextType {
  user: any | null;
  balance: number;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  balance: 0,
  loading: true,
  refreshUser: async () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setBalance(data.user.wallet?.balance ?? 0);
      } else {
        setUser(null);
        setBalance(0);
      }
    } catch (error) {
      setUser(null);
      setBalance(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();

    const interval = window.setInterval(() => {
      refreshUser();
    }, 15000);

    const handleBalanceUpdate = () => {
      refreshUser();
    };

    window.addEventListener('balanceUpdated', handleBalanceUpdate);
    window.addEventListener('userUpdated', handleBalanceUpdate);
    window.addEventListener('focus', handleBalanceUpdate);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('balanceUpdated', handleBalanceUpdate);
      window.removeEventListener('userUpdated', handleBalanceUpdate);
      window.removeEventListener('focus', handleBalanceUpdate);
    };
  }, [refreshUser]);

  return (
    <UserContext.Provider value={{ user, balance, loading, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
