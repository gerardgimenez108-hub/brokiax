// Competition Engine — Real-time AI trading competition coordinator
// Paper-mode: simulates trades using real market prices

import { getAdminDb } from "@/lib/firebase/admin";
import { CompetitionSession, CompetitionParticipant, LeaderboardEntry, CompetitionEvent, CompetitionConfig } from "@/lib/types";
import { executeLLMSingle } from "./llm";
import { fetchMarketPrices, CryptoMarketData } from "./exchange";
import { generateStrategyPrompt, TradingStrategy } from "@/lib/strategies";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const PARTICIPANT_COLORS = [
  "#6366f1", // indigo
  "#f59e0b", // amber
  "#10b981", // emerald
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#f97316", // orange
];

export interface ParticipantConfig {
  apiKeyId: string;
  modelId: string;
  modelName: string;
  provider: string;
}

function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildMarketContext(
  prices: CryptoMarketData[],
  pair: string
): string {
  const base = pair.split("/")[0];
  const data = prices.find((p) => p.symbol === base);
  if (!data) return `${pair}: price data unavailable`;

  return `
Par: ${pair}
Precio actual: $${data.price}
Cambio 24h: ${data.change24h >= 0 ? "+" : ""}${data.change24h.toFixed(2)}%
Volumen 24h: $${(data.volume / 1_000_000).toFixed(2)}M
Alto 24h: $${data.high24h}
Bajo 24h: $${data.low24h}
  `.trim();
}

// ─── Paper Trade Simulation ─────────────────────────────────────────

interface Position {
  entryPrice: number;
  amount: number;
  side: "BUY" | "SELL";
}

function simulateTradeResult(
  action: "BUY" | "SELL" | "HOLD",
  currentPrice: number,
  existingPosition: Position | null
): { pnlPercent: number; position: Position | null; tradeExecuted: boolean } {
  if (action === "HOLD") {
    return {
      pnlPercent: 0,
      position: existingPosition,
      tradeExecuted: false,
    };
  }

  // Simulate a fill price with tiny slippage
  const slippage = (Math.random() * 0.001 - 0.0005); // ±0.05%
  const fillPrice = currentPrice * (1 + slippage);

  if (!existingPosition) {
    // Open new position
    return {
      pnlPercent: 0,
      position: { entryPrice: fillPrice, amount: 1, side: action },
      tradeExecuted: true,
    };
  }

  // Close existing position if opposite side
  if (action !== existingPosition.side) {
    const pnlPerUnit = existingPosition.side === "BUY"
      ? (currentPrice - existingPosition.entryPrice) / existingPosition.entryPrice
      : (existingPosition.entryPrice - currentPrice) / existingPosition.entryPrice;

    const totalPnl = pnlPerUnit * 100; // percentage

    return {
      pnlPercent: totalPnl,
      position: null,
      tradeExecuted: true,
    };
  }

  // Same side — accumulate position (simplified)
  return {
    pnlPercent: 0,
    position: existingPosition,
    tradeExecuted: false,
  };
}

// ─── Create Competition Session ─────────────────────────────────────

export async function createCompetitionSession(
  userId: string,
  config: CompetitionConfig,
  participants: ParticipantConfig[]
): Promise<string> {
  const db = getAdminDb();
  const competitionId = generateId();

  const competitionParticipants: CompetitionParticipant[] = participants.map((p, i) => ({
    id: generateId(),
    modelId: p.modelId,
    modelName: p.modelName,
    provider: p.provider as any,
    apiKeyId: p.apiKeyId,
    color: PARTICIPANT_COLORS[i % PARTICIPANT_COLORS.length],
    status: "connecting",
    currentPnlPercent: 0,
    totalTrades: 0,
    winTrades: 0,
    lastReasoning: "",
    lastConfidence: 0,
    lastAction: null,
  }));

  const leaderboard: LeaderboardEntry[] = competitionParticipants.map((p, i) => ({
    participantId: p.id,
    modelName: p.modelName,
    provider: p.provider,
    color: p.color,
    pnl: 0,
    pnlPercent: 0,
    winRate: 0,
    tradesCount: 0,
    rank: i + 1,
  }));

  await db.collection("competitions").doc(competitionId).set({
    id: competitionId,
    userId,
    status: "waiting",
    createdAt: FieldValue.serverTimestamp(),
    startedAt: null,
    finishedAt: null,
    config,
    participants: competitionParticipants,
    leaderboard,
    currentCycle: 0,
  });

  return competitionId;
}

