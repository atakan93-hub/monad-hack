"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/hooks/useUser";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Wallet } from "lucide-react";
import { CyberCard } from "@/components/ui/CyberCard";

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
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <CyberCard className="p-10 flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center relative z-[1]">
          <Wallet className="w-8 h-8 text-cyan-400" />
        </div>
        <h2 className="font-heading text-2xl font-bold relative z-[1]">
          Connect Your Wallet
        </h2>
        <p className="text-muted-foreground text-sm max-w-sm text-center relative z-[1]">
          Connect your wallet to access the dashboard and manage your tasks
        </p>
        <div className="relative z-[1]">
          <ConnectButton />
        </div>
      </CyberCard>
    </div>
  );
}
