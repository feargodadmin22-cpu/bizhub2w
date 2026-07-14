"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

type Role = "owner" | "manager" | "staff";

const links: { href: string; label: string; roles: Role[] }[] = [
  { href: "/dashboard", label: "Dashboard", roles: ["owner", "manager", "staff"] },
  { href: "/stock", label: "Stock", roles: ["owner", "manager", "staff"] },
  { href: "/sales/new", label: "Record Sale", roles: ["owner", "manager", "staff"] },
  { href: "/sales/history", label: "Sales History", roles: ["owner", "manager"] },
  { href: "/customers", label: "Customers", roles: ["owner", "manager", "staff"] },
  { href: "/expenses/new", label: "Expenses", roles: ["owner"] },
  { href: "/expenses/history", label: "Expense History", roles: ["owner"] },
  { href: "/reports", label: "Reports", roles: ["owner"] },
  { href: "/staff", label: "Staff", roles: ["owner"] },
  { href: "/activity-log", label: "Activity Log", roles: ["owner"] },
];

export function AppNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const role = ((session?.user as any)?.role as Role) ?? "staff";
  const userName = session?.user?.name ?? "";
  const visibleLinks = links.filter((l) => l.roles.includes(role));

  return (
    <div className="bg-forest border-b border-black/10 relative">
      <div className="max-w-5xl mx-auto px-3 flex items-center justify-between">
        <nav className="hidden md:flex gap-1 overflow-x-auto">
          {visibleLinks.map((link) => {
            const active = pathname === link.href || pathname?.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-3 text-sm font-medium whitespace-nowrap ${
                  active ? "bg-gold text-charcoal" : "text-cream opacity-80 hover:opacity-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="md:hidden p-3 text-cream"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen ? (
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            ) : (
              <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
            )}
          </svg>
        </button>

        <div className="hidden md:flex items-center gap-3">
          <span className="text-sm text-cream opacity-90">
            {userName} <span className="opacity-60 capitalize">({role})</span>
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-xs text-cream opacity-70 hover:opacity-100 underline"
          >
            Log out
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="md:hidden bg-forest border-t border-cream/10 px-3 pb-3">
          {visibleLinks.map((link) => {
            const active = pathname === link.href || pathname?.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-3 text-sm font-medium rounded ${
                  active ? "bg-gold text-charcoal" : "text-cream opacity-80"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="px-3 py-3 text-sm text-cream opacity-90 border-t border-cream/10 mt-2">
            {userName} <span className="opacity-60 capitalize">({role})</span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="block w-full text-left px-3 py-2 text-sm text-cream opacity-70"
          >
            Log out
          </button>
        </nav>
      )}
    </div>
  );
}