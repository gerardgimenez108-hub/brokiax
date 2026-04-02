// ============================================
// BROKIAX — Advanced Risk Management System
// Adapted from nof1.ai drawdown management
// ============================================

import { StrategyParams } from "@/lib/strategies/types";
import { LLMDecision } from "@/lib/types";

// ─── Account-Level Drawdown Thresholds ──────────────────────────────────────

export interface DrawdownConfig {
  /** Warn the AI that account is losing (default: 20% drawdown) */
  warningThreshold: number;
  /** Stop opening new positions (default: 30% drawdown) */
  noNewPositionsThreshold: number;
  /** Force close ALL positions (default: 50% drawdown) */
  forceCloseThreshold: number;
}

export const DEFAULT_DRAWDOWN_CONFIG: DrawdownConfig = {
  warningThreshold: 20,
  noNewPositionsThreshold: 30,
  forceCloseThreshold: 50,
};

// ─── Trader State for Risk Checks ───────────────────────────────────────────

export interface TraderRiskState {
  initialCapital: number;
  currentEquity: number;
  peakEquity: number;
  currentPnlPercent: number;
  openPositions: number;
  lastTradeAt: Date | null;
  positionPnlPercent?: number; // Current position's unrealized PnL %
  positionPeakPnl?: number;   // Position's highest PnL reached
}

// ─── Risk Validation Result ─────────────────────────────────────────────────

export type RiskAction = "approve" | "reject" | "warn" | "force-close";

export interface RiskValidationResult {
  action: RiskAction;
  reason: string;
  warningMessage?: string;          // Message to inject into AI prompt
  adjustedLeverage?: number;        // Volatility-adjusted leverage
  adjustedPositionSize?: number;    // Volatility-adjusted position size
}

// ─── Main Risk Validator ────────────────────────────────────────────────────

/**
 * Validates a trade decision against strategy risk parameters and account state.
 * Returns whether to approve, reject, warn, or force-close.
 */
export function validateTradeDecision(
  decision: LLMDecision,
  state: TraderRiskState,
  params: StrategyParams,
  drawdownConfig: DrawdownConfig = DEFAULT_DRAWDOWN_CONFIG
): RiskValidationResult {
  // 1. Check Account-Level Drawdown
  const accountDrawdown = state.initialCapital > 0
    ? ((state.initialCapital - state.currentEquity) / state.initialCapital) * 100
    : 0;

  if (accountDrawdown >= drawdownConfig.forceCloseThreshold) {
    return {
      action: "force-close",
      reason: `DRAWDOWN CRÍTICO: Cuenta ha perdido ${accountDrawdown.toFixed(1)}% (umbral: ${drawdownConfig.forceCloseThreshold}%). CIERRE FORZOSO de todas las posiciones.`,
    };
  }

  if (accountDrawdown >= drawdownConfig.noNewPositionsThreshold && decision.action === "BUY") {
    return {
      action: "reject",
      reason: `DRAWDOWN ALTO: Cuenta ha perdido ${accountDrawdown.toFixed(1)}% (umbral: ${drawdownConfig.noNewPositionsThreshold}%). No se permiten nuevas posiciones.`,
    };
  }

  // 2. Check Peak Drawdown Protection (position level)
  if (state.positionPeakPnl !== undefined && state.positionPnlPercent !== undefined) {
    const peakRetracement = state.positionPeakPnl - state.positionPnlPercent;
    if (state.positionPeakPnl > 0 && peakRetracement >= params.peakDrawdownProtection) {
      return {
        action: "force-close",
        reason: `PEAK DRAWDOWN: Posición retrocedió ${peakRetracement.toFixed(1)}% desde pico de +${state.positionPeakPnl.toFixed(1)}% (protección: ${params.peakDrawdownProtection}%). Cerrar posición.`,
      };
    }
  }

  // 3. Check Max Idle Hours
  if (params.maxIdleHours && state.lastTradeAt) {
    const hoursSinceLastTrade = (Date.now() - state.lastTradeAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastTrade >= params.maxIdleHours && decision.action === "HOLD") {
      return {
        action: "warn",
        reason: `IDLE WARNING: Han pasado ${hoursSinceLastTrade.toFixed(1)}h sin operar (max: ${params.maxIdleHours}h). Se recomienda buscar entrada.`,
        warningMessage: `⚠️ ALERTA: Llevas ${hoursSinceLastTrade.toFixed(1)}h sin operar. El máximo de inactividad es ${params.maxIdleHours}h. DEBES buscar una entrada activamente.`,
      };
    }
  }

  // 4. Check Max Positions
  if (decision.action === "BUY" && state.openPositions >= params.positionSizeMax) {
    return {
      action: "reject",
      reason: `MAX POSICIONES: Ya tienes ${state.openPositions} posiciones abiertas.`,
    };
  }

  // 5. Account drawdown warning
  let warningMessage: string | undefined;
  if (accountDrawdown >= drawdownConfig.warningThreshold) {
    warningMessage = `⚠️ ALERTA DRAWDOWN: La cuenta ha perdido ${accountDrawdown.toFixed(1)}% del capital inicial. Reducir exposición y ser más selectivo con entradas.`;
  }

  return {
    action: warningMessage ? "warn" : "approve",
    reason: warningMessage || "Trade aprobado por el sistema de riesgo.",
    warningMessage,
  };
}

