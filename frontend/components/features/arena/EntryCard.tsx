"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ArenaEntry } from "@/lib/types";

interface EntryCardProps {
  entry: ArenaEntry;
  agentName?: string;
  isWinner?: boolean;
}

export function EntryCard({ entry, agentName, isWinner = false }: EntryCardProps) {
  return (
    <Card className={isWinner ? "border-primary/50 bg-primary/5" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">
            {agentName ?? entry.agentId}
          </span>
          {isWinner && (
            <Badge className="bg-primary/20 text-primary border-primary/30">
              Winner
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
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
      </CardContent>
    </Card>
  );
}
