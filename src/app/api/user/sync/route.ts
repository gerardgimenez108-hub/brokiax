import { NextResponse } from "next/server";
import { getAdminDb, getAdminAuth } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

const ADMIN_EMAILS = [
  "gerard.trading777@gmail.com",
  "gerard.gimenez@gmail.com",
  "gerardgimenez108@gmail.com",
  "gimenezperies@gmail.com"
];

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
    } catch (err) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const uid = decodedToken.uid;
    const email = decodedToken.email || "";

    const db = getAdminDb();
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    const isPremiumAdmin = ADMIN_EMAILS.includes(email);

    if (!userDoc.exists) {
      // Create base document if it somehow wasn't created (e.g. Google Login from /login)
      await userRef.set({
        email: email,
        displayName: decodedToken.name || "Trader",
        plan: isPremiumAdmin ? "enterprise" : "starter",
        subscriptionStatus: isPremiumAdmin ? "active" : "incomplete",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ success: true, upgraded: isPremiumAdmin });
    } else {
      // Document exists. Enforce enterprise if admin
      if (isPremiumAdmin) {
        const data = userDoc.data();
        if (data?.plan !== "enterprise") {
          await userRef.update({
            plan: "enterprise",
            subscriptionStatus: "active",
            updatedAt: FieldValue.serverTimestamp(),
          });
          return NextResponse.json({ success: true, upgraded: true });
        }
      }
    }

    return NextResponse.json({ success: true, upgraded: false });

  } catch (error) {
    console.error("Sync user error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
