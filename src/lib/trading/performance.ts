import type { Trade, Trader } from "@/lib/types";
import type { CryptoMarketData } from "./exchange";

type TradeLike = Partial<Trade> & {
  side?: string;
  status?: string;
  symbol?: string;
  amount?: number;
  amountUsdt?: number;
  quantity?: number;
  price?: number;
  createdAt?: unknown;
};

interface OpenPosition {
  symbol: string;
  entryPrice: number;
  notional: number;
}

export interface TraderPerformanceSnapshot {
  initialCapital: number;
  availableCash: number;
  allocatedCapital: number;
  currentValue: number;
  equity: number;
  realizedPnl: number;
  unrealizedPnl: number;
  totalPnl: number;
  totalPnlPercent: number;
  peakEquity: number;
  maxDrawdownPercent: number;
  openPositions: number;
  winRate: number;
  tradesCount: number;
  winningTrades: number;
  losingTrades: number;
  lastTradeAt: Date | null;
}

interface PerformanceOptions {
  previousPeakEquity?: number;
  previousMaxDrawdownPercent?: number;
}

function toFiniteNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function round(value: number): number {
  return Number(toFiniteNumber(value).toFixed(2));
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "object" && value !== null) {
    const candidate = value as {
      toDate?: () => Date;
      seconds?: number;
      _seconds?: number;
    };
    if (typeof candidate.toDate === "function") return candidate.toDate();
    if (typeof candidate.seconds === "number") return new Date(candidate.seconds * 1000);
    if (typeof candidate._seconds === "number") return new Date(candidate._seconds * 1000);
  }
  return null;
}

function normalizeSymbol(symbol: string | undefined): string | null {
  if (!symbol || symbol === "N/A") return null;
  return symbol.toUpperCase();
}

function buildPriceLookup(prices: CryptoMarketData[]): Map<string, number> {
  const lookup = new Map<string, number>();

  for (const price of prices) {
    const base = normalizeSymbol(price.symbol);
    const currentPrice = toFiniteNumber(price.price);

    if (!base || currentPrice <= 0) {
      continue;
    }

    lookup.set(base, currentPrice);
    lookup.set(`${base}/USDT`, currentPrice);
  }

  return lookup;
}

function resolveTradeNotional(trade: TradeLike, capitalHint: number): number {
  if (typeof trade.amountUsdt === "number" && trade.amountUsdt > 0) {
    return trade.amountUsdt;
  }

  if (
    typeof trade.quantity === "number" &&
    trade.quantity > 0 &&
    typeof trade.price === "number" &&
    trade.price > 0
  ) {
    return trade.quantity * trade.price;
  }

  if (typeof trade.amount !== "number" || trade.amount <= 0) {
    return 0;
  }

  if (typeof trade.price !== "number" || trade.price <= 0) {
    return trade.amount;
  }

  const amountTimesPrice = trade.amount * trade.price;

  // Legacy compatibility:
  // old paper trades stored quote notional in `amount`
  // old live trades could store base quantity in `amount`
  if (capitalHint > 0) {
    if (amountTimesPrice > capitalHint * 5 && trade.amount <= capitalHint * 2) {
      return trade.amount;
    }
    if (trade.amount <= capitalHint * 0.25 && amountTimesPrice <= capitalHint * 2) {
      return amountTimesPrice;
    }
  }

  return trade.amount;
}

function isFilledExecution(trade: TradeLike): boolean {
  return trade.status === "filled" && (trade.side === "buy" || trade.side === "sell");
}

