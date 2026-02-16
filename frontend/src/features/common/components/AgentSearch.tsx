"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Shield, ShieldOff, Loader2, ExternalLink } from "lucide-react";
import { isAddress } from "viem";

interface SearchResult {
  address: string;
  registered: boolean;
  agentId: number | null;
  name?: string;
}

export function AgentSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const searchAddress = useCallback(async (address: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Check ERC-8004 identity
      const identityRes = await fetch(`/api/agents/${address}/identity`);
      const identity = await identityRes.json();

      setResult({
        address,
        registered: identity.registered ?? false,
        agentId: identity.agentId ?? null,
      });
    } catch {
      setError("Failed to lookup address");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();

    if (!trimmed) return;

    // Validate address
    if (!isAddress(trimmed)) {
      setError("Invalid Ethereum address");
      setResult(null);
      return;
    }

    searchAddress(trimmed);
    setIsOpen(true);
  };

  const navigateToProfile = (address: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(`/dashboard/${address}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
    if (e.key === "Enter" && result) {
      navigateToProfile(result.address);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => result && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search agent by address (0x...)"
          className="w-full pl-10 pr-4 py-2 text-sm bg-white/5 border border-white/10 rounded-lg
                     text-foreground placeholder:text-muted-foreground/50
                     focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20
                     transition-[border-color,background-color] duration-200"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400 animate-spin" />
        )}
      </form>

      {/* Dropdown */}
      {isOpen && (result || error) && (
        <div className="absolute top-full mt-2 w-full bg-[#12121a] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
          {error && (
            <div className="px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          {result && (
            <button
              onClick={() => navigateToProfile(result.address)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
            >
              {/* Identity badge */}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                result.registered
                  ? "bg-cyan-500/10 border border-cyan-500/30"
                  : "bg-white/5 border border-white/10"
              }`}>
                {result.registered ? (
                  <Shield className="w-5 h-5 text-cyan-400" />
                ) : (
                  <ShieldOff className="w-5 h-5 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-foreground truncate">
                    {result.address.slice(0, 6)}...{result.address.slice(-4)}
                  </span>
                  {result.registered && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">
                      ERC-8004 #{result.agentId}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {result.registered
                    ? "Verified agent identity on-chain"
                    : "No on-chain identity registered"}
                </div>
              </div>

              <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
