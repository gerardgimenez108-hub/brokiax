import { getAdminDb } from "@/lib/firebase/admin";
import {
  Trader,
  ExchangeKey,
  TradeDecisionTrace,
  TradeTraceMarketSnapshot,
  TradeTraceMarketTechnicalSnapshot,
  TradeTracePerformanceSnapshot,
  TradeTraceRiskEvaluation,
} from "@/lib/types";
import { Strategy } from "@/lib/types/strategy";
import { fetchMarketPrices, type CryptoMarketData } from "./exchange";
import * as admin from "firebase-admin";
import { executeLLMSingle } from "./llm";
import { executeLiveTrade } from "./execution";
import { generateStrategyPrompt, TradingStrategy, STRATEGY_INFO, getStrategyParams } from "@/lib/strategies";
import { validateTradeDecision, TraderRiskState } from "./risk";
import {
  buildTraderPerformanceUpdate,
  calculateTraderPerformance,
} from "./performance";

function buildLearningHistory(trades: Array<Record<string, any>>) {
  if (trades.length === 0) {
    return "";
  }

  const recentTrades = trades.slice(-10).reverse();

  return (
    `\n\n### HISTORIAL DE APRENDIZAJE (Últimos ${recentTrades.length} trades):\n` +
    recentTrades
      .map((trade, index) => {
        const tradeDate =
          trade.createdAt?.toDate?.() ??
          (typeof trade.createdAt?.seconds === "number"
            ? new Date(trade.createdAt.seconds * 1000)
            : trade.createdAt instanceof Date
            ? trade.createdAt
            : null);

        return `${index + 1}. Fecha: ${
          tradeDate ? tradeDate.toISOString() : "N/A"
        }\nAcción: ${trade.side} ${trade.symbol} a $${trade.price}\nRazonamiento previo: ${
          trade.reasoning
        }\nEstado: ${trade.status}`;
      })
      .join("\n---\n") +
    `\n\nInstrucción de Auto-Aprendizaje: Analiza si tus decisiones anteriores fueron correctas considerando el precio actual. Ajusta tu agresividad según el historial reciente y evita repetir errores.`
  );
}

function roundTraceNumber(value: number) {
  return Number((Number.isFinite(value) ? value : 0).toFixed(2));
}

function getEmaRelation(
  indicators: CryptoMarketData["indicators"]
): TradeTraceMarketTechnicalSnapshot["emaRelation"] | undefined {
  if (!indicators) {
    return undefined;
  }

  if (indicators.ema20 === indicators.ema50) {
    return "flat";
  }

  return indicators.ema20 > indicators.ema50 ? "above" : "below";
}

function buildTradeTraceTechnicalSnapshot(
  indicators: CryptoMarketData["indicators"]
): TradeTraceMarketTechnicalSnapshot | undefined {
  const emaRelation = getEmaRelation(indicators);
  if (!indicators || !emaRelation) {
    return undefined;
  }

  return {
    trend: indicators.trend,
    rsi: roundTraceNumber(indicators.rsi),
    volatilityPercent: roundTraceNumber(indicators.volatilityPcnt),
    emaRelation,
  };
}

function buildTechnicalMarketContext(indicators: CryptoMarketData["indicators"]) {
  const technical = buildTradeTraceTechnicalSnapshot(indicators);
  if (!technical) {
    return "";
  }

  const trendLabel =
    technical.trend === "bull"
      ? "alcista"
      : technical.trend === "bear"
      ? "bajista"
      : "neutral";
  const emaLabel =
    technical.emaRelation === "above"
      ? "EMA20>EMA50"
      : technical.emaRelation === "below"
      ? "EMA20<EMA50"
      : "EMA20=EMA50";

  return `, Tech: ${trendLabel}, RSI ${technical.rsi}, Vol ${technical.volatilityPercent}%, ${emaLabel}`;
}

