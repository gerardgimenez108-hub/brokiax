"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase/client";
import { useNotificationStore } from "@/stores/notifications";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

const MODELS_BY_PROVIDER: Record<string, {id: string, name: string}[]> = {
  openrouter: [
    { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet" },
    { id: "openai/gpt-4o", name: "GPT-4o" },
    { id: "deepseek/deepseek-chat", name: "DeepSeek Chat" },
    { id: "google/gemini-pro-1.5", name: "Gemini 1.5 Pro" }
  ],
  openai: [
    { id: "gpt-4o", name: "GPT-4o" },
    { id: "gpt-4-turbo", name: "GPT-4 Turbo" },
    { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" }
  ],
  anthropic: [
    { id: "claude-3-5-sonnet-20240620", name: "Claude 3.5 Sonnet" },
    { id: "claude-3-opus-20240229", name: "Claude 3 Opus" }
  ],
  deepseek: [
    { id: "deepseek-chat", name: "DeepSeek Chat" }
  ]
};

export default function DebateArenaPage() {
  const { user } = useAuth();
  const isFree = user?.subscriptionStatus === "incomplete";

  const [pair, setPair] = useState("BTC/USDT");
  const [strategyId, setStrategyId] = useState("");
  const [models, setModels] = useState<{apiKeyId: string, model: string}[]>([
    { apiKeyId: "", model: "" },
    { apiKeyId: "", model: "" }
  ]);
  
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [strategies, setStrategies] = useState<any[]>([]);
  
  const [isDebating, setIsDebating] = useState(false);
  const [results, setResults] = useState<any>(null);
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

  const handleStartDebate = async () => {
    if (!auth.currentUser) return;
    
    // Validations
    if (!strategyId) { 
      setError("Selecciona una estrategia."); 
      addToast({ type: "warning", title: "Arena Incompleta", message: "Selecciona una estrategia." });
      return; 
    }
    if (!pair) { 
      setError("Introduce un par válido."); 
      addToast({ type: "warning", title: "Arena Incompleta", message: "Introduce un par válido." });
      return; 
    }
    const validModels = models.filter(m => m.apiKeyId && m.model);
    if (validModels.length < 2) { 
      setError("Necesitas al menos 2 modelos configurados para debatir."); 
      addToast({ type: "warning", title: "Arena Incompleta", message: "Necesitas al menos 2 modelos configurados para debatir." });
      return; 
    }

    setError(null);
    setIsDebating(true);
    setResults(null);

    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/engine/debate", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ pair, strategyId, models: validModels })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResults(data.data);
      addToast({
        type: "success",
        title: "Debate Concluido",
        message: `El Moderador ha llegado a un consenso: ${data.data.moderator.decision}`,
      });
    } catch (err: any) {
      const msg = err.message || "Error al invocar el Debate Arena";
      setError(msg);
      addToast({ type: "error", title: "Error en el Debate", message: msg });
    } finally {
      setIsDebating(false);
    }
  };

  const updateModel = (index: number, field: string, value: string) => {
    const newModels = [...models];
    newModels[index] = { ...newModels[index], [field]: value };
    if (field === "apiKeyId") newModels[index].model = ""; // reset model on key change
    setModels(newModels);
  };

  return (
    <div className="relative">
      {isFree && (
        <div className="absolute inset-0 z-50 backdrop-blur-md bg-[var(--bg-primary)]/60 flex items-center justify-center rounded-2xl animate-fade-in">
          <div className="glass-card p-10 text-center max-w-md mx-4 shadow-2xl border border-[var(--warning)]/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--warning)]/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--warning)]/20 flex items-center justify-center text-3xl mb-4 border border-[var(--warning)]/30">
              🧠
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Debate Arena es Premium</h2>
            <p className="text-[var(--text-secondary)] text-sm mb-6 leading-relaxed">
              Enfrenta a varios Agentes IA simultáneamente para alcanzar un consenso técnico. Desbloquea esta herramienta avanzada activando tu Plan Pro.
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
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-500 flex items-center justify-center text-white text-sm">🧠</span>
            Debate Arena
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-medium ml-2 border border-amber-500/30">ELITE</span>
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Múltiples modelos IA debaten y llegan a un consenso antes de ejecutar una operación.
          </p>
        </div>
        <button onClick={handleStartDebate} disabled={isDebating} className="btn-primary flex items-center gap-2">
          {isDebating ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Debatiendo...</>
          ) : (
            <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Iniciar Debate</>
          )}
        </button>
      </div>

      {error && <div className="p-3 badge-danger rounded-md text-sm">{error}</div>}

      {/* Config Form */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold mb-4 border-b border-[var(--border-primary)] pb-2">Configuración del Debate</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
             <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Estrategia Base</label>
             <select className="input-field" value={strategyId} onChange={(e) => setStrategyId(e.target.value)}>
                <option value="" disabled>Selecciona una estrategia</option>
                {strategies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
             </select>
          </div>
          <div>
             <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Par de Trading</label>
             <input type="text" className="input-field uppercase" value={pair} onChange={(e) => setPair(e.target.value.toUpperCase())} placeholder="BTC/USDT" />
          </div>
        </div>

        <h3 className="text-sm font-semibold mb-3">Modelos Participantes (Max 4)</h3>
        <div className="space-y-3">
          {models.map((m, i) => (
            <div key={i} className="flex flex-col sm:flex-row gap-3 items-end p-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)]">
               <div className="flex-1 w-full">
                 <label className="block text-xs text-[var(--text-tertiary)] mb-1">API Key {i+1}</label>
                 <select className="input-field py-2 text-sm" value={m.apiKeyId} onChange={(e) => updateModel(i, "apiKeyId", e.target.value)}>
                    <option value="">Seleccionar Key...</option>
                    {apiKeys.map(k => <option key={k.id} value={k.id}>{k.name} ({k.provider})</option>)}
                 </select>
               </div>
               <div className="flex-1 w-full">
                 <label className="block text-xs text-[var(--text-tertiary)] mb-1">Modelo de IA</label>
                 <select className="input-field py-2 text-sm" value={m.model} onChange={(e) => updateModel(i, "model", e.target.value)} disabled={!m.apiKeyId}>
                    <option value="">Seleccionar Modelo...</option>
                    {MODELS_BY_PROVIDER[apiKeys.find(k => k.id === m.apiKeyId)?.provider || ""]?.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                 </select>
               </div>
               {models.length > 2 && (
                 <button onClick={() => setModels(models.filter((_, idx) => idx !== i))} className="btn-secondary px-3 py-2 text-sm text-[var(--danger)] border-[var(--danger)] hover:bg-[var(--danger)]/10">❌</button>
               )}
            </div>
          ))}
          {models.length < 4 && (
            <button onClick={() => setModels([...models, {apiKeyId: "", model: ""}])} className="text-xs text-[var(--brand-400)] hover:underline flex items-center gap-1 mt-2">
              <span className="text-lg">+</span> Añadir Modelo
            </button>
          )}
        </div>
      </div>

      {results && (
        <>
          {/* Debate Messages */}
          <div className="space-y-4">
            {results.individual.map((res: any, i: number) => {
              const modelLabel = apiKeys.find(k => k.id === res.apiKeyId)?.provider || res.model;
              return (
                <div key={i} className="glass-card p-5 border-l-4 transition-all hover:scale-[1.005]" style={{ borderLeftColor: res.success ? "var(--brand-500)" : "var(--danger)" }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-primary)] text-sm font-bold shadow-sm border border-[var(--border-primary)]">
                        {res.model.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{res.model}</div>
                        <div className="text-xs text-[var(--text-tertiary)] uppercase">{modelLabel}</div>
                      </div>
                    </div>
                    {res.success ? (
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                          res.decision.action === "BUY" ? "bg-[var(--success)]/15 text-[var(--success)]" 
                          : res.decision.action === "SELL" ? "bg-[var(--danger)]/15 text-[var(--danger)]"
                          : "bg-[var(--warning)]/15 text-[var(--warning)]"
                        }`}>
                          {res.decision.action}
                        </span>
                        <span className="text-xs text-[var(--text-tertiary)]">
                          {Math.round(res.decision.confidence * 100)}% conf
                        </span>
                      </div>
                    ) : (
                      <span className="px-3 py-1 rounded-lg text-xs font-bold bg-[var(--danger)]/15 text-[var(--danger)]">ERROR</span>
                    )}
                  </div>
                  {res.success ? (
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">{res.decision.reasoning}</p>
                  ) : (
                    <p className="text-sm text-[var(--danger)]">{res.error}</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Moderator Result */}
          {results.moderator && (
            <div className="glass-card p-6 border-2 border-[var(--brand-500)]/30 bg-gradient-to-br from-[var(--brand-500)]/5 to-[var(--accent-500)]/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--brand-600)] to-[var(--accent-500)] flex items-center justify-center text-xl shadow-lg shadow-[var(--brand-500)]/20">⚖️</div>
                <div>
                  <h3 className="text-lg font-bold">Consenso del Moderador</h3>
                  <p className="text-xs text-[var(--text-tertiary)]">Resolución final basada en el debate</p>
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <span className={`px-4 py-2 rounded-xl text-sm font-bold ${
                    results.moderator.decision === "BUY" ? "bg-[var(--success)]/20 text-[var(--success)] ring-1 ring-[var(--success)]/30"
                    : results.moderator.decision === "SELL" ? "bg-[var(--danger)]/20 text-[var(--danger)] ring-1 ring-[var(--danger)]/30"
                    : "bg-[var(--warning)]/20 text-[var(--warning)] ring-1 ring-[var(--warning)]/30"
                  }`}>
                    {results.moderator.decision}
                  </span>
                  <div className="text-right">
                    <div className="text-lg font-bold">{Math.round(results.moderator.confidence * 100)}%</div>
                    <div className="text-xs text-[var(--text-tertiary)]">confianza</div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">{results.moderator.summary}</p>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}
