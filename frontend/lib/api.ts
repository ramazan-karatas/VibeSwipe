const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";

export type TournamentStatus = "upcoming" | "active" | "finished";

export type LeaderboardRow = {
  rank: number;
  userAddress: string;
  score: number;
  rewardAmount: number;
};

export type Tournament = {
  id: string;
  entryFee: string;
  duration: string;
  participants: number;
  status: TournamentStatus;
  startTime: string;
  endTime: string;
  leaderboard?: LeaderboardRow[];
};

export type Profile = {
  address: string;
  budget: number;
  joinedTournaments: { id: string; status: TournamentStatus }[];
};

export async function createTournament(entryFee: string, duration: string): Promise<Tournament> {
  const res = await fetch(`${API_BASE}/tournaments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ entryFee, duration })
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
