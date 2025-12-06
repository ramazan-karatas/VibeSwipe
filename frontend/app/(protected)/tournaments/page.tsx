"use client";

import Link from "next/link";
import { useAuth } from "../../auth-context";
import { useEffect, useState } from "react";
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
    <main className="space-y-4">
      <header>
        <p className="text-xs uppercase tracking-wide text-slate-500">Welcome</p>
        <h1 className="text-2xl font-semibold text-slate-900">Tournaments</h1>
        <p className="text-xs text-slate-500">
          Signed in as <span className="font-mono">{userAddress}</span>
        </p>
      </header>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-sm text-slate-600">
          Loading tournaments...
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {!loading && !error && tournaments.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-sm text-slate-600">
          No tournaments yet.
        </div>
      )}

      <div className="space-y-3">
        {tournaments.map((t) => (
          <div
            key={t.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Tournament #{t.id}</p>
                <p className="text-xs text-slate-500">
                  Entry fee {t.entryFee} · Duration {t.duration}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                {t.status}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
              <p>{t.participants} participants</p>
              <Link href={`/tournaments/${t.id}`} className="text-slate-900 underline">
                View
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
