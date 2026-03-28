"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase/client";
import { useNotificationStore } from "@/stores/notifications";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

// Mismas constantes que usamos en otras pantallas para Providers
const MODELS_BY_PROVIDER: Record<string, {id: string, name: string}[]> = {
  openrouter: [
    { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet" },
    { id: "openai/gpt-4o", name: "GPT-4o" },
    { id: "deepseek/deepseek-chat", name: "DeepSeek Chat" },
    { id: "google/gemini-pro-1.5", name: "Gemini 1.5 Pro" }
  ],
  openai: [
    { id: "gpt-4o", name: "GPT-4o" },
    { id: "gpt-4-turbo", name: "GPT-4 Turbo" }
  ],
  anthropic: [
    { id: "claude-3-5-sonnet-20240620", name: "Claude 3.5 Sonnet" }
  ],
  deepseek: [
    { id: "deepseek-chat", name: "DeepSeek Chat" }
  ]
};

function EquityCurve({ data }: { data: number[] }) {
  if (data.length === 0) return null;
  const min = Math.min(...data) * 0.98;
  const max = Math.max(...data) * 1.02;
  const range = (max - min) || 1;
  const h = 200;
  const w = 600;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1 || 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");

  const fillPoints = `0,${h} ${points} ${w},${h}`;
  const positive = data[data.length - 1] >= data[0];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[200px]" preserveAspectRatio="none">
      <defs>
        <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={positive ? "var(--success)" : "var(--danger)"} stopOpacity="0.3" />
          <stop offset="100%" stopColor={positive ? "var(--success)" : "var(--danger)"} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPoints} fill="url(#equityGrad)" />
      <polyline points={points} fill="none" stroke={positive ? "var(--success)" : "var(--danger)"} strokeWidth={3} strokeLinejoin="round" />
    </svg>
  );
}

