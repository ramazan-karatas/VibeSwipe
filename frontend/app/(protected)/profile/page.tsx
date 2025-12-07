"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../auth-context";
import { fetchProfile, fetchTournaments, Profile, Tournament } from "../../../lib/api";
import { useAccountBalance, useWallet } from "@suiet/wallet-kit";

export default function ProfilePage() {
  const { userAddress, logout } = useAuth();
  const { connected, account, name: walletName, chain } = useWallet();
  const { balance, loading: balanceLoading, error: balanceError } = useAccountBalance();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tournamentMap, setTournamentMap] = useState<Record<string, Tournament>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!userAddress) return;
      try {
        setLoading(true);
        const data = await fetchProfile(userAddress);
        setProfile(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userAddress]);

  // Load tournaments so we can display names/details for joined items.
  useEffect(() => {
    const loadTournaments = async () => {
      try {
        const data = await fetchTournaments();
        const map: Record<string, Tournament> = {};
        data.forEach((t) => {
          map[String(t.id)] = t;
        });
        setTournamentMap(map);
      } catch {
        // If it fails, we still show ids.
      }
    };
    loadTournaments();
  }, []);

  const formattedBalance =
    balance !== undefined ? (Number(balance) / 1_000_000_000).toLocaleString(undefined, { maximumFractionDigits: 4 }) : null;

  const displayAddress = (addr?: string | null) => {
    if (!addr) return "—";
    return addr.length > 14 ? `${addr.slice(0, 8)}...${addr.slice(-6)}` : addr;
  };

  return (
    <main className="space-y-6 max-w-2xl mx-auto w-full">
      <header className="panel-strong p-5 sm:p-6 space-y-2">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">Profile</p>
        <h1 className="text-3xl font-semibold text-[var(--text)]">Your account</h1>
        <p className="text-sm text-[var(--muted)] break-words">
          Address:{" "}
          <span className="font-mono text-[var(--text)] break-all text-xs" title={userAddress ?? ""}>
            {displayAddress(userAddress)}
          </span>
        </p>
      </header>

      <div className="panel p-4 sm:p-5 space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-[var(--text)]">Wallet</p>
          <span
            className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${
              connected
                ? "border-emerald-300/50 bg-emerald-900/30 text-emerald-100"
                : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--muted)]"
            }`}
          >
            {connected ? "Connected" : "Disconnected"}
          </span>
        </div>
        <div className="text-xs text-[var(--muted)] space-y-1 break-words">
          <p>Wallet: {walletName || "Not detected"}</p>
          <p>Network: {chain?.name || chain?.id || "Unknown"}</p>
          <p>
            Account:{" "}
            <span className="font-mono break-all text-[var(--text)]" title={account?.address ?? ""}>
              {displayAddress(account?.address)}
            </span>
          </p>
        </div>
        <div className="mt-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)]">
          <p className="text-xs text-[var(--muted)] uppercase tracking-[0.12em]">Current SUI balance</p>
          <p className="text-base font-semibold">
            {balanceLoading ? "Loading..." : balanceError ? "Unable to fetch" : formattedBalance !== null ? `${formattedBalance} SUI` : "—"}
          </p>
        </div>
      </div>

      {loading && (
        <div className="panel p-4 text-sm text-[var(--muted)]">Loading profile...</div>
      )}

      {error && (
        <div className="panel p-4 border border-rose-300/30 bg-rose-900/40 text-sm text-rose-100">{error}</div>
      )}

      {!loading && !error && profile && (
        <>
          <div className="panel p-4 sm:p-5">
            <p className="text-sm font-semibold text-[var(--text)]">Joined tournaments</p>
            <div className="mt-3 space-y-2">
              {profile.joinedTournaments.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">You have not joined any tournaments yet.</p>
              ) : (
                profile.joinedTournaments.map((t) => (
                  <div
                    key={t.id}
                    className="flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-[var(--text)]">
                        {tournamentMap[t.id]?.name || `Tournament #${t.id}`}
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        {tournamentMap[t.id]?.entryFee ? `Entry: ${tournamentMap[t.id].entryFee}` : null}
                        {tournamentMap[t.id]?.duration ? ` · Duration: ${tournamentMap[t.id].duration}` : null}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-2 py-1 text-[11px] text-[var(--muted)]">
                        {t.status}
                      </span>
                      <a
                        href={`/tournaments/${t.id}`}
                        className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] transition"
                      >
                        View
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      <button type="button" onClick={logout} className="cta-ghost w-full max-w-2xl mx-auto">
        Log out
      </button>
    </main>
  );
}
