# Phase 5: Wallet Connection

> Implement wallet connection with RainbowKit + wagmi v2 + viem

---

## Work Order

```
5.1 Install dependencies
5.2 wagmi config + chain setup (lib/wagmi.ts)
5.3 Providers component (app/providers.tsx)
5.4 Wrap Provider in layout.tsx
5.5 Integrate ConnectWallet in Navbar
5.6 Conditional UI (branching by connection state)
```

---

## 5.1 Install Dependencies

```bash
cd frontend
npm install @rainbow-me/rainbowkit wagmi viem@2.x @tanstack/react-query
```

### Package Roles
| Package | Role |
|---------|------|
| `wagmi` | React hooks for Ethereum (useAccount, useConnect, etc.) |
| `viem` | TypeScript Ethereum client (wagmi sub-dependency) |
| `@rainbow-me/rainbowkit` | Wallet connection UI modal |
| `@tanstack/react-query` | wagmi v2 required dependency |

---

## 5.2 wagmi config

**File:** `frontend/lib/wagmi.ts`

```tsx
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { defineChain } from "viem";

// Define Monad Testnet chain
export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: {
    name: "Monad",
    symbol: "MON",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://testnet-rpc.monad.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Monad Explorer",
      url: "https://testnet.monadexplorer.com",
    },
  },
  testnet: true,
});

export const config = getDefaultConfig({
  appName: "TaskForge",
  projectId: "YOUR_WALLETCONNECT_PROJECT_ID",  // Issued from WalletConnect Cloud
  chains: [monadTestnet],
  ssr: true,  // Required for Next.js App Router
});
```

### WalletConnect Project ID
- Get free issuance at https://cloud.walletconnect.com
- Manage as environment variable: `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- OK to hardcode in MVP

---

## 5.3 Providers Component

**File:** `frontend/app/providers.tsx`

```tsx
"use client";

import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "@/lib/wagmi";

import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#F59E0B",         // primary amber
            accentColorForeground: "#09090B", // dark text on amber
            borderRadius: "medium",
            fontStack: "system",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

### RainbowKit Dark Theme Customization
- `accentColor`: Amber (primary) — used for buttons/emphasis
- `accentColorForeground`: Dark — text on amber
- `borderRadius`: medium — rounded corners
- Background automatically applies dark theme

---

## 5.4 Modify layout.tsx

**File:** `frontend/app/layout.tsx` (modified)

```tsx
import { Providers } from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>
        <Providers>
          <Navbar />
          <main className="pt-16 min-h-screen">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
```

---

## 5.5 Navbar ConnectWallet Integration

**File:** `frontend/components/layout/Navbar.tsx` (modified)

```tsx
import { ConnectButton } from "@rainbow-me/rainbowkit";

// Replace existing placeholder on right side of Navbar
<ConnectButton
  chainStatus="icon"
  accountStatus="avatar"
  showBalance={false}
/>
```

### ConnectButton Custom Options
| prop | Value | Description |
|------|-------|-------------|
| `chainStatus` | `"icon"` | Display only chain icon (space saving) |
| `accountStatus` | `"avatar"` | Display avatar instead of address |
| `showBalance` | `false` | Hide balance (MVP simplification) |

### Custom ConnectButton (Optional)
Use RainbowKit's `ConnectButton.Custom` for a button matching our design system:
```tsx
<ConnectButton.Custom>
  {({ account, chain, openConnectModal, mounted }) => {
    if (!mounted || !account || !chain) {
      return <Button variant="primary" onClick={openConnectModal}>Connect Wallet</Button>;
    }
    return (
      <Button variant="ghost" onClick={openAccountModal}>
        {account.displayName}
      </Button>
    );
  }}
</ConnectButton.Custom>
```

---

## 5.6 Conditional UI

### Branching by Wallet Connection State

| State | Display | Access Restriction |
|-------|---------|-------------------|
| Not connected | "Connect Wallet" button | Dashboard → prompt connection modal |
| Connected | Avatar + address | All features accessible |

### Dashboard Guard
```tsx
// app/dashboard/page.tsx
"use client";
import { useAccount } from "wagmi";

export default function Dashboard() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h2 className="text-2xl font-heading">Connect your wallet</h2>
        <p className="text-muted">Connect your wallet to access the dashboard</p>
        <ConnectButton />
      </div>
    );
  }

  return <DashboardContent />;
}
```

### Task Registration / Quote Submission Guard
- Check `isConnected` on form submission
- Auto-open ConnectWallet modal if not connected

---

## Completion Criteria Checklist

| # | Check Item | Method |
|---|-----------|--------|
| 1 | Open RainbowKit modal | Click "Connect Wallet" |
| 2 | Connect MetaMask/wallet | Wallet approval → display address |
| 3 | Disconnect wallet | Click avatar → Disconnect |
| 4 | Display Monad Testnet | Verify chain icon/name |
| 5 | Request chain switch | Request switch when on different chain |
| 6 | Dashboard guard | Show connection prompt when not connected |
| 7 | Navbar state reflection | UI changes when connected/disconnected |
| 8 | Persist after refresh | Verify session persistence |
| 9 | No build errors | `npm run build` succeeds |

---

## Estimated Time
- 5.1 Installation: ~2 minutes
- 5.2~5.3 config + providers: ~10 minutes
- 5.4~5.5 layout + navbar: ~10 minutes
- 5.6 Conditional UI: ~15 minutes
- **Total: ~40 minutes**

---

## Cautions
- `"use client"` required — wagmi hooks only work in client components
- Don't forget RainbowKit CSS import (`@rainbow-me/rainbowkit/styles.css`)
- Next.js SSR and wagmi compatibility: `ssr: true` setting required
- Without WalletConnect projectId, WalletConnect method connection is unavailable (direct MetaMask connection is possible)

---

## Next Phase Dependencies
- Phase 7 (Integration) → Requires Phase 5 + Phase 6 completion
