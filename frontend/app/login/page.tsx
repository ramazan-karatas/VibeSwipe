"use client";

import { useRouter } from "next/navigation";
import { ZkLoginButton } from "../../components/zklogin-button";
import { useAuth } from "../auth-context";
import Link from "next/link";
import { useEffect } from "react";
import { SuiWalletButton } from "../../components/sui-wallet-button";

export default function LoginPage() {
  const { isAuthenticated, login, userAddress } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/tournaments");
    }
  }, [isAuthenticated, router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
      <div className="panel-strong w-full max-w-md rounded-2xl p-8 border border-[var(--border-strong)]">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black tracking-tighter text-[var(--text)] mb-2">
            VIBE<span className="text-[var(--accent)]">SWIPE</span>
          </h1>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--muted)]">
            Prediction Protocol
          </p>
        </div>

        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold text-[var(--text)]">Identify Yourself</h2>
            <p className="text-sm text-[var(--muted)]">
              Connect a Sui wallet or use zkLogin to access the prediction markets.
            </p>
          </div>

          <SuiWalletButton
            onConnect={(addr) => {
              login(addr, "wallet");
              router.replace("/tournaments");
            }}
          />

          <div className="text-center text-[var(--muted)] text-xs uppercase tracking-[0.2em]">Or</div>

          <ZkLoginButton
            onSuccess={(addr) => {
              login(addr, "zkLogin");
              router.replace("/tournaments");
            }}
          />
          
          {userAddress && (
            <div className="mt-4 p-3 rounded border border-[var(--border)] bg-[var(--bg-card)] text-center">
              <p className="text-xs text-[var(--muted)] uppercase tracking-wider mb-1">Last Session</p>
              <p className="font-mono text-[var(--text)] text-xs truncate">{userAddress}</p>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-[var(--border)]">
          <p className="text-xs text-center text-[var(--muted)] mb-4">
            <span className="inline-block w-2 h-2 rounded-full bg-[var(--accent)] mr-2 animate-pulse"></span>
            Prototype Mode: Mock Interface Active
          </p>
        </div>
      </div>
    </main>
  );
}
