export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { executeBacktestSim } from "@/lib/trading/llm";
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
    const { pair, strategyId, timeframe, capital, apiKeyId, model } = body;

    if (!pair || !strategyId || !timeframe || !capital || !apiKeyId || !model) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    // 1. Fetch Strategy
    const strategyDoc = await db.doc(`users/${userId}/strategies/${strategyId}`).get();
    if (!strategyDoc.exists) {
      return NextResponse.json({ error: "Estrategia no encontrada" }, { status: 404 });
    }
    const strategy = strategyDoc.data() as Strategy;

    // 2. Execute Backend Simulation
    const result = await executeBacktestSim(
      userId,
      apiKeyId,
      model,
      strategy,
      pair,
      timeframe,
      capital,
      db
    );

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    console.error("Error en Backtest Arena:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
