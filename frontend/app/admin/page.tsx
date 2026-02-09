"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, decodeEventLog } from "viem";
import { formatForge } from "@/lib/utils";
import { useAdminCheck } from "@/lib/hooks/useAdminCheck";
import { useCreateRound, useAdvanceRound, useSelectWinner } from "@/lib/hooks/useArena";
import {
  getRounds,
  getEntriesByRound,
  getUserById,
} from "@/lib/supabase-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CyberCard } from "@/components/ui/CyberCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CONTRACT_ADDRESSES } from "@/lib/contracts/addresses";
import { ArenaAbi } from "@/lib/contracts/ArenaAbi";
import { Erc20Abi } from "@/lib/contracts/Erc20Abi";
import {
  Shield,
  Plus,
  ChevronRight,
  Trophy,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import type { Round, ArenaEntry, User } from "@/lib/types";

// Constants
const STATUS_LABELS: Record<string, string> = {
  proposing: "Proposing",
  voting: "Voting",
  active: "Active",
  judging: "Judging",
  completed: "Completed",
};

const STATUS_NEXT: Record<string, string> = {
  proposing: "Voting",
  voting: "Active",
  active: "Judging",
};

const statusColors: Record<string, string> = {
  proposing: "bg-accent/20 text-accent border-accent/30",
  voting: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  active: "bg-primary/20 text-primary border-primary/30",
  judging: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
};

export default function AdminPage() {
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const { address } = useAccount();

  const [prizeAmount, setPrizeAmount] = useState("");
  const [rounds, setRounds] = useState<Round[]>([]);
  const [isLoadingRounds, setIsLoadingRounds] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Winner selector state
  const [winnerRound, setWinnerRound] = useState<Round | null>(null);
  const [entries, setEntries] = useState<(ArenaEntry & { user?: User })[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);

  // Contract hooks
  const createRound = useCreateRound();
  const advanceRound = useAdvanceRound();
  const selectWinner = useSelectWinner();

  // Approve FORGE token
  const {
    writeContract: approveWrite,
    data: approveHash,
    isPending: isApproving,
    error: approveError,
  } = useWriteContract();
  const { isLoading: isApproveConfirming, isSuccess: approveSuccess } =
    useWaitForTransactionReceipt({ hash: approveHash });

  // Read current allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACT_ADDRESSES.FORGE_TOKEN,
    abi: Erc20Abi,
    functionName: "allowance",
    args: address ? [address, CONTRACT_ADDRESSES.ARENA] : undefined,
  });

  // Read on-chain roundCount
  const { refetch: refetchRoundCount } = useReadContract({
    address: CONTRACT_ADDRESSES.ARENA,
    abi: ArenaAbi,
    functionName: "roundCount",
  });

  // Load rounds
  const loadRounds = useCallback(async () => {
    setIsLoadingRounds(true);
    const data = await getRounds();
    setRounds(data);
    setIsLoadingRounds(false);
  }, []);

  useEffect(() => {
    loadRounds();
  }, [loadRounds]);

  // Create round
  const prizeWei = prizeAmount ? parseUnits(prizeAmount, 18) : 0n;
  const needsApproval = allowance !== undefined && prizeWei > 0n && (allowance as bigint) < prizeWei;

  function handleApprove() {
    approveWrite({
      address: CONTRACT_ADDRESSES.FORGE_TOKEN,
      abi: Erc20Abi,
      functionName: "approve",
      args: [CONTRACT_ADDRESSES.ARENA, prizeWei],
    });
  }

  useEffect(() => {
    if (approveSuccess) refetchAllowance();
  }, [approveSuccess, refetchAllowance]);

  async function handleCreateRound() {
    if (!prizeAmount || prizeWei === 0n) return;
    setSyncError(null);
    setIsSyncing(true);
    try {
      const receipt = await createRound.writeAsync(prizeWei);

      let onChainRoundId: number | undefined;
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({ abi: ArenaAbi, data: log.data, topics: log.topics });
          if (decoded.eventName === "RoundCreated") {
            onChainRoundId = Number((decoded.args as { roundId: bigint }).roundId);
            break;
          }
        } catch { /* not our event */ }
      }

      if (onChainRoundId == null) throw new Error("RoundCreated event not found in tx logs");

      const syncRes = await fetch("/api/arena/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createRound", onChainRoundId }),
      });
      if (!syncRes.ok) {
        const err = await syncRes.json().catch(() => ({}));
        throw new Error(err.error ?? `Sync failed (${syncRes.status})`);
      }

      setPrizeAmount("");
      refetchRoundCount();
      await loadRounds();
    } catch (err) {
      setSyncError(err instanceof Error ? err.message.slice(0, 120) : "Transaction failed");
    } finally {
      setIsSyncing(false);
    }
  }

  // Advance round
  async function handleAdvance(round: Round) {
    if (round.onChainRoundId == null) return;
    const statusNextMap: Record<string, string> = {
      proposing: "voting",
      voting: "active",
      active: "judging",
    };
    const nextStatus = statusNextMap[round.status];
    if (!nextStatus) return;

    setSyncError(null);
    setIsSyncing(true);
    try {
      await advanceRound.writeAsync(BigInt(round.onChainRoundId));

      const syncRes = await fetch("/api/arena/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "advanceRound",
          roundId: round.id,
          newStatus: nextStatus,
        }),
      });
      if (!syncRes.ok) {
        const err = await syncRes.json().catch(() => ({}));
        throw new Error(err.error ?? `Sync failed (${syncRes.status})`);
      }
      await loadRounds();
    } catch (err) {
      setSyncError(err instanceof Error ? err.message.slice(0, 120) : "Transaction failed");
    } finally {
      setIsSyncing(false);
    }
  }

  // Select winner
  async function openWinnerSelector(round: Round) {
    setWinnerRound(round);
    setIsLoadingEntries(true);
    try {
      const entryList = await getEntriesByRound(round.id);

      const enriched = await Promise.all(
        entryList.map(async (entry) => {
          const u = await getUserById(entry.userId);
          return { ...entry, user: u ?? undefined };
        })
      );

      setEntries(enriched);
    } catch (err) {
      setSyncError(err instanceof Error ? err.message.slice(0, 120) : "Failed to load entries");
    } finally {
      setIsLoadingEntries(false);
    }
  }

  async function handleSelectWinner(entry: ArenaEntry & { user?: User }) {
    if (!winnerRound || !entry.user || winnerRound.onChainRoundId == null) return;

    setSyncError(null);
    setIsSyncing(true);
    try {
      await selectWinner.writeAsync(
        BigInt(winnerRound.onChainRoundId),
        entry.user.address as `0x${string}`
      );

      const syncRes = await fetch("/api/arena/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "selectWinner",
          roundId: winnerRound.id,
          winnerId: entry.userId,
        }),
      });
      if (!syncRes.ok) {
        const err = await syncRes.json().catch(() => ({}));
        throw new Error(err.error ?? `Sync failed (${syncRes.status})`);
      }

      setWinnerRound(null);
      setEntries([]);
      await loadRounds();
    } catch (err) {
      setSyncError(err instanceof Error ? err.message.slice(0, 120) : "Transaction failed");
    } finally {
      setIsSyncing(false);
    }
  }


  // Access control
  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <CyberCard dots className="p-8 max-w-md text-center">
          <div className="relative z-[1] flex flex-col items-center gap-4">
            <AlertTriangle className="size-12 text-destructive" />
            <h1 className="text-2xl font-heading font-bold">Access Denied</h1>
            <p className="text-muted-foreground">
              Only the Arena admin can access this page.
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              Connected: {address?.slice(0, 6)}...{address?.slice(-4) ?? "N/A"}
            </p>
          </div>
        </CyberCard>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 pt-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Shield className="size-8 text-primary" />
          <div>
            <h1 className="font-heading text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground text-sm">
              Arena round management
            </p>
          </div>
        </div>
        <Badge variant="outline" className="font-mono text-xs">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </Badge>
      </div>

      {/* Create Round */}
      <CyberCard dots className="p-6 mb-8">
        <div className="relative z-[1]">
          <h2 className="font-heading text-xl font-semibold mb-4 flex items-center gap-2">
            <Plus className="size-5 text-primary" />
            Create Round
          </h2>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm text-muted-foreground mb-1.5">
                Prize Amount (FORGE)
              </label>
              <Input
                type="number"
                placeholder="10000"
                value={prizeAmount}
                onChange={(e) => setPrizeAmount(e.target.value)}
              />
            </div>

            {needsApproval ? (
              <Button
                onClick={handleApprove}
                disabled={isApproving || isApproveConfirming || !prizeAmount}
                className="shrink-0"
              >
                {isApproving || isApproveConfirming ? (
                  <><Loader2 className="size-4 animate-spin" /> Approving...</>
                ) : (
                  "Approve FORGE"
                )}
              </Button>
            ) : (
              <Button
                onClick={handleCreateRound}
                disabled={!prizeAmount || prizeWei === 0n || isSyncing}
                className="shrink-0"
              >
                {isSyncing ? (
                  <><Loader2 className="size-4 animate-spin" /> Creating...</>
                ) : (
                  "Create Round"
                )}
              </Button>
            )}
          </div>

          {(syncError || approveError) && (
            <p className="text-sm text-destructive mt-3">
              {syncError || approveError?.message?.slice(0, 120)}
            </p>
          )}
        </div>
      </CyberCard>

      {/* Manage Rounds */}
      <CyberCard dots className="p-6">
        <div className="relative z-[1]">
          <h2 className="font-heading text-xl font-semibold mb-4">
            Manage Rounds
          </h2>

          {isLoadingRounds ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : rounds.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No rounds yet. Create the first one above.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {rounds.map((round) => (
                <div
                  key={round.id}
                  className="border border-cyan-500/10 bg-white/[0.02] p-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-heading font-semibold">
                        Round #{round.roundNumber}
                      </span>
                      <Badge
                        variant="outline"
                        className={statusColors[round.status] ?? ""}
                      >
                        {STATUS_LABELS[round.status] ?? round.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Prize: {formatForge(round.prize)} FORGE
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {STATUS_NEXT[round.status] && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAdvance(round)}
                        disabled={isSyncing}
                      >
                        {isSyncing ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <>
                            <ChevronRight className="size-4" />
                            {STATUS_NEXT[round.status]}
                          </>
                        )}
                      </Button>
                    )}

                    {round.status === "judging" && !round.winnerId && (
                      <Button
                        size="sm"
                        onClick={() => openWinnerSelector(round)}
                        disabled={isSyncing}
                      >
                        <Trophy className="size-4" />
                        Select Winner
                      </Button>
                    )}

                    {round.winnerId && (
                      <span className="text-xs text-green-400 font-mono">
                        Winner selected
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {syncError && (
            <p className="text-sm text-destructive mt-3">
              {syncError}
            </p>
          )}
        </div>
      </CyberCard>

      {/* Winner Selector Dialog */}
      <Dialog
        open={!!winnerRound}
        onOpenChange={(open) => {
          if (!open) {
            setWinnerRound(null);
            setEntries([]);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">
              Select Winner — Round #{winnerRound?.roundNumber}
            </DialogTitle>
          </DialogHeader>

          {isLoadingEntries ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : entries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No entries submitted for this round.
            </p>
          ) : (
            <div className="flex flex-col gap-3 mt-2">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="border border-cyan-500/10 bg-white/[0.02] p-4 flex items-start justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">
                      {entry.user?.name ?? "Unknown User"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {entry.description}
                    </p>
                    {entry.repoUrl && (
                      <a
                        href={entry.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline mt-1 inline-block"
                      >
                        {entry.repoUrl}
                      </a>
                    )}
                    {entry.user?.address && (
                      <p className="text-xs text-muted-foreground font-mono mt-1">
                        Address: {entry.user.address.slice(0, 6)}...{entry.user.address.slice(-4)}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleSelectWinner(entry)}
                    disabled={isSyncing || !entry.user}
                  >
                    {isSyncing ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <>
                        <Trophy className="size-4" />
                        Select
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
