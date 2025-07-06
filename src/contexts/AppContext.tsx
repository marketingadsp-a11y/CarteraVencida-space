"use client";

import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Client } from '@/lib/constants';

interface AppContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: string, pass: string) => Promise<boolean>;
  logout: () => void;
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  toggleClientRecovered: (id: number) => void;
}

export const AppContext = createContext<AppContextType>({
  isAuthenticated: false,
  isLoading: true,
  login: async () => false,
  logout: () => {},
  clients: [],
  setClients: () => {},
  toggleClientRecovered: () => {},
});

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [clients, setClients] = useState<Client[]>([]);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedAuth = localStorage.getItem('isAuthenticated');
      if (storedAuth === 'true') {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Could not access localStorage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (user: string, pass: string): Promise<boolean> => {
    if (user === 'Cristobal' && pass === '0120') {
      setIsAuthenticated(true);
      try {
        localStorage.setItem('isAuthenticated', 'true');
      } catch (error) {
        console.error("Could not access localStorage", error);
      }
      router.push('/dashboard');
      return true;
    }
    return false;
  }, [router]);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem('isAuthenticated');
    } catch (error) {
        console.error("Could not access localStorage", error);
    }
    router.push('/');
  }, [router]);

  const toggleClientRecovered = (id: number) => {
    setClients(prevClients => 
      prevClients.map(client => 
        client.id === id ? { ...client, recuperado: !client.recuperado } : client
      )
    );
  };
  
  const value = useMemo(() => ({
    isAuthenticated,
    isLoading,
    login,
    logout,
    clients,
    setClients,
    toggleClientRecovered
  }), [isAuthenticated, isLoading, login, logout, clients]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
