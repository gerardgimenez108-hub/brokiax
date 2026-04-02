import { StrategyParams, StrategyPromptContext } from "./types";

export function getMediumLongParams(maxLeverage: number): StrategyParams {
  const lMax = Math.min(10, maxLeverage);
  return {
    name: "Medio-Largo Plazo",
    description: "Ciclo 30min. Posiciones de días a semanas. IA con máxima autonomía y mínimas restricciones.",
    leverageMin: 3, leverageMax: lMax,
    leverageRecommend: { normal: `${Math.min(3, lMax)}x`, good: `${Math.min(5, lMax)}x`, strong: `${Math.min(lMax, 10)}x` },
    positionSizeMin: 15, positionSizeMax: 25,
    positionSizeRecommend: { normal: "15-18%", good: "18-22%", strong: "22-25%" },
    stopLoss: { low: -5, mid: -4, high: -3.5 },
    trailingStop: {
      level1: { trigger: 5, stopAt: 1.5 },
      level2: { trigger: 10, stopAt: 5 },
      level3: { trigger: 20, stopAt: 10 },
    },
    partialTakeProfit: {
      stage1: { trigger: 8, closePercent: 25 },
      stage2: { trigger: 15, closePercent: 50 },
      stage3: { trigger: 25, closePercent: 100 },
    },
    peakDrawdownProtection: 5,
    volatilityAdjustment: {
      highVolatility: { leverageFactor: 0.7, positionFactor: 0.75 },
      normalVolatility: { leverageFactor: 1.0, positionFactor: 1.0 },
      lowVolatility: { leverageFactor: 1.25, positionFactor: 1.15 },
    },
    entryCondition: "Análisis macro + tendencia en timeframes superiores (4h/1D). La IA decide libremente.",
    riskTolerance: "Baja-media — paciencia con amplio margen para fluctuación",
    tradingStyle: "Hold largo, pocas operaciones, posiciones de semanas. IA resuelve.",
    enableCodeLevelProtection: false,
  };
}

export function generateMediumLongPrompt(params: StrategyParams, ctx: StrategyPromptContext): string {
  return `## ESTRATEGIA: ${params.name} (MEDIO-LARGO)
${params.description}

### AUTONOMÍA MÁXIMA: Tienes libertad casi total para decidir. Las reglas son guías, no restricciones.
### Leverage conservador: ${params.leverageMin}x-${params.leverageMax}x | Posición: ${params.positionSizeMin}%-${params.positionSizeMax}%
### Stop-Loss amplio: ${params.stopLoss.low}%/${params.stopLoss.mid}%/${params.stopLoss.high}%
### TP targets altos: E1 ${params.partialTakeProfit.stage1.trigger}%→${params.partialTakeProfit.stage1.closePercent}% | E2 ${params.partialTakeProfit.stage2.trigger}%→${params.partialTakeProfit.stage2.closePercent}% | E3 ${params.partialTakeProfit.stage3.trigger}%→${params.partialTakeProfit.stage3.closePercent}%
### Trailing amplio: L3 target ${params.trailingStop.level3.trigger}%
### CLAVE: No operar en exceso. Buscar entradas de alta convicción en timeframes altos.
### Intervalo: ${ctx.intervalMinutes}min | Pares: ${ctx.tradingSymbols.join(", ")}`;
}
