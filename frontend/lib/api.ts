const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";

export type TournamentStatus = "upcoming" | "active" | "finished";

export type LeaderboardRow = {
  rank: number;
  userAddress: string;
  score: number;
  rewardAmount: number;
};

export type Tournament = {
  name: string;
  id: string;
  entryFee: string;
  duration: string;
  participants: number;
  status: TournamentStatus;
  startTime: string;
  endTime: string;
  revealTime: string;
  leaderboard?: LeaderboardRow[];
};

export type Profile = {
  address: string;
  budget: number;
  joinedTournaments: { id: string; status: TournamentStatus }[];
};

export type Prediction = {
  assetSymbol: string;
  predictedDirection: string;
  createdAt: string;
};

export async function createTournament(name: string, entryFee: string, duration: string, revealTime?: string): Promise<Tournament> {
  const normalizedName = name.trim() || "Tournament";
  const feeValue = Number(entryFee);
  if (!Number.isFinite(feeValue) || feeValue <= 0) {
    throw new Error("Entry fee must be a positive number");
  }
  const allowedDurations = new Set(["1m", "15m", "1h", "4h", "24h"]);
  if (!allowedDurations.has(duration)) {
    throw new Error("Duration is invalid");
  }

  const res = await fetch(`${API_BASE}/tournaments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name: normalizedName, entryFee: String(feeValue), duration, revealTime })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to create tournament");
  }
  const json = await res.json();
  return json.data as Tournament;
}

export async function fetchTournaments(): Promise<Tournament[]> {
  const res = await fetch(`${API_BASE}/tournaments`);
  if (!res.ok) {
    throw new Error("Failed to load tournaments");
  }
  const json = await res.json();
  return json.data as Tournament[];
}

export async function fetchTournament(id: string): Promise<Tournament> {
  const res = await fetch(`${API_BASE}/tournaments/${id}`);
  if (!res.ok) {
    throw new Error("Tournament not found");
  }
  const json = await res.json();
  return json.data as Tournament;
}

export async function joinTournament(id: string, userAddress: string) {
  const res = await fetch(`${API_BASE}/tournaments/${id}/join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ userAddress })
  });
  if (!res.ok) {
    throw new Error("Failed to join tournament");
  }
  return res.json();
}

export async function fetchProfile(userAddress: string): Promise<Profile> {
  const params = new URLSearchParams({ userAddress });
  const res = await fetch(`${API_BASE}/profile?${params.toString()}`);
  if (!res.ok) {
    throw new Error("Failed to load profile");
  }
  const json = await res.json();
  return json.data as Profile;
}

export async function submitPrediction(
  tournamentId: string,
  userAddress: string,
  assetSymbol: string,
  predictedDirection: string
): Promise<Prediction> {
  const res = await fetch(`${API_BASE}/tournaments/${tournamentId}/predictions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userAddress, assetSymbol, predictedDirection })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to submit prediction");
  }
  const json = await res.json();
  return json.data as Prediction;
}

export async function fetchMyPredictions(tournamentId: string, userAddress: string): Promise<Prediction[]> {
  const params = new URLSearchParams({ userAddress });
  const res = await fetch(`${API_BASE}/tournaments/${tournamentId}/predictions/me?${params.toString()}`);
  if (!res.ok) {
    throw new Error("Failed to load predictions");
  }
  const json = await res.json();
  return json.data as Prediction[];
}
