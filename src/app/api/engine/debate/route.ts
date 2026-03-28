export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { fetchMarketPrices } from "@/lib/trading/exchange";
import { executeSpecialistAgent, executeModerator, AgentRole } from "@/lib/trading/llm";
import { Strategy } from "@/lib/types/strategy";
import { LLMDecision } from "@/lib/types";

const SPECIALIST_ROLES: AgentRole[] = ["technical", "fundamental", "bull", "bear"];

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
    // models: [{ apiKeyId, model }] — We use the first valid one for all specialist calls
    // and optionally use a second one for the Moderator

    if (!pair || !strategyId || !models || !Array.isArray(models) || models.length === 0) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
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

    // 3. Pick specialist key (first model) and moderator key (second, or fallback to first)
    const specialistSlot = models[0];
    const moderatorSlot = models[1] || models[0];

    // 4. Run 4 specialist agents in parallel
    const specialistPromises = SPECIALIST_ROLES.map(async (role) => {
      try {
        const result = await executeSpecialistAgent(
          userId,
          specialistSlot.apiKeyId,
          specialistSlot.model,
          role,
          pair,
          marketContext,
          strategy,
          db
        );
        return { ...result, success: true };
      } catch (err: any) {
        return {
          role,
          label: role,
          model: specialistSlot.model,
          action: "HOLD",
          confidence: 0,
          reasoning: `Error: ${err.message}`,
          success: false
        };
      }
    });

    const specialists = await Promise.all(specialistPromises);

    // 5. Run Moderator using specialist outputs as "decisions"
    const successfulDecisions: LLMDecision[] = specialists
      .filter(s => s.success)
      .map(s => ({
        action: s.action as "BUY" | "SELL" | "HOLD",
        symbol: pair,
        amount_usdt: 0,
        confidence: s.confidence,
        reasoning: `[${s.label}] ${s.reasoning}`
      }));

    let moderatorResult = null;
    if (successfulDecisions.length > 0) {
      try {
        moderatorResult = await executeModerator(
          userId,
          moderatorSlot.apiKeyId,
          moderatorSlot.model,
          strategy,
          pair,
          successfulDecisions,
          db
        );
      } catch (err: any) {
        moderatorResult = {
          decision: "HOLD",
          confidence: 0,
          summary: `El Moderador falló al sintetizar los argumentos: ${err.message}`
        };
      }
    } else {
      moderatorResult = {
        decision: "HOLD",
        confidence: 0,
        summary: "Ningún agente pudo generar un análisis. Revisa tus API Keys."
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        specialists,
        moderator: moderatorResult,
        // Keep backward compat
        individual: specialists.map(s => ({
          model: s.model,
          success: s.success,
          decision: {
            action: s.action,
            confidence: s.confidence,
            reasoning: s.reasoning,
            symbol: pair,
            amount_usdt: 0
          }
        }))
      }
    });

  } catch (error: any) {
    console.error("Error en Debate Arena v2:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
