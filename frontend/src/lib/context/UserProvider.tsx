"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
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
  description: string;
  reputation: number;
  completion_rate: number;
  total_tasks: number;
  skills: string[];
  hourly_rate: number;
  created_at: string;
}

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    address: row.address,
    name: row.name,
    role: row.role as User["role"],
    avatarUrl: row.avatar_url ?? undefined,
    description: row.description ?? "",
    reputation: row.reputation ?? 0,
    completionRate: row.completion_rate ?? 0,
    totalTasks: row.total_tasks ?? 0,
    sbtBadges: [],
    skills: row.skills ?? [],
    hourlyRate: Number(row.hourly_rate ?? 0),
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

interface UserContextValue {
  address: string | undefined;
  isConnected: boolean;
  user: User | null;
  isLoading: boolean;
}

const UserContext = createContext<UserContextValue>({
  address: undefined,
  isConnected: false,
  user: null,
  isLoading: false,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);

  // Provider is mounted once at root — ref persists across page navigations
  const siwePromptedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isConnected || !address) {
      setUser(null);
      setIsSignedIn(false);
      siwePromptedRef.current = null;
      return;
    }

    if (siwePromptedRef.current === address) return;
    siwePromptedRef.current = address;

    const addr = address as string;

    (async () => {
      setIsLoading(true);

      // SIWE: must sign or get disconnected
      try {
        const nonce = generateNonce();
        const message = createSiweMessage(addr, chainId, nonce);
        await signMessageAsync({ message });
      } catch {
        disconnect();
        setIsLoading(false);
        siwePromptedRef.current = null;
        return;
      }

      // Signature passed — upsert user in Supabase
      const { data: existing } = await supabase
        .from("users")
        .select("*")
        .eq("address", addr)
        .maybeSingle();

      if (existing) {
        setUser(rowToUser(existing as UserRow));
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
          setUser(rowToUser(created as UserRow));
        }
      }

      setIsSignedIn(true);
      setIsLoading(false);
    })();
  }, [address, isConnected, chainId, signMessageAsync, disconnect]);

  return (
    <UserContext.Provider value={{ address, isConnected: isConnected && isSignedIn, user, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
