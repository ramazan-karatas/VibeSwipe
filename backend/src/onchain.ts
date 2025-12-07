import { config } from "./config";

// Stubbed Sui integration. Replace with actual Sui SDK calls.

export async function joinTournamentOnChain(tournamentId: string, userAddress: string, entryFee: string) {
  if (!config.movePackageId || !config.poolsObjectId) {
    return { mocked: true, digest: `mock-join-${tournamentId}-${Date.now()}` };
  }
  // TODO: call Sui SDK with sponsored tx or signer wallet:
  // - Move call: reward_pool::join(pools_object, tournament_id, coin<SUI>)
  // - Return transaction digest.
  return { mocked: true, digest: `mock-join-${tournamentId}-${Date.now()}` };
}

export async function payoutWinnersOnChain(tournamentId: string, winners: { address: string; amount: number }[]) {
  if (!config.movePackageId || !config.poolsObjectId) {
    return { mocked: true, digest: `mock-payout-${tournamentId}-${Date.now()}` };
  }
  // TODO: call Sui SDK:
  // - Move call: reward_pool::payout(pools_object, tournament_id, recipients, amounts)
  // - recipients: vector<address>, amounts: vector<u64> in MIST
  // - Return transaction digest.
  return { mocked: true, digest: `mock-payout-${tournamentId}-${Date.now()}` };
}
