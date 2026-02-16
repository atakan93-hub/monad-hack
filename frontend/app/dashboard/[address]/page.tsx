"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/lib/hooks/useUser";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ClipboardList,
  Flame,
  Mail,
  Coins,
  User as UserIcon,
  Handshake,
} from "lucide-react";
import { StatCard } from "@/components/features/common/StatCard";
import { formatForge } from "@/lib/utils";
import { CyberCard } from "@/components/ui/CyberCard";
import { DirectDealCard } from "@/components/features/market/DirectDealCard";
import { DirectDealButton } from "@/components/features/agent/DirectDealButton";
import { AgentIdentityCard } from "@/components/features/agent/AgentIdentityCard";
import { ReputationScore } from "@/components/features/agent/ReputationScore";
import { FeedbackHistory } from "@/components/features/agent/FeedbackHistory";
import { ValidationBadge } from "@/components/features/agent/ValidationBadge";
import {
  getDashboardStats,
  getRequests,
  getProposalsByRequest,
  getUserByAddress,
  getUserById,
  getDirectRequestsByAddress,
} from "@/lib/supabase-api";
import type { TaskRequest, Proposal, User, DirectRequest } from "@/lib/types";

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

interface ReputationData {
  onChain: boolean;
  agentId: number | null;
  reputation: number;
  feedbackCount: number;
  completionRate?: number;
  totalTasks?: number;
  summaryValue?: number;
}

interface IdentityData {
  registered: boolean;
  agentId: number | null;
  balance?: number;
}

interface FeedbackEntry {
  client: string;
  feedbackIndex: number;
  value: number;
  tag1: string;
  tag2: string;
  isRevoked: boolean;
}

