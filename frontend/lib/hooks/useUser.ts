"use client";

import { useEffect, useState, useRef } from "react";
import { useAccount, useSignMessage, useChainId, useDisconnect } from "wagmi";
import { createClient } from "@supabase/supabase-js";
import type { User } from "@/lib/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface UserRow {
  id: string;
  address: string;
  name: string;
  role: string;
  avatar_url: string | null;
  verified_at: string | null;
  created_at: string;
}

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    address: row.address,
    name: row.name,
    role: row.role as User["role"],
    avatarUrl: row.avatar_url ?? undefined,
    verifiedAt: row.verified_at ?? undefined,
    createdAt: row.created_at,
  };
}

function createSiweMessage(address: string, chainId: number, nonce: string) {
  const domain = typeof window !== "undefined" ? window.location.host : "localhost";
  const uri = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const issuedAt = new Date().toISOString();

  return `${domain} wants you to sign in with your Ethereum account:
${address}

Sign in to TaskForge to verify wallet ownership.

URI: ${uri}
Version: 1
Chain ID: ${chainId}
Nonce: ${nonce}
Issued At: ${issuedAt}`;
}

function generateNonce() {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

export function useUser() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);

  // Track which address we already prompted SIWE for (avoid double-prompt)
  const siwePromptedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isConnected || !address) {
      setUser(null);
      setIsSignedIn(false);
      siwePromptedRef.current = null;
      return;
    }

    // Already prompted for this address — skip
    if (siwePromptedRef.current === address) return;
    siwePromptedRef.current = address;

    const addr = address as string;

    (async () => {
      setIsLoading(true);

      // 1) SIWE signature — must sign or get disconnected
      try {
        const nonce = generateNonce();
        const message = createSiweMessage(addr, chainId, nonce);
        await signMessageAsync({ message });
      } catch {
        // User rejected → disconnect
        disconnect();
        setIsLoading(false);
        siwePromptedRef.current = null;
        return;
      }

      // 2) Signature passed — upsert user in Supabase
      const now = new Date().toISOString();

      const { data: existing } = await supabase
        .from("users")
        .select("*")
        .eq("address", addr)
        .maybeSingle();

      if (existing) {
        // Update verified_at (ignore error if column doesn't exist yet)
        await supabase
          .from("users")
          .update({ verified_at: now })
          .eq("address", addr);

        const u = rowToUser(existing as UserRow);
        setUser({ ...u, verifiedAt: now });
      } else {
        const { data: created, error } = await supabase
          .from("users")
          .insert({
            address: addr,
            name: `User ${addr.slice(0, 6)}`,
            role: "requester",
          })
          .select()
          .single();

        if (error) {
          console.error("User insert error:", error);
        } else if (created) {
          const u = rowToUser(created as UserRow);
          setUser({ ...u, verifiedAt: now });
        }
      }

      setIsSignedIn(true);
      setIsLoading(false);
    })();
  }, [address, isConnected, chainId, signMessageAsync, disconnect]);

  return { address, isConnected: isConnected && isSignedIn, user, isLoading };
}