// ─── Trailing Stop Manager ──────────────────────────────────────────────────

export interface TrailingStopState {
  currentStopPercent: number | null; // Current trailing stop level
  highestLevel: number;              // Highest trailing level triggered (1, 2, or 3)
}

/**
 * Calculate the current trailing stop level based on position PnL.
 * Returns the new stop level or null if no trailing stop is active.
 */
export function calculateTrailingStop(
  positionPnlPercent: number,
  params: StrategyParams,
  currentState: TrailingStopState = { currentStopPercent: null, highestLevel: 0 }
): TrailingStopState {
  const { trailingStop } = params;
  let { currentStopPercent, highestLevel } = currentState;

  // Check Level 3 first (highest priority)
  if (positionPnlPercent >= trailingStop.level3.trigger && highestLevel < 3) {
    currentStopPercent = trailingStop.level3.stopAt;
    highestLevel = 3;
  }
  // Check Level 2
  else if (positionPnlPercent >= trailingStop.level2.trigger && highestLevel < 2) {
    currentStopPercent = trailingStop.level2.stopAt;
    highestLevel = 2;
  }
  // Check Level 1
  else if (positionPnlPercent >= trailingStop.level1.trigger && highestLevel < 1) {
    currentStopPercent = trailingStop.level1.stopAt;
    highestLevel = 1;
  }

  return { currentStopPercent, highestLevel };
}

/**
 * Check if a position should be closed due to trailing stop being hit.
 */
export function isTrailingStopTriggered(
  positionPnlPercent: number,
  trailingState: TrailingStopState
): boolean {
  if (trailingState.currentStopPercent === null) return false;
  return positionPnlPercent <= trailingState.currentStopPercent;
}

// ─── Partial Take Profit Manager ────────────────────────────────────────────

export interface PartialTPState {
  stage1Executed: boolean;
  stage2Executed: boolean;
  stage3Executed: boolean;
}

/**
 * Check if any partial take profit stage should be executed.
 * Returns the close percentage (0-100) and which stage, or null if none.
 */
export function checkPartialTakeProfit(
  positionPnlPercent: number,
  params: StrategyParams,
  state: PartialTPState = { stage1Executed: false, stage2Executed: false, stage3Executed: false }
): { stage: number; closePercent: number } | null {
  const { partialTakeProfit: ptp } = params;

  if (!state.stage3Executed && positionPnlPercent >= ptp.stage3.trigger) {
    return { stage: 3, closePercent: ptp.stage3.closePercent };
  }
  if (!state.stage2Executed && positionPnlPercent >= ptp.stage2.trigger) {
    return { stage: 2, closePercent: ptp.stage2.closePercent };
  }
  if (!state.stage1Executed && positionPnlPercent >= ptp.stage1.trigger) {
    return { stage: 1, closePercent: ptp.stage1.closePercent };
  }

  return null;
}

// ─── Volatility Adjuster ────────────────────────────────────────────────────

export type VolatilityRegime = "high" | "normal" | "low";

/**
 * Determine the current volatility regime based on ATR percentage.
 */
