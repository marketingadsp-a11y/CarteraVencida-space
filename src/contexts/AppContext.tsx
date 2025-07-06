"use client";

import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Client } from '@/lib/constants';

const INITIAL_PLAZAS = [
  "AUTLAN PREPA",
  "CREDIMEX",
  "UNION DE TULA",
  "TECOLOTLAN",
  "OFICINA CENTRO",
  "RUTA AARON",
];

interface AppContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: string, pass: string) => Promise<boolean>;
  logout: () => void;
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  addClient: (clientData: Omit<Client, 'id'>) => void;
  toggleClientRecovered: (id: number) => void;
  plazas: string[];
  addPlaza: (plazaName: string) => boolean;
  updatePlaza: (oldName: string, newName: string) => boolean;
  deletePlaza: (plazaName: string) => void;
}

export const AppContext = createContext<AppContextType>({
  isAuthenticated: false,
  isLoading: true,
  login: async () => false,
  logout: () => {},
  clients: [],
  setClients: () => {},
  addClient: () => {},
  toggleClientRecovered: () => {},
  plazas: [],
  addPlaza: () => false,
  updatePlaza: () => false,
  deletePlaza: () => {},
});

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [plazas, setPlazas] = useState<string[]>(INITIAL_PLAZAS);
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
  
  const addClient = (clientData: Omit<Client, 'id'>) => {
    const nextId = clients.length > 0 ? Math.max(...clients.map(c => c.id)) + 1 : 1;
    const newClient: Client = {
      ...clientData,
      id: nextId,
      recuperado: clientData.recuperado ?? false,
    };
    setClients(prev => [...prev, newClient].sort((a, b) => a.nombre.localeCompare(b.nombre)));
  };

  const addPlaza = (plazaName: string) => {
    if (plazas.some(p => p.toLowerCase() === plazaName.toLowerCase())) {
        return false; // Already exists
    }
    setPlazas(prev => [...prev, plazaName].sort());
    return true;
  };

  const updatePlaza = (oldName: string, newName: string) => {
    if (plazas.some(p => p.toLowerCase() === newName.toLowerCase() && p.toLowerCase() !== oldName.toLowerCase())) {
        return false; // New name already exists
    }
    setPlazas(prev => prev.map(p => p === oldName ? newName : p).sort());
    // Also update clients associated with this plaza
    setClients(prevClients => prevClients.map(c => c.plaza === oldName ? { ...c, plaza: newName } : c));
    return true;
  }

  const deletePlaza = (plazaName: string) => {
    setPlazas(prev => prev.filter(p => p !== plazaName));
  }

  const value = useMemo(() => ({
    isAuthenticated,
    isLoading,
    login,
    logout,
    clients,
    setClients,
    addClient,
    toggleClientRecovered,
    plazas,
    addPlaza,
    updatePlaza,
    deletePlaza
  }), [isAuthenticated, isLoading, login, logout, clients, plazas, addClient]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
