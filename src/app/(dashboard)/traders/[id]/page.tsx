"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import { Trader } from "@/lib/types";

export default function TraderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [trader, setTrader] = useState<Trader | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrader();
  }, [id]);

  const fetchTrader = async () => {
    if (!auth.currentUser || !id) return;
    try {
      // In a real app we'd need a GET /api/user/traders/[id] or filter 
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/user/traders", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        const found = data.data.find((t: Trader) => t.id === id);
        if (found) setTrader(found);
        else setError("Trader no encontrado");
      }
    } catch (err) {
      console.error(err);
      setError("Error cargando los detalles del trader");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
      if (!confirm("¿Segurísimo que quieres borrar este Trader permanentemente?")) return;
      if (!auth.currentUser || !trader) return;

      try {
          const token = await auth.currentUser.getIdToken();
          const res = await fetch(`/api/user/traders/${trader.id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          
          if (!res.ok) throw new Error(data.error);
          router.push("/traders");
      } catch (err: any) {
          alert(err.message || "Error al borrar");
      }
  };

  if (loading) return (
      <div className="glass-card p-12 flex justify-center items-center">
        <span className="w-8 h-8 border-2 border-[var(--text-secondary)] border-t-[var(--brand-500)] rounded-full animate-spin" />
      </div>
  );

  if (error || !trader) return <div className="text-center p-12 text-red-500 glass-card">{error || "No encontrado"}</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="glass-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-l-4 border-l-[var(--brand-500)]">
         <div>
             <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold tracking-tight">{trader.name}</h1>
                <div className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${trader.mode === 'live' ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-[var(--brand-500)]/20 text-[var(--brand-400)] border border-[var(--brand-400)]/30'}`}>
                    {trader.mode}
                </div>
                <div className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${trader.status === 'active' ? 'bg-[var(--success)] text-white' : 'bg-[var(--bg-elevated)] border border-[var(--border-primary)]'}`}>
                    {trader.status}
                </div>
             </div>
             <p className="text-[var(--text-secondary)] text-sm flex gap-2">
                 <span>ID: <code className="bg-[var(--bg-elevated)] px-1 py-0.5 rounded">{trader.id}</code></span>
                 <span>•</span>
                 <span>Creado: {new Date(trader.createdAt && typeof trader.createdAt.seconds === 'number' ? trader.createdAt.seconds * 1000 : trader.createdAt && typeof (trader.createdAt as any)._seconds === 'number' ? (trader.createdAt as any)._seconds * 1000 : Date.now()).toLocaleDateString()}</span>
             </p>
         </div>

         <div className="flex gap-2">
              <button className="btn-secondary text-sm">Editar</button>
              <button onClick={handleDelete} className="btn-secondary text-red-400 hover:text-red-500 hover:bg-red-500/10 border-red-500/20 text-sm">Borrar</button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6">
              
              {/* Stats Resumen */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="glass-card p-4">
                     <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1">P&L Diario</p>
                     <p className="text-xl font-bold text-[var(--text-primary)]">$0.00</p>
                 </div>
                 <div className="glass-card p-4">
                     <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Win Rate</p>
                     <p className="text-xl font-bold text-[var(--text-primary)]">0%</p>
                 </div>
                 <div className="glass-card p-4">
                     <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Posiciones</p>
                     <p className="text-xl font-bold text-[var(--text-primary)]">{trader.openPositions || 0}</p>
                 </div>
                 <div className="glass-card p-4">
                     <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Capital Usado</p>
                     <p className="text-xl font-bold text-[var(--text-primary)]">${trader.currentAllocation} / ${trader.maxAllocation}</p>
                 </div>
              </div>

              {/* Gráfico y Actividad (Placeholder) */}
              <div className="glass-card p-6 min-h-[400px]">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold">Rendimiento</h3>
                    <select className="bg-[var(--bg-elevated)] border border-[var(--border-primary)] text-sm rounded-md px-2 py-1">
                        <option>7 Días</option>
                        <option>1 Mes</option>
                        <option>Desde Inicio</option>
                    </select>
                 </div>
                 <div className="h-[300px] border-2 border-dashed border-[var(--border-primary)] rounded-lg flex items-center justify-center text-[var(--text-tertiary)] bg-[var(--bg-secondary)]/30">
                     Gráfico de Equity Curve (Recharts)
                 </div>
              </div>

          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
              <div className="glass-card p-6">
                  <h3 className="font-semibold mb-4 border-b border-[var(--border-primary)] pb-2">Configuración Activa</h3>
                  
                  <div className="space-y-4">
                      <div>
                          <p className="text-xs text-[var(--text-tertiary)] mb-1">Estrategia Vinculada</p>
                          <div className="bg-[var(--bg-elevated)] px-3 py-2 rounded-md border border-[var(--border-primary)] text-sm font-medium flex justify-between">
                              {trader.strategyId}
                              <button className="text-[var(--brand-400)] hover:underline text-xs">Ver en Studio</button>
                          </div>
                      </div>
                      <div>
                          <p className="text-xs text-[var(--text-tertiary)] mb-1">Pares Operados</p>
                          <div className="flex flex-wrap gap-2">
                              {trader.pairs.map(p => (
                                  <span key={p} className="bg-[var(--bg-elevated)] px-2 py-1 rounded-md text-xs border border-[var(--border-primary)]">{p}</span>
                              ))}
                          </div>
                      </div>
                      <div>
                          <p className="text-xs text-[var(--text-tertiary)] mb-1">Modelo LLM</p>
                          <p className="text-sm font-medium">{trader.llmProviderId}</p>
                      </div>
                      <div className="pt-4 mt-4 border-t border-[var(--border-primary)]">
                          <button className="w-full btn-primary py-2 text-sm justify-center">Ejecutar análisis manual</button>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}
