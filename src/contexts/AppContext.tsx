"use client";

import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Client, Admin, User, Payment } from '@/lib/constants';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import {
  collection,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  writeBatch,
  getDoc,
  setDoc,
} from 'firebase/firestore';


interface AppContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  currentUser: Admin | User | null;
  login: (user: string, pass: string) => Promise<boolean>;
  logout: () => void;
  appName: string;
  setAppName: (name: string) => Promise<void>;
  clients: Client[];
  setClients: (clients: Client[], plazaName: string, mode: 'add' | 'replace') => Promise<void>;
  addClient: (clientData: Omit<Client, 'id' | 'recuperado' | 'historialPagos'>) => Promise<void>;
  updateClient: (id: string, clientData: Partial<Omit<Client, 'id'>>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addPayment: (clientId: string, monto: number) => Promise<void>;
  deleteClientsByPlaza: (plazaName: string) => Promise<void>;
  plazas: string[];
  userPlazas: string[];
  addPlaza: (plazaName: string) => Promise<boolean>;
  updatePlaza: (oldName: string, newName: string) => Promise<boolean>;
  deletePlaza: (plazaName: string) => Promise<boolean>;
  admins: Admin[];
  addAdmin: (adminData: Omit<Admin, 'id' | 'password'> & { password?: string }) => Promise<boolean>;
  updateAdmin: (id: string, adminData: Omit<Admin, 'id' | 'password'> & { password?: string }) => Promise<boolean>;
  deleteAdmin: (id: string) => Promise<boolean>;
  users: User[];
  addUser: (userData: Omit<User, 'id'>) => Promise<boolean>;
  updateUser: (id: string, userData: Omit<User, 'id' | 'password'> & { password?: string }) => Promise<boolean>;
  deleteUser: (id: string) => Promise<void>;
  isFirebaseConfigured: boolean;
}

