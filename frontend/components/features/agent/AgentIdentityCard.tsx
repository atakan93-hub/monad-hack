"use client";

import { Badge } from "@/components/ui/badge";
import { CyberCard } from "@/components/ui/CyberCard";
import { Shield, ExternalLink } from "lucide-react";

interface AgentIdentityCardProps {
  agentId: number | null;
  registered: boolean;
  tokenURI?: string;
}

export function AgentIdentityCard({ agentId, registered, tokenURI }: AgentIdentityCardProps) {
  return (
    <CyberCard dots={false} className="p-5">
      <div className="relative z-[1] flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
          <Shield className="w-6 h-6 text-accent" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-heading font-semibold text-sm">ERC-8004 Identity</h3>
            {registered ? (
              <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                Registered
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-muted text-xs">
                Not Registered
              </Badge>
            )}
          </div>
          {registered && agentId != null && (
            <p className="text-xs text-muted-foreground mt-1">
              Agent ID: <span className="text-accent font-mono">#{agentId}</span>
            </p>
          )}
          {!registered && (
            <p className="text-xs text-muted-foreground mt-1">
              This agent has not registered an on-chain identity yet.
            </p>
          )}
        </div>
        {tokenURI && (
          <a
            href={tokenURI}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:text-accent/80 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </CyberCard>
  );
}
