"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@/lib/hooks/useUser";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ClipboardList, Flame, Mail, Coins, Wallet } from "lucide-react";
import { StatCard } from "@/components/features/common/StatCard";
import { formatForge } from "@/lib/utils";
import { CyberCard } from "@/components/ui/CyberCard";
import {
  getDashboardStats,
  getRequests,
  getProposalsByRequest,
  getUserById,
} from "@/lib/supabase-api";
import type { TaskRequest, Proposal, User } from "@/lib/types";

const statusColors: Record<string, string> = {
  open: "bg-primary/20 text-primary border-primary/30",
  in_progress: "bg-accent/20 text-accent border-accent/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  disputed: "bg-red-500/20 text-red-400 border-red-500/30",
};

interface ProposalWithUser extends Proposal {
  proposer?: User | null;
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
  const [recentProposals, setRecentProposals] = useState<ProposalWithUser[]>([]);

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
      const allProposals: ProposalWithUser[] = [];
      for (const req of myRequests.slice(0, 5)) {
        const props = await getProposalsByRequest(req.id);
        for (const p of props) {
          const proposer = await getUserById(p.userId);
          allProposals.push({ ...p, proposer, requestTitle: req.title });
        }
      }
      setRecentProposals(allProposals.slice(0, 8));
    }
    load();
  }, [user]);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <CyberCard className="p-10 flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center relative z-[1]">
            <Wallet className="w-8 h-8 text-cyan-400" />
          </div>
          <h2 className="font-heading text-2xl font-bold relative z-[1]">Connect Your Wallet</h2>
          <p className="text-muted-foreground text-sm max-w-sm text-center relative z-[1]">
            Connect your wallet to access the dashboard and manage your tasks
          </p>
          <div className="relative z-[1]">
            <ConnectButton />
          </div>
        </CyberCard>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard label="Total Requests" value={stats.totalRequests} icon={<ClipboardList className="w-5 h-5" />} />
        <StatCard label="Active" value={stats.activeRequests} icon={<Flame className="w-5 h-5" />} />
        <StatCard label="Proposals Received" value={stats.totalProposals} icon={<Mail className="w-5 h-5" />} />
        <StatCard
          label="Total Spent"
          value={`${formatForge(stats.totalSpent)} FORGE`}
          icon={<Coins className="w-5 h-5" />}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active Requests */}
        <CyberCard dots className="p-6">
          <h2 className="font-heading text-lg font-semibold mb-4 relative z-[1]">
            My Active Requests
          </h2>
          <div className="relative z-[1]">
            {activeRequests.length > 0 ? (
              <div className="flex flex-col gap-3">
                {activeRequests.map((req) => (
                  <Link key={req.id} href={`/market/${req.id}`}>
                    <div className="p-4 border border-cyan-500/10 bg-white/[0.02] flex items-center justify-between
                                    hover:border-cyan-500/25 transition-all duration-300">
                      <div>
                        <p className="font-medium text-sm">{req.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatForge(req.budget)} FORGE &middot;{" "}
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
        </CyberCard>

        {/* Received Proposals */}
        <CyberCard dots className="p-6">
          <h2 className="font-heading text-lg font-semibold mb-4 relative z-[1]">
            Received Proposals
          </h2>
          <div className="relative z-[1]">
            {recentProposals.length > 0 ? (
              <div className="flex flex-col gap-3">
                {recentProposals.map((prop) => (
                  <div key={prop.id} className="p-4 border border-cyan-500/10 bg-white/[0.02]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={prop.proposer?.avatarUrl} />
                          <AvatarFallback className="bg-secondary text-xs">
                            {prop.proposer?.name?.charAt(0) ?? "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {prop.proposer?.name ?? prop.userId}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {prop.requestTitle} &middot;{" "}
                            <span className="text-primary">
                              {formatForge(prop.price)} FORGE
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
        </CyberCard>
      </div>
    </div>
  );
}
