// Strategy types adapted from nofx/web/src/types/strategy.ts
import { Timestamp } from "firebase/firestore";
import { z } from "zod";

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
  strategyType: "ai_trading" | "grid_trading";
  baseStrategyId?: string;
  coinSource: CoinSourceConfig;
  indicators: IndicatorConfig;
  customPrompt?: string;
  riskControl: RiskControlConfig;
  promptSections?: PromptSectionsConfig;
  gridConfig?: GridStrategyConfig;
}

export interface CoinSourceConfig {
  sourceType: "static" | "ranking" | "mixed";
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
  distribution: "uniform" | "gaussian" | "pyramid";
  maxDrawdownPct: number;
  stopLossPct: number;
  dailyLossLimitPct: number;
  useMakerOnly: boolean;
}

export const DEFAULT_PROMPT_SECTIONS = {
  roleDefinition:
    "Eres un agente de trading de criptomonedas experto. Tu objetivo es maximizar el retorno ajustado al riesgo.",
  tradingFrequency:
    "Opera de forma moderada, priorizando la calidad sobre la cantidad de trades.",
  entryStandards:
    "Solo abre posiciones cuando haya confluencia de al menos 2 indicadores técnicos.",
  decisionProcess:
    "1. Analiza tendencia general\n2. Evalúa indicadores técnicos\n3. Verifica condiciones de riesgo\n4. Toma decisión con nivel de confianza",
} satisfies Required<PromptSectionsConfig>;

export const DEFAULT_STRATEGY_CONFIG_VALUES: StrategyConfig = {
  strategyType: "ai_trading",
  baseStrategyId: "conservative",
  coinSource: {
    sourceType: "static",
    staticCoins: ["BTC/USDT", "ETH/USDT"],
    excludedCoins: [],
  },
  indicators: {
    klines: {
      primaryTimeframe: "1h",
      primaryCount: 50,
      enableMultiTimeframe: false,
      selectedTimeframes: ["1h"],
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
  promptSections: DEFAULT_PROMPT_SECTIONS,
};

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeDefined<T>(base: T, patch: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(patch)) {
    return (patch === undefined ? base : patch) as T;
  }

  const merged: Record<string, unknown> = { ...base };

  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) {
      continue;
    }

    const current = merged[key];
    merged[key] =
      isPlainObject(current) && isPlainObject(value)
        ? mergeDefined(current, value)
        : value;
  }

  return merged as T;
}

export const strategySourceTypeSchema = z.preprocess(
  (value) => {
    if (value === "ai_ranked" || value === "oi_top") {
      return "ranking";
    }

    return value;
  },
  z.enum(["static", "ranking", "mixed"]).default("static")
);

export const klineConfigSchema = z.object({
  primaryTimeframe: z
    .string()
    .default(DEFAULT_STRATEGY_CONFIG_VALUES.indicators.klines.primaryTimeframe),
  primaryCount: z.coerce
    .number()
    .int()
    .min(1)
    .max(500)
    .default(DEFAULT_STRATEGY_CONFIG_VALUES.indicators.klines.primaryCount),
  longerTimeframe: z.string().optional(),
  longerCount: z.coerce.number().int().min(1).max(500).optional(),
  enableMultiTimeframe: z.coerce
    .boolean()
    .default(DEFAULT_STRATEGY_CONFIG_VALUES.indicators.klines.enableMultiTimeframe),
  selectedTimeframes: z
    .array(z.string())
    .default(DEFAULT_STRATEGY_CONFIG_VALUES.indicators.klines.selectedTimeframes),
});

export const coinSourceConfigSchema = z.object({
  sourceType: strategySourceTypeSchema,
  staticCoins: z
    .array(z.string().trim().min(1))
    .default(DEFAULT_STRATEGY_CONFIG_VALUES.coinSource.staticCoins),
  excludedCoins: z
    .array(z.string().trim().min(1))
    .default(DEFAULT_STRATEGY_CONFIG_VALUES.coinSource.excludedCoins),
  rankingLimit: z.coerce.number().int().min(1).max(100).optional(),
});

