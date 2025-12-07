"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../../auth-context";
import { createTournament } from "../../../lib/api";

export default function CreatePage() {
  const { userAddress } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [entryFee, setEntryFee] = useState("");
  const [duration, setDuration] = useState("15m");
  const [revealTime, setRevealTime] = useState(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    return d.toISOString().slice(0, 16);
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const normalizedName = name.trim() || "Tournament";
      const feeValue = Number(entryFee);
      if (!Number.isFinite(feeValue) || feeValue <= 0) {
        setError("Entry fee must be a positive number");
        return;
      }

      if (!revealTime) {
        setError("Reveal time is required");
        return;
      }
      const parsedReveal = new Date(revealTime);
      if (Number.isNaN(parsedReveal.getTime())) {
        setError("Reveal time is invalid");
        return;
      }
      const minReveal = Date.now() + durationToMs(duration);
      if (parsedReveal.getTime() < minReveal) {
        setError("Reveal time must be after the prediction window ends.");
        return;
      }

      setSubmitting(true);
      setError(null);
      const created = await createTournament(normalizedName, String(feeValue), duration, new Date(revealTime).toISOString());
      router.push(`/tournaments/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create tournament");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="space-y-6 max-w-2xl mx-auto w-full">
      <header className="panel-strong p-5 sm:p-6">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)] mb-2">Create a bracket</p>
        <h1 className="text-3xl font-semibold text-[var(--text)]">Launch a new tournament</h1>
        <p className="text-sm text-[var(--muted)] mt-2 break-words">
          Creator:{" "}
          <span className="font-mono text-[var(--text)] break-all text-xs" title={userAddress ?? ""}>
            {userAddress && userAddress.length > 14 ? `${userAddress.slice(0, 8)}...${userAddress.slice(-6)}` : userAddress}
          </span>
        </p>
      </header>

      <form onSubmit={handleSubmit} className="panel p-5 sm:p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text)]">Tournament name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='Defaults to "Tournament" if left empty'
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text)]">Entry fee</label>
          <input
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            value={entryFee}
            onChange={(e) => setEntryFee(e.target.value)}
            placeholder="e.g. 2.5"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text)]">Duration</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { value: "1m", label: "1 minute" },
              { value: "15m", label: "15 minutes" },
              { value: "1h", label: "1 hour" },
              { value: "4h", label: "4 hours" },
              { value: "24h", label: "24 hours" }
            ].map((opt) => {
              const active = duration === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDuration(opt.value)}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? "border-[var(--accent)] bg-[rgba(125,243,192,0.12)] text-[var(--text)] shadow-[0_8px_20px_rgba(125,243,192,0.18)]"
                      : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--text)]"
                  }`}
                >
                  <span>{opt.label}</span>
                  <span className="text-[10px] uppercase tracking-[0.16em]">{opt.value}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text)]">Reveal time (results)</label>
          <p className="text-xs text-[var(--muted)]">
            Set when results are revealed (must be after the prediction window ends). Pick a time or use a quick preset.
          </p>
          <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-card)] p-3 space-y-3">
            <input
              type="datetime-local"
              value={revealTime}
              onChange={(e) => setRevealTime(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[rgba(255,255,255,0.04)] px-3 py-3 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none shadow-inner"
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: "30m later", addMs: 30 * 60 * 1000 },
                { label: "1h later", addMs: 60 * 60 * 1000 },
                { label: "3h later", addMs: 3 * 60 * 60 * 1000 },
                { label: "Tomorrow", addMs: 24 * 60 * 60 * 1000 }
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    const d = new Date(Date.now() + preset.addMs);
                    setRevealTime(d.toISOString().slice(0, 16));
                  }}
                  className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] transition"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button type="submit" className="cta" disabled={submitting}>
          {submitting ? "Creating..." : "Create tournament"}
        </button>
        {error && (
          <div className="rounded-lg border border-rose-400/40 bg-rose-900/40 px-3 py-2 text-sm text-rose-100">
            {error}
          </div>
        )}
      </form>
    </main>
  );
}

function durationToMs(duration: string) {
  switch (duration) {
    case "1m":
      return 1 * 60 * 1000;
    case "15m":
      return 15 * 60 * 1000;
    case "1h":
      return 60 * 60 * 1000;
    case "4h":
      return 4 * 60 * 60 * 1000;
    case "24h":
      return 24 * 60 * 60 * 1000;
    default:
      return 60 * 60 * 1000;
  }
}
