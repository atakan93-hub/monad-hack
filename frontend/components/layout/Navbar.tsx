"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const navLinks = [
  { href: "/arena", label: "Arena" },
  { href: "/market", label: "Market" },
  { href: "/dashboard", label: "Dashboard" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 w-full z-40 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="font-heading text-xl font-bold tracking-tight">
          Task<span className="text-primary">Forge</span>
        </Link>

        {/* Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm transition-colors ${
                pathname === href || pathname?.startsWith(href + "/")
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Wallet connection */}
        <ConnectButton chainStatus="icon" accountStatus="avatar" showBalance={false} />
      </div>
    </nav>
  );
}
