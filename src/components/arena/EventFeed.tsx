"use client";

import { CompetitionEvent } from "@/lib/types";
import { useEffect, useRef } from "react";

interface EventFeedProps {
  events: CompetitionEvent[];
}

const ACTION_EMOJI: Record<string, string> = {
  BUY: "🟢",
  SELL: "🔴",
  HOLD: "🟡",
};

const EVENT_ICONS: Record<string, string> = {
  decision: "💡",
  trade_executed: "⚡",
  cycle_complete: "🔄",
  error: "❌",
};

export default function EventFeed({ events }: EventFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isUserScrolling = useRef(false);

  // Auto-scroll to bottom when new events arrive (unless user is scrolling)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
      isUserScrolling.current = !atBottom;
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isUserScrolling.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events.length]);

  return (
    <div className="glass-card p-4 flex flex-col h-[300px]">
      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <span className="w-5 h-5 rounded bg-indigo-500/20 flex items-center justify-center text-xs">📡</span>
        Live Feed
      </h3>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar"
      >
        {events.length === 0 && (
          <p className="text-xs text-[var(--text-tertiary)] text-center py-8">
            Esperando eventos...
          </p>
        )}

        {events.map((event, i) => {
          if (event.eventType === "cycle_complete" && event.participantId === "system") {
            return (
              <div key={event.id || i} className="flex items-center gap-2 text-xs text-[var(--text-tertiary)] py-1 border-b border-[var(--border-secondary)]/30">
                <span>{EVENT_ICONS[event.eventType]}</span>
                <span className="font-medium text-indigo-400">Ciclo {event.cycleIndex}</span>
                <span>completado</span>
              </div>
            );
          }

          if (event.eventType === "decision") {
            return (
              <div key={event.id || i} className="text-xs py-1.5 px-2 rounded-lg bg-[var(--bg-tertiary)]/50 hover:bg-[var(--bg-tertiary)] transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[var(--text-tertiary)] font-mono">C{event.cycleIndex}</span>
                  <span className="font-semibold text-white">{event.model}</span>
                  <span>{ACTION_EMOJI[event.action]}</span>
                  <span className={`font-bold ${
                    event.action === "BUY" ? "text-emerald-400" :
                    event.action === "SELL" ? "text-red-400" :
                    "text-amber-400"
                  }`}>{event.action}</span>
                  {event.symbol && (
                    <span className="text-[var(--text-secondary)]">{event.symbol}</span>
                  )}
                  <span className="ml-auto text-[var(--text-tertiary)]">
                    {event.confidence > 0 && `${Math.round(event.confidence * 100)}%`}
                  </span>
                </div>
                {event.reasoning && (
                  <p className="text-[var(--text-tertiary)] mt-0.5 pl-[3.5rem] italic line-clamp-1">
                    {event.reasoning.substring(0, 80)}...
                  </p>
                )}
              </div>
            );
          }

          // Other event types
          return (
            <div key={event.id || i} className="flex items-center gap-2 text-xs text-[var(--text-tertiary)] py-0.5">
              <span>{EVENT_ICONS[event.eventType] || "•"}</span>
              <span className="font-medium text-white">{event.model}</span>
              <span>{event.eventType}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
