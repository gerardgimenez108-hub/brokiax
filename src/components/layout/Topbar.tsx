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
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--brand-600)] to-[var(--accent-500)] flex items-center justify-center text-white font-bold">
            B
          </div>
        </Link>
        <span className="font-semibold">{t("dashboard")}</span>
      </div>

      {/* Desktop left side */}
      <div className="hidden md:block" />

      {/* Right side */}
      <div className="flex items-center gap-3">
        <div className="px-3 py-1 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-xs font-semibold text-[var(--text-secondary)] hidden md:block">
          Plan {getPlanName(user?.plan)}
        </div>

        <LanguageSwitcher />
        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none">
            <Avatar className="w-9 h-9 border border-[var(--border-primary)] transition-transform hover:scale-105 cursor-pointer">
              <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || "User"} />
              <AvatarFallback className="bg-[var(--bg-hover)] text-[var(--text-primary)] text-xs font-semibold">
                {getInitials(user?.displayName)}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 glass-card bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-primary)]">
            <DropdownMenuLabel className="font-normal border-b border-[var(--border-primary)] pb-3">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.displayName}</p>
                <p className="text-xs leading-none text-[var(--text-secondary)]">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <div className="p-1">
              <Link href="/settings/billing">
                <DropdownMenuItem className="cursor-pointer hover:bg-[var(--bg-hover)] hover:text-white rounded-md">
                  {t("billing")}
                </DropdownMenuItem>
              </Link>
              <Link href="/settings/api-keys">
                <DropdownMenuItem className="cursor-pointer hover:bg-[var(--bg-hover)] hover:text-white rounded-md">
                  {t("apiKeys")}
                </DropdownMenuItem>
              </Link>
            </div>
            <DropdownMenuSeparator className="bg-[var(--border-primary)]" />
            <div className="p-1">
              <DropdownMenuItem 
                onClick={logout}
                className="cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-400/10 rounded-md"
              >
                {tc("logout")}
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
