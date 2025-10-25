"use client";

import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Client, Admin, User, Payment, ActionLog } from '@/lib/constants';
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
  Timestamp,
  orderBy,
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
  deletePayment: (clientId: string, paymentId: string) => Promise<void>;
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
  actionLogs: ActionLog[];
  allPayments: Payment[];
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
  deletePayment: async () => {},
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
  actionLogs: [],
  allPayments: [],
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
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const router = useRouter();

  const logAction = useCallback(async (
    type: ActionLog['type'], 
    action: string, 
    details: Record<string, any> = {}
  ) => {
    if (!db || !currentUser) return;
    try {
      await addDoc(collection(db, 'action_logs'), {
        type,
        action,
        user: currentUser.username,
        timestamp: Timestamp.now(),
        details,
      });
    } catch (error) {
      console.error("Error logging action:", error);
    }
  }, [currentUser]);

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

    const q = query(collection(db, 'action_logs'), orderBy('timestamp', 'desc'));
    const logUnsubscribe = onSnapshot(q, (snapshot) => {
        const logs = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                timestamp: (data.timestamp as Timestamp).toDate().toISOString(),
            } as ActionLog;
        });
        setActionLogs(logs);
    });

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
      logUnsubscribe,
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
    logAction('UPDATE', `Cambió el nombre de la aplicación a "${name}"`);
  }, [logAction]);

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
      logAction('LOGIN', `El administrador "${user}" inició sesión.`);
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
      logAction('LOGIN', `El usuario "${user}" inició sesión.`);
      router.push('/dashboard');
      return true;
    }
    return false;
  }, [router, logAction]);

  const logout = useCallback(() => {
    logAction('LOGIN', `El usuario "${currentUser?.username}" cerró sesión.`);
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    router.push('/');
  }, [router, logAction, currentUser]);

  const addClient = useCallback(async (clientData: Omit<Client, 'id' | 'recuperado' | 'historialPagos'>) => {
    if (!db) return;
    await addDoc(collection(db, 'clients'), {
      ...clientData,
      recuperado: clientData.adeudo <= 0,
      historialPagos: [],
    });
    logAction('CREATE', `Registró al cliente "${clientData.nombre}" en la plaza ${clientData.plaza}`);
  }, [logAction]);

  const setClients = useCallback(async (importedClients: Omit<Client, 'id'>[], plazaName: string, mode: 'add' | 'replace') => {
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
      if (!newClientData.historialPagos) {
          newClientData.historialPagos = [];
      }
      batch.set(clientRef, newClientData);
    });

    await batch.commit();
    logAction('IMPORT', `Importó ${importedClients.length} clientes a la plaza "${plazaName}" (modo: ${mode}).`);
  }, [logAction]);


  const updateClient = useCallback(async (id: string, clientData: Partial<Omit<Client, 'id'>>) => {
    if (!db) return;
    const clientRef = doc(db, 'clients', id);
    const clientSnap = await getDoc(clientRef);
    if (!clientSnap.exists()) return;
    const originalClient = clientSnap.data() as Client;

    const dataToUpdate: Partial<Omit<Client, 'id'>> = { ...clientData };

    if (typeof dataToUpdate.adeudo === 'number') {
      dataToUpdate.recuperado = dataToUpdate.adeudo <= 0;
    }
    
    await updateDoc(clientRef, dataToUpdate);
    logAction('UPDATE', `Actualizó al cliente "${originalClient.nombre}" (ID: ${id})`);
  }, [logAction]);

  const deleteClient = useCallback(async (id: string) => {
    if (!db) return;
    const clientRef = doc(db, 'clients', id);
    const clientSnap = await getDoc(clientRef);
    if (!clientSnap.exists()) return;
    const clientData = clientSnap.data() as Client;

    await deleteDoc(clientRef);
    logAction('DELETE', `Eliminó al cliente "${clientData.nombre}" de la plaza ${clientData.plaza}.`);
  }, [logAction]);

  const addPayment = useCallback(async (clientId: string, monto: number) => {
    if (!db) return;
    const clientRef = doc(db, 'clients', clientId);
    const clientSnap = await getDoc(clientRef);
    if (clientSnap.exists()) {
      const client = clientSnap.data() as Client;
      const newPayment: Payment = {
        id: new Date().toISOString() + Math.random().toString(36).substr(2, 9), // Unique ID
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
      logAction('PAYMENT', `Registró un abono de $${monto} para el cliente "${client.nombre}".`);
    }
  }, [logAction]);

  const deletePayment = useCallback(async (clientId: string, paymentId: string) => {
    if (!db) return;
    const clientRef = doc(db, 'clients', clientId);
    const clientSnap = await getDoc(clientRef);

    if (clientSnap.exists()) {
        const client = clientSnap.data() as Client;
        const historial = client.historialPagos || [];
        const paymentToDelete = historial.find(p => p.id === paymentId);

        if (paymentToDelete) {
            const newAdeudo = client.adeudo + paymentToDelete.monto;
            const newHistorial = historial.filter(p => p.id !== paymentId);

            await updateDoc(clientRef, {
                adeudo: newAdeudo,
                recuperado: newAdeudo <= 0,
                historialPagos: newHistorial,
            });
            logAction('DELETE', `Eliminó un abono de $${paymentToDelete.monto} del cliente "${client.nombre}".`);
        }
    }
  }, [logAction]);

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
    logAction('DELETE', `Eliminó todos los clientes de la plaza "${plazaName}".`);
  }, [logAction]);

  const addPlaza = useCallback(async (plazaName: string) => {
    if (!db) return false;
    const q = query(collection(db, 'plazas'), where('name', '==', plazaName));
    if (!(await getDocs(q)).empty) return false;
    await addDoc(collection(db, 'plazas'), { name: plazaName });
    logAction('CREATE', `Creó la plaza "${plazaName}".`);
    return true;
  }, [logAction]);

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
    logAction('UPDATE', `Actualizó la plaza "${oldName}" a "${newName}".`);
    return true;
  }, [users, logAction]);

  const deletePlaza = useCallback(async (plazaName: string) => {
    if (!db) return false;
    const clientsQuery = query(collection(db, "clients"), where("plaza", "==", plazaName));
    if (!(await getDocs(clientsQuery)).empty) return false;

    const q = query(collection(db, 'plazas'), where('name', '==', plazaName));
    const plazaSnap = await getDocs(q);
    if (!plazaSnap.empty) {
      await deleteDoc(plazaSnap.docs[0].ref);
      logAction('DELETE', `Eliminó la plaza "${plazaName}".`);
    }
    return true;
  }, [logAction]);

  const addAdmin = useCallback(async (adminData: Omit<Admin, 'id' | 'password'> & { password?: string }) => {
    if (!db) return false;
    const q = query(collection(db, 'admins'), where('username', '==', adminData.username));
    if (!(await getDocs(q)).empty) return false;
    await addDoc(collection(db, 'admins'), adminData);
    logAction('CREATE', `Creó el administrador "${adminData.username}".`);
    return true;
  }, [logAction]);

  const updateAdmin = useCallback(async (id: string, adminData: Omit<Admin, 'id' | 'password'> & { password?: string }) => {
    if (!db) return false;
    const q = query(collection(db, 'admins'), where('username', '==', adminData.username));
    const existing = await getDocs(q);
    if (!existing.empty && existing.docs[0].id !== id) return false;

    const adminRef = doc(db, 'admins', id);
    const dataToUpdate: any = { username: adminData.username };
    if (adminData.password) dataToUpdate.password = adminData.password;
    await updateDoc(adminRef, dataToUpdate);
    logAction('UPDATE', `Actualizó al administrador "${adminData.username}".`);
    return true;
  }, [logAction]);

  const deleteAdmin = useCallback(async (id: string) => {
    if (!db) return false;
    if (admins.length <= 1) return false;

    const adminRef = doc(db, 'admins', id);
    const adminSnap = await getDoc(adminRef);
    if (!adminSnap.exists()) return false;
    const adminData = adminSnap.data() as Admin;

    await deleteDoc(adminRef);
    logAction('DELETE', `Eliminó al administrador "${adminData.username}".`);
    return true;
  }, [admins.length, logAction]);

  const addUser = useCallback(async (userData: Omit<User, 'id'>) => {
    if (!db) return false;
    const q = query(collection(db, 'users'), where('username', '==', userData.username));
    if (!(await getDocs(q)).empty) return false;
    await addDoc(collection(db, 'users'), userData);
    logAction('CREATE', `Creó al usuario "${userData.username}".`);
    return true;
  }, [logAction]);

  const updateUser = useCallback(async (id: string, userData: Omit<User, 'id' | 'password'> & { password?: string }) => {
    if (!db) return false;
    const q = query(collection(db, 'users'), where('username', '==', userData.username));
    const existing = await getDocs(q);
    if (!existing.empty && existing.docs[0].id !== id) return false;

    const userRef = doc(db, 'users', id);
    const dataToUpdate: any = { username: userData.username, plazas: userData.plazas };
    if (userData.password) dataToUpdate.password = userData.password;
    await updateDoc(userRef, dataToUpdate);
    logAction('UPDATE', `Actualizó al usuario "${userData.username}".`);
    return true;
  }, [logAction]);

  const deleteUser = useCallback(async (id: string) => {
    if (!db) return;
    const userRef = doc(db, 'users', id);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;
    const userData = userSnap.data() as User;

    await deleteDoc(doc(db, 'users', id));
    logAction('DELETE', `Eliminó al usuario "${userData.username}".`);
  }, [logAction]);

  const userPlazas = useMemo(() => {
    if (!currentUser) return [];
    const isAdmin = !('plazas' in currentUser);
    if (isAdmin) return plazas.sort();
    const user = currentUser as User;
    return user.plazas.map(p => p.plazaName).sort();
  }, [currentUser, plazas]);

  const allPayments = useMemo(() => {
    return clients.flatMap(client => 
      (client.historialPagos || []).map(p => ({
        ...p,
        clienteId: client.id,
        clienteNombre: client.nombre,
        plaza: client.plaza,
      }))
    ).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [clients]);

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
    deletePayment,
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
    actionLogs,
    allPayments,
    isFirebaseConfigured,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
