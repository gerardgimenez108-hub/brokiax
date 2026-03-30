import * as admin from "firebase-admin";

function getFirebaseAdminApp() {
  if (admin.apps.length) {
    return admin.app();
  }

  if (!process.env.ADMIN_PRIVATE_KEY) {
    console.warn("Missing ADMIN_PRIVATE_KEY. Skipping Admin init during build.");
    return {} as any; // fake app for build
  }

  const serviceAccount = {
    projectId: process.env.ADMIN_PROJECT_ID || "brokiax",
    clientEmail: process.env.ADMIN_CLIENT_EMAIL || "",
    privateKey: (process.env.ADMIN_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
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
