"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useUser } from "@/lib/hooks/useUser";
import { ShieldCheck } from "lucide-react";

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function CtaConnectButton() {
  const { address, isConnected } = useUser();

  if (isConnected && address) {
    return (
      <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg
                      glass border border-white/[0.06] text-sm font-medium">
        <div className="size-5 rounded-full bg-gradient-to-br from-primary/60 to-cyan-400/60 flex items-center justify-center text-[9px] font-bold text-white">
          {address.slice(2, 4).toUpperCase()}
        </div>
        <span className="text-foreground/80">
          Connected as {shortenAddress(address)}
        </span>
        <ShieldCheck className="size-4 text-green-400" />
      </div>
    );
  }

  return (
    <div className="animate-pulse-glow inline-block">
      <ConnectButton />
    </div>
  );
}
