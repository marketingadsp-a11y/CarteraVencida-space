"use client";

import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Client, Admin } from '@/lib/constants';

const INITIAL_PLAZAS = [
  "AUTLAN PREPA",
  "CREDIMEX",
  "UNION DE TULA",
  "TECOLOTLAN",
  "OFICINA CENTRO",
  "RUTA AARON",
];

const INITIAL_ADMINS: Admin[] = [
  { id: 1, username: 'Cristobal', password: '0120' },
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
  admins: Admin[];
  addAdmin: (adminData: Omit<Admin, 'id' | 'password'> & { password?: string }) => boolean;
  updateAdmin: (id: number, adminData: Omit<Admin, 'id' | 'password'> & { password?: string }) => boolean;
  deleteAdmin: (id: number) => boolean;
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
  admins: [],
  addAdmin: () => false,
  updateAdmin: () => false,
  deleteAdmin: () => false,
});

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [plazas, setPlazas] = useState<string[]>(INITIAL_PLAZAS);
  const [admins, setAdmins] = useState<Admin[]>(INITIAL_ADMINS);
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
    const admin = admins.find(a => a.username === user && a.password === pass);
    if (admin) {
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
  }, [router, admins]);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem('isAuthenticated');
    } catch (error) {
        console.error("Could not access localStorage", error);
    }
    router.push('/');
  }, [router]);

  const toggleClientRecovered = useCallback((id: number) => {
    setClients(prevClients => 
      prevClients.map(client => 
        client.id === id ? { ...client, recuperado: !client.recuperado } : client
      )
    );
  }, []);
  
  const addClient = useCallback((clientData: Omit<Client, 'id'>) => {
    setClients(prev => {
        const nextId = prev.length > 0 ? Math.max(...prev.map(c => c.id)) + 1 : 1;
        const newClient: Client = {
          ...clientData,
          id: nextId,
          recuperado: clientData.recuperado ?? false,
        };
        return [...prev, newClient].sort((a, b) => a.nombre.localeCompare(b.nombre));
    });
  }, []);

  const addPlaza = useCallback((plazaName: string) => {
    if (plazas.some(p => p.toLowerCase() === plazaName.toLowerCase())) {
        return false;
    }
    setPlazas(prev => [...prev, plazaName].sort());
    return true;
  }, [plazas]);

  const updatePlaza = useCallback((oldName: string, newName: string) => {
    if (plazas.some(p => p.toLowerCase() === newName.toLowerCase() && p.toLowerCase() !== oldName.toLowerCase())) {
        return false;
    }
    setPlazas(prev => prev.map(p => p === oldName ? newName : p).sort());
    setClients(prevClients => prevClients.map(c => c.plaza === oldName ? { ...c, plaza: newName } : c));
    return true;
  }, [plazas]);

  const deletePlaza = useCallback((plazaName: string) => {
    setPlazas(prev => prev.filter(p => p !== plazaName));
  }, []);
  
  const addAdmin = useCallback((adminData: Omit<Admin, 'id'|'password'> & {password?: string}) => {
    if (admins.some(a => a.username.toLowerCase() === adminData.username.toLowerCase())) {
        return false;
    }
    const nextId = admins.length > 0 ? Math.max(...admins.map(a => a.id)) + 1 : 1;
    setAdmins(prev => [...prev, { id: nextId, ...adminData }].sort((a,b) => a.username.localeCompare(b.username)));
    return true;
  }, [admins]);

  const updateAdmin = useCallback((id: number, adminData: Omit<Admin, 'id'|'password'> & {password?: string}) => {
    if (admins.some(a => a.username.toLowerCase() === adminData.username.toLowerCase() && a.id !== id)) {
        return false;
    }
    setAdmins(prev => prev.map(a => {
        if (a.id === id) {
            const updatedAdmin = { ...a, username: adminData.username };
            if (adminData.password) {
                updatedAdmin.password = adminData.password;
            }
            return updatedAdmin;
        }
        return a;
    }));
    return true;
  }, [admins]);

  const deleteAdmin = useCallback((id: number) => {
    if (admins.length <= 1) {
        return false;
    }
    setAdmins(prev => prev.filter(a => a.id !== id));
    return true;
  }, [admins]);

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
    deletePlaza,
    admins,
    addAdmin,
    updateAdmin,
    deleteAdmin,
  }), [
    isAuthenticated, isLoading, login, logout, clients, plazas, admins,
    addClient, toggleClientRecovered, addPlaza, updatePlaza, deletePlaza,
    addAdmin, updateAdmin, deleteAdmin
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
