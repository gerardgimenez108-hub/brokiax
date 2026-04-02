"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard, Shield, Code2, Swords, FlaskConical, BarChart3,
  Key, Building2, CreditCard, Plug, User, Trophy
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations("nav");

  const NAV_ITEMS = [
    { title: t("dashboard"), href: "/dashboard", icon: LayoutDashboard },
    { title: t("traders"), href: "/traders", icon: Shield },
    { title: t("strategyStudio"), href: "/strategy", icon: Code2 },
    { title: t("debateArena"), href: "/debate", icon: Swords },
    { title: t("aiArena"), href: "/arena", icon: Trophy },
    { title: t("backtestLab"), href: "/backtest", icon: FlaskConical },
    { title: t("marketData"), href: "/data", icon: BarChart3 },
  ];

  const SETTINGS_ITEMS = [
    { title: t("profile"), href: "/settings/profile", icon: User },
    { title: t("apiKeys"), href: "/settings/api-keys", icon: Key },
    { title: t("exchangeKeys"), href: "/settings/exchange-keys", icon: Building2 },
    { title: t("billing"), href: "/settings/billing", icon: CreditCard },
    { title: t("apiAccess"), href: "/settings/api-access", icon: Plug },
  ];

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[var(--sidebar-width)] bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] flex flex-col z-40 hidden md:flex">
      <div className="h-[var(--topbar-height)] flex items-center px-6 border-b border-[var(--border-primary)] shrink-0">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--brand-600)] to-[var(--accent-500)] flex items-center justify-center text-white font-bold transition-transform group-hover:scale-105 shadow-lg shadow-[var(--brand-600)]/20">
            B
          </div>
          <span className="font-bold text-lg tracking-tight">Brokiax</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-1">
        <div className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-widest pl-3 mb-2">
          {t("trading")}
        </div>
        
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? "bg-[var(--brand-500)]/10 text-[var(--brand-400)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              }`}
            >
              <item.icon className={`w-[18px] h-[18px] ${active ? "text-[var(--brand-400)]" : "text-[var(--text-tertiary)]"}`} />
              {item.title}
            </Link>
          );
        })}

        <div className="mt-8 mb-2 pl-3 text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-widest">
          {t("settings")}
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
              <item.icon className="w-4 h-4 opacity-50" />
              {item.title}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-[var(--border-primary)] shrink-0">
        <div className="glass-card p-4 rounded-xl relative overflow-hidden group border border-[var(--brand-500)]/20">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-500)]/5 to-[var(--accent-500)]/5" />
          <h4 className="font-semibold text-sm mb-1 z-10 relative">{t("upgradePlan")}</h4>
          <p className="text-xs text-[var(--text-secondary)] mb-3 z-10 relative">
            {t("upgradeDesc")}
          </p>
          <Link href="/settings/billing" className="btn-primary text-xs w-full block text-center py-2 z-10 relative">
            {t("viewPlans")}
          </Link>
        </div>
      </div>
    </aside>
  );
}
