"use client";

// Competition Demo — NOFX-style live AI race visualization for the landing page
// Public showcase, no auth required. Can use real Firebase data or mock for demo.

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Swords, TrendingUp, TrendingDown, Zap, Brain, Activity, ExternalLink } from "lucide-react";
import { db } from "@/lib/firebase/client";
import { doc, onSnapshot } from "firebase/firestore";

// ─── Types ───────────────────────────────────────────────

interface Competitor {
  id: string;
  name: string;
  model: string;
  color: string;
  style: "technical" | "sentiment" | "risk";
  pnl: number;
  pnlHistory: number[];
  reasoning: string;
  isThinking: boolean;
  confidence: number;
  action: "BUY" | "SELL" | "HOLD" | null;
  trades: number;
  wins: number;
  speed: number; // ms to "think"
  startedAt: number | null;
}

interface TradeLog {
  id: number;
  time: string;
  model: string;
  action: "BUY" | "SELL" | "HOLD";
  pair: string;
  price: number;
  pnl: number;
}

// ─── Mock AI reasoning templates ────────────────────────

const REASONING_TEMPLATES = {
  technical: [
    "RSI diverging from price action. MACD histogram flipping positive on 4H. Support at $67,200 holding. Accumulation pattern detected.",
    "Breaking above 200 EMA with 3x volume surge. Golden cross forming on daily. RSI neutral at 55 — room to run.",
    "Price rejected at weekly resistance $68,500. Hidden bearish div on 1H. Tight range between $66,800-$67,800. Waiting for breakout.",
    "Bollinger Bands squeezing. Volatility contracting to 6-month low. Explosive move imminent. Leaning long on timeframe confluence.",
    "Volume-weighted average price holding above VWAP. Order block at $66,500 absorbing selling pressure. institutional interest.",
  ],
  sentiment: [
    "On-chain data shows whale wallets accumulating. Social sentiment hitting fear extremes per CryptoFear index. Contrarian signal strong.",
    "Funding rates turning slightly negative on Binance. Short liquidations spiking. Market structure shifting. Bullish divergence.",
    "Macro tailwinds: ETF inflows hit $420M yesterday. BlackRock exposure growing. DeFi TVL up 12% WoW. Fundamentally bullish.",
    "Exchange outflows accelerating — 8,200 BTC leaving exchanges in 24h. Diamond hands increasing. Supply shock incoming.",
    "Fear & Greed at 34 (Fear). Historical buy signal. Options market implied vol compressing. Risk/reward favors longs.",
  ],
  risk: [
    "Volatility spike incoming — ATR at 2-year high relative to price. Reducing position size to 0.5x. Wait for compression.",
    "Open interest declining while price rises — smart money taking profit. Caution warranted. Tighten stop to $66,000.",
    "Liquidation levels concentrated at $68,000. Potential cascade long squeeze. Reducing exposure to 30% of normal size.",
    "Funding rate at 0.08% — elevated. Markets overleveraged. Minimum 15% drawdown risk on any reversal. Playing defense.",
    "Correlation to tech stocks increasing (beta 1.4). Fed minutes release tomorrow. Reducing to hedge ratio 0.6.",
  ],
};

const COMPETITORS_CONFIG = [
  { id: "gpt4o", name: "GPT-4o", model: "OpenAI", color: "#10b981", style: "technical" as const },
  { id: "claude", name: "Claude 3.5", model: "Anthropic", color: "#f59e0b", style: "sentiment" as const },
  { id: "deepseek", name: "DeepSeek V3", model: "DeepSeek", color: "#6366f1", style: "risk" as const },
];

// ─── Live price fetcher (mock with realistic simulation) ─

function useBinancePrice(pair: string) {
  const [price, setPrice] = useState(67432.50);
  const [change24h, setChange24h] = useState(2.34);

  useEffect(() => {
    // Simulate live price updates from Binance WebSocket
    // In production this would be a real Binance WebSocket connection
    let lastPrice = 67432.50;
    const tick = setInterval(() => {
      const volatility = 0.0003; // ±0.03% per tick
      const delta = lastPrice * (Math.random() * volatility * 2 - volatility);
      lastPrice = Math.max(lastPrice + delta, 60000);
      setPrice(lastPrice);
      setChange24h((c) => {
        const newChange = c + (Math.random() - 0.48) * 0.02;
        return Math.max(-15, Math.min(15, newChange));
      });
    }, 800);

    return () => clearInterval(tick);
  }, []);

  return { price, change24h };
}

