"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";

export default function NewTraderPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lists fetched from APIs
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [exchangeKeys, setExchangeKeys] = useState<any[]>([]);
  // Placeholder for strategies
  const strategies = [{ id: "strat_custom", name: "Custom Builder Strategy" }];
  
  // Data load
  useEffect(() => {
     const fetchData = async () => {
        if (!auth.currentUser) return;
        const token = await auth.currentUser.getIdToken();
        
        // Fetch API Keys
        const resLlm = await fetch("/api/user/api-keys", { headers: { Authorization: `Bearer ${token}` } });
        const dataLlm = await resLlm.json();
        if (dataLlm.success) setApiKeys(dataLlm.data);

        // Fetch Exchange Keys
        const resEx = await fetch("/api/user/exchange-keys", { headers: { Authorization: `Bearer ${token}` } });
        const dataEx = await resEx.json();
        if (dataEx.success) setExchangeKeys(dataEx.data);
     };
     fetchData();
  }, []);

  // Form State
  const [formData, setFormData] = useState({
      name: "",
      mode: "paper",
      llmProviderId: "",
      exchangeKeyId: "",
      strategyId: "strat_custom",
      pairs: "BTC/USDT, ETH/USDT",
      maxAllocation: 1000,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    if (!formData.llmProviderId) { setError("Selecciona una API Key LLM"); return; }
    if (!formData.exchangeKeyId && formData.mode === "live") { setError("Selecciona una Exchange Key para Live Trading"); return; }
    
    setSubmitting(true);
    setError(null);

    try {
        const payload = {
            ...formData,
            pairs: formData.pairs.split(",").map(p => p.trim().toUpperCase()),
            maxAllocation: Number(formData.maxAllocation),
        };

        const token = await auth.currentUser.getIdToken();
        const res = await fetch("/api/user/traders", {
            method: "POST",
            headers: { 
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        router.push("/traders");
    } catch (err: any) {
        setError(err.message || "Error al crear trader");
        setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Crear Nuevo Trader</h1>
        <p className="text-[var(--text-secondary)]">
          Configura un nuevo agente IA para operar mercados.
        </p>
      </div>

      {error && <div className="p-3 badge-danger rounded-md text-sm">{error}</div>}

      <div className="glass-card p-8 border-t-4 border-t-[var(--brand-500)]">
         <form onSubmit={handleSubmit} className="space-y-8">
            {/* Sec 1: Básicos */}
            <div>
              <h3 className="text-lg font-semibold mb-4 border-b border-[var(--border-primary)] pb-2">Información Básica</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Nombre del Trader</label>
                    <input required type="text" className="input-field" placeholder="Ej: BTC Alpha Bot" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Modo de Operación</label>
                    <div className="grid grid-cols-2 gap-3">
                       <button type="button" onClick={() => setFormData({...formData, mode: "paper"})} className={`p-2 rounded-lg border text-sm font-medium transition-colors ${formData.mode === 'paper' ? 'bg-[var(--brand-500)]/20 border-[var(--brand-400)] text-[var(--brand-400)]' : 'bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-secondary)]'}`}>
                          Paper Trading
                       </button>
                       <button type="button" onClick={() => setFormData({...formData, mode: "live"})} className={`p-2 rounded-lg border text-sm font-medium transition-colors ${formData.mode === 'live' ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-secondary)]'}`}>
                          Live Trading
                       </button>
                    </div>
                 </div>
              </div>
            </div>

            {/* Sec 2: Conexiones */}
            <div>
              <h3 className="text-lg font-semibold mb-4 border-b border-[var(--border-primary)] pb-2 flex justify-between items-center">
                  Conexiones IA y Mercado
                  <span className="text-xs font-normal text-[var(--text-tertiary)] bg-[var(--bg-secondary)] px-2 py-1 rounded">Requeridas</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">API Key LLM</label>
                    <select required className="input-field" value={formData.llmProviderId} onChange={(e) => setFormData({...formData, llmProviderId: e.target.value})}>
                        <option value="" disabled>Selecciona una API Key</option>
                        {apiKeys.map(k => <option key={k.id} value={k.id}>{k.name} ({k.provider})</option>)}
                    </select>
                    {apiKeys.length === 0 && <p className="text-xs text-[var(--warning)] mt-1">No tienes llaves configuradas. Ve a <a href="/settings/api-keys" className="underline">Ajustes</a> para añadir una.</p>}
                 </div>
                 
                 <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Exchange Key {formData.mode === "paper" ? "(Opcional)" : "*(Requerida)"}</label>
                    <select required={formData.mode === "live"} className="input-field" value={formData.exchangeKeyId} onChange={(e) => setFormData({...formData, exchangeKeyId: e.target.value})}>
                        <option value="">{formData.mode === "paper" ? "Usar Precios de Mercado Global" : "Selecciona una Exchange Key"}</option>
                        {exchangeKeys.map(k => <option key={k.id} value={k.id}>{k.name} ({k.provider})</option>)}
                    </select>
                 </div>
              </div>
            </div>

            {/* Sec 3: Estrategia y Riesgo */}
            <div>
              <h3 className="text-lg font-semibold mb-4 border-b border-[var(--border-primary)] pb-2">Estrategia y Riesgo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                 <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Estrategia Vinculada</label>
                    <select required className="input-field" value={formData.strategyId} onChange={(e) => setFormData({...formData, strategyId: e.target.value})}>
                        {strategies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">Podrás editar la estrategia en el Strategy Studio.</p>
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Pares (Separados por coma)</label>
                    <input required type="text" className="input-field" placeholder="BTC/USDT, ETH/USDT, SOL/USDT" value={formData.pairs} onChange={(e) => setFormData({...formData, pairs: e.target.value})} />
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Capital Máximo (USD)</label>
                    <div className="relative">
                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">$</span>
                       <input required type="number" min="10" className="input-field pl-8" value={formData.maxAllocation} onChange={(e) => setFormData({...formData, maxAllocation: Number(e.target.value)})} />
                    </div>
                 </div>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-[var(--border-primary)]">
               <button type="button" onClick={() => router.push("/traders")} className="btn-secondary mr-3">Cancelar</button>
               <button type="submit" disabled={submitting || (apiKeys.length === 0)} className="btn-primary min-w-[150px]">
                  {submitting ? "Creando..." : "Crear Trader"}
               </button>
            </div>
         </form>
      </div>
    </div>
  );
}
