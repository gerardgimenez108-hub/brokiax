import { StrategyParams, StrategyPromptContext } from "./types";

export function getAiAutonomousParams(maxLeverage: number): StrategyParams {
  const lMax = Math.min(20, maxLeverage);
  return {
    name: "IA Autónoma",
    description: "La IA tiene control TOTAL. No se proporcionan reglas de estrategia. La IA utiliza su propio juicio para todo.",
    leverageMin: 1, leverageMax: lMax,
    leverageRecommend: { normal: "IA decide", good: "IA decide", strong: "IA decide" },
    positionSizeMin: 5, positionSizeMax: 40,
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
    entryCondition: "La IA decide completamente cuándo entrar basándose en su propio análisis",
    riskTolerance: "La IA gestiona su propio riesgo",
    tradingStyle: "Completamente autónomo — la IA define su propio estilo",
    enableCodeLevelProtection: true,
    allowAiOverrideProtection: true,
  };
}

export function generateAiAutonomousPrompt(params: StrategyParams, ctx: StrategyPromptContext): string {
  return `## ESTRATEGIA: ${params.name} (AUTONOMÍA TOTAL)
${params.description}

### LIBERTAD TOTAL: No tienes restricciones de estrategia. Tú decides TODO:
- Cuándo entrar y salir
- Qué leverage usar (1x a ${params.leverageMax}x)
- Qué tamaño de posición (${params.positionSizeMin}% a ${params.positionSizeMax}%)
- Tu propio estilo de trading

### ÚNICAS RESTRICCIONES DEL SISTEMA (inquebrantables):
- Stop-loss de seguridad: ${ctx.extremeStopLossPercent}%
- Max posiciones: ${ctx.maxPositions}
- Max holding: ${ctx.maxHoldingHours}h
- Drawdown máximo: ${params.peakDrawdownProtection}% desde pico

### NOTA: Protección de código activa como red de seguridad. Tú también puedes cerrar posiciones proactivamente.
### DEMUESTRA TU CAPACIDAD de análisis independiente y toma de decisiones autónoma.
### Pares disponibles: ${ctx.tradingSymbols.join(", ")}
### Intervalo: ${ctx.intervalMinutes}min`;
}
