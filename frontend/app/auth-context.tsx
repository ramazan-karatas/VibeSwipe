"use client";

import { createContext, useCallback, useContext, useMemo, useState, ReactNode, useEffect } from "react";

type AuthContextValue = {
  userAddress: string | null;
  isAuthenticated: boolean;
  login: (address?: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userAddress, setUserAddress] = useState<string | null>(null);

  // Restore session from localStorage to keep dev experience smoother.
  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("vibeswipe:user") : null;
    if (saved) {
      setUserAddress(saved);
    }
  }, []);

  const login = useCallback((address?: string) => {
    const addr = address ?? `0x${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    setUserAddress(addr);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("vibeswipe:user", addr);
    }
  }, []);

  const logout = useCallback(() => {
    setUserAddress(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("vibeswipe:user");
    }
  }, []);

  const value = useMemo(
    () => ({
      userAddress,
      isAuthenticated: Boolean(userAddress),
      login,
      logout
    }),
    [userAddress, login, logout]
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