export default function BacktestLabPage() {
  const { user } = useAuth();
  const isFree = user?.subscriptionStatus === "incomplete";

  const [pair, setPair] = useState("BTC/USDT");
  const [strategyId, setStrategyId] = useState("");
  const [apiKeyId, setApiKeyId] = useState("");
  const [model, setModel] = useState("");
  const [timeframe, setTimeframe] = useState("1h");
  const [capital, setCapital] = useState(1000);
  
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [strategies, setStrategies] = useState<any[]>([]);

  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [equityData, setEquityData] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!auth.currentUser) return;
      const token = await auth.currentUser.getIdToken();
      
      const resKeys = await fetch("/api/user/api-keys", { headers: { Authorization: `Bearer ${token}` } });
      const dataKeys = await resKeys.json();
      if (dataKeys.success) setApiKeys(dataKeys.data);

      const resStrat = await fetch("/api/user/strategies", { headers: { Authorization: `Bearer ${token}` } });
      const dataStrat = await resStrat.json();
      if (dataStrat.success) {
        setStrategies(dataStrat.data);
        if (dataStrat.data.length > 0) setStrategyId(dataStrat.data[0].id);
      }
    };
    loadData();
  }, []);

  const addToast = useNotificationStore((state) => state.addToast);

  const handleRun = async () => {
    if (!auth.currentUser) return;
    if (!pair || !strategyId || !apiKeyId || !model || capital <= 0) {
      setError("Rellena todos los campos de configuración.");
      addToast({ type: "warning", title: "Configuración incompleta", message: "Rellena todos los campos antes de simular." });
      return;
    }

    setError(null);
    setRunning(true);
    setResults(null);
    setEquityData([]);

    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/engine/backtest", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ pair, strategyId, timeframe, capital, apiKeyId, model })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResults(data.data);

      // Calcular Equity Curve
      let currentEq = capital;
      const eqCurve = [currentEq];
      if (data.data.trades) {
        data.data.trades.forEach((t: any) => {
          currentEq = currentEq * (1 + (t.pnl / 100));
          eqCurve.push(currentEq);
        });
      }
      setEquityData(eqCurve);

      addToast({
        type: "success",
        title: "Backtest Finalizado",
        message: `Simulación de ${pair} ejecutada correctamente. P&L: ${data.data.globalStats.totalPnl}%`,
      });

    } catch (err: any) {
      const msg = err.message || "Error al ejecutar el backtest";
      setError(msg);
      addToast({ type: "error", title: "Error en la Simulación", message: msg });
    } finally {
      setRunning(false);
    }
  };

  const selectedProvider = apiKeys.find(k => k.id === apiKeyId)?.provider || "";

  return (
    <div className="relative">
      {isFree && (
        <div className="absolute inset-0 z-50 backdrop-blur-md bg-[var(--bg-primary)]/60 flex items-center justify-center rounded-2xl animate-fade-in">
          <div className="glass-card p-10 text-center max-w-md mx-4 shadow-2xl border border-[var(--brand-500)]/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--brand-500)]/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--brand-500)]/20 flex items-center justify-center text-3xl mb-4 border border-[var(--brand-500)]/30">
              🧪
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Backtest Lab es Premium</h2>
            <p className="text-[var(--text-secondary)] text-sm mb-6 leading-relaxed">
              Simula años de trading en segundos usando la inteligencia de modelos como GPT-4o. Desbloquea este laboratorio activando tu Plan Pro.
            </p>
            <Link href="/settings/billing" className="btn-primary w-full py-3 flex justify-center items-center gap-2">
              Mejorar a Pro por 29€
            </Link>
          </div>
        </div>
      )}

      <div className={`space-y-6 pb-12 transition-all ${isFree ? 'pointer-events-none select-none opacity-30 blur-[2px]' : ''}`}>
        {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white text-sm">🧪</span>
            Backtest Lab
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--brand-500)]/15 text-[var(--brand-400)] font-medium ml-2 border border-[var(--brand-500)]/30">PRO</span>
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Prueba tus estrategias cuantitativas mediante simulación de Inteligencia Artificial avanzada.
          </p>
        </div>
      </div>

      {error && <div className="p-3 badge-danger rounded-md text-sm">{error}</div>}

      {/* Config Form */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold mb-4 border-b border-[var(--border-primary)] pb-2">Parámetros de Simulación</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
             <label className="block text-xs text-[var(--text-tertiary)] mb-1">Estrategia Base</label>
             <select className="input-field text-sm py-2" value={strategyId} onChange={(e) => setStrategyId(e.target.value)}>
                <option value="" disabled>Selecciona una estrategia</option>
                {strategies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
             </select>
          </div>
          <div>
             <label className="block text-xs text-[var(--text-tertiary)] mb-1">Motor de IA (Brain)</label>
             <select className="input-field text-sm py-2" value={apiKeyId} onChange={(e) => { setApiKeyId(e.target.value); setModel(""); }}>
                <option value="">Seleccionar Key...</option>
                {apiKeys.map(k => <option key={k.id} value={k.id}>{k.name} ({k.provider})</option>)}
             </select>
          </div>
          <div className="lg:col-span-2">
             <label className="block text-xs text-[var(--text-tertiary)] mb-1">Modelo Específico</label>
             <select className="input-field text-sm py-2" value={model} onChange={(e) => setModel(e.target.value)} disabled={!apiKeyId}>
                <option value="">Seleccionar Modelo...</option>
                {MODELS_BY_PROVIDER[selectedProvider]?.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
             </select>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
             <label className="block text-xs text-[var(--text-tertiary)] mb-1">Par</label>
             <input type="text" className="input-field uppercase text-sm" value={pair} onChange={(e) => setPair(e.target.value.toUpperCase())} placeholder="BTC/USDT" />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-tertiary)] mb-1">Período Histórico</label>
            <div className="flex gap-1 w-full flex-wrap">
              {["1m", "3m", "6m", "1y"].map((r) => (
                <button key={r} onClick={() => setTimeframe(r)} className={`px-2 py-1.5 text-xs rounded-lg border transition-all flex-1 text-center font-medium ${
                  timeframe === r ? "bg-[var(--brand-500)]/15 border-[var(--brand-400)]/40 text-[var(--brand-300)]" : "border-[var(--border-primary)] text-[var(--text-secondary)]"
                }`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-[var(--text-tertiary)] mb-1">Capital Inicial</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] text-sm">$</span>
              <input type="number" className="input-field text-sm pl-7" value={capital} onChange={(e) => setCapital(Number(e.target.value))} />
            </div>
          </div>
          <button onClick={handleRun} disabled={running} className="btn-primary flex items-center justify-center gap-2 h-10 w-full lg:w-auto px-6">
            {running ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Simulando...</>
            ) : "Lanzar Test"}
          </button>
        </div>
      </div>

      {results && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Retorno Total", value: `${results.totalReturn > 0 ? "+" : ""}${results.totalReturn}%`, color: results.totalReturn >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]" },
              { label: "Win Rate", value: `${results.winRate}%`, color: "text-[var(--brand-400)]" },
              { label: "Max Drawdown", value: `-${results.maxDrawdown}%`, color: "text-[var(--danger)]" },
              { label: "Sharpe Ratio", value: results.sharpe.toFixed(2), color: "text-[var(--accent-400)]" },
            ].map((stat) => (
              <div key={stat.label} className="glass-card p-5 border-t-2" style={{ borderTopColor: 'currentColor', color: stat.color.match(/var\((.*?)\)/)?.[1] ? `var(${stat.color.match(/var\((.*?)\)/)?.[1]})` : 'transparent' }}>
                <div className="text-xs text-[var(--text-tertiary)] mb-1">{stat.label}</div>
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Equity Curve */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-4">Curva de Equity Estimada</h3>
            <EquityCurve data={equityData} />
            <div className="flex justify-between text-xs text-[var(--text-tertiary)] mt-2 px-1">
              <span>Inicio Simulación</span>
              <span>Medio Término</span>
              <span>Final ({results.trades?.[results.trades.length - 1]?.date})</span>
            </div>
          </div>

          {/* Trade History */}
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border-primary)]">
              <h3 className="text-lg font-semibold">Historial de Trades Algorítmicos</h3>
              <p className="text-xs text-[var(--text-tertiary)]">{results.trades?.length || 0} operaciones simuladas por Inteligencia Artificial</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider border-b border-[var(--border-primary)]">
                    <th className="px-6 py-3 text-left">Fecha</th>
                    <th className="px-6 py-3 text-left">Par</th>
                    <th className="px-6 py-3 text-center">Side</th>
                    <th className="px-6 py-3 text-right">Entrada</th>
                    <th className="px-6 py-3 text-right">Salida</th>
                    <th className="px-6 py-3 text-right">PnL</th>
                    <th className="px-6 py-3 text-left hidden lg:table-cell">Regla de Ejecución (Razonamiento Limitado)</th>
                  </tr>
                </thead>
                <tbody>
                  {results.trades?.map((trade: any, i: number) => (
                    <tr key={i} className="border-b border-[var(--border-primary)]/50 hover:bg-[var(--bg-hover)] transition-colors">
                      <td className="px-6 py-3 text-sm text-[var(--text-secondary)] whitespace-nowrap">{trade.date}</td>
                      <td className="px-6 py-3 text-sm font-semibold">{pair}</td>
                      <td className="px-6 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          trade.side === "BUY" ? "bg-[var(--success)]/10 text-[var(--success)]" : "bg-[var(--danger)]/10 text-[var(--danger)]"
                        }`}>
                          {trade.side}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-right font-mono">${trade.entry.toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
                      <td className="px-6 py-3 text-sm text-right font-mono">${trade.exit.toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
                      <td className={`px-6 py-3 text-sm text-right font-bold font-mono whitespace-nowrap ${trade.pnl >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                        {trade.pnl >= 0 ? "+" : ""}{trade.pnl}%
                      </td>
                      <td className="px-6 py-3 text-xs text-[var(--text-tertiary)] max-w-[250px] lg:max-w-xs truncate hidden lg:table-cell" title={trade.reasoning}>{trade.reasoning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
