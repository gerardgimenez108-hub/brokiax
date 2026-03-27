import { getAdminDb } from "@/lib/firebase/admin";
import { Trader, ExchangeKey, LLMDecision } from "@/lib/types";
import { Strategy } from "@/lib/types/strategy";
import { fetchMarketPrices } from "./exchange";
import { FieldValue } from "firebase-admin/firestore";
import { executeLLMSingle } from "./llm";

export async function processActiveTraders() {
  const db = getAdminDb();
  
  // 1. Fetch all active traders across all users using a collection group query
  const snapshot = await db.collectionGroup("traders").where("status", "==", "active").get();

  const now = new Date();
  let processed = 0;
  let skipped = 0;

  for (const doc of snapshot.docs) {
    const trader = { id: doc.id, ...doc.data() } as Trader;
    
    // We need the userId which is the parent of 'traders/traderId'
    // doc.ref path is users/{userId}/traders/{traderId}
    const userId = doc.ref.parent.parent?.id;

    if (!userId) continue;

    const nextRunAt = trader.nextRunAt ? (trader.nextRunAt as any).toDate() : new Date(0);
    
    if (now >= nextRunAt) {
      console.log(`[ENGINE] Executing trader ${trader.id} for user ${userId}`);
      await executeTraderCycle(userId, trader, db);
      processed++;
    } else {
      skipped++;
    }
  }

  return { processed, skipped };
}

async function executeTraderCycle(userId: string, trader: Trader, db: FirebaseFirestore.Firestore) {
  try {
    // 1. Load Strategy
    const strategyDoc = await db.doc(`users/${userId}/strategies/${trader.strategyId}`).get();
    if (!strategyDoc.exists) {
      throw new Error(`Strategy not found: ${trader.strategyId}`);
    }
    const strategy = strategyDoc.data() as Strategy;

    // 2. Fetch Market Data for trader's pairs
    const prices = await fetchMarketPrices(trader.pairs);

    // 3. (Optional) Load Exchange Keys if live trading
    // const exchangeKeyDoc = await db.doc(`users/${userId}/exchangeKeys/${trader.exchangeKeyId}`).get();
    // const exchangeKey = exchangeKeyDoc.data() as ExchangeKey;

    // 4. Call LLM using real Vercel AI SDK integration (shared utility)
    const marketContext = trader.pairs.map((p: string) => {
      const base = p.split("/")[0];
      const data = prices.find((x: any) => x.symbol === base);
      return `${p}: $${data?.price || "N/A"}`;
    }).join("\\n");

    const decision = await executeLLMSingle(
      userId,
      trader.llmProviderId,
      trader.llmModel,
      strategy,
      marketContext,
      trader.maxAllocation,
      trader.currentAllocation,
      trader.openPositions,
      db
    );

    // 5. Save the Trade decision
    const tradeRef = db.collection(`users/${userId}/traders/${trader.id}/trades`).doc();
    
    // If it's a paper trade, default status to 'filled' for now
    await tradeRef.set({
      side: decision.action.toLowerCase() === "buy" ? "buy" : decision.action.toLowerCase() === "sell" ? "sell" : "hold",
      symbol: decision.symbol || "N/A",
      amount: decision.amount_usdt,
      price: decision.symbol ? (prices.find((p: any) => p.symbol === decision.symbol?.split("/")[0])?.price || 0) : 0,
      reasoning: decision.reasoning,
      status: decision.action === "HOLD" ? "pending" : "filled",
      confidence: decision.confidence,
      createdAt: FieldValue.serverTimestamp(),
    });

    // 6. Update Trader metrics and schedule next run
    const intervalMinutes = trader.intervalMinutes || 15;
    const nextRunTime = new Date(Date.now() + intervalMinutes * 60000);

    const updates: any = {
      lastRunAt: FieldValue.serverTimestamp(),
      nextRunAt: nextRunTime,
      updatedAt: FieldValue.serverTimestamp()
    };

    // Very naive PnL calculation / open positions update for testing Dashboard visibility
    if (decision.action === "BUY") {
      updates.openPositions = (trader.openPositions || 0) + 1;
      updates.currentAllocation = (trader.currentAllocation || 0) + decision.amount_usdt;
    } else if (decision.action === "SELL") {
      updates.openPositions = Math.max((trader.openPositions || 0) - 1, 0);
      updates.totalPnlPercent = (trader.totalPnlPercent || 0) + ((Math.random() * 2) - 0.5); // Random PnL -0.5% to 1.5%
    }

    await db.doc(`users/${userId}/traders/${trader.id}`).update(updates);

  } catch (err: any) {
    console.error(`[ENGINE] Error executing trader ${trader.id}:`, err);
    // Mark trader with error status
    await db.doc(`users/${userId}/traders/${trader.id}`).update({
      status: "error",
      errorMessage: err.message,
      updatedAt: FieldValue.serverTimestamp()
    });
  }
}
