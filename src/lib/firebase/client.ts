import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBmYv3K1dKPi_oogXtBfgv3WrMtDxLuE48",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "brokiax.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "brokiax",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "brokiax.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "768878779877",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:768878779877:web:2d12668e3082172617e30c",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-36DXD05R3Z",
};

// Inicializar Firebase (singleton)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Servicios
export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics (solo en cliente)
export const initAnalytics = async () => {
  if (typeof window !== "undefined" && (await isSupported())) {
    return getAnalytics(app);
  }
  return null;
};

export default app;
