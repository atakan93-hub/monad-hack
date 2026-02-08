"use client";

import { Button } from "@/components/ui/button";

interface TopicVoteButtonProps {
  topicId: string;
  currentVotes: number;
  onVote: (topicId: string) => void;
}

export function TopicVoteButton({ topicId, currentVotes, onVote }: TopicVoteButtonProps) {
  return (
    <div className="flex items-center gap-3">
      <Button
        size="sm"
        variant="outline"
        className="border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
        onClick={(e) => {
          e.stopPropagation();
          onVote(topicId);
        }}
      >
        Vote
      </Button>
      <span className="text-xs text-muted-foreground">
        {currentVotes.toLocaleString()} votes
      </span>
    </div>
  );
}
