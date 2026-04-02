// ============================================
// BROKIAX — Strategy Index (11 Strategies)
// Master selector and prompt generator
// Adapted from nof1.ai with Brokiax branding
// ============================================

import { TradingStrategy, StrategyParams, StrategyPromptContext, StrategyInfo } from "./types";
import { getConservativeParams, generateConservativePrompt } from "./conservative";
import { getBalancedParams, generateBalancedPrompt } from "./balanced";
import { getAggressiveParams, generateAggressivePrompt } from "./aggressive";
import { getAggressiveTeamParams, generateAggressiveTeamPrompt } from "./aggressiveTeam";
import { getUltraShortParams, generateUltraShortPrompt } from "./ultraShort";
import { getSwingTrendParams, generateSwingTrendPrompt } from "./swingTrend";
import { getMediumLongParams, generateMediumLongPrompt } from "./mediumLong";
import { getRebateFarmingParams, generateRebateFarmingPrompt } from "./rebateFarming";
import { getAiAutonomousParams, generateAiAutonomousPrompt } from "./aiAutonomous";
import { getMultiAgentConsensusParams, generateMultiAgentConsensusPrompt } from "./multiAgentConsensus";
import { getAlphaBetaParams, generateAlphaBetaPrompt } from "./alphaBeta";

export type { TradingStrategy, StrategyParams, StrategyPromptContext, StrategyInfo };

// ─── Strategy Metadata for UI ────────────────────────────────────────────────

export const STRATEGY_INFO: Record<TradingStrategy, StrategyInfo> = {
  conservative: {
    id: "conservative",
    name: "Conservadora",
    description: "Bajo riesgo, stops amplios. Preservar capital.",
    riskLevel: "low",
    defaultInterval: 20,
    icon: "🛡️",
  },
  balanced: {
    id: "balanced",
    name: "Equilibrada",
    description: "Balance óptimo riesgo/beneficio. Recomendada.",
    riskLevel: "medium",
    defaultInterval: 15,
    icon: "⚖️",
  },
  aggressive: {
    id: "aggressive",
    name: "Agresiva",
    description: "Alto leverage, stops ajustados. Traders expertos.",
    riskLevel: "high",
    defaultInterval: 10,
    icon: "🔥",
  },
  "aggressive-team": {
    id: "aggressive-team",
    name: "Equipo Agresivo",
    description: "Líder + 2 scouts coordinados. Asalto rápido.",
    riskLevel: "very-high",
    defaultInterval: 5,
    icon: "⚔️",
  },
  "ultra-short": {
    id: "ultra-short",
    name: "Ultra-Corta (Scalping)",
    description: "Scalping 5min. Micro-movimientos rápidos.",
    riskLevel: "medium-high",
    defaultInterval: 5,
    icon: "⚡",
  },
  "swing-trend": {
    id: "swing-trend",
    name: "Swing / Tendencia",
    description: "Capturas de tendencia multi-día. Protección automática.",
    riskLevel: "medium",
    defaultInterval: 20,
    icon: "📈",
  },
  "medium-long": {
    id: "medium-long",
    name: "Medio-Largo Plazo",
    description: "Posiciones de semanas. IA con máxima autonomía.",
    riskLevel: "low",
    defaultInterval: 30,
    icon: "🏗️",
  },
  "rebate-farming": {
    id: "rebate-farming",
    name: "Rebate Farming",
    description: "Alta frecuencia para comisiones maker.",
    riskLevel: "medium",
    defaultInterval: 3,
    icon: "💰",
  },
  "ai-autonomous": {
    id: "ai-autonomous",
    name: "IA Autónoma",
    description: "Control total de la IA. Sin restricciones de estrategia.",
    riskLevel: "ai-controlled",
    defaultInterval: 15,
    icon: "🤖",
  },
  "multi-agent-consensus": {
    id: "multi-agent-consensus",
    name: "Consenso Multi-Agente",
    description: "Jurado IA: múltiples agentes votan, moderador sintetiza.",
    riskLevel: "medium",
    defaultInterval: 15,
    icon: "🗳️",
  },
  "alpha-beta": {
    id: "alpha-beta",
    name: "Alpha-Beta",
    description: "Zero guidance. Prueba la capacidad raw del modelo.",
    riskLevel: "ai-controlled",
    defaultInterval: 15,
    icon: "🧠",
  },
};

// ─── Strategy Selector ───────────────────────────────────────────────────────

const STRATEGY_PARAMS_MAP: Record<TradingStrategy, (maxLeverage: number) => StrategyParams> = {
  conservative: getConservativeParams,
  balanced: getBalancedParams,
  aggressive: getAggressiveParams,
  "aggressive-team": getAggressiveTeamParams,
  "ultra-short": getUltraShortParams,
  "swing-trend": getSwingTrendParams,
  "medium-long": getMediumLongParams,
  "rebate-farming": getRebateFarmingParams,
  "ai-autonomous": getAiAutonomousParams,
  "multi-agent-consensus": getMultiAgentConsensusParams,
  "alpha-beta": getAlphaBetaParams,
};

const STRATEGY_PROMPT_MAP: Record<TradingStrategy, (params: StrategyParams, ctx: StrategyPromptContext) => string> = {
  conservative: generateConservativePrompt,
  balanced: generateBalancedPrompt,
  aggressive: generateAggressivePrompt,
  "aggressive-team": generateAggressiveTeamPrompt,
  "ultra-short": generateUltraShortPrompt,
  "swing-trend": generateSwingTrendPrompt,
  "medium-long": generateMediumLongPrompt,
  "rebate-farming": generateRebateFarmingPrompt,
  "ai-autonomous": generateAiAutonomousPrompt,
  "multi-agent-consensus": generateMultiAgentConsensusPrompt,
  "alpha-beta": generateAlphaBetaPrompt,
};

/**
 * Get strategy parameters for a given strategy type.
 * @param strategy - The strategy type (e.g., "conservative", "balanced", etc.)
 * @param maxLeverage - The maximum leverage allowed by the exchange (default 125)
 */
export function getStrategyParams(strategy: TradingStrategy, maxLeverage = 125): StrategyParams {
  const getter = STRATEGY_PARAMS_MAP[strategy];
  if (!getter) throw new Error(`Estrategia desconocida: ${strategy}`);
  return getter(maxLeverage);
}

/**
 * Generate a strategy-specific AI prompt to inject into the LLM system prompt.
 * @param strategy - The strategy type
 * @param maxLeverage - Max leverage from exchange
 * @param context - Runtime context (interval, max positions, symbols, etc.)
 */
export function generateStrategyPrompt(
  strategy: TradingStrategy,
  maxLeverage: number,
  context: StrategyPromptContext
): string {
  const params = getStrategyParams(strategy, maxLeverage);
  const promptGenerator = STRATEGY_PROMPT_MAP[strategy];
  if (!promptGenerator) throw new Error(`Generador de prompt no encontrado para: ${strategy}`);
  return promptGenerator(params, context);
}

/**
 * Get all available strategies for UI display.
 */
export function getAllStrategies(): StrategyInfo[] {
  return Object.values(STRATEGY_INFO);
}
