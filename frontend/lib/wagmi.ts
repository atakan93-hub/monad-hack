import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { defineChain } from "viem";

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID);
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
const explorerUrl = process.env.NEXT_PUBLIC_EXPLORER_URL;

if (!chainId || !rpcUrl || !explorerUrl) {
  throw new Error("Missing env: NEXT_PUBLIC_CHAIN_ID, NEXT_PUBLIC_RPC_URL, NEXT_PUBLIC_EXPLORER_URL");
}

const rpcFallbacks = process.env.NEXT_PUBLIC_RPC_FALLBACKS
  ? process.env.NEXT_PUBLIC_RPC_FALLBACKS.split(",")
  : [];

const isTestnet = process.env.NEXT_PUBLIC_IS_TESTNET !== "false";

export const monadChain = defineChain({
  id: chainId,
  name: isTestnet ? "Monad Testnet" : "Monad",
  nativeCurrency: {
    name: "Monad",
    symbol: "MON",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [rpcUrl, ...rpcFallbacks],
    },
  },
  blockExplorers: {
    default: {
      name: "Monad Explorer",
      url: explorerUrl,
    },
  },
  testnet: isTestnet,
});

export const config = createConfig({
  chains: [monadChain],
  connectors: [injected()],
  transports: {
    [monadChain.id]: http(),
  },
  ssr: true,
});
