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
    <div
      className="shell pb-24 sm:pb-28"
      style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom, 24px))" }}
    >
      <div className="page-wrap">{children}</div>
      <BottomNav />
    </div>
  );
}
