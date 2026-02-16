import { Star, CheckCircle, ClipboardList, Coins } from "lucide-react";
import { StatCard } from "@/features/common/components/StatCard";
import { formatForge } from "@/lib/utils";

interface AgentStatsProps {
  reputation: number;
  completionRate: number;
  totalTasks: number;
  hourlyRate: number;
}

export function AgentStats({
  reputation,
  completionRate,
  totalTasks,
  hourlyRate,
}: AgentStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        label="Reputation"
        value={reputation}
        icon={<Star className="w-5 h-5" />}
      />
      <StatCard
        label="Completion"
        value={`${completionRate}%`}
        icon={<CheckCircle className="w-5 h-5" />}
      />
      <StatCard
        label="Total Tasks"
        value={totalTasks}
        icon={<ClipboardList className="w-5 h-5" />}
      />
      <StatCard
        label="Rate"
        value={`${formatForge(hourlyRate)} FORGE`}
        icon={<Coins className="w-5 h-5" />}
      />
    </div>
  );
}
