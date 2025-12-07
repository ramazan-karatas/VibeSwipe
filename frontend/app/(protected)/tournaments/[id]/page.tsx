"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  fetchTournament,
  joinTournament,
  Tournament,
  fetchProfile,
  fetchMyPredictions,
  Prediction
} from "../../../../lib/api";
import { AssetPriceMap, AssetSymbol, fetchAssetPrices } from "../../../../lib/pricing";
import { useAuth } from "../../../auth-context";

export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { userAddress } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [joined, setJoined] = useState(false);
  const [myPredictions, setMyPredictions] = useState<Prediction[]>([]);
  const [prices, setPrices] = useState<AssetPriceMap | null>(null);
  const [priceUpdatedAt, setPriceUpdatedAt] = useState<string | null>(null);
  const [lastKnownPrices, setLastKnownPrices] = useState<AssetPriceMap>({});
  const supportedAssets: AssetSymbol[] = ["BTC", "ETH", "SUI", "SOL", "BNB", "XRP", "ADA", "DOGE", "AVAX", "MATIC"];
  const displayAddress = (addr?: string | null) =>
    addr && addr.length > 12 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr ?? "";

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [data, profile] = await Promise.all([
          fetchTournament(id),
          userAddress ? fetchProfile(userAddress) : Promise.resolve(null)
        ]);
        setTournament(data);
        if (profile && profile.joinedTournaments.some((t) => t.id === id)) {
          setJoined(true);
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    load();
    const poll = setInterval(() => {
      fetchTournament(id)
        .then((data) => setTournament(data))
        .catch(() => undefined);
    }, 5_000);
    return () => clearInterval(poll);
  }, [id, userAddress]);

  useEffect(() => {
    const loadPreds = async () => {
      if (!userAddress) return;
      try {
        const preds = await fetchMyPredictions(id, userAddress);
        setMyPredictions(preds);
      } catch {
        // silent fail
      }
    };
    loadPreds();
  }, [id, userAddress]);

  useEffect(() => {
    if (!tournament) return;
    const update = () => {
      if (tournament.status === "finished") {
        setTimeLeft("Finished");
        return;
      }
      const delta = new Date(tournament.endTime).getTime() - Date.now();
      if (delta <= 0) {
        setTimeLeft("Ended");
      } else {
        const mins = Math.floor(delta / 60000);
        const secs = Math.floor((delta % 60000) / 1000);
        setTimeLeft(`${mins}m ${secs}s`);
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [tournament]);

  useEffect(() => {
    const loadPrices = async () => {
      try {
        const latest = await fetchAssetPrices();
        setPrices(latest);
        if (Object.keys(latest).length > 0) {
          setLastKnownPrices(latest);
        }
        const first = Object.values(latest).find((p) => p?.lastUpdated);
        if (first?.lastUpdated) setPriceUpdatedAt(first.lastUpdated);
      } catch {
        // silent; keep last known prices
      }
    };
    loadPrices();
    const interval = setInterval(loadPrices, 30_000);
    return () => clearInterval(interval);
  }, []);

  const handleJoin = async () => {
    if (!userAddress) return;
    try {
      setJoining(true);
      setMessage(null);
      await joinTournament(id, userAddress);
      const updated = await fetchTournament(id);
      setTournament(updated);
      setJoined(true);
      setMessage("Joined! Participant count updated.");
      const preds = await fetchMyPredictions(id, userAddress);
      setMyPredictions(preds);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to join");
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="panel p-6 text-center text-sm text-[var(--muted)]">Loading tournament...</div>
      </main>
    );
  }

  if (error || !tournament) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="panel p-6 border border-rose-300/30 bg-rose-900/40 text-center text-sm text-rose-100">
          {error || "Tournament not found"}
        </div>
      </main>
    );
  }

  const showLeaderboard = tournament.status === "finished" && tournament.leaderboard?.length;

  return (
    <main className="space-y-4">
      <header className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">Tournament #{tournament.id}</p>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[var(--text)]">{tournament.name || "Details"}</h1>
          <span className="rounded-full border border-[var(--border-strong)] bg-[var(--bg-card)] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]">
            {tournament.status}
          </span>
        </div>
        <p className="text-sm text-[var(--muted)]">Time left: {timeLeft || "-"}</p>
        {joined ? (
          <div className="space-y-1 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-card)] px-3 py-2 text-xs text-[var(--text)]">
            <div className="flex items-center justify-between">
              <span>{myPredictions.length > 0 ? "Predictions saved" : "Joined"}</span>
              <span className="font-semibold">{myPredictions.length} picks</span>
            </div>
            {myPredictions.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {myPredictions.map((p) => (
                  <span
                    key={p.assetSymbol}
                    className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                      p.predictedDirection.toLowerCase() === "up"
                        ? "bg-emerald-900/40 text-emerald-100 border border-emerald-300/40"
                        : "bg-rose-900/40 text-rose-100 border border-rose-300/40"
                    }`}
                  >
                    {p.predictedDirection.toUpperCase()} picked for {p.assetSymbol}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </header>

      <div className="panel-strong p-4 space-y-2 text-sm text-[var(--text)]">
        <div className="flex justify-between">
          <span className="text-[var(--muted)]">Entry fee</span>
          <span className="font-semibold text-[var(--text)]">{tournament.entryFee}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--muted)]">Duration</span>
          <span className="font-semibold text-[var(--text)]">{tournament.duration}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--muted)]">Participants</span>
          <span className="font-semibold text-[var(--text)]">{tournament.participants}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--muted)]">Start</span>
          <span className="text-[var(--text)]">{new Date(tournament.startTime).toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--muted)]">End</span>
          <span className="text-[var(--text)]">{new Date(tournament.endTime).toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--muted)]">Results reveal</span>
          <span className="text-[var(--text)]">{new Date(tournament.revealTime).toLocaleString()}</span>
        </div>
      </div>

      <div className="panel p-4">
        <p className="text-sm font-semibold text-[var(--text)]">Live asset prices</p>
        <p className="text-[10px] text-[var(--muted)]">Refreshed every 30 seconds.</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {supportedAssets.map((asset) => {
            const price = prices?.[asset] ?? lastKnownPrices[asset];
            return (
              <div
                key={asset}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-xs text-[var(--text)]"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-semibold">
                    <Image src={`/assets/${asset.toLowerCase()}.svg`} alt={asset} width={18} height={18} />
                    {asset}
                  </span>
                  <span className="text-[var(--muted)]">USD</span>
                </div>
                <div className="text-base font-semibold">
                  {typeof price?.usd === "number"
                    ? `$${price.usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                    : "Loading..."}
                </div>
                <div className="text-[10px] text-[var(--muted)]">
                  {priceUpdatedAt ? `Updated ${new Date(priceUpdatedAt).toLocaleTimeString()}` : "Fetching..."}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {tournament.status !== "finished" && (
        <div className="space-y-2">
          <button type="button" onClick={handleJoin} disabled={joining || joined} className="cta disabled:opacity-60">
            {joined ? "Joined" : joining ? "Joining..." : "Join tournament"}
          </button>
          {tournament.status === "active" && joined && (
            <Link
              href={`/tournaments/${tournament.id}/play`}
              className="block w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 text-center text-sm font-semibold text-[var(--text)] hover:border-[var(--accent)] transition"
            >
              {myPredictions.length > 0 ? "View predictions" : "Go to predictions"}
            </Link>
          )}
        </div>
      )}

      {message && (
        <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-card)] p-3 text-sm text-[var(--text)]">
          {message}
        </div>
      )}

      {showLeaderboard ? (
        <div className="panel p-4">
          <p className="text-sm font-semibold text-[var(--text)]">Leaderboard</p>
          <div className="mt-3 space-y-2">
            {tournament.leaderboard!.map((row) => (
              <div key={row.rank} className="flex items-center justify-between text-sm text-[var(--text)]">
                <div className="flex items-center gap-3">
                  <span className="rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-2 py-1 text-xs w-10 text-center text-[var(--muted)]">
                    #{row.rank}
                  </span>
                  <div>
                    <p className="font-mono text-xs" title={row.userAddress}>
                      {displayAddress(row.userAddress)}
                    </p>
                    <p className="text-xs text-[var(--muted)]">Score: {row.score}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-[var(--accent)]">{row.rewardAmount} SUI</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </main>
  );
}