function buildTradeTraceMarketSnapshot(
  pairs: string[],
  prices: CryptoMarketData[]
): TradeTraceMarketSnapshot[] {
  return pairs.map((pair) => {
    const base = pair.split("/")[0];
    const market = prices.find((price) => price.symbol === base);
    const technical = buildTradeTraceTechnicalSnapshot(market?.indicators);

    return {
      pair,
      ...(market?.price ? { price: roundTraceNumber(market.price) } : {}),
      ...(typeof market?.change24h === "number"
        ? { change24h: roundTraceNumber(market.change24h) }
        : {}),
      ...(typeof market?.volume === "number"
        ? { volume24h: Math.round(market.volume) }
        : {}),
      ...(technical ? { technical } : {}),
    };
  });
}

function buildTradeTracePerformanceSnapshot(snapshot: {
  equity: number;
  totalPnl: number;
  totalPnlPercent: number;
  openPositions: number;
}): TradeTracePerformanceSnapshot {
  return {
    equity: roundTraceNumber(snapshot.equity),
    pnl: roundTraceNumber(snapshot.totalPnl),
    pnlPercent: roundTraceNumber(snapshot.totalPnlPercent),
    openPositions: snapshot.openPositions,
  };
}

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

    // 5. Fetch Market Data for trader's pairs
    // Defaulting to Binance quotes for broader analysis context
    const prices = await fetchMarketPrices("binance", {
      symbols: trader.pairs,
      includeIndicators: true,
      indicatorsSymbolsLimit: trader.pairs.length,
    });

    // 5.1 Load trade history and derive a coherent account snapshot
    let tradeHistory: Array<Record<string, any>> = [];
    try {
      const tradeHistorySnap = await db
        .collection(`users/${userId}/traders/${trader.id}/trades`)
        .orderBy("createdAt", "asc")
        .limit(250)
        .get();
      tradeHistory = tradeHistorySnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.warn("Could not fetch trade history for performance reconstruction", err);
    }

    const currentPerformance = calculateTraderPerformance(trader, tradeHistory, prices, {
      previousPeakEquity: trader.peakEquity,
      previousMaxDrawdownPercent: trader.maxDrawdownPercent,
    });
    const finalPrompt = strategyPrompt + buildLearningHistory(tradeHistory);
    let riskEvaluation: TradeTraceRiskEvaluation | undefined;

    // 6. Call LLM using real Vercel AI SDK integration (shared utility)
    const marketContext = trader.pairs.map((p: string) => {
      const base = p.split("/")[0];
      const data = prices.find((x) => x.symbol === base);
      return `${p}: $${data?.price || "N/A"} (24h: ${data?.change24h?.toFixed(2) || "N/A"}%, Vol: $${((data?.volume || 0) / 1e6).toFixed(1)}M, H: $${data?.high24h || "N/A"}, L: $${data?.low24h || "N/A"}${buildTechnicalMarketContext(data?.indicators)})`;
    }).join("\\n");

    const decision = await executeLLMSingle(
      userId,
      trader.llmProviderId,
      trader.llmModel,
      finalPrompt,
      marketContext,
      trader.maxAllocation,
      currentPerformance.allocatedCapital,
      currentPerformance.openPositions,
      db
    );

    // 4.5. Hard-Coded Risk Management Rules (Guardrails)
    if (isBuiltIn) {
      try {
        const params = getStrategyParams(trader.strategyId as TradingStrategy, 125);
        const riskState: TraderRiskState = {
          initialCapital: currentPerformance.initialCapital,
          currentEquity: currentPerformance.equity,
          peakEquity: currentPerformance.peakEquity,
          currentPnlPercent: currentPerformance.totalPnlPercent,
          openPositions: currentPerformance.openPositions,
          maxOpenPositions: 3,
          lastTradeAt: currentPerformance.lastTradeAt,
        };
        
        const riskResult = validateTradeDecision(decision, riskState, params);
        riskEvaluation = {
          action: riskResult.action,
          reason: riskResult.reason,
        };
        
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
    const executionAmount = decision.amount_usdt;
    let executedQuantity = decision.action !== "HOLD" && executionPrice > 0 ? decision.amount_usdt / executionPrice : 0;
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
          if (result.amount) executedQuantity = result.amount;
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
    const tradeSide =
      decision.action.toLowerCase() === "buy"
        ? "buy"
        : decision.action.toLowerCase() === "sell"
        ? "sell"
        : "hold";
    const tradeRecordBase = {
      id: tradeRef.id,
      side: tradeSide,
      symbol: decision.symbol || "N/A",
      amount: executionAmount,
      amountUsdt: decision.action === "HOLD" ? 0 : decision.amount_usdt,
      quantity: tradeStatus === "filled" && tradeSide !== "hold" ? executedQuantity : 0,
      price: executionPrice,
      reasoning: decision.reasoning,
      status: tradeStatus,
      confidence: decision.confidence ?? null,
      orderId: orderId || null,
      errorMessage: errMessage || null,
    };
    const nextPerformance = calculateTraderPerformance(
      trader,
      [...tradeHistory, { ...tradeRecordBase, createdAt: new Date() }],
      prices,
      {
        previousPeakEquity: currentPerformance.peakEquity,
        previousMaxDrawdownPercent: currentPerformance.maxDrawdownPercent,
      }
    );
    const tradeTrace: TradeDecisionTrace = {
      mode: trader.mode,
      strategySource: isBuiltIn ? "built-in" : "custom",
      market: buildTradeTraceMarketSnapshot(trader.pairs, prices),
      performance: {
        pre: buildTradeTracePerformanceSnapshot(currentPerformance),
        post: buildTradeTracePerformanceSnapshot(nextPerformance),
      },
      ...(riskEvaluation ? { risk: riskEvaluation } : {}),
      execution: {
        status: tradeStatus,
        ...(orderId ? { orderId } : {}),
        ...(errMessage ? { error: errMessage } : {}),
      },
    };
    const tradeRecord = {
      ...tradeRecordBase,
      trace: tradeTrace,
    };
    
    await tradeRef.set({
      ...tradeRecord,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 7. Rebuild trader metrics from the updated trade ledger and schedule next run
    const intervalMinutes = trader.intervalMinutes || 15;
    const nextRunTime = new Date(Date.now() + intervalMinutes * 60000);
    const tradeRealizedPnl = Number(
      (nextPerformance.realizedPnl - currentPerformance.realizedPnl).toFixed(2)
    );
    const tradeRealizedPnlPercent =
      tradeRecord.amountUsdt && tradeRecord.amountUsdt > 0
        ? Number(((tradeRealizedPnl / tradeRecord.amountUsdt) * 100).toFixed(2))
        : 0;

    const updates: any = {
      ...buildTraderPerformanceUpdate(nextPerformance),
      lastRunAt: admin.firestore.FieldValue.serverTimestamp(),
      nextRunAt: nextRunTime,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.doc(`users/${userId}/traders/${trader.id}`).update(updates);
    if (tradeRecord.status === "filled" && tradeRecord.side === "sell") {
      await tradeRef.update({
        pnl: tradeRealizedPnl,
        realizedPnl: tradeRealizedPnl,
        realizedPnlPercent: tradeRealizedPnlPercent,
      });
    }
    await db.collection(`users/${userId}/traders/${trader.id}/metrics`).add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      totalValue: nextPerformance.equity,
      equity: nextPerformance.equity,
      availableCash: nextPerformance.availableCash,
      allocatedCapital: nextPerformance.allocatedCapital,
      realizedPnl: nextPerformance.realizedPnl,
      unrealizedPnl: nextPerformance.unrealizedPnl,
      pnl: nextPerformance.totalPnl,
      pnlPercent: nextPerformance.totalPnlPercent,
      openPositions: nextPerformance.openPositions,
    });

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
