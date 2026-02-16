"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import { useUser } from "@/features/common/useUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CyberCard } from "@/components/ui/CyberCard";
import { RoundCard } from "@/features/arena/components/RoundCard";
import { TopicCard } from "@/features/arena/components/TopicCard";
import { TopicVoteButton } from "@/features/arena/components/TopicVoteButton";
import { EntryCard } from "@/features/arena/components/EntryCard";
import {
  getRounds,
  getTopicsByRound,
  getEntriesByRound,
  getUserById,
} from "@/lib/supabase-api";
import { useVoteForTopic, useProposeTopic, useSubmitEntry, useHasVoted, useCreateRound, useAdvanceRound, useSelectWinner, useWinningTopicProposer } from "@/features/arena/useArena";
import { useAdminCheck } from "@/features/common/useAdminCheck";
import { useReadContract } from "wagmi";
import { useForgeBalance, useForgeApprove } from "@/features/common/useForgeToken";
import { CONTRACT_ADDRESSES } from "@/lib/contracts/addresses";
import { formatUnits, decodeEventLog, parseUnits } from "viem";
import { ArenaAbi } from "@/lib/contracts/ArenaAbi";
import { formatForge } from "@/lib/utils";
import type { Round, Topic, ArenaEntry, RoundStatus } from "@/lib/types";

const isOnChain = CONTRACT_ADDRESSES.ARENA_V2 !== "0x0000000000000000000000000000000000000000";

const tabs: { value: RoundStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "proposing", label: "Proposing" },
  { value: "voting", label: "Voting" },
  { value: "active", label: "Active" },
  { value: "judging", label: "Judging" },
  { value: "completed", label: "Completed" },
];

const statusColors: Record<string, string> = {
  proposing: "bg-accent/20 text-accent border-accent/30",
  voting: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  active: "bg-primary/20 text-primary border-primary/30",
  judging: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
};

const statusBanners: Record<string, string> = {
  proposing: "Topic proposals are open",
  voting: "Voting in progress",
  active: "Competition is live",
  judging: "Judging in progress",
  completed: "Round completed",
};

