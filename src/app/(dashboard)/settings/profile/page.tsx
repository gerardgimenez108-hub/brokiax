"use client";

import { useAuth } from "@/hooks/useAuth";
import { useTranslations } from "next-intl";
import { User, Mail, Hash, Crown, Calendar, Info } from "lucide-react";
import Image from "next/image";

export default function ProfilePage() {
  const { user, firebaseUser } = useAuth();
  const t = useTranslations("profile");
  const tc = useTranslations("common");

  // Format creation time if available
  const joinDate = firebaseUser?.metadata?.creationTime
    ? new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(new Date(firebaseUser.metadata.creationTime))
    : "---";

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Avatar & Core Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="glass-card p-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center overflow-hidden mb-4 shadow-xl">
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || "User Avatar"} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-zinc-500" />
              )}
            </div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              {user?.displayName || "Usuario"}
            </h2>
            <div className="inline-flex mt-2 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
              {user?.plan === "enterprise" ? t("roleAdmin") : t("roleUser")}
            </div>
            
            <p className="text-xs text-[var(--text-tertiary)] mt-4 flex items-start gap-2 text-left bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-zinc-400" />
              {t("avatarDesc")}
            </p>
          </div>
        </div>

        {/* Right Column - Account Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-6 tracking-wide uppercase">Detalles de la cuenta</h3>
            
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-zinc-900/30 rounded-lg border border-zinc-800/50">
                <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                  <Mail className="w-4 h-4" />
                  <span>{t("emailLabel")}</span>
                </div>
                <div className="text-sm font-medium text-[var(--text-primary)]">
                  {user?.email || "---"}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-zinc-900/30 rounded-lg border border-zinc-800/50">
                <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                  <Hash className="w-4 h-4" />
                  <span>{t("uidLabel")}</span>
                </div>
                <div className="text-sm font-medium text-[var(--text-primary)] font-mono text-xs">
                  {user?.uid || "---"}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-zinc-900/30 rounded-lg border border-zinc-800/50">
                <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                  <Crown className="w-4 h-4" />
                  <span>{t("planLabel")}</span>
                </div>
                <div className="text-sm font-medium text-[var(--brand-400)] uppercase tracking-wider">
                  {user?.plan || "Starter"}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-zinc-900/30 rounded-lg border border-zinc-800/50">
                <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                  <Info className="w-4 h-4" />
                  <span>{t("statusLabel")}</span>
                </div>
                <div>
                  {user?.subscriptionStatus === "active" ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {t("active")}
                    </span>
                  ) : user?.plan === "enterprise" ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-[var(--brand-500)]/10 text-[var(--brand-400)] border border-[var(--brand-500)]/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-400)]" />
                      Enterprise Pass
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                      {t("incomplete")}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-zinc-900/30 rounded-lg border border-zinc-800/50">
                <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                  <Calendar className="w-4 h-4" />
                  <span>{t("joined")}</span>
                </div>
                <div className="text-sm font-medium text-[var(--text-primary)] capitalize">
                  {joinDate}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
