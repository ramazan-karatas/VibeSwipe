import { prisma } from "./prisma";
import { joinTournamentOnChain, payoutWinnersOnChain } from "./onchain";

export type TournamentStatus = "upcoming" | "active" | "finished";

export type LeaderboardRow = {
  rank: number;
  userAddress: string;
  score: number;
  rewardAmount: number;
};

export type ApiTournament = {
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

export type ApiPrediction = {
  assetSymbol: string;
  predictedDirection: string;
  createdAt: string;
};

type TournamentWithRelations = NonNullable<Awaited<ReturnType<typeof loadTournamentWithRelations>>>;

function mapTournament(t: TournamentWithRelations): ApiTournament {
  const leaderboard =
    t.status === "finished"
      ? t.scores.map((s: TournamentWithRelations["scores"][number]) => ({
          rank: s.rank,
          userAddress: s.user.walletAddress,
          score: s.score,
          rewardAmount: s.rewardAmount
        }))
      : undefined;

  return {
    name: t.name,
    id: String(t.id),
    entryFee: t.entryFee,
    duration: t.duration,
    participants: t._count.joins,
    status: t.status as TournamentStatus,
    startTime: t.startTime.toISOString(),
    endTime: t.endTime.toISOString(),
    revealTime: t.revealTime.toISOString(),
    leaderboard
  };
}

export async function listTournaments(): Promise<ApiTournament[]> {
  const data = await prisma.tournament.findMany({
    orderBy: { startTime: "desc" },
    include: {
      _count: { select: { joins: true } },
      scores: {
        orderBy: { rank: "asc" },
        include: { user: true }
      }
    }
  });
  return data.map(mapTournament);
}

async function loadTournamentWithRelations(id: number) {
  return prisma.tournament.findUnique({
    where: { id },
    include: {
      _count: { select: { joins: true } },
      scores: {
        orderBy: { rank: "asc" },
        include: { user: true }
      }
    }
  });
}

export async function getTournament(id: string): Promise<ApiTournament | null> {
  const data = await loadTournamentWithRelations(Number(id));
  if (!data) return null;
  return mapTournament(data);
}

export async function getResults(id: string) {
  const t = await prisma.tournament.findUnique({
    where: { id: Number(id) },
    include: {
      scores: { orderBy: { rank: "asc" }, include: { user: true } }
    }
  });
  if (!t) return null;
  return t.scores.map((s: TournamentWithRelations["scores"][number]) => ({
    rank: s.rank,
    userAddress: s.user.walletAddress,
    score: s.score,
    rewardAmount: s.rewardAmount
  }));
}

export async function createTournament(
  name: string,
  entryFee: string,
  duration: string,
  revealTimeIso?: string,
  creatorAddress?: string
) {
  const now = Date.now();
  const startTime = new Date(now); // start immediately for local play
  const endTime = new Date(startTime.getTime() + durationToMs(duration));

  const requestedReveal = revealTimeIso ? new Date(revealTimeIso) : null;
  const revealTime =
    requestedReveal && !Number.isNaN(requestedReveal.getTime()) && requestedReveal > endTime ? requestedReveal : endTime;

  const creator = creatorAddress ? await ensureUser(creatorAddress) : null;

  const created = await prisma.tournament.create({
    data: {
      name: name || "Tournament",
      entryFee,
      duration,
      status: "active",
      startTime,
      endTime,
      revealTime,
      creatorId: creator?.id
    },
    include: {
      _count: { select: { joins: true } },
      scores: {
        orderBy: { rank: "asc" },
        include: { user: true }
      }
    }
  });

  return mapTournament(created);
}

export async function addJoin(userAddress: string, tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({ where: { id: Number(tournamentId) } });
  if (!tournament) return null;

  const user = await ensureUser(userAddress);

  await prisma.tournamentJoin.upsert({
    where: {
      userId_tournamentId: {
        userId: user.id,
        tournamentId: tournament.id
      }
    },
    update: {},
    create: {
      userId: user.id,
      tournamentId: tournament.id
    }
  });

  const onChain = await joinTournamentOnChain(tournamentId, userAddress, tournament.entryFee);

  const participants = await prisma.tournamentJoin.count({ where: { tournamentId: tournament.id } });
  const refreshed = await loadTournamentWithRelations(tournament.id);

  return {
    joined: true,
    participants,
    tournament: refreshed ? mapTournament(refreshed) : null,
    onChain
  };
}

export async function getProfile(userAddress: string) {
  const user = await ensureUser(userAddress);
  const joins = await prisma.tournamentJoin.findMany({
    where: { userId: user.id },
    include: { tournament: true }
  });

  return {
    address: user.walletAddress,
    budget: 100.0, // placeholder budget
    joinedTournaments: joins.map((j: typeof joins[number]) => ({
      id: String(j.tournamentId),
      status: j.tournament.status
    }))
  };
}

export async function addPrediction(tournamentId: string, userAddress: string, assetSymbol: string, predictedDirection: string) {
  const tournament = await prisma.tournament.findUnique({ where: { id: Number(tournamentId) } });
  if (!tournament) return null;

  const user = await ensureUser(userAddress);

  const existing = await prisma.prediction.findUnique({
    where: {
      userId_tournamentId_assetSymbol: {
        userId: user.id,
        tournamentId: tournament.id,
        assetSymbol
      }
    }
  });

  if (existing) {
    const err = new Error("Prediction already submitted");
    (err as any).code = "ALREADY_PREDICTED";
    throw err;
  }

  const prediction = await prisma.prediction.create({
    data: {
      userId: user.id,
      tournamentId: tournament.id,
      assetSymbol,
      predictedDirection
    }
  });

  return {
    assetSymbol: prediction.assetSymbol,
    predictedDirection: prediction.predictedDirection,
    createdAt: prediction.createdAt.toISOString()
  };
}

export async function listMyPredictions(tournamentId: string, userAddress: string): Promise<ApiPrediction[] | null> {
  const tournament = await prisma.tournament.findUnique({ where: { id: Number(tournamentId) } });
  if (!tournament) return null;

  const user = await ensureUser(userAddress);

  const predictions = await prisma.prediction.findMany({
    where: { tournamentId: tournament.id, userId: user.id },
    orderBy: { createdAt: "desc" }
  });

  return predictions.map((p: typeof predictions[number]) => ({
    assetSymbol: p.assetSymbol,
    predictedDirection: p.predictedDirection,
    createdAt: p.createdAt.toISOString()
  }));
}

export async function computeScores(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: Number(tournamentId) }
  });
  if (!tournament) return null;

  const predictions = await prisma.prediction.findMany({
    where: { tournamentId: tournament.id },
    include: { user: true }
  });

  const participantCount = await prisma.tournamentJoin.count({ where: { tournamentId: tournament.id } });
  const entryFeeNumber = Number.parseFloat(tournament.entryFee);
  const prizePool = Number.isFinite(entryFeeNumber) ? entryFeeNumber * participantCount : 0;

  const actualDirections = getActualDirections();
  const totals = new Map<number, number>();

  predictions.forEach((p: typeof predictions[number]) => {
    const actual = actualDirections[p.assetSymbol] ?? "up";
    const correct = actual.toLowerCase() === p.predictedDirection.toLowerCase();
    const prev = totals.get(p.userId) ?? 0;
    totals.set(p.userId, prev + (correct ? 10 : 0));
  });

  const ranked = Array.from(totals.entries()).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return 0;
  });

  // Distribute the prize pool proportionally to rank weight (1 / rank).
  const weightSum = ranked.reduce((sum, _entry, idx) => sum + 1 / (idx + 1), 0);
  const rewards = ranked.map((_entry, idx) => {
    if (!prizePool || weightSum === 0) return 0;
    const weight = 1 / (idx + 1);
    return Number(((prizePool * weight) / weightSum).toFixed(6));
  });

  const scoreEntries = ranked.map(([userId, score], idx) => ({
    userId,
    tournamentId: tournament.id,
    score,
    rank: idx + 1,
    rewardAmount: rewards[idx] ?? 0
  }));

  await prisma.$transaction([
    prisma.score.deleteMany({ where: { tournamentId: tournament.id } }),
    ...scoreEntries.map((entry) => prisma.score.create({ data: entry }))
  ]);

  // Call on-chain payout stub if we have winners and prizes > 0
  const winners = scoreEntries.filter((s) => s.rewardAmount > 0).map((s: typeof scoreEntries[number]) => ({
    address: predictions.find((p: typeof predictions[number]) => p.userId === s.userId)?.user.walletAddress ?? "",
    amount: s.rewardAmount
  }));
  const payout = winners.length > 0 ? await payoutWinnersOnChain(tournamentId, winners) : null;

  const refreshed = await getResults(String(tournament.id));
  await prisma.tournament.update({
    where: { id: tournament.id },
    data: { status: "finished" }
  });
  return { results: refreshed, payout };
}

export async function scoreDueTournaments() {
  const now = new Date();
  const due = await prisma.tournament.findMany({
    where: {
      revealTime: { lte: now },
      NOT: { status: "finished" }
    },
    select: { id: true }
  });

  const results = [];
  for (const t of due) {
    const scored = await computeScores(String(t.id));
    results.push({ id: t.id, scored: Boolean(scored?.results?.length) });
  }
  return results;
}

async function ensureUser(userAddress: string) {
  return prisma.user.upsert({
    where: { walletAddress: userAddress },
    update: {},
    create: { walletAddress: userAddress }
  });
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

function getActualDirections() {
  // Placeholder oracle: adjust to fetch real prices later.
  return {
    BTC: "up",
    ETH: "down",
    SUI: "up",
    SOL: "down",
    BNB: "up",
    XRP: "down",
    ADA: "up",
    DOGE: "down",
    AVAX: "up",
    MATIC: "down"
  } as Record<string, string>;
}
