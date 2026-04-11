import { getAdminDb } from "@/lib/firebase/admin";
import {
  CompetitionConfig,
  CompetitionEvent,
  CompetitionParticipant,
  CompetitionPosition,
  CompetitionSession,
  LLMDecision,
  LeaderboardEntry,
} from "@/lib/types";
import { executeLLMSingle } from "./llm";
import { fetchMarketPrices, CryptoMarketData } from "./exchange";
import { generateStrategyPrompt, TradingStrategy } from "@/lib/strategies";
import { FieldValue } from "firebase-admin/firestore";
import {
  acquireJobLease,
  releaseJobLease,
  startJobLeaseAutoRenewal,
} from "@/lib/runtime/job-lock";

const PARTICIPANT_COLORS = [
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#f97316",
];

const COMPETITION_LEASE_BASE_MS = 2 * 60 * 1000;

export interface ParticipantConfig {
  apiKeyId: string;
  modelId: string;
  modelName: string;
  provider: string;
}

export interface CompetitionRunnerResult {
  processed: number;
  skipped: number;
}

interface CompetitionStepResult {
  status: "scheduled" | "advanced" | "finished";
  competitionId: string;
}

function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

function buildMarketContext(prices: CryptoMarketData[], pair: string): string {
  const base = pair.split("/")[0];
  const data = prices.find((p) => p.symbol === base);
  if (!data) {
    return `${pair}: price data unavailable`;
  }

  return `
Par: ${pair}
Precio actual: $${data.price}
Cambio 24h: ${data.change24h >= 0 ? "+" : ""}${data.change24h.toFixed(2)}%
Volumen 24h: $${(data.volume / 1_000_000).toFixed(2)}M
Alto 24h: $${data.high24h}
Bajo 24h: $${data.low24h}
  `.trim();
}

function getTimestampDate(value: unknown): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "object" && value !== null) {
    const candidate = value as {
      toDate?: () => Date;
      seconds?: number;
      _seconds?: number;
    };

    if (typeof candidate.toDate === "function") {
      return candidate.toDate();
    }

    if (typeof candidate.seconds === "number") {
      return new Date(candidate.seconds * 1000);
    }

    if (typeof candidate._seconds === "number") {
      return new Date(candidate._seconds * 1000);
    }
  }

  return null;
}

function buildDemoDecision(
  participant: CompetitionParticipant,
  pair: string,
  prices: CryptoMarketData[],
  cycle: number,
  existingPosition: CompetitionPosition | null
): LLMDecision {
  const base = pair.split("/")[0];
  const data = prices.find((p) => p.symbol === base);
  const change24h = data?.change24h ?? 0;
  const styleSeed = participant.modelName.length + cycle;

  let action: LLMDecision["action"] = "HOLD";

  if (existingPosition) {
    if (
      (existingPosition.side === "BUY" && change24h < -1.5) ||
      (existingPosition.side === "SELL" && change24h > 1.5)
    ) {
      action = existingPosition.side === "BUY" ? "SELL" : "BUY";
    } else if (Math.abs(change24h) > 0.6 && cycle % 3 === 0) {
      action = existingPosition.side === "BUY" ? "SELL" : "BUY";
    }
  } else if (participant.modelName.toLowerCase().includes("claude")) {
    action = change24h >= 0 ? "BUY" : "HOLD";
  } else if (participant.modelName.toLowerCase().includes("gpt")) {
    action = styleSeed % 2 === 0 ? "BUY" : "SELL";
  } else {
    action = Math.abs(change24h) > 1 ? "SELL" : "BUY";
  }

  if (Math.abs(change24h) < 0.25 && !existingPosition) {
    action = "HOLD";
  }

  return {
    action,
    symbol: action === "HOLD" ? null : pair,
    amount_usdt: action === "HOLD" ? 0 : 100,
    confidence: Math.min(
      0.92,
      (existingPosition ? 0.72 : 0.64) + Math.abs(change24h) / 20
    ),
    leverage: 1,
    reasoning:
      participant.provider === "demo"
        ? `Showcase demo mode. ${participant.modelName} usa cambio 24h (${change24h.toFixed(2)}%) y estado de posición para decidir ${action}.`
        : `${participant.modelName} usa momentum y cambio 24h para decidir ${action}.`,
  };
}

function simulateTradeResult(
  action: "BUY" | "SELL" | "HOLD",
  currentPrice: number,
  existingPosition: CompetitionPosition | null
): {
  pnlPercent: number;
  position: CompetitionPosition | null;
  tradeExecuted: boolean;
} {
  if (action === "HOLD") {
    return {
      pnlPercent: 0,
      position: existingPosition,
      tradeExecuted: false,
    };
  }

  const slippage = Math.random() * 0.001 - 0.0005;
  const fillPrice = currentPrice * (1 + slippage);

  if (!existingPosition) {
    return {
      pnlPercent: 0,
      position: { entryPrice: fillPrice, amount: 1, side: action },
      tradeExecuted: true,
    };
  }

  if (action !== existingPosition.side) {
    const pnlPerUnit =
      existingPosition.side === "BUY"
        ? (currentPrice - existingPosition.entryPrice) / existingPosition.entryPrice
        : (existingPosition.entryPrice - currentPrice) / existingPosition.entryPrice;

    return {
      pnlPercent: pnlPerUnit * 100,
      position: null,
      tradeExecuted: true,
    };
  }

  return {
    pnlPercent: 0,
    position: existingPosition,
    tradeExecuted: false,
  };
}

