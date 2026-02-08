"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ProfileDropdown } from "@/components/layout/ProfileDropdown";
import { useAdminCheck } from "@/lib/hooks/useAdminCheck";

const navLinks = [
  { href: "/arena", label: "Arena" },
  { href: "/market", label: "Market" },
  { href: "/dashboard", label: "Dashboard" },
];

export function Navbar() {
  const pathname = usePathname();
  const { isAdmin } = useAdminCheck();

  return (
    <nav className="fixed top-0 w-full z-40 glass border-b border-white/[0.06]"
         style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-heading text-xl font-bold tracking-tight
                     transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]"
        >
          <div className="w-8 h-8 rounded-lg overflow-hidden relative shrink-0">
            <Image
              src="/logo.webp"
              alt="TaskForge"
              width={56}
              height={56}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            />
          </div>
          <div className="flex items-center text-2xl">
            <span>Task</span>
            <span className="text-primary">Forge</span>
          </div>
        </Link>

        {/* Navigation */}
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

          {isAdmin && (() => {
            const isActive = pathname === "/admin";
            return (
              <Link
                href="/admin"
                className={`relative text-sm transition-colors py-1 ${
                  isActive
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Admin
                {isActive && (
                  <span className="absolute -bottom-[1.125rem] left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </Link>
            );
          })()}
        </div>

        {/* Wallet connection */}
        <ProfileDropdown />
      </div>
    </nav>
  );
}
