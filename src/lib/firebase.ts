import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// --- IMPORTANTE ---
// Reemplaza lo siguiente con la configuración de tu proyecto de Firebase.
// Puedes obtener estos valores desde la consola de Firebase en la configuración de tu proyecto.
// Para más información, consulta: https://firebase.google.com/docs/web/setup#available-libraries
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Verificamos si la configuración de Firebase es la de por defecto para evitar errores.
export const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY" && firebaseConfig.projectId !== "YOUR_PROJECT_ID";

// Inicializar Firebase solo si está configurado para prevenir errores.
const app = isFirebaseConfigured && !getApps().length ? initializeApp(firebaseConfig) : (isFirebaseConfigured ? getApp() : null);
const db = app ? getFirestore(app) : null;

export { db };
