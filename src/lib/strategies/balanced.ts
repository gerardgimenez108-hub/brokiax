import { StrategyParams, StrategyPromptContext } from "./types";

export function getBalancedParams(maxLeverage: number): StrategyParams {
  const lMax = Math.min(15, maxLeverage);
  return {
    name: "Equilibrada",
    description: "Riesgo medio con balance óptimo rendimiento/riesgo. Recomendada para la mayoría de traders.",
    leverageMin: 8, leverageMax: lMax,
    leverageRecommend: { normal: `${Math.min(8, lMax)}x`, good: `${Math.min(12, lMax)}x`, strong: `${Math.min(lMax, 15)}x` },
    positionSizeMin: 20, positionSizeMax: 30,
    positionSizeRecommend: { normal: "20-24%", good: "24-27%", strong: "27-30%" },
    stopLoss: { low: -3, mid: -2.5, high: -2 },
    trailingStop: {
      level1: { trigger: 2.5, stopAt: 0.3 },
      level2: { trigger: 4.5, stopAt: 1.5 },
      level3: { trigger: 7, stopAt: 3.5 },
    },
    partialTakeProfit: {
      stage1: { trigger: 3, closePercent: 30 },
      stage2: { trigger: 5, closePercent: 60 },
      stage3: { trigger: 8, closePercent: 100 },
    },
    peakDrawdownProtection: 2.5,
    volatilityAdjustment: {
      highVolatility: { leverageFactor: 0.8, positionFactor: 0.85 },
      normalVolatility: { leverageFactor: 1.0, positionFactor: 1.0 },
      lowVolatility: { leverageFactor: 1.15, positionFactor: 1.1 },
    },
    entryCondition: "Entrar con confluencia de 2+ indicadores y tendencia definida",
    riskTolerance: "Moderada — buscar equilibrio entre rentabilidad y protección",
    tradingStyle: "Frecuencia media, operaciones selectivas con buen ratio riesgo/beneficio",
    enableCodeLevelProtection: false,
  };
}

export function generateBalancedPrompt(params: StrategyParams, ctx: StrategyPromptContext): string {
  return `## ESTRATEGIA: ${params.name}
${params.description}

### Leverage: ${params.leverageMin}x - ${params.leverageMax}x
Normal: ${params.leverageRecommend.normal} | Buena señal: ${params.leverageRecommend.good} | Fuerte: ${params.leverageRecommend.strong}

### Posición: ${params.positionSizeMin}% - ${params.positionSizeMax}% del equity (max ${ctx.maxPositions} posiciones)

### Stop-Loss: Low lev: ${params.stopLoss.low}% | Mid: ${params.stopLoss.mid}% | High: ${params.stopLoss.high}%

### Trailing Stop
L1: PnL ≥ ${params.trailingStop.level1.trigger}% → stop a ${params.trailingStop.level1.stopAt}%
L2: PnL ≥ ${params.trailingStop.level2.trigger}% → stop a ${params.trailingStop.level2.stopAt}%
L3: PnL ≥ ${params.trailingStop.level3.trigger}% → stop a ${params.trailingStop.level3.stopAt}%

### Take Profit Parcial
E1: ${params.partialTakeProfit.stage1.trigger}% → ${params.partialTakeProfit.stage1.closePercent}% | E2: ${params.partialTakeProfit.stage2.trigger}% → ${params.partialTakeProfit.stage2.closePercent}% | E3: ${params.partialTakeProfit.stage3.trigger}% → ${params.partialTakeProfit.stage3.closePercent}%

### Drawdown Protection: ${params.peakDrawdownProtection}% desde pico → cierre inmediato
### Condición: ${params.entryCondition}
### Intervalo: ${ctx.intervalMinutes}min | Pares: ${ctx.tradingSymbols.join(", ")}
### Sistema: Stop ${ctx.extremeStopLossPercent}% | Max hold: ${ctx.maxHoldingHours}h`;
}
