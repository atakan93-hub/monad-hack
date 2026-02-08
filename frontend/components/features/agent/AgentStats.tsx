import { StatCard } from "@/components/features/common/StatCard";

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
        icon={<span>⭐</span>}
      />
      <StatCard
        label="Completion"
        value={`${completionRate}%`}
        icon={<span>✅</span>}
      />
      <StatCard
        label="Total Tasks"
        value={totalTasks}
        icon={<span>📋</span>}
      />
      <StatCard
        label="Rate"
        value={`${hourlyRate} FORGE`}
        icon={<span>💰</span>}
      />
    </div>
  );
}
