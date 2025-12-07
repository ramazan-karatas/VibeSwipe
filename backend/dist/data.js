"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTournaments = listTournaments;
exports.getTournament = getTournament;
exports.getResults = getResults;
exports.createTournament = createTournament;
exports.addJoin = addJoin;
exports.getProfile = getProfile;
exports.addPrediction = addPrediction;
exports.listMyPredictions = listMyPredictions;
exports.computeScores = computeScores;
exports.scoreDueTournaments = scoreDueTournaments;
const prisma_1 = require("./prisma");
const onchain_1 = require("./onchain");
function mapTournament(t) {
    const leaderboard = t.status === "finished"
        ? t.scores.map((s) => ({
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
        status: t.status,
        startTime: t.startTime.toISOString(),
        endTime: t.endTime.toISOString(),
        revealTime: t.revealTime.toISOString(),
        leaderboard
    };
}
async function listTournaments() {
    const data = await prisma_1.prisma.tournament.findMany({
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
async function loadTournamentWithRelations(id) {
    return prisma_1.prisma.tournament.findUnique({
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
async function getTournament(id) {
    const data = await loadTournamentWithRelations(Number(id));
    if (!data)
        return null;
    return mapTournament(data);
}
async function getResults(id) {
    const t = await prisma_1.prisma.tournament.findUnique({
        where: { id: Number(id) },
        include: {
            scores: { orderBy: { rank: "asc" }, include: { user: true } }
        }
    });
    if (!t)
        return null;
    return t.scores.map((s) => ({
        rank: s.rank,
        userAddress: s.user.walletAddress,
        score: s.score,
        rewardAmount: s.rewardAmount
    }));
}
async function createTournament(name, entryFee, duration, revealTimeIso, creatorAddress) {
    const now = Date.now();
    const startTime = new Date(now); // start immediately for local play
    const endTime = new Date(startTime.getTime() + durationToMs(duration));
    const requestedReveal = revealTimeIso ? new Date(revealTimeIso) : null;
    const revealTime = requestedReveal && !Number.isNaN(requestedReveal.getTime()) && requestedReveal > endTime ? requestedReveal : endTime;
    const creator = creatorAddress ? await ensureUser(creatorAddress) : null;
    const created = await prisma_1.prisma.tournament.create({
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
async function addJoin(userAddress, tournamentId) {
    const tournament = await prisma_1.prisma.tournament.findUnique({ where: { id: Number(tournamentId) } });
    if (!tournament)
        return null;
    const user = await ensureUser(userAddress);
    await prisma_1.prisma.tournamentJoin.upsert({
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
    const onChain = await (0, onchain_1.joinTournamentOnChain)(tournamentId, userAddress, tournament.entryFee);
    const participants = await prisma_1.prisma.tournamentJoin.count({ where: { tournamentId: tournament.id } });
    const refreshed = await loadTournamentWithRelations(tournament.id);
    return {
        joined: true,
        participants,
        tournament: refreshed ? mapTournament(refreshed) : null,
        onChain
    };
}
async function getProfile(userAddress) {
    const user = await ensureUser(userAddress);
    const joins = await prisma_1.prisma.tournamentJoin.findMany({
        where: { userId: user.id },
        include: { tournament: true }
    });
    return {
        address: user.walletAddress,
        budget: 100.0, // placeholder budget
        joinedTournaments: joins.map((j) => ({
            id: String(j.tournamentId),
            status: j.tournament.status
        }))
    };
}
async function addPrediction(tournamentId, userAddress, assetSymbol, predictedDirection) {
    const tournament = await prisma_1.prisma.tournament.findUnique({ where: { id: Number(tournamentId) } });
    if (!tournament)
        return null;
    const user = await ensureUser(userAddress);
    const existing = await prisma_1.prisma.prediction.findUnique({
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
        err.code = "ALREADY_PREDICTED";
        throw err;
    }
    const prediction = await prisma_1.prisma.prediction.create({
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
async function listMyPredictions(tournamentId, userAddress) {
    const tournament = await prisma_1.prisma.tournament.findUnique({ where: { id: Number(tournamentId) } });
    if (!tournament)
        return null;
    const user = await ensureUser(userAddress);
    const predictions = await prisma_1.prisma.prediction.findMany({
        where: { tournamentId: tournament.id, userId: user.id },
        orderBy: { createdAt: "desc" }
    });
    return predictions.map((p) => ({
        assetSymbol: p.assetSymbol,
        predictedDirection: p.predictedDirection,
        createdAt: p.createdAt.toISOString()
    }));
}
async function computeScores(tournamentId) {
    const tournament = await prisma_1.prisma.tournament.findUnique({
        where: { id: Number(tournamentId) }
    });
    if (!tournament)
        return null;
    const predictions = await prisma_1.prisma.prediction.findMany({
        where: { tournamentId: tournament.id },
        include: { user: true }
    });
    const participantCount = await prisma_1.prisma.tournamentJoin.count({ where: { tournamentId: tournament.id } });
    const entryFeeNumber = Number.parseFloat(tournament.entryFee);
    const prizePool = Number.isFinite(entryFeeNumber) ? entryFeeNumber * participantCount : 0;
    const actualDirections = getActualDirections();
    const totals = new Map();
    predictions.forEach((p) => {
        const actual = actualDirections[p.assetSymbol] ?? "up";
        const correct = actual.toLowerCase() === p.predictedDirection.toLowerCase();
        const prev = totals.get(p.userId) ?? 0;
        totals.set(p.userId, prev + (correct ? 10 : 0));
    });
    const ranked = Array.from(totals.entries()).sort((a, b) => {
        if (b[1] !== a[1])
            return b[1] - a[1];
        return 0;
    });
    // Distribute the prize pool proportionally to rank weight (1 / rank).
    const weightSum = ranked.reduce((sum, _entry, idx) => sum + 1 / (idx + 1), 0);
    const rewards = ranked.map((_entry, idx) => {
        if (!prizePool || weightSum === 0)
            return 0;
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
    await prisma_1.prisma.$transaction([
        prisma_1.prisma.score.deleteMany({ where: { tournamentId: tournament.id } }),
        ...scoreEntries.map((entry) => prisma_1.prisma.score.create({ data: entry }))
    ]);
    // Call on-chain payout stub if we have winners and prizes > 0
    const winners = scoreEntries.filter((s) => s.rewardAmount > 0).map((s) => ({
        address: predictions.find((p) => p.userId === s.userId)?.user.walletAddress ?? "",
        amount: s.rewardAmount
    }));
    const payout = winners.length > 0 ? await (0, onchain_1.payoutWinnersOnChain)(tournamentId, winners) : null;
    const refreshed = await getResults(String(tournament.id));
    await prisma_1.prisma.tournament.update({
        where: { id: tournament.id },
        data: { status: "finished" }
    });
    return { results: refreshed, payout };
}
async function scoreDueTournaments() {
    const now = new Date();
    const due = await prisma_1.prisma.tournament.findMany({
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
async function ensureUser(userAddress) {
    return prisma_1.prisma.user.upsert({
        where: { walletAddress: userAddress },
        update: {},
        create: { walletAddress: userAddress }
    });
}
function durationToMs(duration) {
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
    };
}