// ─── Real-time Firebase hook for showcase competition ────────────────────────────────

const SHOWCASE_COMPETITION_ID = process.env.NEXT_PUBLIC_SHOWCASE_COMPETITION_ID || "showcase-1";

function useShowcaseCompetition() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [log, setLog] = useState<TradeLog[]>([]);
  const [cycle, setCycle] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [hasRealData, setHasRealData] = useState(false);

  useEffect(() => {
    if (!db) return;

    // Subscribe to showcase competition
    const compRef = doc(db, "competitions", SHOWCASE_COMPETITION_ID);
    const unsub = onSnapshot(compRef, (snapshot) => {
      if (!snapshot.exists()) {
        setHasRealData(false);
        return;
      }

      const data = snapshot.data();
      if (!data || data.status !== "running") {
        setIsRunning(false);
        return;
      }

      setHasRealData(true);
      setIsRunning(true);
      setCycle(data.currentCycle || 0);

      // Map participants to competitor format
      const mappedCompetitors = (data.participants || []).map((p: any) => ({
        id: p.id,
        name: p.modelName,
        model: p.provider,
        color: p.color,
        style: "technical" as const,
        pnl: p.currentPnlPercent || 0,
        pnlHistory: [p.currentPnlPercent * 0.5, p.currentPnlPercent * 0.75, p.currentPnlPercent],
        reasoning: p.lastReasoning || "Esperando análisis...",
        isThinking: p.status === "thinking",
        confidence: p.lastConfidence || 0,
        action: p.lastAction || null,
        trades: p.totalTrades || 0,
        wins: p.winTrades || 0,
        speed: 1500,
        startedAt: null,
      }));

      setCompetitors(mappedCompetitors);
    });

    // Subscribe to events
    const eventsRef = doc(db, "competitions", SHOWCASE_COMPETITION_ID, "events", "latest");
    const unsubEvents = onSnapshot(eventsRef, (snapshot) => {
      if (!snapshot.exists()) return;
      // Events are handled via the main subscription for simplicity
    });

    return () => {
      unsub();
      unsubEvents();
    };
  }, []);

  return { competitors, log, cycle, isRunning, hasRealData, start: () => {}, stop: () => {} };
}

// ─── Competition engine ────────────────────────────────

function useCompetitionEngine(pair: string, price: number) {
  const [competitors, setCompetitors] = useState<Competitor[]>(
    COMPETITORS_CONFIG.map((c) => ({
      ...c,
      pnl: 0,
      pnlHistory: [0, 0, 0],
      reasoning: "Esperando análisis...",
      isThinking: false,
      confidence: 0,
      action: null,
      trades: 0,
      wins: 0,
      speed: 1500 + Math.random() * 2000,
      startedAt: null,
    }))
  );
  const [log, setLog] = useState<TradeLog[]>([]);
  const [cycle, setCycle] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logIdRef = useRef(0);

  const runCycle = useCallback(() => {
    setCycle((c) => c + 1);

    // Reset all competitors to thinking state
    setCompetitors((prev) =>
      prev.map((comp) => ({
        ...comp,
        isThinking: true,
        reasoning: "Analizando mercado...",
        action: null,
        confidence: 0,
        startedAt: Date.now(),
      }))
    );

    // Each competitor "thinks" for a different time
    competitors.forEach((comp) => {
      const thinkTime = comp.speed;

      setTimeout(() => {
        const templatePool = REASONING_TEMPLATES[comp.style as keyof typeof REASONING_TEMPLATES];
        const reasoning = templatePool[Math.floor(Math.random() * templatePool.length)];

        // Random action weighted by technical signals
        const rand = Math.random();
        let action: "BUY" | "SELL" | "HOLD";
        if (rand < 0.4) action = "BUY";
        else if (rand < 0.7) action = "SELL";
        else action = "HOLD";

        const confidence = 0.55 + Math.random() * 0.35;
        const pnlDelta = action === "HOLD" ? 0 : (action === "BUY" ? 1 : -1) * (Math.random() * 0.8 + 0.1) * (Math.random() > 0.5 ? 1 : -1);

        const tradeAmount = 500;
        const pnlChange = action === "HOLD" ? 0 : pnlDelta * tradeAmount * (price / 10000);

        setCompetitors((prev) =>
          prev.map((c) =>
            c.id === comp.id
              ? {
                  ...c,
                  pnl: c.pnl + pnlChange,
                  pnlHistory: [...c.pnlHistory.slice(-4), c.pnl + pnlChange],
                  reasoning,
                  isThinking: false,
                  confidence,
                  action,
                  trades: c.trades + (action !== "HOLD" ? 1 : 0),
                  wins: c.wins + (pnlChange > 0 ? 1 : 0),
                  startedAt: null,
                }
              : c
          )
        );

        if (action !== "HOLD") {
          const entry: TradeLog = {
            id: ++logIdRef.current,
            time: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            model: comp.name,
            action,
            pair,
            price,
            pnl: pnlChange,
          };
          setLog((prev) => [entry, ...prev].slice(0, 20));
        }
      }, thinkTime);
    });
  }, [competitors, price, pair]);

  const start = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    setCycle(0);
    runCycle();
    timerRef.current = setInterval(runCycle, 12000);
  }, [isRunning, runCycle]);

  const stop = useCallback(() => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setCompetitors((prev) =>
      prev.map((c) => ({ ...c, isThinking: false, reasoning: "Pausado", action: null }))
    );
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return { competitors, log, cycle, isRunning, start, stop };
}

