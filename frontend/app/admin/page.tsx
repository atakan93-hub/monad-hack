"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { useAdminCheck } from "@/lib/hooks/useAdminCheck";
import { useCreateRound, useAdvanceRound, useSelectWinner } from "@/lib/hooks/useArena";
import {
  getRounds,
  createRoundRecord,
  updateRoundWinner,
  getEntriesByRound,
  getAgentById,
} from "@/lib/supabase-api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import type { Round, ArenaEntry, Agent } from "@/lib/types";

// ─── Constants ────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = {
  proposing: "Proposing",
  voting: "Voting",
  active: "Active",
  completed: "Completed",
};

const STATUS_NEXT: Record<string, string> = {
  proposing: "Voting",
  voting: "Active",
};

const statusColors: Record<string, string> = {
  proposing: "bg-accent/20 text-accent border-accent/30",
  voting: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  active: "bg-primary/20 text-primary border-primary/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
};

// ─── Main ─────────────────────────────────────────────
export default function AdminPage() {
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const { address } = useAccount();

  const [prizeAmount, setPrizeAmount] = useState("");
  const [rounds, setRounds] = useState<Round[]>([]);
  const [isLoadingRounds, setIsLoadingRounds] = useState(true);

  // Winner selector state
  const [winnerRound, setWinnerRound] = useState<Round | null>(null);
  const [entries, setEntries] = useState<(ArenaEntry & { agent?: Agent })[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);

  // ─── Contract hooks ─────────────────────────────────
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
  const { data: onChainRoundCount, refetch: refetchRoundCount } = useReadContract({
    address: CONTRACT_ADDRESSES.ARENA,
    abi: ArenaAbi,
    functionName: "roundCount",
  });

  // ─── Load rounds ───────────────────────────────────
  const loadRounds = useCallback(async () => {
    setIsLoadingRounds(true);
    const data = await getRounds();
    setRounds(data);
    setIsLoadingRounds(false);
  }, []);

  useEffect(() => {
    loadRounds();
  }, [loadRounds]);

  // ─── Create round ──────────────────────────────────
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

  // After approve success, refetch allowance
  useEffect(() => {
    if (approveSuccess) refetchAllowance();
  }, [approveSuccess, refetchAllowance]);

  function handleCreateRound() {
    if (!prizeAmount || prizeWei === 0n) return;
    createRound.write(prizeWei);
  }

  // After createRound success → sync to Supabase
  useEffect(() => {
    if (!createRound.isSuccess) return;

    (async () => {
      const count = onChainRoundCount as bigint | undefined;
      const roundNum = count ? Number(count) : rounds.length + 1;

      await createRoundRecord({
        roundNumber: roundNum,
        prize: Number(prizeAmount),
      });

      setPrizeAmount("");
      refetchRoundCount();
      loadRounds();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createRound.isSuccess]);

  // ─── Advance round ─────────────────────────────────
  function handleAdvance(round: Round) {
    advanceRound.write(BigInt(round.roundNumber));
  }

  useEffect(() => {
    if (!advanceRound.isSuccess) return;
    loadRounds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advanceRound.isSuccess]);

  // ─── Select winner ─────────────────────────────────
  async function openWinnerSelector(round: Round) {
    setWinnerRound(round);
    setIsLoadingEntries(true);

    const entryList = await getEntriesByRound(round.id);

    const enriched = await Promise.all(
      entryList.map(async (entry) => {
        const agent = await getAgentById(entry.agentId);
        return { ...entry, agent: agent ?? undefined };
      })
    );

    setEntries(enriched);
    setIsLoadingEntries(false);
  }

  function handleSelectWinner(entry: ArenaEntry & { agent?: Agent }) {
    if (!winnerRound || !entry.agent) return;
    selectWinner.write(
      BigInt(winnerRound.roundNumber),
      entry.agent.owner as `0x${string}`
    );
  }

  useEffect(() => {
    if (!selectWinner.isSuccess || !winnerRound) return;

    (async () => {
      const selectedEntry = entries[0];
      if (selectedEntry?.agentId) {
        await updateRoundWinner(winnerRound.id, selectedEntry.agentId);
      }

      setWinnerRound(null);
      setEntries([]);
      loadRounds();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectWinner.isSuccess]);

  // ─── Access control ────────────────────────────────
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
        <Card className="p-8 max-w-md text-center glass-strong">
          <AlertTriangle className="size-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-heading font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            Only the Arena admin can access this page.
          </p>
          <p className="text-xs text-muted-foreground mt-4 font-mono">
            Connected: {address?.slice(0, 6)}...{address?.slice(-4) ?? "N/A"}
          </p>
        </Card>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────
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

      {/* ── Create Round ──────────────────────────────── */}
      <Card className="p-6 mb-8 glass-strong border-white/[0.06]">
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
              disabled={!prizeAmount || prizeWei === 0n || createRound.isPending || createRound.isConfirming}
              className="shrink-0"
            >
              {createRound.isPending || createRound.isConfirming ? (
                <><Loader2 className="size-4 animate-spin" /> Creating...</>
              ) : (
                "Create Round"
              )}
            </Button>
          )}
        </div>

        {(createRound.error || approveError) && (
          <p className="text-sm text-destructive mt-3">
            {(createRound.error || approveError)?.message?.slice(0, 120)}
          </p>
        )}
        {createRound.isSuccess && (
          <p className="text-sm text-green-400 mt-3">
            Round created successfully!
          </p>
        )}
      </Card>

      {/* ── Manage Rounds ─────────────────────────────── */}
      <Card className="p-6 glass-strong border-white/[0.06]">
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
          <div className="space-y-4">
            {rounds.map((round) => (
              <div
                key={round.id}
                className="border border-white/[0.06] rounded-lg p-4 flex items-center justify-between gap-4"
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
                    Prize: {round.prize.toLocaleString()} FORGE
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {(round.status === "proposing" || round.status === "voting") && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAdvance(round)}
                      disabled={advanceRound.isPending || advanceRound.isConfirming}
                    >
                      {advanceRound.isPending || advanceRound.isConfirming ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <>
                          <ChevronRight className="size-4" />
                          {STATUS_NEXT[round.status]}
                        </>
                      )}
                    </Button>
                  )}

                  {round.status === "active" && (
                    <Button
                      size="sm"
                      onClick={() => openWinnerSelector(round)}
                      disabled={selectWinner.isPending || selectWinner.isConfirming}
                    >
                      <Trophy className="size-4" />
                      Select Winner
                    </Button>
                  )}

                  {round.status === "completed" && round.winnerId && (
                    <span className="text-xs text-green-400 font-mono">
                      Winner selected
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {(advanceRound.error || selectWinner.error) && (
          <p className="text-sm text-destructive mt-3">
            {(advanceRound.error || selectWinner.error)?.message?.slice(0, 120)}
          </p>
        )}
      </Card>

      {/* ── Winner Selector Dialog ────────────────────── */}
      <Dialog
        open={!!winnerRound}
        onOpenChange={(open) => {
          if (!open) {
            setWinnerRound(null);
            setEntries([]);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto glass-strong">
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
            <div className="space-y-3 mt-2">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="border border-white/[0.06] rounded-lg p-4 flex items-start justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">
                      {entry.agent?.name ?? "Unknown Agent"}
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
                    {entry.agent?.owner && (
                      <p className="text-xs text-muted-foreground font-mono mt-1">
                        Owner: {entry.agent.owner.slice(0, 6)}...{entry.agent.owner.slice(-4)}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleSelectWinner(entry)}
                    disabled={selectWinner.isPending || selectWinner.isConfirming || !entry.agent}
                  >
                    {selectWinner.isPending || selectWinner.isConfirming ? (
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
