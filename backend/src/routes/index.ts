import { Router } from "express";
import {
  addJoin,
  addPrediction,
  computeScores,
  createTournament,
  getProfile,
  getResults,
  getTournament,
  listMyPredictions,
  listTournaments
} from "../data";

const durationMsMap: Record<string, number> = {
  "1m": 1 * 60 * 1000,
  "15m": 15 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "4h": 4 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000
};

const router = Router();

router.get("/tournaments", async (_req, res) => {
  const data = await listTournaments();
  res.json({ data });
});

router.get("/tournaments/:id", async (req, res) => {
  if (Number.isNaN(Number(req.params.id))) {
    return res.status(400).json({ error: "Invalid tournament id" });
  }
  const tournament = await getTournament(req.params.id);
  if (!tournament) {
    return res.status(404).json({ error: "Tournament not found" });
  }
  res.json({ data: tournament });
});

router.post("/tournaments/:id/join", async (req, res) => {
  if (Number.isNaN(Number(req.params.id))) {
    return res.status(400).json({ error: "Invalid tournament id" });
  }
  const { userAddress } = req.body ?? {};
  if (!userAddress) {
    return res.status(400).json({ error: "userAddress is required" });
  }

  const result = await addJoin(String(userAddress), req.params.id);
  if (!result) {
    return res.status(404).json({ error: "Tournament not found" });
  }

  res.json({
    data: {
      joined: true,
      participants: result.participants,
      tournament: result.tournament,
      onChain: result.onChain
    }
  });
});

router.post("/tournaments/:id/predictions", async (req, res) => {
  if (Number.isNaN(Number(req.params.id))) {
    return res.status(400).json({ error: "Invalid tournament id" });
  }
  const { userAddress, assetSymbol, predictedDirection } = req.body ?? {};
  if (!userAddress || !assetSymbol || !predictedDirection) {
    return res
      .status(400)
      .json({ error: "userAddress, assetSymbol and predictedDirection are required" });
  }

  try {
    const result = await addPrediction(String(req.params.id), String(userAddress), String(assetSymbol), String(predictedDirection));
    if (!result) {
      return res.status(404).json({ error: "Tournament not found" });
    }
    res.json({ data: result });
  } catch (err: any) {
    if (err?.code === "ALREADY_PREDICTED") {
      return res.status(409).json({ error: "Prediction already submitted for this asset" });
    }
    console.error("Failed to add prediction", err);
    return res.status(500).json({ error: "Failed to submit prediction" });
  }
});

router.get("/tournaments/:id/predictions/me", async (req, res) => {
  if (Number.isNaN(Number(req.params.id))) {
    return res.status(400).json({ error: "Invalid tournament id" });
  }
  const address = (req.query.userAddress as string) || (req.query.address as string);
  if (!address) {
    return res.status(400).json({ error: "userAddress is required" });
  }

  const predictions = await listMyPredictions(req.params.id, address);
  if (!predictions) {
    return res.status(404).json({ error: "Tournament not found" });
  }

  res.json({ data: predictions });
});

router.get("/tournaments/:id/results", async (req, res) => {
  if (Number.isNaN(Number(req.params.id))) {
    return res.status(400).json({ error: "Invalid tournament id" });
  }
  const results = await getResults(req.params.id);
  if (!results) {
    return res.status(404).json({ error: "Tournament not found" });
  }
  res.json({ data: results });
});

router.post("/tournaments/:id/score", async (req, res) => {
  if (Number.isNaN(Number(req.params.id))) {
    return res.status(400).json({ error: "Invalid tournament id" });
  }
  const results = await computeScores(req.params.id);
  if (!results) {
    return res.status(404).json({ error: "Tournament not found" });
  }
  res.json({ data: results });
});

router.post("/tournaments", async (_req, res) => {
  const { name, entryFee, duration, creatorAddress, revealTime } = _req.body ?? {};

  const normalizedName = typeof name === "string" && name.trim().length > 0 ? name.trim() : "Tournament";

  const feeValue = Number(entryFee);
  if (!Number.isFinite(feeValue) || feeValue <= 0) {
    return res.status(400).json({ error: "entryFee must be a positive number" });
  }

  const durationValue = String(duration);
  const allowedDurations = new Set(["1m", "15m", "1h", "4h", "24h"]);
  if (!allowedDurations.has(durationValue)) {
    return res.status(400).json({ error: "duration must be one of 1m, 15m, 1h, 4h, 24h" });
  }

  let revealTimeIso: string | undefined;
  if (revealTime) {
    const parsed = new Date(revealTime);
    if (Number.isNaN(parsed.getTime())) {
      return res.status(400).json({ error: "revealTime must be a valid date" });
    }
    const minReveal = Date.now() + (durationMsMap[durationValue] ?? 0);
    if (parsed.getTime() < minReveal) {
      return res.status(400).json({ error: "revealTime must be after the prediction window" });
    }
    revealTimeIso = parsed.toISOString();
  }

  const tournament = await createTournament(
    normalizedName,
    String(feeValue),
    durationValue,
    revealTimeIso,
    creatorAddress ? String(creatorAddress) : undefined
  );
  res.status(201).json({ data: tournament });
});

router.get("/profile", async (req, res) => {
  const address = (req.query.userAddress as string) || (req.query.address as string);
  if (!address) {
    return res.status(400).json({ error: "userAddress is required" });
  }
  const profile = await getProfile(address);
  res.json({ data: profile });
});

export default router;
