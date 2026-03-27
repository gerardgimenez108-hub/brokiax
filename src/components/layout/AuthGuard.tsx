"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Redirect to login if not authenticated
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      }
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--brand-600)] to-[var(--accent-500)] flex items-center justify-center text-white font-bold animate-pulse">
          B
        </div>
      </div>
    );
  }

  // Si el usuario existe pero no ha pagado
  if (user && user.subscriptionStatus === "incomplete") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--bg-primary)] overflow-hidden relative">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--warning)]/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--danger)]/10 rounded-full blur-[100px]" />
        </div>
        
        <div className="relative z-10 w-full max-w-lg glass-card p-10 text-center animate-fade-in gradient-border">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--warning)]/20 flex items-center justify-center text-3xl mb-6 shadow-lg shadow-[var(--warning)]/10">
            🔒
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-[var(--warning)] mb-3">
            Suscripción Inactiva
          </h1>
          <p className="text-[var(--text-secondary)] mb-8 text-lg">
            Para acceder al motor de trading autónomo y proteger tu capital con nuestros agentes IA, necesitas activar tu suscripción Pro.
          </p>
          
          <div className="glass-card mb-8 p-6 text-left border-l-4 border-[var(--brand-400)] bg-[var(--bg-secondary)]/50">
            <h3 className="font-bold text-white mb-2">Plan Pro Ilimitado</h3>
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              <li className="flex items-center gap-2"><span>✅</span> Engine Multi-LLM en tiempo real</li>
              <li className="flex items-center gap-2"><span>✅</span> Modo "Bring Your Own Key" (BYOK)</li>
              <li className="flex items-center gap-2"><span>✅</span> Backtest Sintético</li>
              <li className="flex items-center gap-2"><span>✅</span> Debate Arena con múltiples Modelos</li>
            </ul>
          </div>
          
          {/* MOCK STRIPE LINK: Pasariamos el UID al parámetro para el webhook */}
          <a
            href="https://dashboard.stripe.com/test/payment-links"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full btn-primary flex items-center justify-center gap-2 py-4 text-lg font-bold shadow-[0_0_20px_rgba(var(--brand-500-rgb),0.4)]"
          >
            Activar por 49€ / mes
          </a>
          
          <button 
            onClick={() => {
              const { auth } = require("@/lib/firebase/client");
              auth.signOut();
            }} 
            className="mt-6 text-sm text-[var(--text-tertiary)] hover:text-white transition-colors"
          >
            Cerrar sesión y volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // Only render children if authenticated and subscription is active
  return user && user.subscriptionStatus === "active" ? <>{children}</> : null;
}
