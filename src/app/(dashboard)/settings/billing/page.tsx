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
            Plan Actual: <span className="uppercase text-[var(--brand-400)]">{user?.plan || "Starter"}</span>
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
          {/* Starter */}
          <div className={`glass-card p-6 relative ${user?.plan === 'starter' ? 'ring-2 ring-[var(--brand-500)]' : ''}`}>
             <h4 className="text-lg font-semibold mb-2">Starter</h4>
             <div className="text-3xl font-bold mb-4">€19<span className="text-base text-[var(--text-secondary)] font-normal">/mes</span></div>
             <ul className="space-y-2 mb-6 text-sm text-[var(--text-secondary)]">
               <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-400)]" /> 1 trader activo</li>
               <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-400)]" /> 1 exchange</li>
               <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-400)]" /> Modelos básicos</li>
             </ul>
             <button 
               onClick={() => handleSubscribe('starter')} 
               className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors ${user?.plan === 'starter' ? 'bg-[var(--bg-hover)] text-[var(--text-secondary)] cursor-default' : 'btn-secondary'}`}
               disabled={user?.plan === 'starter'}
             >
               {user?.plan === 'starter' ? 'Plan Actual' : 'Seleccionar'}
             </button>
          </div>

          {/* Pro */}
          <div className={`glass-card p-6 relative ${user?.plan === 'pro' ? 'ring-2 ring-[var(--brand-500)]' : 'border border-[var(--brand-500)]/30 shadow-[0_0_20px_rgba(124,58,237,0.1)]'}`}>
             <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-[var(--brand-600)] to-[var(--accent-500)] text-white text-[10px] font-bold uppercase tracking-wider">
                Recomendado
             </div>
             <h4 className="text-lg font-semibold mb-2">Pro</h4>
             <div className="text-3xl font-bold mb-4">€49<span className="text-base text-[var(--text-secondary)] font-normal">/mes</span></div>
             <ul className="space-y-2 mb-6 text-sm text-[var(--text-secondary)]">
               <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-400)]" /> 5 traders activos</li>
               <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-400)]" /> 3 exchanges</li>
               <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-400)]" /> Todos los modelos LLM</li>
               <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-400)]" /> Debate Arena (2 LLMs)</li>
             </ul>
             <button 
               onClick={() => handleSubscribe('pro')}
               className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors ${user?.plan === 'pro' ? 'bg-[var(--bg-hover)] text-[var(--text-secondary)] cursor-default' : 'btn-primary'}`}
               disabled={user?.plan === 'pro'}
             >
               {user?.plan === 'pro' ? 'Plan Actual' : 'Actualizar a Pro'}
             </button>
          </div>

          {/* Elite */}
          <div className={`glass-card p-6 relative ${user?.plan === 'elite' ? 'ring-2 ring-[var(--brand-500)]' : ''}`}>
             <h4 className="text-lg font-semibold mb-2">Elite</h4>
             <div className="text-3xl font-bold mb-4">€99<span className="text-base text-[var(--text-secondary)] font-normal">/mes</span></div>
             <ul className="space-y-2 mb-6 text-sm text-[var(--text-secondary)]">
               <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-400)]" /> Traders ilimitados</li>
               <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-400)]" /> Exchanges ilimitados</li>
               <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-400)]" /> Debate Arena (4 LLMs)</li>
               <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-400)]" /> Personalización avanzada</li>
             </ul>
             <button 
               onClick={() => handleSubscribe('elite')}
               className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors ${user?.plan === 'elite' ? 'bg-[var(--bg-hover)] text-[var(--text-secondary)] cursor-default' : 'btn-secondary'}`}
               disabled={user?.plan === 'elite'}
             >
               {user?.plan === 'elite' ? 'Plan Actual' : 'Actualizar a Elite'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
