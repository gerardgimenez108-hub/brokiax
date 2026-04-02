import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";

// Define strict typing for Cloudflare workers / Next.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Telegram sends the message object
    if (!body || !body.message || !body.message.text) {
      return NextResponse.json({ ok: true, message: "No text found" });
    }

    const chatId = body.message.chat.id.toString();
    const text = body.message.text.trim();

    // Command: /connect <CODE>
    if (text.startsWith("/connect ")) {
      const code = text.split(" ")[1];
      
      if (!code) {
        await replyToTelegram(chatId, "⚠️ Formato inválido. Usa: `/connect 123456`");
        return NextResponse.json({ ok: true });
      }

      // Search across all users for this connectCode in the telegram settings
      const db = getAdminDb();
      const snapshot = await db.collectionGroup("settings")
        .where("connectCode", "==", code)
        .limit(1)
        .get();

      if (snapshot.empty) {
        await replyToTelegram(chatId, "❌ Código inválido o expirado. Genera uno nuevo en tu panel de Brokiax.");
        return NextResponse.json({ ok: true });
      }

      const docRef = snapshot.docs[0].ref;
      
      // Check if it's the telegram doc
      if (docRef.id !== "telegram") {
         await replyToTelegram(chatId, "❌ Error de documento. Contacta a soporte.");
         return NextResponse.json({ ok: true });
      }

      // Update the user's telegram settings
      await docRef.update({
        chatId: chatId,
        connectCode: null, // clear the code after use
        linkedAt: new Date().toISOString()
      });

      await replyToTelegram(chatId, "✅ ¡Cuenta de Brokiax vinculada con éxito! Ahora recibirás las notificaciones de tus Agentes aquí.");
      return NextResponse.json({ ok: true });
    }

    // Command: /start
    if (text.startsWith("/start")) {
      await replyToTelegram(chatId, "👋 ¡Bienvenido a Brokiax AI Arena!\nPara vincular tu cuenta, ve a Ajustes -> Alertas Telegram en tu panel y envíame el código con `/connect 123456`.");
      return NextResponse.json({ ok: true });
    }

    // Default
    await replyToTelegram(chatId, "🤖 Soy el Agente de Alertas de Brokiax. Solo respondo a comandos automatizados.");
    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error("Telegram Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function replyToTelegram(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
      }),
    });
  } catch (err) {
    console.error("Failed to send telegram message", err);
  }
}
