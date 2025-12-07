"use client";

import { ReactNode } from "react";
import { WalletProvider } from "@suiet/wallet-kit";
import { AuthProvider } from "./auth-context";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <WalletProvider autoConnect>
      <AuthProvider>{children}</AuthProvider>
    </WalletProvider>
  );
}
