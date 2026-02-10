# Review: Buy FORGE Button + Leaderboard Real Data

## Summary

Two changes shipped in commit `0320728`:

1. **Navbar** — Added "Buy FORGE" external link to nad.fun token page
2. **Leaderboard** — Replaced hardcoded mock data (Alice/Bob/Carol) with live DB user data

---

## Checklist

| Item | Status | Notes |
|------|--------|-------|
| Navbar "Buy FORGE" external link | ✅ | Amber accent + ExternalLink icon, opens nad.fun in new tab |
| Remove hardcoded leaderboard data | ✅ | Deleted Alice/Bob/Carol mock array |
| Fetch users via getUserByAddress() | ✅ | Two addresses fetched with useEffect + useState |
| Auto-rank by reputation descending | ✅ | sort → map to assign rank |
| Loading spinner | ✅ | Loader2 animate-spin while fetching |
| Build passes | ✅ | `npm run build` — 0 errors |

---

## Changes

### 1. Navbar (`frontend/components/layout/Navbar.tsx`)

- Added `<a>` tag after nav links, before Admin link
- URL: `https://nad.fun/tokens/0x7A403F18Dd87C14d712C60779FDfB7F1c7697777`
- `target="_blank"` + `rel="noopener noreferrer"`
- Style: `text-amber-400 hover:text-amber-300` — visually distinct from regular nav links
- lucide-react `ExternalLink` icon (3.5x3.5)

### 2. Leaderboard (`frontend/app/leaderboard/page.tsx`)

**Removed:**
- Hardcoded `LEADERBOARD` array with fake names/addresses/scores

**Added:**
- `LEADERBOARD_ADDRESSES` constant with two real wallet addresses:
  - `0x0fb4D7369b4Cc20a8F84F319B70604BD3245eB49`
  - `0x70B83F0f903e5Ff3a84e6691cFcaA241448bdCA0`
- `useEffect` fetches both users via `getUserByAddress()` from `supabase-api.ts`
- `Promise.all` for parallel fetch, `filter(non-null)` for safety
- Sorted by `reputation` descending, rank auto-assigned (index + 1)
- Loading state with `Loader2` spinner

**Data mapping:**

| UI Field | User Field |
|----------|------------|
| name | user.name |
| address | user.address |
| score | user.reputation |
| tasks | user.totalTasks |
| rank | Auto-assigned by reputation order |

---

## Notes

- **Error handling**: try/finally pattern ensures loading state clears even on fetch failure. Missing users result in an empty leaderboard (no crash).
- **Extensibility**: Adding more users only requires appending addresses to `LEADERBOARD_ADDRESSES`.
- **No API route needed**: `getUserByAddress()` reads directly from Supabase client (public read, no mutation).