export function getVolatilityRegime(atrPercent: number): VolatilityRegime {
  if (atrPercent > 5) return "high";
  if (atrPercent < 2) return "low";
  return "normal";
}

/**
 * Adjust leverage and position size based on current volatility.
 */
export function applyVolatilityAdjustment(
  baseLeverage: number,
  basePositionSizePercent: number,
  atrPercent: number,
  params: StrategyParams
): { adjustedLeverage: number; adjustedPositionSize: number; regime: VolatilityRegime } {
  const regime = getVolatilityRegime(atrPercent);
  const adj = regime === "high"
    ? params.volatilityAdjustment.highVolatility
    : regime === "low"
    ? params.volatilityAdjustment.lowVolatility
    : params.volatilityAdjustment.normalVolatility;

  return {
    adjustedLeverage: Math.round(baseLeverage * adj.leverageFactor),
    adjustedPositionSize: Math.round(basePositionSizePercent * adj.positionFactor * 100) / 100,
    regime,
  };
}

// ─── Stop-Loss Checker ──────────────────────────────────────────────────────

/**
 * Get the appropriate stop-loss level based on the leverage being used.
 */
export function getStopLossLevel(leverage: number, params: StrategyParams): number {
  if (leverage <= 5) return params.stopLoss.low;
  if (leverage <= 15) return params.stopLoss.mid;
  return params.stopLoss.high;
}

/**
 * Check if a position should be stopped out.
 */
export function isStopLossTriggered(
  positionPnlPercent: number,
  leverage: number,
  params: StrategyParams
): boolean {
  const stopLevel = getStopLossLevel(leverage, params);
  return positionPnlPercent <= stopLevel;
}

// ─── Generate Risk Warning for AI Prompt ────────────────────────────────────

/**
 * Generate risk context to inject into the AI's system prompt.
 */
export function generateRiskPromptContext(
  state: TraderRiskState,
  params: StrategyParams,
  drawdownConfig: DrawdownConfig = DEFAULT_DRAWDOWN_CONFIG
): string {
  const lines: string[] = ["### ESTADO DE RIESGO DE LA CUENTA"];

  const accountDrawdown = state.initialCapital > 0
    ? ((state.initialCapital - state.currentEquity) / state.initialCapital) * 100
    : 0;

  lines.push(`- Capital inicial: $${state.initialCapital.toFixed(2)}`);
  lines.push(`- Equity actual: $${state.currentEquity.toFixed(2)}`);
  lines.push(`- Peak equity: $${state.peakEquity.toFixed(2)}`);
  lines.push(`- Drawdown de cuenta: ${accountDrawdown.toFixed(1)}%`);
  lines.push(`- Posiciones abiertas: ${state.openPositions}`);

  if (accountDrawdown >= drawdownConfig.warningThreshold) {
    lines.push(`\n⚠️ ALERTA: Drawdown ${accountDrawdown.toFixed(1)}% — Reducir riesgo obligatorio.`);
  }
  if (accountDrawdown >= drawdownConfig.noNewPositionsThreshold) {
    lines.push(`🚫 PROHIBIDO: No abrir nuevas posiciones hasta que el drawdown baje del ${drawdownConfig.noNewPositionsThreshold}%.`);
  }

  if (state.positionPnlPercent !== undefined) {
    lines.push(`\n- PnL posición actual: ${state.positionPnlPercent.toFixed(2)}%`);
    if (state.positionPeakPnl !== undefined) {
      lines.push(`- Peak PnL posición: ${state.positionPeakPnl.toFixed(2)}%`);
      const retracement = state.positionPeakPnl - state.positionPnlPercent;
      if (retracement > 0) {
        lines.push(`- Retroceso desde peak: ${retracement.toFixed(2)}% (protección: ${params.peakDrawdownProtection}%)`);
      }
    }
  }

  if (params.maxIdleHours && state.lastTradeAt) {
    const hoursSinceLastTrade = (Date.now() - state.lastTradeAt.getTime()) / (1000 * 60 * 60);
    lines.push(`\n- Horas desde último trade: ${hoursSinceLastTrade.toFixed(1)}h (max idle: ${params.maxIdleHours}h)`);
  }

  return lines.join("\n");
}
