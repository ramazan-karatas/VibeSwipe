"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchTournament, joinTournament, Tournament } from "../../../../lib/api";
import { useAuth } from "../../../auth-context";

export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { userAddress } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchTournament(id);
        setTournament(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleJoin = async () => {
    if (!userAddress) return;
    try {
      setJoining(true);
      setMessage(null);
      await joinTournament(id, userAddress);
      const updated = await fetchTournament(id);
      setTournament(updated);
      setMessage("Joined! Participant count updated.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to join");
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm text-center text-sm text-slate-600">
          Loading tournament...
        </div>
      </main>
    );
  }

  if (error || !tournament) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">
          {error || "Tournament not found"}
        </div>
      </main>
    );
  }

  const showLeaderboard = tournament.status === "finished" && tournament.leaderboard?.length;

  return (
    <main className="space-y-4">
      <header>
        <p className="text-xs uppercase tracking-wide text-slate-500">Tournament #{tournament.id}</p>
        <h1 className="text-2xl font-semibold text-slate-900">Details</h1>
        <p className="text-xs text-slate-500">Status: {tournament.status}</p>
      </header>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-2 text-sm text-slate-700">
        <div className="flex justify-between">
          <span className="text-slate-600">Entry fee</span>
          <span className="font-semibold text-slate-900">{tournament.entryFee}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Duration</span>
          <span className="font-semibold text-slate-900">{tournament.duration}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Participants</span>
          <span className="font-semibold text-slate-900">{tournament.participants}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Start</span>
          <span>{new Date(tournament.startTime).toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">End</span>
          <span>{new Date(tournament.endTime).toLocaleString()}</span>
        </div>
      </div>

      {tournament.status !== "finished" && (
        <button
          type="button"
          onClick={handleJoin}
          disabled={joining}
          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-slate-800 transition disabled:opacity-60"
        >
          {joining ? "Joining..." : "Join tournament"}
        </button>
      )}

      {message && (
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">{message}</div>
      )}

      {showLeaderboard ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Leaderboard</p>
          <div className="mt-3 space-y-2">
            {tournament.leaderboard!.map((row) => (
              <div key={row.rank} className="flex items-center justify-between text-sm text-slate-700">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700 w-10 text-center">
                    #{row.rank}
                  </span>
                  <div>
                    <p className="font-mono text-xs">{row.userAddress}</p>
                    <p className="text-xs text-slate-500">Score: {row.score}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-900">{row.rewardAmount} SUI</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </main>
  );
}
