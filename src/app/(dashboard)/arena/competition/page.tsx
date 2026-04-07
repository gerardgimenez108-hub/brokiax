"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCompetitionStore } from "@/stores/competition";
import RacingLane from "@/components/arena/RacingLane";
import LeaderboardPanel from "@/components/arena/LeaderboardPanel";
import EventFeed from "@/components/arena/EventFeed";
import CompetitionResults from "@/components/arena/CompetitionResults";
import { useNotificationStore } from "@/stores/notifications";
import { Play, Square, Swords, Zap, Clock, TrendingUp } from "lucide-react";
import { STRATEGY_INFO } from "@/lib/strategies";
import { getProviderModels, MODELS_BY_PROVIDER } from "@/lib/ai/models";
import type { ApiKey, LLMProvider } from "@/lib/types";

const TRADING_PAIRS = [
  "BTC/USDT", "ETH/USDT", "SOL/USDT", "XRP/USDT",
  "BNB/USDT", "DOGE/USDT", "AVAX/USDT", "LINK/USDT",
];

interface ParticipantConfig {
  apiKeyId: string;
  modelId: string;
  modelName: string;
  provider: LLMProvider | "";
}

export default function CompetitionPage() {
  const { user } = useAuth();
  const addToast = useNotificationStore((s) => s.addToast);

  const {
    session,
    events,
    isConnecting,
    isRunning,
    startCompetition,
    stopCompetition,
    clearSession,
  } = useCompetitionStore();

  // Config state
  const [participants, setParticipants] = useState<ParticipantConfig[]>([
    { apiKeyId: "", modelId: "", modelName: "", provider: "" },
    { apiKeyId: "", modelId: "", modelName: "", provider: "" },
  ]);
  const [pair, setPair] = useState("BTC/USDT");
  const [strategyId, setStrategyId] = useState("balanced");
  const [intervalSeconds, setIntervalSeconds] = useState(15);
  const [maxCycles, setMaxCycles] = useState(10);
  const [maxAllocation, setMaxAllocation] = useState(1000);

  // Data loaded from API
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Load API keys
  useEffect(() => {
    const loadKeys = async () => {
      if (!auth.currentUser) return;
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/user/api-keys", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setApiKeys(data.data);
    };
    loadKeys();
  }, []);

  // Show results when competition finishes
  useEffect(() => {
    if (session?.status === "finished" && !showResults) {
      setShowResults(true);
    }
  }, [session?.status, showResults]);

  const addParticipant = () => {
    if (participants.length >= 8) return;
    setParticipants([...participants, { apiKeyId: "", modelId: "", modelName: "", provider: "" }]);
  };

  const removeParticipant = (index: number) => {
    if (participants.length <= 2) return;
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const updateParticipant = (index: number, field: keyof ParticipantConfig, value: string) => {
    const updated = [...participants];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-fill modelName when modelId changes
    if (field === "modelId") {
      const allModels = Object.values(MODELS_BY_PROVIDER).flat();
      const model = allModels.find((m) => m.id === value);
      if (model) {
        updated[index].modelName = model.name;
      }
    }

    // Auto-detect provider from apiKey
    if (field === "apiKeyId") {
      const key = apiKeys.find((k) => k.id === value);
      if (key) {
        updated[index].provider = key.provider;
        // Set first model for that provider if none selected
        const providerModels = getProviderModels(key.provider);
        if (providerModels?.length && !updated[index].modelId) {
          updated[index].modelId = providerModels[0].id;
          updated[index].modelName = providerModels[0].name;
        }
      }
    }

    setParticipants(updated);
  };

  const handleStart = async () => {
    // Validate
    const validParticipants = participants.filter(
      (p) => p.apiKeyId && p.modelId && p.modelName
    );
    if (validParticipants.length < 2) {
      addToast({ type: "error", title: "Configuración incompleta", message: "Selecciona al menos 2 participantes con API Key y modelo." });
      return;
    }

    try {
      const competitionId = await startCompetition(
        {
          pair,
          strategyId,
          intervalSeconds,
          maxCycles,
          maxAllocation,
        },
        validParticipants
      );
      addToast({ type: "success", title: "Competición iniciada", message: `${validParticipants.length} modelos compiten en ${pair}` });
    } catch (err: any) {
      addToast({ type: "error", title: "Error", message: err.message });
    }
  };

  const handleStop = async () => {
    if (!session?.id) return;
    await stopCompetition(session.id);
    addToast({ type: "info", title: "Competición detenida", message: "La sesión ha sido detenida." });
  };

  const handleRunAgain = () => {
    setShowResults(false);
    clearSession();
  };

  const strategyList = Object.entries(STRATEGY_INFO).map(([, info]) => ({ ...info }));

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white text-sm">
              <Swords className="w-4 h-4" />
            </span>
            Modo Competencia
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 font-medium ml-2 border border-indigo-500/30">BETA</span>
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Múltiples IAs compiten en tiempo real.paper trading
          </p>
        </div>

        {/* Controls */}
        {isRunning && session && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-sm text-white">Ciclo {session.currentCycle}/{session.config.maxCycles}</span>
            </div>
            <button
              onClick={handleStop}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all text-sm font-medium"
            >
              <Square className="w-4 h-4" />
              Detener
            </button>
          </div>
        )}
      </div>

      {/* Config Panel — shown when not running */}
      {!isRunning && !session && (
        <div className="glass-card p-6 space-y-6 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Trading pair */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                <Zap className="w-4 h-4 inline mr-1 text-amber-400" />
                Par de Trading
              </label>
              <select
                value={pair}
                onChange={(e) => setPair(e.target.value)}
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {TRADING_PAIRS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Strategy */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Estrategia
              </label>
              <select
                value={strategyId}
                onChange={(e) => setStrategyId(e.target.value)}
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {strategyList.map((s) => (
                  <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                ))}
              </select>
            </div>

            {/* Interval */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                <Clock className="w-4 h-4 inline mr-1 text-indigo-400" />
                Intervalo (segundos)
              </label>
              <input
                type="number"
                min={5}
                max={120}
                value={intervalSeconds}
                onChange={(e) => setIntervalSeconds(Number(e.target.value))}
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Max Cycles */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                <TrendingUp className="w-4 h-4 inline mr-1 text-emerald-400" />
                Ciclos máximos
              </label>
              <input
                type="number"
                min={3}
                max={50}
                value={maxCycles}
                onChange={(e) => setMaxCycles(Number(e.target.value))}
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Participants */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-white">
                Participantes ({participants.length}/8)
              </label>
              <button
                onClick={addParticipant}
                disabled={participants.length >= 8}
                className="text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition-colors"
              >
                + Añadir modelo
              </button>
            </div>

            <div className="space-y-3">
              {participants.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-[var(--text-tertiary)] w-5 shrink-0">#{i + 1}</span>

                  {/* API Key select */}
                  <select
                    value={p.apiKeyId}
                    onChange={(e) => updateParticipant(i, "apiKeyId", e.target.value)}
                    className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">API Key...</option>
                    {apiKeys.map((k) => (
                      <option key={k.id} value={k.id}>{k.name} ({k.provider})</option>
                    ))}
                  </select>

                  {/* Model select */}
                  <select
                    value={p.modelId}
                    onChange={(e) => updateParticipant(i, "modelId", e.target.value)}
                    className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Modelo...</option>
                    {p.provider && getProviderModels(p.provider).map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                    {!p.provider && Object.values(MODELS_BY_PROVIDER).flat().map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>

                  {/* Remove button */}
                  {participants.length > 2 && (
                    <button
                      onClick={() => removeParticipant(i)}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors px-2"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Start button */}
          <button
            onClick={handleStart}
            disabled={isConnecting}
            className="btn-primary w-full py-3 text-base disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isConnecting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Iniciando...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Iniciar Competición
              </>
            )}
          </button>
        </div>
      )}

      {/* Loading / waiting state */}
      {isRunning && !session && (
        <div className="glass-card p-12 text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-[var(--text-secondary)]">Conectando a la sesión...</p>
        </div>
      )}

      {/* Live Race View */}
      {isRunning && session && (
        <div className="space-y-4">
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
        </div>
      )}

      {/* Results Modal */}
      {showResults && session && (
        <CompetitionResults
          leaderboard={session.leaderboard}
          onClose={() => setShowResults(false)}
          onRunAgain={handleRunAgain}
        />
      )}
    </div>
  );
}
