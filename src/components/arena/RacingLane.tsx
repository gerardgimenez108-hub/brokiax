"use client";

import { CompetitionParticipant } from "@/lib/types";
import { TrendingUp, TrendingDown, Minus, Brain } from "lucide-react";

interface RacingLaneProps {
  participant: CompetitionParticipant;
  isThinking: boolean;
  reasoning: string;
  cycleIndex: number;
}

const ACTION_BADGE_COLORS = {
  BUY: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  SELL: "bg-red-500/20 text-red-400 border-red-500/30",
  HOLD: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

const PROVIDER_LABELS: Record<string, string> = {
  openrouter: "OpenRouter",
  openai: "OpenAI",
  anthropic: "Anthropic",
  deepseek: "DeepSeek",
  gemini: "Google",
  grok: "xAI",
  qwen: "Qwen",
  kimi: "Kimi",
  minimax: "MiniMax",
};

export default function RacingLane({ participant, isThinking, reasoning }: RacingLaneProps) {
  const pnlColor = participant.currentPnlPercent > 0
    ? "text-emerald-400"
    : participant.currentPnlPercent < 0
    ? "text-red-400"
    : "text-[var(--text-secondary)]";

  const pnlIcon = participant.currentPnlPercent > 0
    ? <TrendingUp className="w-4 h-4" />
    : participant.currentPnlPercent < 0
    ? <TrendingDown className="w-4 h-4" />
    : <Minus className="w-4 h-4" />;

  return (
    <div className="relative">
      {/* Lane row */}
      <div
        className="glass-card p-4 flex flex-col md:flex-row md:items-center gap-4 transition-all"
        style={{ borderColor: `${participant.color}30` }}
      >
        {/* Left: Model info */}
        <div className="flex items-center gap-3 min-w-[180px]">
          {/* Avatar circle with color */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
            style={{ backgroundColor: participant.color }}
          >
            {participant.modelName.charAt(0)}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-white leading-tight">
              {participant.modelName}
            </span>
            <span className="text-xs text-[var(--text-tertiary)]">
              {PROVIDER_LABELS[participant.provider] || participant.provider}
            </span>
          </div>
        </div>

        {/* Center: Thinking bar + reasoning */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            {/* Thinking progress indicator */}
            <div className="relative w-16 h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden shrink-0">
              {isThinking ? (
                <div className="absolute inset-0 bg-indigo-500 animate-pulse-origin" />
              ) : participant.status === "decided" ? (
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ backgroundColor: participant.color }}
                />
              ) : (
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-red-500"
                  style={{ width: "100%" }}
                />
              )}
            </div>

            {/* Reasoning text */}
            <div className="flex-1 min-w-0">
              {reasoning ? (
                <p className="text-xs text-[var(--text-secondary)] italic leading-relaxed truncate">
                  &ldquo;{reasoning}&rdquo;
                </p>
              ) : (
                <p className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
                  {isThinking ? (
                    <>
                      <Brain className="w-3 h-3 animate-pulse" />
                      Analizando mercado...
                    </>
                  ) : (
                    "Esperando decisión..."
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right: PnL + action badge */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Confidence */}
          {participant.lastConfidence > 0 && (
            <div className="text-xs text-[var(--text-tertiary)] text-right hidden sm:block">
              <span className="font-medium text-white">{Math.round(participant.lastConfidence * 100)}%</span> conf
            </div>
          )}

          {/* PnL */}
          <div className={`flex items-center gap-1 font-bold text-sm ${pnlColor}`}>
            {pnlIcon}
            <span>{participant.currentPnlPercent > 0 ? "+" : ""}{participant.currentPnlPercent.toFixed(2)}%</span>
          </div>

          {/* Action badge */}
          {participant.lastAction && (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${ACTION_BADGE_COLORS[participant.lastAction]}`}>
              {participant.lastAction}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
