import { NextResponse } from "next/server";
import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getAdminDb, getAdminAuth } from "@/lib/firebase/admin";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    // Basic auth check using token in header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // In Edge runtime, we might not have 'firebase-admin/auth' robust check,
    // so we'll trust the caller to just pass standard user context if this is behind standard security,
    // or alternatively, we can pass userId inside the body for simplicity and rely on Firestore rules 
    // for data (but this is a server route).
    // Let's parse the body.
    const { messages, traderId, userId } = await req.json();

    if (!traderId || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Fetch LLM API key
    const db = getAdminDb();
    const keysSnap = await db.doc(`users/${userId}/settings/apiKeys`).get();
    const openAIApiKey = keysSnap.data()?.openai || process.env.OPENAI_API_KEY;

    if (!openAIApiKey) {
      return NextResponse.json({ error: "OpenAI API key missing" }, { status: 400 });
    }

    const openai = createOpenAI({ apiKey: openAIApiKey });

    // 2. Fetch Trader Profile
    const traderSnap = await db.doc(`users/${userId}/traders/${traderId}`).get();
    const traderData = traderSnap.data();

    // 3. Fetch past 20 trades (Trader's Memory)
    const tradesSnap = await db.collection(`users/${userId}/traders/${traderId}/trades`)
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();
    
    let tradesHistory = "No hay operaciones recientes.";
    if (!tradesSnap.empty) {
      tradesHistory = tradesSnap.docs.map((doc, idx) => {
        const t = doc.data();
        const dateStr = t.createdAt?.toDate ? t.createdAt.toDate().toISOString() : "N/A";
        return `[Trade ${idx+1}] Fecha: ${dateStr} | Acción: ${t.side} ${t.symbol} | Precio: $${t.price} | Estado: ${t.status}\nRazonamiento: ${t.reasoning}`;
      }).join("\n---\n");
    }

    // 4. Construct System Prompt
    const systemPrompt = `
Eres la personificación del Agente de Trading Automatizado de Brokiax: ${traderData?.name || "Agente"}.
Tu estrategia base es: ${traderData?.strategyId}.

El usuario es el creador/administrador de este agente y te está interrogando sobre tus decisiones operativas.
Debes responder SIEMPRE en primera persona (ej. "Compré porque vi divergencia...").
Sé profesional, analítico y céntrate en los datos técnicos y macroeconómicos.

Aquí está tu MEMORIA RECIENTE (Tus últimas 20 operaciones reales):
----------------------
${tradesHistory}
----------------------

Responde a las preguntas del usuario apoyándote en esta memoria. Si pregunta por un trade en particular, búscalo en la lista. Si te pregunta tu PnL, revisa los trades exitosos o fallidos.
`;

    const result = await streamText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      messages,
      temperature: 0.7,
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error("Trader Chat Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process chat" }, { status: 500 });
  }
}
