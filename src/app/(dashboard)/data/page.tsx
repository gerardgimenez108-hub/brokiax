"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface CryptoData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume: number;
  marketCap?: number;
  sparkline: number[];
}

// Approximate circulating supplies to calculate market cap
const CIRCULATING_SUPPLY: Record<string, number> = {
  BTC: 19_700_000,
  ETH: 120_000_000,
  SOL: 450_000_000,
  XRP: 55_000_000_000,
  BNB: 147_000_000,
  ADA: 35_000_000_000,
  DOGE: 144_000_000_000,
  AVAX: 390_000_000,
  LINK: 587_000_000,
  DOT: 1_400_000_000,
  MATIC: 9_900_000_000,
  UNI: 600_000_000,
};

function MiniSparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (!data || data.length === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const h = 32;
  const w = 80;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");

  return (
    <svg width={w} height={h} className="flex-shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? "var(--success)" : "var(--danger)"}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function MarketDataPage() {
  const [data, setData] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [now, setNow] = useState(new Date());
  
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"marketCap" | "volume" | "change24h">("marketCap");

  const fetchData = async () => {
    try {
      setError(null);
      const res = await fetch("/api/market/prices");
      if (!res.ok) throw new Error("Error fetching market data");
      
      const json = await res.json();
      
      // Calculate market cap for sorting/display
      const enrichedData = (json.data as CryptoData[]).map(coin => ({
        ...coin,
        marketCap: coin.price * (CIRCULATING_SUPPLY[coin.symbol] || 0)
      }));

      setData(enrichedData);
      setLastUpdated(new Date(json.updatedAt));
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Poll every 60 seconds
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Update the "Last updated" relative time every second
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const filtered = data
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.symbol.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "change24h") return b.change24h - a.change24h;
      return (b[sortBy] || 0) - (a[sortBy] || 0);
    });

  const totalMarketCap = data.reduce((a, c) => a + (c.marketCap || 0), 0);
  const btcDominance = data.length > 0 ? ((data[0].marketCap || 0) / totalMarketCap) * 100 : 0;
  const totalVolume = data.reduce((a, c) => a + c.volume, 0);

  const formatNum = (n: number) => {
    if (n >= 1_000_000_000_000) return `$${(n / 1_000_000_000_000).toFixed(2)}T`;
    if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
    return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-500 flex items-center justify-center text-white text-sm">📊</span>
            Market Data
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Vista general de los mercados de criptomonedas en tiempo real.
          </p>
        </div>
        
        {lastUpdated && (
          <div className="text-sm text-[var(--text-tertiary)] flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${loading ? "bg-[var(--warning)] animate-pulse" : "bg-[var(--success)]"}`} />
            Actualizado hace {formatDistanceToNow(lastUpdated, { locale: es, addSuffix: false })}
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 text-[var(--danger)] flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchData} className="px-3 py-1 rounded-md bg-[var(--danger)]/20 hover:bg-[var(--danger)]/30 transition-colors text-sm">
            Reintentar
          </button>
        </div>
      )}

      {loading && data.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-[var(--text-secondary)]">
          <div className="w-8 h-8 border-4 border-[var(--brand-500)]/30 border-t-[var(--brand-500)] rounded-full animate-spin mb-4" />
          <p>Conectando con exchanges...</p>
        </div>
      ) : (
        <>
          {/* Global Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Market Cap Total", value: formatNum(totalMarketCap) },
              { label: "BTC Dominance", value: `${btcDominance.toFixed(1)}%` },
              { label: "Volumen 24h", value: formatNum(totalVolume) },
              { label: "Fear & Greed", value: "Buscando...", color: "text-[var(--warning)]", id: "fng" },
            ].map((stat) => (
              <div key={stat.label} className="glass-card p-4">
                <div className="text-xs text-[var(--text-tertiary)] mb-1">{stat.label}</div>
                {stat.id === "fng" ? (
                  <div className={`text-lg font-bold ${stat.color || ""}`}>62 — Greed</div>
                ) : (
                  <div className={`text-lg font-bold ${stat.color || ""}`}>{stat.value}</div>
                )}
              </div>
            ))}
          </div>

          {/* Top Movers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...data].sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))
              .slice(0, 3)
              .map((coin) => (
                <div key={coin.symbol} className="glass-card p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{coin.symbol}</span>
                      <span className="text-xs text-[var(--text-tertiary)]">{coin.name}</span>
                    </div>
                    <div className="text-xl font-bold mt-1">${coin.price.toLocaleString(undefined, { maximumFractionDigits: 4 })}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${coin.change24h >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                      {coin.change24h >= 0 ? "+" : ""}{coin.change24h.toFixed(2)}%
                    </div>
                    <MiniSparkline data={coin.sparkline} positive={coin.change24h >= 0} />
                  </div>
                </div>
              ))}
          </div>

          {/* Search + Sort */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Buscar moneda..."
              className="input-field max-w-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="flex gap-2">
              {([
                ["marketCap", "Market Cap"],
                ["volume", "Volumen"],
                ["change24h", "Cambio 24h"],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSortBy(key)}
                  className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                    sortBy === key
                      ? "border-[var(--brand-400)]/50 bg-[var(--brand-500)]/10 text-[var(--brand-300)]"
                      : "border-[var(--border-primary)] text-[var(--text-secondary)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border-primary)] text-left text-xs text-[var(--text-tertiary)] uppercase tracking-wider">
                    <th className="px-6 py-3">#</th>
                    <th className="px-6 py-3">Moneda</th>
                    <th className="px-6 py-3 text-right">Precio</th>
                    <th className="px-6 py-3 text-right">24h %</th>
                    <th className="px-6 py-3 text-right hidden md:table-cell">Volumen 24h</th>
                    <th className="px-6 py-3 text-right hidden lg:table-cell">Market Cap</th>
                    <th className="px-6 py-3 text-right hidden sm:table-cell">7d</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((coin, i) => (
                    <tr key={coin.symbol} className="border-b border-[var(--border-primary)]/50 hover:bg-[var(--bg-hover)] transition-colors">
                      <td className="px-6 py-4 text-sm text-[var(--text-tertiary)]">{i + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{coin.symbol}</span>
                          <span className="text-xs text-[var(--text-tertiary)]">{coin.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-sm">
                        ${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: coin.price < 1 ? 4 : 2 })}
                      </td>
                      <td className={`px-6 py-4 text-right font-semibold text-sm ${coin.change24h >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                        {coin.change24h >= 0 ? "+" : ""}{coin.change24h.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-[var(--text-secondary)] hidden md:table-cell">
                        {formatNum(coin.volume)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-[var(--text-secondary)] hidden lg:table-cell">
                        {formatNum(coin.marketCap || 0)}
                      </td>
                      <td className="px-6 py-4 text-right hidden sm:table-cell">
                        <MiniSparkline data={coin.sparkline} positive={coin.change24h >= 0} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
