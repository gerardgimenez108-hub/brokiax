"use client";

import { useState, useRef, useEffect } from "react";
import { useNotificationStore, NotificationType } from "@/stores/notifications";
import Link from "next/link";

const TYPE_ICONS: Record<NotificationType, string> = {
  success: "✅",
  error: "❌",
  warning: "⚠️",
  info: "ℹ️",
  trade: "📊",
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${Math.floor(hours / 24)}d`;
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } =
    useNotificationStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-hover)] transition-all"
      >
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--danger)] flex items-center justify-center text-[10px] font-bold text-white animate-bounce-once shadow-lg shadow-[var(--danger)]/30">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-12 w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden z-[250] shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
          style={{
            background: "rgba(17, 17, 19, 0.97)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-[var(--border-primary)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold">Notificaciones</h3>
              {unreadCount > 0 && (
                <span className="bg-[var(--brand-500)]/15 text-[var(--brand-400)] text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} nuevas
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] text-[var(--brand-400)] hover:text-[var(--brand-300)] font-medium transition-colors"
                >
                  Marcar leídas
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--danger)] font-medium transition-colors"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-10 text-center">
                <div className="text-3xl mb-3 opacity-40">🔔</div>
                <p className="text-sm text-[var(--text-tertiary)]">
                  No hay notificaciones
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Las alertas de tus traders aparecerán aquí
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const Wrapper = n.href ? Link : "div";
                const wrapperProps = n.href ? { href: n.href, onClick: () => { markAsRead(n.id); setOpen(false); } } : {};

                return (
                  <div
                    key={n.id}
                    onClick={() => !n.read && markAsRead(n.id)}
                    className={`px-5 py-3.5 border-b border-[var(--border-primary)]/50 flex gap-3 cursor-pointer transition-colors hover:bg-[var(--bg-hover)] ${
                      !n.read ? "bg-[var(--brand-500)]/[0.03]" : ""
                    }`}
                  >
                    <div className="text-lg shrink-0 mt-0.5">{TYPE_ICONS[n.type]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white truncate">
                          {n.title}
                        </span>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-[var(--brand-400)] shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-[var(--text-muted)] mt-1 block">
                        {timeAgo(n.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