export default function UserDashboardPage() {
  const params = useParams();
  const profileAddress = params.address as string;
  const { user: currentUser } = useUser();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [stats, setStats] = useState({
    totalRequests: 0,
    activeRequests: 0,
    totalProposals: 0,
    totalSpent: 0,
  });
  const [activeRequests, setActiveRequests] = useState<TaskRequest[]>([]);
  const [recentProposals, setRecentProposals] = useState<ProposalWithUser[]>([]);
  const [directDeals, setDirectDeals] = useState<DirectRequest[]>([]);
  const [identityData, setIdentityData] = useState<IdentityData | null>(null);
  const [reputationData, setReputationData] = useState<ReputationData | null>(null);
  const [feedbackData, setFeedbackData] = useState<FeedbackEntry[]>([]);

  const isOwnDashboard =
    currentUser?.address?.toLowerCase() === profileAddress?.toLowerCase();

  const loadDirectDeals = useCallback(async () => {
    if (!profileAddress) return;
    try {
      const deals = await getDirectRequestsByAddress(profileAddress);
      setDirectDeals(deals);
    } catch {
      /* ignore */
    }
  }, [profileAddress]);

  const loadIdentityAndReputation = useCallback(async () => {
    if (!profileAddress) return;
    try {
      const [identityRes, reputationRes, feedbackRes] = await Promise.all([
        fetch(`/api/agents/${profileAddress}/identity`).then((r) => r.json()),
        fetch(`/api/agents/${profileAddress}/reputation`).then((r) => r.json()),
        fetch(`/api/agents/${profileAddress}/feedback`).then((r) => r.json()),
      ]);
      setIdentityData(identityRes);
      setReputationData(reputationRes);
      setFeedbackData(feedbackRes.feedback ?? []);
    } catch {
      /* ignore — APIs may not be ready */
    }
  }, [profileAddress]);

  useEffect(() => {
    async function load() {
      if (!profileAddress) return;

      let foundUser = await getUserByAddress(profileAddress);
      if (!foundUser) {
        // Auto-register: create user in DB via API, then retry
        try {
          const res = await fetch(`/api/agents/${profileAddress}/identity`);
          if (res.ok) {
            // resolveUserId on the server side will auto-create the user
            foundUser = await getUserByAddress(profileAddress);
          }
        } catch { /* ignore */ }

        if (!foundUser) {
          setNotFound(true);
          return;
        }
      }
      setProfileUser(foundUser);

      const dashStats = await getDashboardStats(foundUser.id);
      setStats(dashStats);

      const allRequests = await getRequests();
      const userActive = allRequests.filter(
        (r) =>
          r.requesterId === foundUser.id &&
          (r.status === "open" || r.status === "in_progress"),
      );
      setActiveRequests(userActive);

      const userRequests = allRequests.filter(
        (r) => r.requesterId === foundUser.id,
      );
      const allProposals: ProposalWithUser[] = [];
      for (const req of userRequests.slice(0, 5)) {
        const props = await getProposalsByRequest(req.id);
        for (const p of props) {
          const proposer = await getUserById(p.userId);
          allProposals.push({ ...p, proposer, requestTitle: req.title });
        }
      }
      setRecentProposals(allProposals.slice(0, 8));
    }
    load();
    loadDirectDeals();
    loadIdentityAndReputation();
  }, [profileAddress, loadDirectDeals, loadIdentityAndReputation]);

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <CyberCard className="p-10 flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center relative z-1">
            <UserIcon className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="font-heading text-2xl font-bold relative z-1">
            User Not Found
          </h2>
          <p className="text-muted-foreground text-sm max-w-sm text-center relative z-1">
            No user registered with address{" "}
            <span className="text-accent font-mono text-xs">
              {profileAddress.slice(0, 6)}...{profileAddress.slice(-4)}
            </span>
          </p>
          <Link
            href="/dashboard"
            className="text-primary text-sm hover:underline relative z-1"
          >
            Back to Dashboard
          </Link>
        </CyberCard>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Profile Header */}
      <div className="flex items-center gap-4 mb-8">
        <Avatar className="w-14 h-14">
          <AvatarImage src={profileUser.avatarUrl} />
          <AvatarFallback className="bg-secondary text-lg">
            {profileUser.name?.charAt(0) ?? "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl font-bold">
              {profileUser.name}
            </h1>
            {isOwnDashboard && (
              <Badge
                variant="outline"
                className="bg-primary/20 text-primary border-primary/30 text-xs"
              >
                You
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm font-mono">
            {profileUser.address.slice(0, 6)}...{profileUser.address.slice(-4)}
          </p>
        </div>

        {/* Direct Deal Button — shown on other users' dashboards */}
        {!isOwnDashboard && currentUser?.address && (
          <DirectDealButton
            agentAddress={profileUser.address}
            agentName={profileUser.name}
            clientAddress={currentUser.address}
          />
        )}
      </div>

      {/* ERC-8004 Identity & Reputation Section */}
      <div className="grid lg:grid-cols-3 gap-4 mb-8">
        <AgentIdentityCard
          agentId={identityData?.agentId ?? null}
          registered={identityData?.registered ?? false}
        />
        <ValidationBadge validated={identityData?.registered ?? false} />
        {reputationData && (
          <ReputationScore
            onChain={reputationData.onChain}
            reputation={reputationData.reputation ?? profileUser.reputation}
            feedbackCount={reputationData.feedbackCount}
            completionRate={reputationData.completionRate ?? profileUser.completionRate}
            totalTasks={reputationData.totalTasks ?? profileUser.totalTasks}
            summaryValue={reputationData.summaryValue}
          />
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard
          label="Total Requests"
          value={stats.totalRequests}
          icon={<ClipboardList className="w-5 h-5" />}
        />
        <StatCard
          label="Active"
          value={stats.activeRequests}
          icon={<Flame className="w-5 h-5" />}
        />
        <StatCard
          label="Proposals Received"
          value={stats.totalProposals}
          icon={<Mail className="w-5 h-5" />}
        />
        <StatCard
          label="Total Spent"
          value={`${formatForge(stats.totalSpent)} FORGE`}
          icon={<Coins className="w-5 h-5" />}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active Requests */}
        <CyberCard dots className="p-6">
          <h2 className="font-heading text-lg font-semibold mb-4 relative z-1">
            Active Requests
          </h2>
          <div className="relative z-1">
            {activeRequests.length > 0 ? (
              <div className="flex flex-col gap-3">
                {activeRequests.map((req) => (
                  <Link key={req.id} href={`/market/${req.id}`}>
                    <div
                      className="p-4 border border-cyan-500/10 bg-white/[0.02] flex items-center justify-between
                                    hover:border-cyan-500/25 hover:bg-white/[0.04] hover:shadow-[0_0_12px_rgba(6,182,212,0.06)] transition-[border-color,background-color,box-shadow] duration-300"
                    >
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
          <h2 className="font-heading text-lg font-semibold mb-4 relative z-1">
            Received Proposals
          </h2>
          <div className="relative z-1">
            {recentProposals.length > 0 ? (
              <div className="flex flex-col gap-3">
                {recentProposals.map((prop) => (
                  <div
                    key={prop.id}
                    className="p-4 border border-cyan-500/10 bg-white/2
                                    hover:border-cyan-500/25 hover:bg-white/[0.04] transition-[border-color,background-color,box-shadow] duration-300"
                  >
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

      {/* Direct Deals Section */}
      {(isOwnDashboard || directDeals.length > 0) && (
        <div className="mt-6">
          <CyberCard dots className="p-6">
            <h2 className="font-heading text-lg font-semibold mb-4 relative z-1 flex items-center gap-2">
              <Handshake className="w-5 h-5 text-accent" />
              Direct Deals
            </h2>
            <div className="relative z-1">
              {directDeals.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {directDeals.map((deal) => (
                    <DirectDealCard
                      key={deal.id}
                      deal={deal}
                      currentAddress={currentUser?.address ?? profileAddress}
                      onUpdate={loadDirectDeals}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No direct deals yet.
                </p>
              )}
            </div>
          </CyberCard>
        </div>
      )}

      {/* Feedback History */}
      {feedbackData.length > 0 && (
        <div className="mt-6">
          <FeedbackHistory feedback={feedbackData} />
        </div>
      )}
    </div>
  );
}
