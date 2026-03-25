import { initializeApp, cert, getApps, getApp, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getFirebaseAdminApp() {
  if (getApps().length) {
    return getApp();
  }

  if (!process.env.FIREBASE_PRIVATE_KEY) {
    console.warn("Missing FIREBASE_PRIVATE_KEY. Skipping Admin init during build.");
    return {} as any; // Retorna un app fake para que Next.js build no crashee
  }

  const serviceAccount: ServiceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID || "brokiax",
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  };

  return initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.projectId,
  });
}

export function getAdminApp() {
  return getFirebaseAdminApp();
}

export function getAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getAdminDb() {
  return getFirestore(getFirebaseAdminApp());
}
