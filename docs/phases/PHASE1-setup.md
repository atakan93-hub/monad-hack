# Phase 1: Project Setup

> Monorepo + Next.js + Foundry + Design system foundation

---

## Task Order (Dependency Order)

```
1.1 Root package.json (workspaces)
 └─ 1.2 Next.js 15 initialization
     ├─ 1.3 Tailwind v4 setup + design tokens
     └─ 1.4 globals.css dark mode styles
 └─ 1.5 Foundry initialization
     └─ 1.6 OpenZeppelin installation
```

---

## 1.1 Root package.json

**File:** `taskforge/package.json`

```json
{
  "name": "taskforge",
  "version": "0.1.0",
  "private": true,
  "workspaces": ["frontend", "contract"],
  "scripts": {
    "dev": "npm run dev --workspace=frontend",
    "build": "npm run build --workspace=frontend"
  }
}
```

---

## 1.2 Next.js 15 Initialization

**Command:**
```bash
cd taskforge
npx create-next-app@latest frontend \
  --typescript --tailwind --eslint --app \
  --src-dir=false --import-alias="@/*" --use-npm --no-turbopack
```

**Generated files to verify:**
- `frontend/package.json`
- `frontend/next.config.ts`
- `frontend/tsconfig.json`
- `frontend/app/layout.tsx`
- `frontend/app/page.tsx`

**Additional dependencies (installed in Phase 5, noted here for reference):**
```bash
npm install @rainbow-me/rainbowkit wagmi viem @tanstack/react-query
```

---

## 1.3 Tailwind CSS v4 Setup + Design Tokens

**File:** `frontend/tailwind.config.ts`

Next.js 15 uses Tailwind v4 by default. Tokens are defined in the `@theme` block inside `globals.css`.

### Design Token Definitions

| Token Name | CSS Variable | Value | Purpose |
|------------|-------------|-------|---------|
| `--color-primary` | amber | `#F59E0B` | Primary actions, CTA |
| `--color-secondary` | dark purple | `#1E1B4B` | Secondary backgrounds, cards |
| `--color-accent` | cyber blue | `#3B82F6` | Highlights, links, glow |
| `--color-background` | deep dark | `#09090B` | Page background |
| `--color-foreground` | white | `#FAFAFA` | Text |
| `--color-surface` | | `#18181B` | Card/component backgrounds |
| `--color-border` | | `#27272A` | Borders |
| `--color-muted` | | `#A1A1AA` | Secondary text |

### Font Setup

| Font | Purpose | next/font usage |
|------|---------|----------------|
| Inter | Body text | `next/font/google` → Inter |
| Space Grotesk | Headings, logo | `next/font/google` → Space_Grotesk |

**Font loading in layout.tsx:**
```tsx
import { Inter, Space_Grotesk } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-heading" });

// body className={`${inter.variable} ${spaceGrotesk.variable}`}
```

---

## 1.4 globals.css Dark Mode Base Styles

**File:** `frontend/app/globals.css` (or `frontend/styles/globals.css`)

```css
@import "tailwindcss";

@theme {
  --color-primary: #F59E0B;
  --color-secondary: #1E1B4B;
  --color-accent: #3B82F6;
  --color-background: #09090B;
  --color-foreground: #FAFAFA;
  --color-surface: #18181B;
  --color-border: #27272A;
  --color-muted: #A1A1AA;

  --font-sans: var(--font-inter), system-ui, sans-serif;
  --font-heading: var(--font-heading), system-ui, sans-serif;
}

body {
  background-color: var(--color-background);
  color: var(--color-foreground);
  font-family: var(--font-sans);
}
```

### Utility Styles (add as needed)
- `.glow-blue` — Cyber blue glow effect (box-shadow)
- `.glow-amber` — Amber glow effect
- `::selection` — Amber background selection style

---

## 1.5 Foundry Project Initialization

**Command:**
```bash
cd taskforge
forge init contract --no-commit
```

**Verify generated files:**
- `contract/foundry.toml`
- `contract/src/Counter.sol` (to be deleted)
- `contract/test/Counter.t.sol` (to be deleted)
- `contract/script/Counter.s.sol` (to be deleted)

**Edit foundry.toml:**
```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc_version = "0.8.20"
```

**Clean up initial files:**
- Delete `Counter.sol`, `Counter.t.sol`, `Counter.s.sol`
- Keep empty `.gitkeep` or placeholder

---

## 1.6 OpenZeppelin Installation

**Command:**
```bash
cd taskforge/contract
forge install OpenZeppelin/openzeppelin-contracts --no-commit
```

**Remappings setup (`foundry.toml` or `remappings.txt`):**
```
@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/
```

**Verify:**
```bash
forge build  # Should succeed even with empty project
```

---

## Completion Checklist

| # | Check Item | Command | Expected Result |
|---|-----------|---------|-----------------|
| 1 | Frontend server | `cd frontend && npm run dev` | localhost:3000 accessible |
| 2 | Page rendering | Browser → localhost:3000 | Next.js default page displayed |
| 3 | Tailwind applied | Use custom color classes | Design token colors reflected |
| 4 | Font loading | DevTools → Fonts | Inter, Space Grotesk shown |
| 5 | Foundry build | `cd contract && forge build` | Compilation succeeds (warnings OK) |
| 6 | OpenZeppelin | Verify `import` resolves | Path resolution succeeds |

---

## Estimated Time
- 1.1~1.2: ~5 min (CLI generation)
- 1.3~1.4: ~10 min (config file writing)
- 1.5~1.6: ~3 min (CLI generation)
- **Total: ~20 min**

---

## Next Phase Dependencies
- Phase 2 (UI Components) → requires Phase 1 completion
- Phase 6 (Contracts) → requires 1.5, 1.6 completion (can run independently)
