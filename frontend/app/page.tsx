"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-context";

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/tournaments");
    } else {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="panel max-w-md rounded-xl p-6 text-center">
        <div className="animate-pulse text-[var(--accent)] font-bold tracking-widest">VIBESWIPE</div>
        <p className="text-sm font-medium text-[var(--muted)] mt-2">Initializing Sequence...</p>
      </div>
    </main>
  );
}