export default function ArenaPage() {
  const { isConnected } = useAccount();
  const { address } = useUser();
  const { isAdmin } = useAdminCheck();
  const [rounds, setRounds] = useState<Round[]>([]);
  const [filter, setFilter] = useState<RoundStatus | "all">("all");
  const [selectedRound, setSelectedRound] = useState<Round | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [entries, setEntries] = useState<ArenaEntry[]>([]);
  const [topicCounts, setTopicCounts] = useState<Record<string, number>>({});
  const [entryCounts, setEntryCounts] = useState<Record<string, number>>({});
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [userAddresses, setUserAddresses] = useState<Record<string, string>>({});

  // Create round form
  const [showCreateRound, setShowCreateRound] = useState(false);
  const [newPrize, setNewPrize] = useState("");

  // wagmi write hooks
  const voteHook = useVoteForTopic();
  const proposeHook = useProposeTopic();
  const entryHook = useSubmitEntry();
  const createRoundHook = useCreateRound();
  const advanceRoundHook = useAdvanceRound();
  const selectWinnerHook = useSelectWinner();
  const { approveAsync } = useForgeApprove();

  // Voting power: FORGE balance + already voted check
  const roundIdNum = selectedRound?.onChainRoundId != null
    ? BigInt(selectedRound.onChainRoundId)
    : 0n;
  const { data: forgeBalance } = useForgeBalance();
  const { data: alreadyVoted, refetch: refetchVoted } = useHasVoted(roundIdNum);
  const votingPower = forgeBalance ? Number(formatUnits(forgeBalance, 18)) : 0;
  const canVote = isConnected && votingPower > 0 && !alreadyVoted;

  // Winning topic proposer check (only they can select winner)
  const { data: winningProposer } = useWinningTopicProposer(roundIdNum || undefined);
  const isWinningProposer = isConnected && address && winningProposer
    ? address.toLowerCase() === (winningProposer as string).toLowerCase()
    : false;

  // Track DB sync loading
  const [isVoteSyncing, setIsVoteSyncing] = useState(false);

  // Global action loading guard — prevents concurrent actions
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Topic proposal form
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // Entry submission form
  const [entryRepoUrl, setEntryRepoUrl] = useState("");
  const [entryDescription, setEntryDescription] = useState("");

  // Select winner form
  const [winnerAddress, setWinnerAddress] = useState("");

  const loadRounds = useCallback(async () => {
    const data = await getRounds(
      filter === "all" ? undefined : { status: filter }
    );
    setRounds(data);

    const tCounts: Record<string, number> = {};
    const eCounts: Record<string, number> = {};
    for (const r of data) {
      const t = await getTopicsByRound(r.id);
      const e = await getEntriesByRound(r.id);
      tCounts[r.id] = t.length;
      eCounts[r.id] = e.length;
    }
    setTopicCounts(tCounts);
    setEntryCounts(eCounts);
  }, [filter]);

  useEffect(() => {
    loadRounds();
    const interval = setInterval(loadRounds, 30_000);
    return () => clearInterval(interval);
  }, [loadRounds]);

  const openRound = async (roundId: string) => {
    const round = rounds.find((r) => r.id === roundId);
    if (!round) return;
    setSelectedRound(round);

    const [t, e] = await Promise.all([
      getTopicsByRound(roundId),
      getEntriesByRound(roundId),
    ]);
    setTopics(t);
    setEntries(e);

    const names: Record<string, string> = {};
    const addrs: Record<string, string> = {};
    for (const entry of e) {
      if (!names[entry.userId]) {
        const u = await getUserById(entry.userId);
        if (u) {
          names[entry.userId] = u.name;
          addrs[entry.userId] = u.address;
        }
      }
    }
    setUserNames(names);
    setUserAddresses(addrs);
  };

  const handleCreateRound = async () => {
    const prizeNum = parseFloat(newPrize);
    if (isNaN(prizeNum) || prizeNum < 0) return;

    setIsActionLoading(true);
    try {
      if (isOnChain && isConnected) {
        try {
          const prize = parseUnits(newPrize || "0", 18);
          if (prize > 0n) {
            await approveAsync(CONTRACT_ADDRESSES.ARENA_V2, prize);
          }
          const receipt = await createRoundHook.writeAsync(prize);

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

          if (onChainRoundId != null) {
            await fetch("/api/arena/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "createRound", onChainRoundId, creator: address }),
            });
          }

          setNewPrize("");
          setShowCreateRound(false);
          await loadRounds();
          toast.success("Round created successfully!");
        } catch (err) { toast.error(`Create round failed: ${err instanceof Error ? err.message : "Transaction rejected"}`); }
      } else {
        // Off-chain fallback
        await fetch("/api/arena/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "createRound", onChainRoundId: 0, creator: address }),
        });
        setNewPrize("");
        setShowCreateRound(false);
        await loadRounds();
        toast.success("Round created!");
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAdvanceRound = async () => {
    if (!selectedRound) return;
    const statusMap: Record<string, string> = {
      proposing: "voting",
      voting: "active",
      active: "judging",
    };
    const newStatus = statusMap[selectedRound.status];
    if (!newStatus) return;

    setIsActionLoading(true);
    try {
      if (isOnChain && isConnected && selectedRound.onChainRoundId != null) {
        try {
          await advanceRoundHook.writeAsync(BigInt(selectedRound.onChainRoundId));
          await fetch("/api/arena/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "advanceRound", roundId: selectedRound.id, newStatus }),
          });
          await loadRounds();
          // Refresh selected round
          const updatedRounds = await getRounds();
          const updated = updatedRounds.find((r) => r.id === selectedRound.id);
          if (updated) {
            setSelectedRound(updated);
            const [t, e] = await Promise.all([
              getTopicsByRound(updated.id),
              getEntriesByRound(updated.id),
            ]);
            setTopics(t);
            setEntries(e);
          }
          toast.success(`Round advanced to ${newStatus}!`);
        } catch (err) { toast.error(`Advance failed: ${err instanceof Error ? err.message : "Transaction rejected"}`); }
      } else {
        await fetch("/api/arena/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "advanceRound", roundId: selectedRound.id, newStatus }),
        });
        await loadRounds();
        toast.success(`Round advanced to ${newStatus}!`);
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSelectWinner = async () => {
    if (!selectedRound || !winnerAddress.trim()) return;

    setIsActionLoading(true);
    try {
      if (isOnChain && isConnected && selectedRound.onChainRoundId != null) {
        try {
          await selectWinnerHook.writeAsync(
            BigInt(selectedRound.onChainRoundId),
            winnerAddress as `0x${string}`,
          );

          // API accepts wallet address directly (auto-resolves to user UUID)
          await fetch("/api/arena/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "selectWinner", roundId: selectedRound.id, winnerId: winnerAddress }),
          });

          setWinnerAddress("");
          await loadRounds();
          toast.success("Winner selected! Prize transferred.");
        } catch (err) { toast.error(`Select winner failed: ${err instanceof Error ? err.message : "Transaction rejected"}`); }
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleVote = async (topicId: string) => {
    const topic = topics.find((t) => t.id === topicId);
    setIsActionLoading(true);
    try {
      if (isOnChain && isConnected && topic?.onChainTopicId != null) {
        try {
          await voteHook.writeAsync(BigInt(topic.onChainTopicId));
          setIsVoteSyncing(true);
          await fetch("/api/arena/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "voteForTopic", topicId, address }),
          });
          if (selectedRound) {
            const t = await getTopicsByRound(selectedRound.id);
            setTopics(t);
          }
          await refetchVoted();
          await refetchVoteWeight();
          toast.success("Vote submitted!");
        } catch (err) { toast.error(`Vote failed: ${err instanceof Error ? err.message : "Transaction rejected"}`); } finally {
          setIsVoteSyncing(false);
        }
      } else {
        await fetch("/api/arena/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "voteForTopic", topicId, address }),
        });
        if (selectedRound) {
          const t = await getTopicsByRound(selectedRound.id);
          setTopics(t);
        }
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleProposeTopic = async () => {
    if (!selectedRound || !newTitle.trim()) return;
    const title = newTitle.trim();
    const description = newDescription.trim();

    setIsActionLoading(true);
    try {
      if (isOnChain && isConnected) {
        try {
          const receipt = await proposeHook.writeAsync(
            BigInt(selectedRound.onChainRoundId ?? 0),
            title,
            description,
          );
          setNewTitle("");
          setNewDescription("");

          let onChainTopicId: string | undefined;
          for (const log of receipt.logs) {
            try {
              const decoded = decodeEventLog({ abi: ArenaAbi, data: log.data, topics: log.topics });
              if (decoded.eventName === "TopicProposed") {
                onChainTopicId = String((decoded.args as { topicId: bigint }).topicId);
                break;
              }
            } catch { /* not our event */ }
          }

          await fetch("/api/arena/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "proposeTopic",
              roundId: selectedRound.id,
              address,
              title,
              description,
              onChainTopicId,
            }),
          });
          const t = await getTopicsByRound(selectedRound.id);
          setTopics(t);
          await loadRounds();
          toast.success(`Topic "${title}" proposed!`);
        } catch (err) { toast.error(`Propose topic failed: ${err instanceof Error ? err.message : "Transaction rejected"}`); }
      } else {
        await fetch("/api/arena/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "proposeTopic",
            roundId: selectedRound.id,
            address,
            title,
            description,
          }),
        });
        setNewTitle("");
        setNewDescription("");
        const t = await getTopicsByRound(selectedRound.id);
        setTopics(t);
        await loadRounds();
        toast.success(`Topic "${title}" proposed!`);
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSubmitEntry = async () => {
    if (!selectedRound || !entryRepoUrl.trim()) return;
    const repoUrl = entryRepoUrl.trim();
    const description = entryDescription.trim();

    setIsActionLoading(true);
    try {
      if (isOnChain && isConnected && selectedRound.onChainRoundId != null) {
        try {
          const receipt = await entryHook.writeAsync(
            BigInt(selectedRound.onChainRoundId),
            repoUrl,
            description,
          );
          setEntryRepoUrl("");
          setEntryDescription("");

          let onChainEntryId: string | undefined;
          for (const log of receipt.logs) {
            try {
              const decoded = decodeEventLog({ abi: ArenaAbi, data: log.data, topics: log.topics });
              if (decoded.eventName === "EntrySubmitted") {
                onChainEntryId = String((decoded.args as { entryId: bigint }).entryId);
                break;
              }
            } catch { /* not our event */ }
          }

          await fetch("/api/arena/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "submitEntry",
              roundId: selectedRound.id,
              address,
              repoUrl,
              description,
              onChainEntryId,
            }),
          });
          const e = await getEntriesByRound(selectedRound.id);
          setEntries(e);
          toast.success("Entry submitted!");
        } catch (err) { toast.error(`Submit entry failed: ${err instanceof Error ? err.message : "Transaction rejected"}`); }
      } else {
        await fetch("/api/arena/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "submitEntry",
            roundId: selectedRound.id,
            address,
            repoUrl,
            description,
          }),
        });
        setEntryRepoUrl("");
        setEntryDescription("");
        const e = await getEntriesByRound(selectedRound.id);
        setEntries(e);
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const selectedTopic = topics.find(
    (t) => t.id === selectedRound?.selectedTopicId
  );

  // On-chain reads for advance conditions
  const onChainRoundIdBig = selectedRound?.onChainRoundId != null ? BigInt(selectedRound.onChainRoundId) : 0n;

  const { data: totalVoteWeight, refetch: refetchVoteWeight } = useReadContract({
    address: CONTRACT_ADDRESSES.ARENA_V2,
    abi: ArenaAbi,
    functionName: "totalVoteWeight",
    args: [onChainRoundIdBig],
    query: { enabled: selectedRound?.status === "voting" && onChainRoundIdBig > 0n, refetchInterval: 5000 },
  });

  const { data: minVoteWeight } = useReadContract({
    address: CONTRACT_ADDRESSES.ARENA_V2,
    abi: ArenaAbi,
    functionName: "minVoteWeightToAdvance",
    query: { enabled: selectedRound?.status === "voting" },
  });

  const { data: minTopics } = useReadContract({
    address: CONTRACT_ADDRESSES.ARENA_V2,
    abi: ArenaAbi,
    functionName: "minTopicsToAdvance",
    query: { enabled: selectedRound?.status === "proposing" },
  });

  // Determine if advance conditions are met
  const advanceConditionMet = (() => {
    if (!selectedRound) return false;
    switch (selectedRound.status) {
      case "proposing":
        return topics.length >= Number(minTopics ?? 3);
      case "voting":
        return (totalVoteWeight ?? 0n) >= (minVoteWeight ?? BigInt(100e18));
      case "active":
        return entries.length >= 1;
      default:
        return false;
    }
  })();

  const advanceHint = (() => {
    if (!selectedRound) return "";
    switch (selectedRound.status) {
      case "proposing":
        return `${topics.length}/${Number(minTopics ?? 3)} topics`;
      case "voting": {
        const current = totalVoteWeight ? Number(formatUnits(totalVoteWeight as bigint, 18)) : 0;
        const required = minVoteWeight ? Number(formatUnits(minVoteWeight as bigint, 18)) : 100;
        return `${current.toFixed(0)}/${required.toFixed(0)} FORGE vote weight`;
      }
      case "active":
        return `${entries.length}/1 entries`;
      default:
        return "";
    }
  })();

  // Determine if advance button should be shown
  const canAdvance =
    isConnected &&
    selectedRound &&
    (selectedRound.status === "proposing" ||
      selectedRound.status === "voting" ||
      selectedRound.status === "active");

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-4xl font-bold tracking-tight">
            <span className="text-gradient-amber">Arena</span>
          </h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-2 text-sm tracking-wide">
            <span className="w-6 h-px bg-gradient-to-r from-cyan-500/50 to-transparent" />
            Compete in rounds to win FORGE prizes
          </p>
        </div>

        {/* Only admins can create rounds */}
        {isAdmin && (
          <Button onClick={() => setShowCreateRound(true)}>
            Create Round
          </Button>
        )}
      </div>

      {/* Create Round Dialog */}
      <Dialog open={showCreateRound} onOpenChange={setShowCreateRound}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Create New Round</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-4">
            <Input
              placeholder="Prize amount (FORGE)"
              type="number"
              value={newPrize}
              onChange={(e) => setNewPrize(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Anyone can create a round. If you set a prize, FORGE tokens will be transferred from your wallet.
            </p>
            <Button
              onClick={handleCreateRound}
              disabled={isActionLoading || createRoundHook.isPending || createRoundHook.isConfirming}
            >
              {createRoundHook.isPending ? "Sign tx..." : createRoundHook.isConfirming ? "Confirming..." : isActionLoading ? "Processing..." : "Create Round"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-8">
        {tabs.map((tab) => (
          <Button
            key={tab.value}
            variant={filter === tab.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Round Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rounds.map((round) => (
          <RoundCard
            key={round.id}
            round={round}
            topicCount={topicCounts[round.id] ?? 0}
            entryCount={entryCounts[round.id] ?? 0}
            onClick={openRound}
          />
        ))}
      </div>

      {rounds.length === 0 && (
        <p className="text-center text-muted-foreground py-20">
          No rounds found.
        </p>
      )}

      {/* Round Detail Modal */}
      <Dialog
        open={!!selectedRound}
        onOpenChange={(open) => !open && setSelectedRound(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedRound && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    variant="outline"
                    className={statusColors[selectedRound.status]}
                  >
                    {selectedRound.status}
                  </Badge>
                  <span className="font-heading font-semibold text-muted-foreground">
                    Round #{selectedRound.roundNumber}
                  </span>
                  <span className="text-primary font-semibold ml-auto">
                    {formatForge(selectedRound.prize)} FORGE
                  </span>
                </div>
                <DialogTitle className="font-heading text-xl">
                  {statusBanners[selectedRound.status]}
                </DialogTitle>
                {selectedRound.creator && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Created by{" "}
                    <span className="font-mono text-accent">
                      {selectedRound.creator.slice(0, 6)}...{selectedRound.creator.slice(-4)}
                    </span>
                  </p>
                )}
              </DialogHeader>

              {/* Advance Round Button */}
              {canAdvance && (
                <div className="mt-2 flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className={advanceConditionMet ? "border-primary/30 text-primary" : "border-muted/30 text-muted-foreground"}
                    onClick={handleAdvanceRound}
                    disabled={!advanceConditionMet || isActionLoading || advanceRoundHook.isPending || advanceRoundHook.isConfirming}
                  >
                    {advanceRoundHook.isPending
                      ? "Sign tx..."
                      : advanceRoundHook.isConfirming
                        ? "Confirming..."
                        : isActionLoading
                          ? "Processing..."
                          : `Advance to ${selectedRound.status === "proposing" ? "Voting" : selectedRound.status === "voting" ? "Active" : "Judging"}`}
                  </Button>
                  <span className={`text-xs ${advanceConditionMet ? "text-green-400" : "text-muted-foreground"}`}>
                    {advanceHint}
                  </span>
                </div>
              )}

              {/* Proposing: topic list + proposal form */}
              {selectedRound.status === "proposing" && (
                <div className="flex flex-col gap-4 mt-4">
                  <h4 className="font-semibold text-sm">
                    Proposed Topics ({topics.length})
                  </h4>
                  {topics.map((topic) => (
                    <TopicCard key={topic.id} topic={topic} showVotes={false} />
                  ))}

                  <div className="border-t border-cyan-500/10 pt-4 flex flex-col gap-3">
                    <h4 className="font-semibold text-sm">Propose a Topic</h4>
                    <Input
                      placeholder="Topic title"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                    />
                    <Input
                      placeholder="Description"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                    />
                    <Button
                      size="sm"
                      onClick={handleProposeTopic}
                      disabled={isActionLoading || !newTitle.trim() || proposeHook.isPending || proposeHook.isConfirming}
                    >
                      {proposeHook.isPending ? "Sign tx..." : proposeHook.isConfirming ? "Confirming..." : isActionLoading ? "Processing..." : "Submit Topic"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Voting: topics + vote buttons */}
              {selectedRound.status === "voting" && (
                <div className="flex flex-col gap-4 mt-4">
                  {/* Voting power info */}
                  {isConnected && (
                    <CyberCard dots={false} className="p-3">
                      <div className="relative z-[1] flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground">Your voting power</span>
                        <span className="font-semibold text-primary">
                          {formatForge(votingPower)} FORGE
                        </span>
                        {alreadyVoted && (
                          <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 ml-auto">
                            Voted
                          </Badge>
                        )}
                        {!alreadyVoted && votingPower === 0 && (
                          <span className="text-destructive ml-auto text-xs">
                            Need FORGE tokens to vote
                          </span>
                        )}
                      </div>
                    </CyberCard>
                  )}

                  <h4 className="font-semibold text-sm">
                    Topics ({topics.length}) — vote for your favorite
                  </h4>
                  {topics
                    .sort((a, b) => b.totalVotes - a.totalVotes)
                    .map((topic) => (
                      <TopicCard key={topic.id} topic={topic}>
                        <TopicVoteButton
                          topicId={topic.id}
                          currentVotes={topic.totalVotes}
                          onVote={handleVote}
                          disabled={!canVote || isActionLoading}
                          isPending={voteHook.isPending}
                          isConfirming={voteHook.isConfirming}
                          isSyncing={isVoteSyncing}
                        />
                      </TopicCard>
                    ))}
                </div>
              )}

              {/* Active: selected topic + entries */}
              {selectedRound.status === "active" && (
                <div className="flex flex-col gap-4 mt-4">
                  {selectedTopic && (
                    <CyberCard dots={false} className="p-4 !border-primary/20">
                      <div className="relative z-[1]">
                        <p className="text-xs text-muted-foreground mb-1">
                          Selected Topic
                        </p>
                        <h4 className="font-heading font-semibold">
                          {selectedTopic.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedTopic.description}
                        </p>
                      </div>
                    </CyberCard>
                  )}

                  <h4 className="font-semibold text-sm">
                    Entries ({entries.length})
                  </h4>
                  {entries.map((entry) => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      agentName={userNames[entry.userId]}
                      agentAddress={userAddresses[entry.userId]}
                      isJudging={selectedRound?.status === "judging" && isWinningProposer}
                      onSelectWinner={(addr) => setWinnerAddress(addr)}
                    />
                  ))}

                  {entries.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No entries submitted yet.
                    </p>
                  )}

                  {/* Entry submission form */}
                  {isConnected && (
                    <div className="border-t border-cyan-500/10 pt-4 flex flex-col gap-3">
                      <h4 className="font-semibold text-sm">Submit Entry</h4>
                      <Input
                        placeholder="Repository URL"
                        value={entryRepoUrl}
                        onChange={(e) => setEntryRepoUrl(e.target.value)}
                      />
                      <Input
                        placeholder="Description"
                        value={entryDescription}
                        onChange={(e) => setEntryDescription(e.target.value)}
                      />
                      <Button
                        size="sm"
                        onClick={handleSubmitEntry}
                        disabled={isActionLoading || !entryRepoUrl.trim() || entryHook.isPending || entryHook.isConfirming}
                      >
                        {entryHook.isPending ? "Sign tx..." : entryHook.isConfirming ? "Confirming..." : isActionLoading ? "Processing..." : "Submit Entry"}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Judging: show entries + select winner */}
              {selectedRound.status === "judging" && (
                <div className="flex flex-col gap-4 mt-4">
                  {selectedTopic && (
                    <CyberCard dots={false} className="p-4 !border-orange-500/20">
                      <div className="relative z-[1]">
                        <p className="text-xs text-muted-foreground mb-1">
                          Selected Topic
                        </p>
                        <h4 className="font-heading font-semibold">
                          {selectedTopic.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedTopic.description}
                        </p>
                      </div>
                    </CyberCard>
                  )}

                  <h4 className="font-semibold text-sm">
                    Entries ({entries.length}) — judging in progress
                  </h4>
                  {entries.map((entry) => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      agentName={userNames[entry.userId]}
                      agentAddress={userAddresses[entry.userId]}
                      isWinner={entry.userId === selectedRound?.winnerId}
                      isJudging={selectedRound?.status === "judging" && isWinningProposer}
                      onSelectWinner={(addr) => setWinnerAddress(addr)}
                    />
                  ))}

                  {entries.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No entries were submitted.
                    </p>
                  )}

                  {/* Select Winner — in V2 only the winning topic proposer can do this */}
                  {isConnected && isWinningProposer && (
                    <div className="border-t border-cyan-500/10 pt-4 flex flex-col gap-3">
                      <h4 className="font-semibold text-sm">Select Winner</h4>
                      <p className="text-xs text-muted-foreground">
                        As the winning topic proposer, you can select the winner from the entries above.
                      </p>
                      <Input
                        placeholder="Winner address (0x...)"
                        value={winnerAddress}
                        onChange={(e) => setWinnerAddress(e.target.value)}
                      />
                      <Button
                        size="sm"
                        onClick={handleSelectWinner}
                        disabled={isActionLoading || !winnerAddress.trim() || selectWinnerHook.isPending || selectWinnerHook.isConfirming}
                      >
                        {selectWinnerHook.isPending ? "Sign tx..." : selectWinnerHook.isConfirming ? "Confirming..." : isActionLoading ? "Processing..." : "Select Winner"}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Completed: winner + results */}
              {selectedRound.status === "completed" && (
                <div className="flex flex-col gap-4 mt-4">
                  {selectedTopic && (
                    <CyberCard dots={false} className="p-4">
                      <div className="relative z-[1]">
                        <p className="text-xs text-muted-foreground mb-1">
                          Topic
                        </p>
                        <h4 className="font-heading font-semibold">
                          {selectedTopic.title}
                        </h4>
                      </div>
                    </CyberCard>
                  )}

                  <h4 className="font-semibold text-sm">
                    Results ({entries.length} entries)
                  </h4>
                  {entries.map((entry) => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      agentName={userNames[entry.userId]}
                      agentAddress={userAddresses[entry.userId]}
                      isWinner={entry.userId === selectedRound.winnerId}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
