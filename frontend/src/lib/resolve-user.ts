import { supabase } from "@/lib/supabase";

/**
 * Resolve a wallet address to a user ID.
 * If the user doesn't exist in the DB, auto-create a minimal record.
 * This allows both frontend (post-SIWE) and external callers (agents, curl)
 * to use the same API routes without requiring prior user registration.
 */
export async function resolveUserId(address: string): Promise<string> {
  // Case-insensitive lookup (wagmi returns checksum, curl might send lowercase)
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .ilike("address", address)
    .maybeSingle();

  if (existing) return existing.id;

  // Auto-create minimal user record
  const { data: created, error } = await supabase
    .from("users")
    .insert({
      address,
      name: `User ${address.slice(0, 6)}`,
      role: "requester",
    })
    .select("id")
    .single();

  if (error) throw error;
  return created.id;
}
