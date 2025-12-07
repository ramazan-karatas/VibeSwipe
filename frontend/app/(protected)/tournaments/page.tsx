"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "../../auth-context";
import { fetchTournaments, Tournament } from "../../../lib/api";

export default function TournamentsPage() {
  const { userAddress } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchTournaments();
        setTournaments(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <main className="space-y-8 pb-24">
      <header className="panel-strong p-6 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">Live tournaments</p>
            <h1 className="text-3xl font-semibold text-[var(--text)]">
              Pick the right side and climb the board.
            </h1>
          </div>
          <div className="pill">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] shadow-[0_0_10px_rgba(125,243,192,0.8)]"></span>
            <span className="font-mono text-xs">
              {userAddress ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : "Guest"}
            </span>
          </div>
        </div>
      </header>

      {loading && (
        <div className="panel p-6 text-center text-sm text-[var(--muted)]">Loading tournaments...</div>
      )}

      {error && (
        <div className="panel p-6 border border-red-300/30 bg-red-900/30 text-center text-sm text-red-100">
          {error}
        </div>
      )}

      {!loading && !error && tournaments.length === 0 && (
        <div className="panel p-8 text-center text-sm text-[var(--muted)]">No tournaments yet.</div>
      )}

      <div className="card-grid">
        {tournaments.map((t) => (
          <div key={t.id} className="panel-strong p-5 sm:p-6 relative overflow-hidden">
            <div className="absolute inset-0 opacity-0 transition duration-500 hover:opacity-100 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-br from-[rgba(125,243,192,0.06)] via-transparent to-[rgba(244,195,104,0.08)]"></div>
            </div>
            <div className="relative flex items-start justify-between gap-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[var(--accent)] shadow-[0_0_10px_rgba(125,243,192,0.8)]"></span>
                  <h3 className="text-lg font-semibold text-[var(--text)]">{t.name || `Tournament #${t.id}`}</h3>
                </div>
                <div className="flex gap-2 text-[12px] text-[var(--muted)]">
                  <span className="rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1">
                    Entry: <strong className="text-[var(--text)] ml-1">{t.entryFee}</strong>
                  </span>
                  <span className="rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1">
                    Duration: <strong className="text-[var(--text)] ml-1">{t.duration}</strong>
                  </span>
                </div>
              </div>
              <span className="rounded-full border border-[var(--border-strong)] bg-[var(--bg-card-strong)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
                {t.status}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-[var(--muted)]">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-1a6 6 0 00-9-5.197M9 10a4 4 0 100-8 4 4 0 000 8zm0 0v4m0 0H5m4 0h4m1.958 1.621A6 6 0 003 19v1h12"></path>
                </svg>
                {t.participants} joined
              </span>
              <Link
                href={`/tournaments/${t.id}`}
                className="text-[12px] font-semibold text-[var(--accent)] hover:text-[var(--text)] transition"
              >
                View details →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
