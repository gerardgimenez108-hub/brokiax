"use client";

import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Bot,
  Wallet,
  TrendingUp,
  BarChart3,
  Plus,
  Activity,
  ShieldAlert,
  Clock3,
} from "lucide-react";
import { PLAN_LIMITS, PlanTier, RuntimeStatusSnapshot } from "@/lib/types";

interface Trader {
  id: string;
  name: string;
  status: "active" | "inactive" | "error";
  initialCapital: number;
  currentValue?: number;
  currentAllocation: number;
  availableCash?: number;
  realizedPnl?: number;
  unrealizedPnl?: number;
  totalPnl: number;
  totalPnlPercent?: number;
  winRate?: number;
  strategy: string;
  exchange: string;
  openPositions?: number;
}

const EMPTY_EQUITY_DATA = [
  ...Array(12).fill(0).map((_, i) => ({ date: `D-${12 - i}`, value: 0 })),
  { date: "Now", value: 0 },
];

function formatRelativeRuntimeTime(value?: string | null) {
  if (!value) {
    return "Never";
  }

  const diffMs = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) {
    return "Now";
  }

  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) {
    return "Just now";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function getRuntimeTone(runtime: RuntimeStatusSnapshot) {
  const heartbeatAgeMs = runtime.lastHeartbeatAt
    ? Date.now() - new Date(runtime.lastHeartbeatAt).getTime()
    : Number.POSITIVE_INFINITY;

  if (runtime.state === "error") {
    return {
      label: "Error",
      dot: "bg-[var(--danger)]",
      text: "text-[var(--danger)]",
      border: "border-[var(--danger)]/40",
      icon: ShieldAlert,
    };
  }

  if (runtime.state === "running") {
    return {
      label: "Running",
      dot: "bg-[var(--warning)]",
      text: "text-[var(--warning)]",
      border: "border-[var(--warning)]/30",
      icon: Activity,
    };
  }

  if (heartbeatAgeMs > 10 * 60 * 1000) {
    return {
      label: "Stale",
      dot: "bg-[var(--warning)]",
      text: "text-[var(--warning)]",
      border: "border-[var(--warning)]/30",
      icon: Clock3,
    };
  }

  if (runtime.state === "degraded") {
    return {
      label: "Waiting",
      dot: "bg-[var(--warning)]",
      text: "text-[var(--warning)]",
      border: "border-[var(--warning)]/30",
      icon: Clock3,
    };
  }

  return {
    label: "Healthy",
    dot: "bg-[var(--success)]",
    text: "text-[var(--success)]",
    border: "border-[var(--success)]/30",
    icon: Activity,
  };
}

function EquityChart({ data }: { data: { date: string; value: number }[] }) {
  const values = data.map((d) => d.value);
  const min = Math.min(...values) * 0.99;
  const max = Math.max(...values) * 1.01;
  const range = max - min || 1;
  const h = 250;
  const w = 800;
  const points = values.map((v, i) => `${(i / (Math.max(1, values.length - 1))) * w},${h - ((v - min) / range) * h}`).join(" ");
  const fillPoints = `0,${h} ${points} ${w},${h}`;
  const positive = values[values.length - 1] >= values[0];

  const isEmpty = values.every(v => v === 0);
  const strokeColor = isEmpty ? "var(--border-primary)" : positive ? "var(--success)" : "var(--danger)";

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[250px]" preserveAspectRatio="none">
        <defs>
          <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity={isEmpty ? "0.1" : "0.25"} />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((pct) => (
          <line key={pct} x1="0" y1={h * pct} x2={w} y2={h * pct} stroke="var(--border-primary)" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
        ))}
        <polygon points={fillPoints} fill="url(#eqGrad)" />
        <polyline points={points} fill="none" stroke={strokeColor} strokeWidth={isEmpty ? 1.5 : 2.5} strokeLinejoin="round" />
        {!isEmpty && (() => {
          const lastX = w;
          const lastY = h - ((values[values.length - 1] - min) / range) * h;
          return <circle cx={lastX} cy={lastY} r={4} fill={strokeColor} />;
        })()}
      </svg>
      {isEmpty && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-tertiary)] bg-black/5 backdrop-blur-sm rounded-lg">
          <BarChart3 className="w-8 h-8 mb-2 opacity-50" />
          <span className="text-sm">{/* filled by parent */}</span>
        </div>
      )}
      <div className="flex justify-between text-xs text-[var(--text-tertiary)] mt-2 px-1">
        {data.filter((_, i) => i % 3 === 0).map((d, i) => (
          <span key={i}>{d.date}</span>
        ))}
      </div>
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="glass-card p-5 animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <div className="h-4 w-24 bg-[var(--bg-hover)] rounded" />
        <div className="h-6 w-6 bg-[var(--bg-hover)] rounded" />
      </div>
      <div className="h-8 w-20 bg-[var(--bg-hover)] rounded mt-2" />
    </div>
  );
}

