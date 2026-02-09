"use client";

import { useState, useEffect } from "react";
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
  getEscrowByRequestId,
} from "@/lib/supabase-api";
import { useCreateDeal, useFundDeal, useCompleteDeal, useReleaseFunds, useDisputeDeal, useRefundDeal } from "@/lib/hooks/useEscrow";
import { useForgeApprove } from "@/lib/hooks/useForgeToken";
import { CONTRACT_ADDRESSES } from "@/lib/contracts/addresses";
import { EscrowAbi } from "@/lib/contracts/EscrowAbi";
import { decodeEventLog } from "viem";
import type { TaskRequest, Proposal, User, EscrowDeal } from "@/lib/types";

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
  const fundDeal = useFundDeal();
  const completeDeal = useCompleteDeal();
  const releaseFunds = useReleaseFunds();
  const disputeDeal = useDisputeDeal();
  const refundDeal = useRefundDeal();
  const forgeApprove = useForgeApprove();
  const [request, setRequest] = useState<TaskRequest | null>(null);
  const [proposals, setProposals] = useState<ProposalWithUser[]>([]);
  const [escrow, setEscrow] = useState<EscrowDeal | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const reloadEscrow = async () => {
    const esc = await getEscrowByRequestId(id);
    setEscrow(esc);
  };

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
        const esc = await getEscrowByRequestId(id);
        setEscrow(esc);
      }
    }
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [id]);

  const handleSubmitProposal = async (data: {
    requestId: string;
    address: string;
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

  const reloadProposals = async () => {
    const props = await getProposalsByRequest(id);
    const withUsers = await Promise.all(
      props.map(async (p) => ({ ...p, proposer: await getUserById(p.userId) }))
    );
    setProposals(withUsers);
  };

  const handleEscrowAction = async (action: "fund" | "complete" | "release" | "dispute" | "refund") => {
    if (!escrow) return;
    if (!isConnected) {
      setSyncError("Connect wallet first");
      return;
    }
    setSyncError(null);
    setIsSyncing(true);
    try {
      const dealId = BigInt(escrow.onChainDealId ?? 0);

      // On-chain tx (필수)
      {
        if (action === "fund") {
          const amount = BigInt(escrow.amount) * BigInt(10 ** 18);
          await forgeApprove.approveAsync(CONTRACT_ADDRESSES.ESCROW, amount);
          await fundDeal.writeAsync(dealId);
        } else if (action === "complete") {
          await completeDeal.writeAsync(dealId);
        } else if (action === "release") {
          await releaseFunds.writeAsync(dealId);
        } else if (action === "dispute") {
          await disputeDeal.writeAsync(dealId);
        } else if (action === "refund") {
          await refundDeal.writeAsync(dealId);
        }
      }

      const syncActions = { fund: "funded", complete: "completed", dispute: "disputed", refund: "refunded" } as const;
      if (action in syncActions) {
        const dbStatus = syncActions[action as keyof typeof syncActions];
        const syncRes = await fetch("/api/escrow/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "updateStatus", escrowId: escrow.id, status: dbStatus }),
        });
        if (!syncRes.ok) {
          const err = await syncRes.json().catch(() => ({}));
          throw new Error(err.error ?? `Sync failed (${syncRes.status})`);
        }
      }

      if (action === "release") {
        const reqRes = await fetch("/api/market/requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "updateStatus", requestId: id, status: "completed", address }),
        });
        if (!reqRes.ok) {
          const err = await reqRes.json().catch(() => ({}));
          throw new Error(err.error ?? `Request update failed (${reqRes.status})`);
        }
        const req = await getRequestById(id);
        setRequest(req);
      }

      if (action === "refund") {
        const reqRes = await fetch("/api/market/requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "updateStatus", requestId: id, status: "cancelled", address }),
        });
        if (!reqRes.ok) {
          const err = await reqRes.json().catch(() => ({}));
          throw new Error(err.error ?? `Request update failed (${reqRes.status})`);
        }
        const req = await getRequestById(id);
        setRequest(req);
      }

      await reloadEscrow();
    } catch (err) {
      setSyncError(err instanceof Error ? err.message.slice(0, 120) : "Transaction failed");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAccept = async (proposalId: string) => {
    setSyncError(null);
    setIsSyncing(true);
    try {
      const acceptRes = await fetch("/api/market/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateStatus", proposalId, status: "accepted", address }),
      });
      if (!acceptRes.ok) {
        const err = await acceptRes.json().catch(() => ({}));
        throw new Error(err.error ?? `Accept failed (${acceptRes.status})`);
      }

      const req = await getRequestById(id);
      setRequest(req);
      await reloadProposals();
    } catch (err) {
      setSyncError(err instanceof Error ? err.message.slice(0, 120) : "Accept failed");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreateEscrow = async () => {
    const acceptedProp = proposals.find((p) => p.status === "accepted");
    if (!acceptedProp || !acceptedProp.proposer) return;

    if (!isConnected) {
      setSyncError("Connect wallet to create escrow");
      return;
    }

    setSyncError(null);
    setIsSyncing(true);
    try {
      // 1. On-chain createDeal (필수)
      const agentAddr = acceptedProp.proposer.address as `0x${string}`;
      const amount = BigInt(acceptedProp.price) * BigInt(10 ** 18);
      const deadline = BigInt(Math.floor(Date.now() / 1000) + acceptedProp.estimatedDays * 86400);
      const receipt = await createDeal.writeAsync(agentAddr, amount, deadline);

      // 2. DealCreated 이벤트에서 dealId 추출
      let onChainDealId: string | undefined;
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({ abi: EscrowAbi, data: log.data, topics: log.topics });
          if (decoded.eventName === "DealCreated") {
            onChainDealId = String((decoded.args as { dealId: bigint }).dealId);
            break;
          }
        } catch { /* not our event */ }
      }
      if (!onChainDealId) throw new Error("DealCreated event not found");

      // 3. DB sync (API가 on-chain deal 검증 후 저장)
      const syncRes = await fetch("/api/escrow/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createEscrow",
          address,
          requestId: id,
          userId: acceptedProp.userId,
          amount: acceptedProp.price,
          onChainDealId,
        }),
      });
      if (!syncRes.ok) {
        const err = await syncRes.json().catch(() => ({}));
        throw new Error(err.error ?? `Escrow sync failed (${syncRes.status})`);
      }

      await reloadEscrow();
    } catch (err) {
      setSyncError(err instanceof Error ? err.message.slice(0, 120) : "Transaction failed");
    } finally {
      setIsSyncing(false);
    }
  };

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
            <div key={prop.id} className="p-4 border border-cyan-500/10 bg-white/[0.02]
                                    hover:border-cyan-500/25 hover:bg-white/[0.04] transition-all duration-300">
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
                    {prop.status === "pending" && request.status === "open" && user?.id === request.requesterId && (
                      <Button
                        size="sm"
                        onClick={() => handleAccept(prop.id)}
                        disabled={isSyncing}
                      >
                        {isSyncing ? "Processing..." : "Accept"}
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

        {syncError && (
          <p className="text-sm text-destructive mt-3">{syncError}</p>
        )}
      </div>

      {/* Create Escrow — in_progress but no escrow yet */}
      {request.status === "in_progress" && !escrow && user?.id === request.requesterId && (
        <CyberCard dots={false} className="mt-10 p-6">
          <div className="relative z-[1] flex flex-col gap-4">
            <h2 className="font-heading text-xl font-semibold">Create Escrow</h2>
            {(() => {
              const accepted = proposals.find((p) => p.status === "accepted");
              if (!accepted) return <p className="text-sm text-muted-foreground">No accepted proposal found.</p>;
              return (
                <>
                  <div className="flex gap-6 text-sm text-muted-foreground">
                    <span>Agent: <span className="text-foreground font-medium">{accepted.proposer?.name ?? accepted.userId}</span></span>
                    <span>Amount: <span className="text-primary font-semibold">{formatForge(accepted.price)} FORGE</span></span>
                    <span>{accepted.estimatedDays} days</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleCreateEscrow}
                    disabled={isSyncing}
                  >
                    {isSyncing ? "Processing..." : "Create Escrow"}
                  </Button>
                </>
              );
            })()}
          </div>
        </CyberCard>
      )}

      {/* Escrow Status */}
      {escrow && (
        <CyberCard dots={false} className="mt-10 p-6">
          <div className="relative z-[1] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-semibold">Escrow</h2>
              <Badge
                variant="outline"
                className={
                  escrow.status === "funded"
                    ? "bg-accent/20 text-accent border-accent/30"
                    : escrow.status === "completed"
                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                    : escrow.status === "disputed"
                    ? "bg-red-500/20 text-red-400 border-red-500/30"
                    : escrow.status === "refunded"
                    ? "bg-muted text-muted-foreground border-border"
                    : "bg-primary/20 text-primary border-primary/30"
                }
              >
                {escrow.status}
              </Badge>
            </div>

            <div className="flex gap-6 text-sm text-muted-foreground">
              <span>
                Amount:{" "}
                <span className="text-primary font-semibold">
                  {formatForge(escrow.amount)} FORGE
                </span>
              </span>
              {escrow.onChainDealId != null && (
                <span>Deal #{escrow.onChainDealId}</span>
              )}
            </div>

            <div className="flex gap-3">
              {escrow.status === "created" && user?.id === escrow.requesterId && (
                <>
                  <Button
                    size="sm"
                    onClick={() => handleEscrowAction("fund")}
                    disabled={isSyncing}
                  >
                    {isSyncing ? "Processing..." : "Fund Deal"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEscrowAction("refund")}
                    disabled={isSyncing}
                  >
                    Cancel
                  </Button>
                </>
              )}
              {escrow.status === "funded" && user?.id === escrow.requesterId && (
                <>
                  <Button
                    size="sm"
                    onClick={() => handleEscrowAction("complete")}
                    disabled={isSyncing}
                  >
                    {isSyncing ? "Processing..." : "Approve Work"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleEscrowAction("dispute")}
                    disabled={isSyncing}
                  >
                    {isSyncing ? "Processing..." : "Dispute"}
                  </Button>
                </>
              )}
              {escrow.status === "funded" && user?.id === escrow.userId && user?.id !== escrow.requesterId && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleEscrowAction("dispute")}
                  disabled={isSyncing}
                >
                  {isSyncing ? "Processing..." : "Dispute"}
                </Button>
              )}
              {escrow.status === "completed" && user?.id === escrow.requesterId && (
                <Button
                  size="sm"
                  onClick={() => handleEscrowAction("release")}
                  disabled={isSyncing}
                >
                  {isSyncing ? "Processing..." : "Release Funds"}
                </Button>
              )}
              {escrow.status === "disputed" && user?.id === escrow.requesterId && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleEscrowAction("refund")}
                  disabled={isSyncing}
                >
                  {isSyncing ? "Processing..." : "Refund"}
                </Button>
              )}
            </div>
          </div>
        </CyberCard>
      )}

      {/* Submit Proposal Form */}
      {request.status === "open" && user && (
        <div className="mt-10">
          <ProposalForm
            requestId={request.id}
            address={user.address}
            maxBudget={request.budget}
            onSubmit={handleSubmitProposal}
          />
        </div>
      )}
    </div>
  );
}
