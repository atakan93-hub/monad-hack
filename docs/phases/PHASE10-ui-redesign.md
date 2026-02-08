# Phase 10: Full UI Redesign ✅ COMPLETE

> Premium dark Web3 theme — amber hammer + cyan circuit + glassmorphism
> Visual-only upgrade, no functional changes

---

## Task Order (Dependency Graph)

```
C1. globals.css Design System Changes (foundation for all components)
 ├─ C2. Emoji → lucide-react Icon Replacement (independent)
 ├─ C3. Landing Page Redesign
 ├─ C4. Navbar Redesign
 ├─ C5. Arena Page Redesign
 ├─ C6. Market Page Redesign
 ├─ C7. Dashboard Redesign
 ├─ C8. Agent Profile Redesign
 ├─ C9. Footer Redesign
 ├─ C10. Common Improvements (skeleton, hover, responsive)
 └─ C11. Verification Checklist
```

**C1 is a mandatory prerequisite**. C2–C10 can run in parallel once C1 is done.

---

## C1. Design System Changes

**Target File:** `frontend/app/globals.css`

### C1-1. Color Variable Changes

| Variable | Current Value | New Value | Purpose |
|----------|--------------|-----------|---------|
| `--background` | `#09090B` | `#0a0a0f` | Deeper dark background |
| `--accent` | `#3B82F6` (blue) | `#06B6D4` (cyan) | Full accent color swap |
| `--card` | `#18181B` (solid) | `rgba(255,255,255,0.03)` | Glassmorphism base |
| `--border` | `#27272A` | `rgba(255,255,255,0.08)` | More translucent borders |

```css
:root {
  /* Core: deeper dark background */
  --background: #0a0a0f;
  --foreground: #FAFAFA;

  /* Card: glassmorphism base */
  --card: rgba(255, 255, 255, 0.03);
  --card-foreground: #FAFAFA;
  --popover: rgba(255, 255, 255, 0.05);
  --popover-foreground: #FAFAFA;

  /* Primary: amber retained */
  --primary: #F59E0B;
  --primary-foreground: #09090B;

  /* Secondary: dark purple retained */
  --secondary: #1E1B4B;
  --secondary-foreground: #FAFAFA;

  /* Accent: cyber blue → cyan/teal */
  --accent: #06B6D4;
  --accent-foreground: #FAFAFA;

  /* Border: more translucent */
  --border: rgba(255, 255, 255, 0.08);
  --input: rgba(255, 255, 255, 0.08);

  /* Chart: reflect accent change */
  --chart-2: #06B6D4;
}
```

### C1-2. New Utility Classes

#### `.glass` — Glassmorphism Card

```css
/* === Glassmorphism === */
.glass {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.glass-strong {
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.12);
}
```

#### `.glow-cyan` — Cyan Glow

```css
.glow-cyan {
  box-shadow: 0 0 20px rgba(6, 182, 212, 0.3), 0 0 60px rgba(6, 182, 212, 0.1);
}

.glow-cyan-sm {
  box-shadow: 0 0 10px rgba(6, 182, 212, 0.2);
}
```

#### `.bg-gradient-hero` — Hero Gradient

```css
.bg-gradient-hero {
  background: radial-gradient(ellipse at 20% 50%, rgba(245, 158, 11, 0.08) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 20%, rgba(6, 182, 212, 0.06) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 100%, rgba(30, 27, 75, 0.3) 0%, transparent 60%);
}
```

#### `.skeleton` — Loading Shimmer

```css
/* === Skeleton Loader === */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.03) 25%,
    rgba(255, 255, 255, 0.08) 50%,
    rgba(255, 255, 255, 0.03) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius);
}
```

#### Circuit Pattern Overlay

```css
/* === Circuit Pattern Overlay === */
.circuit-pattern {
  position: relative;
}

.circuit-pattern::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(6, 182, 212, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(6, 182, 212, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}
```

### C1-3. Update existing `.glow-blue`

Swap from blue (`#3B82F6`) to cyan (`#06B6D4`). Class name stays the same, values change.

```css
/* Before */
.glow-blue {
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.3), 0 0 60px rgba(59, 130, 246, 0.1);
}

/* After */
.glow-blue {
  box-shadow: 0 0 20px rgba(6, 182, 212, 0.3), 0 0 60px rgba(6, 182, 212, 0.1);
}
```

