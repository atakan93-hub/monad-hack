"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
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
  created_at: string;
}

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    address: row.address,
    name: row.name,
    role: row.role as User["role"],
    avatarUrl: row.avatar_url ?? undefined,
    createdAt: row.created_at,
  };
}

export function useUser() {
  const { address, isConnected } = useAccount();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isConnected || !address) {
      setUser(null);
      return;
    }

    setIsLoading(true);
    const addr = address as string;

    (async () => {
      // Try to fetch existing user
      const { data: existing } = await supabase
        .from("users")
        .select("*")
        .eq("address", addr)
        .maybeSingle();

      if (existing) {
        setUser(rowToUser(existing as UserRow));
        setIsLoading(false);
        return;
      }

      // Insert new user
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
      setIsLoading(false);
    })();
  }, [address, isConnected]);

  return { address, isConnected, user, isLoading };
}
