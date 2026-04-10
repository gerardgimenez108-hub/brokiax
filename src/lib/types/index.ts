// ============================================
// BROKIAX — Tipos TypeScript Principales
// ============================================

import { Timestamp } from "firebase/firestore";

// ─── Planes de suscripción ─────────────────────

export type PlanTier = "starter" | "pro" | "elite" | "enterprise";

export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "incomplete";

export type InternalRole = "internal_admin";

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
  internalRole?: InternalRole;
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
  | "minimax"
  | "x402";

export interface ApiKey {
  id: string;
  name: string;
  provider: LLMProvider;
  encryptedKey: string;
  iv: string;
  createdAt: Timestamp;
  lastUsedAt?: Timestamp;
  walletAddress?: string;
  chainId?: number;
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
  apiKeyIv: string;
  apiSecretIv: string;
  encryptedApiPassword?: string;
  apiPasswordIv?: string;
  sandbox: boolean;
  createdAt: Timestamp;
  // Legacy compatibility fields
  provider?: ExchangeId;
  encryptedKey?: string;
  encryptedSecret?: string;
  iv?: string;
  ivKey?: string;
  ivSecret?: string;
  encryptedPassphrase?: string;
  ivPassphrase?: string;
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
  exchangeKeyId?: string | null;
  strategyId: string;
  pairs: string[];
  sandbox?: boolean;

  // Estado
  initialCapital?: number;
  currentValue?: number;
  availableCash?: number;
  allocatedCapital?: number;
  maxAllocation: number;
  currentAllocation: number;
  openPositions: number;
  realizedPnl?: number;
  unrealizedPnl?: number;
  totalPnl?: number;
  totalPnlPercent?: number;
  peakEquity?: number;
  maxDrawdownPercent?: number;
  winRate?: number;
  tradesCount?: number;
  winningTrades?: number;
  losingTrades?: number;

  // Ejecución
  intervalMinutes: number;
  lastRunAt?: Timestamp;
  nextRunAt?: Timestamp;
  errorMessage?: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Trades ────────────────────────────────────

export type TradeStatus = "pending" | "filled" | "failed";
export type TradeStrategySource = "built-in" | "custom";

export interface TradeTraceMarketSnapshot {
  pair: string;
  price?: number;
  change24h?: number;
  volume24h?: number;
}

export interface TradeTracePerformanceSnapshot {
  equity: number;
  pnl: number;
  pnlPercent: number;
  openPositions: number;
}

export interface TradeTraceRiskEvaluation {
  action: "approve" | "reject" | "warn" | "force-close";
  reason: string;
}

export interface TradeTraceExecutionSummary {
  status: TradeStatus;
  orderId?: string;
  error?: string;
}

export interface TradeDecisionTrace {
  mode: Trader["mode"];
  strategySource: TradeStrategySource;
  market: TradeTraceMarketSnapshot[];
  performance: {
    pre: TradeTracePerformanceSnapshot;
    post: TradeTracePerformanceSnapshot;
  };
  risk?: TradeTraceRiskEvaluation;
  execution: TradeTraceExecutionSummary;
}

export interface Trade {
  id: string;
  side: "buy" | "sell" | "hold";
  symbol: string;
  amount: number;
  price: number;
  amountUsdt?: number;
  quantity?: number;
  reasoning: string;
  orderId?: string;
  status: TradeStatus;
  pnl?: number;
  realizedPnl?: number;
  realizedPnlPercent?: number;
  confidence?: number;
  errorMessage?: string | null;
  trace?: TradeDecisionTrace;
  createdAt: Timestamp;
}

// ─── Métricas ──────────────────────────────────

export interface Metric {
  timestamp: Timestamp;
  totalValue: number;
  equity?: number;
  availableCash?: number;
  allocatedCapital?: number;
  realizedPnl?: number;
  unrealizedPnl?: number;
  pnl: number;
  pnlPercent: number;
  openPositions: number;
  btcPrice?: number;
  ethPrice?: number;
}

// ─── Runtime ───────────────────────────────────

export type RuntimeHealthState = "idle" | "running" | "healthy" | "degraded" | "error";

export interface RuntimeStatusSnapshot {
  key: "trading-engine" | "showcase-scheduler" | "competition-runner";
  label: string;
  state: RuntimeHealthState;
  ownerId?: string;
  lastMessage?: string;
  lastHeartbeatAt?: string | null;
  lastStartedAt?: string | null;
  lastFinishedAt?: string | null;
  lastSuccessAt?: string | null;
  lastErrorAt?: string | null;
  lastDurationMs?: number;
  lastProcessed?: number;
  lastSkipped?: number;
  nextExpectedHeartbeatAt?: string | null;
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

export interface CompetitionPosition {
  entryPrice: number;
  amount: number;
  side: "BUY" | "SELL";
}

export interface CompetitionParticipant {
  id: string;
  modelId: string;
  modelName: string;
  provider: string;
  apiKeyId: string;
  color: string;
  status: "connecting" | "thinking" | "decided" | "error";
  currentPnlPercent: number;
  totalTrades: number;
  winTrades: number;
  openPosition?: CompetitionPosition | null;
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
  nextRunAt?: Timestamp | null;
  lastCycleAt?: Timestamp | null;
  errorMessage?: string | null;
  isShowcase?: boolean;
  showcaseName?: string;
  showcaseMode?: "llm" | "demo";
  config: CompetitionConfig;
  participants: CompetitionParticipant[];
  leaderboard: LeaderboardEntry[];
  currentCycle: number;
}
