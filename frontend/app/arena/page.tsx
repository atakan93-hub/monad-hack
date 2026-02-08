"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { RoundCard } from "@/components/features/arena/RoundCard";
import { TopicCard } from "@/components/features/arena/TopicCard";
import { TopicVoteButton } from "@/components/features/arena/TopicVoteButton";
import { EntryCard } from "@/components/features/arena/EntryCard";
import {
  getRounds,
  getTopicsByRound,
  getEntriesByRound,
  voteForTopic,
  proposeTopic,
  getAgentById,
} from "@/lib/supabase-api";
import { useVoteForTopic, useProposeTopic } from "@/lib/hooks/useArena";
import { CONTRACT_ADDRESSES } from "@/lib/contracts/addresses";
import type { Round, Topic, ArenaEntry, RoundStatus } from "@/lib/types";

const isOnChain = CONTRACT_ADDRESSES.ARENA !== "0x0000000000000000000000000000000000000000";

const tabs: { value: RoundStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "proposing", label: "Proposing" },
  { value: "voting", label: "Voting" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
];

const statusColors: Record<string, string> = {
  proposing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  voting: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  active: "bg-primary/20 text-primary border-primary/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
};

const statusBanners: Record<string, string> = {
  proposing: "Topic proposals are open",
  voting: "Voting in progress",
  active: "Competition is live",
  completed: "Round completed",
};

export default function ArenaPage() {
  const { isConnected } = useAccount();
  const [rounds, setRounds] = useState<Round[]>([]);
  const [filter, setFilter] = useState<RoundStatus | "all">("all");
  const [selectedRound, setSelectedRound] = useState<Round | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [entries, setEntries] = useState<ArenaEntry[]>([]);
  const [topicCounts, setTopicCounts] = useState<Record<string, number>>({});
  const [entryCounts, setEntryCounts] = useState<Record<string, number>>({});
  const [agentNames, setAgentNames] = useState<Record<string, string>>({});

  // wagmi write hooks
  const { write: voteOnChain } = useVoteForTopic();
  const { write: proposeOnChain, isPending: isProposing } = useProposeTopic();

  // Topic proposal form
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const loadRounds = useCallback(async () => {
    const data = await getRounds(
      filter === "all" ? undefined : { status: filter }
    );
    setRounds(data);

    // Load topic & entry counts for each round
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

    // Load agent names for entries
    const names: Record<string, string> = {};
    for (const entry of e) {
      if (!names[entry.agentId]) {
        const agent = await getAgentById(entry.agentId);
        if (agent) names[entry.agentId] = agent.name;
      }
    }
    setAgentNames(names);
  };

  const handleVote = async (topicId: string) => {
    if (isOnChain && isConnected) {
      voteOnChain(BigInt(topicId.replace("topic-", "")));
    }
    await voteForTopic(topicId, 100);
    if (selectedRound) {
      const t = await getTopicsByRound(selectedRound.id);
      setTopics(t);
    }
  };

  const handleProposeTopic = async () => {
    if (!selectedRound || !newTitle.trim()) return;
    if (isOnChain && isConnected) {
      proposeOnChain(
        BigInt(selectedRound.id.replace("round-", "")),
        newTitle.trim(),
        newDescription.trim(),
      );
    }
    await proposeTopic({
      roundId: selectedRound.id,
      proposerId: "user-1",
      title: newTitle.trim(),
      description: newDescription.trim(),
    });
    setNewTitle("");
    setNewDescription("");
    const t = await getTopicsByRound(selectedRound.id);
    setTopics(t);
    await loadRounds();
  };

  const selectedTopic = topics.find(
    (t) => t.id === selectedRound?.selectedTopicId
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold">Arena</h1>
          <p className="text-muted-foreground mt-1">
            Compete in rounds to win FORGE prizes
          </p>
        </div>
      </div>

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
                    {selectedRound.prize.toLocaleString()} FORGE
                  </span>
                </div>
                <DialogTitle className="font-heading text-xl">
                  {statusBanners[selectedRound.status]}
                </DialogTitle>
              </DialogHeader>

              {/* Proposing: topic list + proposal form */}
              {selectedRound.status === "proposing" && (
                <div className="space-y-4 mt-4">
                  <h4 className="font-semibold text-sm">
                    Proposed Topics ({topics.length})
                  </h4>
                  {topics.map((topic) => (
                    <TopicCard key={topic.id} topic={topic} showVotes={false} />
                  ))}

                  <div className="border-t border-border pt-4 space-y-3">
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
                      disabled={!newTitle.trim() || isProposing}
                    >
                      {isProposing ? "Submitting..." : "Submit Topic"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Voting: topics + vote buttons */}
              {selectedRound.status === "voting" && (
                <div className="space-y-4 mt-4">
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
                        />
                      </TopicCard>
                    ))}
                </div>
              )}

              {/* Active: selected topic + entries */}
              {selectedRound.status === "active" && (
                <div className="space-y-4 mt-4">
                  {selectedTopic && (
                    <div className="border border-primary/20 rounded-lg p-4 bg-primary/5">
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
                  )}

                  <h4 className="font-semibold text-sm">
                    Entries ({entries.length})
                  </h4>
                  {entries.map((entry) => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      agentName={agentNames[entry.agentId]}
                    />
                  ))}

                  {entries.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No entries submitted yet.
                    </p>
                  )}
                </div>
              )}

              {/* Completed: winner + results */}
              {selectedRound.status === "completed" && (
                <div className="space-y-4 mt-4">
                  {selectedTopic && (
                    <div className="border border-border rounded-lg p-4">
                      <p className="text-xs text-muted-foreground mb-1">
                        Topic
                      </p>
                      <h4 className="font-heading font-semibold">
                        {selectedTopic.title}
                      </h4>
                    </div>
                  )}

                  <h4 className="font-semibold text-sm">
                    Results ({entries.length} entries)
                  </h4>
                  {entries.map((entry) => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      agentName={agentNames[entry.agentId]}
                      isWinner={entry.agentId === selectedRound.winnerId}
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
