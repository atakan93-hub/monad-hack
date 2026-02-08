# Phase 9: Contract Testnet Deployment ✅ COMPLETE

> Deploy Escrow + Arena to Monad Testnet (chainId: 10143)
> using existing ERC20+permit token (ARENA) and update frontend addresses
>
> **Note:** MockToken was NOT needed — an existing ERC20+permit token (ARENA, `0x0bA5E04470Fe327AC191179Cf6823E667B007777`) was used as FORGE token.

---

## Prerequisites

| Item | Description |
|------|-------------|
| Foundry installed | `curl -L https://foundry.paradigm.xyz \| bash && foundryup` |
| Deployer wallet | Create a Monad Testnet account in MetaMask, obtain Private Key |
| Testnet MON | Get gas funds from [Monad Faucet](https://faucet.monad.xyz) |
| RPC URL | `https://testnet-rpc.monad.xyz` |
| Explorer | `https://testnet.monadexplorer.com` |

---

## B1. DeployMockToken.s.sol Script

> Since no real FORGE token exists on testnet, we deploy MockToken (mFORGE) first.
> Once the actual FORGE token is issued, swap the address and redeploy Escrow/Arena.

**New file:** `contract/script/DeployMockToken.s.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../test/MockToken.sol";

contract DeployMockTokenScript is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerKey);

        MockToken token = new MockToken();

        // Mint initial supply to deployer (1M mFORGE, 18 decimals)
        token.mint(vm.addr(deployerKey), 1_000_000 ether);

        vm.stopBroadcast();

        console.log("MockToken (mFORGE):", address(token));
        console.log("Initial supply minted to deployer:", vm.addr(deployerKey));
    }
}
```

### Key Notes
- `test/MockToken.sol` was already written in Phase 6 (ERC20, permissionless mint)
- `1_000_000 ether` = 1,000,000 * 10^18 (ERC20 default decimals = 18)
- After deployment, additional accounts can be funded: MockToken's `mint(address, amount)` has no access restriction

---

## B2. Deployment Procedure

### B2-1. Environment Variables

Create a `.env` file in the project root or `contract/` directory:

```bash
# contract/.env
PRIVATE_KEY=0xYOUR_DEPLOYER_PRIVATE_KEY
TREASURY=0xYOUR_TREASURY_ADDRESS    # Fee recipient wallet (can be same as deployer)
FEE_RATE=250                         # 2.5% (basis points, optional — defaults to 250)
```

> **Security Warning:** Ensure `.env` is listed in `.gitignore`. Never commit private keys.

Verify `.gitignore` includes `.env`:
```bash
cd /Users/hyeon/Desktop/hackerton/taskforge/contract
grep -q ".env" .gitignore || echo ".env" >> .gitignore
```

### B2-2. Deployment Order (3 Steps)

Deployment follows a dependency order: **MockToken -> (obtain address) -> Escrow + Arena**

#### Step 1: Deploy MockToken

```bash
cd /Users/hyeon/Desktop/hackerton/taskforge/contract

# Load env and deploy MockToken
source .env

forge script script/DeployMockToken.s.sol:DeployMockTokenScript \
  --rpc-url https://testnet-rpc.monad.xyz \
  --broadcast \
  --verify \
  -vvvv
```

Example output:
```
MockToken (mFORGE): 0x1234...abcd
Initial supply minted to deployer: 0xYourAddress
```

> **Record** the `0x1234...abcd` address. It will be used as `FORGE_TOKEN` in the next step.

#### Step 2: Add FORGE_TOKEN to Environment

Append the deployed MockToken address to `.env`:

```bash
# contract/.env (append)
FORGE_TOKEN=0x1234...abcd   # MockToken address from Step 1
```

#### Step 3: Deploy Escrow + Arena

```bash
cd /Users/hyeon/Desktop/hackerton/taskforge/contract

source .env

forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://testnet-rpc.monad.xyz \
  --broadcast \
  --verify \
  -vvvv
```

Example output:
```
Escrow: 0x5678...efgh
Arena:  0x9abc...ijkl
```

> **Record** both addresses. They will be used for the frontend update.

### B2-3. Deployment Verification (Monad Explorer)

Verify each contract address on the Explorer:

```
https://testnet.monadexplorer.com/address/0x1234...abcd  (MockToken)
https://testnet.monadexplorer.com/address/0x5678...efgh  (Escrow)
https://testnet.monadexplorer.com/address/0x9abc...ijkl  (Arena)
```

Check:
- Contract Creation transaction shows "Success"
- Contract tab shows ABI/source (when `--verify` flag was used)

### B2-4. Distribute Tokens to Test Accounts (Optional)

MockToken allows permissionless minting, so use cast to call directly:

```bash
# Mint 10,000 mFORGE to a specific address
cast send $FORGE_TOKEN \
  "mint(address,uint256)" \
  0xTEST_USER_ADDRESS \
  10000000000000000000000 \
  --rpc-url https://testnet-rpc.monad.xyz \
  --private-key $PRIVATE_KEY
```

Alternatively, you can build a mint button in the frontend for easier testing.

---

## B3. Updating addresses.ts

### B3-1. Target File

**File:** `frontend/lib/contracts/addresses.ts`

Current state (all placeholders):
```typescript
// Deployed contract addresses (Monad Testnet) — replace after deployment
export const CONTRACT_ADDRESSES = {
  FORGE_TOKEN: "0x0000000000000000000000000000000000000000" as `0x${string}`,
  ESCROW: "0x0000000000000000000000000000000000000000" as `0x${string}`,
  ARENA: "0x0000000000000000000000000000000000000000" as `0x${string}`,
} as const;
```

### B3-2. Post-Deployment Update

Replace with the actual deployed addresses:

```typescript
// Deployed contract addresses (Monad Testnet) — deployed 2026-02-XX
export const CONTRACT_ADDRESSES = {
  FORGE_TOKEN: "0x1234...actualMockTokenAddress" as `0x${string}`,
  ESCROW: "0x5678...actualEscrowAddress" as `0x${string}`,
  ARENA: "0x9abc...actualArenaAddress" as `0x${string}`,
} as const;
```

### B3-3. Verifying Activation

Once addresses change from `0x000...000` to real addresses:
- Frontend wagmi hooks (`useArena.ts`, `useEscrow.ts`, etc.) will begin making actual on-chain calls
- Works alongside the existing mock-api for hybrid data display

### B3-4. ABI File Verification

Confirm that existing ABI files match the deployed contracts:

| File | Corresponding Contract |
|------|----------------------|
| `frontend/lib/contracts/EscrowAbi.ts` | `contract/src/Escrow.sol` |
| `frontend/lib/contracts/ArenaAbi.ts` | `contract/src/Arena.sol` |
| `frontend/lib/contracts/Erc20Abi.ts` | ERC20 standard (MockToken compatible) |

Since contracts are deployed without modifications, ABI changes are not required.
If contracts were modified, sync ABIs from `out/` directory after `forge build`:

```bash
# Extract Escrow ABI (reference)
cat contract/out/Escrow.sol/Escrow.json | jq '.abi'

# Extract Arena ABI (reference)
cat contract/out/Arena.sol/Arena.json | jq '.abi'
```

---

## B4. Verification Checklist

### Pre-Deployment Checks

| # | Check Item | Command / Method | Pass Criteria |
|---|-----------|-----------------|---------------|
| 1 | Compilation succeeds | `cd contract && forge build` | 0 errors |
| 2 | All tests pass | `forge test` | 36 tests pass |
| 3 | Gas report | `forge test --gas-report` | No abnormal values |
| 4 | `.env` configured | Verify `PRIVATE_KEY`, `TREASURY` | No empty values |
| 5 | Deployer wallet balance | Check on Explorer | Sufficient MON for gas |
| 6 | `.env` in `.gitignore` | `grep ".env" .gitignore` | Output present |

### Post-Deployment Checks (On-Chain)

| # | Check Item | Verification Method | Expected Result |
|---|-----------|---------------------|-----------------|
| 7 | MockToken deployed | Check on Explorer | Creation tx Success |
| 8 | MockToken initial mint | `cast call $FORGE_TOKEN "balanceOf(address)" $DEPLOYER --rpc-url ...` | 1,000,000 * 10^18 |
| 9 | Escrow deployed | Check on Explorer | Creation tx Success |
| 10 | Escrow owner | `cast call $ESCROW "owner()" --rpc-url ...` | Deployer address |
| 11 | Escrow feeRate | `cast call $ESCROW "feeRate()" --rpc-url ...` | 250 (2.5%) |
| 12 | Escrow treasury | `cast call $ESCROW "treasury()" --rpc-url ...` | TREASURY address |
| 13 | Escrow forgeToken | `cast call $ESCROW "forgeToken()" --rpc-url ...` | MockToken address |
| 14 | Arena deployed | Check on Explorer | Creation tx Success |
| 15 | Arena admin | `cast call $ARENA "admin()" --rpc-url ...` | Deployer address |
| 16 | Arena forgeToken | `cast call $ARENA "forgeToken()" --rpc-url ...` | MockToken address |

### Post-Deployment Checks (Frontend)

| # | Check Item | Verification Method | Expected Result |
|---|-----------|---------------------|-----------------|
| 17 | addresses.ts updated | Inspect file | All 3 addresses non-zero |
| 18 | Frontend builds | `cd frontend && npm run build` | 0 errors |
| 19 | Arena.admin() matches | Connect wallet in browser, check admin | Deployer wallet = admin |
| 20 | MockToken mint test | Via cast or browser mint call | Balance increases |

### E2E Smoke Test (Optional, Post-Deployment)

After minting test tokens via MockToken, verify basic flows with cast:

```bash
# 1. Arena: Create round (zero prize)
cast send $ARENA "createRound(uint256)" 0 \
  --rpc-url https://testnet-rpc.monad.xyz \
  --private-key $PRIVATE_KEY

# 2. Arena: Check roundCount
cast call $ARENA "roundCount()" --rpc-url https://testnet-rpc.monad.xyz
# Expected: 1

# 3. Escrow: Create deal
cast send $ESCROW \
  "createDeal(address,uint256,uint256)" \
  0xAGENT_ADDRESS \
  1000000000000000000 \
  $(date -v+7d +%s) \
  --rpc-url https://testnet-rpc.monad.xyz \
  --private-key $PRIVATE_KEY

# 4. Escrow: Check dealCount
cast call $ESCROW "dealCount()" --rpc-url https://testnet-rpc.monad.xyz
# Expected: 1
```

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| `EvmError: OutOfFund` | Insufficient MON balance | Get more MON from Faucet |
| `Script failed` + `Invalid token` | FORGE_TOKEN env var not set | Add MockToken address to `.env` |
| `Nonce too high` | Nonce conflict from previous failed tx | Use `--resume` flag or reset nonce in MetaMask |
| `--verify` fails | Explorer API unsupported or rate limited | Remove `--verify` flag and retry |
| ABI mismatch | Contract modified without updating ABI | Run `forge build`, compare `out/` ABI with frontend ABI |

### Deploying Without `--verify`

If Monad Testnet Explorer does not support source verification:

```bash
forge script script/DeployMockToken.s.sol:DeployMockTokenScript \
  --rpc-url https://testnet-rpc.monad.xyz \
  --broadcast \
  -vvvv
```

Simply remove the `--verify` flag. Everything else remains the same.

---

## Deployed Addresses

| Contract | Address |
|----------|---------|
| FORGE Token (ARENA) | `0x0bA5E04470Fe327AC191179Cf6823E667B007777` |
| Escrow | `0x75EbFEBFc7c105772872EEf717E9aa30fC345d79` |
| Arena | `0xf37058ee31b4434740DED6b22A5992F447cc527c` |
| Treasury | `0x7c0fC790D03DD82f54030420A109a2A8D53a5888` |

RPC: `https://testnet-rpc.monad.xyz` (OnFinality rate-limited, switched to official)

---

## File Summary

| # | File | Type | Description |
|---|------|------|-------------|
| 1 | `contract/.env` | New | Deployment env vars (PRIVATE_KEY, TREASURY, etc.) |
| 2 | `frontend/lib/contracts/addresses.ts` | Modified | Placeholder -> actual deployed addresses |

---

## Phase Dependencies

- **Phase 11 (Admin + E2E)** -> Requires Phase 9 completion (real on-chain addresses)
- **Phase 8 (Supabase)** -> Independent from Phase 9 (parallelizable)
- **Phase 10 (UI Redesign)** -> Independent from Phase 9 (parallelizable)
