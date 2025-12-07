"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/tournaments", label: "Tournaments" },
  { href: "/create", label: "Create" },
  { href: "/profile", label: "Profile" }
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 z-50 pointer-events-none"
      style={{
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 14px)"
      }}
    >
      <div className="mx-auto w-[min(96%,420px)] pointer-events-auto panel rounded-full px-3 py-2 flex items-center justify-between shadow-[0_15px_30px_rgba(0,0,0,0.35)] bg-[rgba(12,16,34,0.92)] border-[var(--border-strong)]">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative px-4 py-2 transition-all duration-300 ${
                active
                  ? "text-[var(--accent)] scale-110 font-semibold"
                  : "text-[var(--muted)] hover:text-[var(--text)] hover:scale-105"
              }`}
            >
              <span className="text-[11px] uppercase tracking-[0.16em]">{tab.label}</span>
              {active && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--accent)] shadow-[0_0_10px_rgba(125,243,192,0.8)]"></span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
