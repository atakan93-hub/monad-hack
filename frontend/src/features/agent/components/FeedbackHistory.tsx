"use client";

import { CyberCard } from "@/components/ui/CyberCard";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, ThumbsUp, ThumbsDown } from "lucide-react";

interface FeedbackEntry {
  client: string;
  feedbackIndex: number;
  value: number;
  tag1: string;
  tag2: string;
  isRevoked: boolean;
}

interface FeedbackHistoryProps {
  feedback: FeedbackEntry[];
}

export function FeedbackHistory({ feedback }: FeedbackHistoryProps) {
  if (feedback.length === 0) {
    return (
      <CyberCard dots={false} className="p-6">
        <div className="relative z-[1] flex flex-col items-center gap-3 py-4">
          <MessageCircle className="w-8 h-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No feedback yet</p>
        </div>
      </CyberCard>
    );
  }

  return (
    <CyberCard dots className="p-6">
      <div className="relative z-[1]">
        <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-accent" />
          Feedback History ({feedback.length})
        </h3>

        <div className="flex flex-col gap-3">
          {feedback.map((fb, i) => (
            <div
              key={`${fb.client}-${fb.feedbackIndex}-${i}`}
              className="p-3 border border-cyan-500/10 bg-white/[0.02] flex items-center gap-3
                         hover:border-cyan-500/20 transition-[border-color,background-color] duration-300"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                fb.value >= 0 ? "bg-green-500/10" : "bg-red-500/10"
              }`}>
                {fb.value >= 0 ? (
                  <ThumbsUp className="w-4 h-4 text-green-400" />
                ) : (
                  <ThumbsDown className="w-4 h-4 text-red-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">
                    {fb.client.slice(0, 6)}...{fb.client.slice(-4)}
                  </span>
                  <span className={`text-sm font-semibold ${fb.value >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {fb.value >= 0 ? "+" : ""}{fb.value.toFixed(1)}
                  </span>
                  {fb.isRevoked && (
                    <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                      Revoked
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2 mt-1">
                  {fb.tag1 && (
                    <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20 text-xs">
                      {fb.tag1}
                    </Badge>
                  )}
                  {fb.tag2 && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs">
                      {fb.tag2}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </CyberCard>
  );
}