export const indicatorConfigSchema = z.object({
  klines: klineConfigSchema.default(DEFAULT_STRATEGY_CONFIG_VALUES.indicators.klines),
  enableRawKlines: z.coerce
    .boolean()
    .default(DEFAULT_STRATEGY_CONFIG_VALUES.indicators.enableRawKlines),
  enableEma: z.coerce
    .boolean()
    .default(DEFAULT_STRATEGY_CONFIG_VALUES.indicators.enableEma),
  enableMacd: z.coerce
    .boolean()
    .default(DEFAULT_STRATEGY_CONFIG_VALUES.indicators.enableMacd),
  enableRsi: z.coerce
    .boolean()
    .default(DEFAULT_STRATEGY_CONFIG_VALUES.indicators.enableRsi),
  enableAtr: z.coerce
    .boolean()
    .default(DEFAULT_STRATEGY_CONFIG_VALUES.indicators.enableAtr),
  enableBoll: z.coerce
    .boolean()
    .default(DEFAULT_STRATEGY_CONFIG_VALUES.indicators.enableBoll),
  enableVolume: z.coerce
    .boolean()
    .default(DEFAULT_STRATEGY_CONFIG_VALUES.indicators.enableVolume),
  enableOi: z.coerce
    .boolean()
    .default(DEFAULT_STRATEGY_CONFIG_VALUES.indicators.enableOi),
  enableFundingRate: z.coerce
    .boolean()
    .default(DEFAULT_STRATEGY_CONFIG_VALUES.indicators.enableFundingRate),
  emaPeriods: z
    .array(z.coerce.number().int().positive())
    .default(DEFAULT_STRATEGY_CONFIG_VALUES.indicators.emaPeriods),
  rsiPeriods: z
    .array(z.coerce.number().int().positive())
    .default(DEFAULT_STRATEGY_CONFIG_VALUES.indicators.rsiPeriods),
  atrPeriods: z
    .array(z.coerce.number().int().positive())
    .default(DEFAULT_STRATEGY_CONFIG_VALUES.indicators.atrPeriods),
  bollPeriods: z
    .array(z.coerce.number().int().positive())
    .default(DEFAULT_STRATEGY_CONFIG_VALUES.indicators.bollPeriods),
});

export const riskControlConfigSchema = z.object({
  maxPositions: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(DEFAULT_STRATEGY_CONFIG_VALUES.riskControl.maxPositions),
  btcEthMaxLeverage: z.coerce
    .number()
    .positive()
    .default(DEFAULT_STRATEGY_CONFIG_VALUES.riskControl.btcEthMaxLeverage),
  altcoinMaxLeverage: z.coerce
    .number()
    .positive()
    .default(DEFAULT_STRATEGY_CONFIG_VALUES.riskControl.altcoinMaxLeverage),
  btcEthMaxPositionValueRatio: z.coerce
    .number()
    .positive()
    .default(DEFAULT_STRATEGY_CONFIG_VALUES.riskControl.btcEthMaxPositionValueRatio),
  altcoinMaxPositionValueRatio: z.coerce
    .number()
    .positive()
    .default(DEFAULT_STRATEGY_CONFIG_VALUES.riskControl.altcoinMaxPositionValueRatio),
  maxMarginUsage: z.coerce
    .number()
    .positive()
    .max(1)
    .default(DEFAULT_STRATEGY_CONFIG_VALUES.riskControl.maxMarginUsage),
  minPositionSize: z.coerce
    .number()
    .positive()
    .default(DEFAULT_STRATEGY_CONFIG_VALUES.riskControl.minPositionSize),
  minRiskRewardRatio: z.coerce
    .number()
    .positive()
    .default(DEFAULT_STRATEGY_CONFIG_VALUES.riskControl.minRiskRewardRatio),
  minConfidence: z.coerce
    .number()
    .min(0)
    .max(1)
    .default(DEFAULT_STRATEGY_CONFIG_VALUES.riskControl.minConfidence),
});

export const promptSectionsConfigSchema = z.object({
  roleDefinition: z.string().default(DEFAULT_PROMPT_SECTIONS.roleDefinition),
  tradingFrequency: z.string().default(DEFAULT_PROMPT_SECTIONS.tradingFrequency),
  entryStandards: z.string().default(DEFAULT_PROMPT_SECTIONS.entryStandards),
  decisionProcess: z.string().default(DEFAULT_PROMPT_SECTIONS.decisionProcess),
});

export const gridStrategyConfigSchema = z.object({
  symbol: z.string().trim().min(1),
  gridCount: z.coerce.number().int().min(1),
  totalInvestment: z.coerce.number().positive(),
  leverage: z.coerce.number().positive(),
  upperPrice: z.coerce.number().positive(),
  lowerPrice: z.coerce.number().positive(),
  useAtrBounds: z.coerce.boolean().default(false),
  atrMultiplier: z.coerce.number().positive(),
  distribution: z.enum(["uniform", "gaussian", "pyramid"]),
  maxDrawdownPct: z.coerce.number().min(0).max(100),
  stopLossPct: z.coerce.number().min(0).max(100),
  dailyLossLimitPct: z.coerce.number().min(0).max(100),
  useMakerOnly: z.coerce.boolean().default(false),
});

