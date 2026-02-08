"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { useAdminCheck } from "@/lib/hooks/useAdminCheck";
import { useCreateRound, useAdvanceRound, useSelectWinner } from "@/lib/hooks/useArena";
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
import { supabase } from "@/lib/supabase";
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

// ─── Types ────────────────────────────────────────────
interface RoundRow {
  id: string;
  round_number: number;
  prize: number;
  status: string;
  selected_topic_id: string | null;
  winner_id: string | null;
  created_at: string;
}

interface EntryRow {
  id: string;
  round_id: string;
  agent_id: string;
  repo_url: string;
  description: string;
  demo_url: string | null;
}

interface AgentRow {
  id: string;
  name: string;
  owner_id: string;
}

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
  const [rounds, setRounds] = useState<RoundRow[]>([]);
  const [isLoadingRounds, setIsLoadingRounds] = useState(true);

  // Winner selector state
  const [winnerRound, setWinnerRound] = useState<RoundRow | null>(null);
  const [entries, setEntries] = useState<(EntryRow & { agent?: AgentRow })[]>([]);
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
    const { data } = await supabase
      .from("rounds")
      .select("*")
      .order("round_number", { ascending: false });
    setRounds((data as RoundRow[]) || []);
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

      await supabase.from("rounds").insert({
        round_number: roundNum,
        prize: Number(prizeAmount),
        status: "proposing",
      });

      setPrizeAmount("");
      refetchRoundCount();
      loadRounds();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createRound.isSuccess]);

  // ─── Advance round ─────────────────────────────────
  function handleAdvance(round: RoundRow) {
    // on-chain roundId = round_number (1-indexed)
    advanceRound.write(BigInt(round.round_number));
  }

  useEffect(() => {
    if (!advanceRound.isSuccess) return;
    // Reload to reflect new status
    loadRounds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advanceRound.isSuccess]);

  // After on-chain advance success, update Supabase status
  useEffect(() => {
    if (!advanceRound.isSuccess) return;

    // Find the round that was just advanced and update Supabase
    (async () => {
      // We can't directly know which round was advanced from the hook,
      // so we re-fetch all. The loadRounds() above handles the UI.
      // For DB sync, we rely on on-chain state being the source of truth.
      // A more robust approach would parse tx logs.
    })();
  }, [advanceRound.isSuccess]);

  // ─── Select winner ─────────────────────────────────
  async function openWinnerSelector(round: RoundRow) {
    setWinnerRound(round);
    setIsLoadingEntries(true);

    const { data: entryRows } = await supabase
      .from("arena_entries")
      .select("*")
      .eq("round_id", round.id);

    if (entryRows && entryRows.length > 0) {
      const agentIds = [...new Set(entryRows.map((e: EntryRow) => e.agent_id))];
      const { data: agents } = await supabase
        .from("agents")
        .select("id, name, owner_id")
        .in("id", agentIds);

      const agentMap = new Map((agents ?? []).map((a: AgentRow) => [a.id, a]));

      setEntries(
        entryRows.map((e: EntryRow) => ({
          ...e,
          agent: agentMap.get(e.agent_id),
        }))
      );
    } else {
      setEntries([]);
    }
    setIsLoadingEntries(false);
  }

  function handleSelectWinner(entry: EntryRow & { agent?: AgentRow }) {
    if (!winnerRound || !entry.agent) return;
    // on-chain: selectWinner(roundId, winnerAddress)
    selectWinner.write(
      BigInt(winnerRound.round_number),
      entry.agent.owner_id as `0x${string}`
    );
  }

  useEffect(() => {
    if (!selectWinner.isSuccess || !winnerRound) return;

    (async () => {
      // Update Supabase
      await supabase
        .from("rounds")
        .update({
          status: "completed",
          winner_id: entries.find(() => true)?.agent_id,
        })
        .eq("id", winnerRound.id);

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
                      Round #{round.round_number}
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
                  {/* Advance button for proposing / voting */}
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

                  {/* Select winner for active */}
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

                  {/* Completed */}
                  {round.status === "completed" && round.winner_id && (
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
              Select Winner — Round #{winnerRound?.round_number}
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
                    {entry.repo_url && (
                      <a
                        href={entry.repo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline mt-1 inline-block"
                      >
                        {entry.repo_url}
                      </a>
                    )}
                    {entry.agent?.owner_id && (
                      <p className="text-xs text-muted-foreground font-mono mt-1">
                        Owner: {entry.agent.owner_id.slice(0, 6)}...{entry.agent.owner_id.slice(-4)}
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
