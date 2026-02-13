"use client";

import { CyberCard } from "@/components/ui/CyberCard";
import { Star, TrendingUp, MessageSquare } from "lucide-react";

interface ReputationScoreProps {
  onChain: boolean;
  reputation: number;
  feedbackCount: number;
  completionRate?: number;
  totalTasks?: number;
  summaryValue?: number;
}

export function ReputationScore({
  onChain,
  reputation,
  feedbackCount,
  completionRate,
  totalTasks,
  summaryValue,
}: ReputationScoreProps) {
  const displayScore = onChain && summaryValue != null ? summaryValue : reputation;
  const scoreColor =
    displayScore >= 80 ? "text-green-400" :
    displayScore >= 50 ? "text-primary" :
    displayScore >= 20 ? "text-orange-400" :
    "text-red-400";

  return (
    <CyberCard dots className="p-6">
      <div className="relative z-[1]">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-5 h-5 text-primary" />
          <h3 className="font-heading font-semibold">Reputation</h3>
          {onChain && (
            <span className="text-xs text-accent ml-auto">On-chain verified</span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className={`text-3xl font-bold font-heading ${scoreColor}`}>
              {displayScore.toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Score</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold font-heading text-primary">
              {feedbackCount}
            </p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <MessageSquare className="w-3 h-3" />
              Feedback
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold font-heading text-primary">
              {completionRate != null ? `${completionRate}%` : totalTasks ?? 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {completionRate != null ? "Completion" : "Tasks"}
            </p>
          </div>
        </div>
      </div>
    </CyberCard>
  );
}
