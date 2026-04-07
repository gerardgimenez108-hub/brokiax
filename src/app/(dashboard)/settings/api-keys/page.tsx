"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase/client";
import { LLMProvider } from "@/lib/types";
import { LLM_PROVIDER_OPTIONS, getProviderOption } from "@/lib/ai/models";

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [provider, setProvider] = useState<LLMProvider>("openrouter");
  const [rawKey, setRawKey] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const providerMeta = getProviderOption(provider);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    if (!auth.currentUser) return;
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/user/api-keys", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setKeys(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/user/api-keys", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, provider, rawKey }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      
      // Reset form and reload
      setName("");
      setRawKey("");
      setIsAdding(false);
      await fetchKeys();
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que quieres eliminar esta clave? Tus traders que la usen podrían fallar.")) return;
    if (!auth.currentUser) return;
    
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/user/api-keys/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        setKeys(keys.filter(k => k.id !== id));
      }
    } catch (err) {
      console.error("Error al eliminar", err);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">API Keys (LLMs)</h1>
          <p className="text-[var(--text-secondary)]">
            Gestiona tus credenciales de proveedores LLM y x402. Se cifran con AES-256-GCM antes de guardarse.
          </p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)} 
            className="btn-primary flex items-center gap-2 w-max"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Añadir API Key
          </button>
        )}
      </div>

      {isAdding && (
        <div className="glass-card p-6 border-l-4 border-l-[var(--brand-500)] animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--brand-500)]/5 rounded-bl-[100px] pointer-events-none" />
          
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h2 className="text-lg font-semibold">Nueva API Key</h2>
            <button onClick={() => setIsAdding(false)} className="text-[var(--text-secondary)] hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          {error && <div className="mb-4 p-3 badge-danger rounded-md text-sm relative z-10">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Nombre descriptivo
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="Ej: Mi clave de OpenRouter"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Proveedor
                </label>
                <select
                  required
                  className="input-field"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as LLMProvider)}
                >
                  {LLM_PROVIDER_OPTIONS.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {providerMeta?.helperText && (
                  <p className="text-xs text-[var(--text-tertiary)] mt-2">{providerMeta.helperText}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                {providerMeta?.credentialLabel || "Credencial"}
              </label>
              <input
                type="password"
                required
                className="input-field font-mono text-sm"
                placeholder={providerMeta?.placeholder || "sk-..."}
                value={rawKey}
                onChange={(e) => setRawKey(e.target.value)}
              />
              <p className="text-xs text-[var(--text-tertiary)] mt-2">
                ¿No la tienes? <a href={providerMeta?.url} target="_blank" rel="noreferrer" className="text-[var(--brand-400)] hover:underline">Consíguela aquí</a>. 
                Nunca volveremos a mostrar la credencial en texto plano.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="btn-secondary mr-3"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary min-w-[120px]"
              >
                {submitting ? "Guardando..." : "Guardar Key"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="glass-card p-12 flex justify-center items-center">
          <span className="w-8 h-8 border-2 border-[var(--text-secondary)] border-t-[var(--brand-500)] rounded-full animate-spin" />
        </div>
      ) : keys.length === 0 && !isAdding ? (
        <div className="glass-card flex flex-col items-center justify-center p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mb-4 text-2xl">
            🔑
          </div>
          <h3 className="text-lg font-semibold mb-2">No tienes claves configuradas</h3>
          <p className="text-[var(--text-secondary)] mb-6 max-w-sm">
            Necesitas al menos una credencial LLM o un wallet x402 para arrancar un agente de trading.
          </p>
          <button onClick={() => setIsAdding(true)} className="btn-primary">
            Añadir mi primera API Key
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {keys.map((key) => {
            const providerInfo = getProviderOption(key.provider);
              const date = key.createdAt && typeof key.createdAt.seconds === 'number'
              ? new Date(key.createdAt.seconds * 1000).toLocaleDateString("es-ES") 
              : key.createdAt && typeof (key.createdAt as any)._seconds === 'number'
                ? new Date((key.createdAt as any)._seconds * 1000).toLocaleDateString("es-ES")
                : "Reciente";
              
            return (
              <div key={key.id} className="glass-card p-5 relative overflow-hidden group">
                {/* Decorative glow matching provider */}
                <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-[40px] opacity-10 pointer-events-none ${
                    key.provider === 'openai' ? 'bg-green-500' : 
                    key.provider === 'anthropic' ? 'bg-orange-500' :
                    key.provider === 'openrouter' ? 'bg-indigo-500' :
                    key.provider === 'gemini' ? 'bg-blue-500' :
                    'bg-[var(--brand-500)]'
                }`} />

                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="flex flex-col">
                    <span className="font-semibold">{key.name}</span>
                    <span className="text-xs text-[var(--text-secondary)] mt-1 bg-[var(--bg-elevated)] w-max px-2 py-0.5 rounded-sm border border-[var(--border-primary)]">
                      {providerInfo?.name || key.provider}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleDelete(key.id)}
                    className="text-[var(--text-tertiary)] hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Eliminar clave"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
                
                <div className="mt-4 pt-4 border-t border-[var(--border-secondary)] text-xs text-[var(--text-tertiary)] flex justify-between relative z-10">
                  <span>Añadida: {date}</span>
                  <span className="flex items-center gap-1.5 text-[var(--success)]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)] shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
                    Cifrada (AES-256)
                  </span>
                </div>
                {key.provider === "x402" && key.walletAddress && (
                  <div className="mt-3 text-xs text-[var(--text-secondary)] relative z-10">
                    Wallet Base: <span className="font-mono text-[var(--brand-400)]">{key.walletAddress}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
