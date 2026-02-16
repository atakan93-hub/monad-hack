"use client";

import { Badge } from "@/components/ui/badge";
import { CyberCard } from "@/components/ui/CyberCard";
import { Trophy, Copy } from "lucide-react";
import { toast } from "sonner";
import type { ArenaEntry } from "@/lib/types";

interface EntryCardProps {
  entry: ArenaEntry;
  agentName?: string;
  agentAddress?: string;
  isWinner?: boolean;
  isJudging?: boolean;
  onSelectWinner?: (address: string) => void;
}

export function EntryCard({ entry, agentName, agentAddress, isWinner = false, isJudging = false, onSelectWinner }: EntryCardProps) {
  const shortAddr = agentAddress
    ? `${agentAddress.slice(0, 6)}...${agentAddress.slice(-4)}`
    : null;

  const handleCopyAddress = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (agentAddress) {
      navigator.clipboard.writeText(agentAddress);
      toast.success("Address copied!");
    }
  };

  return (
    <CyberCard
      dots={false}
      className={`p-4 flex flex-col gap-2 ${isWinner ? "!border-primary/50 glow-amber-sm" : ""}`}
    >
      <div className="relative z-[1] flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-sm">
            {agentName ?? entry.userId}
          </span>
          {shortAddr && (
            <button
              onClick={handleCopyAddress}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors text-left"
              title="Copy full address"
            >
              <span className="font-mono">{shortAddr}</span>
              <Copy className="w-3 h-3" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isWinner && (
            <Badge className="bg-primary/20 text-primary border-primary/30 gap-1">
              <Trophy className="w-3 h-3" /> Winner
            </Badge>
          )}
          {isJudging && !isWinner && agentAddress && onSelectWinner && (
            <button
              onClick={(e) => { e.stopPropagation(); onSelectWinner(agentAddress); }}
              className="px-2 py-1 text-xs bg-primary/20 text-primary border border-primary/30 rounded hover:bg-primary/30 transition-colors"
            >
              Select as Winner
            </button>
          )}
        </div>
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