async function writeEvent(
  db: FirebaseFirestore.Firestore,
  competitionId: string,
  event: Omit<CompetitionEvent, "id">
) {
  const eventRef = db
    .collection("competitions")
    .doc(competitionId)
    .collection("events")
    .doc();

  await eventRef.set({ id: eventRef.id, ...event } as any);
}

function buildLeaderboard(
  participants: CompetitionParticipant[]
): LeaderboardEntry[] {
  return participants
    .map((participant) => ({
      participantId: participant.id,
      modelName: participant.modelName,
      provider: participant.provider,
      color: participant.color,
      pnl: participant.currentPnlPercent,
      pnlPercent: participant.currentPnlPercent,
      winRate:
        participant.totalTrades > 0
          ? (participant.winTrades / participant.totalTrades) * 100
          : 0,
      tradesCount: participant.totalTrades,
      rank: 0,
    }))
    .sort((a, b) => b.pnlPercent - a.pnlPercent)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function createCompetitionSession(
  userId: string,
  config: CompetitionConfig,
  participants: ParticipantConfig[],
  sessionId?: string
): Promise<string> {
  const db = getAdminDb();
  const competitionId = sessionId || generateId();

  const competitionParticipants: CompetitionParticipant[] = participants.map((p, i) => ({
    id: generateId(),
    modelId: p.modelId,
    modelName: p.modelName,
    provider: p.provider,
    apiKeyId: p.apiKeyId,
    color: PARTICIPANT_COLORS[i % PARTICIPANT_COLORS.length],
    status: "connecting",
    currentPnlPercent: 0,
    totalTrades: 0,
    winTrades: 0,
    openPosition: null,
    lastReasoning: "",
    lastConfidence: 0,
    lastAction: null,
  }));

  await db.collection("competitions").doc(competitionId).set({
    id: competitionId,
    userId,
    status: "waiting",
    createdAt: FieldValue.serverTimestamp(),
    startedAt: null,
    finishedAt: null,
    nextRunAt: new Date(),
    lastCycleAt: null,
    errorMessage: null,
    config,
    participants: competitionParticipants,
    leaderboard: buildLeaderboard(competitionParticipants),
    currentCycle: 0,
  });

  return competitionId;
}

async function advanceCompetitionSession(
  competitionId: string
): Promise<CompetitionStepResult> {
  const db = getAdminDb();
  const compRef = db.collection("competitions").doc(competitionId);
  const compDoc = await compRef.get();

  if (!compDoc.exists) {
    throw new Error(`Competition ${competitionId} not found`);
  }

  const comp = compDoc.data() as CompetitionSession;
  if (comp.status === "finished") {
    return { status: "finished", competitionId };
  }

  const nextRunAt = getTimestampDate(comp.nextRunAt) || new Date(0);
  if (nextRunAt.getTime() > Date.now()) {
    return { status: "scheduled", competitionId };
  }

  if (comp.currentCycle >= comp.config.maxCycles) {
    await compRef.update({
      status: "finished",
      finishedAt: FieldValue.serverTimestamp(),
      nextRunAt: null,
    });

    return { status: "finished", competitionId };
  }

  const cycle = comp.currentCycle + 1;
  const { config, participants } = comp;

  if (comp.status === "waiting") {
    await compRef.update({
      status: "running",
      startedAt: FieldValue.serverTimestamp(),
      errorMessage: null,
    });
  }

  const prices = await fetchMarketPrices("binance", [config.pair]);
  const marketContext = buildMarketContext(prices, config.pair);
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

  const decisions = await Promise.allSettled(
    participants.map((participant) => {
      if (!participant.apiKeyId) {
        return Promise.resolve(
          buildDemoDecision(
            participant,
            config.pair,
            prices,
            cycle,
            participant.openPosition ?? null
          )
        );
      }

      return executeLLMSingle(
        comp.userId,
        participant.apiKeyId,
        participant.modelId,
        strategyPrompt,
        marketContext,
        config.maxAllocation,
        config.maxAllocation,
        0,
        db
      );
    })
  );

  const base = config.pair.split("/")[0];
  const currentPrice = prices.find((price) => price.symbol === base)?.price || 0;

  const updatedParticipants = [...participants];

  for (let i = 0; i < participants.length; i++) {
    const participant = participants[i];
    const result = decisions[i];

    let pnlDelta = 0;
    let tradeExecuted = false;
    let action: "BUY" | "SELL" | "HOLD" = "HOLD";
    let reasoning = "";
    let confidence = 0;
    let tradeStatus: "pending" | "filled" | "failed" | "simulated" = "pending";
    let openPosition = participant.openPosition ?? null;

    if (result.status === "fulfilled") {
      const decision = result.value;
      action = decision.action;
      reasoning = decision.reasoning;
      confidence = decision.confidence ?? 0;

      const simulation = simulateTradeResult(action, currentPrice, openPosition);
      pnlDelta = simulation.pnlPercent;
      tradeExecuted = simulation.tradeExecuted;
      openPosition = simulation.position;

      if (tradeExecuted) {
        tradeStatus = "simulated";
      }
    } else {
      reasoning =
        result.reason instanceof Error
          ? result.reason.message
          : `Error: ${String(result.reason)}`;
      tradeStatus = "failed";
    }

    const currentPnlPercent = Number(
      ((participant.currentPnlPercent || 0) + pnlDelta).toFixed(2)
    );

    updatedParticipants[i] = {
      ...participant,
      status: result.status === "fulfilled" ? "decided" : "error",
      lastReasoning: reasoning.substring(0, 300),
      lastConfidence: confidence,
      lastAction: action,
      currentPnlPercent,
      totalTrades: participant.totalTrades + (tradeExecuted ? 1 : 0),
      winTrades: participant.winTrades + (tradeExecuted && pnlDelta > 0 ? 1 : 0),
      openPosition,
    };

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
      pnlPercent: currentPnlPercent,
      tradeStatus,
      timestamp: FieldValue.serverTimestamp() as any,
      eventType: result.status === "fulfilled" ? "decision" : "error",
    });
  }

  const leaderboard = buildLeaderboard(updatedParticipants);
  const finished = cycle >= config.maxCycles;

  await compRef.update({
    participants: updatedParticipants,
    leaderboard,
    currentCycle: cycle,
    status: finished ? "finished" : "running",
    lastCycleAt: FieldValue.serverTimestamp(),
    finishedAt: finished ? FieldValue.serverTimestamp() : null,
    nextRunAt: finished
      ? null
      : new Date(Date.now() + config.intervalSeconds * 1000),
    errorMessage: null,
  });

  await writeEvent(db, competitionId, {
    cycleIndex: cycle,
    participantId: "system",
    model: "SYSTEM",
    provider: "system",
    action: "HOLD",
    symbol: null,
    amount_usdt: 0,
    reasoning: finished
      ? `Competition finished after cycle ${cycle}.`
      : `Cycle ${cycle} complete. Next cycle scheduled.`,
    confidence: 0,
    pnlPercent: 0,
    tradeStatus: "pending",
    timestamp: FieldValue.serverTimestamp() as any,
    eventType: "cycle_complete",
  } as any);

  return {
    status: finished ? "finished" : "advanced",
    competitionId,
  };
}

