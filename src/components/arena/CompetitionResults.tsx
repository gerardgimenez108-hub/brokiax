"use client";

import { LeaderboardEntry } from "@/lib/types";
import { Trophy, X } from "lucide-react";

interface CompetitionResultsProps {
  leaderboard: LeaderboardEntry[];
  onClose: () => void;
  onRunAgain: () => void;
}

const RANK_MEDALS = ["🥇", "🥈", "🥉"];

export default function CompetitionResults({ leaderboard, onClose, onRunAgain }: CompetitionResultsProps) {
  const winner = leaderboard[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative glass-card p-8 max-w-lg w-full text-center border-2 border-amber-500/30 shadow-[0_0_60px_rgba(245,158,11,0.15)] animate-fade-in">
        {/* Confetti-like decorations */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-60" />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-60" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-tertiary)] hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Trophy */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/20 flex items-center justify-center">
          <Trophy className="w-10 h-10 text-amber-400" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">Competición Finalizada</h2>
        <p className="text-[var(--text-secondary)] text-sm mb-8">
          {winner ? `${winner.modelName} gana con +${winner.pnlPercent.toFixed(2)}%` : "Sin resultados"}
        </p>

        {/* Podium */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {leaderboard.slice(0, 3).map((entry, i) => (
            <div
              key={entry.participantId}
              className={`text-center p-3 rounded-xl ${
                i === 0 ? "bg-amber-500/10 border border-amber-500/30 -mt-4" : "bg-[var(--bg-tertiary)]"
              }`}
            >
              <div className="text-2xl mb-1">{RANK_MEDALS[i]}</div>
              <div className="text-sm font-bold text-white truncate">{entry.modelName}</div>
              <div className={`text-lg font-bold mt-1 ${entry.pnlPercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {entry.pnlPercent >= 0 ? "+" : ""}{entry.pnlPercent.toFixed(2)}%
              </div>
              <div className="text-xs text-[var(--text-tertiary)] mt-1">
                {entry.winRate.toFixed(0)}% win · {entry.tradesCount} trades
              </div>
            </div>
          ))}
        </div>

        {/* Full results */}
        {leaderboard.length > 3 && (
          <div className="text-left mb-6 space-y-2">
            {leaderboard.slice(3).map((entry) => (
              <div key={entry.participantId} className="flex items-center justify-between text-sm py-1.5 px-3 rounded-lg bg-[var(--bg-tertiary)]/50">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--text-tertiary)] w-6">#{entry.rank}</span>
                  <span className="text-white">{entry.modelName}</span>
                </div>
                <div className={`font-bold ${entry.pnlPercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {entry.pnlPercent >= 0 ? "+" : ""}{entry.pnlPercent.toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-lg border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-secondary)] transition-all"
          >
            Cerrar
          </button>
          <button
            onClick={onRunAgain}
            className="flex-1 btn-primary py-3"
          >
            ⚡ Nueva Competición
          </button>
        </div>
      </div>
    </div>
  );
}
