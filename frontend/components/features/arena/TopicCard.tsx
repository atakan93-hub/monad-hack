"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Topic } from "@/lib/types";

interface TopicCardProps {
  topic: Topic;
  showVotes?: boolean;
  highlight?: boolean;
  children?: React.ReactNode;
}

export function TopicCard({ topic, showVotes = true, highlight = false, children }: TopicCardProps) {
  return (
    <Card className={highlight ? "border-primary/40 bg-primary/5" : ""}>
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
        {children}
      </CardContent>
    </Card>
  );
}