export async function processQueuedCompetitions(
  ownerId: string,
  limit = 5
): Promise<CompetitionRunnerResult> {
  const db = getAdminDb();
  const now = Date.now();
  const snapshot = await db
    .collection("competitions")
    .where("status", "in", ["waiting", "running"])
    .limit(limit)
    .get();

  let processed = 0;
  let skipped = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data() as CompetitionSession;
    const nextRunAt = getTimestampDate(data.nextRunAt);

    if (nextRunAt && nextRunAt.getTime() > now) {
      skipped += 1;
      continue;
    }

    const ttlMs = Math.max(
      COMPETITION_LEASE_BASE_MS,
      (data.config?.intervalSeconds || 30) * 1000 + 30_000
    );

    const lease = await acquireJobLease({
      key: `competition:${doc.id}`,
      ttlMs,
      ownerId,
    });

    if (!lease) {
      skipped += 1;
      continue;
    }

    const leaseAutoRenewal = startJobLeaseAutoRenewal({
      key: `competition:${doc.id}`,
      ttlMs,
      ownerId,
    });

    try {
      await advanceCompetitionSession(doc.id);
      processed += 1;
    } catch (error) {
      await doc.ref.update({
        status: "finished",
        errorMessage:
          error instanceof Error ? error.message : "Competition runner failed",
        finishedAt: FieldValue.serverTimestamp(),
        nextRunAt: null,
      });
      throw error;
    } finally {
      await leaseAutoRenewal.stop();
      await releaseJobLease(`competition:${doc.id}`, ownerId);
    }
  }

  return { processed, skipped };
}

export async function runCompetitionSession(
  competitionId: string
): Promise<void> {
  while (true) {
    const result = await advanceCompetitionSession(competitionId);

    if (result.status === "finished") {
      return;
    }

    const db = getAdminDb();
    const compDoc = await db.collection("competitions").doc(competitionId).get();
    const comp = compDoc.data() as CompetitionSession | undefined;
    const nextRunAt = getTimestampDate(comp?.nextRunAt);

    if (!nextRunAt) {
      return;
    }

    const waitMs = Math.max(nextRunAt.getTime() - Date.now(), 0);
    if (waitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
}

export async function stopCompetition(competitionId: string): Promise<void> {
  const db = getAdminDb();
  await db.collection("competitions").doc(competitionId).update({
    status: "finished",
    finishedAt: FieldValue.serverTimestamp(),
    nextRunAt: null,
  });
}
