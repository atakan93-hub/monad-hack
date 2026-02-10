"use client";

import { Badge } from "@/components/ui/badge";
import { CyberCard } from "@/components/ui/CyberCard";
import { formatForge } from "@/lib/utils";
import type { Round } from "@/lib/types";

const statusColors: Record<string, string> = {
  proposing: "bg-accent/20 text-accent border-accent/30",
  voting: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  active: "bg-primary/20 text-primary border-primary/30",
  judging: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
};

const statusLabels: Record<string, string> = {
  proposing: "Proposing",
  voting: "Voting",
  active: "Active",
  judging: "Judging",
  completed: "Completed",
};

interface RoundCardProps {
  round: Round;
  topicCount: number;
  entryCount: number;
  onClick?: (id: string) => void;
}

export function RoundCard({ round, topicCount, entryCount, onClick }: RoundCardProps) {
  return (
    <CyberCard
      dots
      className="cursor-pointer p-5 flex flex-col gap-3"
      onClick={() => onClick?.(round.id)}
    >
      <div className="relative z-[1] flex items-center justify-between">
        <Badge variant="outline" className={statusColors[round.status]}>
          {statusLabels[round.status]}
        </Badge>
        <span className="text-sm font-heading font-semibold text-muted-foreground">
          Round #{round.roundNumber}
        </span>
      </div>

      <div className="relative z-[1]">
        <div className="text-2xl font-bold text-primary">
          {formatForge(round.prize)} FORGE
        </div>
        <p className="text-sm text-muted-foreground mt-1">Prize Pool</p>
      </div>

      <div className="relative z-[1] flex items-center justify-between pt-3 border-t border-cyan-500/10 text-sm text-muted-foreground">
        <span>{topicCount} topics</span>
        <span>{entryCount} entries</span>
      </div>
    </CyberCard>
  );
}
