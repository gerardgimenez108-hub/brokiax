import { StrategyParams, StrategyPromptContext } from "./types";

export function getAggressiveParams(maxLeverage: number): StrategyParams {
  const lMax = Math.min(25, maxLeverage);
  return {
    name: "Agresiva",
    description: "Alto riesgo, alto rendimiento. Leverage elevado con stops ajustados. Para traders experimentados.",
    leverageMin: 15, leverageMax: lMax,
    leverageRecommend: { normal: `${Math.min(15, lMax)}x`, good: `${Math.min(19, lMax)}x`, strong: `${Math.min(lMax, 25)}x` },
    positionSizeMin: 25, positionSizeMax: 32,
    positionSizeRecommend: { normal: "25-28%", good: "28-30%", strong: "30-32%" },
    stopLoss: { low: -2.5, mid: -2, high: -1.5 },
    trailingStop: {
      level1: { trigger: 2, stopAt: 0 },
      level2: { trigger: 4, stopAt: 1.5 },
      level3: { trigger: 6, stopAt: 3 },
    },
    partialTakeProfit: {
      stage1: { trigger: 2.5, closePercent: 30 },
      stage2: { trigger: 4.5, closePercent: 60 },
      stage3: { trigger: 7, closePercent: 100 },
    },
    peakDrawdownProtection: 2,
    volatilityAdjustment: {
      highVolatility: { leverageFactor: 0.75, positionFactor: 0.8 },
      normalVolatility: { leverageFactor: 1.0, positionFactor: 1.0 },
      lowVolatility: { leverageFactor: 1.2, positionFactor: 1.1 },
    },
    entryCondition: "Señales técnicas claras con momentum fuerte confirmado por volumen",
    riskTolerance: "Alta — maximizar retorno aceptando mayor riesgo",
    tradingStyle: "Frecuencia alta, capturar movimientos significativos con leverage elevado",
    enableCodeLevelProtection: false,
  };
}

export function generateAggressivePrompt(params: StrategyParams, ctx: StrategyPromptContext): string {
  return `## ESTRATEGIA: ${params.name} (ALTO RIESGO)
${params.description}

### Leverage: ${params.leverageMin}x - ${params.leverageMax}x (Normal: ${params.leverageRecommend.normal} | Fuerte: ${params.leverageRecommend.strong})
### Posición: ${params.positionSizeMin}%-${params.positionSizeMax}% equity | Max: ${ctx.maxPositions} simultáneas
### Stop-Loss ESTRICTO: Low: ${params.stopLoss.low}% | Mid: ${params.stopLoss.mid}% | High: ${params.stopLoss.high}%

### Trailing Stop: L1 ≥${params.trailingStop.level1.trigger}%→${params.trailingStop.level1.stopAt}% | L2 ≥${params.trailingStop.level2.trigger}%→${params.trailingStop.level2.stopAt}% | L3 ≥${params.trailingStop.level3.trigger}%→${params.trailingStop.level3.stopAt}%
### TP Parcial: E1 ${params.partialTakeProfit.stage1.trigger}%→${params.partialTakeProfit.stage1.closePercent}% | E2 ${params.partialTakeProfit.stage2.trigger}%→${params.partialTakeProfit.stage2.closePercent}% | E3 ${params.partialTakeProfit.stage3.trigger}%→${params.partialTakeProfit.stage3.closePercent}%
### Peak Drawdown: ${params.peakDrawdownProtection}% → cierre
### CLAVE: Los stops son MÁS ajustados por el alto leverage. Ejecución disciplinada obligatoria.
### Intervalo: ${ctx.intervalMinutes}min | Pares: ${ctx.tradingSymbols.join(", ")}`;
}
