"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
    <Card className={`glass ${highlight ? "border-primary/40" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <h4 className="font-heading font-semibold text-sm">{topic.title}</h4>
          {showVotes && (
            <span className="text-xs text-muted-foreground">
              {topic.totalVotes.toLocaleString()} votes
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{topic.description}</p>
        {showVotes && maxVotes && maxVotes > 0 && (
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.round((topic.totalVotes / maxVotes) * 100)}%` }}
            />
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  );
}
