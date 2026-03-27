"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    title: "Traders",
    href: "/traders",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: "Strategy Studio",
    href: "/strategy",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
  {
    title: "Debate Arena",
    href: "/debate",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
      </svg>
    ),
  },
  {
    title: "Backtest Lab",
    href: "/backtest",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
  },
  {
    title: "Market Data",
    href: "/data",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
  },
];

const SETTINGS_ITEMS = [
  {
    title: "API Keys (LLM)",
    href: "/settings/api-keys",
  },
  {
    title: "Exchange Keys",
    href: "/settings/exchange-keys",
  },
  {
    title: "Suscripción",
    href: "/settings/billing",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[var(--sidebar-width)] bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] flex flex-col z-40 hidden md:flex">
      <div className="h-[var(--topbar-height)] flex items-center px-6 border-b border-[var(--border-primary)] shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--brand-600)] to-[var(--accent-500)] flex items-center justify-center text-white font-bold transition-transform group-hover:scale-105">
            B
          </div>
          <span className="font-bold text-lg tracking-tight">Brokiax</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-1">
        <div className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider pl-3 mb-2">
          Trading
        </div>
        
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-[var(--brand-500)]/10 text-[var(--brand-400)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              }`}
            >
              <div className={active ? "text-[var(--brand-400)]" : "text-[var(--text-tertiary)]"}>
                {item.icon}
              </div>
              {item.title}
            </Link>
          );
        })}

        <div className="mt-8 mb-2 pl-3 flex items-center gap-2 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
          Configuración
        </div>
        
        {SETTINGS_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "text-[var(--text-primary)] font-medium"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
              }`}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
              {item.title}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-[var(--border-primary)] shrink-0">
        <div className="glass-card p-4 rounded-xl relative overflow-hidden group border border-[var(--brand-500)]/20">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-500)]/5 to-[var(--accent-500)]/5" />
          <h4 className="font-semibold text-sm mb-1 z-10 relative">Actualiza tu plan</h4>
          <p className="text-xs text-[var(--text-secondary)] mb-3 z-10 relative">
            Desbloquea Debate Arena, Backtest y más.
          </p>
          <Link href="/settings/billing" className="btn-primary text-xs w-full block text-center py-2 z-10 relative">
            Ver planes
          </Link>
        </div>
      </div>
    </aside>
  );
}