export const strategyConfigSchema = z.object({
  strategyType: z
    .enum(["ai_trading", "grid_trading"])
    .default(DEFAULT_STRATEGY_CONFIG_VALUES.strategyType),
  baseStrategyId: z.string().trim().min(1).optional(),
  coinSource: coinSourceConfigSchema.default(DEFAULT_STRATEGY_CONFIG_VALUES.coinSource),
  indicators: indicatorConfigSchema.default(DEFAULT_STRATEGY_CONFIG_VALUES.indicators),
  customPrompt: z.string().trim().optional(),
  riskControl: riskControlConfigSchema.default(DEFAULT_STRATEGY_CONFIG_VALUES.riskControl),
  promptSections: promptSectionsConfigSchema.default(DEFAULT_PROMPT_SECTIONS),
  gridConfig: gridStrategyConfigSchema.optional(),
});

export const strategyConfigUpdateSchema = z.object({
  strategyType: z.enum(["ai_trading", "grid_trading"]).optional(),
  baseStrategyId: z.string().trim().min(1).optional(),
  coinSource: z
    .object({
      sourceType: strategySourceTypeSchema.optional(),
      staticCoins: z.array(z.string().trim().min(1)).optional(),
      excludedCoins: z.array(z.string().trim().min(1)).optional(),
      rankingLimit: z.coerce.number().int().min(1).max(100).optional(),
    })
    .optional(),
  indicators: z
    .object({
      klines: z
        .object({
          primaryTimeframe: z.string().optional(),
          primaryCount: z.coerce.number().int().min(1).max(500).optional(),
          longerTimeframe: z.string().optional(),
          longerCount: z.coerce.number().int().min(1).max(500).optional(),
          enableMultiTimeframe: z.coerce.boolean().optional(),
          selectedTimeframes: z.array(z.string()).optional(),
        })
        .optional(),
      enableRawKlines: z.coerce.boolean().optional(),
      enableEma: z.coerce.boolean().optional(),
      enableMacd: z.coerce.boolean().optional(),
      enableRsi: z.coerce.boolean().optional(),
      enableAtr: z.coerce.boolean().optional(),
      enableBoll: z.coerce.boolean().optional(),
      enableVolume: z.coerce.boolean().optional(),
      enableOi: z.coerce.boolean().optional(),
      enableFundingRate: z.coerce.boolean().optional(),
      emaPeriods: z.array(z.coerce.number().int().positive()).optional(),
      rsiPeriods: z.array(z.coerce.number().int().positive()).optional(),
      atrPeriods: z.array(z.coerce.number().int().positive()).optional(),
      bollPeriods: z.array(z.coerce.number().int().positive()).optional(),
    })
    .optional(),
  customPrompt: z.string().trim().optional(),
  riskControl: z
    .object({
      maxPositions: z.coerce.number().int().min(1).max(100).optional(),
      btcEthMaxLeverage: z.coerce.number().positive().optional(),
      altcoinMaxLeverage: z.coerce.number().positive().optional(),
      btcEthMaxPositionValueRatio: z.coerce.number().positive().optional(),
      altcoinMaxPositionValueRatio: z.coerce.number().positive().optional(),
      maxMarginUsage: z.coerce.number().positive().max(1).optional(),
      minPositionSize: z.coerce.number().positive().optional(),
      minRiskRewardRatio: z.coerce.number().positive().optional(),
      minConfidence: z.coerce.number().min(0).max(1).optional(),
    })
    .optional(),
  promptSections: z
    .object({
      roleDefinition: z.string().optional(),
      tradingFrequency: z.string().optional(),
      entryStandards: z.string().optional(),
      decisionProcess: z.string().optional(),
    })
    .optional(),
  gridConfig: gridStrategyConfigSchema.partial().optional(),
});

export type StrategyConfigUpdate = z.infer<typeof strategyConfigUpdateSchema>;

export function getDefaultStrategyConfig(): StrategyConfig {
  return strategyConfigSchema.parse(cloneValue(DEFAULT_STRATEGY_CONFIG_VALUES));
}

export const DEFAULT_STRATEGY_CONFIG: StrategyConfig = getDefaultStrategyConfig();

export function normalizeStrategyConfig(input: unknown): StrategyConfig {
  return strategyConfigSchema.parse(input);
}

export function normalizeStrategyConfigUpdate(input: unknown): StrategyConfigUpdate {
  return strategyConfigUpdateSchema.parse(input);
}

export function mergeStrategyConfig(
  currentConfig: unknown,
  updateConfig: unknown
): StrategyConfig {
  const baseConfig = normalizeStrategyConfig(currentConfig ?? getDefaultStrategyConfig());
  const patchConfig = normalizeStrategyConfigUpdate(updateConfig);
  return normalizeStrategyConfig(mergeDefined(cloneValue(baseConfig), patchConfig));
}
