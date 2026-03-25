"use client";

import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-[var(--text-secondary)]">
            Resumen de tu operativa y rendimiento.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/traders" className="btn-secondary">
            Mis Traders
          </Link>
          <Link href="/strategy" className="btn-primary">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva Estrategia
            </span>
          </Link>
        </div>
      </div>

      {/* Stats Grid Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Traders Activos", value: "0 / " + (user?.plan === "starter" ? "1" : user?.plan === "pro" ? "5" : "∞") },
          { label: "Capital Total", value: "$0.00" },
          { label: "P&L Total", value: "0.00%", positive: true },
          { label: "Posiciones Abiertas", value: "0" },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6">
            <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">
              {stat.label}
            </h3>
            <div className={`text-2xl font-bold ${
              stat.positive !== undefined 
                ? stat.positive ? "text-[var(--success)]" : "text-[var(--danger)]"
                : "text-[var(--text-primary)]"
            }`}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Charts & Tables Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6 min-h-[400px] flex flex-col">
          <h3 className="text-lg font-semibold mb-6">Evolución del Portfolio</h3>
          <div className="flex-1 border-2 border-dashed border-[var(--border-primary)] rounded-lg flex items-center justify-center text-[var(--text-tertiary)] bg-[var(--bg-secondary)]/50">
            El gráfico aparecerá cuando inicies tu primer trader
          </div>
        </div>
        
        <div className="glass-card p-6 min-h-[400px] flex flex-col">
          <h3 className="text-lg font-semibold mb-6">Traders Activos</h3>
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-[var(--text-secondary)]">
            <svg className="w-12 h-12 mb-4 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <p className="mb-4">No tienes ningún trader ejecutándose actualmente.</p>
            <Link href="/traders" className="btn-secondary text-sm">
              Configurar Trader
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
