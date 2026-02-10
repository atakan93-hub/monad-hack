// Contract addresses from environment variables
// NOTE: NEXT_PUBLIC_* must be accessed directly (not dynamically) for Next.js build-time inlining
const FORGE_TOKEN = process.env.NEXT_PUBLIC_FORGE_TOKEN;
const ESCROW = process.env.NEXT_PUBLIC_ESCROW;
const ARENA = process.env.NEXT_PUBLIC_ARENA;

if (!FORGE_TOKEN || !ESCROW || !ARENA) {
  throw new Error("Missing env: NEXT_PUBLIC_FORGE_TOKEN, NEXT_PUBLIC_ESCROW, NEXT_PUBLIC_ARENA");
}

export const CONTRACT_ADDRESSES = {
  FORGE_TOKEN: FORGE_TOKEN as `0x${string}`,
  ESCROW: ESCROW as `0x${string}`,
  ARENA: ARENA as `0x${string}`,
} as const;
