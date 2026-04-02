import { StrategyParams, StrategyPromptContext } from "./types";

export function getAggressiveTeamParams(maxLeverage: number): StrategyParams {
  const lMax = Math.min(25, maxLeverage);
  return {
    name: "Equipo Agresivo",
    description: "Líder + 2 exploradores coordinan decisiones de asalto. Cada explorador analiza un aspecto, el líder sintetiza y ejecuta.",
    leverageMin: 20, leverageMax: lMax,
    leverageRecommend: { normal: `${Math.min(20, lMax)}x`, good: `${Math.min(22, lMax)}x`, strong: `${Math.min(lMax, 25)}x` },
    positionSizeMin: 28, positionSizeMax: 35,
    maxTotalMarginPercent: 50,
    positionSizeRecommend: { normal: "28-30%", good: "30-33%", strong: "33-35%" },
    stopLoss: { low: -2, mid: -1.8, high: -1.5 },
    trailingStop: {
      level1: { trigger: 1.5, stopAt: 0 },
      level2: { trigger: 3, stopAt: 1 },
      level3: { trigger: 5, stopAt: 2.5 },
    },
    partialTakeProfit: {
      stage1: { trigger: 2, closePercent: 30 },
      stage2: { trigger: 4, closePercent: 60 },
      stage3: { trigger: 6, closePercent: 100 },
    },
    peakDrawdownProtection: 1.8,
    volatilityAdjustment: {
      highVolatility: { leverageFactor: 0.7, positionFactor: 0.75 },
      normalVolatility: { leverageFactor: 1.0, positionFactor: 1.0 },
      lowVolatility: { leverageFactor: 1.2, positionFactor: 1.15 },
    },
    entryCondition: "Cuando ambos exploradores confirman oportunidad y el líder aprueba",
    riskTolerance: "Muy alta — estrategia de asalto coordinado",
    tradingStyle: "Ultra-agresivo con coordinación team, ejecución rápida 5min",
    enableCodeLevelProtection: false,
  };
}

export function generateAggressiveTeamPrompt(params: StrategyParams, ctx: StrategyPromptContext): string {
  return `## ESTRATEGIA: ${params.name} (EQUIPO DE ASALTO)
${params.description}

### MODO EQUIPO:
Eres el LÍDER del equipo. 2 exploradores (Scout A: técnico puro, Scout B: momentum + volumen) ya analizaron el mercado.
Tu trabajo es sintetizar sus señales y tomar la decisión final.

### Leverage: ${params.leverageMin}x - ${params.leverageMax}x | Posición: ${params.positionSizeMin}%-${params.positionSizeMax}% | Margen total max: ${params.maxTotalMarginPercent}%
### Stop-Loss ULTRA-TIGHT: ${params.stopLoss.low}% / ${params.stopLoss.mid}% / ${params.stopLoss.high}%
### Trailing: L1 ≥${params.trailingStop.level1.trigger}%→${params.trailingStop.level1.stopAt}% | L2 ≥${params.trailingStop.level2.trigger}%→${params.trailingStop.level2.stopAt}% | L3 ≥${params.trailingStop.level3.trigger}%→${params.trailingStop.level3.stopAt}%
### Drawdown: ${params.peakDrawdownProtection}% desde pico → cierre
### Intervalo: ${ctx.intervalMinutes}min | Pares: ${ctx.tradingSymbols.join(", ")}`;
}
