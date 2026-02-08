# Phase 1: Project Setup

> Monorepo + Next.js + Foundry + Design system foundation

---

## Task Order

```
1.1 Root package.json (workspaces)
 └─ 1.2 Next.js 15 init
     ├─ 1.3 Tailwind v4 + design tokens
     └─ 1.4 globals.css dark mode
 └─ 1.5 Foundry init
     └─ 1.6 OpenZeppelin install
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

## 1.2 Next.js 15 Init

```bash
npx create-next-app@latest frontend \
  --typescript --tailwind --eslint --app \
  --src-dir=false --import-alias="@/*" --use-npm --no-turbopack
```

## 1.3 Tailwind v4 + Design Tokens

| Token | Value | Purpose |
|-------|-------|---------|
| `--color-primary` | `#F59E0B` | Main actions, CTA |
| `--color-secondary` | `#1E1B4B` | Secondary bg, cards |
| `--color-accent` | `#3B82F6` | Highlights, glow |
| `--color-background` | `#09090B` | Page background |
| `--color-foreground` | `#FAFAFA` | Text |
| `--color-surface` | `#18181B` | Card backgrounds |
| `--color-border` | `#27272A` | Borders |
| `--color-muted` | `#A1A1AA` | Secondary text |

Fonts: Inter (body), Space Grotesk (headings) via `next/font/google`

## 1.4 globals.css Dark Mode

Defined via `@theme` block in `frontend/app/globals.css`.

## 1.5 Foundry Init

```bash
forge init contract --no-commit
```

foundry.toml: `solc_version = "0.8.20"`

## 1.6 OpenZeppelin

```bash
forge install OpenZeppelin/openzeppelin-contracts --no-commit
```

Remapping: `@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/`

---

## Completion Checklist

- [ ] Frontend dev server runs (`npm run dev`)
- [ ] Page renders at localhost:3000
- [ ] Tailwind custom colors applied
- [ ] Fonts loaded (Inter, Space Grotesk)
- [ ] Foundry builds (`forge build`)
- [ ] OpenZeppelin imports resolve

---

## Dependencies
- Phase 2 (UI Components) requires Phase 1
- Phase 6 (Contracts) requires 1.5, 1.6
