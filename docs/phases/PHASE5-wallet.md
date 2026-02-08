# Phase 5: Wallet Connection

> RainbowKit + wagmi v2 + viem wallet integration

---

## Task Order

```
5.1 Install dependencies
5.2 wagmi config + chain setup (lib/wagmi.ts)
5.3 Providers component (app/providers.tsx)
5.4 Wrap layout.tsx with Providers
5.5 Navbar ConnectWallet integration
5.6 Conditional UI (connection state guards)
```

---

## 5.1 Dependencies

```bash
npm install @rainbow-me/rainbowkit wagmi viem@2.x @tanstack/react-query
```

## 5.2 wagmi Config

**File:** `frontend/lib/wagmi.ts`

- Monad Testnet chain: id 10143, symbol MON, rpc `https://testnet-rpc.monad.xyz`
- `getDefaultConfig` with `ssr: true` for Next.js App Router
- Injected connector only (MetaMask etc.)

## 5.3 Providers Component

**File:** `frontend/app/providers.tsx`

- `WagmiProvider` + `QueryClientProvider` + `RainbowKitProvider`
- Dark theme: accent `#F59E0B`, border radius medium

## 5.4 layout.tsx Wrapping

Wrap `<Navbar>` + `<main>` + `<Footer>` inside `<Providers>`.

## 5.5 Navbar ConnectButton

```tsx
<ConnectButton chainStatus="icon" accountStatus="avatar" showBalance={false} />
```

## 5.6 Conditional UI

- Dashboard guard: if not connected, show "Connect your wallet" prompt
- Form submissions check `isConnected` before proceeding

---

## Completion Checklist

- [ ] RainbowKit modal opens on click
- [ ] Wallet connects (MetaMask)
- [ ] Disconnect works
- [ ] Monad Testnet displayed
- [ ] Chain switch request on wrong network
- [ ] Dashboard guard shows connect prompt
- [ ] Navbar reflects connection state
- [ ] Session persists after refresh
- [ ] `npm run build` 0 errors

---

## Notes
- `"use client"` required for wagmi hooks
- RainbowKit CSS import: `@rainbow-me/rainbowkit/styles.css`
- WalletConnect removed — injected connector only

## Dependencies
- Phase 7 (Integration) requires Phase 5 + Phase 6
