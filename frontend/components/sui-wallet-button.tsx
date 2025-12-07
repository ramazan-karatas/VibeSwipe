"use client";

import { useEffect, useRef } from "react";
import { ConnectButton, useWallet } from "@suiet/wallet-kit";

type Props = {
  onConnect: (address: string) => void;
};

export function SuiWalletButton({ onConnect }: Props) {
  const { connected, account, status } = useWallet();
  const lastAddressRef = useRef<string | null>(null);

  useEffect(() => {
    const addr = account?.address;
    if (connected && addr && lastAddressRef.current !== addr) {
      lastAddressRef.current = addr;
      onConnect(addr);
    }
    if (!connected) {
      lastAddressRef.current = null;
    }
  }, [account?.address, connected, onConnect]);

  const shortAddress =
    account?.address && account.address.length > 10
      ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}`
      : account?.address;

  return (
    <div className="space-y-2">
      <ConnectButton
        className="cta py-3 text-sm rounded-lg flex items-center justify-center"
        label={connected && shortAddress ? `Connected · ${shortAddress}` : "Connect Suiet Wallet"}
      />
      <p className="text-xs text-[var(--muted)] text-center">
        {connected && shortAddress
          ? "Wallet linked. Proceeding to VibeSwipe."
          : status === "connecting"
            ? "Awaiting wallet confirmation..."
            : "Securely connect with Suiet Wallet Kit."}
      </p>
    </div>
  );
}
