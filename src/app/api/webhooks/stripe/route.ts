export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";

function getStripe() {
  const Stripe = require("stripe").default || require("stripe");
  return new Stripe(process.env.STRIPE_SECRET_KEY || "sk_placeholder", {
    apiVersion: "2025-03-31.basil",
  });
}

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(req: NextRequest) {
  try {
    if (!endpointSecret) {
      console.error("⚠️ STRIPE_WEBHOOK_SECRET is not configured.");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    const stripe = getStripe();
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    if (!sig) {
      return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let event: any;
    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err: any) {
      console.error("⚠️ Webhook signature verification failed:", err.message);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    const db = getAdminDb();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.client_reference_id;
        const customerId = session.customer as string;

        if (userId) {
          const plan = (session.metadata?.plan as string) || "pro";
          
          await db.doc(`users/${userId}`).update({
            plan,
            subscriptionStatus: "active",
            stripeCustomerId: customerId,
            updatedAt: new Date().toISOString(),
          });
          console.log(`✅ [STRIPE] User ${userId} upgraded to ${plan}.`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        const usersSnap = await db
          .collection("users")
          .where("stripeCustomerId", "==", customerId)
          .limit(1)
          .get();

        if (!usersSnap.empty) {
          const userDoc = usersSnap.docs[0];
          const status = subscription.status === "active" ? "active" : "past_due";
          
          await userDoc.ref.update({
            subscriptionStatus: status,
            updatedAt: new Date().toISOString(),
          });
          console.log(`✅ [STRIPE] Subscription updated for customer ${customerId}: ${status}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        const usersSnap = await db
          .collection("users")
          .where("stripeCustomerId", "==", customerId)
          .limit(1)
          .get();

        if (!usersSnap.empty) {
          const userDoc = usersSnap.docs[0];
          await userDoc.ref.update({
            plan: "starter",
            subscriptionStatus: "canceled",
            updatedAt: new Date().toISOString(),
          });
          console.log(`✅ [STRIPE] Subscription canceled for customer ${customerId}.`);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const customerId = invoice.customer as string;

        const usersSnap = await db
          .collection("users")
          .where("stripeCustomerId", "==", customerId)
          .limit(1)
          .get();

        if (!usersSnap.empty) {
          const userDoc = usersSnap.docs[0];
          await userDoc.ref.update({
            subscriptionStatus: "past_due",
            updatedAt: new Date().toISOString(),
          });
          console.warn(`⚠️ [STRIPE] Payment failed for customer ${customerId}.`);
        }
        break;
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("Stripe webhook critical error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
