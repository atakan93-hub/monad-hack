"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { useUser } from "@/lib/hooks/useUser";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProposalForm } from "@/components/features/market/ProposalForm";
import {
  getRequestById,
  getProposalsByRequest,
  getAgentById,
  getAgentByOwner,
} from "@/lib/supabase-api";
import { useCreateDeal } from "@/lib/hooks/useEscrow";
import { CONTRACT_ADDRESSES } from "@/lib/contracts/addresses";
import type { TaskRequest, Proposal, Agent } from "@/lib/types";

const isOnChain = CONTRACT_ADDRESSES.ESCROW !== "0x0000000000000000000000000000000000000000";

const statusColors: Record<string, string> = {
  open: "bg-primary/20 text-primary border-primary/30",
  in_progress: "bg-accent/20 text-accent border-accent/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-muted text-muted-foreground border-border",
  disputed: "bg-red-500/20 text-red-400 border-red-500/30",
};

const categoryLabels: Record<string, string> = {
  "smart-contract": "Smart Contract",
  frontend: "Frontend",
  "data-analysis": "Data Analysis",
  audit: "Audit",
  other: "Other",
};

interface ProposalWithAgent extends Proposal {
  agent?: Agent | null;
}

export default function RequestDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { isConnected } = useAccount();
  const { address, user } = useUser();
  const createDeal = useCreateDeal();
  const pendingAccept = useRef<{ requestId: string; agentId: string; amount: number } | null>(null);
  const [request, setRequest] = useState<TaskRequest | null>(null);
  const [proposals, setProposals] = useState<ProposalWithAgent[]>([]);
  const [myAgent, setMyAgent] = useState<Agent | null>(null);

  useEffect(() => {
    if (!user?.id) { setMyAgent(null); return; }
    getAgentByOwner(user.id).then(setMyAgent);
  }, [user?.id]);

  useEffect(() => {
    async function load() {
      const req = await getRequestById(id);
      setRequest(req);

      if (req) {
        const props = await getProposalsByRequest(id);
        const withAgents = await Promise.all(
          props.map(async (p) => ({
            ...p,
            agent: await getAgentById(p.agentId),
          }))
        );
        setProposals(withAgents);
      }
    }
    load();
  }, [id]);

  const handleSubmitProposal = async (data: {
    requestId: string;
    agentId: string;
    price: number;
    estimatedDays: number;
    message: string;
  }) => {
    await fetch("/api/market/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "submit", ...data }),
    });
    const props = await getProposalsByRequest(id);
    const withAgents = await Promise.all(
      props.map(async (p) => ({
        ...p,
        agent: await getAgentById(p.agentId),
      }))
    );
    setProposals(withAgents);
  };

  const handleAccept = async (proposalId: string) => {
    // Find proposal to get agent address & price for on-chain deal
    const prop = proposals.find((p) => p.id === proposalId);
    if (isOnChain && isConnected && prop?.agent) {
      pendingAccept.current = { requestId: id, agentId: prop.agentId, amount: prop.price };
      const agentAddr = prop.agent.owner as `0x${string}`;
      const amount = BigInt(prop.price) * BigInt(10 ** 18);
      const deadline = BigInt(Math.floor(Date.now() / 1000) + prop.estimatedDays * 86400);
      createDeal.write(agentAddr, amount, deadline);
    }
    await fetch("/api/market/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "updateStatus", proposalId, status: "accepted" }),
    });
    const props = await getProposalsByRequest(id);
    const withAgents = await Promise.all(
      props.map(async (p) => ({
        ...p,
        agent: await getAgentById(p.agentId),
      }))
    );
    setProposals(withAgents);
  };

  // Sync escrow to DB after on-chain deal creation
  useEffect(() => {
    if (!createDeal.isSuccess || !pendingAccept.current || !address) return;
    const { requestId, agentId, amount } = pendingAccept.current;
    pendingAccept.current = null;
    fetch("/api/escrow/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "createEscrow", address, requestId, agentId, amount }),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createDeal.isSuccess]);

  if (!request) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const daysLeft = Math.max(
    0,
    Math.ceil(
      (new Date(request.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Back */}
      <Link
        href="/market"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Back to Market
      </Link>

      {/* Header */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary">
            {categoryLabels[request.category]}
          </Badge>
          <Badge variant="outline" className={statusColors[request.status]}>
            {request.status.replace("_", " ")}
          </Badge>
        </div>
        <h1 className="font-heading text-3xl font-bold">{request.title}</h1>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <span>
            Budget:{" "}
            <span className="text-primary font-semibold">
              {request.budget.toLocaleString()} FORGE
            </span>
          </span>
          <span>Deadline: {daysLeft > 0 ? `${daysLeft} days left` : "Ended"}</span>
        </div>
      </div>

      {/* Description */}
      <div className="mt-8 border-t border-border pt-6">
        <p className="text-muted-foreground leading-relaxed">
          {request.description}
        </p>
      </div>

      {/* Proposals */}
      <div className="mt-10 border-t border-border pt-6">
        <h2 className="font-heading text-xl font-semibold mb-4">
          Proposals ({proposals.length})
        </h2>
        <div className="space-y-4">
          {proposals.map((prop) => (
            <div key={prop.id} className="glass rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Link href={`/agent/${prop.agentId}`}>
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={prop.agent?.avatarUrl} />
                        <AvatarFallback className="bg-secondary text-xs">
                          {prop.agent?.name?.charAt(0) ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div>
                      <Link
                        href={`/agent/${prop.agentId}`}
                        className="font-medium text-sm hover:text-primary transition-colors"
                      >
                        {prop.agent?.name ?? prop.agentId}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {prop.estimatedDays} days •{" "}
                        <span className="text-primary font-medium">
                          {prop.price.toLocaleString()} FORGE
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {prop.status === "pending" && request.status === "open" && (
                      <Button
                        size="sm"
                        onClick={() => handleAccept(prop.id)}
                        disabled={createDeal.isPending || createDeal.isConfirming}
                      >
                        {createDeal.isPending ? "Sign tx..." : createDeal.isConfirming ? "Confirming..." : "Accept"}
                      </Button>
                    )}
                    {prop.status === "accepted" && (
                      <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                        Accepted
                      </Badge>
                    )}
                    {prop.status === "rejected" && (
                      <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
                        Rejected
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  {prop.message}
                </p>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Proposal Form */}
      {request.status === "open" && (
        <div className="mt-10 border-t border-border pt-6">
          {myAgent ? (
            <ProposalForm
              requestId={request.id}
              agentId={myAgent.id}
              maxBudget={request.budget}
              onSubmit={handleSubmitProposal}
            />
          ) : (
            <div className="glass rounded-xl p-6 text-center text-muted-foreground">
              <p>Register an agent first to submit proposals.</p>
              <Link href="/agent/register" className="text-primary hover:underline text-sm mt-1 inline-block">
                Register Agent →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
