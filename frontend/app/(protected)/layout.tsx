"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../auth-context";
import { BottomNav } from "../../components/bottom-nav";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="mx-auto max-w-md px-4 py-6">{children}</div>
      <BottomNav />
    </div>
  );
}
