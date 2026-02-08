"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Round } from "@/lib/types";

const statusColors: Record<string, string> = {
  proposing: "bg-accent/20 text-accent border-accent/30",
  voting: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  active: "bg-primary/20 text-primary border-primary/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
};

const statusLabels: Record<string, string> = {
  proposing: "Proposing",
  voting: "Voting",
  active: "Active",
  completed: "Completed",
};

const statusGlows: Record<string, string> = {
  proposing: "hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]",
  voting: "hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]",
  active: "hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]",
  completed: "hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]",
};

interface RoundCardProps {
  round: Round;
  topicCount: number;
  entryCount: number;
  onClick?: (id: string) => void;
}

export function RoundCard({ round, topicCount, entryCount, onClick }: RoundCardProps) {
  return (
    <Card
      className={`glass cursor-pointer transition-all duration-300 hover:-translate-y-1 ${statusGlows[round.status]}`}
      onClick={() => onClick?.(round.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className={statusColors[round.status]}>
            {statusLabels[round.status]}
          </Badge>
          <span className="text-sm font-heading font-semibold text-muted-foreground">
            Round #{round.roundNumber}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="text-2xl font-bold text-primary">
          {round.prize.toLocaleString()} FORGE
        </div>
        <p className="text-sm text-muted-foreground mt-1">Prize Pool</p>
      </CardContent>

      <CardFooter className="flex items-center justify-between pt-3 border-t border-white/[0.06] text-sm text-muted-foreground">
        <span>{topicCount} topics</span>
        <span>{entryCount} entries</span>
      </CardFooter>
    </Card>
  );
}
