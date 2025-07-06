"use client";

import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Client, Admin, User, UserPlazaAccess } from '@/lib/constants';

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

const INITIAL_USERS: User[] = [];

interface AppContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  currentUser: Admin | User | null;
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
  users: User[];
  addUser: (userData: Omit<User, 'id'>) => boolean;
  updateUser: (id: number, userData: Omit<User, 'id' | 'password'> & { password?: string }) => boolean;
  deleteUser: (id: number) => void;
}

export const AppContext = createContext<AppContextType>({
  isAuthenticated: false,
  isLoading: true,
  currentUser: null,
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
  users: [],
  addUser: () => false,
  updateUser: () => false,
  deleteUser: () => {},
});

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<Admin | User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [plazas, setPlazas] = useState<string[]>(INITIAL_PLAZAS);
  const [admins, setAdmins] = useState<Admin[]>(INITIAL_ADMINS);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
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
        const adminToStore = { ...admin };
        delete adminToStore.password;
        setCurrentUser(adminToStore);
        try { localStorage.setItem('currentUser', JSON.stringify(adminToStore)); } catch (e) { console.error(e); }
        router.push('/dashboard');
        return true;
    }
    
    const regularUser = users.find(u => u.username === user && u.password === pass);
    if (regularUser) {
        const userToStore = { ...regularUser };
        delete userToStore.password;
        setCurrentUser(userToStore);
        try { localStorage.setItem('currentUser', JSON.stringify(userToStore)); } catch (e) { console.error(e); }
        router.push('/dashboard');
        return true;
    }

    return false;
  }, [router, admins, users]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('currentUser');
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
    setAdmins(prev => [...prev, { id: nextId, ...adminData } as Admin].sort((a,b) => a.username.localeCompare(b.username)));
    return true;
  }, [admins]);

  const updateAdmin = useCallback((id: number, adminData: Omit<Admin, 'id'|'password'> & {password?: string}) => {
    if (admins.some(a => a.username.toLowerCase() === adminData.username.toLowerCase() && a.id !== id)) {
        return false;
    }
    setAdmins(prev => prev.map(a => {
        if (a.id === id) {
            const updatedAdmin: Admin = { ...a, username: adminData.username };
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

  const addUser = useCallback((userData: Omit<User, 'id'>) => {
    if (users.some(u => u.username.toLowerCase() === userData.username.toLowerCase())) {
        return false;
    }
    const nextId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
    setUsers(prev => [...prev, { ...userData, id: nextId }].sort((a,b) => a.username.localeCompare(b.username)));
    return true;
  }, [users]);

  const updateUser = useCallback((id: number, userData: Omit<User, 'id' | 'password'> & { password?: string }) => {
    if (users.some(u => u.username.toLowerCase() === userData.username.toLowerCase() && u.id !== id)) {
      return false;
    }
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const updatedUser: User = { 
          ...u, 
          username: userData.username,
          plazas: userData.plazas
        };
        if (userData.password) {
          updatedUser.password = userData.password;
        }
        return updatedUser;
      }
      return u;
    }));
    return true;
  }, [users]);

  const deleteUser = useCallback((id: number) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  }, []);


  const value = useMemo(() => ({
    isAuthenticated: !!currentUser,
    isLoading,
    currentUser,
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
    users,
    addUser,
    updateUser,
    deleteUser,
  }), [
    currentUser, isLoading, login, logout, clients, plazas, admins, users,
    addClient, toggleClientRecovered, addPlaza, updatePlaza, deletePlaza,
    addAdmin, updateAdmin, deleteAdmin, addUser, updateUser, deleteUser
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
