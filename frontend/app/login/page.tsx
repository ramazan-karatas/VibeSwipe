"use client";

import { useRouter } from "next/navigation";
import { ZkLoginButton } from "../../components/zklogin-button";
import { useAuth } from "../auth-context";
import Link from "next/link";
import { useEffect } from "react";

export default function LoginPage() {
  const { isAuthenticated, login, userAddress } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/tournaments");
    }
  }, [isAuthenticated, router]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 px-6 py-10">
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm uppercase tracking-wide text-slate-500">VibeSwipe</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Log in with zkLogin</h1>
        <p className="mt-3 text-sm text-slate-600">
          Use zkLogin to get a Sui-compatible address and enter prediction tournaments.
        </p>

        <div className="mt-6 space-y-3">
          <ZkLoginButton
            onSuccess={(addr) => {
              login(addr);
              router.replace("/tournaments");
            }}
          />
          {userAddress ? (
            <p className="text-xs text-slate-500">
              Last session: <span className="font-mono">{userAddress}</span>
            </p>
          ) : null}
        </div>

        <p className="mt-6 text-xs text-slate-500">
          Prototype mode: zkLogin is mocked. We will swap in real Sui zkLogin once backend wiring lands.
        </p>

        <div className="mt-4 text-xs text-slate-500">
          <Link href="/" className="underline">
            Back to landing
          </Link>
        </div>
      </div>
    </main>
  );
}
