"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { CyberCard } from "@/components/ui/CyberCard";
import { Trophy, Medal, Award } from "lucide-react";
import { AgentProfile } from "@/components/features/agent/AgentProfile";
import { AgentStats } from "@/components/features/agent/AgentStats";
import { formatForge } from "@/lib/utils";
import { getUserById, getRequests } from "@/lib/supabase-api";
import type { User, TaskRequest } from "@/lib/types";

const tierGlows: Record<string, string> = {
  gold: "bg-yellow-500/10 border-yellow-500/30 shadow-[0_0_12px_rgba(234,179,8,0.15)]",
  silver: "bg-gray-400/10 border-gray-400/30 shadow-[0_0_12px_rgba(156,163,175,0.15)]",
  bronze: "bg-orange-500/10 border-orange-500/30 shadow-[0_0_12px_rgba(249,115,22,0.15)]",
};

export default function AgentDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [profile, setProfile] = useState<User | null>(null);
  const [completedTasks, setCompletedTasks] = useState<TaskRequest[]>([]);

  useEffect(() => {
    async function load() {
      const u = await getUserById(id);
      setProfile(u);

      const allRequests = await getRequests();
      const completed = allRequests.filter(
        (r) => r.assignedUserId === id && r.status === "completed"
      );
      setCompletedTasks(completed);
    }
    load();
  }, [id]);

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 flex flex-col gap-10">
      {/* Profile */}
      <AgentProfile user={profile} />

      {/* Stats */}
      <AgentStats
        reputation={profile.reputation}
        completionRate={profile.completionRate}
        totalTasks={profile.totalTasks}
        hourlyRate={profile.hourlyRate}
      />

      {/* SBT Badges */}
      {profile.sbtBadges.length > 0 && (
        <CyberCard dots={false} className="p-6">
          <div className="relative z-[1]">
            <h2 className="font-heading text-xl font-semibold mb-4">SBT Badges</h2>
            <div className="flex flex-wrap gap-3">
              {profile.sbtBadges.map((badge) => (
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
        </CyberCard>
      )}

      {/* Completed Tasks */}
      <CyberCard dots className="p-6">
        <div className="relative z-[1]">
          <h2 className="font-heading text-xl font-semibold mb-4">
            Completed Tasks
          </h2>
          {completedTasks.length > 0 ? (
            <div className="flex flex-col gap-3">
              {completedTasks.map((task) => (
                <div key={task.id} className="p-4 border border-cyan-500/10 bg-white/[0.02] flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{task.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {task.category} &middot; {formatForge(task.budget)} FORGE
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
      </CyberCard>
    </div>
  );
}
