"use client";

import { useAuth } from "@/hooks/useAuth";
import { useTranslations } from "next-intl";
import { User, Mail, Hash, Crown, Calendar, Info, Key, Building2, CreditCard, Plug, LogOut, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { user, firebaseUser, logout } = useAuth();
  const t = useTranslations("profile");
  const tc = useTranslations("common");

  // Format creation time if available
  const joinDate = firebaseUser?.metadata?.creationTime
    ? new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(new Date(firebaseUser.metadata.creationTime))
    : "---";

  const hubLinks = [
    { title: "Gestión de Suscripción", desc: "Administra tu plan actual, métodos de pago y facturación segura por Stripe.", icon: CreditCard, href: "/settings/billing", color: "text-indigo-400", bg: "bg-indigo-400/10" },
    { title: "API Keys (LLMs)", desc: "Configura tus claves maestras de OpenAI, Anthropic y Google Gemini.", icon: Key, href: "/settings/api-keys", color: "text-amber-400", bg: "bg-amber-400/10" },
    { title: "Claves de Exchange", desc: "Conecta tu liquidez a Binance, Bybit u otros exchanges vía encriptación CCXT.", icon: Building2, href: "/settings/exchange-keys", color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { title: "Brokiax API & MCP", desc: "Claves de acceso remoto y agente Model Context Protocol para integraciones.", icon: Plug, href: "/settings/api-access", color: "text-rose-400", bg: "bg-rose-400/10" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)]">
          Mi Perfil Institucional
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1 tracking-wide">
          Centro de control maestro para tu ecosistema de trading automatizado.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Avatar & Core Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-6 flex flex-col items-center text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--glass-hover)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="w-28 h-28 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-brand)] flex items-center justify-center overflow-hidden mb-6 shadow-2xl relative z-10 p-1">
              <div className="w-full h-full rounded-full overflow-hidden bg-[var(--bg-secondary)]">
                {user?.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || "User Avatar"} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 m-7 text-[var(--text-tertiary)]" />
                )}
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-[var(--text-primary)] relative z-10">
              {user?.displayName || "Usuario"}
            </h2>
            <div className="inline-flex mt-3 px-3 py-1 text-xs font-semibold rounded-full bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-primary)] shadow-sm relative z-10">
              {user?.plan === "enterprise" ? t("roleAdmin") : t("roleUser")}
            </div>
            
            <button 
              onClick={logout}
              className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10 transition-colors text-sm font-medium relative z-10"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Right Column - Account Details & Hub */}
        <div className="lg:col-span-8 space-y-6">
          {/* Account Details */}
          <div className="glass-card p-6">
            <h3 className="text-xs font-bold text-[var(--text-secondary)] mb-6 tracking-widest uppercase">
              Información de la Cuenta
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1 p-4 bg-[var(--bg-secondary)]/50 rounded-xl border border-[var(--border-primary)]">
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <Mail className="w-4 h-4" />
                  <span>Email</span>
                </div>
                <div className="text-sm font-medium text-[var(--text-primary)]">
                  {user?.email || "---"}
                </div>
              </div>

              <div className="flex flex-col gap-1 p-4 bg-[var(--bg-secondary)]/50 rounded-xl border border-[var(--border-primary)]">
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <Hash className="w-4 h-4" />
                  <span>ID de Usuario</span>
                </div>
                <div className="text-xs font-medium text-[var(--text-primary)] font-mono truncate">
                  {user?.uid || "---"}
                </div>
              </div>

              <div className="flex flex-col gap-1 p-4 bg-[var(--bg-secondary)]/50 rounded-xl border border-[var(--border-primary)]">
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <Crown className="w-4 h-4" />
                  <span>Plan Actual</span>
                </div>
                <div className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                  {user?.plan || "Starter"}
                </div>
              </div>

              <div className="flex flex-col gap-1 p-4 bg-[var(--bg-secondary)]/50 rounded-xl border border-[var(--border-primary)]">
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <Info className="w-4 h-4" />
                  <span>Estado</span>
                </div>
                <div>
                  {user?.subscriptionStatus === "active" || user?.plan === "enterprise" ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-500">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                      Incompleto
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links Hub */}
          <div className="glass-card p-6">
            <h3 className="text-xs font-bold text-[var(--text-secondary)] mb-6 tracking-widest uppercase">
              Centro de Conexiones
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hubLinks.map((link) => (
                <Link key={link.href} href={link.href} className="group block">
                  <div className="h-full p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 hover:bg-[var(--glass-hover)] transition-all duration-300 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-2.5 rounded-lg ${link.bg} ${link.color} shrink-0`}>
                        <link.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1 transition-colors">
                          {link.title}
                        </h4>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                          {link.desc}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors shrink-0 mt-3" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
