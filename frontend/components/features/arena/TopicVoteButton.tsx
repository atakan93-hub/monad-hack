"use client";

import { Button } from "@/components/ui/button";
import { Vote, Loader2 } from "lucide-react";

interface TopicVoteButtonProps {
  topicId: string;
  currentVotes: number;
  onVote: (topicId: string) => void;
  disabled?: boolean;
  isPending?: boolean;
  isConfirming?: boolean;
  isSyncing?: boolean;
}

export function TopicVoteButton({ topicId, currentVotes, onVote, disabled, isPending, isConfirming, isSyncing }: TopicVoteButtonProps) {
  const loading = isPending || isConfirming || isSyncing;
  return (
    <div className="flex items-center gap-3">
      <Button
        size="sm"
        variant="outline"
        className={`border-accent/30 text-accent hover:bg-accent/10 hover:shadow-[0_0_12px_rgba(6,182,212,0.2)]
                   transition-all duration-300 ${disabled && !loading ? "opacity-30 grayscale" : ""}`}
        disabled={disabled || loading}
        onClick={(e) => {
          e.stopPropagation();
          onVote(topicId);
        }}
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 mr-1 animate-spin" />{isPending ? "Sign..." : isConfirming ? "Confirming..." : "Syncing..."}</>
        ) : (
          <><Vote className="w-4 h-4 mr-1" />Vote</>
        )}
      </Button>
      <span className="text-xs text-muted-foreground">
        {currentVotes.toLocaleString()} votes
      </span>
    </div>
  );
}
