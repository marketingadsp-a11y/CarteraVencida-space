import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// --- IMPORTANTE ---
// Las credenciales de Firebase se leen desde las variables de entorno.
// Asegúrate de tener un archivo .env.local en la raíz de tu proyecto
// con las claves correspondientes (ver .env.local.example).
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Verificamos si la configuración de Firebase está completa para evitar errores.
export const isFirebaseConfigured =
  firebaseConfig.apiKey !== "YOUR_API_KEY" &&
  firebaseConfig.apiKey &&
  firebaseConfig.projectId;


// Inicializar Firebase solo si está configurado para prevenir errores.
const app = isFirebaseConfigured && !getApps().length ? initializeApp(firebaseConfig) : (isFirebaseConfigured ? getApp() : null);
const db = app ? getFirestore(app) : null;

export { db };
