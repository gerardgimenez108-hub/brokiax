// Strategy types adapted from nofx/web/src/types/strategy.ts
import { Timestamp } from "firebase/firestore";

export interface Strategy {
  id: string;
  userId: string;
  name: string;
  description: string;
  isActive: boolean;
  config: StrategyConfig;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface StrategyConfig {
  strategyType: 'ai_trading' | 'grid_trading';
  baseStrategyId?: string; // Links to the 11 built-in strategies (e.g., 'aggressive', 'conservative')
  coinSource: CoinSourceConfig;
  indicators: IndicatorConfig;
  customPrompt?: string;
  riskControl: RiskControlConfig;
  promptSections?: PromptSectionsConfig;
  gridConfig?: GridStrategyConfig;
}

export interface CoinSourceConfig {
  sourceType: 'static' | 'ranking' | 'mixed';
  staticCoins: string[];
  excludedCoins: string[];
  rankingLimit?: number;
}

export interface IndicatorConfig {
  klines: KlineConfig;
  enableRawKlines: boolean;
  enableEma: boolean;
  enableMacd: boolean;
  enableRsi: boolean;
  enableAtr: boolean;
  enableBoll: boolean;
  enableVolume: boolean;
  enableOi: boolean;
  enableFundingRate: boolean;
  emaPeriods: number[];
  rsiPeriods: number[];
  atrPeriods: number[];
  bollPeriods: number[];
}

export interface KlineConfig {
  primaryTimeframe: string;
  primaryCount: number;
  longerTimeframe?: string;
  longerCount?: number;
  enableMultiTimeframe: boolean;
  selectedTimeframes: string[];
}

export interface RiskControlConfig {
  maxPositions: number;
  btcEthMaxLeverage: number;
  altcoinMaxLeverage: number;
  btcEthMaxPositionValueRatio: number;
  altcoinMaxPositionValueRatio: number;
  maxMarginUsage: number;
  minPositionSize: number;
  minRiskRewardRatio: number;
  minConfidence: number;
}

export interface PromptSectionsConfig {
  roleDefinition?: string;
  tradingFrequency?: string;
  entryStandards?: string;
  decisionProcess?: string;
}

export interface GridStrategyConfig {
  symbol: string;
  gridCount: number;
  totalInvestment: number;
  leverage: number;
  upperPrice: number;
  lowerPrice: number;
  useAtrBounds: boolean;
  atrMultiplier: number;
  distribution: 'uniform' | 'gaussian' | 'pyramid';
  maxDrawdownPct: number;
  stopLossPct: number;
  dailyLossLimitPct: number;
  useMakerOnly: boolean;
}

// Default strategy config
export const DEFAULT_STRATEGY_CONFIG: StrategyConfig = {
  strategyType: 'ai_trading',
  baseStrategyId: 'conservative',
  coinSource: {
    sourceType: 'static',
    staticCoins: ['BTC/USDT', 'ETH/USDT'],
    excludedCoins: [],
  },
  indicators: {
    klines: {
      primaryTimeframe: '1h',
      primaryCount: 50,
      enableMultiTimeframe: false,
      selectedTimeframes: ['1h'],
    },
    enableRawKlines: true,
    enableEma: true,
    enableMacd: true,
    enableRsi: true,
    enableAtr: false,
    enableBoll: false,
    enableVolume: true,
    enableOi: false,
    enableFundingRate: false,
    emaPeriods: [20, 50],
    rsiPeriods: [14],
    atrPeriods: [14],
    bollPeriods: [20],
  },
  riskControl: {
    maxPositions: 5,
    btcEthMaxLeverage: 3,
    altcoinMaxLeverage: 2,
    btcEthMaxPositionValueRatio: 5,
    altcoinMaxPositionValueRatio: 1,
    maxMarginUsage: 0.9,
    minPositionSize: 10,
    minRiskRewardRatio: 1.5,
    minConfidence: 0.6,
  },
  promptSections: {
    roleDefinition: "Eres un agente de trading de criptomonedas experto. Tu objetivo es maximizar el retorno ajustado al riesgo.",
    tradingFrequency: "Opera de forma moderada, priorizando la calidad sobre la cantidad de trades.",
    entryStandards: "Solo abre posiciones cuando haya confluencia de al menos 2 indicadores técnicos.",
    decisionProcess: "1. Analiza tendencia general\n2. Evalúa indicadores técnicos\n3. Verifica condiciones de riesgo\n4. Toma decisión con nivel de confianza",
  },
};
