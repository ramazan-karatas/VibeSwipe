"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchMyPredictions, Prediction, submitPrediction, fetchTournament, Tournament } from "../../../../../lib/api";
import { useAuth } from "../../../../auth-context";
import { SwipeDeck, SwipeCard } from "../../../../../components/swipe-deck";
import { AssetPriceMap, AssetSymbol, fetchAssetPrices } from "../../../../../lib/pricing";

const assets: AssetSymbol[] = ["BTC", "ETH", "SUI", "SOL", "BNB", "XRP", "ADA", "DOGE", "AVAX", "MATIC"];

export default function PlayPage() {
  const { id } = useParams<{ id: string }>();
  const { userAddress } = useAuth();
  const router = useRouter();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [progress, setProgress] = useState<number>(100);
  const [toast, setToast] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [swiping, setSwiping] = useState<Record<string, "up" | "down" | null>>({});
  const [dragX, setDragX] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [allDone, setAllDone] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [prices, setPrices] = useState<AssetPriceMap | null>(null);
  const [priceUpdatedAt, setPriceUpdatedAt] = useState<string | null>(null);
  const [lastKnownPrices, setLastKnownPrices] = useState<AssetPriceMap>({});
  const [startPrices, setStartPrices] = useState<AssetPriceMap>({});
  const [endPrices, setEndPrices] = useState<AssetPriceMap | null>(null);
  const [score, setScore] = useState<{ correct: number; total: number } | null>(null);
  const [outcomes, setOutcomes] = useState<
    { asset: AssetSymbol; predicted: "up" | "down"; actual: "up" | "down" | "flat" | "unknown"; correct: boolean; startPrice?: number; endPrice?: number }[]
  >([]);

  useEffect(() => {
    const load = async () => {
      if (!userAddress) return;
      try {
        setLoading(true);
        const [preds, t] = await Promise.all([fetchMyPredictions(id, userAddress), fetchTournament(id)]);
        setPredictions(preds);
        setTournament(t);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load predictions");
      } finally {
        setLoading(false);
      }
    };
    load();

    const poll = setInterval(() => {
      fetchTournament(id)
        .then((t) => setTournament(t))
        .catch(() => undefined);
    }, 5_000);

    return () => clearInterval(poll);
  }, [id, userAddress]);

  useEffect(() => {
    if (!tournament) return;
    const update = () => {
      if (tournament.status === "finished") {
        setTimeLeft("Finished");
        return;
      }
      const now = Date.now();
      const end = new Date(tournament.endTime).getTime();
      const start = new Date(tournament.startTime).getTime();
      const delta = end - now;
      if (delta <= 0) {
        setTimeLeft("Ended");
        setProgress(0);
      } else {
        const mins = Math.floor(delta / 60000);
        const secs = Math.floor((delta % 60000) / 1000);
        setTimeLeft(`${mins}m ${secs}s`);
        const total = end - start;
        const pct = total > 0 ? Math.max(0, Math.min(100, (delta / total) * 100)) : 0;
        setProgress(pct);
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
        if (first?.lastUpdated) {
          setPriceUpdatedAt(first.lastUpdated);
        }
        if (tournament?.status === "finished") {
          setEndPrices(latest);
        }
      } catch (err) {
        // silent error; retain last known prices
      }
    };
    loadPrices();
    const interval = setInterval(loadPrices, 10_000);
    return () => clearInterval(interval);
  }, [startPrices, tournament?.status]);

  const handlePick = async (asset: string, direction: "up" | "down") => {
    if (!userAddress) return;
    if (tournament?.status === "finished") return;
    const alreadyPicked = predictions.some((p) => p.assetSymbol.toUpperCase() === asset.toUpperCase());
    if (alreadyPicked) {
      setToast({ kind: "error", message: "Prediction already submitted for this asset" });
      return;
    }
    try {
      setSubmitting(`${asset}-${direction}`);
      const latest = await fetchAssetPrices();
      if (latest && Object.keys(latest).length > 0) {
        setPrices(latest);
        setLastKnownPrices(latest);
        const first = Object.values(latest).find((p) => p?.lastUpdated);
        if (first?.lastUpdated) {
          setPriceUpdatedAt(first.lastUpdated);
        }
      }
      const priceAtPick =
        latest[asset as AssetSymbol] ??
        prices?.[asset as AssetSymbol] ??
        lastKnownPrices[asset as AssetSymbol];
      if (priceAtPick) {
        setStartPrices((prev) => ({ ...(prev || {}), [asset]: priceAtPick }));
      }
      setSwiping((prev) => ({ ...prev, [asset]: direction }));
      setSuccess(null);
      const result = await submitPrediction(id, userAddress, asset, direction);
      setPredictions((prev) => {
        const filtered = prev.filter((p) => p.assetSymbol !== asset);
        return [result, ...filtered];
      });
      setSuccess(`Saved ${asset} ${direction.toUpperCase()}`);
      setToast({ kind: "success", message: `Saved ${asset} ${direction.toUpperCase()}` });
      setCurrentIndex((idx) => {
        const next = idx + 1;
        if (next >= assets.length) {
          setAllDone(true);
          return assets.length;
        }
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit prediction");
      setToast({ kind: "error", message: err instanceof Error ? err.message : "Failed to submit prediction" });
    } finally {
      setSubmitting(null);
      setTimeout(() => {
        setSwiping((prev) => ({ ...prev, [asset]: null }));
      }, 300);
    }
  };

  useEffect(() => {
    const predictedAssets = predictions.map((p) => p.assetSymbol.toUpperCase());
    if (predictedAssets.length >= assets.length) {
      setAllDone(true);
    }
  }, [predictions]);

  useEffect(() => {
    if (tournament?.status !== "finished") return;
    const fetchEnd = async () => {
      const latest = await fetchAssetPrices();
      setEndPrices(latest);
    };
    fetchEnd();
  }, [tournament?.status]);

  useEffect(() => {
    if (!endPrices || predictions.length === 0 || Object.keys(startPrices).length === 0) return;
    const nextOutcomes: {
      asset: AssetSymbol;
      predicted: "up" | "down";
      actual: "up" | "down" | "flat" | "unknown";
      correct: boolean;
      startPrice?: number;
      endPrice?: number;
    }[] = [];
    let total = 0;
    let correct = 0;
    predictions.forEach((p) => {
      const asset = p.assetSymbol.toUpperCase() as AssetSymbol;
      const start = startPrices[asset];
      const end = endPrices[asset];
      if (!start || !end) {
        nextOutcomes.push({
          asset,
          predicted: p.predictedDirection.toLowerCase() as "up" | "down",
          actual: "unknown",
          correct: false
        });
        return;
      }
      const delta = end.usd - start.usd;
      const actual: "up" | "down" | "flat" = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
      const predicted = p.predictedDirection.toLowerCase() as "up" | "down";
      const isCorrect = actual === predicted;
      total += 1;
      if (isCorrect) correct += 1;
      nextOutcomes.push({
        asset,
        predicted,
        actual,
        correct: isCorrect,
        startPrice: start.usd,
        endPrice: end.usd
      });
    });
    setOutcomes(nextOutcomes);
    setScore({ correct, total });
  }, [startPrices, endPrices, predictions]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <main className="space-y-4">
      <header className="space-y-3">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">
          Tournament #{id} {tournament?.name ? `→ ${tournament.name}` : ""}
        </p>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[var(--text)]">Predictions</h1>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold transition border ${
              tournament?.status === "finished"
                ? "border-emerald-300/50 bg-emerald-900/30 text-emerald-100"
                : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]"
            }`}
          >
            {tournament?.status ?? "loading"}
          </span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span className="rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-2 py-1 font-semibold text-[var(--text)]">
              Time left: {timeLeft || "-"}
            </span>
            {tournament?.status === "finished" ? (
              <span className="rounded-full border border-emerald-300/50 bg-emerald-900/30 px-2 py-1 font-semibold text-emerald-100">
                Finished
              </span>
            ) : null}
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-card)] border border-[var(--border)]">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-500"
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
          </div>
        </div>
        <p className="text-xs text-[var(--muted)]">Swipe right for Up, left for Down.</p>

      </header>

      {loading && <div className="panel p-4 text-sm text-[var(--muted)]">Loading your picks...</div>}

      {error && (
        <div className="panel p-3 border border-rose-400/50 bg-rose-900/40 text-sm text-rose-100">{error}</div>
      )}

      {success && (
        <div className="panel p-3 border border-emerald-400/50 bg-emerald-900/30 text-sm text-emerald-100">{success}</div>
      )}

      {tournament?.status === "finished" && score ? (
        <div className="panel-strong p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[var(--text)]">Results</p>
            <span className="rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1 text-xs font-semibold text-[var(--text)]">
              Score: {score.correct}/{score.total || predictions.length}
            </span>
          </div>
          <div className="text-[10px] text-[var(--muted)]">
            Shows the price when you picked versus the price when the tournament ended.
          </div>
          <div className="space-y-2">
            {outcomes.map((o) => (
              <div
                key={o.asset}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${
                  o.correct
                    ? "border-emerald-300/40 bg-emerald-900/30 text-emerald-50"
                    : "border-rose-300/40 bg-rose-900/30 text-rose-50"
                }`}
              >
                <div className="space-y-1">
                  <p className="font-semibold">{o.asset}</p>
                  <p className="text-[var(--muted)]">
                    Pick price: {o.startPrice ? `$${o.startPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "?"} · End
                    price: {o.endPrice ? `$${o.endPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "?"}
                  </p>
                </div>
                <div className="text-right">
                  <p>Predicted: {o.predicted.toUpperCase()}</p>
                  <p>Actual: {o.actual.toUpperCase()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="relative h-80">
        {allDone ? (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 text-center text-sm text-[var(--text)] shadow-lg">
            <div>
              <p className="text-base font-semibold text-[var(--text)]">All picks submitted</p>
              <p className="mt-1 text-xs text-[var(--muted)]">Return to tournament to view results once it finishes.</p>
            </div>
          </div>
        ) : (
          <SwipeDeck
            cards={assets
              .filter((asset) => !predictions.some((p) => p.assetSymbol.toUpperCase() === asset.toUpperCase()))
              .map(
                (asset): SwipeCard => ({
                  id: asset,
                  title: asset,
                  iconSrc: `/assets/${asset.toLowerCase()}.svg`,
                  subtitle: (() => {
                    const price = prices?.[asset];
                    return price
                      ? `Current price: $${price.usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                      : "Fetching price...";
                  })()
                })
              )}
            initialIndex={currentIndex}
            disabled={submitting !== null || tournament?.status === "finished"}
            onPick={async (card, dir) => {
              setDragX(dir === "up" ? 150 : -150);
              await handlePick(card.id, dir);
            }}
          />
        )}
      </div>

      {predictions.length > 0 && (
        <div className="panel p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[var(--text)]">Your predictions</p>
            <span className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">{predictions.length} / {assets.length}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {predictions.map((p) => (
              <div
                key={p.assetSymbol}
                className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)]"
              >
                <div className="flex items-center gap-2">
                  <img
                    src={`/assets/${p.assetSymbol.toLowerCase()}.svg`}
                    alt={p.assetSymbol}
                    className="h-5 w-5"
                    loading="lazy"
                  />
                  <div>
                    <p className="font-semibold">{p.assetSymbol}</p>
                    <p className="text-[11px] text-[var(--muted)]">
                      {new Date(p.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                    p.predictedDirection.toLowerCase() === "up"
                      ? "border border-emerald-300/40 bg-emerald-900/30 text-emerald-100"
                      : "border border-amber-300/40 bg-amber-900/30 text-amber-100"
                  }`}
                >
                  {p.predictedDirection}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button type="button" onClick={() => router.push(`/tournaments/${id}`)} className="cta-ghost">
        Back to tournament
      </button>

      {toast ? (
        <div
          className={`fixed bottom-6 left-1/2 z-20 -translate-x-1/2 transform rounded-xl px-4 py-3 text-sm shadow-lg ${
            toast.kind === "success"
              ? "bg-emerald-900/40 text-emerald-100 border border-emerald-300/50"
              : "bg-rose-900/40 text-rose-100 border border-rose-400/50"
          }`}
        >
          {toast.message}
        </div>
      ) : null}
    </main>
  );
}
