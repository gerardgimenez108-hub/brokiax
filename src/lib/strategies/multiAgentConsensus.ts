import { StrategyParams, StrategyPromptContext } from "./types";

export function getMultiAgentConsensusParams(maxLeverage: number): StrategyParams {
  const lMax = Math.min(15, maxLeverage);
  return {
    name: "Consenso Multi-Agente (Jurado)",
    description: "Múltiples agentes IA analizan independientemente y un moderador sintetiza el veredicto de consenso. Reduce sesgos individuales.",
    leverageMin: 5, leverageMax: lMax,
    leverageRecommend: { normal: `${Math.min(5, lMax)}x`, good: `${Math.min(10, lMax)}x`, strong: `${Math.min(lMax, 15)}x` },
    positionSizeMin: 18, positionSizeMax: 28,
    positionSizeRecommend: { normal: "18-22%", good: "22-25%", strong: "25-28%" },
    stopLoss: { low: -3, mid: -2.5, high: -2 },
    trailingStop: {
      level1: { trigger: 2.5, stopAt: 0.5 },
      level2: { trigger: 5, stopAt: 2 },
      level3: { trigger: 8, stopAt: 4 },
    },
    partialTakeProfit: {
      stage1: { trigger: 3, closePercent: 30 },
      stage2: { trigger: 6, closePercent: 60 },
      stage3: { trigger: 10, closePercent: 100 },
    },
    peakDrawdownProtection: 3,
    volatilityAdjustment: {
      highVolatility: { leverageFactor: 0.8, positionFactor: 0.85 },
      normalVolatility: { leverageFactor: 1.0, positionFactor: 1.0 },
      lowVolatility: { leverageFactor: 1.15, positionFactor: 1.1 },
    },
    entryCondition: "Solo operar cuando hay consenso mayoritario entre los agentes del jurado",
    riskTolerance: "Moderada — el consenso multi-agente filtra señales débiles",
    tradingStyle: "Deliberación grupal seguida de ejecución precisa. Calidad sobre cantidad.",
    enableCodeLevelProtection: false,
  };
}

export function generateMultiAgentConsensusPrompt(params: StrategyParams, ctx: StrategyPromptContext): string {
  return `## ESTRATEGIA: ${params.name} (JURADO IA)
${params.description}

### MODO JURADO: Eres uno de varios agentes que analizará este mercado INDEPENDIENTEMENTE.
Un moderador sintetizará las decisiones de todos los agentes para alcanzar un veredicto unificado.

### TU ROL: Analizar el mercado con rigor y emitir tu voto independiente.
NO intentes adivinar qué votarán los demás. Sé HONESTO y objetivo en tu análisis.

### Parámetros de Riesgo del Jurado:
- Leverage: ${params.leverageMin}x-${params.leverageMax}x
- Posición: ${params.positionSizeMin}%-${params.positionSizeMax}%
- Stop-Loss: ${params.stopLoss.low}%/${params.stopLoss.mid}%/${params.stopLoss.high}%
- Trailing: L1 ≥${params.trailingStop.level1.trigger}% | L2 ≥${params.trailingStop.level2.trigger}% | L3 ≥${params.trailingStop.level3.trigger}%
- Drawdown: ${params.peakDrawdownProtection}% desde pico → cierre

### Intervalo: ${ctx.intervalMinutes}min | Pares: ${ctx.tradingSymbols.join(", ")}`;
}