### C1-4. Extend `.text-gradient-amber`

```css
/* Existing: amber → blue gradient (update to cyan) */
.text-gradient-amber {
  background: linear-gradient(135deg, #F59E0B, #06B6D4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* New: cyan → purple gradient */
.text-gradient-cyan {
  background: linear-gradient(135deg, #06B6D4, #8B5CF6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### C1-5. Update `.card-hover-glow`

```css
.card-hover-glow {
  transition: all 0.3s ease;
}
.card-hover-glow:hover {
  border-color: rgba(6, 182, 212, 0.3);
  box-shadow: 0 0 20px rgba(6, 182, 212, 0.08), 0 4px 20px rgba(0, 0, 0, 0.3);
  transform: translateY(-2px);
}
```

### C1-6. Mirror all changes in `.dark` block

Since this is a dark-only app, apply all `:root` variable changes identically in the `.dark` block.

---

## C2. Emoji to lucide-react Icon Replacement

**Package:** `lucide-react` (install via `npm install lucide-react` if not already present)

### Replacement Targets

| File | Current Emoji | Replacement Icon | Import |
|------|--------------|-----------------|--------|
| `app/page.tsx` | `⚔️` (Arena) | `Swords` | `import { Swords, Store, ShieldCheck } from "lucide-react"` |
| `app/page.tsx` | `🏪` (Market) | `Store` | (same) |
| `app/page.tsx` | `🔒` (Escrow) | `ShieldCheck` | (same) |
| `app/dashboard/page.tsx` | `📋` (Total) | `ClipboardList` | `import { ClipboardList, Flame, Mail, Coins } from "lucide-react"` |
| `app/dashboard/page.tsx` | `🔥` (Active) | `Flame` | (same) |
| `app/dashboard/page.tsx` | `📩` (Proposals) | `Mail` | (same) |
| `app/dashboard/page.tsx` | `💰` (Spent) | `Coins` | (same) |
| `components/features/agent/AgentStats.tsx` | `⭐` (Reputation) | `Star` | `import { Star, CheckCircle, ClipboardList, Coins } from "lucide-react"` |
| `components/features/agent/AgentStats.tsx` | `✅` (Completion) | `CheckCircle` | (same) |
| `components/features/agent/AgentStats.tsx` | `📋` (Tasks) | `ClipboardList` | (same) |
| `components/features/agent/AgentStats.tsx` | `💰` (Rate) | `Coins` | (same) |
| `app/agent/[id]/page.tsx` | `🥇` (Gold) | `Trophy` | `import { Trophy, Medal, Award } from "lucide-react"` |
| `app/agent/[id]/page.tsx` | `🥈` (Silver) | `Medal` | (same) |
| `app/agent/[id]/page.tsx` | `🥉` (Bronze) | `Award` | (same) |

### Replacement Pattern Examples

**Before (`app/page.tsx`):**
```tsx
const features = [
  { title: "Arena", description: "...", icon: "⚔️" },
  { title: "Marketplace", description: "...", icon: "🏪" },
  { title: "Escrow", description: "...", icon: "🔒" },
];

// Rendering
<div className="text-4xl mb-4">{f.icon}</div>
```

**After:**
```tsx
import { Swords, Store, ShieldCheck, LucideIcon } from "lucide-react";

const features: { title: string; description: string; icon: LucideIcon }[] = [
  { title: "Arena", description: "...", icon: Swords },
  { title: "Marketplace", description: "...", icon: Store },
  { title: "Escrow", description: "...", icon: ShieldCheck },
];

// Rendering
<div className="mb-4">
  <f.icon className="w-10 h-10 text-accent" />
</div>
```

**Before (`dashboard/page.tsx`):**
```tsx
<StatCard label="Total Requests" value={stats.totalRequests} icon={<span>📋</span>} />
```

**After:**
```tsx
import { ClipboardList, Flame, Mail, Coins } from "lucide-react";

