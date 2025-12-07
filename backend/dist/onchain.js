"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinTournamentOnChain = joinTournamentOnChain;
exports.payoutWinnersOnChain = payoutWinnersOnChain;
const config_1 = require("./config");
// Stubbed Sui integration. Replace with actual Sui SDK calls.
async function joinTournamentOnChain(tournamentId, userAddress, entryFee) {
    if (!config_1.config.movePackageId || !config_1.config.poolsObjectId) {
        return { mocked: true, digest: `mock-join-${tournamentId}-${Date.now()}` };
    }
    // TODO: call Sui SDK with sponsored tx or signer wallet:
    // - Move call: reward_pool::join(pools_object, tournament_id, coin<SUI>)
    // - Return transaction digest.
    return { mocked: true, digest: `mock-join-${tournamentId}-${Date.now()}` };
}
async function payoutWinnersOnChain(tournamentId, winners) {
    if (!config_1.config.movePackageId || !config_1.config.poolsObjectId) {
        return { mocked: true, digest: `mock-payout-${tournamentId}-${Date.now()}` };
    }
    // TODO: call Sui SDK:
    // - Move call: reward_pool::payout(pools_object, tournament_id, recipients, amounts)
    // - recipients: vector<address>, amounts: vector<u64> in MIST
    // - Return transaction digest.
    return { mocked: true, digest: `mock-payout-${tournamentId}-${Date.now()}` };
}
