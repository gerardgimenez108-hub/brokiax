import * as admin from "firebase-admin";

function getFirebaseAdminApp() {
  if (admin.apps.length) {
    return admin.app();
  }

  const projectId = process.env.ADMIN_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "brokiax";
  const clientEmail = process.env.ADMIN_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL || "";
  const privateKey = (process.env.ADMIN_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

  if (!privateKey) {
    console.warn("Missing Firebase Admin credentials. Skipping Admin init during build.");
    return {} as any; // fake app for build
  }

  const serviceAccount = {
    projectId,
    clientEmail,
    privateKey,
  };

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.projectId,
  });
}

export function getAdminApp() {
  return getFirebaseAdminApp();
}

export function getAdminAuth() {
  return admin.auth(getFirebaseAdminApp());
}

export function getAdminDb() {
  return admin.firestore(getFirebaseAdminApp());
}
