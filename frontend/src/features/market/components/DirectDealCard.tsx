"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CyberCard } from "@/components/ui/CyberCard";
import { formatForge } from "@/lib/utils";
import { Check, X, Loader2, Clock } from "lucide-react";
import type { DirectRequest } from "@/lib/types";

const statusColors: Record<string, string> = {
  pending: "bg-primary/20 text-primary border-primary/30",
  accepted: "bg-green-500/20 text-green-400 border-green-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
  escrow_created: "bg-accent/20 text-accent border-accent/30",
  funded: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  released: "bg-green-500/20 text-green-400 border-green-500/30",
  expired: "bg-red-500/20 text-red-400 border-red-500/30",
};

interface DirectDealCardProps {
  deal: DirectRequest;
  currentAddress: string;
  onUpdate?: () => void;
}

export function DirectDealCard({ deal, currentAddress, onUpdate }: DirectDealCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isAgent = deal.agentAddress.toLowerCase() === currentAddress.toLowerCase();
  const isClient = deal.clientAddress.toLowerCase() === currentAddress.toLowerCase();
  const canRespond = isAgent && deal.status === "pending";

  const handleAction = async (action: "accept" | "reject") => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/market/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          requestId: deal.id,
          address: currentAddress,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed");
      }
      onUpdate?.();
    } catch {
      /* failed */
    } finally {
      setIsLoading(false);
    }
  };

  const counterpartyAddress = isAgent ? deal.clientAddress : deal.agentAddress;
  const roleLabel = isAgent ? "From" : "To";

  return (
    <CyberCard dots={false} className="p-4 flex flex-col gap-3">
      <div className="relative z-[1] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={statusColors[deal.status]}>
            {deal.status.replace("_", " ")}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {roleLabel}:{" "}
            <span className="font-mono text-accent">
              {counterpartyAddress.slice(0, 6)}...{counterpartyAddress.slice(-4)}
            </span>
          </span>
        </div>
        <span className="text-primary font-semibold text-sm">
          {formatForge(deal.amount)} FORGE
        </span>
      </div>

      <div className="relative z-[1]">
        <p className="text-sm text-muted-foreground">{deal.description}</p>
        {deal.deadline && (
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Deadline: {new Date(deal.deadline).toLocaleDateString()}
          </p>
        )}
      </div>

      {canRespond && (
        <div className="relative z-[1] flex items-center gap-2 pt-2 border-t border-cyan-500/10">
          <Button
            size="sm"
            variant="outline"
            className="border-green-500/30 text-green-400 hover:bg-green-500/10"
            onClick={() => handleAction("accept")}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-1" />Accept</>}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            onClick={() => handleAction("reject")}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><X className="w-4 h-4 mr-1" />Reject</>}
          </Button>
        </div>
      )}

      {isClient && deal.status === "accepted" && (
        <div className="relative z-[1] pt-2 border-t border-cyan-500/10">
          <p className="text-xs text-green-400">
            Deal accepted! Create an escrow to proceed.
          </p>
        </div>
      )}
    </CyberCard>
  );
}
