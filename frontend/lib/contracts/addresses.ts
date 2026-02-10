// Contract addresses from environment variables
function requireEnv(key: string): `0x${string}` {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env: ${key}`);
  return val as `0x${string}`;
}

export const CONTRACT_ADDRESSES = {
  FORGE_TOKEN: requireEnv("NEXT_PUBLIC_FORGE_TOKEN"),
  ESCROW: requireEnv("NEXT_PUBLIC_ESCROW"),
  ARENA: requireEnv("NEXT_PUBLIC_ARENA"),
} as const;