export default function DashboardPage() {
  const { user, firebaseUser } = useAuth();
  const [traders, setTraders] = useState<Trader[]>([]);
  const [equityHistory, setEquityHistory] = useState(EMPTY_EQUITY_DATA);
  const [runtimeStatus, setRuntimeStatus] = useState<RuntimeStatusSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("dashboard");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = await firebaseUser?.getIdToken();
        if (!token) { setLoading(false); return; }
        
        const response = await fetch("/api/user/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setTraders(data.data?.traders || []);
          setEquityHistory(data.data?.equityHistory?.length ? data.data.equityHistory : EMPTY_EQUITY_DATA);
          setRuntimeStatus(data.data?.runtimeStatus || []);
        }
      } catch (error) {
        console.error("Error fetching traders:", error);
      } finally {
        setLoading(false);
      }
    };

    if (firebaseUser) fetchDashboard();
    else setLoading(false);
  }, [firebaseUser]);

  const activeTraders = traders.filter(t => t.status === "active");
  const totalPnl = traders.reduce((acc, t) => acc + (t.totalPnl || 0), 0);
  const totalValue = traders.reduce((acc, t) => acc + (t.currentValue || t.initialCapital || 0), 0);
  const totalInitial = traders.reduce((acc, t) => acc + (t.initialCapital || 0), 0);
  const pnlPercent = totalInitial > 0 ? (totalPnl / totalInitial) * 100 : 0;
  const openPositionsCount = traders.reduce((acc, t) => acc + (t.openPositions || 0), 0);

  const planLimitValue = PLAN_LIMITS[(user?.plan || "starter") as PlanTier].maxTraders;
  const planLimit = Number.isFinite(planLimitValue) ? planLimitValue : "∞";

  const stats = [
    { label: t("activeTraders"), value: `${activeTraders.length} / ${planLimit}`, icon: Bot, change: null, positive: true },
    { label: t("totalCapital"), value: `$${totalValue.toLocaleString()}`, icon: Wallet, change: totalInitial > 0 ? `${pnlPercent >= 0 ? "+" : ""}${pnlPercent.toFixed(1)}%` : null, positive: pnlPercent >= 0 },
    { label: t("totalPnl"), value: `${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)}`, icon: TrendingUp, change: totalInitial > 0 ? `${pnlPercent >= 0 ? "+" : ""}${pnlPercent.toFixed(1)}%` : null, positive: totalPnl >= 0 },
    { label: t("openPositions"), value: openPositionsCount.toString(), icon: BarChart3, change: null, positive: true },
  ];

  const runtimeCards = runtimeStatus.length
    ? runtimeStatus
    : ([
        {
          key: "trading-engine" as const,
          label: "Trading Engine",
          state: "idle" as const,
        },
        {
          key: "showcase-scheduler" as const,
          label: "Arena Showcase",
          state: "idle" as const,
        },
        {
          key: "competition-runner" as const,
          label: "Competition Runner",
          state: "idle" as const,
        },
      ] satisfies RuntimeStatusSnapshot[]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("welcome", { name: user?.displayName || "Trader" })}
          </h1>
          <p className="text-[var(--text-secondary)]">{t("summary")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/traders" className="btn-secondary">{t("myTraders")}</Link>
          <Link href="/traders/new" className="btn-primary">
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {t("newTrader")}
            </span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => <StatSkeleton key={i} />)}
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="glass-card p-5 group hover:scale-[1.02] transition-transform">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-[var(--text-secondary)]">{stat.label}</h3>
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <stat.icon className="w-4 h-4 text-indigo-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.change && (
                  <div className={`text-xs font-medium mt-1 ${stat.positive ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                    {stat.change} {t("fromStart")}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-semibold">{t("runtimeTitle")}</h3>
                <p className="text-xs text-[var(--text-tertiary)]">{t("runtimeSubtitle")}</p>
              </div>
              <span className="text-xs text-[var(--text-tertiary)]">{t("runtimeRefreshHint")}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {runtimeCards.map((runtime) => {
                const tone = getRuntimeTone(runtime);
                const ToneIcon = tone.icon;

                return (
                  <div
                    key={runtime.key}
                    className={`rounded-2xl border ${tone.border} bg-[var(--bg-secondary)] p-4`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold">{runtime.label}</div>
                        <div className="mt-1 text-xs text-[var(--text-tertiary)]">
                          {runtime.lastMessage || t("runtimeNoSignal")}
                        </div>
                      </div>
                      <div className={`rounded-xl p-2 bg-black/10 ${tone.text}`}>
                        <ToneIcon className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs">
                      <span className={`inline-flex items-center gap-2 ${tone.text}`}>
                        <span className={`w-2 h-2 rounded-full ${tone.dot}`} />
                        {tone.label}
                      </span>
                      <span className="text-[var(--text-tertiary)]">
                        {t("runtimeLastHeartbeat")}: {formatRelativeRuntimeTime(runtime.lastHeartbeatAt)}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-tertiary)]">
                      <span>
                        {t("runtimeOwner")}: {runtime.ownerId || t("runtimeUnknown")}
                      </span>
                      <span>
                        {runtime.lastDurationMs
                          ? `${runtime.lastDurationMs} ms`
                          : t("runtimeNoDuration")}
                      </span>
                    </div>
                    {runtime.key === "trading-engine" && (
                      <div className="mt-2 text-xs text-[var(--text-tertiary)]">
                        {t("runtimeProcessed")}: {runtime.lastProcessed ?? 0} · {t("runtimeSkipped")}:{" "}
                        {runtime.lastSkipped ?? 0}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Equity Chart */}
            <div className="lg:col-span-2 glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold">{t("portfolioEvolution")}</h3>
                  <p className="text-xs text-[var(--text-tertiary)]">{t("last90Days")}</p>
                </div>
                <div className="flex items-center gap-2">
                  {["7d", "30d", "90d", "All"].map((period) => (
                    <button key={period} disabled className={`px-3 py-1 text-xs rounded-lg transition-colors cursor-not-allowed opacity-50 ${
                      period === "90d"
                        ? "bg-[var(--brand-500)]/10 text-[var(--brand-400)] ring-1 ring-[var(--brand-500)]/30"
                        : "text-[var(--text-tertiary)] bg-[var(--bg-secondary)]"
                    }`}>
                      {period}
                    </button>
                  ))}
                </div>
              </div>
              <EquityChart data={equityHistory} />
            </div>

            {/* Active Traders */}
            <div className="glass-card p-6 flex flex-col h-full cursor-default">
              <h3 className="text-lg font-semibold mb-4">{t("activeTradersList")}</h3>
              <div className="space-y-3 flex-1">
                {activeTraders.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[var(--text-tertiary)] border-2 border-dashed border-[var(--border-primary)] rounded-xl">
                    <Bot className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-sm">{t("noActiveTraders")}</p>
                  </div>
                ) : (
                  activeTraders.map((trader) => (
                    <div key={trader.id} className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--border-secondary)] transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm">{trader.name}</span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
                          <span className="text-xs text-[var(--success)]">Active</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] mt-3">
                        <span className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-[var(--text-tertiary)]/10 text-[var(--text-secondary)]">{trader.exchange}</span>
                          <span>{trader.strategy}</span>
                        </span>
                        <span className={`font-bold ${trader.totalPnl >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                          {trader.totalPnlPercent && trader.totalPnlPercent >= 0 ? "+" : ""}
                          {(trader.totalPnlPercent || 0).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <Link href="/traders/new" className="block mt-4 p-4 rounded-xl border-2 border-dashed border-[var(--border-primary)] text-center text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--brand-500)]/5 hover:text-[var(--brand-400)] hover:border-[var(--brand-500)]/50 transition-all">
                {t("createNewTrader")}
              </Link>
            </div>
          </div>

          {/* Recent Trades */}
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border-primary)] flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{t("recentTrades")}</h3>
                <p className="text-xs text-[var(--text-tertiary)]">{t("recentTradesDesc")}</p>
              </div>
            </div>
            <div className="p-12 flex flex-col items-center justify-center text-[var(--text-tertiary)] text-center">
              <BarChart3 className="w-10 h-10 mb-3 opacity-30" />
              <p>{t("emptyHistory")}</p>
              <p className="text-xs mt-1 max-w-sm">{t("emptyHistoryDesc")}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
