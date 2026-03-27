export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { fetchMarketPrices } from "@/lib/trading/exchange";
import { executeLLMSingle, executeModerator } from "@/lib/trading/llm";
import { Strategy } from "@/lib/types/strategy";

export async function POST(req: NextRequest) {
  try {
    const { getAdminAuth, getAdminDb } = await import("@/lib/firebase/admin");
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    const userId = decodedToken.uid;
    const db = getAdminDb();

    const body = await req.json();
    const { pair, strategyId, models, maxAllocation } = body;
    // models is expected to be { apiKeyId: string, model: string }[]

    if (!pair || !strategyId || !models || !Array.isArray(models) || models.length === 0) {
      return NextResponse.json({ error: "Faltan campos requeridos o no hay modelos" }, { status: 400 });
    }

    // 1. Fetch Strategy
    const strategyDoc = await db.doc(`users/${userId}/strategies/${strategyId}`).get();
    if (!strategyDoc.exists) {
      return NextResponse.json({ error: "Estrategia no encontrada" }, { status: 404 });
    }
    const strategy = strategyDoc.data() as Strategy;

    // 2. Fetch Market Prices
    const prices = await fetchMarketPrices();
    const base = pair.split("/")[0];
    const data = prices.find((x: any) => x.symbol === base);
    const marketContext = `${pair}: $${data?.price || "N/A"}`;

    // 3. Execute parallel LLMs
    const promises = models.map(async (m) => {
      try {
        const decision = await executeLLMSingle(
          userId,
          m.apiKeyId,
          m.model,
          strategy,
          marketContext,
          maxAllocation || 1000,
          0,
          0,
          db
        );
        return {
          model: m.model,
          apiKeyId: m.apiKeyId,
          success: true,
          decision
        };
      } catch (err: any) {
        return {
          model: m.model,
          apiKeyId: m.apiKeyId,
          success: false,
          error: err.message
        };
      }
    });

    const results = await Promise.all(promises);

    // 4. Filter successful decisions
    const successfulDecisions = results
      .filter(r => r.success && r.decision)
      .map(r => r.decision!);

    // 5. Run Moderator
    // Use the first successful model as the moderator
    let moderatorResult = null;
    const firstSuccess = results.find(r => r.success);
    
    if (successfulDecisions.length > 0 && firstSuccess) {
      try {
        moderatorResult = await executeModerator(
          userId,
          firstSuccess.apiKeyId,
          firstSuccess.model,
          strategy,
          pair,
          successfulDecisions,
          db
        );
      } catch (err: any) {
        console.error("Moderator failed:", err);
        moderatorResult = { decision: "HOLD", confidence: 0, summary: "El moderador falló al alcanzar un consenso por error de la API: " + err.message };
      }
    } else {
      moderatorResult = { decision: "HOLD", confidence: 0, summary: "Ningún agente pudo generar una decisión. Revisa tus API Keys." };
    }

    return NextResponse.json({
      success: true,
      data: {
        individual: results,
        moderator: moderatorResult
      }
    });

  } catch (error: any) {
    console.error("Error en Debate Arena:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
