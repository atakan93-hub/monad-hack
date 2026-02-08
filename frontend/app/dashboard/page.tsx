"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@/lib/hooks/useUser";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ClipboardList, Flame, Mail, Coins, Wallet } from "lucide-react";
import { StatCard } from "@/components/features/common/StatCard";
import {
  getDashboardStats,
  getRequests,
  getProposalsByRequest,
  getAgentById,
} from "@/lib/supabase-api";
import type { TaskRequest, Proposal, Agent } from "@/lib/types";

const statusColors: Record<string, string> = {
  open: "bg-primary/20 text-primary border-primary/30",
  in_progress: "bg-accent/20 text-accent border-accent/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  disputed: "bg-red-500/20 text-red-400 border-red-500/30",
};

interface ProposalWithAgent extends Proposal {
  agent?: Agent | null;
  requestTitle?: string;
}

export default function DashboardPage() {
  const { isConnected, user } = useUser();

  const [stats, setStats] = useState({
    totalRequests: 0,
    activeRequests: 0,
    totalProposals: 0,
    totalSpent: 0,
  });
  const [activeRequests, setActiveRequests] = useState<TaskRequest[]>([]);
  const [recentProposals, setRecentProposals] = useState<ProposalWithAgent[]>([]);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const dashStats = await getDashboardStats(user.id);
      setStats(dashStats);

      const allRequests = await getRequests();
      const myActive = allRequests.filter(
        (r) =>
          r.requesterId === user?.id &&
          (r.status === "open" || r.status === "in_progress")
      );
      setActiveRequests(myActive);

      const myRequests = allRequests.filter((r) => r.requesterId === user?.id);
      const allProposals: ProposalWithAgent[] = [];
      for (const req of myRequests.slice(0, 5)) {
        const props = await getProposalsByRequest(req.id);
        for (const p of props) {
          const agent = await getAgentById(p.agentId);
          allProposals.push({ ...p, agent, requestTitle: req.title });
        }
      }
      setRecentProposals(allProposals.slice(0, 8));
    }
    load();
  }, [user]);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
          <Wallet className="w-8 h-8 text-accent" />
        </div>
        <h2 className="font-heading text-2xl font-bold">Connect Your Wallet</h2>
        <p className="text-muted-foreground text-sm max-w-sm text-center">
          Connect your wallet to access the dashboard and manage your tasks
        </p>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <h1 className="font-heading text-3xl font-bold mb-8">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard label="Total Requests" value={stats.totalRequests} icon={<ClipboardList className="w-5 h-5" />} />
        <StatCard label="Active" value={stats.activeRequests} icon={<Flame className="w-5 h-5" />} />
        <StatCard label="Proposals Received" value={stats.totalProposals} icon={<Mail className="w-5 h-5" />} />
        <StatCard
          label="Total Spent"
          value={`${stats.totalSpent.toLocaleString()} FORGE`}
          icon={<Coins className="w-5 h-5" />}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Active Requests */}
        <div>
          <h2 className="font-heading text-xl font-semibold mb-4">
            My Active Requests
          </h2>
          {activeRequests.length > 0 ? (
            <div className="space-y-3">
              {activeRequests.map((req) => (
                <Link key={req.id} href={`/market/${req.id}`}>
                  <div className="glass rounded-xl p-4 flex items-center justify-between
                                  hover:border-accent/20 transition-all duration-300">
                    <div>
                      <p className="font-medium text-sm">{req.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {req.budget.toLocaleString()} FORGE •{" "}
                        {req.proposals.length} proposals
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={statusColors[req.status]}
                    >
                      {req.status.replace("_", " ")}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No active requests.
            </p>
          )}
        </div>

        {/* Received Proposals */}
        <div>
          <h2 className="font-heading text-xl font-semibold mb-4">
            Received Proposals
          </h2>
          {recentProposals.length > 0 ? (
            <div className="space-y-3">
              {recentProposals.map((prop) => (
                <div key={prop.id} className="glass rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={prop.agent?.avatarUrl} />
                        <AvatarFallback className="bg-secondary text-xs">
                          {prop.agent?.name?.charAt(0) ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {prop.agent?.name ?? prop.agentId}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {prop.requestTitle} •{" "}
                          <span className="text-primary">
                            {prop.price.toLocaleString()} FORGE
                          </span>
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        prop.status === "accepted"
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : prop.status === "rejected"
                            ? "bg-red-500/20 text-red-400 border-red-500/30"
                            : "bg-primary/20 text-primary border-primary/30"
                      }
                    >
                      {prop.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No proposals received.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
