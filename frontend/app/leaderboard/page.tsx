"use client";

import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CyberCard } from "@/components/ui/CyberCard";
import { Trophy, Medal, Crown } from "lucide-react";

// TODO: 하드코딩 데이터 — 여기만 수정하면 됨
const LEADERBOARD: {
  rank: number;
  name: string;
  address: string;
  score: number;
  tasks: number;
}[] = [
  { rank: 1, name: "Alice", address: "0xABCdef1234567890abcdef1234567890ABCD1234", score: 9800, tasks: 42 },
  { rank: 2, name: "Bob", address: "0xDEFabc5678901234defabc5678901234DEF05678", score: 8500, tasks: 35 },
  { rank: 3, name: "Carol", address: "0x1234ABCD5678ef901234abcd5678EF90ABCD1234", score: 7200, tasks: 28 },
];

const TOTAL_SLOTS = 10;

const rankStyle: Record<number, { border: string; bg: string; glow: string; icon: React.ReactNode }> = {
  1: {
    border: "border-yellow-500/40",
    bg: "bg-yellow-500/10",
    glow: "shadow-[0_0_20px_rgba(234,179,8,0.15)]",
    icon: <Crown className="w-6 h-6 text-yellow-400" />,
  },
  2: {
    border: "border-gray-400/40",
    bg: "bg-gray-400/10",
    glow: "shadow-[0_0_16px_rgba(156,163,175,0.12)]",
    icon: <Medal className="w-6 h-6 text-gray-300" />,
  },
  3: {
    border: "border-amber-700/40",
    bg: "bg-amber-700/10",
    glow: "shadow-[0_0_16px_rgba(180,83,9,0.12)]",
    icon: <Medal className="w-6 h-6 text-amber-600" />,
  },
};

function PodiumCard({ entry }: { entry: (typeof LEADERBOARD)[number] }) {
  const style = rankStyle[entry.rank] ?? {};
  const isFirst = entry.rank === 1;

  return (
    <CyberCard
      dots={false}
      className={`p-6 flex flex-col items-center gap-3 ${style.border} ${style.glow} ${isFirst ? "lg:-mt-6" : ""}`}
    >
      <div className="relative z-[1] flex flex-col items-center gap-3">
        <div className={`w-12 h-12 rounded-full ${style.bg} flex items-center justify-center`}>
          {style.icon}
        </div>
        <Avatar className={`${isFirst ? "w-16 h-16" : "w-12 h-12"}`}>
          <AvatarFallback className="bg-secondary text-lg font-bold">
            {entry.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="text-center">
          <p className="font-heading font-semibold">{entry.name}</p>
          <Link href={`/dashboard/${entry.address}`} className="text-xs text-muted-foreground font-mono hover:text-accent transition-colors">
            {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
          </Link>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">{entry.score.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{entry.tasks} tasks completed</p>
        </div>
      </div>
    </CyberCard>
  );
}

export default function LeaderboardPage() {
  const filled = LEADERBOARD.slice(0, 3);
  const emptySlots = TOTAL_SLOTS - filled.length;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-10">
        <h1 className="font-heading text-4xl font-bold tracking-tight">
          <span className="text-gradient-amber">Leaderboard</span>
        </h1>
        <p className="text-muted-foreground mt-2 flex items-center gap-2 text-sm tracking-wide">
          <span className="w-6 h-px bg-gradient-to-r from-cyan-500/50 to-transparent" />
          Top performers on TaskForge
        </p>
      </div>

      {/* Podium — top 3 */}
      {filled.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-10">
          {/* 2nd place */}
          <div>{filled[1] && <PodiumCard entry={filled[1]} />}</div>
          {/* 1st place */}
          <div>{filled[0] && <PodiumCard entry={filled[0]} />}</div>
          {/* 3rd place */}
          <div>{filled[2] && <PodiumCard entry={filled[2]} />}</div>
        </div>
      )}

      {/* Full list */}
      <CyberCard dots={false} className="p-0 overflow-hidden">
        {/* Table header */}
        <div className="relative z-[1] grid grid-cols-[3rem_1fr_6rem_6rem] md:grid-cols-[4rem_1fr_8rem_8rem] gap-4 px-6 py-3 border-b border-white/5 text-xs text-muted-foreground uppercase tracking-wider">
          <span>Rank</span>
          <span>User</span>
          <span className="text-right">Score</span>
          <span className="text-right">Tasks</span>
        </div>

        {/* Rows */}
        <div className="relative z-[1]">
          {Array.from({ length: TOTAL_SLOTS }, (_, i) => {
            const entry = filled[i];
            const rank = i + 1;
            const rStyle = rankStyle[rank];

            return (
              <div
                key={rank}
                className={`grid grid-cols-[3rem_1fr_6rem_6rem] md:grid-cols-[4rem_1fr_8rem_8rem] gap-4 px-6 py-4 border-b border-white/5 last:border-0
                  ${entry ? "hover:bg-white/[0.03] transition-colors" : "opacity-30"}`}
              >
                {/* Rank */}
                <div className="flex items-center">
                  {rStyle ? (
                    <div className={`w-7 h-7 rounded-full ${rStyle.bg} flex items-center justify-center`}>
                      <span className="text-xs font-bold">{rank}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground pl-1.5">{rank}</span>
                  )}
                </div>

                {/* User */}
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-secondary text-xs">
                      {entry ? entry.name.charAt(0) : "—"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{entry?.name ?? "—"}</p>
                    {entry ? (
                      <Link href={`/dashboard/${entry.address}`} className="text-xs text-muted-foreground font-mono hover:text-accent transition-colors">
                        {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                      </Link>
                    ) : (
                      <p className="text-xs text-muted-foreground font-mono">—</p>
                    )}
                  </div>
                </div>

                {/* Score */}
                <div className="flex items-center justify-end">
                  <span className={`text-sm font-semibold ${entry ? "text-primary" : ""}`}>
                    {entry ? entry.score.toLocaleString() : "—"}
                  </span>
                </div>

                {/* Tasks */}
                <div className="flex items-center justify-end">
                  <span className="text-sm text-muted-foreground">
                    {entry ? entry.tasks : "—"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CyberCard>
    </div>
  );
}
