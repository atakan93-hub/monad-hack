# Phase 2: UI Component Library

> Building reusable components based on the design system

---

## Task Order (Dependency Order)

```
2.1 Button (most basic, used by other components)
2.2 Card (layout base)
2.3 Input (form element)
2.4 Badge (status display)
2.5 Avatar (agent display)
2.6 Modal (overlay UI)
────────────────────────
2.7 Navbar (uses Button, layout)
2.8 Footer (layout)
```

---

## 2.1 Button

**File:** `frontend/components/ui/Button.tsx`

### Props Spec
```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}
```

### Style Mapping
| variant | Background | Text | Hover |
|---------|-----------|------|-------|
| `primary` | `bg-primary` | `text-background` (dark text) | `hover:bg-primary/90` |
| `secondary` | `bg-secondary` | `text-foreground` | `hover:bg-secondary/80` |
| `ghost` | `bg-transparent` | `text-foreground` | `hover:bg-surface` |

| size | padding | font-size |
|------|---------|-----------|
| `sm` | `px-3 py-1.5` | `text-sm` |
| `md` | `px-4 py-2` | `text-base` |
| `lg` | `px-6 py-3` | `text-lg` |

### Common Styles
- `rounded-lg font-medium transition-colors duration-200`
- `disabled:opacity-50 disabled:cursor-not-allowed`
- When loading: hide text and show spinner (simple CSS spinner)

---

## 2.2 Card

**File:** `frontend/components/ui/Card.tsx`

### Props Spec
```tsx
interface CardProps {
  variant?: "default" | "highlighted";
  className?: string;
  children: React.ReactNode;
}
```

### Style Mapping
| variant | Background | Border | Special |
|---------|-----------|--------|---------|
| `default` | `bg-surface` | `border border-border` | - |
| `highlighted` | `bg-surface` | `border border-primary/50` | `shadow-[0_0_15px_rgba(245,158,11,0.1)]` |

### Common Styles
- `rounded-xl p-6`
- `hover:border-primary/30 transition-all duration-300` (default card only)

---

## 2.3 Input

**File:** `frontend/components/ui/Input.tsx`

### Props Spec
```tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}
```

### Structure
```
<div>
  {label && <label className="text-sm text-muted mb-1.5 block">{label}</label>}
  <input className="..." />
  {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
</div>
```

### Input Styles
- `w-full bg-background border border-border rounded-lg px-4 py-2.5`
- `text-foreground placeholder:text-muted`
- `focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50`
- On error: `border-red-500`

**Textarea also exported from the same file:**
```tsx
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}
```

---

## 2.4 Badge

**File:** `frontend/components/ui/Badge.tsx`

### Props Spec
```tsx
interface BadgeProps {
  variant?: "default" | "voting" | "active" | "completed" | "disputed" | "pending" | "funded";
  children: React.ReactNode;
  className?: string;
}
```

### Color Mapping
| variant | Background | Text | Meaning |
|---------|-----------|------|---------|
| `default` | `bg-surface` | `text-muted` | Default |
| `voting` | `bg-purple-500/20` | `text-purple-400` | Voting |
| `active` | `bg-primary/20` | `text-primary` | In progress |
| `completed` | `bg-green-500/20` | `text-green-400` | Completed |
| `disputed` | `bg-red-500/20` | `text-red-400` | Disputed |
| `pending` | `bg-yellow-500/20` | `text-yellow-400` | Pending |
| `funded` | `bg-accent/20` | `text-accent` | Funded |

### Common Styles
- `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium`

---

## 2.5 Avatar

**File:** `frontend/components/ui/Avatar.tsx`

### Props Spec
```tsx
interface AvatarProps {
  src?: string;
  alt?: string;
  size?: "sm" | "md" | "lg" | "xl";
  glow?: boolean;
  className?: string;
}
```

### Size Mapping
| size | Dimensions |
|------|-----------|
| `sm` | `w-8 h-8` |
| `md` | `w-10 h-10` |
| `lg` | `w-14 h-14` |
| `xl` | `w-20 h-20` |

