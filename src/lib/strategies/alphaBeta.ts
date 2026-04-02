import { StrategyParams, StrategyPromptContext } from "./types";

export function getAlphaBetaParams(maxLeverage: number): StrategyParams {
  const lMax = Math.min(20, maxLeverage);
  return {
    name: "Alpha-Beta (Zero Guidance)",
    description: "Sin ninguna guía estratégica. La IA opera con zero instrucciones. Prueba la capacidad raw del modelo.",
    leverageMin: 1, leverageMax: lMax,
    leverageRecommend: { normal: "IA decide", good: "IA decide", strong: "IA decide" },
    positionSizeMin: 5, positionSizeMax: 35,
    positionSizeRecommend: { normal: "IA decide", good: "IA decide", strong: "IA decide" },
    stopLoss: { low: -5, mid: -4, high: -3 },
    trailingStop: {
      level1: { trigger: 3, stopAt: 0 },
      level2: { trigger: 6, stopAt: 2 },
      level3: { trigger: 10, stopAt: 5 },
    },
    partialTakeProfit: {
      stage1: { trigger: 4, closePercent: 30 },
      stage2: { trigger: 8, closePercent: 60 },
      stage3: { trigger: 15, closePercent: 100 },
    },
    peakDrawdownProtection: 4,
    volatilityAdjustment: {
      highVolatility: { leverageFactor: 1.0, positionFactor: 1.0 },
      normalVolatility: { leverageFactor: 1.0, positionFactor: 1.0 },
      lowVolatility: { leverageFactor: 1.0, positionFactor: 1.0 },
    },
    entryCondition: "Sin guía — la IA decide absolutamente todo",
    riskTolerance: "Sin guía — la IA gestiona riesgo por sí misma",
    tradingStyle: "Sin guía — cero instrucciones de estilo",
    enableCodeLevelProtection: true,
    allowAiOverrideProtection: true,
    maxIdleHours: 6,
  };
}

export function generateAlphaBetaPrompt(params: StrategyParams, ctx: StrategyPromptContext): string {
  return `## ESTRATEGIA: ${params.name} (ZERO GUIDANCE)
${params.description}

### ZERO INSTRUCTIONS: No se te proporciona ninguna guía estratégica.
Tu trabajo es analizar el mercado con tus propias técnicas y tomar decisiones autónomas.

### LIMITACIONES HARD del sistema (no negociables):
- Leverage máximo: ${params.leverageMax}x
- Stop-loss de sistema: ${ctx.extremeStopLossPercent}%
- Max posiciones: ${ctx.maxPositions}
- Max holding: ${ctx.maxHoldingHours}h
- Max inactividad: ${params.maxIdleHours}h (DEBES operar al menos cada ${params.maxIdleHours}h)
- Drawdown: ${params.peakDrawdownProtection}% desde pico → cierre automático

### DEMUESTRA de qué eres capaz sin ninguna guía humana.
### Pares: ${ctx.tradingSymbols.join(", ")} | Intervalo: ${ctx.intervalMinutes}min`;
}
