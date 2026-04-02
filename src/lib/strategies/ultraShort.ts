import { StrategyParams, StrategyPromptContext } from "./types";

export function getUltraShortParams(maxLeverage: number): StrategyParams {
  const lMax = Math.min(20, maxLeverage);
  return {
    name: "Ultra-Corta (Scalping)",
    description: "Ciclo de 5 minutos. Scalping rápido capturando micro-movimientos con ejecución veloz.",
    leverageMin: 10, leverageMax: lMax,
    leverageRecommend: { normal: `${Math.min(10, lMax)}x`, good: `${Math.min(15, lMax)}x`, strong: `${Math.min(lMax, 20)}x` },
    positionSizeMin: 20, positionSizeMax: 30,
    positionSizeRecommend: { normal: "20-23%", good: "23-27%", strong: "27-30%" },
    stopLoss: { low: -2, mid: -1.5, high: -1 },
    trailingStop: {
      level1: { trigger: 1.5, stopAt: 0 },
      level2: { trigger: 3, stopAt: 1 },
      level3: { trigger: 5, stopAt: 2.5 },
    },
    partialTakeProfit: {
      stage1: { trigger: 1.5, closePercent: 40 },
      stage2: { trigger: 3, closePercent: 70 },
      stage3: { trigger: 5, closePercent: 100 },
    },
    peakDrawdownProtection: 1.5,
    volatilityAdjustment: {
      highVolatility: { leverageFactor: 0.8, positionFactor: 0.85 },
      normalVolatility: { leverageFactor: 1.0, positionFactor: 1.0 },
      lowVolatility: { leverageFactor: 1.1, positionFactor: 1.05 },
    },
    entryCondition: "Señal rápida de momentum en velas de 1-5 min con volumen confirmado",
    riskTolerance: "Media-alta — pequeños profits frecuentes compensan losses",
    tradingStyle: "Muchas operaciones cortas, in-and-out rápido, no mantener posiciones",
    enableCodeLevelProtection: false,
  };
}

export function generateUltraShortPrompt(params: StrategyParams, ctx: StrategyPromptContext): string {
  return `## ESTRATEGIA: ${params.name} (SCALPING 5min)
${params.description}

### PRINCIPIO CORE: Entrar y salir RÁPIDO. No mantener posiciones más de pocas velas.
### Leverage: ${params.leverageMin}x-${params.leverageMax}x | Posición: ${params.positionSizeMin}%-${params.positionSizeMax}%
### Stop-Loss ULTRA-RÁPIDO: ${params.stopLoss.low}%/${params.stopLoss.mid}%/${params.stopLoss.high}% — SIN DUDAR
### TP rápido: ${params.partialTakeProfit.stage1.trigger}%→${params.partialTakeProfit.stage1.closePercent}% | ${params.partialTakeProfit.stage2.trigger}%→${params.partialTakeProfit.stage2.closePercent}% | ${params.partialTakeProfit.stage3.trigger}%→${params.partialTakeProfit.stage3.closePercent}%
### Drawdown: ${params.peakDrawdownProtection}% desde pico → cierre instantáneo
### Intervalo: ${ctx.intervalMinutes}min | Pares: ${ctx.tradingSymbols.join(", ")}`;
}
