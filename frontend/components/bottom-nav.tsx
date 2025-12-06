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
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between px-6 py-3 text-sm font-medium text-slate-600">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 text-center transition ${
                active ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <div
                className={`mx-auto w-fit rounded-full px-3 py-1 ${
                  active ? "bg-slate-100 text-slate-900" : ""
                }`}
              >
                {tab.label}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
