import { Router } from "express";
import { tournaments, createTournament, addJoin, getProfile } from "../data";

const router = Router();

router.get("/tournaments", (_req, res) => {
  res.json({ data: tournaments });
});

router.get("/tournaments/:id", (req, res) => {
  const tournament = tournaments.find((t) => t.id === req.params.id);
  if (!tournament) {
    return res.status(404).json({ error: "Tournament not found" });
  }
  res.json({ data: tournament });
});

router.post("/tournaments/:id/join", (req, res) => {
  const tournament = tournaments.find((t) => t.id === req.params.id);
  if (!tournament) {
    return res.status(404).json({ error: "Tournament not found" });
  }
  const { userAddress } = req.body ?? {};
  if (!userAddress) {
    return res.status(400).json({ error: "userAddress is required" });
  }
  addJoin(String(userAddress), tournament.id);
  // Increment participant count as a stub for join logic.
  tournament.participants += 1;
  res.json({ data: { joined: true, participants: tournament.participants } });
});

router.post("/tournaments", (_req, res) => {
  const { entryFee, duration } = _req.body ?? {};
  if (!entryFee || !duration) {
    return res.status(400).json({ error: "entryFee and duration are required" });
  }
  const tournament = createTournament(String(entryFee), String(duration));
  res.status(201).json({ data: tournament });
});

router.get("/profile", (req, res) => {
  const address = (req.query.userAddress as string) || (req.query.address as string);
  if (!address) {
    return res.status(400).json({ error: "userAddress is required" });
  }
  const profile = getProfile(address);
  res.json({ data: profile });
});

export default router;
