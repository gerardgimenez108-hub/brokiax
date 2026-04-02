"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase/client";
import { ExchangeId } from "@/lib/types";

const EXCHANGES: { id: ExchangeId; name: string; url: string; needsPassphrase?: boolean; isDEX?: boolean }[] = [
  { id: "binance", name: "Binance", url: "https://www.binance.com/en/my/settings/api-management" },
  { id: "bybit", name: "Bybit", url: "https://www.bybit.com/app/user/api-management" },
  { id: "okx", name: "OKX", url: "https://www.okx.com/account/my-api", needsPassphrase: true },
  { id: "bitget", name: "Bitget", url: "https://www.bitget.com/en/account/api", needsPassphrase: true },
  { id: "kucoin", name: "KuCoin", url: "https://www.kucoin.com/account/api", needsPassphrase: true },
  { id: "gate", name: "Gate.io", url: "https://www.gate.io/myaccount/apikeys" },
  { id: "hyperliquid", name: "Hyperliquid", url: "https://app.hyperliquid.xyz/API", isDEX: true },
  { id: "aster" as any, name: "Aster DEX", url: "https://www.asterdex.com/en/api-wallet", isDEX: true },
];

export default function ExchangeKeysPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [provider, setProvider] = useState<ExchangeId>("binance");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [passphrase, setPassphrase] = useState("");
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProvider = EXCHANGES.find(e => e.id === provider);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    if (!auth.currentUser) return;
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/user/exchange-keys", {
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
      const payload: any = { name, provider, apiKey, apiSecret };
      if (selectedProvider?.needsPassphrase) {
        payload.passphrase = passphrase;
      }

      const res = await fetch("/api/user/exchange-keys", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      
      // Reset form
      setName("");
      setApiKey("");
      setApiSecret("");
      setPassphrase("");
      setIsAdding(false);
      await fetchKeys();
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que quieres eliminar estas credenciales?")) return;
    if (!auth.currentUser) return;
    
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/user/exchange-keys/${id}`, {
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
          <h1 className="text-2xl font-bold tracking-tight">Exchange Keys</h1>
          <p className="text-[var(--text-secondary)]">
            Añade las API Keys de tus exchanges. Solo pedimos permisos de lectura y trading (SIN RETIROS).
          </p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)} 
            className="btn-primary flex items-center gap-2 w-max"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Añadir Exchange
          </button>
        )}
      </div>

      <div className="bg-[var(--warning-dim)] border border-[var(--warning)]/20 p-4 rounded-xl flex gap-3 text-sm text-[var(--warning)] items-start">
        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        <div>
          <strong className="block mb-1">Seguridad de Fondos</strong>
          Al crear tu API Key en el exchange, asegúrate de <strong>DESACTIVAR</strong> los permisos de retiro ("Withdrawals"). Brokiax solo necesita permisos para leer balances (Read/Spot) y ejecutar órdenes de trading en Spot o Futuros.
        </div>
      </div>

      {isAdding && (
        <div className="glass-card p-6 border-l-4 border-l-[var(--brand-500)] animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--brand-500)]/5 rounded-bl-[100px] pointer-events-none" />
          
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h2 className="text-lg font-semibold">Conectar Exchange</h2>
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
                  placeholder="Ej: Binance Main Account"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Exchange
                </label>
                <select
                  required
                  className="input-field"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as ExchangeId)}
                >
                  {EXCHANGES.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <a href={selectedProvider?.url} target="_blank" rel="noreferrer" className="text-xs text-[var(--brand-400)] hover:underline inline-block mt-1">
                  {selectedProvider?.isDEX ? `Crear Agent Wallet en ${selectedProvider?.name} ↗` : `Crear API Key en ${selectedProvider?.name} ↗`}
                </a>
              </div>
            </div>

            {selectedProvider?.isDEX && (
              <div className="bg-[var(--brand-500)]/10 text-[var(--brand-500)] text-xs p-3 rounded-md mb-2 border border-[var(--brand-500)]/20">
                Al conectar a <strong>{selectedProvider.name}</strong> utilizas <em>Agent Wallets</em>. Proporciona la dirección de tu billetera principal y la Private Key del Agente. 
                Brokiax operará en el DEX de manera nativa sin usar API keys tradicionales.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  {selectedProvider?.isDEX ? "Wallet Address" : "API Key"}
                </label>
                <input
                  type="password"
                  required
                  className="input-field font-mono text-sm"
                  placeholder={selectedProvider?.isDEX ? "0x..." : "Tu API Key"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  {selectedProvider?.isDEX ? "Agent Private Key" : "API Secret"}
                </label>
                <input
                  type="password"
                  required
                  className="input-field font-mono text-sm"
                  placeholder={selectedProvider?.isDEX ? "Private Key (sin 0x)" : "Tu API Secret"}
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                />
              </div>
            </div>

            {selectedProvider?.needsPassphrase && (
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  API Passphrase
                </label>
                <input
                  type="password"
                  required
                  className="input-field font-mono text-sm"
                  placeholder="Contraseña de la API"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                />
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  {selectedProvider.name} requiere una passphrase adicional para sus API keys.
                </p>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button type="button" onClick={() => setIsAdding(false)} className="btn-secondary mr-3">
                Cancelar
              </button>
              <button type="submit" disabled={submitting} className="btn-primary min-w-[120px]">
                {submitting ? "Cifrando..." : "Guardar Credenciales"}
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
            🏦
          </div>
          <h3 className="text-lg font-semibold mb-2">Ningún exchange conectado</h3>
          <p className="text-[var(--text-secondary)] mb-6 max-w-sm">
            Para que la IA pueda operar por ti, debes conectar tu exchange de criptomonedas.
          </p>
          <button onClick={() => setIsAdding(true)} className="btn-primary">
            Conectar Exchange
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {keys.map((key) => {
            const providerInfo = EXCHANGES.find((p) => p.id === key.provider);
            const date = key.createdAt && typeof key.createdAt.seconds === 'number'
              ? new Date(key.createdAt.seconds * 1000).toLocaleDateString("es-ES") 
              : key.createdAt && typeof (key.createdAt as any)._seconds === 'number'
                ? new Date((key.createdAt as any)._seconds * 1000).toLocaleDateString("es-ES")
                : "Reciente";
              
            return (
              <div key={key.id} className="glass-card p-5 relative overflow-hidden group">
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
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
                
                <div className="mt-4 pt-4 border-t border-[var(--border-secondary)] text-xs text-[var(--text-tertiary)] flex justify-between relative z-10">
                  <span>Añadida: {date}</span>
                  <span className="flex items-center gap-1.5 text-[var(--success)]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
                    Cifrada (AES-256)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
