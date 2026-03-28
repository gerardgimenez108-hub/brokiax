"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase/client";
import { Trader } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";

export default function TradersPage() {
  const { user } = useAuth();
  const isFree = user?.subscriptionStatus === "incomplete";
  
  const [traders, setTraders] = useState<Trader[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTraders();
  }, []);

  const fetchTraders = async () => {
    if (!auth.currentUser) return;
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/user/traders", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTraders(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, action: "start" | "stop" | "pause") => {
    if (!auth.currentUser) return;
    try {
      // Optimistic update
      setTraders(traders.map(t => {
        if (t.id === id) {
          const newStatus = action === "start" ? "active" : action === "stop" ? "stopped" : "paused";
          return { ...t, status: newStatus as any };
        }
        return t;
      }));

      const token = await auth.currentUser.getIdToken();
      await fetch(`/api/user/traders/${id}`, {
        method: "PATCH",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action })
      });
    } catch (err) {
      console.error(err);
      fetchTraders(); // Revert on error
    }
  };

  const [ticking, setTicking] = useState(false);

  const handleTickEngine = async () => {
    setTicking(true);
    try {
      // Typically needs a CRON_SECRET, but we hit it in DEV mode so it shouldn't reject
      const res = await fetch("/api/engine/tick", {
        method: "POST",
      });
      const data = await res.json();
      console.log("Engine tick result:", data);
      
      // Refresh the UI to see new PnL, open positions, etc.
      fetchTraders();
    } catch (err) {
      console.error("Error ticking engine manually:", err);
    } finally {
      setTimeout(() => setTicking(false), 500);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-[var(--success)] text-white";
      case "paused": return "bg-[var(--warning)] text-white";
      case "error": return "bg-[var(--danger)] text-white";
      default: return "bg-[var(--text-tertiary)] text-white";
    }
  };

  const getModeColor = (mode: string) => {
    return mode === "live" 
      ? "border-red-500/30 text-red-500 bg-red-500/10" 
      : "border-[var(--brand-400)]/30 text-[var(--brand-400)] bg-[var(--brand-400)]/10";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mis Traders</h1>
          <p className="text-[var(--text-secondary)]">
            Gestiona tus agentes de IA activos.
          </p>
        </div>
        <div className="flex items-center gap-3 w-max">
          {process.env.NODE_ENV !== "production" && (
            <button 
              onClick={handleTickEngine} 
              disabled={ticking}
              title="Dispara manualmente el CRON del Motor de Trading"
              className={`btn-secondary flex items-center gap-2 transition-all ${ticking ? "opacity-50" : ""}`}
            >
              <span className={`text-lg ${ticking ? "animate-spin inline-block" : ""}`}>⚙️</span>
              <span className="hidden sm:inline">Tick Engine</span>
            </button>
          )}
          {isFree && traders.length >= 1 ? (
             <Link href="/settings/billing" className="btn-primary flex items-center gap-2 bg-[var(--brand-500)] hover:bg-[var(--brand-400)] text-white border-none shadow-[0_0_15px_rgba(var(--brand-500-rgb),0.3)]">
               <span>🚀</span> Límite Alcanzado (Pro)
             </Link>
          ) : (
             <Link href="/traders/new" className="btn-primary flex items-center gap-2">
               <span className="text-xl leading-none">+</span> Nuevo Trader
             </Link>
          )}
        </div>
      </div>

      {loading ? (
        <div className="glass-card p-12 flex justify-center items-center">
          <span className="w-8 h-8 border-2 border-[var(--text-secondary)] border-t-[var(--brand-500)] rounded-full animate-spin" />
        </div>
      ) : traders.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center p-16 text-center border-dashed border-2">
          <div className="w-20 h-20 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mb-6 text-3xl">
            🤖
          </div>
          <h3 className="text-xl font-semibold mb-2">No tienes traders activos</h3>
          <p className="text-[var(--text-secondary)] mb-8 max-w-md">
            Un trader es una combinación de un modelo LLM, una conexión de Exchange y una Estrategia. Crea tu primer agente para empezar a operar.
          </p>
          <Link href="/traders/new" className="btn-primary text-base px-8 py-3">
            Crear tu primer Trader
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {traders.map((trader) => (
             <div key={trader.id} className="glass-card overflow-hidden flex flex-col relative group border hover:border-[var(--brand-500)]/50 transition-colors">
                
                {trader.status === "active" && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-[var(--success)] shadow-[0_0_10px_var(--success)]" />
                )}

                <div className="p-5 border-b border-[var(--border-primary)] flex justify-between items-start bg-[var(--bg-secondary)]/50">
                    <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center text-xl shadow-inner shrink-0">
                            🤖
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-lg hover:text-[var(--brand-400)] transition-colors">
                                    <Link href={`/traders/${trader.id}`}>{trader.name}</Link>
                                </h3>
                                <div className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getModeColor(trader.mode)}`}>
                                    {trader.mode}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-[var(--text-secondary)]">
                                <span className="bg-[var(--bg-elevated)] px-2 py-1 rounded-md">{trader.pairs.join(", ")}</span>
                                <span className="bg-[var(--bg-elevated)] px-2 py-1 rounded-md">Max: ${(trader.maxAllocation || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${getStatusColor(trader.status)}`}>
                        {trader.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                        {trader.status.toUpperCase()}
                    </div>
                </div>

                <div className="p-5 flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <div className="text-xs text-[var(--text-tertiary)] mb-1">P&L (Hoy)</div>
                        <div className="font-semibold text-[var(--text-primary)]">$0.00</div>
                    </div>
                    <div>
                        <div className="text-xs text-[var(--text-tertiary)] mb-1">P&L (Total)</div>
                        <div className={`font-semibold ${(trader.totalPnlPercent || 0) >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>{(trader.totalPnlPercent || 0).toFixed(2)}%</div>
                    </div>
                    <div>
                        <div className="text-xs text-[var(--text-tertiary)] mb-1">Posiciones</div>
                        <div className="font-semibold text-[var(--text-primary)]">{trader.openPositions || 0}</div>
                    </div>
                    <div>
                        <div className="text-xs text-[var(--text-tertiary)] mb-1">Asignado</div>
                        <div className="font-semibold text-[var(--text-primary)]">${(trader.currentAllocation || 0).toLocaleString()}</div>
                    </div>
                </div>

                <div className="p-4 border-t border-[var(--border-primary)] flex justify-between items-center bg-[var(--bg-secondary)]/30">
                    <div className="text-xs text-[var(--text-tertiary)]">
                        Última acción: --
                    </div>
                    <div className="flex gap-2">
                        {trader.status !== "active" ? (
                            <button 
                                onClick={() => handleStatusChange(trader.id, "start")}
                                className="px-4 py-1.5 bg-[var(--success)]/10 text-[var(--success)] hover:bg-[var(--success)]/20 border border-[var(--success)]/20 rounded-md text-xs font-medium transition-colors"
                            >
                                Iniciar
                            </button>
                        ) : (
                            <button 
                                onClick={() => handleStatusChange(trader.id, "stop")}
                                className="px-4 py-1.5 bg-[var(--danger)]/10 text-[var(--danger)] hover:bg-[var(--danger)]/20 border border-[var(--danger)]/20 rounded-md text-xs font-medium transition-colors"
                            >
                                Detener
                            </button>
                        )}
                        <Link 
                            href={`/traders/${trader.id}`} 
                            className="px-4 py-1.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-primary)] rounded-md text-xs font-medium transition-colors"
                        >
                            Detalles
                        </Link>
                    </div>
                </div>
             </div>
          ))}
        </div>
      )}
    </div>
  );
}
