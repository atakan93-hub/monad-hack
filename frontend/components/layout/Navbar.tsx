"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ProfileDropdown } from "@/components/layout/ProfileDropdown";
import { useAdminCheck } from "@/lib/hooks/useAdminCheck";
import { ExternalLink } from "lucide-react";

const navLinks = [
  { href: "/arena", label: "Arena" },
  { href: "/market", label: "Market" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export function Navbar() {
  const pathname = usePathname();
  const { isAdmin } = useAdminCheck();

  return (
    <nav
      className="fixed top-0 w-full z-40 bg-[#0a0a12]/80 border-b border-cyan-500/10"
      style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 font-heading text-xl font-bold tracking-tight
                     transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.4)] group"
        >
          <div className="relative w-10 h-10 flex items-center justify-center">
            <div className="absolute inset-0 border-2 border-cyan-500/50 rotate-45 rounded-sm
                            group-hover:border-cyan-400/70 transition-colors" />
            <div className="w-7 h-7 rounded-sm overflow-hidden relative shrink-0">
              <Image
                src="/logo.webp"
                alt="TaskForge"
                width={56}
                height={56}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              />
            </div>
          </div>
          <div className="flex items-center text-xl">
            <span className="text-foreground/60">Task</span><span className="text-primary font-bold">Forge</span>
          </div>
        </Link>

        {/* Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label }) => {
            const isActive = pathname === href || pathname?.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`px-4 py-1.5 text-sm tracking-wide transition-all duration-200 ${
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
            className="px-4 py-1.5 text-sm tracking-wide transition-all duration-200 text-amber-400 hover:text-amber-300 flex items-center gap-1.5"
          >
            Buy FORGE
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {isAdmin && (() => {
            const isActive = pathname === "/admin";
            return (
              <Link
                href="/admin"
                className={`px-4 py-1.5 text-sm tracking-wide transition-all duration-200 ${
                  isActive
                    ? "cyber-nav-active font-medium"
                    : "text-muted-foreground cyber-nav-idle"
                }`}
              >
                Admin
              </Link>
            );
          })()}
        </div>

        {/* Tagline */}
        <div className="hidden lg:flex items-center gap-3 text-[11px] tracking-[0.2em] uppercase text-muted-foreground/40 select-none">
          <span className="w-8 h-px bg-gradient-to-r from-transparent to-cyan-500/20" />
          Build · Compete · Earn
          <span className="w-8 h-px bg-gradient-to-l from-transparent to-cyan-500/20" />
        </div>

        {/* Wallet connection */}
        <ProfileDropdown />
      </div>
    </nav>
  );
}
