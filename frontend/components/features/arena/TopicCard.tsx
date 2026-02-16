"use client";

import { CyberCard } from "@/components/ui/CyberCard";
import type { Topic } from "@/lib/types";

interface TopicCardProps {
  topic: Topic;
  showVotes?: boolean;
  highlight?: boolean;
  maxVotes?: number;
  children?: React.ReactNode;
}

export function TopicCard({ topic, showVotes = true, highlight = false, maxVotes, children }: TopicCardProps) {
  return (
    <CyberCard
      dots={false}
      className={`p-4 flex flex-col gap-3 ${highlight ? "!border-primary/40" : ""}`}
    >
      <div className="relative z-[1] flex items-center justify-between">
        <h4 className="font-heading font-semibold text-sm">{topic.title}</h4>
        {showVotes && (
          <span className="text-xs text-muted-foreground">
            {topic.totalVotes.toLocaleString()} votes
          </span>
        )}
      </div>
      <div className="relative z-[1] flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">{topic.description}</p>
        {showVotes && maxVotes && maxVotes > 0 && (
          <div className="w-full h-1.5 bg-white/5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent to-purple-500 transition-[width] duration-500
                         shadow-[0_0_8px_rgba(6,182,212,0.4)]"
              style={{ width: `${Math.round((topic.totalVotes / maxVotes) * 100)}%` }}
            />
          </div>
        )}
        {children}
      </div>
    </CyberCard>
  );
}
