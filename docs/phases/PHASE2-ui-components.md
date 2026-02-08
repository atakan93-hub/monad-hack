# Phase 2: UI Component Library

> Reusable components built on shadcn/ui design system

---

## Components (ui/)

| Component | File | Key Props |
|-----------|------|-----------|
| Button | `button.tsx` | variant (default/secondary/ghost/outline/destructive/link), size (sm/default/lg/icon) |
| Card | `card.tsx` | Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter |
| Input | `input.tsx` | Standard HTML input with custom styling |
| Badge | `badge.tsx` | variant (default/secondary/outline/destructive) |
| Avatar | `avatar.tsx` | AvatarImage + AvatarFallback, glow via className |
| Dialog | `dialog.tsx` | Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle |
| Textarea | `textarea.tsx` | Multiline input |

## Layout Components

### Navbar (`components/layout/Navbar.tsx`)
- Fixed top, `bg-background/80 backdrop-blur-md`
- Logo ("TaskForge" in Space Grotesk) + nav links (Arena, Market, Dashboard) + ConnectWallet
- Active link detection via `usePathname()`

### Footer (`components/layout/Footer.tsx`)
- `border-t border-border py-8`
- Copyright + GitHub / Docs / Twitter links

## layout.tsx Integration
```tsx
<Navbar />
<main className="pt-16 min-h-screen">{children}</main>
<Footer />
```

---

## Completion Checklist

- [ ] Button variants render correctly
- [ ] Card with proper styling
- [ ] Input with focus states
- [ ] Badge color variants
- [ ] Avatar with fallback
- [ ] Dialog open/close/ESC
- [ ] Navbar navigation + active link
- [ ] Footer renders
- [ ] `npm run build` 0 errors

---

## Dependencies
- Phase 3 (Mock Data): independent, parallel OK
- Phase 4 (Pages): requires Phase 2 + Phase 3
