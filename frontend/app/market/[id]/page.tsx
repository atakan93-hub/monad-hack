"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { useUser } from "@/lib/hooks/useUser";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatForge } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CyberCard } from "@/components/ui/CyberCard";
import { ProposalForm } from "@/components/features/market/ProposalForm";
import {
  getRequestById,
  getProposalsByRequest,
  getUserById,
} from "@/lib/supabase-api";
import { useCreateDeal } from "@/lib/hooks/useEscrow";
import { CONTRACT_ADDRESSES } from "@/lib/contracts/addresses";
import { EscrowAbi } from "@/lib/contracts/EscrowAbi";
import { decodeEventLog } from "viem";
import type { TaskRequest, Proposal, User } from "@/lib/types";

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

interface ProposalWithUser extends Proposal {
  proposer?: User | null;
}

export default function RequestDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { isConnected } = useAccount();
  const { address, user } = useUser();
  const createDeal = useCreateDeal();
  const pendingAccept = useRef<{ requestId: string; userId: string; amount: number } | null>(null);
  const [request, setRequest] = useState<TaskRequest | null>(null);
  const [proposals, setProposals] = useState<ProposalWithUser[]>([]);

  useEffect(() => {
    async function load() {
      const req = await getRequestById(id);
      setRequest(req);

      if (req) {
        const props = await getProposalsByRequest(id);
        const withUsers = await Promise.all(
          props.map(async (p) => ({
            ...p,
            proposer: await getUserById(p.userId),
          }))
        );
        setProposals(withUsers);
      }
    }
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [id]);

  const handleSubmitProposal = async (data: {
    requestId: string;
    userId: string;
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
    const withUsers = await Promise.all(
      props.map(async (p) => ({
        ...p,
        proposer: await getUserById(p.userId),
      }))
    );
    setProposals(withUsers);
  };

  const handleAccept = async (proposalId: string) => {
    const prop = proposals.find((p) => p.id === proposalId);
    if (isOnChain && isConnected && prop?.proposer) {
      pendingAccept.current = { requestId: id, userId: prop.userId, amount: prop.price };
      const agentAddr = prop.proposer.address as `0x${string}`;
      const amount = BigInt(prop.price) * BigInt(10 ** 18);
      const deadline = BigInt(Math.floor(Date.now() / 1000) + prop.estimatedDays * 86400);
      createDeal.write(agentAddr, amount, deadline);
    } else {
      await fetch("/api/market/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateStatus", proposalId, status: "accepted" }),
      });
      if (prop) {
        await fetch("/api/escrow/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "createEscrow", address, requestId: id, userId: prop.userId, amount: prop.price }),
        });
      }
      const props = await getProposalsByRequest(id);
      const withUsers = await Promise.all(
        props.map(async (p) => ({ ...p, proposer: await getUserById(p.userId) }))
      );
      setProposals(withUsers);
    }
  };

  // Sync escrow to DB after on-chain deal creation
  useEffect(() => {
    if (!createDeal.isSuccess || !createDeal.receipt || !pendingAccept.current || !address) return;
    const { requestId, userId, amount } = pendingAccept.current;
    pendingAccept.current = null;

    let onChainDealId: string | undefined;
    for (const log of createDeal.receipt.logs) {
      try {
        const decoded = decodeEventLog({ abi: EscrowAbi, data: log.data, topics: log.topics });
        if (decoded.eventName === "DealCreated") {
          onChainDealId = String((decoded.args as { dealId: bigint }).dealId);
          break;
        }
      } catch { /* not our event */ }
    }

    (async () => {
      const prop = proposals.find((p) => p.userId === userId);
      if (prop) {
        await fetch("/api/market/proposals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "updateStatus", proposalId: prop.id, status: "accepted" }),
        });
      }
      await fetch("/api/escrow/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createEscrow", address, requestId, userId, amount, onChainDealId }),
      });
      const props = await getProposalsByRequest(id);
      const withUsers = await Promise.all(
        props.map(async (p) => ({ ...p, proposer: await getUserById(p.userId) }))
      );
      setProposals(withUsers);
    })();
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
        &larr; Back to Market
      </Link>

      {/* Header */}
      <CyberCard dots={false} className="mt-6 p-6">
        <div className="relative z-[1] flex flex-col gap-3">
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
                {formatForge(request.budget)} FORGE
              </span>
            </span>
            <span>Deadline: {daysLeft > 0 ? `${daysLeft} days left` : "Ended"}</span>
          </div>
          <div className="pt-4 border-t border-cyan-500/10">
            <p className="text-muted-foreground leading-relaxed">
              {request.description}
            </p>
          </div>
        </div>
      </CyberCard>

      {/* Proposals */}
      <div className="mt-10">
        <h2 className="font-heading text-xl font-semibold mb-4">
          Proposals ({proposals.length})
        </h2>
        <div className="flex flex-col gap-4">
          {proposals.map((prop) => (
            <div key={prop.id} className="p-4 border border-cyan-500/10 bg-white/[0.02]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Link href={`/agent/${prop.userId}`}>
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={prop.proposer?.avatarUrl} />
                        <AvatarFallback className="bg-secondary text-xs">
                          {prop.proposer?.name?.charAt(0) ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div>
                      <Link
                        href={`/agent/${prop.userId}`}
                        className="font-medium text-sm hover:text-primary transition-colors"
                      >
                        {prop.proposer?.name ?? prop.userId}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {prop.estimatedDays} days &middot;{" "}
                        <span className="text-primary font-medium">
                          {formatForge(prop.price)} FORGE
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
      {request.status === "open" && user && (
        <div className="mt-10">
          <ProposalForm
            requestId={request.id}
            userId={user.id}
            maxBudget={request.budget}
            onSubmit={handleSubmitProposal}
          />
        </div>
      )}
    </div>
  );
}
