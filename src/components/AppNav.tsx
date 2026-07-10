"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

// TEMPORARY — role comes from a dev toggle until real auth is wired in.
// Once connected, this becomes: const { role } = useSession(); and the
// toggle below goes away entirely.
type Role = "owner" | "manager" | "staff";

const links: { href: string; label: string; roles: Role[] }[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    roles: ["owner", "manager", "staff"],
  },
  { href: "/stock", label: "Stock", roles: ["owner", "manager", "staff"] },
  {
    href: "/sales/new",
    label: "Record Sale",
    roles: ["owner", "manager", "staff"],
  },
  {
    href: "/customers",
    label: "Customers",
    roles: ["owner", "manager", "staff"],
  },
  { href: "/expenses/new", label: "Expenses", roles: ["owner"] },
  { href: "/reports", label: "Reports", roles: ["owner"] },
  { href: "/staff", label: "Staff", roles: ["owner"] },
  { href: "/activity-log", label: "Activity Log", roles: ["owner"] },
];

export function AppNav() {
  const pathname = usePathname();
  const [role, setRole] = useState<Role>("owner");

  const visibleLinks = links.filter((l) => l.roles.includes(role));

  return (
    <div className="bg-forest border-b border-black/10">
      <div className="max-w-5xl mx-auto px-3 flex items-center justify-between overflow-x-auto">
        <nav className="flex gap-1">
          {visibleLinks.map((link) => {
            const active =
              pathname === link.href || pathname?.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-3 text-sm font-medium whitespace-nowrap ${
                  active
                    ? "bg-gold text-charcoal"
                    : "text-cream opacity-80 hover:opacity-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Dev-only role switcher — remove once real sessions exist */}
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="text-xs bg-forest text-cream border border-cream/30 rounded px-2 py-1 ml-2"
        >
          <option value="owner">Preview: Owner</option>
          <option value="manager">Preview: Manager</option>
          <option value="staff">Preview: Staff</option>
        </select>
      </div>
    </div>
  );
}
