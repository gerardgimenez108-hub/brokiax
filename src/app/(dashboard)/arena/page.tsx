"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { Trophy, TrendingUp, TrendingDown, Crown } from "lucide-react";

type LeaderboardEntry = {
  model: string;
  provider: string;
  pnl: number;
  winRate: number;
  tradesCount: number;
  color: string;
};

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { model: "gpt-4o", provider: "OpenAI", pnl: 145.2, winRate: 68, tradesCount: 42, color: "text-emerald-400" },
  { model: "claude-3-5-sonnet", provider: "Anthropic", pnl: 112.5, winRate: 64, tradesCount: 38, color: "text-amber-500" },
  { model: "deepseek-chat", provider: "DeepSeek", pnl: 98.4, winRate: 60, tradesCount: 45, color: "text-blue-500" },
  { model: "qwen-max", provider: "Qwen", pnl: -12.4, winRate: 48, tradesCount: 22, color: "text-red-400" }
];

export default function AiArenaPage() {
  const { user } = useAuth();
  const isFree = user?.subscriptionStatus === "incomplete";

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(MOCK_LEADERBOARD);
  const [timeframe, setTimeframe] = useState<"24h" | "7d" | "30d">("24h");

  // MVP: Real time layout placeholder sorting. In the future this should fetch from an API aggregating actual logs.
  useEffect(() => {
    // Sort by PnL desc
    const sorted = [...MOCK_LEADERBOARD].sort((a, b) => b.pnl - a.pnl);
    setLeaderboard(sorted);
  }, [timeframe]);


  return (
    <div className="relative">
      {isFree && (
        <div className="absolute inset-0 z-50 backdrop-blur-md bg-[var(--bg-primary)]/60 flex items-center justify-center rounded-2xl animate-fade-in">
          <div className="glass-card p-10 text-center max-w-md mx-4 shadow-2xl border border-[var(--warning)]/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--warning)]/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--warning)]/20 flex items-center justify-center text-3xl mb-4 border border-[var(--warning)]/30">
              🏆
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">AI Arena es Premium</h2>
            <p className="text-[var(--text-secondary)] text-sm mb-6 leading-relaxed">
              Descubre qué modelo LLM tiene el mejor rendimiento en dinero real o simulado. Competición 24/7.
            </p>
            <Link href="/settings/billing" className="btn-primary w-full py-3 flex justify-center items-center gap-2">
              Mejorar a Pro por 29€
            </Link>
          </div>
        </div>
      )}

      <div className={`space-y-6 pb-12 transition-all ${isFree ? 'pointer-events-none select-none opacity-30 blur-[2px]' : ''}`}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-600 to-yellow-500 flex items-center justify-center text-white text-sm">
                <Trophy className="w-4 h-4" />
              </span>
              AI Arena PvP
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-medium ml-2 border border-amber-500/30">PRO</span>
            </h1>
            <p className="text-[var(--text-secondary)] mt-1">
              Leaderboard global de rendimiento: "GPT-4o vs Claude vs DeepSeek vs Qwen" en operativas autónomas.
            </p>
          </div>
          
          <div className="flex bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-1">
            <button 
              onClick={() => setTimeframe("24h")}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${timeframe === "24h" ? "bg-[var(--brand-500)]/20 text-[var(--brand-400)]" : "text-[var(--text-secondary)] hover:text-white"}`}
            >24h</button>
            <button 
              onClick={() => setTimeframe("7d")}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${timeframe === "7d" ? "bg-[var(--brand-500)]/20 text-[var(--brand-400)]" : "text-[var(--text-secondary)] hover:text-white"}`}
            >7d</button>
            <button 
              onClick={() => setTimeframe("30d")}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${timeframe === "30d" ? "bg-[var(--brand-500)]/20 text-[var(--brand-400)]" : "text-[var(--text-secondary)] hover:text-white"}`}
            >30d</button>
          </div>
        </div>

        {/* Top 3 Podium (Visual Flex) */}
        <div className="grid grid-cols-3 gap-4 md:gap-6 mt-8 mb-12 items-end max-w-4xl mx-auto">
          {/* 2nd Place */}
          {leaderboard.length > 1 && (
            <div className="flex flex-col items-center">
              <div className="glass-card w-full text-center p-4 border border-[var(--border-primary)] bg-gradient-to-t from-[var(--bg-secondary)] relative h-32 flex flex-col justify-end">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-slate-400/20 border-2 border-slate-400 flex items-center justify-center text-xl font-bold">2</div>
                <div className="text-lg font-bold">{leaderboard[1].model}</div>
                <div className="text-[var(--text-secondary)] text-sm">{leaderboard[1].provider}</div>
                <div className={`mt-2 font-bold ${leaderboard[1].pnl >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                  {leaderboard[1].pnl > 0 ? "+" : ""}{leaderboard[1].pnl}%
                </div>
              </div>
            </div>
          )}

          {/* 1st Place */}
          {leaderboard.length > 0 && (
            <div className="flex flex-col items-center z-10">
              <div className="glass-card w-full text-center p-4 border-2 border-amber-500/50 bg-gradient-to-t from-amber-500/10 to-transparent relative h-40 flex flex-col justify-end shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                  <Crown className="w-8 h-8 text-amber-400 mb-1 mx-auto drop-shadow-lg" />
                  <div className="w-14 h-14 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-2xl font-bold shadow-[0_0_15px_rgba(245,158,11,0.4)] text-amber-200">1</div>
                </div>
                <div className="text-xl font-bold text-white">{leaderboard[0].model}</div>
                <div className="text-[var(--text-secondary)] text-sm">{leaderboard[0].provider}</div>
                <div className={`mt-2 font-bold text-lg ${leaderboard[0].pnl >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                  {leaderboard[0].pnl > 0 ? "+" : ""}{leaderboard[0].pnl}%
                </div>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {leaderboard.length > 2 && (
            <div className="flex flex-col items-center">
              <div className="glass-card w-full text-center p-4 border border-[var(--border-primary)] bg-gradient-to-t from-[var(--bg-secondary)] relative h-28 flex flex-col justify-end">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-amber-700/20 border-2 border-amber-700 flex items-center justify-center text-xl font-bold text-amber-700">3</div>
                <div className="text-md font-bold">{leaderboard[2].model}</div>
                <div className="text-[var(--text-secondary)] text-sm">{leaderboard[2].provider}</div>
                <div className={`mt-2 font-bold ${leaderboard[2].pnl >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                  {leaderboard[2].pnl > 0 ? "+" : ""}{leaderboard[2].pnl}%
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Detailed Leaderboard Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#121629] border-b border-[#232B45] text-[var(--text-tertiary)] uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">Rank</th>
                  <th className="px-6 py-4 font-medium">Model</th>
                  <th className="px-6 py-4 font-medium text-right">Profit / Loss (PnL)</th>
                  <th className="px-6 py-4 font-medium text-center">Win Rate</th>
                  <th className="px-6 py-4 font-medium text-right">Trades Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#232B45]">
                {leaderboard.map((entry, index) => (
                  <tr key={index} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-bold text-[var(--text-secondary)]">#{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">{entry.model}</span>
                        <span className="text-xs text-[var(--text-tertiary)]">{entry.provider}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={`flex items-center justify-end gap-2 font-bold ${entry.pnl >= 0 ? entry.color : "text-[var(--danger)]"}`}>
                        {entry.pnl > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {entry.pnl > 0 ? "+" : ""}{entry.pnl}%
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-300">
                        {entry.winRate}%
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-[var(--text-secondary)]">
                      {entry.tradesCount} 
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
