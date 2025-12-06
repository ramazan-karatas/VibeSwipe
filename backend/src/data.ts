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

let tournamentCounter = 3;

export const tournaments: Tournament[] = [
  {
    id: "1",
    entryFee: "2 SUI",
    duration: "15m",
    participants: 12,
    status: "active",
    startTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 10 * 60 * 1000).toISOString()
  },
  {
    id: "2",
    entryFee: "1 SUI",
    duration: "1h",
    participants: 34,
    status: "upcoming",
    startTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 75 * 60 * 1000).toISOString()
  },
  {
    id: "3",
    entryFee: "5 SUI",
    duration: "24h",
    participants: 50,
    status: "finished",
    startTime: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    leaderboard: [
      { rank: 1, userAddress: "0xabc123", score: 98, rewardAmount: 50 },
      { rank: 2, userAddress: "0xdef456", score: 87, rewardAmount: 30 },
      { rank: 3, userAddress: "0x987654", score: 75, rewardAmount: 20 }
    ]
  }
];

export type TournamentJoin = {
  userAddress: string;
  tournamentId: string;
  joinedAt: string;
};

const joins: TournamentJoin[] = [];

export function createTournament(entryFee: string, duration: string): Tournament {
  const now = Date.now();
  const durationMs = durationToMs(duration);
  const nextId = (++tournamentCounter).toString();
  const tournament: Tournament = {
    id: nextId,
    entryFee,
    duration,
    participants: 0,
    status: "upcoming",
    startTime: new Date(now + 10 * 60 * 1000).toISOString(), // starts in 10 minutes
    endTime: new Date(now + 10 * 60 * 1000 + durationMs).toISOString()
  };
  tournaments.unshift(tournament);
  return tournament;
}

export function addJoin(userAddress: string, tournamentId: string) {
  const alreadyJoined = joins.some((j) => j.userAddress === userAddress && j.tournamentId === tournamentId);
  if (!alreadyJoined) {
    joins.push({ userAddress, tournamentId, joinedAt: new Date().toISOString() });
  }
}

export function getProfile(userAddress: string) {
  const joined = joins.filter((j) => j.userAddress === userAddress).map((j) => j.tournamentId);
  const joinedTournaments = tournaments
    .filter((t) => joined.includes(t.id))
    .map((t) => ({ id: t.id, status: t.status }));

  return {
    address: userAddress,
    budget: 100.0,
    joinedTournaments
  };
}

function durationToMs(duration: string) {
  switch (duration) {
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
