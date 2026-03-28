"use client";

import { useAuth } from "@/hooks/useAuth";

export default function BillingPage() {
  const { user } = useAuth();

  const isActive = user?.subscriptionStatus === "active";

  const handleSubscribe = async (plan: string) => {
    // In Fase 8 this will create a Stripe Checkout Session
    alert(`En fase 8 se conectará el pago Stripe para el plan: ${plan}. El entorno actual es la Fase 3.`);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Suscripción y Pagos</h1>
        <p className="text-[var(--text-secondary)]">
          Gestiona tu plan actual, límites de la plataforma y métodos de pago.
        </p>
      </div>

      <div className="glass-card p-6 flex flex-col md:flex-row items-center justify-between gap-6 border border-[var(--brand-500)]/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[var(--brand-500)]/20 to-transparent rounded-full blur-[60px] pointer-events-none" />
        
        <div className="relative z-10">
          <h2 className="text-xl font-semibold mb-1">
            Plan Actual: <span className="uppercase text-[var(--brand-400)]">{isActive ? user?.plan : "Free"}</span>
          </h2>
          <p className="text-[var(--text-secondary)]">
            {isActive
              ? "Suscripción activa. Renovación automática activada."
              : "No tienes una suscripción activa. Elige un plan para continuar."}
          </p>
        </div>
        
        <div className="relative z-10 shrink-0">
          <button className="btn-secondary">
            Gestionar en Stripe
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Mejora tu plan</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Free */}
          <div className={`glass-card p-6 relative ${!isActive ? 'ring-2 ring-[var(--brand-500)]' : ''}`}>
             <h4 className="text-lg font-semibold mb-2">Free</h4>
             <div className="text-3xl font-bold mb-4">€0<span className="text-base text-[var(--text-secondary)] font-normal">/mes</span></div>
             <ul className="space-y-2 mb-6 text-sm text-[var(--text-secondary)]">
               <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-400)]" /> 1 Agente IA Activo</li>
               <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-400)]" /> Solo Paper Trading</li>
               <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-400)]" /> Modelos Básicos (Mini)</li>
               <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-400)]" /> BYOK Arquitectura</li>
             </ul>
             <button 
               className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors ${!isActive ? 'bg-[var(--bg-hover)] text-[var(--text-secondary)] cursor-default' : 'btn-secondary opacity-50 cursor-not-allowed'}`}
               disabled
             >
               {!isActive ? 'Plan Actual' : '-'}
             </button>
          </div>

          {/* Pro */}
          <div className={`glass-card p-6 relative ${user?.plan === 'pro' && isActive ? 'ring-2 ring-[var(--brand-500)]' : 'border border-[var(--brand-500)]/30 shadow-[0_0_20px_rgba(124,58,237,0.1)]'}`}>
             <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-[var(--brand-600)] to-[var(--accent-500)] text-white text-[10px] font-bold uppercase tracking-wider">
                Recomendado
             </div>
             <h4 className="text-lg font-semibold mb-2">Pro</h4>
             <div className="text-3xl font-bold mb-4">€29<span className="text-base text-[var(--text-secondary)] font-normal">/mes</span></div>
             <ul className="space-y-2 mb-6 text-sm text-[var(--text-secondary)]">
               <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-400)]" /> 5 Agentes IA Activos</li>
               <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-400)]" /> Trading Real Ilimitado</li>
               <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-400)]" /> Todos los Modelos LLM</li>
               <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-400)]" /> Debate Arena & Backtest Lab</li>
             </ul>
             <a 
               href="https://dashboard.stripe.com/test/payment-links"
               target="_blank"
               rel="noopener noreferrer"
               className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors flex justify-center items-center ${user?.plan === 'pro' && isActive ? 'bg-[var(--bg-hover)] text-[var(--text-secondary)] cursor-default pointer-events-none' : 'btn-primary'}`}
             >
               {user?.plan === 'pro' && isActive ? 'Plan Actual' : 'Actualizar a Pro'}
             </a>
          </div>

          {/* Elite */}
          <div className={`glass-card p-6 relative ${user?.plan === 'elite' && isActive ? 'ring-2 ring-[var(--brand-500)]' : ''}`}>
             <h4 className="text-lg font-semibold mb-2">Elite</h4>
             <div className="text-3xl font-bold mb-4">€79<span className="text-base text-[var(--text-secondary)] font-normal">/mes</span></div>
             <ul className="space-y-2 mb-6 text-sm text-[var(--text-secondary)]">
               <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-400)]" /> Agentes IA Ilimitados</li>
               <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-400)]" /> Backtest de Alta Frecuencia</li>
               <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-400)]" /> Debate Multidisciplinario</li>
               <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-400)]" /> Soporte Prioritario 24/7</li>
             </ul>
             <a 
               href="https://dashboard.stripe.com/test/payment-links"
               target="_blank"
               rel="noopener noreferrer"
               className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors flex justify-center items-center ${user?.plan === 'elite' && isActive ? 'bg-[var(--bg-hover)] text-[var(--text-secondary)] cursor-default pointer-events-none' : 'btn-secondary'}`}
             >
               {user?.plan === 'elite' && isActive ? 'Plan Actual' : 'Contactar Ventas'}
             </a>
          </div>
        </div>
      </div>
    </div>
  );
}
