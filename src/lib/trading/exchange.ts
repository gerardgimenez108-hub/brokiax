// CCXT wrapper for public market data
// Adapted from .refs/open-nof1/lib/trading/binance.ts
// No API keys needed — uses public endpoints for tickers and OHLCV

import ccxt, { binance, OHLCV, Ticker } from "ccxt";

// Singleton Binance instance for public data (no auth)
let _exchange: binance | null = null;

function getExchange(): binance {
  if (!_exchange) {
    _exchange = new ccxt.binance({
      options: { defaultType: "spot" },
    });
  }
  return _exchange;
}

// ─── In-memory cache ─────────────────────────────
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T, ttlMs: number): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

// ─── Types ───────────────────────────────────────
export interface CryptoMarketData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume: number;
  high24h: number;
  low24h: number;
  sparkline: number[];
}

// Symbol → human-readable name mapping
const COIN_NAMES: Record<string, string> = {
  BTC: "Bitcoin",
  ETH: "Ethereum",
  SOL: "Solana",
  XRP: "Ripple",
  BNB: "BNB",
  ADA: "Cardano",
  DOGE: "Dogecoin",
  AVAX: "Avalanche",
  LINK: "Chainlink",
  DOT: "Polkadot",
  MATIC: "Polygon",
  UNI: "Uniswap",
};

// Default symbols to fetch
export const DEFAULT_SYMBOLS = [
  "BTC/USDT", "ETH/USDT", "SOL/USDT", "XRP/USDT",
  "BNB/USDT", "ADA/USDT", "DOGE/USDT", "AVAX/USDT",
  "LINK/USDT", "DOT/USDT", "MATIC/USDT", "UNI/USDT",
];

// ─── Fetch market prices ─────────────────────────
export async function fetchMarketPrices(
  symbols: string[] = DEFAULT_SYMBOLS
): Promise<CryptoMarketData[]> {
  const cacheKey = `market_prices_${symbols.join(",")}`;
  const cached = getCached<CryptoMarketData[]>(cacheKey);
  if (cached) return cached;

  const exchange = getExchange();

  // Fetch all tickers at once (more efficient than individual calls)
  const tickers = await exchange.fetchTickers(symbols);

  // Fetch sparkline data (7 daily candles) in parallel
  const sparklinePromises = symbols.map((symbol) =>
    fetchSparkline(exchange, symbol).catch(() => Array(7).fill(0))
  );
  const sparklines = await Promise.all(sparklinePromises);

  const results: CryptoMarketData[] = symbols.map((symbol, i) => {
    const ticker = tickers[symbol];
    const base = symbol.split("/")[0];

    return {
      symbol: base,
      name: COIN_NAMES[base] || base,
      price: ticker?.last ?? 0,
      change24h: ticker?.percentage ?? 0,
      volume: ticker?.quoteVolume ?? 0,
      high24h: ticker?.high ?? 0,
      low24h: ticker?.low ?? 0,
      sparkline: sparklines[i],
    };
  });

  // Cache for 30 seconds
  setCache(cacheKey, results, 30_000);
  return results;
}

// ─── Fetch 7-day sparkline data ──────────────────
async function fetchSparkline(
  exchange: binance,
  symbol: string
): Promise<number[]> {
  const cacheKey = `sparkline_${symbol}`;
  const cached = getCached<number[]>(cacheKey);
  if (cached) return cached;

  // Fetch 7 daily candles
  const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const ohlcv = await exchange.fetchOHLCV(symbol, "1d", since, 7);

  // Extract close prices
  const closes = ohlcv.map((candle: OHLCV) => Number(candle[4]));

  // Cache sparklines for 5 minutes (they don't need to update as frequently)
  setCache(cacheKey, closes, 5 * 60_000);
  return closes;
}
