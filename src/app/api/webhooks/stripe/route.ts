export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAdminDb } from "@/lib/firebase/admin";

// Asumimos que proporcionarán estas keys en sus entornos de Vercel/CloudRun
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy", {
  apiVersion: "2026-02-25.clover" as any, 
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    if (!sig) {
      return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
    }

    let event;
    try {
      if (endpointSecret) {
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
      } else {
        // Fallback inseguro para testing local si no hay webhook secret configurado
        event = JSON.parse(body);
      }
    } catch (err: any) {
      console.error("⚠️ Error de verificación de firma del Webhook:", err.message);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Gestionar el evento de pago completado
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Asumimos que el PaymentLink redirige con client_reference_id = uid del usuario
      const userId = session.client_reference_id;

      if (userId) {
        const db = getAdminDb();
        await db.doc(`users/${userId}`).update({
          subscriptionStatus: "active",
          updatedAt: new Date().toISOString()
        });
        console.log(`✅ [STRIPE WEBHOOK] Usuario ${userId} ha pagado. Acceso desbloqueado.`);
      } else {
        console.warn("⚠️ [STRIPE WEBHOOK] Checkout completado pero sin 'client_reference_id'");
      }
    }

    // Hay que retornar 200 rápido a Stripe para evitar retries conflictivos
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("Stripe webhook error crítico:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