export function calculateTraderPerformance(
  trader: Trader,
  trades: TradeLike[],
  prices: CryptoMarketData[],
  options: PerformanceOptions = {}
): TraderPerformanceSnapshot {
  const initialCapital = Math.max(
    toFiniteNumber(trader.initialCapital ?? trader.maxAllocation),
    0
  );
  const capitalHint = Math.max(
    initialCapital > 0 ? initialCapital : toFiniteNumber(trader.maxAllocation),
    0
  );
  const priceLookup = buildPriceLookup(prices);

  const orderedTrades = [...trades].sort((a, b) => {
    const aDate = toDate(a.createdAt)?.getTime() ?? 0;
    const bDate = toDate(b.createdAt)?.getTime() ?? 0;
    return aDate - bDate;
  });

  const openPositions: OpenPosition[] = [];
  let realizedPnl = 0;
  let winningTrades = 0;
  let losingTrades = 0;
  let tradesCount = 0;
  let lastTradeAt: Date | null = null;

  for (const trade of orderedTrades) {
    if (!isFilledExecution(trade)) continue;

    const symbol = normalizeSymbol(trade.symbol);
    const price = toFiniteNumber(trade.price);
    const notional = Math.max(resolveTradeNotional(trade, capitalHint), 0);
    const tradeDate = toDate(trade.createdAt);

    if (tradeDate && (!lastTradeAt || tradeDate > lastTradeAt)) {
      lastTradeAt = tradeDate;
    }

    if (!symbol || price <= 0 || notional <= 0) {
      continue;
    }

    if (trade.side === "buy") {
      openPositions.push({
        symbol,
        entryPrice: price,
        notional,
      });
      continue;
    }

    let remainingNotional = notional;
    let tradeRealizedPnl = 0;
    let matchedNotional = 0;

    for (let i = 0; i < openPositions.length && remainingNotional > 0; ) {
      const position = openPositions[i];

      if (position.symbol !== symbol || position.notional <= 0) {
        i++;
        continue;
      }

      const matched = Math.min(position.notional, remainingNotional);
      const pnl = matched * ((price - position.entryPrice) / position.entryPrice);

      tradeRealizedPnl += pnl;
      matchedNotional += matched;
      position.notional -= matched;
      remainingNotional -= matched;

      if (position.notional <= 0.0001) {
        openPositions.splice(i, 1);
      } else {
        i++;
      }
    }

    if (matchedNotional > 0) {
      realizedPnl += tradeRealizedPnl;
      tradesCount += 1;
      if (tradeRealizedPnl > 0) winningTrades += 1;
      else if (tradeRealizedPnl < 0) losingTrades += 1;
    }
  }

  let allocatedCapital = 0;
  let currentValue = 0;
  let unrealizedPnl = 0;

  for (const position of openPositions) {
    const currentPrice =
      priceLookup.get(position.symbol) ??
      priceLookup.get(position.symbol.split("/")[0]);
    if (!currentPrice || currentPrice <= 0 || position.entryPrice <= 0) {
      allocatedCapital += position.notional;
      currentValue += position.notional;
      continue;
    }

    const marketValue = position.notional * (currentPrice / position.entryPrice);
    allocatedCapital += position.notional;
    currentValue += marketValue;
    unrealizedPnl += marketValue - position.notional;
  }

  const availableCash = initialCapital + realizedPnl - allocatedCapital;
  const equity = availableCash + currentValue;
  const totalPnl = realizedPnl + unrealizedPnl;
  const totalPnlPercent = initialCapital > 0 ? (totalPnl / initialCapital) * 100 : 0;
  const peakEquity = Math.max(options.previousPeakEquity ?? initialCapital, initialCapital, equity);
  const currentDrawdown = peakEquity > 0 ? ((peakEquity - equity) / peakEquity) * 100 : 0;
  const maxDrawdownPercent = Math.max(options.previousMaxDrawdownPercent ?? 0, currentDrawdown);
  const winRate = tradesCount > 0 ? (winningTrades / tradesCount) * 100 : 0;

  return {
    initialCapital: round(initialCapital),
    availableCash: round(availableCash),
    allocatedCapital: round(allocatedCapital),
    currentValue: round(currentValue),
    equity: round(equity),
    realizedPnl: round(realizedPnl),
    unrealizedPnl: round(unrealizedPnl),
    totalPnl: round(totalPnl),
    totalPnlPercent: round(totalPnlPercent),
    peakEquity: round(peakEquity),
    maxDrawdownPercent: round(maxDrawdownPercent),
    openPositions: openPositions.length,
    winRate: round(winRate),
    tradesCount,
    winningTrades,
    losingTrades,
    lastTradeAt,
  };
}

export function buildTraderPerformanceUpdate(snapshot: TraderPerformanceSnapshot) {
  return {
    initialCapital: snapshot.initialCapital,
    currentValue: snapshot.equity,
    availableCash: snapshot.availableCash,
    allocatedCapital: snapshot.allocatedCapital,
    currentAllocation: snapshot.allocatedCapital,
    openPositions: snapshot.openPositions,
    realizedPnl: snapshot.realizedPnl,
    unrealizedPnl: snapshot.unrealizedPnl,
    totalPnl: snapshot.totalPnl,
    totalPnlPercent: snapshot.totalPnlPercent,
    peakEquity: snapshot.peakEquity,
    maxDrawdownPercent: snapshot.maxDrawdownPercent,
    winRate: snapshot.winRate,
    tradesCount: snapshot.tradesCount,
    winningTrades: snapshot.winningTrades,
    losingTrades: snapshot.losingTrades,
  };
}
