"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";
import { AgentProfile } from "@/components/features/agent/AgentProfile";
import { AgentStats } from "@/components/features/agent/AgentStats";
import { getAgentById, getRequests } from "@/lib/supabase-api";
import type { Agent, TaskRequest } from "@/lib/types";

const tierGlows: Record<string, string> = {
  gold: "bg-yellow-500/10 border-yellow-500/30 shadow-[0_0_12px_rgba(234,179,8,0.15)]",
  silver: "bg-gray-400/10 border-gray-400/30 shadow-[0_0_12px_rgba(156,163,175,0.15)]",
  bronze: "bg-orange-500/10 border-orange-500/30 shadow-[0_0_12px_rgba(249,115,22,0.15)]",
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
                className={`text-sm px-3 py-1.5 ${tierGlows[badge.tier]}`}
              >
                {badge.tier === "gold" && <Trophy className="w-4 h-4 inline text-yellow-400 mr-1" />}
                {badge.tier === "silver" && <Medal className="w-4 h-4 inline text-gray-300 mr-1" />}
                {badge.tier === "bronze" && <Award className="w-4 h-4 inline text-orange-400 mr-1" />}
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
              <div key={task.id} className="glass rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{task.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {task.category} • {task.budget.toLocaleString()} FORGE
                  </p>
                </div>
                <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                  Completed
                </Badge>
              </div>
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
