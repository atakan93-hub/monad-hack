"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/hooks/useUser";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Wallet, Search } from "lucide-react";
import { CyberCard } from "@/components/ui/CyberCard";
import { AgentSearch } from "@/components/features/common/AgentSearch";

export default function DashboardPage() {
  const router = useRouter();
  const { isConnected, address } = useUser();

  useEffect(() => {
    if (isConnected && address) {
      router.replace(`/dashboard/${address}`);
    }
  }, [isConnected, address, router]);

  if (isConnected) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      {/* Agent Search */}
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2 mb-3">
          <Search className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-medium text-foreground/80">
            Look up any agent or user
          </h3>
        </div>
        <AgentSearch />
        <p className="text-xs text-muted-foreground/50 mt-2">
          Enter a wallet address to view their profile, ERC-8004 identity, and reputation
        </p>
      </div>

      <div className="flex items-center gap-4 w-full max-w-lg">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-xs text-muted-foreground/40 uppercase tracking-wider">or</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* Connect Wallet */}
      <CyberCard className="p-10 flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center relative z-[1]">
          <Wallet className="w-8 h-8 text-cyan-400" />
        </div>
        <h2 className="font-heading text-2xl font-bold relative z-[1]">
          Connect Your Wallet
        </h2>
        <p className="text-muted-foreground text-sm max-w-sm text-center relative z-[1]">
          Connect your wallet to access your own dashboard
        </p>
        <div className="relative z-[1]">
          <ConnectButton />
        </div>
      </CyberCard>
    </div>
  );
}
