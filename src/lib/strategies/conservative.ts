import { StrategyParams, StrategyPromptContext } from "./types";

export function getConservativeParams(maxLeverage: number): StrategyParams {
  const lMax = Math.min(8, maxLeverage);
  return {
    name: "Conservadora",
    description: "Estrategia de bajo riesgo. Entradas conservadoras con stops amplios y leverage mínimo. Ideal para preservación de capital.",
    leverageMin: 3,
    leverageMax: lMax,
    leverageRecommend: { normal: `${Math.min(3, lMax)}x`, good: `${Math.min(5, lMax)}x`, strong: `${Math.min(lMax, 8)}x` },
    positionSizeMin: 15,
    positionSizeMax: 25,
    positionSizeRecommend: { normal: "15-18%", good: "18-22%", strong: "22-25%" },
    stopLoss: { low: -3.5, mid: -3, high: -2.5 },
    trailingStop: {
      level1: { trigger: 3, stopAt: 0.5 },
      level2: { trigger: 5, stopAt: 2 },
      level3: { trigger: 8, stopAt: 4 },
    },
    partialTakeProfit: {
      stage1: { trigger: 4, closePercent: 30 },
      stage2: { trigger: 6, closePercent: 60 },
      stage3: { trigger: 10, closePercent: 100 },
    },
    peakDrawdownProtection: 3,
    volatilityAdjustment: {
      highVolatility: { leverageFactor: 0.7, positionFactor: 0.75 },
      normalVolatility: { leverageFactor: 1.0, positionFactor: 1.0 },
      lowVolatility: { leverageFactor: 1.15, positionFactor: 1.1 },
    },
    entryCondition: "Solo entrar cuando haya confluencia de al menos 3 indicadores técnicos y la tendencia general sea clara",
    riskTolerance: "Muy baja — preservar capital es la prioridad absoluta",
    tradingStyle: "Operar poco, solo las señales más claras con alta confirmación",
    enableCodeLevelProtection: false,
  };
}

export function generateConservativePrompt(params: StrategyParams, ctx: StrategyPromptContext): string {
  return `## ESTRATEGIA: ${params.name}
${params.description}

### Reglas de Leverage
- Rango: ${params.leverageMin}x - ${params.leverageMax}x
- Señal normal: ${params.leverageRecommend.normal} | Buena: ${params.leverageRecommend.good} | Fuerte: ${params.leverageRecommend.strong}

### Gestión de Posición
- Tamaño: ${params.positionSizeMin}% - ${params.positionSizeMax}% del equity
- Máximo posiciones simultáneas: ${ctx.maxPositions}

### Stop-Loss (ejecutar activamente)
- Leverage bajo: ${params.stopLoss.low}% | Medio: ${params.stopLoss.mid}% | Alto: ${params.stopLoss.high}%

### Trailing Stop Progresivo
- Nivel 1: Si PnL ≥ ${params.trailingStop.level1.trigger}%, mover stop a ${params.trailingStop.level1.stopAt}%
- Nivel 2: Si PnL ≥ ${params.trailingStop.level2.trigger}%, mover stop a ${params.trailingStop.level2.stopAt}%
- Nivel 3: Si PnL ≥ ${params.trailingStop.level3.trigger}%, mover stop a ${params.trailingStop.level3.stopAt}%

### Take Profit Parcial
- Etapa 1: PnL ≥ ${params.partialTakeProfit.stage1.trigger}% → cerrar ${params.partialTakeProfit.stage1.closePercent}%
- Etapa 2: PnL ≥ ${params.partialTakeProfit.stage2.trigger}% → cerrar ${params.partialTakeProfit.stage2.closePercent}%
- Etapa 3: PnL ≥ ${params.partialTakeProfit.stage3.trigger}% → cerrar ${params.partialTakeProfit.stage3.closePercent}%

### Protección Drawdown
- Si PnL retrocede ${params.peakDrawdownProtection}% desde el pico → cerrar posición inmediatamente

### Condición de Entrada
${params.entryCondition}

### Intervalo de Ejecución: cada ${ctx.intervalMinutes} minutos
### Pares disponibles: ${ctx.tradingSymbols.join(", ")}
### Stop-loss de sistema: ${ctx.extremeStopLossPercent}% | Max holding: ${ctx.maxHoldingHours}h`;
}
