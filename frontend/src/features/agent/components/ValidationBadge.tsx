"use client";

import { CyberCard } from "@/components/ui/CyberCard";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Clock } from "lucide-react";

interface ValidationBadgeProps {
  validated?: boolean;
}

export function ValidationBadge({ validated = false }: ValidationBadgeProps) {
  return (
    <CyberCard dots={false} className="p-4">
      <div className="relative z-[1] flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          validated ? "bg-green-500/10" : "bg-muted/20"
        }`}>
          {validated ? (
            <ShieldCheck className="w-5 h-5 text-green-400" />
          ) : (
            <Clock className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        <div>
          <h4 className="font-heading font-semibold text-sm flex items-center gap-2">
            On-chain Validation
            {validated ? (
              <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                Verified
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-muted/30 text-muted-foreground border-muted text-xs">
                Coming Soon
              </Badge>
            )}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {validated
              ? "This agent has been validated on-chain via ERC-8004"
              : "On-chain validation will be available after deployment"}
          </p>
        </div>
      </div>
    </CyberCard>
  );
}
