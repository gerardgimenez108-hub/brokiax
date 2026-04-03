// ============================================
// BROKIAX — Tipos TypeScript Principales
// ============================================

import { Timestamp } from "firebase/firestore";
import type { StrategyConfig } from "./strategy";

// ─── Planes de suscripción ─────────────────────

export type PlanTier = "starter" | "pro" | "elite" | "enterprise";

export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "incomplete";

export interface PlanLimits {
  maxTraders: number;
  maxExchanges: number;
  allowedModels: string[] | "all";
  hasStrategyStudio: boolean;
  hasStrategyStudioAdvanced: boolean;
  hasBacktestLab: boolean;
  hasDebateArena: boolean;
  maxDebateLLMs: number;
  historyDays: number;
  hasQuantData: boolean;
  hasMcpApi?: boolean;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  starter: {
    maxTraders: 1,
    maxExchanges: 1,
    allowedModels: ["openai/gpt-4o", "deepseek/deepseek-chat"],
    hasStrategyStudio: true,
    hasStrategyStudioAdvanced: false,
    hasBacktestLab: false,
    hasDebateArena: false,
    maxDebateLLMs: 0,
    historyDays: 30,
    hasQuantData: false,
  },
  pro: {
    maxTraders: 5,
    maxExchanges: 3,
    allowedModels: "all",
    hasStrategyStudio: true,
    hasStrategyStudioAdvanced: true,
    hasBacktestLab: true,
    hasDebateArena: true,
    maxDebateLLMs: 2,
    historyDays: 90,
    hasQuantData: false,
  },
  elite: {
    maxTraders: Infinity,
    maxExchanges: Infinity,
    allowedModels: "all",
    hasStrategyStudio: true,
    hasStrategyStudioAdvanced: true,
    hasBacktestLab: true,
    hasDebateArena: true,
    maxDebateLLMs: 4,
    historyDays: Infinity,
    hasQuantData: true,
    hasMcpApi: false,
  },
  enterprise: {
    maxTraders: Infinity,
    maxExchanges: Infinity,
    allowedModels: "all",
    hasStrategyStudio: true,
    hasStrategyStudioAdvanced: true,
    hasBacktestLab: true,
    hasDebateArena: true,
    maxDebateLLMs: 4,
    historyDays: Infinity,
    hasQuantData: true,
    hasMcpApi: true,
  },
};

// ─── Usuario ───────────────────────────────────

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  plan: PlanTier;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus: SubscriptionStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── API Keys (LLM) ───────────────────────────

export type LLMProvider =
  | "openrouter"
  | "openai"
  | "anthropic"
  | "deepseek"
  | "gemini"
  | "grok"
  | "qwen"
  | "kimi"
  | "minimax";

export interface ApiKey {
  id: string;
  name: string;
  provider: LLMProvider;
  encryptedKey: string;
  iv: string;
  createdAt: Timestamp;
  lastUsedAt?: Timestamp;
}

// ─── Exchange Keys ─────────────────────────────

export type ExchangeId =
  | "binance"
  | "bybit"
  | "okx"
  | "bitget"
  | "kucoin"
  | "gate"
  | "hyperliquid"
  | "aster"
  | "lighter";

export interface ExchangeKey {
  id: string;
  name: string;
  exchange: ExchangeId;
  encryptedApiKey: string;
  encryptedApiSecret: string;
  iv: string;
  sandbox: boolean;
  createdAt: Timestamp;
}

// ─── Estrategia ────────────────────────────────

export type CoinSourceType = "static" | "ai_ranked" | "oi_top" | "mixed";
// ─── Trader ────────────────────────────────────

export type TraderStatus = "active" | "stopped" | "error" | "paused";

export interface Trader {
  id: string;
  name: string;
  status: TraderStatus;

  // Configuración
  mode: "live" | "paper";
  llmProviderId: string;
  llmModel: string;
  exchangeKeyId: string;
  strategyId: string;
  pairs: string[];
  sandbox?: boolean;

  // Estado
  initialCapital?: number;
  currentValue?: number;
  maxAllocation: number;
  currentAllocation: number;
  openPositions: number;
  totalPnl?: number;
  totalPnlPercent?: number;

  // Ejecución
  intervalMinutes: number;
  lastRunAt?: Timestamp;
  nextRunAt?: Timestamp;
  errorMessage?: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Trades ────────────────────────────────────

export interface Trade {
  id: string;
  side: "buy" | "sell";
  symbol: string;
  amount: number;
  price: number;
  reasoning: string;
  orderId?: string;
  status: "pending" | "filled" | "failed";
  pnl?: number;
  createdAt: Timestamp;
}

// ─── Métricas ──────────────────────────────────

export interface Metric {
  timestamp: Timestamp;
  totalValue: number;
  pnl: number;
  pnlPercent: number;
  openPositions: number;
  btcPrice?: number;
  ethPrice?: number;
}

// ─── LLM Decision ─────────────────────────────

export interface LLMDecision {
  action: "BUY" | "SELL" | "HOLD";
  symbol: string | null;
  amount_usdt: number;
  reasoning: string;
  confidence?: number;
  leverage?: number;
}

// ─── Modelos LLM disponibles ──────────────────

export interface LLMModel {
  id: string;
  name: string;
  provider: LLMProvider;
  description: string;
  contextWindow: number;
  costPer1kTokens?: number;
}

// ─── Competition Mode ─────────────────────────

export type CompetitionStatus = "waiting" | "running" | "finished";

export interface CompetitionParticipant {
  id: string;
  modelId: string;
  modelName: string;
  provider: LLMProvider;
  apiKeyId: string;
  color: string;
  status: "connecting" | "thinking" | "decided" | "error";
  currentPnlPercent: number;
  totalTrades: number;
  winTrades: number;
  lastReasoning: string;
  lastConfidence: number;
  lastAction: "BUY" | "SELL" | "HOLD" | null;
}

export interface LeaderboardEntry {
  participantId: string;
  modelName: string;
  provider: string;
  color: string;
  pnl: number;
  pnlPercent: number;
  winRate: number;
  tradesCount: number;
  rank: number;
}

export interface CompetitionConfig {
  pair: string;
  strategyId: string;
  intervalSeconds: number;
  maxCycles: number;
  maxAllocation: number;
}

export interface CompetitionEvent {
  id: string;
  cycleIndex: number;
  participantId: string;
  model: string;
  provider: string;
  action: "BUY" | "SELL" | "HOLD";
  symbol: string | null;
  amount_usdt: number;
  reasoning: string;
  confidence: number;
  pnlPercent: number;
  tradeStatus: "pending" | "filled" | "failed" | "simulated";
  timestamp: Timestamp;
  eventType: "decision" | "trade_executed" | "cycle_complete" | "error";
}

export interface CompetitionSession {
  id: string;
  userId: string;
  status: CompetitionStatus;
  createdAt: Timestamp;
  startedAt?: Timestamp;
  finishedAt?: Timestamp;
  config: CompetitionConfig;
  participants: CompetitionParticipant[];
  leaderboard: LeaderboardEntry[];
  currentCycle: number;
}