<StatCard label="Total Requests" value={stats.totalRequests} icon={<ClipboardList className="w-6 h-6" />} />
<StatCard label="Active" value={stats.activeRequests} icon={<Flame className="w-6 h-6" />} />
<StatCard label="Proposals Received" value={stats.totalProposals} icon={<Mail className="w-6 h-6" />} />
<StatCard label="Total Spent" value={`${stats.totalSpent.toLocaleString()} FORGE`} icon={<Coins className="w-6 h-6" />} />
```

**Before (`agent/[id]/page.tsx`):**
```tsx
{badge.tier === "gold" && "🥇 "}
{badge.tier === "silver" && "🥈 "}
{badge.tier === "bronze" && "🥉 "}
```

**After:**
```tsx
import { Trophy, Medal, Award } from "lucide-react";

{badge.tier === "gold" && <Trophy className="w-4 h-4 inline text-yellow-400 mr-1" />}
{badge.tier === "silver" && <Medal className="w-4 h-4 inline text-gray-300 mr-1" />}
{badge.tier === "bronze" && <Award className="w-4 h-4 inline text-orange-400 mr-1" />}
```

---

## C3. Landing Page Redesign

**Target File:** `frontend/app/page.tsx`

### Before vs. After Comparison

| Section | Current | Changed |
|---------|---------|---------|
| Hero background | `hero.webp` + gradient overlay | `hero.webp` + `.bg-gradient-hero` + `.circuit-pattern` |
| Hero layout | Center-aligned (`text-center`) | Left text + right hero.webp (`flex-row`) |
| CTA buttons | 2 (amber + outline) | 3 (amber filled + cyan outlined + ghost) |
| Feature cards | `<Card>` default | `.glass` + lucide icons |
| Stats section | Plain text | `.glass` cards + counting effect |
| CTA section | Plain button | `.glass-strong` wrapper + `.glow-amber` |

### Hero Section Changes

**New layout:**
```
┌──────────────────────────────────────────────────┐
│  .bg-gradient-hero + .circuit-pattern            │
│                                                  │
│  ┌───────────────────┐  ┌──────────────────┐   │
│  │ Forge Intelligence│  │                  │   │
│  │ Automate Tasks.   │  │   hero.webp      │   │
│  │                   │  │   (rounded-2xl)  │   │
│  │ Subtitle          │  │                  │   │
│  │ [Arena] [Market]  │  │                  │   │
│  │ [Dashboard]       │  └──────────────────┘   │
│  └───────────────────┘                          │
└──────────────────────────────────────────────────┘
```

**New code (Hero):**
```tsx
<section className="relative px-6 py-24 md:py-36 overflow-hidden bg-gradient-hero circuit-pattern">
  <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 relative z-10">
    {/* Left: Text */}
    <div className="flex-1 text-center md:text-left">
      <h1 className="font-heading text-5xl md:text-7xl font-bold tracking-tight animate-fade-in">
        <span className="text-primary">Forge</span> Intelligence.
        <br />
        Automate Tasks.
      </h1>
      <p className="mt-6 text-lg text-muted-foreground max-w-xl animate-fade-in-delay">
        A decentralized platform where AI agents compete, collaborate, and deliver.
        Post tasks, receive proposals, and pay securely through smart contracts.
      </p>
      <div className="flex flex-wrap gap-4 mt-10 animate-fade-in-delay-2 justify-center md:justify-start">
        <Link href="/arena">
          <Button size="lg" className="glow-amber">Enter Arena</Button>
        </Link>
        <Link href="/market">
          <Button size="lg" variant="outline" className="border-accent/50 text-accent hover:bg-accent/10">
            Explore Market
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button size="lg" variant="ghost">Dashboard</Button>
        </Link>
      </div>
    </div>

    {/* Right: Hero Image */}
    <div className="flex-1 relative max-w-lg">
      <div className="relative rounded-2xl overflow-hidden glow-cyan">
        <Image
          src="/hero.webp"
          alt="TaskForge Hero"
          width={600}
          height={400}
          className="object-cover"
          priority
        />
      </div>
    </div>
  </div>
</section>
```

### Features Section Changes

```tsx
<section className="px-6 py-20 max-w-7xl mx-auto w-full">
  <h2 className="font-heading text-3xl font-bold text-center mb-12">
    How It Works
  </h2>
  <div className="grid md:grid-cols-3 gap-6">
    {features.map((f) => (
      <div key={f.title} className="glass rounded-xl p-6 text-center card-hover-glow">
        <div className="mb-4 flex justify-center">
          <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center">
            <f.icon className="w-7 h-7 text-accent" />
          </div>
        </div>
        <h3 className="font-heading text-xl font-semibold mb-2">{f.title}</h3>
        <p className="text-sm text-muted-foreground">{f.description}</p>
      </div>
    ))}
  </div>
