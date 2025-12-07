"use client";

import { useWallet } from "@suiet/wallet-kit";
import { createContext, useCallback, useContext, useMemo, useState, ReactNode, useEffect } from "react";

type AuthSource = "wallet" | "zkLogin" | "mock";

type AuthSession = {
  address: string;
  source: AuthSource;
};

type AuthContextValue = {
  userAddress: string | null;
  authSource: AuthSource | null;
  isAuthenticated: boolean;
  login: (address?: string, source?: AuthSource) => void;
  logout: () => void;
};

const STORAGE_KEY = "vibeswipe:user";
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { connected, account, disconnect } = useWallet();
  const [session, setSession] = useState<AuthSession | null>(null);

  // Restore session from localStorage to keep dev experience smoother.
  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as AuthSession | string;
      if (typeof parsed === "string") {
        setSession({ address: parsed, source: "mock" });
      } else if (parsed?.address) {
        setSession(parsed);
      }
    } catch {
      setSession({ address: saved, source: "mock" });
    }
  }, []);

  const persistSession = useCallback((next: AuthSession | null) => {
    if (typeof window === "undefined") return;
    if (next) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const login = useCallback(
    (address?: string, source: AuthSource = "mock") => {
      const addr = address ?? `0x${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
      const nextSession: AuthSession = { address: addr, source };
      setSession(nextSession);
      persistSession(nextSession);
    },
    [persistSession]
  );

  const logout = useCallback(() => {
    const shouldDisconnect = session?.source === "wallet" && connected;
    if (shouldDisconnect) {
      disconnect().catch(() => undefined);
    }
    setSession(null);
    persistSession(null);
  }, [connected, disconnect, persistSession, session?.source]);

  // Keep React auth state in sync with Suiet wallet connection lifecycle.
  useEffect(() => {
    const walletAddress = account?.address;
    if (connected && walletAddress) {
      if (session?.address === walletAddress && session.source === "wallet") return;
      const walletSession: AuthSession = { address: walletAddress, source: "wallet" };
      setSession(walletSession);
      persistSession(walletSession);
    } else if (!connected && session?.source === "wallet") {
      setSession(null);
      persistSession(null);
    }
  }, [account?.address, connected, persistSession, session]);

  const value = useMemo(
    () => ({
      userAddress: session?.address ?? null,
      authSource: session?.source ?? null,
      isAuthenticated: Boolean(session?.address),
      login,
      logout
    }),
    [session, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