### Glow Effect
- When `glow={true}`: `ring-2 ring-accent shadow-[0_0_15px_rgba(59,130,246,0.5)]`
- Cyber blue ring + glow animation

### When No Image
- Gradient background + initial display (first letter of name)
- `bg-gradient-to-br from-primary to-accent`

---

## 2.6 Modal

**File:** `frontend/components/ui/Modal.tsx`

### Props Spec
```tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}
```

### Size Mapping
| size | Width |
|------|-------|
| `sm` | `max-w-md` |
| `md` | `max-w-lg` |
| `lg` | `max-w-2xl` |

### Structure
```
<Overlay (backdrop)>
  <DialogPanel>
    <Header: title + close button>
    <Content: children>
  </DialogPanel>
</Overlay>
```

### Styles
- Overlay: `fixed inset-0 bg-black/60 backdrop-blur-sm z-50`
- Panel: `bg-surface border border-border rounded-2xl p-6`
- Close: `X` button (top-right), ESC key, overlay click
- Animation: `transition-all duration-200` (fade + scale)

---

## 2.7 Navbar

**File:** `frontend/components/layout/Navbar.tsx`

### Structure
```
<nav className="fixed top-0 w-full z-40 bg-background/80 backdrop-blur-md border-b border-border">
  <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
    <!-- Left: Logo -->
    <Logo />  <!-- "TaskForge" in Space Grotesk, primary color accent -->

    <!-- Center: Navigation -->
    <nav className="flex items-center gap-8">
      <NavLink href="/arena">Arena</NavLink>
      <NavLink href="/market">Market</NavLink>
      <NavLink href="/dashboard">Dashboard</NavLink>
    </nav>

    <!-- Right: Wallet connection -->
    <ConnectWalletButton />  <!-- Actual integration in Phase 5, placeholder for now -->
  </div>
</nav>
```

### NavLink Styles
- Default: `text-muted hover:text-foreground transition-colors`
- Active (current path): `text-primary font-medium`
- Determine current path with `usePathname()`

### Mobile Support
- Hamburger menu (optional, keep simple for MVP)
- `md:flex hidden` + mobile drawer

---

## 2.8 Footer

**File:** `frontend/components/layout/Footer.tsx`

### Structure
```
<footer className="border-t border-border py-8">
  <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
    <p className="text-muted text-sm">© 2026 TaskForge</p>
    <div className="flex gap-6">
      <a>GitHub</a>
      <a>Docs</a>
      <a>Twitter</a>
    </div>
  </div>
</footer>
```

---

## Navbar/Footer Integration in layout.tsx

**File:** `frontend/app/layout.tsx` (modified)

```tsx
<body>
  <Navbar />
  <main className="pt-16 min-h-screen">  {/* pt-16: offset for Navbar height */}
    {children}
  </main>
  <Footer />
</body>
```

---

## Completion Checklist

| # | Check Item | Method |
|---|-----------|--------|
| 1 | Button 3 variant × 3 size rendering | Verify on temp page |
| 2 | Card default/highlighted distinction | Verify visual difference |
| 3 | Input label + error display | Confirm red error message |
| 4 | Badge 7 variant colors | Each shows different color |
| 5 | Avatar glow effect | Confirm cyber blue ring |
| 6 | Modal open/close/ESC | Overlay + panel functionality |
| 7 | Navbar navigation | Route navigation + active link |
| 8 | Footer rendering | Displayed at bottom |
| 9 | No build errors | `npm run build` succeeds |

---

## Estimated Time
- 2.1~2.6 (UI): ~40 min
- 2.7~2.8 (Layout): ~15 min
- **Total: ~55 min**

---

## Next Phase Dependencies
- Phase 3 (Mock Data): independent from Phase 2 (parallel OK)
- Phase 4 (Pages): requires both Phase 2 + Phase 3
