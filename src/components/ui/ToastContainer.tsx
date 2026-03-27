"use client";

import { useNotificationStore, NotificationType } from "@/stores/notifications";
import { useEffect, useState } from "react";

const ICONS: Record<NotificationType, string> = {
  success: "✅",
  error: "❌",
  warning: "⚠️",
  info: "ℹ️",
  trade: "📊",
};

const ACCENT_COLORS: Record<NotificationType, string> = {
  success: "var(--success)",
  error: "var(--danger)",
  warning: "var(--warning)",
  info: "var(--brand-400)",
  trade: "var(--accent-400)",
};

function ToastItem({
  id,
  type,
  title,
  message,
  timestamp,
}: {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
}) {
  const dismiss = useNotificationStore((s) => s.dismissToast);
  const [entering, setEntering] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setEntering(false), 50);
    return () => clearTimeout(t);
  }, []);

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(() => dismiss(id), 300);
  };

  const accent = ACCENT_COLORS[type];

  return (
    <div
      className={`w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ease-out ${
        entering
          ? "translate-x-[120%] opacity-0 scale-95"
          : exiting
          ? "translate-x-[120%] opacity-0 scale-95"
          : "translate-x-0 opacity-100 scale-100"
      }`}
      style={{
        background: "rgba(17, 17, 19, 0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderLeft: `3px solid ${accent}`,
      }}
    >
      <div className="p-4 flex gap-3">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{ background: `${accent}15` }}
        >
          {ICONS[type]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-semibold text-white leading-tight truncate">
              {title}
            </h4>
            <button
              onClick={handleDismiss}
              className="text-[var(--text-tertiary)] hover:text-white transition-colors shrink-0 mt-0.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed line-clamp-2">
            {message}
          </p>
          <span className="text-[10px] text-[var(--text-muted)] mt-1.5 block">
            {new Date(timestamp).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 w-full bg-[var(--border-primary)]">
        <div
          className="h-full rounded-r-full animate-toast-progress"
          style={{ background: accent }}
        />
      </div>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useNotificationStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[200] flex flex-col gap-3 pointer-events-auto">
      {toasts.slice(-5).map((toast) => (
        <ToastItem key={toast.id} {...toast} />
      ))}
    </div>
  );
}
