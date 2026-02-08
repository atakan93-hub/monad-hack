"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useDisconnect } from "wagmi";
import { useUser } from "@/lib/hooks/useUser";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Copy,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function ProfileDropdown() {
  const { user, isConnected } = useUser();
  const { disconnect } = useDisconnect();
  const [copied, setCopied] = useState(false);

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openConnectModal,
        openChainModal,
        mounted,
      }) => {
        // Only show profile when SIWE is complete (isConnected from useUser)
        const connected = mounted && account && chain && isConnected;

        return (
          <div
            {...(!mounted && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none" as const,
                userSelect: "none" as const,
              },
            })}
          >
            {!connected ? (
              <button
                onClick={openConnectModal}
                className="px-4 py-2 rounded-lg text-sm font-medium
                           bg-primary text-primary-foreground
                           hover:bg-primary/90 transition-colors"
              >
                Connect Wallet
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {/* Chain button */}
                <button
                  onClick={openChainModal}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm
                             glass border border-white/[0.06] hover:border-white/10 transition-colors"
                >
                  {chain.hasIcon && chain.iconUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={chain.iconUrl}
                      alt={chain.name ?? "Chain"}
                      className="size-4 rounded-full"
                    />
                  )}
                </button>

                {/* Profile dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
                                 glass border border-white/[0.06] hover:border-primary/30
                                 transition-all duration-200 outline-none"
                    >
                      <div className="size-6 rounded-full bg-gradient-to-br from-primary/60 to-cyan-400/60 flex items-center justify-center text-[10px] font-bold text-white">
                        {account.address.slice(2, 4).toUpperCase()}
                      </div>
                      <span className="text-foreground/80">
                        {shortenAddress(account.address)}
                      </span>
                      <ShieldCheck className="size-3.5 text-green-400" />
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="end"
                    className="w-64 bg-[#1a1a2e]/95 backdrop-blur-xl border-white/[0.08] shadow-xl"
                  >
                    <DropdownMenuLabel className="flex items-center gap-2 py-2">
                      <div className="size-8 rounded-full bg-gradient-to-br from-primary/60 to-cyan-400/60 flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {account.address.slice(2, 4).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user?.name ?? shortenAddress(account.address)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user?.role ?? "requester"}
                        </p>
                      </div>
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator className="bg-white/[0.06]" />

                    {/* Address copy */}
                    <DropdownMenuItem
                      onClick={() => copyAddress(account.address)}
                      className="gap-2 cursor-pointer"
                    >
                      <Copy className="size-4 text-muted-foreground" />
                      <span className="font-mono text-xs">
                        {shortenAddress(account.address)}
                      </span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {copied ? "Copied!" : "Copy"}
                      </span>
                    </DropdownMenuItem>

                    {/* Verified badge */}
                    <DropdownMenuItem disabled className="gap-2">
                      <ShieldCheck className="size-4 text-green-400" />
                      <span className="text-green-400">Verified</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-white/[0.06]" />

                    {/* Dashboard */}
                    <DropdownMenuItem asChild className="gap-2 cursor-pointer">
                      <Link href="/dashboard">
                        <LayoutDashboard className="size-4 text-muted-foreground" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-white/[0.06]" />

                    {/* Disconnect */}
                    <DropdownMenuItem
                      onClick={() => disconnect()}
                      variant="destructive"
                      className="gap-2 cursor-pointer"
                    >
                      <LogOut className="size-4" />
                      <span>Disconnect</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