// ─── Run Competition Session ────────────────────────────────────────

export async function runCompetitionSession(competitionId: string): Promise<void> {
  const db = getAdminDb();
  const compRef = db.collection("competitions").doc(competitionId);
  const compDoc = await compRef.get();

  if (!compDoc.exists) throw new Error(`Competition ${competitionId} not found`);

  const comp = compDoc.data() as CompetitionSession;
  const { config, participants } = comp;

  // Update status to running
  await compRef.update({
    status: "running",
    startedAt: FieldValue.serverTimestamp(),
  });

  const strategyPrompt = generateStrategyPrompt(
    config.strategyId as TradingStrategy,
    20,
    {
      intervalMinutes: Math.ceil(config.intervalSeconds / 60),
      maxPositions: 1,
      extremeStopLossPercent: 20,
      maxHoldingHours: 24,
      tradingSymbols: [config.pair],
    }
  );

  // Per-participant paper positions
  const positions = new Map<string, Position | null>();
  participants.forEach((p) => positions.set(p.id, null));

  // Per-participant cumulative PnL
  const cumulativePnl = new Map<string, number>();
  participants.forEach((p) => cumulativePnl.set(p.id, 0));

  try {
    for (let cycle = 1; cycle <= config.maxCycles; cycle++) {
      // Check if competition was stopped
      const currentDoc = await compRef.get();
      const current = currentDoc.data() as CompetitionSession;
      if (current.status === "finished" || current.status === "waiting") break;

      // Update current cycle
      await compRef.update({ currentCycle: cycle });

      // Fetch market data once per cycle (shared across participants)
      const prices = await fetchMarketPrices("binance", [config.pair]);
      const marketContext = buildMarketContext(prices, config.pair);

      // Emit cycle start event
      await writeEvent(db, competitionId, {
        cycleIndex: cycle,
        participantId: "system",
        model: "SYSTEM",
        provider: "system",
        action: "HOLD",
        symbol: null,
        amount_usdt: 0,
        reasoning: `Cycle ${cycle} started`,
        confidence: 0,
        pnlPercent: 0,
        tradeStatus: "pending",
        timestamp: FieldValue.serverTimestamp() as any,
        eventType: "cycle_complete",
      } as any);

      // Update all participants to "thinking"
      const participantUpdates: Record<string, any>[] = [];
      for (const p of participants) {
        participantUpdates.push({
          doc: db.collection("competitions").doc(competitionId),
          updates: { "participants": FieldValue.arrayUnion({ ...p, status: "thinking" }) },
        });
      }

      // Run ALL participants in parallel
      const decisions = await Promise.allSettled(
        participants.map((p) =>
          executeLLMSingle(
            comp.userId,
            p.apiKeyId,
            p.modelId,
            strategyPrompt,
            marketContext,
            config.maxAllocation,
            config.maxAllocation, // use full allocation as starting balance
            0,
            db
          )
        )
      );

      // Process each participant's decision
      const cycleEvents: any[] = [];

      for (let i = 0; i < participants.length; i++) {
        const participant = participants[i];
        const result = decisions[i];
        const base = config.pair.split("/")[0];
        const currentPrice = prices.find((p) => p.symbol === base)?.price || 0;

        let pnlDelta = 0;
        let position = positions.get(participant.id) ?? null;
        let tradeExecuted = false;
        let action: "BUY" | "SELL" | "HOLD" = "HOLD";
        let reasoning = "";
        let confidence = 0;
        let tradeStatus: "pending" | "filled" | "failed" | "simulated" = "pending";

        if (result.status === "fulfilled") {
          const decision = result.value;
          action = decision.action;
          reasoning = decision.reasoning;
          confidence = decision.confidence ?? 0;

          const sim = simulateTradeResult(action, currentPrice, position);
          pnlDelta = sim.pnlPercent;
          position = sim.position;
          tradeExecuted = sim.tradeExecuted;
          positions.set(participant.id, position);

          if (tradeExecuted) {
            tradeStatus = "simulated";
            cumulativePnl.set(participant.id, (cumulativePnl.get(participant.id) ?? 0) + pnlDelta);
          }
        } else {
          reasoning = `Error: ${result.reason}`;
          tradeStatus = "failed";
        }

        // Update participant status to "decided"
        const updatedParticipants = (await compRef.get()).data()!.participants.map((pt: CompetitionParticipant) =>
          pt.id === participant.id
            ? {
                ...pt,
                status: result.status === "fulfilled" ? "decided" : "error",
                lastReasoning: reasoning.substring(0, 300),
                lastConfidence: confidence,
                lastAction: action,
                currentPnlPercent: cumulativePnl.get(participant.id) ?? 0,
                totalTrades: pt.totalTrades + (tradeExecuted ? 1 : 0),
                winTrades: pt.winTrades + (tradeExecuted && pnlDelta > 0 ? 1 : 0),
              }
            : pt
        );

        await compRef.update({ participants: updatedParticipants });

        // Write decision event
        await writeEvent(db, competitionId, {
          cycleIndex: cycle,
          participantId: participant.id,
          model: participant.modelName,
          provider: participant.provider,
          action,
          symbol: action !== "HOLD" ? config.pair : null,
          amount_usdt: action !== "HOLD" ? config.maxAllocation * 0.1 : 0,
          reasoning,
          confidence,
          pnlPercent: cumulativePnl.get(participant.id) ?? 0,
          tradeStatus,
          timestamp: FieldValue.serverTimestamp() as any,
          eventType: "decision",
        });
      }

      // Recalculate leaderboard
      const leaderboard: LeaderboardEntry[] = (await compRef.get()).data()!.participants
        .map((pt: CompetitionParticipant) => ({
          participantId: pt.id,
          modelName: pt.modelName,
          provider: pt.provider,
          color: pt.color,
          pnl: pt.currentPnlPercent,
          pnlPercent: pt.currentPnlPercent,
          winRate: pt.totalTrades > 0 ? (pt.winTrades / pt.totalTrades) * 100 : 0,
          tradesCount: pt.totalTrades,
          rank: 0,
        }))
        .sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.pnlPercent - a.pnlPercent)
        .map((entry: LeaderboardEntry, idx: number) => ({ ...entry, rank: idx + 1 }));

      await compRef.update({ leaderboard });

      // Wait for the interval before next cycle
      if (cycle < config.maxCycles) {
        await sleep(config.intervalSeconds * 1000);
      }
    }
  } catch (err) {
    console.error(`[COMPETITION] Error running session ${competitionId}:`, err);
  }

  // Mark as finished
  await compRef.update({
    status: "finished",
    finishedAt: FieldValue.serverTimestamp(),
  });
}

// ─── Write Event to Subcollection ────────────────────────────────────

async function writeEvent(
  db: FirebaseFirestore.Firestore,
  competitionId: string,
  event: Omit<CompetitionEvent, "id">
): Promise<void> {
  const eventRef = db
    .collection("competitions")
    .doc(competitionId)
    .collection("events")
    .doc();

  await eventRef.set({ id: eventRef.id, ...event } as any);
}

// ─── Stop Competition ───────────────────────────────────────────────

export async function stopCompetition(competitionId: string): Promise<void> {
  const db = getAdminDb();
  await db.collection("competitions").doc(competitionId).update({
    status: "finished",
    finishedAt: FieldValue.serverTimestamp(),
  });
}
