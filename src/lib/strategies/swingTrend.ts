import { StrategyParams, StrategyPromptContext } from "./types";

export function getSwingTrendParams(maxLeverage: number): StrategyParams {
  const lMax = Math.min(12, maxLeverage);
  return {
    name: "Swing / Tendencia",
    description: "Ciclo 20 min. Captura movimientos de tendencia de días a semanas. Protección automatizada por código.",
    leverageMin: 5, leverageMax: lMax,
    leverageRecommend: { normal: `${Math.min(5, lMax)}x`, good: `${Math.min(8, lMax)}x`, strong: `${Math.min(lMax, 12)}x` },
    positionSizeMin: 18, positionSizeMax: 28,
    positionSizeRecommend: { normal: "18-22%", good: "22-25%", strong: "25-28%" },
    stopLoss: { low: -4, mid: -3.5, high: -3 },
    trailingStop: {
      level1: { trigger: 4, stopAt: 1 },
      level2: { trigger: 7, stopAt: 3 },
      level3: { trigger: 12, stopAt: 6 },
    },
    partialTakeProfit: {
      stage1: { trigger: 5, closePercent: 25 },
      stage2: { trigger: 8, closePercent: 50 },
      stage3: { trigger: 15, closePercent: 100 },
    },
    peakDrawdownProtection: 4,
    volatilityAdjustment: {
      highVolatility: { leverageFactor: 0.75, positionFactor: 0.8 },
      normalVolatility: { leverageFactor: 1.0, positionFactor: 1.0 },
      lowVolatility: { leverageFactor: 1.2, positionFactor: 1.15 },
    },
    entryCondition: "Tendencia confirmada por EMA crossover + MACD + volumen creciente en timeframe superior",
    riskTolerance: "Moderada — aguantar pullbacks normales dentro de tendencia",
    tradingStyle: "Pocas operaciones, mantener posiciones días/semanas siguiendo tendencia",
    enableCodeLevelProtection: true,
  };
}

export function generateSwingTrendPrompt(params: StrategyParams, ctx: StrategyPromptContext): string {
  return `## ESTRATEGIA: ${params.name} (SWING MULTI-DÍA)
${params.description}

### FILOSOFÍA: Identificar tendencias sólidas y mantener posición. NO operar contra-tendencia.
### Leverage conservador: ${params.leverageMin}x-${params.leverageMax}x | Posición: ${params.positionSizeMin}%-${params.positionSizeMax}%
### Stop-Loss amplio (swing): ${params.stopLoss.low}%/${params.stopLoss.mid}%/${params.stopLoss.high}%
### Trailing amplio: L1 ≥${params.trailingStop.level1.trigger}%→${params.trailingStop.level1.stopAt}% | L2 ≥${params.trailingStop.level2.trigger}%→${params.trailingStop.level2.stopAt}% | L3 ≥${params.trailingStop.level3.trigger}%→${params.trailingStop.level3.stopAt}%
### TP gradual: E1 ${params.partialTakeProfit.stage1.trigger}%→${params.partialTakeProfit.stage1.closePercent}% | E2 ${params.partialTakeProfit.stage2.trigger}%→${params.partialTakeProfit.stage2.closePercent}% | E3 ${params.partialTakeProfit.stage3.trigger}%→${params.partialTakeProfit.stage3.closePercent}%
### NOTA: Protección de código activa — el sistema monitoriza stops automáticamente cada 10s.
### Drawdown: ${params.peakDrawdownProtection}% desde pico
### Intervalo: ${ctx.intervalMinutes}min | Pares: ${ctx.tradingSymbols.join(", ")}`;
}
