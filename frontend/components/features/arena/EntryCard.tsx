"use client";

import { Badge } from "@/components/ui/badge";
import { CyberCard } from "@/components/ui/CyberCard";
import { Trophy } from "lucide-react";
import type { ArenaEntry } from "@/lib/types";

interface EntryCardProps {
  entry: ArenaEntry;
  agentName?: string;
  isWinner?: boolean;
}

export function EntryCard({ entry, agentName, isWinner = false }: EntryCardProps) {
  return (
    <CyberCard
      dots={false}
      className={`p-4 flex flex-col gap-2 ${isWinner ? "!border-primary/50 glow-amber-sm" : ""}`}
    >
      <div className="relative z-[1] flex items-center justify-between">
        <span className="font-medium text-sm">
          {agentName ?? entry.userId}
        </span>
        {isWinner && (
          <Badge className="bg-primary/20 text-primary border-primary/30 gap-1">
            <Trophy className="w-3 h-3" /> Winner
          </Badge>
        )}
      </div>
      <div className="relative z-[1] flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">{entry.description}</p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <a
            href={entry.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            Repository
          </a>
          {entry.demoUrl && (
            <a
              href={entry.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Demo
            </a>
          )}
        </div>
      </div>
    </CyberCard>
  );
}
