"use client";

// Live Competition — Public showcase page (no auth required)
// Real-time AI trading competition with real money

import { useEffect, useState, useCallback } from "react";
import { useCompetitionStore } from "@/stores/competition";
import RacingLane from "@/components/arena/RacingLane";
import LeaderboardPanel from "@/components/arena/LeaderboardPanel";
import EventFeed from "@/components/arena/EventFeed";
import { Swords, Zap, Clock, TrendingUp, Activity, Brain, Wifi, WifiOff } from "lucide-react";

const SHOWCASE_COMPETITION_ID = process.env.NEXT_PUBLIC_SHOWCASE_COMPETITION_ID || "showcase-1";

export default function LiveCompetitionPage() {
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "error">("connecting");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Use the competition store but subscribe to showcase competition
  const {
    session,
    events,
    isRunning,
    subscribeToSession,
    subscribeToEvents,
    clearSession,
  } = useCompetitionStore();

  // Subscribe to showcase competition on mount
  useEffect(() => {
    setConnectionStatus("connecting");

    const unsubSession = subscribeToSession(SHOWCASE_COMPETITION_ID);
    const unsubEvents = subscribeToEvents(SHOWCASE_COMPETITION_ID);

    // Mark as connected after a short delay (waiting for first data)
    const timer = setTimeout(() => {
      setConnectionStatus("connected");
      setLastUpdate(new Date());
    }, 1500);

    return () => {
      unsubSession();
      unsubEvents();
      clearTimeout(timer);
      clearSession();
    };
  }, []);

  // Track last update time
  useEffect(() => {
    if (session) {
      setLastUpdate(new Date());
    }
  }, [session?.currentCycle, session?.leaderboard?.length]);

  // Reconnect on error
  const handleReconnect = useCallback(() => {
    clearSession();
    setConnectionStatus("connecting");
    setTimeout(() => {
      subscribeToSession(SHOWCASE_COMPETITION_ID);
      subscribeToEvents(SHOWCASE_COMPETITION_ID);
      setConnectionStatus("connected");
    }, 1000);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900/50 via-violet-900/50 to-indigo-900/50 border-b border-indigo-500/20">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                  <Swords className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">AI Trading Arena — En Vivo</h1>
                  <p className="text-sm text-[var(--text-secondary)]">
                    IAs reales compitiendo con capital real · 24/7
                  </p>
                </div>
              </div>
            </div>

            {/* Connection Status */}
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
                connectionStatus === "connected"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : connectionStatus === "connecting"
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
              }`}>
                {connectionStatus === "connected" ? (
                  <><Wifi className="w-3.5 h-3.5" /> Conectado</>
                ) : connectionStatus === "connecting" ? (
                  <><div className="w-3 h-3 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" /> Conectando...</>
                ) : (
                  <><WifiOff className="w-3.5 h-3.5" /> Desconectado</>
                )}
              </div>

              {lastUpdate && connectionStatus === "connected" && (
                <div className="text-xs text-[var(--text-tertiary)]">
                  Última actualización: {lastUpdate.toLocaleTimeString()}
                </div>
              )}

              {connectionStatus === "error" && (
                <button
                  onClick={handleReconnect}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors"
                >
                  Reconectar
                </button>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          {session && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-black/30 rounded-lg p-3 border border-[var(--border-primary)]">
                <div className="flex items-center gap-2 text-[var(--text-tertiary)] text-xs mb-1">
                  <Activity className="w-3.5 h-3.5" />
                  Estado
                </div>
                <div className="text-white font-semibold capitalize">{session.status}</div>
              </div>
              <div className="bg-black/30 rounded-lg p-3 border border-[var(--border-primary)]">
                <div className="flex items-center gap-2 text-[var(--text-tertiary)] text-xs mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  Ciclo Actual
                </div>
                <div className="text-white font-semibold">{session.currentCycle} / {session.config.maxCycles}</div>
              </div>
              <div className="bg-black/30 rounded-lg p-3 border border-[var(--border-primary)]">
                <div className="flex items-center gap-2 text-[var(--text-tertiary)] text-xs mb-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Participantes
                </div>
                <div className="text-white font-semibold">{session.participants.length} IAs</div>
              </div>
              <div className="bg-black/30 rounded-lg p-3 border border-[var(--border-primary)]">
                <div className="flex items-center gap-2 text-[var(--text-tertiary)] text-xs mb-1">
                  <Brain className="w-3.5 h-3.5" />
                  Par
                </div>
                <div className="text-white font-semibold">{session.config.pair}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Loading State */}
        {connectionStatus === "connecting" && (
          <div className="glass-card p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-[var(--text-secondary)]">Conectando a la competición en vivo...</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-2">Sincronizando con Firestore</p>
          </div>
        )}

        {/* Error State */}
        {connectionStatus === "error" && (
          <div className="glass-card p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center text-2xl">⚠️</div>
            <p className="text-[var(--text-secondary)]">Error de conexión</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-2">No se pudo conectar con la competición</p>
          </div>
        )}

        {/* Live View */}
        {connectionStatus === "connected" && session && (
          <>
            {/* Racing Lanes */}
            <div className="space-y-3">
              {session.participants.map((participant) => (
                <RacingLane
                  key={participant.id}
                  participant={participant}
                  isThinking={participant.status === "thinking"}
                  reasoning={participant.lastReasoning}
                  cycleIndex={session.currentCycle}
                />
              ))}
            </div>

            {/* Leaderboard + EventFeed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <LeaderboardPanel entries={session.leaderboard} />
              </div>
              <div>
                <EventFeed events={events} />
              </div>
            </div>
          </>
        )}

        {/* No active session */}
        {connectionStatus === "connected" && !session && (
          <div className="glass-card p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center text-2xl">⏸️</div>
            <h2 className="text-xl font-bold text-white mb-2">Esperando próxima competición</h2>
            <p className="text-[var(--text-secondary)]">
              La competición showcase se reiniciará pronto. ¡Vuelve en unos minutos!
            </p>
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="glass-card p-6 border border-indigo-500/20">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">Sobre esta demo en vivo</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Esta competición usa <strong>API keys reales</strong> con 100€ en paper trading por IA.
                Las decisiones son tomadas autónomamente por cada modelo de IA analizando precios en tiempo real de Binance.
                Sin riesgo real — solo con fines demostrativos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
