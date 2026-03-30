export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

function getStripe() {
  const Stripe = require("stripe").default || require("stripe");
  return new Stripe(process.env.STRIPE_SECRET_KEY || "sk_placeholder", {
    apiVersion: "2025-03-31.basil",
  });
}

export async function POST(req: NextRequest) {
  try {
    const stripe = getStripe();
    const { getAdminAuth, getAdminDb } = await import("@/lib/firebase/admin");

    // Authenticate
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    let userId: string;
    try {
      const decoded = await getAdminAuth().verifyIdToken(token);
      userId = decoded.uid;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get user's stripeCustomerId
    const db = getAdminDb();
    const userDoc = await db.doc(`users/${userId}`).get();
    const userData = userDoc.data();

    if (!userData?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: userData.stripeCustomerId,
      return_url: `${appUrl}/settings/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    console.error("[Stripe Portal] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