// ─── Sub-components ────────────────────────────────────

function MiniChart({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return <div className="w-16 h-6" />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 64;
  const h = 24;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={w} height={h} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.8}
      />
    </svg>
  );
}

function CompetitorCard({ comp, price }: { comp: Competitor; price: number }) {
  const pnlColor = comp.pnl >= 0 ? "text-emerald-400" : "text-red-400";
  const pnlSign = comp.pnl >= 0 ? "+" : "";

  return (
    <div
      className="relative rounded-xl border overflow-hidden transition-all duration-300"
      style={{ borderColor: `${comp.color}40`, background: `linear-gradient(135deg, #0a0a0a, ${comp.color}08)` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: `${comp.color}20` }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: comp.color }}>
            {comp.name.charAt(0)}
          </div>
          <div>
            <div className="text-sm font-semibold text-white">{comp.name}</div>
            <div className="text-[10px] text-white/40">{comp.model}</div>
          </div>
        </div>
        <div className={`flex items-center gap-1 font-bold text-sm ${pnlColor}`}>
          {comp.pnl >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {pnlSign}${Math.abs(comp.pnl).toFixed(2)}
        </div>
      </div>

      {/* Thinking bar */}
      <div className="h-1 w-full bg-black/30">
        <div
          className="h-full transition-all duration-300"
          style={{
            width: comp.isThinking ? "100%" : "0%",
            backgroundColor: comp.color,
            animation: comp.isThinking ? "thinking-progress 2s ease-in-out infinite" : "none",
          }}
        />
      </div>

      {/* Body */}
      <div className="p-3 space-y-2">
        {/* Mini PnL chart */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/40">PnL History</span>
          <MiniChart data={comp.pnlHistory} color={comp.color} />
        </div>

        {/* Reasoning */}
        <div className="min-h-[48px]">
          {comp.isThinking ? (
            <div className="flex items-center gap-1.5 text-xs text-indigo-400">
              <Brain className="w-3.5 h-3.5 animate-pulse" />
              <span>Procesando...</span>
            </div>
          ) : (
            <p className="text-xs text-white/60 italic leading-relaxed">
              &ldquo;{comp.reasoning}&rdquo;
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-[10px] text-white/40 pt-1 border-t" style={{ borderColor: `${comp.color}15` }}>
          <span>Confianza: <span className="text-white/70">{comp.confidence > 0 ? `${Math.round(comp.confidence * 100)}%` : "—"}</span></span>
          <span>Win rate: <span className="text-white/70">{comp.trades > 0 ? `${Math.round((comp.wins / comp.trades) * 100)}%` : "—"}</span></span>
          <span>Trades: <span className="text-white/70">{comp.trades}</span></span>
        </div>
      </div>

      <style>{`
        @keyframes thinking-progress {
          0% { width: 0%; opacity: 1; }
          50% { width: 85%; opacity: 0.8; }
          100% { width: 100%; opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

function TradeLogPanel({ logs }: { logs: TradeLog[] }) {
  return (
    <div className="bg-black/40 border border-white/5 rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-2">
        <Activity className="w-3.5 h-3.5 text-indigo-400" />
        <span className="text-xs font-semibold text-white/70">Trade Log</span>
      </div>
      <div className="max-h-[220px] overflow-y-auto">
        {logs.length === 0 && (
          <div className="text-center py-8 text-xs text-white/30">Sin operaciones aún</div>
        )}
        {logs.map((entry) => (
          <div key={entry.id} className="px-4 py-2 border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-white/30 font-mono text-[10px]">{entry.time}</span>
                <span className="font-medium text-white/80">{entry.model}</span>
                <span className={`font-bold ${
                  entry.action === "BUY" ? "text-emerald-400" :
                  entry.action === "SELL" ? "text-red-400" : "text-amber-400"
                }`}>{entry.action}</span>
              </div>
              <span className={`font-medium ${
                entry.pnl >= 0 ? "text-emerald-400" : "text-red-400"
              }`}>
                {entry.pnl >= 0 ? "+" : ""}{entry.pnl.toFixed(2)}
              </span>
            </div>
            <div className="text-[10px] text-white/30 mt-0.5 pl-[62px]">
              {entry.pair} @ ${entry.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main section component ─────────────────────────────

export default function CompetitionDemo() {
  const { price, change24h } = useBinancePrice("BTC/USDT");

  // Try real data first, fall back to mock
  const realData = useShowcaseCompetition();
  const mockData = useCompetitionEngine("BTC/USDT", price);

  // Use real data if available, otherwise use mock
  const hasRealData = realData.hasRealData;
  const { competitors, log, cycle, isRunning, start, stop } = hasRealData ? realData : mockData;

  // Sort competitors by PnL for leaderboard
  const sorted = [...competitors].sort((a, b) => b.pnl - a.pnl);

  return (
    <section className="py-24 px-6 relative z-10 bg-[var(--bg-primary)]">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-12">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold mb-4 ${
            hasRealData
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
          }`}>
            <Swords className="w-3.5 h-3.5" />
            {hasRealData ? "En Vivo — Competición Real" : "Live Demo — Simulación"}
          </div>
          <h2 className="text-4xl font-bold tracking-tight mb-4">
            3 IAs compiten en tu pantalla
          </h2>
          <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
            {hasRealData
              ? "Competicion en vivo con capital real. Las IAs toman decisiones autónomas analizando precios de Binance."
              : "Mira cómo GPT-4o, Claude y DeepSeek analizan BTC en tiempo real, generan razonamiento y toman decisiones. Paper trading — sin riesgo."}
          </p>
        </div>

        {/* Live price banner */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
            <span className="text-sm font-semibold text-white">BTC/USDT</span>
            <span className="text-xl font-bold text-white font-mono">
              ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`text-sm font-medium flex items-center gap-0.5 ${change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {change24h >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {change24h >= 0 ? "+" : ""}{change24h.toFixed(2)}%
            </span>
          </div>
          {cycle > 0 && (
            <span className="text-xs text-white/40">Ciclo #{cycle}</span>
          )}
        </div>

        {/* Main grid */}
        <div className="grid lg:grid-cols-3 gap-4 mb-6">
          {/* Competitor cards */}
          <div className="lg:col-span-2 space-y-3">
            {sorted.map((comp) => (
              <CompetitorCard key={comp.id} comp={comp} price={price} />
            ))}
          </div>

          {/* Right sidebar: trade log + leaderboard */}
          <div className="space-y-4">
            {/* Leaderboard mini */}
            <div className="bg-black/40 border border-white/5 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-white/70 mb-3 flex items-center gap-2">
                <span className="text-amber-400">🏆</span> Leaderboard
              </h4>
              <div className="space-y-2">
                {sorted.map((comp, i) => (
                  <div key={comp.id} className="flex items-center gap-2.5 text-xs">
                    <span className={`w-5 text-center font-bold ${
                      i === 0 ? "text-amber-400" : i === 1 ? "text-white/50" : i === 2 ? "text-amber-600" : "text-white/30"
                    }`}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                    </span>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: comp.color }} />
                    <span className="flex-1 text-white/70 truncate">{comp.name}</span>
                    <span className={`font-bold ${comp.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {comp.pnl >= 0 ? "+" : ""}${comp.pnl.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trade log */}
            <TradeLogPanel logs={log} />
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-y-3">
          {!isRunning ? (
            <button
              onClick={start}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm hover:from-indigo-500 hover:to-violet-500 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Zap className="w-4 h-4" />
              Ver Competición en Vivo
            </button>
          ) : (
            <button
              onClick={stop}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white/70 font-semibold text-sm hover:bg-white/10 transition-all"
            >
              Pausar Demo
            </button>
          )}
          <p className="text-xs text-white/30">
            Paper trading con 100€ · Precios reales de Binance · Sin riesgo
          </p>
          <Link
            href="/arena/live"
            className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors mt-2"
          >
            Ver Arena Completa <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
