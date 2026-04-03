"use client";

import { LeaderboardEntry } from "@/lib/types";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface LeaderboardPanelProps {
  entries: LeaderboardEntry[];
}

export default function LeaderboardPanel({ entries }: LeaderboardPanelProps) {
  return (
    <div className="glass-card p-4">
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <span className="w-5 h-5 rounded bg-amber-500/20 flex items-center justify-center text-xs">🏆</span>
        Leaderboard
      </h3>

      <div className="space-y-2">
        {entries.map((entry) => (
          <LeaderboardRow key={entry.participantId} entry={entry} />
        ))}

        {entries.length === 0 && (
          <p className="text-xs text-[var(--text-tertiary)] text-center py-4">
            No hay participantes aún
          </p>
        )}
      </div>
    </div>
  );
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  const [prevRank, setPrevRank] = useState(entry.rank);
  const [animating, setAnimating] = useState(false);
  const prevRankRef = useRef(entry.rank);

  useEffect(() => {
    if (prevRankRef.current !== entry.rank) {
      setAnimating(true);
      setPrevRank(prevRankRef.current);
      prevRankRef.current = entry.rank;
      const t = setTimeout(() => setAnimating(false), 500);
      return () => clearTimeout(t);
    }
  }, [entry.rank]);

  const pnlColor = entry.pnlPercent > 0
    ? "text-emerald-400"
    : entry.pnlPercent < 0
    ? "text-red-400"
    : "text-[var(--text-secondary)]";

  const rankColors = ["text-amber-400", "text-slate-300", "text-amber-600"];
  const rankBg = ["bg-amber-500/20", "bg-slate-400/20", "bg-amber-700/20"];

  return (
    <div
      className={`flex items-center gap-3 p-2.5 rounded-lg transition-all duration-300 ${
        animating ? "scale-[1.02] bg-white/5" : ""
      }`}
      style={{ borderLeft: `3px solid ${entry.color}` }}
    >
      {/* Rank badge */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${rankBg[entry.rank - 1] || "bg-[var(--bg-tertiary)]"} ${rankColors[entry.rank - 1] || "text-[var(--text-secondary)]"}`}>
        {entry.rank <= 3 ? ["①", "②", "③"][entry.rank - 1] : `#${entry.rank}`}
      </div>

      {/* Model name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{entry.modelName}</p>
        <p className="text-xs text-[var(--text-tertiary)]">{entry.provider}</p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs shrink-0">
        {/* Win rate */}
        <div className="text-right hidden sm:block">
          <div className="text-[var(--text-tertiary)]">Win rate</div>
          <div className="font-medium text-white">{entry.winRate.toFixed(0)}%</div>
        </div>

        {/* Trades */}
        <div className="text-right hidden md:block">
          <div className="text-[var(--text-tertiary)]">Trades</div>
          <div className="font-medium text-white">{entry.tradesCount}</div>
        </div>

        {/* PnL */}
        <div className={`flex items-center gap-1 font-bold ${pnlColor}`}>
          {entry.pnlPercent > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span>{entry.pnlPercent > 0 ? "+" : ""}{entry.pnlPercent.toFixed(2)}%</span>
        </div>
      </div>
    </div>
  );
}
