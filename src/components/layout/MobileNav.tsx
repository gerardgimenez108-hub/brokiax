"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const TABS = [
  {
    title: "Home",
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
    title: "Strategy",
    href: "/strategy",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
  {
    title: "Market",
    href: "/data",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
  },
  {
    title: "Más",
    href: "#more",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),
  },
];

const MORE_ITEMS = [
  { title: "Debate Arena", href: "/debate", emoji: "💬" },
  { title: "Backtest Lab", href: "/backtest", emoji: "🧪" },
  { title: "API Keys", href: "/settings/api-keys", emoji: "🔑" },
  { title: "Exchange Keys", href: "/settings/exchange-keys", emoji: "🔗" },
  { title: "Suscripción", href: "/settings/billing", emoji: "💳" },
];

export default function MobileNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Backdrop overlay */}
      {showMore && (
        <div
          className="fixed inset-0 bg-black/60 z-[99] md:hidden backdrop-blur-sm"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* "More" slide-up drawer */}
      <div
        className={`fixed bottom-[calc(var(--mobile-nav-height)+env(safe-area-inset-bottom))] left-0 right-0 z-[100] md:hidden transition-all duration-300 ${
          showMore
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "translate-y-4 opacity-0 pointer-events-none"
        }`}
      >
        <div className="mx-4 mb-2 glass-card bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-3 border-b border-[var(--border-primary)]">
            <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-1">
              Más opciones
            </h3>
          </div>
          <div className="p-2">
            {MORE_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setShowMore(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-[var(--brand-500)]/10 text-[var(--brand-400)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] active:bg-[var(--bg-hover)]"
                }`}
              >
                <span className="text-lg">{item.emoji}</span>
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-[100] md:hidden">
        <div
          className="h-[var(--mobile-nav-height)] bg-[var(--bg-secondary)]/95 backdrop-blur-xl border-t border-[var(--border-primary)] flex items-center justify-around px-2"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {TABS.map((tab) => {
            const active = tab.href === "#more" ? showMore : isActive(tab.href);
            const isMoreBtn = tab.href === "#more";

            if (isMoreBtn) {
              return (
                <button
                  key="more"
                  onClick={() => setShowMore(!showMore)}
                  className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-colors ${
                    active
                      ? "text-[var(--brand-400)]"
                      : "text-[var(--text-tertiary)]"
                  }`}
                >
                  {tab.icon}
                  <span className="text-[10px] font-medium tracking-tight">
                    {tab.title}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={() => setShowMore(false)}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-colors ${
                  active
                    ? "text-[var(--brand-400)]"
                    : "text-[var(--text-tertiary)]"
                }`}
              >
                {tab.icon}
                <span className="text-[10px] font-medium tracking-tight">
                  {tab.title}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
