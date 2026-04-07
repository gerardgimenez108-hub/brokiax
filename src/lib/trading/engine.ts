import { getAdminDb } from "@/lib/firebase/admin";
import { Trader, ExchangeKey, LLMDecision } from "@/lib/types";
import { Strategy } from "@/lib/types/strategy";
import { fetchMarketPrices } from "./exchange";
import * as admin from "firebase-admin";
import { executeLLMSingle } from "./llm";
import { executeLiveTrade } from "./execution";
import { generateStrategyPrompt, TradingStrategy, STRATEGY_INFO, getStrategyParams } from "@/lib/strategies";
import { validateTradeDecision, TraderRiskState } from "./risk";

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
    let strategyPrompt = "";
    const isBuiltIn = Object.keys(STRATEGY_INFO).includes(trader.strategyId);
    
    if (isBuiltIn) {
      strategyPrompt = generateStrategyPrompt(trader.strategyId as TradingStrategy, 20, {
        intervalMinutes: trader.intervalMinutes || 15,
        maxPositions: 3, // could come from user settings later
        extremeStopLossPercent: 20,
        maxHoldingHours: 24,
        tradingSymbols: trader.pairs,
      });
    } else {
      // Fallback for v1 Custom Strategies in Firebase
      const strategyDoc = await db.doc(`users/${userId}/strategies/${trader.strategyId}`).get();
      if (!strategyDoc.exists) {
        throw new Error(`Strategy not found: ${trader.strategyId}`);
      }
      const strategy = strategyDoc.data() as Strategy;
      strategyPrompt = `
Eres Brokiax AI, un agente de trading autónomo.
Rol: ${strategy.config.promptSections?.roleDefinition || "Maximizar retorno ajustado al riesgo."}
Frecuencia: ${strategy.config.promptSections?.tradingFrequency || "Moderada."}
Reglas de Entrada: ${strategy.config.promptSections?.entryStandards || "Confluencia de indicadores."}
Proceso de Decisión: ${strategy.config.promptSections?.decisionProcess || "Analiza a fondo."}
      `;
    }

    // 4. Load past performance for Self-Learning
    let performanceHistory = "";
    try {
      const pastTradesSnap = await db.collection(`users/${userId}/traders/${trader.id}/trades`)
        .orderBy("createdAt", "desc")
        .limit(10)
        .get();

      if (!pastTradesSnap.empty) {
        const trades = pastTradesSnap.docs.map(doc => doc.data());
        performanceHistory = `\n\n### HISTORIAL DE APRENDIZAJE (Últimos ${trades.length} trades):\n` +
          trades.map((t, i) => `${i+1}. Fecha: ${t.createdAt?.toDate ? t.createdAt.toDate().toISOString() : "N/A"}\nAcción: ${t.side} ${t.symbol} a $${t.price}\nRazonamiento previo: ${t.reasoning}\nEstado: ${t.status}`).join("\n---\n") +
          `\n\nInstrucción de Auto-Aprendizaje: Analiza si tus decisiones anteriores fueron correctas considerando el precio actual que es distinto. Ajusta tu agresividad basado en tu historial reciente.`;
      }
    } catch (err) {
      console.warn("Could not fetch past trades for self-learning", err);
    }
    
    const finalPrompt = strategyPrompt + performanceHistory;

    // 5. Fetch Market Data for trader's pairs
    // Defaulting to Binance quotes for broader analysis context
    const prices = await fetchMarketPrices("binance", trader.pairs);

    // 6. Call LLM using real Vercel AI SDK integration (shared utility)
    const marketContext = trader.pairs.map((p: string) => {
      const base = p.split("/")[0];
      const data = prices.find((x: any) => x.symbol === base);
      return `${p}: $${data?.price || "N/A"} (24h: ${data?.change24h?.toFixed(2) || "N/A"}%, Vol: $${((data?.volume || 0) / 1e6).toFixed(1)}M, H: $${data?.high24h || "N/A"}, L: $${data?.low24h || "N/A"})`;
    }).join("\\n");

    const decision = await executeLLMSingle(
      userId,
      trader.llmProviderId,
      trader.llmModel,
      finalPrompt,
      marketContext,
      trader.maxAllocation,
      trader.currentAllocation,
      trader.openPositions,
      db
    );

    // 4.5. Hard-Coded Risk Management Rules (Guardrails)
    if (isBuiltIn) {
      try {
        const params = getStrategyParams(trader.strategyId as TradingStrategy, 125);
        const riskState: TraderRiskState = {
          initialCapital: trader.currentAllocation || 1000,
          currentEquity: (trader.currentAllocation || 1000) + (trader.totalPnlPercent || 0) * 10,
          peakEquity: (trader.currentAllocation || 1000) + Math.max(trader.totalPnlPercent || 0, 0) * 10,
          currentPnlPercent: trader.totalPnlPercent || 0,
          openPositions: trader.openPositions || 0,
          lastTradeAt: trader.lastRunAt && (trader.lastRunAt as any).toDate ? (trader.lastRunAt as any).toDate() : null,
        };
        
        const riskResult = validateTradeDecision(decision, riskState, params);
        
        if (riskResult.action === "reject" || riskResult.action === "force-close") {
          console.warn(`[RISK] Trade rejected for ${trader.id}: ${riskResult.reason}`);
          decision.action = "HOLD"; // Override AI decision
          decision.reasoning += `\\n\\n[SISTEMA DE RIESGO BLOQUEÓ EL TRADE]: ${riskResult.reason}`;
        } else if (riskResult.action === "warn") {
          decision.reasoning += `\\n\\n[ADVERTENCIA DE RIESGO]: ${riskResult.reason}`;
        }
      } catch (riskErr) {
        console.error("Risk validation failed:", riskErr);
      }
    }

    // 5. Execute Live Trade if configured
    let tradeStatus: "pending" | "filled" | "failed" = decision.action === "HOLD" ? "pending" : "filled";
    let executionPrice = decision.symbol ? (prices.find((p: any) => p.symbol === decision.symbol?.split("/")[0])?.price || 0) : 0;
    let executionAmount = decision.amount_usdt;
    let orderId: string | undefined = undefined;
    let errMessage = "";

    if (trader.mode === "live" && trader.exchangeKeyId && decision.action !== "HOLD") {
      const exchangeKeyDoc = await db.doc(`users/${userId}/exchangeKeys/${trader.exchangeKeyId}`).get();
      if (exchangeKeyDoc.exists) {
        const exchangeKey = { id: exchangeKeyDoc.id, ...exchangeKeyDoc.data() } as ExchangeKey;
        const result = await executeLiveTrade(exchangeKey, decision, prices);
        if (result.success) {
          tradeStatus = "filled";
          if (result.price) executionPrice = result.price;
          if (result.amount) executionAmount = result.amount; // usually in base asset
          orderId = result.orderId;
        } else {
          tradeStatus = "failed";
          errMessage = result.message || "Execution failed";
        }
      } else {
        tradeStatus = "failed";
        errMessage = "Exchange key not found";
      }
    }

    // 6. Save the Trade decision
    const tradeRef = db.collection(`users/${userId}/traders/${trader.id}/trades`).doc();
    
    await tradeRef.set({
      side: decision.action.toLowerCase() === "buy" ? "buy" : decision.action.toLowerCase() === "sell" ? "sell" : "hold",
      symbol: decision.symbol || "N/A",
      amount: executionAmount,
      price: executionPrice,
      reasoning: decision.reasoning,
      status: tradeStatus,
      confidence: decision.confidence,
      orderId: orderId || null,
      errorMessage: errMessage || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 7. Update Trader metrics and schedule next run
    const intervalMinutes = trader.intervalMinutes || 15;
    const nextRunTime = new Date(Date.now() + intervalMinutes * 60000);

    const updates: any = {
      lastRunAt: admin.firestore.FieldValue.serverTimestamp(),
      nextRunAt: nextRunTime,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Very naive PnL calculation / open positions update for testing Dashboard visibility
    if (tradeStatus === "filled") {
      if (decision.action === "BUY") {
        updates.openPositions = (trader.openPositions || 0) + 1;
        updates.currentAllocation = (trader.currentAllocation || 0) + decision.amount_usdt;
        updates.lastEntryPrice = executionPrice;
      } else if (decision.action === "SELL") {
        updates.openPositions = Math.max((trader.openPositions || 0) - 1, 0);
        // Real PnL: compare entry price vs exit price
        const entryPrice = (trader as any).lastEntryPrice || executionPrice;
        const pnlPercent = entryPrice > 0 ? ((executionPrice - entryPrice) / entryPrice) * 100 : 0;
        updates.totalPnlPercent = (trader.totalPnlPercent || 0) + pnlPercent;
        updates.lastEntryPrice = null; // Clear entry price after closing
      }
    }

    await db.doc(`users/${userId}/traders/${trader.id}`).update(updates);

    // 8. Send Telegram Alert if configured and action is not HOLD
    if (decision.action !== "HOLD") {
      await sendTelegramAlert(userId, trader.name || trader.id, decision, executionPrice, tradeStatus, db);
    }

  } catch (err: any) {
    console.error(`[ENGINE] Error executing trader ${trader.id}:`, err);
    // Mark trader with error status
    await db.doc(`users/${userId}/traders/${trader.id}`).update({
      status: "error",
      errorMessage: err.message,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
}

async function sendTelegramAlert(userId: string, traderName: string, decision: any, executionPrice: number, tradeStatus: string, db: FirebaseFirestore.Firestore) {
  try {
    const doc = await db.doc(`users/${userId}/settings/telegram`).get();
    if (!doc.exists) return;
    
    const chatId = doc.data()?.chatId;
    if (!chatId) return;

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return;

    const emoji = decision.action === "BUY" ? "🟢 COMPRA" : "🔴 VENTA";
    const statusEmoji = tradeStatus === "filled" ? "✅ Ejecutada" : (tradeStatus === "failed" ? "❌ Fallida" : "⏳ Simulada");
    
    const msg = `🤖 *Brokiax Agente (${traderName})*\n\n${emoji} *${decision.symbol}*\n💰 Precio: $${executionPrice}\n📊 Estado: ${statusEmoji}\n\n🧠 *Razonamiento*:\n_${decision.reasoning}_`;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: msg,
        parse_mode: "Markdown"
      })
    });
  } catch (err) {
    console.error("Telegram alert failed:", err);
  }
}