export const AppContext = createContext<AppContextType>({
  isAuthenticated: false,
  isLoading: true,
  currentUser: null,
  login: async () => false,
  logout: () => {},
  appName: 'Planet',
  setAppName: async () => {},
  clients: [],
  setClients: async () => {},
  addClient: async () => {},
  updateClient: async () => {},
  deleteClient: async () => {},
  addPayment: async () => {},
  deleteClientsByPlaza: async () => {},
  plazas: [],
  userPlazas: [],
  addPlaza: async () => false,
  updatePlaza: async () => false,
  deletePlaza: async () => false,
  admins: [],
  addAdmin: async () => false,
  updateAdmin: async () => false,
  deleteAdmin: async () => false,
  users: [],
  addUser: async () => false,
  updateUser: async () => false,
  deleteUser: async () => {},
  isFirebaseConfigured: false,
});

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<Admin | User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [appName, setAppNameState] = useState('Planet');
  const [clients, setClientsState] = useState<Client[]>([]);
  const [plazas, setPlazas] = useState<string[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      setIsLoading(false);
      return;
    }

    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Could not access localStorage", error);
    }

    const unsubscribes = [
      onSnapshot(doc(db, 'settings', 'appName'), (doc) => {
        if (doc.exists() && doc.data().name) {
          setAppNameState(doc.data().name);
        }
      }),
      onSnapshot(collection(db, 'admins'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Admin));
        setAdmins(data);
      }),
      onSnapshot(collection(db, 'users'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
        setUsers(data);
      }),
      onSnapshot(collection(db, 'plazas'), (snapshot) => {
        const data = snapshot.docs.map(doc => doc.data().name as string).sort();
        setPlazas(data);
      }),
      onSnapshot(collection(db, 'clients'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Client));
        setClientsState(data.sort((a, b) => a.nombre.localeCompare(b.nombre)));
      }),
    ];

    const checkAndSeedData = async () => {
        const settingsSnap = await getDoc(doc(db, 'settings', 'appName'));
        if (!settingsSnap.exists()) {
             await setDoc(doc(db, 'settings', 'appName'), { name: 'Planet' });
        }
        
        const adminsSnapshot = await getDocs(collection(db, 'admins'));
        if (adminsSnapshot.empty) {
            console.log('Seeding initial admin...');
            await addDoc(collection(db, 'admins'), { username: 'Cristobal', password: '0120' });
        }

        const plazasSnapshot = await getDocs(collection(db, 'plazas'));
        if (plazasSnapshot.empty) {
            console.log('Seeding initial plazas...');
            const batch = writeBatch(db);
            const initialPlazas = ["AUTLAN PREPA", "CREDIMEX", "UNION DE TULA", "TECOLOTLAN", "OFICINA CENTRO", "RUTA AARON"];
            initialPlazas.forEach(plazaName => {
                const plazaRef = doc(collection(db, 'plazas'));
                batch.set(plazaRef, { name: plazaName });
            });
            await batch.commit();
        }
    };

    checkAndSeedData().finally(() => setIsLoading(false));
    
    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  useEffect(() => {
    if (appName) document.title = `${appName} - Cartera`;
  }, [appName]);

  const setAppName = useCallback(async (name: string) => {
    if (!db) return;
    await setDoc(doc(db, 'settings', 'appName'), { name });
  }, []);

  const login = useCallback(async (user: string, pass: string): Promise<boolean> => {
    if (!db) return false;
    const adminQuery = query(collection(db, 'admins'), where('username', '==', user), where('password', '==', pass));
    const adminSnapshot = await getDocs(adminQuery);
    if (!adminSnapshot.empty) {
      const adminDoc = adminSnapshot.docs[0];
      const adminData = { ...adminDoc.data(), id: adminDoc.id } as Admin;
      delete adminData.password;
      setCurrentUser(adminData);
      localStorage.setItem('currentUser', JSON.stringify(adminData));
      router.push('/dashboard');
      return true;
    }

    const userQuery = query(collection(db, 'users'), where('username', '==', user), where('password', '==', pass));
    const userSnapshot = await getDocs(userQuery);
    if (!userSnapshot.empty) {
      const userDoc = userSnapshot.docs[0];
      const userData = { ...userDoc.data(), id: userDoc.id } as User;
      delete userData.password;
      setCurrentUser(userData);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      router.push('/dashboard');
      return true;
    }
    return false;
  }, [router]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    router.push('/');
  }, [router]);

  const addClient = useCallback(async (clientData: Omit<Client, 'id' | 'recuperado' | 'historialPagos'>) => {
    if (!db) return;
    await addDoc(collection(db, 'clients'), {
      ...clientData,
      recuperado: clientData.adeudo <= 0,
      historialPagos: [],
    });
  }, []);

  const setClients = useCallback(async (importedClients: Client[], plazaName: string, mode: 'add' | 'replace') => {
    if (!db) return;
    const batch = writeBatch(db);
    
    if (mode === 'replace') {
      const q = query(collection(db, 'clients'), where('plaza', '==', plazaName));
      const snapshot = await getDocs(q);
      snapshot.forEach(doc => batch.delete(doc.ref));
    }

    importedClients.forEach(client => {
      const clientRef = doc(collection(db, 'clients'));
      const newClientData = { ...client };
      delete (newClientData as any).id;
      batch.set(clientRef, newClientData);
    });

    await batch.commit();
  }, []);


  const updateClient = useCallback(async (id: string, clientData: Partial<Omit<Client, 'id'>>) => {
    if (!db) return;
    const clientRef = doc(db, 'clients', id);
    const dataToUpdate: Partial<Client> = { ...clientData };

    if (dataToUpdate.adeudo !== undefined) {
      dataToUpdate.recuperado = dataToUpdate.adeudo <= 0;
    }
    
    await updateDoc(clientRef, dataToUpdate);
  }, []);

  const deleteClient = useCallback(async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'clients', id));
  }, []);

  const addPayment = useCallback(async (clientId: string, monto: number) => {
    if (!db) return;
    const clientRef = doc(db, 'clients', clientId);
    const clientSnap = await getDoc(clientRef);
    if (clientSnap.exists()) {
      const client = clientSnap.data() as Client;
      const newPayment: Payment = {
        fecha: new Date().toLocaleDateString('es-GB'),
        monto,
        saldoAnterior: client.adeudo,
        saldoNuevo: Math.max(0, client.adeudo - monto),
      };
      await updateDoc(clientRef, {
        adeudo: newPayment.saldoNuevo,
        recuperado: newPayment.saldoNuevo <= 0,
        historialPagos: [...(client.historialPagos || []), newPayment],
      });
    }
  }, []);

  const deleteClientsByPlaza = useCallback(async (plazaName: string) => {
    if (!db) return;
    const q = query(collection(db, 'clients'), where('plaza', '==', plazaName));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }, []);

  const addPlaza = useCallback(async (plazaName: string) => {
    if (!db) return false;
    const q = query(collection(db, 'plazas'), where('name', '==', plazaName));
    if (!(await getDocs(q)).empty) return false;
    await addDoc(collection(db, 'plazas'), { name: plazaName });
    return true;
  }, []);

  const updatePlaza = useCallback(async (oldName: string, newName: string) => {
    if (!db) return false;
    if (oldName === newName) return true;
    const qNew = query(collection(db, 'plazas'), where('name', '==', newName));
    if (!(await getDocs(qNew)).empty) return false;

    const qOld = query(collection(db, 'plazas'), where('name', '==', oldName));
    const oldPlazaSnap = await getDocs(qOld);
    if (oldPlazaSnap.empty) return false;

    const batch = writeBatch(db);
    batch.update(oldPlazaSnap.docs[0].ref, { name: newName });
    
    const clientsQuery = query(collection(db, 'clients'), where('plaza', '==', oldName));
    const clientsSnapshot = await getDocs(clientsQuery);
    clientsSnapshot.forEach(doc => batch.update(doc.ref, { plaza: newName }));

    const usersToUpdate = users.filter(u => u.plazas.some(p => p.plazaName === oldName));
    usersToUpdate.forEach(user => {
        const userRef = doc(db, 'users', user.id);
        const newPlazas = user.plazas.map(p => p.plazaName === oldName ? { ...p, plazaName: newName } : p);
        batch.update(userRef, { plazas: newPlazas });
    });
    
    await batch.commit();
    return true;
  }, [users]);

  const deletePlaza = useCallback(async (plazaName: string) => {
    if (!db) return false;
    const clientsQuery = query(collection(db, "clients"), where("plaza", "==", plazaName));
    if (!(await getDocs(clientsQuery)).empty) return false;

    const q = query(collection(db, 'plazas'), where('name', '==', plazaName));
    const plazaSnap = await getDocs(q);
    if (!plazaSnap.empty) {
      await deleteDoc(plazaSnap.docs[0].ref);
    }
    return true;
  }, []);

  const addAdmin = useCallback(async (adminData: Omit<Admin, 'id' | 'password'> & { password?: string }) => {
    if (!db) return false;
    const q = query(collection(db, 'admins'), where('username', '==', adminData.username));
    if (!(await getDocs(q)).empty) return false;
    await addDoc(collection(db, 'admins'), adminData);
    return true;
  }, []);

  const updateAdmin = useCallback(async (id: string, adminData: Omit<Admin, 'id' | 'password'> & { password?: string }) => {
    if (!db) return false;
    const q = query(collection(db, 'admins'), where('username', '==', adminData.username));
    const existing = await getDocs(q);
    if (!existing.empty && existing.docs[0].id !== id) return false;

    const adminRef = doc(db, 'admins', id);
    const dataToUpdate: any = { username: adminData.username };
    if (adminData.password) dataToUpdate.password = adminData.password;
    await updateDoc(adminRef, dataToUpdate);
    return true;
  }, []);

  const deleteAdmin = useCallback(async (id: string) => {
    if (!db) return false;
    if (admins.length <= 1) return false;
    await deleteDoc(doc(db, 'admins', id));
    return true;
  }, [admins.length]);

  const addUser = useCallback(async (userData: Omit<User, 'id'>) => {
    if (!db) return false;
    const q = query(collection(db, 'users'), where('username', '==', userData.username));
    if (!(await getDocs(q)).empty) return false;
    await addDoc(collection(db, 'users'), userData);
    return true;
  }, []);

  const updateUser = useCallback(async (id: string, userData: Omit<User, 'id' | 'password'> & { password?: string }) => {
    if (!db) return false;
    const q = query(collection(db, 'users'), where('username', '==', userData.username));
    const existing = await getDocs(q);
    if (!existing.empty && existing.docs[0].id !== id) return false;

    const userRef = doc(db, 'users', id);
    const dataToUpdate: any = { username: userData.username, plazas: userData.plazas };
    if (userData.password) dataToUpdate.password = userData.password;
    await updateDoc(userRef, dataToUpdate);
    return true;
  }, []);

  const deleteUser = useCallback(async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'users', id));
  }, []);

  const userPlazas = useMemo(() => {
    if (!currentUser) return [];
    const isAdmin = !('plazas' in currentUser);
    if (isAdmin) return plazas.sort();
    const user = currentUser as User;
    return user.plazas.map(p => p.plazaName).sort();
  }, [currentUser, plazas]);

  const value = {
    isAuthenticated: !!currentUser,
    isLoading,
    currentUser,
    login,
    logout,
    appName,
    setAppName,
    clients,
    setClients,
    addClient,
    updateClient,
    deleteClient,
    addPayment,
    deleteClientsByPlaza,
    plazas,
    userPlazas,
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
    isFirebaseConfigured,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
