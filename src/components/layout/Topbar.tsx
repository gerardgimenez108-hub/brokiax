"use client";

import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NotificationBell from "@/components/ui/NotificationBell";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

export default function Topbar() {
  const { user, logout } = useAuth();
  const t = useTranslations("nav");
  const tc = useTranslations("common");

  const getPlanName = (plan?: string) => {
    if (!plan) return "Starter";
    return plan.charAt(0).toUpperCase() + plan.slice(1);
  };

  const getInitials = (name?: string) => {
    if (!name) return "TR";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <header className="h-[var(--topbar-height)] border-b border-[var(--border-primary)] bg-[var(--bg-primary)]/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6 md:pl-[calc(var(--sidebar-width)+1.5rem)]">
      {/* Mobile left side */}
      <div className="flex items-center md:hidden gap-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold">
            B
          </div>
        </Link>
        <span className="font-semibold">{t("dashboard")}</span>
      </div>

      {/* Desktop left side */}
      <div className="hidden md:block" />

      {/* Right side */}
      <div className="flex items-center gap-3">
        <div className={`px-3 py-1 rounded-md border text-xs font-semibold hidden md:block ${
          user?.plan === 'elite' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
          user?.plan === 'pro' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
          'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-primary)]'
        }`}>
           Plan {getPlanName(user?.plan)}
        </div>

        <LanguageSwitcher />
        <NotificationBell />

        <Link href="/settings/profile" className="outline-none">
          <Avatar className="w-9 h-9 border border-[var(--border-primary)] transition-transform hover:scale-105 cursor-pointer shadow-sm">
            <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || "User"} />
            <AvatarFallback className="bg-[var(--bg-hover)] text-[var(--text-primary)] text-xs font-semibold">
              {getInitials(user?.displayName)}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
}
