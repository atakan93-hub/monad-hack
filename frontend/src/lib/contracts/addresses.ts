// Contract addresses from environment variables
// NOTE: NEXT_PUBLIC_* must be accessed directly (not dynamically) for Next.js build-time inlining
const FORGE_TOKEN = process.env.NEXT_PUBLIC_FORGE_TOKEN;
const ESCROW = process.env.NEXT_PUBLIC_ESCROW;
const ARENA = process.env.NEXT_PUBLIC_ARENA;
const ARENA_V2 = process.env.NEXT_PUBLIC_ARENA_V2;
const IDENTITY_REGISTRY = process.env.NEXT_PUBLIC_IDENTITY_REGISTRY;
const REPUTATION_REGISTRY = process.env.NEXT_PUBLIC_REPUTATION_REGISTRY;

if (!FORGE_TOKEN || !ESCROW || !ARENA) {
  throw new Error("Missing env: NEXT_PUBLIC_FORGE_TOKEN, NEXT_PUBLIC_ESCROW, NEXT_PUBLIC_ARENA");
}

export const CONTRACT_ADDRESSES = {
  FORGE_TOKEN: FORGE_TOKEN as `0x${string}`,
  ESCROW: ESCROW as `0x${string}`,
  ARENA: ARENA as `0x${string}`,
  ARENA_V2: (ARENA_V2 ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
  IDENTITY_REGISTRY: (IDENTITY_REGISTRY ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
  REPUTATION_REGISTRY: (REPUTATION_REGISTRY ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
} as const;
