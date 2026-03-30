export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

function getStripe() {
  const Stripe = require("stripe").default || require("stripe");
  return new Stripe(process.env.STRIPE_SECRET_KEY || "sk_placeholder", {
    apiVersion: "2025-03-31.basil",
  });
}

const PLAN_PRICES: Record<string, { priceId: string; plan: string }> = {
  pro: {
    priceId: process.env.STRIPE_PRICE_ID_PRO || "",
    plan: "pro",
  },
  elite: {
    priceId: process.env.STRIPE_PRICE_ID_ELITE || "",
    plan: "elite",
  },
  enterprise: {
    priceId: process.env.STRIPE_PRICE_ID_ENTERPRISE || "",
    plan: "enterprise",
  },
};

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
    let email: string;
    try {
      const decoded = await getAdminAuth().verifyIdToken(token);
      userId = decoded.uid;
      email = decoded.email || "";
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await req.json();
    const { plan } = body;

    if (!plan || !PLAN_PRICES[plan]) {
      return NextResponse.json(
        { error: "Invalid plan. Must be: pro, elite, or enterprise" },
        { status: 400 }
      );
    }

    const planConfig = PLAN_PRICES[plan];

    if (!planConfig.priceId) {
      return NextResponse.json(
        { error: "Stripe Price ID not configured for this plan" },
        { status: 500 }
      );
    }

    // Check if user already has a stripeCustomerId
    const db = getAdminDb();
    const userDoc = await db.doc(`users/${userId}`).get();
    const userData = userDoc.data();
    let customerId = userData?.stripeCustomerId;

    // Create Stripe customer if needed
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { firebaseUid: userId },
      });
      customerId = customer.id;
      await db.doc(`users/${userId}`).update({ stripeCustomerId: customerId });
    }

    // Create Checkout Session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      client_reference_id: userId,
      mode: "subscription",
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      success_url: `${appUrl}/settings/billing?success=true`,
      cancel_url: `${appUrl}/settings/billing?canceled=true`,
      metadata: { plan: planConfig.plan },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("[Stripe Checkout] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
