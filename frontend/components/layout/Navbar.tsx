"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ProfileDropdown } from "@/components/layout/ProfileDropdown";
import { ExternalLink, Menu, X } from "lucide-react";
import { AgentSearch } from "@/components/features/common/AgentSearch";

const navLinks = [
  { href: "/arena", label: "Arena" },
  { href: "/market", label: "Market" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      className="fixed top-0 w-full z-40 bg-[#0a0a12]/80 border-b border-cyan-500/10"
      style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 sm:gap-3 font-heading text-xl font-bold tracking-tight
                     transition-[filter,transform] duration-300 hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.4)] group shrink-0"
        >
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center">
            <div className="absolute inset-0 border-2 border-cyan-500/50 rotate-45 rounded-sm
                            group-hover:border-cyan-400/70 transition-colors" />
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-sm overflow-hidden relative shrink-0">
              <Image
                src="/logo.webp"
                alt="TaskForge"
                width={56}
                height={56}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              />
            </div>
          </div>
          <div className="hidden sm:flex items-center text-xl">
            <span className="text-foreground/60">Task</span>
            <span className="text-primary font-bold">Forge</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label }) => {
            const isActive = pathname === href || pathname?.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 lg:px-4 py-1.5 text-sm tracking-wide transition-colors duration-200 ${
                  isActive
                    ? "cyber-nav-active font-medium"
                    : "text-muted-foreground cyber-nav-idle"
                }`}
              >
                {label}
              </Link>
            );
          })}

          <a
            href="https://nad.fun/tokens/0x7A403F18Dd87C14d712C60779FDfB7F1c7697777"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 lg:px-4 py-1.5 text-sm tracking-wide transition-colors duration-200 text-amber-400 hover:text-amber-300 flex items-center gap-1.5"
          >
            Buy FORGE
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

        </div>

        {/* Agent Search — desktop only */}
        <div className="hidden lg:block w-56 xl:w-64 shrink-0">
          <AgentSearch />
        </div>

        {/* Right side: wallet + hamburger */}
        <div className="flex items-center gap-2 shrink-0">
          <ProfileDropdown />

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg
                       text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/[0.06] bg-[#0a0a12]/95"
             style={{ backdropFilter: "blur(20px)" }}>
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(({ href, label }) => {
              const isActive = pathname === href || pathname?.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                    isActive
                      ? "bg-cyan-500/10 text-cyan-400 font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  {label}
                </Link>
              );
            })}

            <a
              href="https://nad.fun/tokens/0x7A403F18Dd87C14d712C60779FDfB7F1c7697777"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-amber-400 hover:bg-white/5 transition-colors"
            >
              Buy FORGE
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

          </div>

          {/* Mobile search */}
          <div className="px-4 pb-4">
            <AgentSearch />
          </div>
        </div>
      )}
    </nav>
  );
}
