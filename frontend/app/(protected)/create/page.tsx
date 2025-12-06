"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../../auth-context";
import { createTournament } from "../../../lib/api";

export default function CreatePage() {
  const { userAddress } = useAuth();
  const router = useRouter();
  const [entryFee, setEntryFee] = useState("");
  const [duration, setDuration] = useState("15m");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const created = await createTournament(entryFee, duration);
      router.push(`/tournaments/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create tournament");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-wide text-slate-500">Create</p>
        <h1 className="text-2xl font-semibold text-slate-900">New Tournament</h1>
        <p className="text-xs text-slate-500">
          Creator: <span className="font-mono">{userAddress}</span>
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800">Entry fee</label>
          <input
            value={entryFee}
            onChange={(e) => setEntryFee(e.target.value)}
            placeholder="e.g. 2 SUI"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800">Duration</label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
          >
            <option value="15m">15 minutes</option>
            <option value="1h">1 hour</option>
            <option value="4h">4 hours</option>
            <option value="24h">24 hours</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-slate-800 transition disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? "Creating..." : "Create tournament"}
        </button>
        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}
      </form>
    </main>
  );
}
