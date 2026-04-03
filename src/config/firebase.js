import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getMessaging } from 'firebase/messaging';

// Datos de configuración obtenidos de la consola de Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Inicialización de la aplicación
const app = initializeApp(firebaseConfig);

// Exportación de servicios para uso global en la aplicación
export const db = getFirestore(app);
export const auth = getAuth(app);

// Proveedor de Google para iniciar sesión
export const googleProvider = new GoogleAuthProvider();

// Notificaciones móvil
export const messaging = getMessaging(app);

export default app;