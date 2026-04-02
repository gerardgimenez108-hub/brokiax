// ============================================
// BROKIAX — Strategy Types (adapted from nof1.ai)
// ============================================

/**
 * 11 Trading Strategies supported by Brokiax v2:
 * 
 * conservative   — Low risk, low leverage, conservative entries
 * balanced       — Medium risk, balanced approach for most traders  
 * aggressive     — High risk, high leverage, tight stops
 * aggressive-team — Leader + 2 scouts coordinated decision model
 * ultra-short    — 5-min scalping, fast execution
 * swing-trend    — 20-min cycle, multi-day positions
 * medium-long    — 30-min cycle, days/weeks holdings
 * rebate-farming — 2-3 min cycle, high-frequency commission arbitrage
 * ai-autonomous  — AI has full control, no strategy guidance
 * multi-agent-consensus — Jury of multiple agents voting
 * alpha-beta     — Zero guidance, fully autonomous AI decision
 */
export type TradingStrategy =
  | "conservative"
  | "balanced"
  | "aggressive"
  | "aggressive-team"
  | "ultra-short"
  | "swing-trend"
  | "medium-long"
  | "rebate-farming"
  | "ai-autonomous"
  | "multi-agent-consensus"
  | "alpha-beta";

/** Context passed to strategy prompt generators at runtime */
export interface StrategyPromptContext {
  intervalMinutes: number;
  maxPositions: number;
  extremeStopLossPercent: number;
  maxHoldingHours: number;
  tradingSymbols: string[];
}

/** Full strategy parameter configuration */
export interface StrategyParams {
  name: string;
  description: string;
  leverageMin: number;
  leverageMax: number;
  leverageRecommend: {
    normal: string;
    good: string;
    strong: string;
  };
  positionSizeMin: number;
  positionSizeMax: number;
  maxTotalMarginPercent?: number;
  positionSizeRecommend: {
    normal: string;
    good: string;
    strong: string;
  };
  stopLoss: {
    low: number;
    mid: number;
    high: number;
  };
  trailingStop: {
    level1: { trigger: number; stopAt: number };
    level2: { trigger: number; stopAt: number };
    level3: { trigger: number; stopAt: number };
  };
  partialTakeProfit: {
    stage1: { trigger: number; closePercent: number };
    stage2: { trigger: number; closePercent: number };
    stage3: { trigger: number; closePercent: number };
  };
  peakDrawdownProtection: number;
  volatilityAdjustment: {
    highVolatility: { leverageFactor: number; positionFactor: number };
    normalVolatility: { leverageFactor: number; positionFactor: number };
    lowVolatility: { leverageFactor: number; positionFactor: number };
  };
  entryCondition: string;
  riskTolerance: string;
  tradingStyle: string;
  enableCodeLevelProtection: boolean;
  allowAiOverrideProtection?: boolean;
  maxIdleHours?: number;
}

/** Metadata for UI display */
export interface StrategyInfo {
  id: TradingStrategy;
  name: string;
  description: string;
  riskLevel: "low" | "medium" | "medium-high" | "high" | "very-high" | "ai-controlled";
  defaultInterval: number;
  icon: string;
}