</section>
```

### Stats Section Changes

```tsx
<section className="px-6 py-16">
  <div className="max-w-4xl mx-auto flex justify-center gap-6 md:gap-10">
    {stats.map((s) => (
      <div key={s.label} className="glass rounded-xl px-8 py-6 text-center flex-1">
        <p className="font-heading text-3xl md:text-4xl font-bold text-gradient-amber">
          {s.value}
        </p>
        <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
      </div>
    ))}
  </div>
</section>
```

### CTA Section Changes

```tsx
<section className="px-6 py-20">
  <div className="max-w-2xl mx-auto glass-strong rounded-2xl p-10 text-center">
    <h2 className="font-heading text-3xl font-bold mb-4">
      Start forging with AI agents today
    </h2>
    <p className="text-muted-foreground mb-8">
      Connect your wallet and begin outsourcing tasks to the best AI agents.
    </p>
    <Button size="lg" className="animate-pulse-glow">Connect Wallet</Button>
  </div>
</section>
```

---

## C4. Navbar Redesign

**Target File:** `frontend/components/layout/Navbar.tsx`

### Changes

| Item | Current | Changed |
|------|---------|---------|
| Background | `bg-background/80 backdrop-blur-md` | `.glass` + `backdrop-blur-xl` |
| Border | `border-b border-border` | `border-b border-white/[0.06]` |
| Active link | `text-primary font-medium` | `text-primary` + bottom indicator bar |
| Logo glow | None | Hover `.glow-amber-sm` |

### New Code

```tsx
<nav className="fixed top-0 w-full z-40 glass border-b border-white/[0.06]"
     style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
  <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
    {/* Logo */}
    <Link
      href="/"
      className="flex items-center gap-2 font-heading text-xl font-bold tracking-tight
                 transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]"
    >
      {/* ... existing logo image unchanged ... */}
    </Link>

    {/* Navigation — active link indicator added */}
    <div className="hidden md:flex items-center gap-8">
      {navLinks.map(({ href, label }) => {
        const isActive = pathname === href || pathname?.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={`relative text-sm transition-colors py-1 ${
              isActive
                ? "text-primary font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
            {isActive && (
              <span className="absolute -bottom-[1.125rem] left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </Link>
        );
      })}
    </div>

    {/* Wallet — unchanged */}
    <ConnectButton chainStatus="icon" accountStatus="avatar" showBalance={false} />
  </div>
</nav>
```

### Key Points
- `backdrop-blur-xl` (20px) for stronger glass effect
- Amber indicator bar below active link (`h-0.5 bg-primary`)
- Amber drop-shadow on logo hover

---

## C5. Arena Page Redesign

**Target Files:**
- `frontend/app/arena/page.tsx`
- `frontend/components/features/arena/RoundCard.tsx`
- `frontend/components/features/arena/TopicCard.tsx`
- `frontend/components/features/arena/EntryCard.tsx`
- `frontend/components/features/arena/TopicVoteButton.tsx`

### C5-1. RoundCard Glass + Status-Based Border Glow

| Status | Border Glow Color |
|--------|-------------------|
| `proposing` | cyan (`rgba(6,182,212,0.3)`) |
| `voting` | purple (`rgba(139,92,246,0.3)`) |
| `active` | amber (`rgba(245,158,11,0.3)`) |
| `completed` | green (`rgba(16,185,129,0.3)`) |

**New code:**
```tsx
const statusGlows: Record<string, string> = {
  proposing: "hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]",
  voting: "hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]",
  active: "hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]",
  completed: "hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]",
};

<Card
  className={`glass cursor-pointer transition-all duration-300 hover:-translate-y-1 ${statusGlows[round.status]}`}
  onClick={() => onClick?.(round.id)}
>
```

### C5-2. TopicCard Vote Progress Bar

Visualize each topic's vote share relative to the total during the voting phase.

```tsx
interface TopicCardProps {
  topic: Topic;
  showVotes?: boolean;
  highlight?: boolean;
  maxVotes?: number;  // Added: for progress bar calculation
  children?: React.ReactNode;
}

// Progress bar (only when showVotes && maxVotes > 0)
{showVotes && maxVotes && maxVotes > 0 && (
  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-2">
    <div
      className="h-full bg-gradient-to-r from-accent to-purple-500 rounded-full transition-all duration-500"
      style={{ width: `${Math.round((topic.totalVotes / maxVotes) * 100)}%` }}
    />
  </div>
)}
```

### C5-3. EntryCard Winner Golden Glow

```tsx
<Card className={`glass ${isWinner ? "border-primary/50 glow-amber-sm" : ""}`}>
  {/* ... existing content unchanged ... */}
  {isWinner && (
    <Badge className="bg-primary/20 text-primary border-primary/30 gap-1">
      <Trophy className="w-3 h-3" /> Winner
    </Badge>
  )}
</Card>
```

### C5-4. TopicVoteButton Cyan Glow

```tsx
<Button
  size="sm"
  variant="outline"
  className="border-accent/30 text-accent hover:bg-accent/10 hover:shadow-[0_0_12px_rgba(6,182,212,0.2)]
             transition-all duration-300"
  onClick={(e) => {
    e.stopPropagation();
    onVote(topicId);
  }}
>
  <Vote className="w-4 h-4 mr-1" />
  Vote
</Button>
```

### C5-5. Round Detail Modal Glass

```tsx
<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto glass-strong">
```

---

## C6. Market Page Redesign

**Target Files:**
- `frontend/app/market/page.tsx`
- `frontend/app/market/[id]/page.tsx`
- `frontend/components/features/market/RequestCard.tsx`
- `frontend/components/features/market/FilterSidebar.tsx`
- `frontend/components/features/market/ProposalForm.tsx`

### C6-1. RequestCard Glass + Category Color Icons

Per-category accent icons:

| Category | lucide Icon | Color |
|----------|------------|-------|
| `smart-contract` | `FileCode` | cyan |
| `frontend` | `Layout` | purple |
| `data-analysis` | `BarChart3` | green |
| `audit` | `ShieldCheck` | amber |
| `other` | `Package` | muted |

```tsx
import { FileCode, Layout, BarChart3, ShieldCheck, Package, LucideIcon } from "lucide-react";

const categoryIcons: Record<string, { icon: LucideIcon; color: string }> = {
  "smart-contract": { icon: FileCode, color: "text-accent" },
  frontend: { icon: Layout, color: "text-purple-400" },
  "data-analysis": { icon: BarChart3, color: "text-green-400" },
  audit: { icon: ShieldCheck, color: "text-primary" },
  other: { icon: Package, color: "text-muted-foreground" },
};

// Apply .glass to Card
<Card className="glass cursor-pointer card-hover-glow h-full">
  <CardHeader className="pb-3">
    <div className="flex items-center gap-2 flex-wrap">
      {(() => {
        const cat = categoryIcons[request.category];
        const Icon = cat.icon;
        return <Icon className={`w-4 h-4 ${cat.color}`} />;
      })()}
      <Badge variant="secondary">{categoryLabels[request.category]}</Badge>
      <Badge variant="outline" className={statusColors[request.status]}>
        {request.status.replace("_", " ")}
      </Badge>
    </div>
    {/* ... */}
  </CardHeader>
</Card>
```

### C6-2. FilterSidebar Custom Radio/Checkbox

Replace native `<input>` with custom styled elements:

```tsx
// Custom radio button
<label className="flex items-center gap-2.5 cursor-pointer text-sm group">
  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all
    ${selectedStatus === value
      ? "border-primary bg-primary/20"
      : "border-white/20 group-hover:border-white/40"
    }`}
  >
    {selectedStatus === value && (
      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
    )}
  </div>
  <span className={selectedStatus === value ? "text-foreground" : "text-muted-foreground"}>
    {label}
  </span>
</label>

// Custom checkbox
<label className="flex items-center gap-2.5 cursor-pointer text-sm group">
  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all
    ${selectedCategories.includes(value)
      ? "border-accent bg-accent/20"
      : "border-white/20 group-hover:border-white/40"
    }`}
  >
    {selectedCategories.includes(value) && (
      <Check className="w-3 h-3 text-accent" />
    )}
  </div>
  <span className={selectedCategories.includes(value) ? "text-foreground" : "text-muted-foreground"}>
    {label}
  </span>
</label>
```

### C6-3. ProposalForm Glass Wrapper

```tsx
<form onSubmit={handleSubmit} className="glass rounded-xl p-6 space-y-4">
  <h3 className="font-heading font-semibold text-lg">Submit Proposal</h3>
  {/* ... existing form content unchanged ... */}
</form>
```

### C6-4. Request Detail Page Proposal Cards Glass

```tsx
{proposals.map((prop) => (
  <div key={prop.id} className="glass rounded-xl p-4">
    {/* ... existing content unchanged, Card → div.glass swap ... */}
  </div>
))}
```

---

## C7. Dashboard Redesign

**Target Files:**
- `frontend/app/dashboard/page.tsx`
- `frontend/components/features/common/StatCard.tsx`

### C7-1. StatCard Glass + Icon Glow

```tsx
export function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold font-heading mt-1">{value}</p>
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
```

### C7-2. List Cards Glass

Replace Active Requests and Received Proposals cards with `.glass`:

```tsx
{activeRequests.map((req) => (
  <Link key={req.id} href={`/market/${req.id}`}>
    <div className="glass rounded-xl p-4 flex items-center justify-between
                    hover:border-accent/20 transition-all duration-300">
      {/* ... existing content unchanged ... */}
    </div>
  </Link>
))}
```

### C7-3. Wallet Not Connected State Enhancement

```tsx
if (!isConnected) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
        <Wallet className="w-8 h-8 text-accent" />
      </div>
      <h2 className="font-heading text-2xl font-bold">Connect Your Wallet</h2>
      <p className="text-muted-foreground text-sm max-w-sm text-center">
        Connect your wallet to access the dashboard and manage your tasks
      </p>
      <ConnectButton />
    </div>
  );
}
```

---

## C8. Agent Profile Redesign

**Target Files:**
- `frontend/app/agent/[id]/page.tsx`
- `frontend/components/features/agent/AgentProfile.tsx`
- `frontend/components/features/agent/AgentStats.tsx`

### C8-1. AgentProfile Glass Hero Card

```tsx
export function AgentProfile({ agent }: AgentProfileProps) {
  return (
    <div className="glass rounded-2xl p-8 flex flex-col items-center text-center gap-4">
      <Avatar className="w-24 h-24 ring-2 ring-accent shadow-[0_0_20px_rgba(6,182,212,0.4)]">
        <AvatarImage src={agent.avatarUrl} alt={agent.name} />
        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-background text-2xl font-bold">
          {agent.name.charAt(0)}
        </AvatarFallback>
      </Avatar>

      <div>
        <h1 className="font-heading text-2xl font-bold">{agent.name}</h1>
        <p className="text-muted-foreground mt-2 max-w-lg">{agent.description}</p>
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {agent.skills.map((skill) => (
          <Badge key={skill} variant="secondary" className="bg-accent/10 text-accent border-accent/20">
            {skill}
          </Badge>
        ))}
      </div>
    </div>
  );
}
```

### C8-2. SBT Badge Tier-Based Glow

```tsx
const tierGlows: Record<string, string> = {
  gold: "bg-yellow-500/10 border-yellow-500/30 shadow-[0_0_12px_rgba(234,179,8,0.15)]",
  silver: "bg-gray-400/10 border-gray-400/30 shadow-[0_0_12px_rgba(156,163,175,0.15)]",
  bronze: "bg-orange-500/10 border-orange-500/30 shadow-[0_0_12px_rgba(249,115,22,0.15)]",
};

{agent.sbtBadges.map((badge) => (
  <Badge
    key={badge.id}
    variant="outline"
    className={`text-sm px-3 py-1.5 ${tierGlows[badge.tier]}`}
  >
    {badge.tier === "gold" && <Trophy className="w-4 h-4 inline text-yellow-400 mr-1" />}
    {badge.tier === "silver" && <Medal className="w-4 h-4 inline text-gray-300 mr-1" />}
    {badge.tier === "bronze" && <Award className="w-4 h-4 inline text-orange-400 mr-1" />}
    {badge.name}
  </Badge>
))}
```

### C8-3. Completed Tasks Cards Glass

```tsx
{completedTasks.map((task) => (
  <div key={task.id} className="glass rounded-xl p-4 flex items-center justify-between">
    <div>
      <p className="font-medium text-sm">{task.title}</p>
      <p className="text-xs text-muted-foreground mt-1">
        {task.category} • {task.budget.toLocaleString()} FORGE
      </p>
    </div>
    <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
      Completed
    </Badge>
  </div>
))}
```

---

## C9. Footer Redesign

**Target File:** `frontend/components/layout/Footer.tsx`

### Changes
- Glassmorphism background
- Text links replaced with lucide social icons
- Top border removed in favor of glass separation

```tsx
import { Github, FileText, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto">
      <div className="glass border-t border-white/[0.06] py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            &copy; 2026 TaskForge
          </p>
          <div className="flex gap-4">
            <a
              href="#"
              className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center
                         text-muted-foreground hover:text-foreground hover:bg-white/10
                         transition-all duration-200"
              aria-label="GitHub"
            >
              <Github className="w-4 h-4" />
            </a>
            <a
              href="#"
              className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center
                         text-muted-foreground hover:text-foreground hover:bg-white/10
                         transition-all duration-200"
              aria-label="Docs"
            >
              <FileText className="w-4 h-4" />
            </a>
            <a
              href="#"
              className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center
                         text-muted-foreground hover:text-foreground hover:bg-white/10
                         transition-all duration-200"
              aria-label="Twitter"
            >
              <Twitter className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
```

---

## C10. Common Improvements

### C10-1. Skeleton Loader Component

**New File:** `frontend/components/ui/skeleton.tsx`

```tsx
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("skeleton", className)} />;
}

// Card skeleton
export function CardSkeleton() {
  return (
    <div className="glass rounded-xl p-6 space-y-4">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  );
}

// Stat card skeleton
export function StatSkeleton() {
  return (
    <div className="glass rounded-xl p-6">
      <Skeleton className="h-3 w-20 mb-2" />
      <Skeleton className="h-8 w-16" />
    </div>
  );
}
```

### C10-2. Button Hover Enhancement

Add to `globals.css`:

```css
/* === Button Hover Enhancement === */
.btn-hover-lift {
  transition: all 0.2s ease;
}
.btn-hover-lift:hover {
  transform: scale(1.02);
}
.btn-hover-lift:active {
  transform: scale(0.98);
}
```

Apply to:
- Landing CTA buttons
- Arena Vote button
- ProposalForm Submit button
- Dashboard ConnectButton area

### C10-3. Card Hover Border Glow Transition

Already included in `.card-hover-glow` (updated to cyan in C1-5).
Additional status-based glows for specific components:

| Component | Hover Border Color |
|-----------|-------------------|
| RoundCard | Per-status (see C5-1) |
| RequestCard | accent (cyan) |
| Dashboard cards | accent (cyan) |
| EntryCard (winner) | amber |

### C10-4. Responsive Verification Breakpoints

| Breakpoint | Width | Verification Target |
|------------|-------|---------------------|
| Mobile | 375px | Hero stacks vertically, single-column cards, sidebar collapses |
| Tablet | 768px | Hero horizontal layout, 2-column cards, sidebar visible |
| Desktop | 1440px | 3-column cards, full width utilization |

### Responsive Notes

- Hero section: `flex-col md:flex-row` (mobile: text top + image bottom)
- Arena grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Market: On mobile, collapse FilterSidebar into `<Sheet>` or accordion
- Stats section: On mobile `flex-col gap-4` for vertical card stack
- Footer: `flex-col md:flex-row`

---

## C11. Verification Checklist

| # | Check Item | Verification Method |
|---|-----------|-------------------|
| 1 | globals.css variables all applied | Verify `--background`, `--accent`, `--card`, `--border` values |
| 2 | `.glass` class functional | Confirm backdrop-blur applied to cards |
| 3 | `.glow-cyan` functional | Cyan glow box-shadow visible |
| 4 | `.bg-gradient-hero` functional | Hero section background gradient visible |
| 5 | `.skeleton` shimmer functional | Skeleton component animation working |
| 6 | Circuit pattern displayed | Grid pattern visible on hero section |
| 7 | Zero emojis remaining | `grep -rn "[\x{1F300}-\x{1F9FF}]" frontend/app frontend/components` returns 0 results |
| 8 | Lucide icons rendering | SVG icons displayed at all former emoji positions |
| 9 | Hero left-right layout | Text left + image right at md and above |
| 10 | Navbar glass + indicator | Amber bar below active link |
| 11 | RoundCard glass + status glow | Per-status hover glow working |
| 12 | TopicCard progress bar | Bar width changes with vote proportion |
| 13 | EntryCard winner glow | Winner card has amber glow |
| 14 | RequestCard glass + category icons | Lucide icons + glass card |
| 15 | FilterSidebar custom styles | Custom UI instead of native inputs |
| 16 | ProposalForm glass wrapper | Glass background around form |
| 17 | StatCard glass + icon background | Accent background icon box |
| 18 | AgentProfile glass card | Profile card with glass applied |
| 19 | SBT badge tier-based glow | gold/silver/bronze glow differentiation |
| 20 | Footer glass + lucide icons | Social icons as SVG + glass background |
| 21 | Mobile (375px) normal | Hero stacks vertically, single-column cards |
| 22 | Tablet (768px) normal | Horizontal layout, 2-column cards |
| 23 | Desktop (1440px) normal | 3-column cards, full width |
| 24 | `npm run build` 0 errors | Build succeeds |
| 25 | Functionality unchanged | Voting, proposals, filters, modals all work as before |

---

## File Summary

### New Files (1)

| File | Description |
|------|-------------|
| `frontend/components/ui/skeleton.tsx` | Skeleton loader component |

### Modified Files (15+)

| File | Changes | Section |
|------|---------|---------|
| `frontend/app/globals.css` | Color vars, glass, glow-cyan, gradient, skeleton, circuit | C1 |
| `frontend/app/page.tsx` | Hero left-right layout, glass cards, lucide icons | C2, C3 |
| `frontend/app/arena/page.tsx` | Modal glass-strong | C5 |
| `frontend/app/market/page.tsx` | Glass application (if needed) | C6 |
| `frontend/app/market/[id]/page.tsx` | Proposal cards glass | C6 |
| `frontend/app/dashboard/page.tsx` | Lucide icons, glass cards | C2, C7 |
| `frontend/app/agent/[id]/page.tsx` | Lucide icons, badge glow | C2, C8 |
| `frontend/components/layout/Navbar.tsx` | Glass, active indicator | C4 |
| `frontend/components/layout/Footer.tsx` | Glass, lucide icons | C9 |
| `frontend/components/features/common/StatCard.tsx` | Glass, icon background | C7 |
| `frontend/components/features/agent/AgentProfile.tsx` | Glass hero card | C8 |
| `frontend/components/features/agent/AgentStats.tsx` | Lucide icons | C2 |
| `frontend/components/features/arena/RoundCard.tsx` | Glass, status glow | C5 |
| `frontend/components/features/arena/TopicCard.tsx` | Progress bar | C5 |
| `frontend/components/features/arena/TopicVoteButton.tsx` | Cyan glow | C5 |
| `frontend/components/features/arena/EntryCard.tsx` | Glass, winner glow | C5 |
| `frontend/components/features/market/RequestCard.tsx` | Glass, category icons | C6 |
| `frontend/components/features/market/FilterSidebar.tsx` | Custom radio/checkbox | C6 |
| `frontend/components/features/market/ProposalForm.tsx` | Glass wrapper | C6 |

---

## Estimated Time

| Task | Est. Time |
|------|-----------|
| C1 globals.css | 20 min |
| C2 Emoji replacement | 15 min |
| C3 Landing redesign | 30 min |
| C4 Navbar | 10 min |
| C5 Arena (4 components) | 25 min |
| C6 Market (3 components) | 25 min |
| C7 Dashboard | 15 min |
| C8 Agent | 15 min |
| C9 Footer | 10 min |
| C10 Common (skeleton etc.) | 15 min |
| C11 Verification | 15 min |
| **Total** | **~3 hours** |

---

## Phase Dependencies

- Phase D (Admin) is recommended after Phase C (Admin will also use glass theme)
- Phase A (Supabase) is independent of Phase C (can run in parallel)
- Phase B (Contract deployment) is independent of Phase C (can run in parallel)
