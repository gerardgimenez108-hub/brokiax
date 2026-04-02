import { StrategyParams, StrategyPromptContext } from "./types";

export function getRebateFarmingParams(maxLeverage: number): StrategyParams {
  const lMax = Math.min(10, maxLeverage);
  return {
    name: "Rebate Farming (Arbitraje Comisiones)",
    description: "Ciclo 2-3 min. Alta frecuencia de micro-trades para acumular rebates maker. Bajo profit por trade, alto volumen.",
    leverageMin: 5, leverageMax: lMax,
    leverageRecommend: { normal: `${Math.min(5, lMax)}x`, good: `${Math.min(7, lMax)}x`, strong: `${Math.min(lMax, 10)}x` },
    positionSizeMin: 30, positionSizeMax: 40,
    maxTotalMarginPercent: 60,
    positionSizeRecommend: { normal: "30-33%", good: "33-37%", strong: "37-40%" },
    stopLoss: { low: -1.5, mid: -1, high: -0.8 },
    trailingStop: {
      level1: { trigger: 0.5, stopAt: 0 },
      level2: { trigger: 1, stopAt: 0.3 },
      level3: { trigger: 2, stopAt: 0.8 },
    },
    partialTakeProfit: {
      stage1: { trigger: 0.5, closePercent: 50 },
      stage2: { trigger: 1, closePercent: 80 },
      stage3: { trigger: 1.5, closePercent: 100 },
    },
    peakDrawdownProtection: 1,
    volatilityAdjustment: {
      highVolatility: { leverageFactor: 0.6, positionFactor: 0.7 },
      normalVolatility: { leverageFactor: 1.0, positionFactor: 1.0 },
      lowVolatility: { leverageFactor: 1.3, positionFactor: 1.2 },
    },
    entryCondition: "Spreads favorables y volumen alto. Preferir mercados líquidos con maker rebates.",
    riskTolerance: "Media — el volumen alto amplifica errores, stops estrictos",
    tradingStyle: "Muy alta frecuencia, micro-profits, usar limit orders (maker) siempre que sea posible",
    enableCodeLevelProtection: false,
  };
}

export function generateRebateFarmingPrompt(params: StrategyParams, ctx: StrategyPromptContext): string {
  return `## ESTRATEGIA: ${params.name} (HIGH-FREQUENCY REBATE)
${params.description}

### OBJETIVO: Acumular rebates de comisiones maker. Profit por trade es MINÚSCULO pero volumen compensa.
### REGLA DE ORO: SIEMPRE limit orders (maker). NUNCA market orders si posible.
### Leverage: ${params.leverageMin}x-${params.leverageMax}x | Posición GRANDE: ${params.positionSizeMin}%-${params.positionSizeMax}% | Margen max: ${params.maxTotalMarginPercent}%
### Stop-Loss MÍNIMO: ${params.stopLoss.low}%/${params.stopLoss.mid}%/${params.stopLoss.high}% — un solo trade perdedor NO puede borrar 20 trades ganadores
### TP micro: ${params.partialTakeProfit.stage1.trigger}%→${params.partialTakeProfit.stage1.closePercent}% | ${params.partialTakeProfit.stage2.trigger}%→${params.partialTakeProfit.stage2.closePercent}%
### Drawdown: ${params.peakDrawdownProtection}% — cortar pérdida INMEDIATO
### Intervalo: ${ctx.intervalMinutes}min | Pares más líquidos: ${ctx.tradingSymbols.join(", ")}`;
}
