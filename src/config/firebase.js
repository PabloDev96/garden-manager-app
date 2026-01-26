import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Datos de configuración obtenidos de la consola de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDaHWPn7sWJUBffzEOfghm9kfbk7fkswYw",
  authDomain: "garden-manager-app.firebaseapp.com",
  projectId: "garden-manager-app",
  storageBucket: "garden-manager-app.firebasestorage.app",
  messagingSenderId: "633457955079",
  appId: "1:633457955079:web:4ad08f2195c847a6fe75a2",
  measurementId: "G-VVJMXF3YHY"
};

// Inicialización de la aplicación
const app = initializeApp(firebaseConfig);

// Exportación de servicios para uso global en la aplicación
export const db = getFirestore(app);
export const auth = getAuth(app);

// Proveedor de Google para iniciar sesión
export const googleProvider = new GoogleAuthProvider();

export default app;