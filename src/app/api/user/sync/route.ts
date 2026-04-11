import { NextResponse } from "next/server";
import { getAdminDb, getAdminAuth } from "@/lib/firebase/admin";
import * as admin from "firebase-admin";
import {
  getDefaultInternalAdminAccess,
  INTERNAL_ADMIN_ACCESS_PATCH,
  normalizeEmail,
} from "@/lib/auth/internal-access";

function getInternalAdminEmails() {
  return (process.env.INTERNAL_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => normalizeEmail(email))
    .filter(Boolean);
}

function getResolvedInternalAdminAccess(email?: string | null) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  if (getDefaultInternalAdminAccess(normalizedEmail)) {
    return INTERNAL_ADMIN_ACCESS_PATCH;
  }

  const internalAdminEmails = getInternalAdminEmails();
  return internalAdminEmails.includes(normalizedEmail)
    ? INTERNAL_ADMIN_ACCESS_PATCH
    : null;
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await getAdminAuth().verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const uid = decodedToken.uid;
    const email = decodedToken.email || "";
    const internalAccessPatch = getResolvedInternalAdminAccess(email);

    const db = getAdminDb();
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      // Create base document if it somehow wasn't created (e.g. Google Login from /login)
      await userRef.set({
        uid,
        email: email,
        displayName: decodedToken.name || "Trader",
        plan: "starter",
        subscriptionStatus: "incomplete",
        internalRole: null,
        ...(internalAccessPatch || {}),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ success: true, internalAdmin: Boolean(internalAccessPatch) });
    }

    if (internalAccessPatch) {
      const userData = userDoc.data() || {};
      const needsUpdate =
        userData.plan !== internalAccessPatch.plan ||
        userData.subscriptionStatus !== internalAccessPatch.subscriptionStatus ||
        userData.internalRole !== internalAccessPatch.internalRole;

      if (needsUpdate) {
        await userRef.update({
          ...internalAccessPatch,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    return NextResponse.json({ success: true, internalAdmin: Boolean(internalAccessPatch) });

  } catch (error) {
    console.error("Sync user error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
