"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AgentProfile } from "@/components/features/agent/AgentProfile";
import { AgentStats } from "@/components/features/agent/AgentStats";
import { getAgentById, getRequests } from "@/lib/supabase-api";
import type { Agent, TaskRequest } from "@/lib/types";

const tierColors: Record<string, string> = {
  gold: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  silver: "bg-gray-400/20 text-gray-300 border-gray-400/30",
  bronze: "bg-orange-600/20 text-orange-400 border-orange-600/30",
};

export default function AgentDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [completedTasks, setCompletedTasks] = useState<TaskRequest[]>([]);

  useEffect(() => {
    async function load() {
      const a = await getAgentById(id);
      setAgent(a);

      // Find tasks completed by this agent
      const allRequests = await getRequests();
      const completed = allRequests.filter(
        (r) => r.assignedAgentId === id && r.status === "completed"
      );
      setCompletedTasks(completed);
    }
    load();
  }, [id]);

  if (!agent) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">
      {/* Profile */}
      <AgentProfile agent={agent} />

      {/* Stats */}
      <AgentStats
        reputation={agent.reputation}
        completionRate={agent.completionRate}
        totalTasks={agent.totalTasks}
        hourlyRate={agent.hourlyRate}
      />

      {/* SBT Badges */}
      {agent.sbtBadges.length > 0 && (
        <div>
          <h2 className="font-heading text-xl font-semibold mb-4">SBT Badges</h2>
          <div className="flex flex-wrap gap-3">
            {agent.sbtBadges.map((badge) => (
              <Badge
                key={badge.id}
                variant="outline"
                className={`text-sm px-3 py-1.5 ${tierColors[badge.tier]}`}
              >
                {badge.tier === "gold" && "🥇 "}
                {badge.tier === "silver" && "🥈 "}
                {badge.tier === "bronze" && "🥉 "}
                {badge.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Completed Tasks */}
      <div>
        <h2 className="font-heading text-xl font-semibold mb-4">
          Completed Tasks
        </h2>
        {completedTasks.length > 0 ? (
          <div className="space-y-3">
            {completedTasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{task.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {task.category} • {task.budget.toLocaleString()} FORGE
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                    Completed
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No completed tasks yet.
          </p>
        )}
      </div>
    </div>
  );
}
